// The table API (#23): guest sessions, every table in memory, long polling, and the endpoints over rooms.mjs.
import { randomBytes, randomInt } from 'node:crypto';
import { PlayerError } from './src/lib/engine/game.js';
import * as Rooms from './rooms.mjs';
import { rateLimiter } from './limits.mjs';

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
 * @typedef {{ res: import('node:http').ServerResponse, session: Session, code: string, seat: number | undefined, timer?: ReturnType<typeof setTimeout> }} Waiter
 */
/**
 * The settings the API reads on every use, so tests can change them (`config` in server.mjs).
 * @typedef {Object} ApiConfig
 * @property {number} longPollMs - How long a state request waits for a change
 * @property {number} sessionMs - How long a session lasts unused
 * @property {number} maxSessions
 * @property {number} createLimit - Tables one address may create a minute
 * @property {number} loginLimit - Logins one address may make a minute
 */

/** The largest request body, in bytes. */
const BODY_LIMIT = 16 * 1024;

/** A minute, the window of the per-address limits. */
const MINUTE = 60_000;

/** Marks a state answer that waits for a change instead of answering now. */
const WAITING = Symbol('waiting');

/** An answer with its own status, for what isn't a player's mistake about the game: 401, 404, 405, 409, 413, 429, 503. */
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

/**
 * Sends a JSON answer that browsers never cache, unless the request was already answered or abandoned.
 * @param {import('node:http').ServerResponse} res
 * @param {number} status
 * @param {unknown} value
 */
export function sendJson(res, status, value) {
	if (res.writableEnded || res.destroyed) {
		return;
	}
	res.writeHead(status, {
		'Content-Type': 'application/json; charset=utf-8',
		'Cache-Control': 'no-store',
	});
	res.end(JSON.stringify(value));
}

/**
 * Reads a request's JSON body, which must be an object of at most 16 KB.
 * @param {import('node:http').IncomingMessage} req
 * @returns {Promise<Record<string, any>>}
 * @throws {HttpError} 413 for a larger body, 400 for anything but a JSON object
 */
async function readJson(req) {
	const chunks = [];
	let size = 0;
	for await (const chunk of req) {
		size += chunk.length;
		if (size <= BODY_LIMIT) {
			chunks.push(chunk);
		}
	}
	if (size > BODY_LIMIT) {
		throw new HttpError(413, 'That request is too large.');
	}
	const text = Buffer.concat(chunks).toString('utf8');
	let body;
	try {
		body = text ? JSON.parse(text) : {};
	} catch {
		body = null;
	}
	if (!body || typeof body !== 'object' || Array.isArray(body)) {
		throw new HttpError(400, 'Send the request as a JSON object.');
	}
	return body;
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
	start: 'POST',
	end: 'POST',
	move: 'POST',
	leave: 'POST',
};

/**
 * The table API: one instance keeps every table and session in memory (#23 design §4–§9).
 * @param {ApiConfig} config - Read on every use
 * @returns {{ handle: (req: import('node:http').IncomingMessage, res: import('node:http').ServerResponse, address: string | undefined) => Promise<void>, sweep: (now?: number) => void, waiting: () => number }}
 */
