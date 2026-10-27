// The table API (#23, #24, #25): guest sessions, every table in memory, long polling, the table timers, and the endpoints over rooms.mjs.
import { randomBytes, randomInt } from 'node:crypto';
import { PlayerError } from '../src/lib/engine/game.js';
import * as Rooms from './rooms.mjs';
import { rateLimiter } from '../server/limits.mjs';

/** @typedef {import('./rooms.mjs').Room & { version: number }} StoredRoom - A room as the server keeps it, with its version */
/**
 * A guest's session, found by its bearer token.
 * @typedef {Object} Session
 * @property {string} id - The person's id, which never leaves the server
 * @property {string} name
 * @property {number} used - When it was last used, in milliseconds
 * @property {string | null} code - The table the person sits at
 */
/**
 * A long-poll request waiting for its table to change.
 * @typedef {Object} Waiter
 * @property {import('node:http').ServerResponse} res
 * @property {Session} session
 * @property {string} address - The client's address key, for the per-address cap
 * @property {string} code
 * @property {number | undefined} seat
 * @property {number} since - The version the client has
 * @property {ReturnType<typeof setTimeout>} [timer]
 * @property {boolean} [counted] - Counted against its session's and address's caps
 * @property {boolean} [released] - No longer waiting
 */
/**
 * The settings the API reads on every use, so tests can change them (`config` in server.mjs).
 * @typedef {Object} ApiConfig
 * @property {number} longPollMs - How long a state request waits for a change
 * @property {number} sessionMs - How long a session lasts unused while its person holds a seat
 * @property {number} idleSessionMs - How long any other session lasts unused
 * @property {number} maxSessions - At the cap, a login replaces the longest-unused session that holds no seat
 * @property {number} tablesPerAddress - Tables one address may keep open at once
 * @property {number} waitsPerSession - Long polls one session may hold at once
 * @property {number} waitsPerAddress - Long polls one address may hold at once
 * @property {number} createLimit - Tables one address may create a minute
 * @property {number} loginLimit - Logins one address may make a minute
 * @property {number} minuteMs - A minute of the turn timer
 * @property {number} declineMinMs - The soonest the server answers a response only the decline answers
 * @property {number} declineMaxMs - The latest
 */

/** The largest request body, in bytes. */
const BODY_LIMIT = 16 * 1024;

/** A minute, the window of the per-address limits. */
const MINUTE = 60_000;

/** The longest wait setTimeout keeps: a longer one fires at once. A table timer that fires early just waits again. */
const LONGEST_WAIT = 2 ** 31 - 1;

/** Marks a state answer that waits for a change instead of answering now. */
const WAITING = Symbol('waiting');

/** An answer with its own status, for what isn't a player's mistake about the game: 400, 401, 404, 405, 409, 413, 429, 503. */
class HttpError extends Error {
	/**
	 * @param {number} status
	 * @param {string} message
	 */
	constructor(status, message) {
		super(message);
		this.status = status;
	}
}

/** The client went away mid-request: nobody to answer, and no fault of the server's. */
class ClientGone extends Error {}

/**
 * Sends a JSON answer that browsers never cache, unless the request was already answered or abandoned.
 * @param {import('node:http').ServerResponse} res
 * @param {number} status
 * @param {unknown} value
 * @param {Record<string, string>} [headers]
 */
export function sendJson(res, status, value, headers = {}) {
	if (res.writableEnded || res.destroyed) {
		return;
	}
	res.writeHead(status, {
		'Content-Type': 'application/json; charset=utf-8',
		'Cache-Control': 'no-store',
		...headers,
	});
	res.end(JSON.stringify(value));
}

/**
 * Reads a request's JSON body, which must be an object of at most 16 KB. Reading stops at the limit, so a larger body
 * costs no more than that.
 * @param {import('node:http').IncomingMessage} req
 * @returns {Promise<Record<string, any>>}
 * @throws {HttpError} 413 for a larger body, 400 for anything but a JSON object
 * @throws {ClientGone} When the client goes away first
 */
