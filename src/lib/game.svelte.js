// What the client knows (#25 design §7.2): the table choices, who the tab is, the open tables and the table it sits at, kept up to date by the long poll.
import { boot } from './boot.js';
import { change } from './changes.js';
import { validCode } from './lobby.js';
import { generateName } from './names.js';
import { backoff, pollTable } from './poll.js';

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
	sound = $state(false);
	busy = $state(false);

	#api;
	#random;
	#prefs;
	#copy;
	#wait;
	/** Bumped whenever the tab leaves a screen, so the loops of the old one stop. */
	#generation = 0;
	/** @type {ReturnType<typeof setTimeout> | undefined} */
	#toastTimer;

	/** @param {StoreDeps} deps */
	constructor({ api, random, prefs, copy, wait }) {
		this.#api = api;
		this.#random = random;
		this.#prefs = prefs;
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
			await this.#signedIn(name);
			this.#openTable(await this.#api.request('create', { options: {} }));
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
			await this.#signedIn(name);
			this.#openTable(
				await this.#api.request('join', { code: code.trim() })
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
			this.#openTable(await this.#api.request('join', { code }));
		});
	}

	async leaveTable() {
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

	/** @param {Record<string, unknown>} options - Mode, version, expansions or variants */
	configure(options) {
		return this.#change('configure', { options });
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
	 * Signs in unless the tab already has a session under this name; a blank field keeps the session, or gets a
	 * generated name.
	 * @param {string} name
	 */
	async #signedIn(name) {
		const typed = name.trim();
		if (this.#api.token() && (!typed || typed === this.#api.name())) {
			return;
		}
		const signed = await this.#api.signIn(
			typed || generateName(this.#random)
		);
		this.me = { name: signed, code: null, saved: null };
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
	 * @param {Record<string, unknown>} body
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
	 * Takes a room view unless an older answer arrives after a newer one.
	 * @param {any} room
	 */
	#accept(room) {
		if (
			!this.room ||
			room.code !== this.room.code ||
			room.version >= this.room.version
		) {
			this.room = room;
			if (this.me) {
				this.me = { ...this.me, code: room.code };
			}
		}
	}

	/** @param {any} room */
	#openTable(room) {
		const generation = ++this.#generation;
		this.room = null;
		this.#accept(room);
		this.screen = 'table';
		this.connection = '';
		pollTable({
			request: this.#api.request,
			version: () => this.room?.version ?? 0,
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
