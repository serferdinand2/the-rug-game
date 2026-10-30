// What the client knows (#25 design §7.2): the table choices, who the tab is, the open tables and the table it sits at, kept up to date by the long poll.
import { withSession } from './api.js';
import { boot } from './boot.js';
import { change } from './changes.js';
import { validCode } from './lobby.js';
import { sendMove, viewerSeat } from './moves.js';
import { generateName } from './names.js';
import { backoff, pollTable } from './poll.js';
import { eventText } from './log.js';
import { acceptStep, handedEvents } from './pass.js';
import { forgetfulStorage } from './storage.js';

/** How often the landing page asks for the open tables again. */
const TABLES_EVERY_MS = 10_000;
/** How long a toast stays. */
const TOAST_MS = 2_400;
const SOUND = 'rg-sound';

/**
 * What the store needs from the browser, so the same code runs in tests.
 * @typedef {Object} StoreDeps
 * @property {import('./api.js').Api} api
 * @property {(n: number) => number} random - A whole number from 0 to n − 1, for generated names
 * @property {import('./api.js').SessionStore} prefs - Where the sound choice is remembered (localStorage)
 * @property {import('./api.js').SessionStore} [session] - What this browser tab remembers until it closes, such as a
 *   closed first-income notice (sessionStorage); without one, nothing is remembered past the page (#88)
 * @property {(text: string) => Promise<void>} copy - Puts text on the clipboard
 * @property {(ms: number) => Promise<void>} [wait]
 */

/** The client's state as runes, and the actions the screens call. */
class Store {
	/** @type {'loading' | 'landing' | 'table'} */
	screen = $state('loading');
	/** @type {any} GET /api/config, or null until it arrives */
	config = $state(null);
	/** @type {{ name: string, code: string | null, saved: string | null } | null} */
	me = $state(null);
	/** @type {{ code: string, host: string, seats: number, version: string, expansions: string[] }[]} */
	tables = $state([]);
	/** @type {'loading' | 'ready' | 'failed'} */
	tablesState = $state('loading');
	/** @type {any} The room view of the table the tab sits at, or null */
	room = $state(null);
	/** The landing page's status line: a refusal or why the player is back. */
	status = $state('');
	/** The lobby's connection warning while the poll is failing. */
	connection = $state('');
	toast = $state('');
	toastVisible = $state(false);
	/** Counts refused changes, so the settings redraw what the server kept. */
	refusals = $state(0);
	/** The browser's time when the room on show arrived, for the turn clock (#26). */
	receivedAt = $state(0);
	sound = $state(false);
	busy = $state(false);
	/** @type {any[]} The events that arrived with the latest room view, for sound, motion and the log's dot; none after a refresh (#29) */
	fresh = $state.raw([]);
	/** Counts the batches of fresh events, so a screen reacts to each once. */
	freshCount = $state(0);
	/** @type {number | null} At a hot-seat table, the player the pass screen names until they take the screen (#30) */
	passing = $state(null);
	/** @type {any[]} At a hot-seat table, the events a player is handed when they take the screen: what happened since they last held it (#153) */
	handed = $state.raw([]);
	/** Counts the hand-overs that brought events, so the screen shows each once. */
	handedCount = $state(0);

	#api;
	#random;
	#prefs;
	#session;
	#copy;
	#wait;
	/** Bumped whenever the tab leaves a screen, so the loops of the old one stop. */
	#generation = 0;
	/** @type {number | null} The seat on show, or being taken, at a hot-seat table, which the poll asks for; null for the public view (#26, #30). */
	#shownSeat = $state(null);
	/** @type {ReturnType<typeof setTimeout> | undefined} */
	#toastTimer;
	/** @type {Map<number, number>} At a hot-seat table, the last event each seat saw on its own view (#153) */
	#seen = new Map();
	/** @type {number | null} The last event when a player last took the screen, or when the table opened; a seat new to the screen is handed what came after it */
	#takenSeq = null;

	/** @param {StoreDeps} deps */
	constructor({ api, random, prefs, session, copy, wait }) {
		this.#api = api;
		this.#random = random;
		this.#prefs = prefs;
		this.#session = session ?? forgetfulStorage();
		this.#copy = copy;
		this.#wait =
			wait ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
		this.sound = prefs.getItem(SOUND) === 'on';
	}