function readJson(req) {
	if (Number(req.headers['content-length']) > BODY_LIMIT) {
		return Promise.reject(new HttpError(413, 'That request is too large.'));
	}
	return new Promise((resolve, reject) => {
		/** @type {Buffer[]} */
		const chunks = [];
		let size = 0;
		/** @param {Buffer} chunk */
		const take = (chunk) => {
			size += chunk.length;
			if (size > BODY_LIMIT) {
				req.off('data', take);
				req.pause();
				reject(new HttpError(413, 'That request is too large.'));
				return;
			}
			chunks.push(chunk);
		};
		req.on('data', take);
		req.on('error', () => reject(new ClientGone()));
		req.on('close', () => {
			if (!req.complete) {
				reject(new ClientGone());
			}
		});
		req.on('end', () => {
			const text = Buffer.concat(chunks).toString('utf8');
			let body;
			try {
				body = text ? JSON.parse(text) : {};
			} catch {
				body = null;
			}
			if (!body || typeof body !== 'object' || Array.isArray(body)) {
				reject(
					new HttpError(400, 'Send the request as a JSON object.')
				);
				return;
			}
			resolve(body);
		});
	});
}

/**
 * The method each endpoint answers.
 * @type {Record<string, 'GET' | 'POST'>}
 */
const METHODS = {
	config: 'GET',
	tables: 'GET',
	login: 'POST',
	me: 'GET',
	create: 'POST',
	join: 'POST',
	state: 'GET',
	configure: 'POST',
	'add-seat': 'POST',
	'remove-seat': 'POST',
	ready: 'POST',
	start: 'POST',
	end: 'POST',
	settings: 'POST',
	move: 'POST',
	undo: 'POST',
	leave: 'POST',
};

/**
 * Adds to a count in a map, removing the key at zero.
 * @param {Map<string, number>} counts
 * @param {string} key
 * @param {number} by
 */
function bump(counts, key, by) {
	const next = (counts.get(key) ?? 0) + by;
	if (next > 0) {
		counts.set(key, next);
	} else {
		counts.delete(key);
	}
}

/**
 * The table API: one instance keeps every table and session in memory (#23 design §4–§9), with one timer per table
 * for its next clock or automatic decline (#24 design §9).
 * @param {ApiConfig} config - Read on every use
 * @param {{ timeout?: typeof Rooms.timeout }} [rules] - A stand-in for Rooms.timeout, for the tests of what only a
 *   bug can do; the server passes none
 * @returns {{ handle: (req: import('node:http').IncomingMessage, res: import('node:http').ServerResponse, address: string) => Promise<void>, sweep: (now?: number) => void, waiting: () => number, timers: () => number, close: () => void }}
 *   `timers()` counts the table timers held; `close()` clears them all, for when the server closes
 */