export function createApi(config) {
	/** @type {Map<string, StoredRoom>} */
	const rooms = new Map();
	/** @type {Map<string, Session>} By token */
	const sessions = new Map();
	/** @type {Map<string, Set<Waiter>>} By table code */
	const waiters = new Map();
	const creates = rateLimiter(() => config.createLimit, MINUTE);
	const logins = rateLimiter(() => config.loginLimit, MINUTE);
	/** @type {import('./src/lib/engine/random.js').Random} */
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
		if (!session || now - session.used > config.sessionMs) {
			sessions.delete(token);
			throw new HttpError(401, 'Sign in again.');
		}
		session.used = now;
		return session;
	}

	/**
	 * The table a person sits at. A table that closed, or a seat the host removed, is forgotten.
	 * @param {Session} session
	 * @param {number} now
	 * @returns {StoredRoom}
	 * @throws {PlayerError} When they sit at no table
	 */
	function tableOf(session, now) {
		const room = session.code ? rooms.get(session.code) : undefined;
		if (!room || Rooms.seatsOf(room, session.id).length === 0) {
			session.code = null;
			throw new PlayerError("You aren't at this table.");
		}
		room.touched = now;
		return room;
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
	 * The room view for a person, with the table's version.
	 * @param {StoredRoom} room
	 * @param {Session} session
	 * @param {number} [seat]
	 */
	function viewFor(room, session, seat) {
		return {
			...Rooms.roomView(room, session.id, seat),
			version: room.version,
		};
	}

	/**
	 * Stores a room's next state and answers everyone waiting on it. The same room means nothing changed: no new
	 * version, nobody woken. Null closes the room.
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
				...next,
				version: (before?.version ?? 0) + 1,
				touched: now,
			});
		} else {
			rooms.delete(code);
		}
		wake(code);
		return rooms.get(code) ?? null;
	}

	/**
	 * Answers a waiting request with its table as it is now, or tells the client it has lost its seat.
	 * @param {Waiter} waiter
	 */
	function answer(waiter) {
		clearTimeout(waiter.timer);
		const room = rooms.get(waiter.code);
		try {
			if (!room) {
				throw new PlayerError("You aren't at this table.");
			}
			sendJson(
				waiter.res,
				200,
				viewFor(room, waiter.session, waiter.seat)
			);
		} catch (error) {
			if (!(error instanceof PlayerError)) {
				throw error;
			}
			if (
				waiter.session.code === waiter.code &&
				!seated(waiter.session)
			) {
				waiter.session.code = null;
			}
			sendJson(waiter.res, 400, { error: error.message });
		}
	}

	/**
	 * Answers every request waiting on a table.
	 * @param {string} code
	 */
	function wake(code) {
		const list = waiters.get(code);
		if (!list) {
			return;
		}
		waiters.delete(code);
		for (const waiter of list) {
			answer(waiter);
		}
	}

	/**
	 * Holds a state request until its table changes or config.longPollMs passes.
	 * @param {Waiter} waiter
	 */
	function wait(waiter) {
		const list = waiters.get(waiter.code) ?? new Set();
		waiters.set(waiter.code, list);
		list.add(waiter);
		const drop = () => {
			clearTimeout(waiter.timer);
			list.delete(waiter);
			if (list.size === 0 && waiters.get(waiter.code) === list) {
				waiters.delete(waiter.code);
			}
		};
		waiter.timer = setTimeout(() => {
			drop();
			answer(waiter);
		}, config.longPollMs);
		waiter.timer.unref();
		// The client gave up, for example by closing the tab.
		waiter.res.on('close', drop);
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
		if (body.version !== room.version) {
			throw new HttpError(409, 'The table changed. Try again.');
		}
		const stored = /** @type {StoredRoom} */ (
			commit(room.code, transition(room), now)
		);
		return viewFor(stored, session, seat);
	}

	/**
	 * One endpoint's answer.
	 * @param {string} name
	 * @param {import('node:http').IncomingMessage} req
	 * @param {URL} url
	 * @param {string | undefined} address
	 * @param {number} now
	 * @returns {Promise<unknown | typeof WAITING>}
	 */
	async function route(name, req, url, address, now) {
		if (name === 'config') {
			return { ...Rooms.tableChoices(), longPollMs: config.longPollMs };
		}
		if (name === 'tables') {
			return { tables: Rooms.openTables(rooms) };
		}
		const body = METHODS[name] === 'POST' ? await readJson(req) : {};
		if (name === 'login') {
			if (!logins.allow(String(address), now)) {
				throw new HttpError(
					429,
					'Too many requests. Try again shortly.'
				);
			}
			const clean = Rooms.cleanName(body.name);
			if (sessions.size >= config.maxSessions) {
				sweep(now);
			}
			if (sessions.size >= config.maxSessions) {
				throw new HttpError(
					503,
					'The server is full. Try again later.'
				);
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
				};
			case 'create': {
				if (seated(session)) {
					throw new PlayerError('Leave your table first.');
				}
				assertFree(session, null);
				if (!creates.allow(String(address), now)) {
					throw new HttpError(
						429,
						'Too many requests. Try again shortly.'
					);
				}
				for (const code of Rooms.expireRooms(rooms, now)) {
					wake(code);
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
				const stored = /** @type {StoredRoom} */ (
					commit(code, Rooms.join(room, person), now)
				);
				session.code = code;
				return viewFor(stored, session);
			}
			case 'state': {
				const room = tableOf(session, now);
				const asked = url.searchParams.get('seat');
				const seat = asked === null ? undefined : Number(asked);
				const since = Number(url.searchParams.get('since') ?? NaN);
				// Checked now, so a seat that isn't theirs is refused at once rather than after the wait.
				const view = viewFor(room, session, seat);
				if (Number.isFinite(since) && room.version <= since) {
					return { [WAITING]: { session, code: room.code, seat } };
				}
				return view;
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
			case 'start':
				return change(session, body, now, (room) =>
					Rooms.start(room, session.id, random)
				);
			case 'end':
				return change(session, body, now, (room) =>
					Rooms.end(room, session.id)
				);
			case 'move': {
				const room = tableOf(session, now);
				const mine = Rooms.seatsOf(room, session.id);
				const seat =
					body.seat ?? (mine.length === 1 ? mine[0] : undefined);
				if (seat === undefined) {
					throw new PlayerError('Choose the seat you are playing.');
				}
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
					mine.includes(seat) ? seat : undefined
				);
			}
			case 'leave': {
				const room = tableOf(session, now);
				const { room: next, saved } = Rooms.leave(room, session.id);
				commit(room.code, next, now);
				session.code = null;
				return { saved, code: room.code };
			}
		}
		throw new HttpError(404, 'Unknown request.');
	}

	/**
	 * Answers one /api/ request.
	 * @param {import('node:http').IncomingMessage} req
	 * @param {import('node:http').ServerResponse} res
	 * @param {string | undefined} address - The client's address, for the per-address limits
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
			const result = await route(name, req, url, address, Date.now());
			if (result && typeof result === 'object' && WAITING in result) {
				wait({ res, .../** @type {any} */ (result)[WAITING] });
				return;
			}
			sendJson(res, 200, result);
		} catch (error) {
			if (error instanceof HttpError) {
				return sendJson(res, error.status, { error: error.message });
			}
			if (error instanceof PlayerError) {
				return sendJson(res, 400, { error: error.message });
			}
			throw error;
		}
	}

	/**
	 * Housekeeping, once a minute: tables idle for a day close (their waiting requests are answered), unused sessions
	 * end, and quiet addresses are forgotten.
	 * @param {number} [now]
	 */
	function sweep(now = Date.now()) {
		for (const code of Rooms.expireRooms(rooms, now)) {
			wake(code);
		}
		for (const [token, session] of sessions) {
			if (now - session.used > config.sessionMs) {
				sessions.delete(token);
			}
		}
		creates.sweep(now);
		logins.sweep(now);
	}

	return {
		handle,
		sweep,
		waiting: () =>
			[...waiters.values()].reduce((sum, list) => sum + list.size, 0),
	};
}