	/** The name last signed in with, to fill the name field. */
	get storedName() {
		return this.me?.name ?? this.#api.name() ?? '';
	}

	/** Boots: the tab's table, or the landing page; retries while the server can't be reached. */
	async start() {
		for (let failures = 1; ; failures++) {
			try {
				const { config, me, room } = await boot(this.#api);
				this.config = config;
				this.me = me;
				this.status = '';
				if (room) {
					this.#openTable(room);
				} else {
					this.#showLanding();
				}
				return;
			} catch {
				this.screen = 'landing';
				this.tablesState = 'failed';
				this.status = "Can't reach the server. Retrying…";
				await this.#wait(backoff(failures));
			}
		}
	}

	/** @param {string} name */
	async createTable(name) {
		await this.#busy(async () => {
			this.#openTable(
				await this.#withSession(name, () =>
					this.#api.request('create', { options: {} })
				)
			);
		});
	}

	/**
	 * @param {string} name
	 * @param {string} code
	 */
	async joinTable(name, code) {
		if (!validCode(code)) {
			this.status = 'Enter an 8-character table code.';
			return;
		}
		await this.#busy(async () => {
			this.#openTable(
				await this.#withSession(name, () =>
					this.#api.request('join', { code: code.trim() })
				)
			);
		});
	}

	/** Back to the running game the person left. */
	async returnToGame() {
		const code = this.me?.saved;
		if (!code) {
			return;
		}
		await this.#busy(async () => {
			this.#openTable(
				await this.#withSession('', () =>
					this.#api.request('join', { code })
				)
			);
		});
	}

	async leaveTable() {
		// Stops the poll first: the server answers it with "not at this table" as the player leaves.
		this.#generation += 1;
		try {
			await this.#api.request('leave', {});
		} catch {
			// Gone already: the landing page is right either way.
		}
		// The server knows whether the game left behind still holds a seat (online, not hot-seat).
		try {
			this.me = await this.#api.request('me');
		} catch {
			this.me = this.me && { ...this.me, code: null };
		}
		this.status = '';
		this.#showLanding();
	}

	/**
	 * @param {Record<string, unknown> | ((room: any) => Record<string, unknown>)} options - Mode, version, expansions
	 *   or variants; or built from the table, for a list such as the variants, so a retry builds it again
	 */
	configure(options) {
		return this.#change('configure', (/** @type {any} */ room) => ({
			options: typeof options === 'function' ? options(room) : options,
		}));
	}

	/** @param {{ timer?: number, undo?: boolean }} changes */
	settings(changes) {
		return this.#change('settings', changes);
	}

	/** @param {boolean} ready */
	async setReady(ready) {
		try {
			this.#accept(await this.#api.request('ready', { ready }));
		} catch (error) {
			this.#refused(error);
		}
	}

	/**
	 * Adds a hot-seat player; a blank name gets a generated one.
	 * @param {string} name
	 * @returns {Promise<boolean>} Whether it was added
	 */
	addSeat(name) {
		return this.#change('add-seat', {
			name: name.trim() || generateName(this.#random),
		});
	}

	/** @param {number} seat */
	removeSeat(seat) {
		return this.#change('remove-seat', { seat });
	}

	startGame() {
		return this.#change('start', {});
	}

	async copyCode() {
		const code = this.room?.code ?? '';
		try {
			await this.#copy(code);
			this.notify('Table code copied.');
		} catch {
			this.notify(`Share code: ${code}`);
		}
	}

	/** @param {string} message */
	notify(message) {
		this.toast = message;
		this.toastVisible = true;
		clearTimeout(this.#toastTimer);
		this.#toastTimer = setTimeout(() => {
			this.toastVisible = false;
		}, TOAST_MS);
	}

	/**
	 * Whether this tab closed the first-income notice of a table and seat (#77, #88).
	 * @param {string} key - Such as 'rg-first-income:abc12345:2'
	 * @returns {boolean}
	 */
	noticeClosed(key) {
		return this.#session.getItem(key) === '1';
	}

	/**
	 * Remembers in this tab that the first-income notice of a table and seat was closed.
	 * @param {string} key
	 */
	closeNotice(key) {
		this.#session.setItem(key, '1');
	}

	/** @param {boolean} on */
	setSound(on) {
		this.sound = on;
		try {
			this.#prefs.setItem(SOUND, on ? 'on' : 'off');
		} catch {
			// A browser that keeps nothing still plays for this visit.
		}
	}

	/**
	 * Runs a landing-page action with a session (withSession), then keeps the name signed in with.
	 * @template T
	 * @param {string} name - The name field
	 * @param {() => Promise<T>} action
	 * @returns {Promise<T>}
	 */
	async #withSession(name, action) {
		const result = await withSession(this.#api, name, action, () =>
			generateName(this.#random)
		);
		this.me = {
			name: this.#api.name() ?? '',
			code: null,
			saved: this.me?.saved ?? null,
		};
		return result;
	}

	/**
	 * Runs a landing-page action once at a time, showing its refusal in the status line.
	 * @param {() => Promise<void>} action
	 */
	async #busy(action) {
		if (this.busy) {
			return;
		}
		this.busy = true;
		this.status = '';
		try {
			await action();
		} catch (error) {
			this.status = /** @type {Error} */ (error).message;
		} finally {
			this.busy = false;
		}
	}

	/**
	 * A lobby change through change(), which survives a stale version while the seats stay put.
	 * @param {string} endpoint
	 * @param {Record<string, unknown> | ((room: any) => Record<string, unknown>)} body
	 * @returns {Promise<boolean>} Whether it went through
	 */
	async #change(endpoint, body) {
		if (!this.room) {
			return false;
		}
		try {
			this.#accept(
				await change(this.#api.request, endpoint, body, this.room)
			);
			return true;
		} catch (error) {
			this.#refused(error);
			return false;
		}
	}

	/** @param {unknown} error */
	#refused(error) {
		const room = /** @type {any} */ (error).room;
		if (room) {
			this.#accept(room);
		}
		this.refusals += 1;
		this.notify(/** @type {Error} */ (error).message);
	}

	/**
	 * Applies acceptStep to a room view that arrived: sets the hand-over, asks for another view, takes the room, and
	 * announces its fresh events (#130).
	 * @param {any} room
	 */
	#accept(room) {
		const wasPassing = this.passing !== null;
		const step = acceptStep(this.room, room, this.#shownSeat, this.passing);
		this.#shownSeat = step.shown;
		this.passing = step.passing;
		if (step.fetch !== undefined) {
			this.#fetchView(room.code, step.fetch);
		}
		if (step.take) {
			this.room = room;
			this.receivedAt = Date.now();
			if (this.me) {
				this.me = { ...this.me, code: room.code };
			}
		}
		if (step.fresh.length > 0) {
			this.fresh = step.fresh;
			this.freshCount += 1;
			this.#notices(step.fresh, room);
		}
		if (step.take) {
			this.#hand(room, wasPassing && step.passing === null);
		}
	}

	/**
	 * At a hot-seat table, keeps the last event each seat saw, and hands a player who takes the screen what the others
	 * did since they last held it, or, the first time, since the player before them took it (#153 design).
	 * @param {any} room - The room view taken
	 * @param {boolean} taken - The pass screen just went: its player took the screen
	 */
	#hand(room, taken) {
		const events = room.game?.events;
		if (room.mode !== 'hotseat' || !Array.isArray(events)) {
			return;
		}
		const last = events.at(-1)?.seq ?? 0;
		// A table opened, or refreshed, hands over nothing that came before.
		this.#takenSeq ??= last;
		const seat = room.viewing;
		if (seat === null || seat === undefined) {
			return;
		}
		if (taken) {
			const handed = handedEvents(
				events,
				this.#seen.get(seat) ?? this.#takenSeq ?? last
			);
			this.#takenSeq = last;
			if (handed.length > 0) {
				this.handed = handed;
				this.handedCount += 1;
			}
		}
		this.#seen.set(seat, last);
	}

	/**
	 * Toasts for fresh events a player should not miss: a turn the server played on (#24).
	 * @param {any[]} events
	 * @param {any} room
	 */
	#notices(events, room) {
		const timedOut = events.findLast((event) => event.type === 'timedOut');
		const text = timedOut ? eventText(timedOut, room.game) : null;
		if (text) {
			this.notify(text);
		}
	}

	/**
	 * Asks for a view instead of taking the one that arrived (#26 review, #30).
	 * @param {string} code - The table the view is for
	 * @param {number | null} seat - A seat, or null for the public view
	 */
	#fetchView(code, seat) {
		this.#askView(code, seat).catch(() => {
			// The next poll asks again.
		});
	}

	/**
	 * The player the pass screen names takes the screen: only now is their own view asked for, and the pass screen
	 * stays until it arrives (#30).
	 */
	takeSeat() {
		const seat = this.passing;
		if (seat === null || !this.room || this.#shownSeat === seat) {
			return;
		}
		this.#shownSeat = seat;
		this.#askView(this.room.code, seat).catch(() => {
			// The pass screen stays, and the player may try again.
			if (this.passing === seat) {
				this.#shownSeat = null;
			}
			this.notify("Can't reach the server. Try again.");
		});
	}

	/**
	 * Asks for a view of a table and accepts it, unless the tab has left that table by the time it arrives.
	 * @param {string} code - The table the view is for
	 * @param {number | null} seat - A seat, or null for the public view
	 * @returns {Promise<void>} Rejects when the server can't be reached
	 */
	async #askView(code, seat) {
		const generation = this.#generation;
		const next = await this.#api.request(
			seat === null ? 'state' : `state?seat=${seat}`
		);
		// An answer for a table the tab has left is dropped. Within one generation the table on show is null only
		// before the first view is taken.
		if (
			generation === this.#generation &&
			(!this.room || this.room.code === code)
		) {
			this.#accept(next);
		}
	}

	/** Whether the player the pass screen names has taken it, and their view is on its way (#30). */
	get taking() {
		return this.passing !== null && this.#shownSeat === this.passing;
	}

	/** The seat whose view is on show: the person's own online, the asked one at a hot-seat table. */
	get seat() {
		return this.room?.viewing ?? null;
	}

	/** The seat of the person at this screen: their own online, none at a hot-seat table, which shares it (#100). */
	get viewer() {
		return viewerSeat(this.room);
	}

	/**
	 * Answers one of the viewer's open decisions (#26). A stale version is not sent again: the newer table is shown
	 * and the player decides again.
	 * @param {{ decision: number } & Record<string, unknown>} action
	 * @returns {Promise<boolean>} Whether it went through
	 */
	async move(action) {
		if (!this.room) {
			return false;
		}
		try {
			this.#accept(
				await sendMove(
					this.#api.request,
					this.room,
					this.room.mode === 'hotseat' ? this.seat : null,
					action
				)
			);
			return true;
		} catch (error) {
			this.#refused(error);
			return false;
		}
	}

	/** Takes back the viewer's last choice, when the table allows it (#24). */
	async undo() {
		if (!this.room) {
			return;
		}
		try {
			this.#accept(
				await this.#api.request('undo', {
					version: this.room.version,
					...(this.room.mode === 'hotseat'
						? { seat: this.seat }
						: {}),
				})
			);
		} catch (error) {
			this.#refused(error);
		}
	}

	/** @param {any} room */
	#openTable(room) {
		const generation = ++this.#generation;
		this.room = null;
		this.#shownSeat = null;
		this.passing = null;
		this.#seen = new Map();
		this.#takenSeq = null;
		this.#accept(room);
		this.screen = 'table';
		this.connection = '';
		pollTable({
			request: this.#api.request,
			version: () => this.room?.version ?? 0,
			seat: () =>
				this.room?.mode === 'hotseat' ? this.#shownSeat : null,
			accept: (next) => {
				this.connection = '';
				this.#accept(next);
			},
			lost: () => {
				if (generation !== this.#generation) {
					return;
				}
				if (this.me) {
					this.me = { ...this.me, code: null };
				}
				this.status = "You're no longer at that table.";
				this.#showLanding();
			},
			trouble: () => {
				this.connection = 'Connection lost. Retrying…';
			},
			stopped: () => generation !== this.#generation,
			wait: this.#wait,
		});
	}

	#showLanding() {
		const generation = ++this.#generation;
		this.room = null;
		this.passing = null;
		this.screen = 'landing';
		this.tablesState = 'loading';
		(async () => {
			while (generation === this.#generation) {
				try {
					this.tables = (await this.#api.request('tables')).tables;
					this.tablesState = 'ready';
				} catch {
					this.tablesState = 'failed';
				}
				await this.#wait(TABLES_EVERY_MS);
			}
		})();
	}
}

/**
 * The client's store, one per tab.
 * @param {StoreDeps} deps
 * @returns {Store}
 */
export function createStore(deps) {
	return new Store(deps);
}

/** @typedef {Store} GameStore */