export function createApi(config, { timeout = Rooms.timeout } = {}) {
	/** @type {Map<string, StoredRoom>} */
	const rooms = new Map();
	/** @type {Map<string, Session>} By token */
	const sessions = new Map();
	/** @type {Map<string, Set<Waiter>>} By table code */
	const waiters = new Map();
	/** @type {Map<string, number>} Long polls held, by person id */
	const waitsBySession = new Map();
	/** @type {Map<string, number>} Long polls held, by address key */
	const waitsByAddress = new Map();
	/** @type {Map<string, string>} The address that created each open table, by code, for the per-address cap */
	const creators = new Map();
	/** @type {Map<string, ReturnType<typeof setTimeout>>} Each table's timer for its next deadline, by code */
	const tableTimers = new Map();
	const creates = rateLimiter(() => config.createLimit, MINUTE);
	const logins = rateLimiter(() => config.loginLimit, MINUTE);
	/** @type {import('../src/lib/engine/random.js').Random} */
	const random = (n) => randomInt(n);

	/**
	 * The session a request's bearer token names, kept alive by the use.
	 * @param {import('node:http').IncomingMessage} req
	 * @param {number} now
	 * @returns {Session}
	 * @throws {HttpError} 401 without a live session
	 */
	function sessionOf(req, now) {
		const token = req.headers.authorization?.replace(/^Bearer /, '') ?? '';
		const session = sessions.get(token);
		if (!session || expired(session, now, seatHolders())) {
			if (session) {
				forget(token, session, now);
			}
			throw new HttpError(401, 'Sign in again.');
		}
		session.used = now;
		return session;
	}

	/**
	 * The people whose sessions must stay: everyone present at a table, and everyone with a seat, away or not, in a
	 * running game, who must be able to come back to it. A seat left at a finished table holds nothing.
	 * @returns {Set<string>}
	 */
	function seatHolders() {
		const holders = new Set();
		for (const room of rooms.values()) {
			const running = Rooms.phase(room) === 'playing';
			for (const seat of room.seats) {
				if (running || !seat.away) {
					holders.add(seat.player);
				}
			}
		}
		return holders;
	}

	/**
	 * Whether a session has gone unused too long: a day while its person holds a seat, an hour otherwise.
	 * @param {Session} session
	 * @param {number} now
	 * @param {Set<string>} holders - From seatHolders()
	 */
	function expired(session, now, holders) {
		const lasts = holders.has(session.id)
			? config.sessionMs
			: config.idleSessionMs;
		return now - session.used > lasts;
	}

	/**
	 * Ends a session. Its person leaves every table they sit at, so a seat nobody can play any more doesn't stop the
	 * others from ending the game, or hold them from other tables.
	 * @param {string} token
	 * @param {Session} session
	 * @param {number} now
	 */
	function forget(token, session, now) {
		sessions.delete(token);
		for (const room of [...rooms.values()]) {
			if (Rooms.seatsOf(room, session.id).length > 0) {
				commit(room.code, Rooms.leave(room, session.id).room, now);
			}
		}
	}

	/**
	 * Makes room for a new session at the cap: the longest-unused session whose person holds no seat goes, so nobody
	 * loses a seat to it. Filling the server then takes a seat per session, and tables are capped per address.
	 * @param {number} now
	 * @throws {HttpError} 503 when every session holds a seat
	 */
	function makeRoomForSession(now) {
		sweep(now);
		if (sessions.size < config.maxSessions) {
			return;
		}
		const holders = seatHolders();
		/** @type {[string, Session] | undefined} */
		let oldest;
		for (const entry of sessions) {
			if (
				!holders.has(entry[1].id) &&
				(!oldest || entry[1].used < oldest[1].used)
			) {
				oldest = entry;
			}
		}
		if (!oldest) {
			throw new HttpError(503, 'The server is full. Try again later.');
		}
		forget(oldest[0], oldest[1], now);
	}

	/** Forgets the creators of tables that have closed. */
	function pruneCreators() {
		for (const code of creators.keys()) {
			if (!rooms.has(code)) {
				creators.delete(code);
			}
		}
	}

	/**
	 * How many tables an address created that are still open.
	 * @param {string} address
	 */
	function openFrom(address) {
		pruneCreators();
		let count = 0;
		for (const creator of creators.values()) {
			if (creator === address) {
				count += 1;
			}
		}
		return count;
	}

	/**
	 * Whether a session sits at a table now, forgetting one that is gone.
	 * @param {Session} session
	 */
	function seated(session) {
		const room = session.code ? rooms.get(session.code) : undefined;
		if (!room || Rooms.seatsOf(room, session.id).length === 0) {
			session.code = null;
			return false;
		}
		return true;
	}

	/**
	 * The table a person sits at. A table that closed, or a seat the host removed, is forgotten.
	 * @param {Session} session
	 * @param {number} now
	 * @returns {StoredRoom}
	 * @throws {PlayerError} When they sit at no table
	 */
	function tableOf(session, now) {
		if (!seated(session)) {
			throw new PlayerError("You aren't at this table.");
		}
		const room = /** @type {StoredRoom} */ (
			rooms.get(/** @type {string} */ (session.code))
		);
		room.touched = now;
		return room;
	}

	/**
	 * The code of a running game where the person holds a seat, away or not, for "Return to your game".
	 * @param {Session} session
	 * @returns {string | null}
	 */
	function runningSeat(session) {
		for (const room of rooms.values()) {
			if (
				Rooms.phase(room) === 'playing' &&
				Rooms.seatsOf(room, session.id).length > 0
			) {
				return room.code;
			}
		}
		return null;
	}

	/**
	 * The room view for a person, with the table's version.
	 * @param {StoredRoom} room
	 * @param {Session} session
	 * @param {number} [seat]
	 */
	function viewFor(room, session, seat) {
		return {
			...Rooms.roomView(room, session.id, seat),
			version: room.version,
			// The server's time, so a screen can count the clocks down on its own clock.
			now: Date.now(),
		};
	}

	/**
	 * The timer's lengths, from config as it is now.
	 * @returns {import('./rooms.mjs').Timing}
	 */
	function timing() {
		return {
			minuteMs: config.minuteMs,
			declineMinMs: config.declineMinMs,
			declineMaxMs: config.declineMaxMs,
		};
	}

	/**
	 * Stores a room's next state and answers everyone waiting on it. The same room means nothing changed: no new
	 * version, nobody woken. Null closes the room.
	 *
	 * The clocks and declines are brought up to date (Rooms.tick) in the same version as the change, never in one of
	 * their own: that version would tell everyone watching that the server had scheduled a decline, so the defender
	 * holds no trap (#24 design §7). The table's timer then follows its next deadline.
	 * @param {string} code
	 * @param {import('./rooms.mjs').Room | null} next
	 * @param {number} now
	 * @returns {StoredRoom | null}
	 */
	function commit(code, next, now) {
		const before = rooms.get(code);
		if (next === before) {
			return before ?? null;
		}
		if (next) {
			rooms.set(code, {
				...Rooms.tick(next, now, timing(), random),
				version: (before?.version ?? 0) + 1,
				touched: now,
			});
		} else {
			rooms.delete(code);
		}
		schedule(code);
		wake(code);
		return rooms.get(code) ?? null;
	}

	/**
	 * Stops a table's timer, if it has one.
	 * @param {string} code
	 */
	function stop(code) {
		clearTimeout(tableTimers.get(code));
		tableTimers.delete(code);
	}

	/**
	 * Sets a table's timer for its next deadline, in place of the one it had. A table with no deadline, or gone, keeps
	 * none.
	 * @param {string} code
	 */
	function schedule(code) {
		stop(code);
		const room = rooms.get(code);
		const deadline = room ? Rooms.nextDeadline(room) : null;
		if (deadline === null) {
			return;
		}
		const wait = Math.min(Math.max(0, deadline - Date.now()), LONGEST_WAIT);
		const timer = setTimeout(() => fire(code), wait);
		timer.unref();
		tableTimers.set(code, timer);
	}

	/**
	 * Plays what has run out at a table (Rooms.timeout) and commits it. It runs from the table's timer, and before a
	 * late move or undo, so that the request meets the new version and gets 409 rather than racing the timer (#24
	 * design §6). It never throws.
	 *
	 * A timeout that answered nothing, which only a bug makes, is never committed, and neither is one that failed: the
	 * error is logged, and the table keeps no timer until its next change. So a bug can't spin in a loop, or bump the
	 * version for a client that retries on 409 (#24 design §9). After an answer the table may be due again at once,
	 * when an expired clock that waited for a defender resumes with nothing left; its timer then fires at once.
	 * @param {string} code
	 * @param {number} now
	 * @returns {boolean} False when nothing has run out
	 */
	function playDue(code, now) {
		const room = rooms.get(code);
		const deadline = room ? Rooms.nextDeadline(room) : null;
		if (!room || deadline === null || deadline > now) {
			return false;
		}
		try {
			const next = timeout(room, now, random);
			if (next.game === room.game) {
				throw new Error(
					`The timer at table ${code} could answer nothing, so it waits for the table to change.`
				);
			}
			commit(code, next, now);
		} catch (error) {
			stop(code);
			console.error(error);
		}
		return true;
	}

	/**
	 * A table's timer is due: what has run out is played. A timer that fired early waits again, and a table that is
	 * gone, or has nothing left to run out, keeps none.
	 * @param {string} code
	 */
	function fire(code) {
		tableTimers.delete(code);
		if (!playDue(code, Date.now())) {
			schedule(code);
		}
	}

	/**
	 * Closes the tables nobody has used for too long, with their timers, and answers their waiting requests.
	 * @param {number} now
	 */
	function expire(now) {
		for (const code of Rooms.expireRooms(rooms, now)) {
			stop(code);
			wake(code);
		}
	}

	/**
	 * Stops counting a waiting request and cancels its wait. Safe to call more than once.
	 * @param {Waiter} waiter
	 */
	function release(waiter) {
		if (waiter.released) {
			return;
		}
		waiter.released = true;
		clearTimeout(waiter.timer);
		const list = waiters.get(waiter.code);
		list?.delete(waiter);
		if (list?.size === 0) {
			waiters.delete(waiter.code);
		}
		if (waiter.counted) {
			bump(waitsBySession, waiter.session.id, -1);
			bump(waitsByAddress, waiter.address, -1);
		}
	}

	/**
	 * Answers a waiting request with its table as it is now, or tells the client it has lost its seat. It never
	 * throws: it runs from timers and from other people's changes, where an error would stop the whole server.
	 * @param {Waiter} waiter
	 */
	function answer(waiter) {
		release(waiter);
		try {
			const room = rooms.get(waiter.code);
			if (!room) {
				throw new PlayerError("You aren't at this table.");
			}
			sendJson(
				waiter.res,
				200,
				viewFor(room, waiter.session, waiter.seat)
			);
		} catch (error) {
			if (error instanceof PlayerError) {
				seated(waiter.session);
				sendJson(waiter.res, 400, { error: error.message });
				return;
			}
			console.error(error);
			sendJson(waiter.res, 500, {
				error: 'Something went wrong. Try again.',
			});
		}
	}

	/**
	 * Answers every request waiting on a table.
	 * @param {string} code
	 */
	function wake(code) {
		for (const waiter of [...(waiters.get(code) ?? [])]) {
			answer(waiter);
		}
	}

	/**
	 * Holds a state request until its table passes the client's version, or config.longPollMs passes. A table that
	 * changed since the request was checked is answered at once, so no change is missed.
	 * @param {Waiter} waiter
	 */
	function wait(waiter) {
		if (waiter.res.destroyed) {
			return;
		}
		const room = rooms.get(waiter.code);
		if (!room || room.version > waiter.since) {
			answer(waiter);
			return;
		}
		if (
			(waitsBySession.get(waiter.session.id) ?? 0) >=
				config.waitsPerSession ||
			(waitsByAddress.get(waiter.address) ?? 0) >= config.waitsPerAddress
		) {
			waiter.released = true;
			sendJson(waiter.res, 429, {
				error: 'Too many requests are waiting. Try again shortly.',
			});
			return;
		}
		const list = waiters.get(waiter.code) ?? new Set();
		waiters.set(waiter.code, list);
		list.add(waiter);
		waiter.counted = true;
		bump(waitsBySession, waiter.session.id, 1);
		bump(waitsByAddress, waiter.address, 1);
		waiter.timer = setTimeout(() => answer(waiter), config.longPollMs);
		waiter.timer.unref();
		// The client gave up, for example by closing the tab.
		waiter.res.on('close', () => release(waiter));
	}

	/**
	 * Refuses a person whose seat holds up a running game at another table.
	 * @param {Session} session
	 * @param {string | null} code - The table they want
	 */
	function assertFree(session, code) {
		const other = Rooms.unfinishedSeat(rooms, session.id, code ?? '');
		if (other) {
			throw new PlayerError(
				`You still have a seat in a game at table ${other}. Return to it with that code first.`
			);
		}
	}

	/**
	 * A table's change, checked against the version the client saw.
	 * @param {Session} session
	 * @param {Record<string, any>} body
	 * @param {number} now
	 * @param {(room: StoredRoom) => import('./rooms.mjs').Room} transition
	 * @param {number} [seat] - The seat to view afterwards
	 */
	function change(session, body, now, transition, seat) {
		const room = tableOf(session, now);
		if (!Number.isInteger(body.version)) {
			throw new HttpError(400, 'Send the table version.');
		}
		if (body.version !== room.version) {
			throw new HttpError(409, 'The table changed. Try again.');
		}
		const stored = /** @type {StoredRoom} */ (
			commit(room.code, transition(room), now)
		);
		return viewFor(stored, session, seat);
	}

	/**
	 * The seat a move or an undo is for: the one named, or the person's only seat.
	 * @param {Session} session
	 * @param {Record<string, any>} body
	 * @param {number} now
	 * @returns {{ code: string, seat: any, shown: number | undefined }} `shown`: the seat to view afterwards, when it is
	 *   theirs
	 * @throws {PlayerError} When they sit at no table, or play several seats and named none
	 */
	function playing(session, body, now) {
		const room = tableOf(session, now);
		const mine = Rooms.seatsOf(room, session.id);
		const seat = body.seat ?? (mine.length === 1 ? mine[0] : undefined);
		if (seat === undefined) {
			throw new PlayerError('Choose the seat you are playing.');
		}
		return {
			code: room.code,
			seat,
			shown: mine.includes(seat) ? seat : undefined,
		};
	}

	/**
	 * One endpoint's answer. The time is taken once the body has arrived, so a slow upload doesn't date it.
	 * @param {string} name
	 * @param {import('node:http').IncomingMessage} req
	 * @param {URL} url
	 * @param {string} address
	 * @returns {Promise<unknown>}
	 */
	async function route(name, req, url, address) {
		const body = METHODS[name] === 'POST' ? await readJson(req) : {};
		const now = Date.now();
		if (name === 'config') {
			return { ...Rooms.tableChoices(), longPollMs: config.longPollMs };
		}
		if (name === 'tables') {
			return { tables: Rooms.openTables(rooms) };
		}
		if (name === 'login') {
			if (!logins.allow(address, now)) {
				throw new HttpError(
					429,
					'Too many requests. Try again shortly.'
				);
			}
			const clean = Rooms.cleanName(body.name);
			if (sessions.size >= config.maxSessions) {
				makeRoomForSession(now);
			}
			const token = randomBytes(24).toString('hex');
			sessions.set(token, {
				id: randomBytes(16).toString('hex'),
				name: clean,
				used: now,
				code: null,
			});
			return { token, name: clean };
		}
		const session = sessionOf(req, now);
		const person = { id: session.id, name: session.name };
		switch (name) {
			case 'me':
				return {
					name: session.name,
					code: seated(session) ? session.code : null,
					saved: runningSeat(session),
				};
			case 'create': {
				if (seated(session)) {
					throw new PlayerError('Leave your table first.');
				}
				assertFree(session, null);
				if (!creates.allow(address, now)) {
					throw new HttpError(
						429,
						'Too many requests. Try again shortly.'
					);
				}
				expire(now);
				if (openFrom(address) >= config.tablesPerAddress) {
					throw new HttpError(
						429,
						'Too many tables are open from your address. Close one first.'
					);
				}
				if (rooms.size >= Rooms.MAX_ROOMS) {
					throw new HttpError(
						503,
						'There are too many tables right now. Try again later.'
					);
				}
				const code = Rooms.newCode(rooms, random);
				const room = Rooms.createRoom(
					code,
					person,
					body.options ?? {},
					now
				);
				Rooms.addRoom(rooms, { ...room, version: 1 });
				creators.set(code, address);
				session.code = code;
				return viewFor(
					/** @type {StoredRoom} */ (rooms.get(code)),
					session
				);
			}
			case 'join': {
				const code = String(body.code ?? '')
					.trim()
					.toLowerCase();
				if (seated(session) && session.code !== code) {
					throw new PlayerError('Leave your table first.');
				}
				const room = rooms.get(code);
				if (!room) {
					throw new HttpError(
						404,
						'There is no table with that code.'
					);
				}
				assertFree(session, code);
				room.touched = now;
				const next = Rooms.join(room, person);
				// Before the commit, which answers the waiting requests: the session already sits here then.
				session.code = code;
				const stored = /** @type {StoredRoom} */ (
					commit(code, next, now)
				);
				return viewFor(stored, session);
			}
			case 'state': {
				const room = tableOf(session, now);
				const asked = url.searchParams.get('seat');
				const seat = asked === null ? undefined : Number(asked);
				// Checked now, so a seat that isn't theirs is refused at once rather than after the wait.
				if (
					seat !== undefined &&
					!Rooms.seatsOf(room, session.id).includes(seat)
				) {
					throw new PlayerError("That seat isn't yours.");
				}
				const since = Number(url.searchParams.get('since') ?? NaN);
				if (Number.isFinite(since) && room.version <= since) {
					return {
						[WAITING]: { session, code: room.code, seat, since },
					};
				}
				return viewFor(room, session, seat);
			}
			case 'configure':
				return change(session, body, now, (room) =>
					Rooms.configure(room, session.id, body.options)
				);
			case 'add-seat':
				return change(session, body, now, (room) =>
					Rooms.addSeat(room, session.id, body.name)
				);
			case 'remove-seat':
				return change(session, body, now, (room) =>
					Rooms.removeSeat(room, session.id, body.seat)
				);
			case 'ready': {
				// No version: it touches only the person's own seat and decides nothing (#25 design §6.4).
				const room = tableOf(session, now);
				const stored = /** @type {StoredRoom} */ (
					commit(
						room.code,
						Rooms.ready(room, session.id, body.ready),
						now
					)
				);
				return viewFor(stored, session);
			}
			case 'start':
				return change(session, body, now, (room) =>
					Rooms.start(room, session.id, random)
				);
			case 'end':
				return change(session, body, now, (room) =>
					Rooms.end(room, session.id)
				);
			case 'settings':
				return change(session, body, now, (room) =>
					Rooms.settings(room, session.id, {
						timer: body.timer,
						undo: body.undo,
					})
				);
			case 'move': {
				const { code, seat, shown } = playing(session, body, now);
				playDue(code, now);
				return change(
					session,
					body,
					now,
					(current) =>
						Rooms.play(
							current,
							session.id,
							seat,
							body.action,
							random
						),
					shown
				);
			}
			case 'undo': {
				const { code, seat, shown } = playing(session, body, now);
				playDue(code, now);
				return change(
					session,
					body,
					now,
					(current) => Rooms.undo(current, session.id, seat),
					shown
				);
			}
			case 'leave': {
				const room = tableOf(session, now);
				const { room: next, saved } = Rooms.leave(room, session.id);
				session.code = null;
				commit(room.code, next, now);
				return { saved, code: room.code };
			}
		}
		throw new HttpError(404, 'Unknown request.');
	}

	/**
	 * Answers one /api/ request.
	 * @param {import('node:http').IncomingMessage} req
	 * @param {import('node:http').ServerResponse} res
	 * @param {string} address - The client's address key (addressKey), for the per-address limits
	 */
	async function handle(req, res, address) {
		const url = new URL(req.url ?? '/', 'http://localhost');
		const name = url.pathname.startsWith('/api/')
			? url.pathname.slice('/api/'.length)
			: '';
		try {
			const method = Object.hasOwn(METHODS, name)
				? METHODS[name]
				: undefined;
			if (!method) {
				throw new HttpError(404, 'Unknown request.');
			}
			if (req.method !== method) {
				throw new HttpError(405, `Use ${method} for this request.`);
			}
			const result = await route(name, req, url, address);
			if (result && typeof result === 'object' && WAITING in result) {
				wait({ res, address, .../** @type {any} */ (result)[WAITING] });
				return;
			}
			sendJson(res, 200, result);
		} catch (error) {
			if (error instanceof ClientGone) {
				return;
			}
			if (error instanceof HttpError) {
				// An oversized body is left unread, so the connection can't carry another request.
				const headers =
					error.status === 413 ? { Connection: 'close' } : undefined;
				return sendJson(
					res,
					error.status,
					{ error: error.message },
					headers
				);
			}
			if (error instanceof PlayerError) {
				return sendJson(res, 400, { error: error.message });
			}
			throw error;
		}
	}

	/**
	 * Housekeeping, once a minute: idle tables close (their waiting requests are answered), unused sessions end and
	 * leave their seats, and quiet addresses are forgotten.
	 * @param {number} [now]
	 */
	function sweep(now = Date.now()) {
		expire(now);
		const holders = seatHolders();
		for (const [token, session] of [...sessions]) {
			if (expired(session, now, holders)) {
				forget(token, session, now);
			}
		}
		pruneCreators();
		creates.sweep(now);
		logins.sweep(now);
	}

	/** Clears every table timer, for when the server closes. */
	function close() {
		for (const code of [...tableTimers.keys()]) {
			stop(code);
		}
	}

	return {
		handle,
		sweep,
		waiting: () =>
			[...waiters.values()].reduce((sum, list) => sum + list.size, 0),
		timers: () => tableTimers.size,
		close,
	};
}
