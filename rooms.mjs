// Room rules: a table's seats, host and options, and its lobby → playing → finished cycle, as pure transitions (#22).
import {
	checkOptions,
	createGame,
	play as playGame,
	PlayerError,
} from './src/lib/engine/game.js';

/** @typedef {import('./src/lib/engine/state.js').State} State */
/** @typedef {import('./src/lib/engine/random.js').Random} Random */
/** @typedef {'online' | 'hotseat' | 'solo'} Mode */
/**
 * The options a table's game is dealt with. They are fixed once a game is dealt.
 * @typedef {Object} RoomOptions
 * @property {import('./src/lib/engine/data/ids.js').VersionId} version
 * @property {string[]} expansions
 * @property {string[]} variants - Official optional variants (#53)
 * @property {number | null} level - The Automa's level at a solo table, 1 to 6; null at any other
 */
/**
 * A place in the game. Seat `i` of a room is seat `i + 1` of its game.
 * @typedef {Object} RoomSeat
 * @property {string} player - The id of the person who plays it; at a hot-seat table, the host for every seat
 * @property {string} name
 * @property {true} [away] - The person left a game in progress, or a finished one
 */
/**
 * One table.
 * @typedef {Object} Room
 * @property {string} code
 * @property {Mode} mode
 * @property {RoomOptions} options
 * @property {string} host - The id of the person who hosts; they always hold a seat
 * @property {RoomSeat[]} seats
 * @property {State | null} game
 * @property {number} touched - When anyone last used the table, in milliseconds; the server keeps it up to date (#23)
 */
/** @typedef {{ id: string, name: string }} Person */
/** @typedef {Partial<RoomOptions> & { mode?: Mode }} RoomChanges */

/** Most seats at a table (01 §1). */
export const MAX_SEATS = 5;

/** The table modes. */
export const MODES = /** @type {readonly Mode[]} */ (
	Object.freeze(['online', 'hotseat', 'solo'])
);

/** The Automa's levels, from Automa the Underachiever to Automa the Crusher of Dreams (02 §9.7). */
export const LEVELS = Object.freeze([1, 2, 3, 4, 5, 6]);

/** The Automa's default level, Automa the Average (02 §9.7). */
export const DEFAULT_LEVEL = 2;

/** Longest name, in characters, as in Fablewood and Bird Table. */
const NAME_LENGTH = 24;

/**
 * A player's name as the table shows it: spaces squeezed, control and invisible formatting characters removed (bidi
 * overrides among them, but not the joiner inside emoji), at most 24 characters.
 * @param {unknown} name
 * @returns {string}
 * @throws {PlayerError} When nothing visible is left
 */
export function cleanName(name) {
	const squeezed = String(name ?? '')
		.replace(/[\p{Cc}\p{Cf}]/gu, (c) =>
			/\s/.test(c) ? ' ' : c === '‍' ? c : ''
		)
		.replace(/\s+/g, ' ')
		.trim();
	const clean = Array.from(squeezed).slice(0, NAME_LENGTH).join('').trim();
	if (!/[\p{L}\p{N}\p{P}\p{S}]/u.test(clean)) {
		throw new PlayerError('Enter a name.');
	}
	return clean;
}

/**
 * `'lobby'` before the first deal, `'playing'` while the game runs, `'finished'` once it is over.
 * @param {Room} room
 * @returns {'lobby' | 'playing' | 'finished'}
 */
export function phase(room) {
	if (!room.game) {
		return 'lobby';
	}
	return room.game.phase === 'over' ? 'finished' : 'playing';
}

/**
 * The seat numbers a person plays: online their own, at a hot-seat table every seat.
 * @param {Room} room
 * @param {string} personId
 * @returns {number[]}
 */
export function seatsOf(room, personId) {
	return room.seats.flatMap((seat, i) =>
		seat.player === personId ? [i + 1] : []
	);
}

/**
 * Whether a person holds a seat that isn't away.
 * @param {Room} room
 * @param {string} personId
 */
function isPresent(room, personId) {
	return room.seats.some((s) => s.player === personId && !s.away);
}

/**
 * The seats that aren't away.
 * @param {Room} room
 */
const presentSeats = (room) => room.seats.filter((s) => !s.away);

/**
 * Keeps the host rule: the host holds a seat, and is present whenever anyone is. Otherwise the role passes to the
 * first present person in seat order.
 * @param {Room} room
 * @returns {Room}
 */
function withHost(room) {
	if (isPresent(room, room.host)) {
		return room;
	}
	const next =
		room.seats.find((s) => !s.away) ??
		room.seats.find((s) => s.player === room.host) ??
		room.seats[0];
	return next.player === room.host ? room : { ...room, host: next.player };
}

/**
 * Clears seats: one dealt in the game on the table is marked away, so the seat numbers still match it; any other
 * (every seat in the lobby, a newcomer's at a finished table) goes.
 * @param {Room} room
 * @param {(seat: RoomSeat) => boolean} which
 * @returns {Room} The same room when nothing changes
 */
function vacate(room, which) {
	const dealt = room.game ? room.game.seats.length : 0;
	let changed = false;
	const seats = room.seats.flatMap((seat, i) => {
		if (!which(seat) || seat.away) {
			return [seat];
		}
		changed = true;
		return i < dealt ? [{ ...seat, away: /** @type {true} */ (true) }] : [];
	});
	return changed ? { ...room, seats } : room;
}

/**
 * The mode and options after `changes`, checked as the engine checks them before anything is copied.
 * @param {Mode} mode
 * @param {RoomOptions} options
 * @param {unknown} changes - Straight from a request: anything
 * @returns {{ mode: Mode, options: RoomOptions }}
 * @throws {PlayerError} For changes that aren't an object, an unknown mode, options the engine refuses, a bad level,
 *   or solo play (#31)
 */
function settle(mode, options, changes) {
	if (changes === null || changes === undefined) {
		changes = {};
	}
	if (typeof changes !== 'object' || Array.isArray(changes)) {
		throw new PlayerError('Choose the table options.');
	}
	const asked = /** @type {Record<string, unknown>} */ (changes);
	const next = asked.mode ?? mode;
	if (!MODES.includes(/** @type {Mode} */ (next))) {
		throw new PlayerError(`Unknown table mode: ${next}.`);
	}
	const raw = {
		version: asked.version ?? options.version,
		expansions: asked.expansions ?? options.expansions,
		variants: asked.variants ?? options.variants,
	};
	checkOptions(raw);
	const merged = {
		version: /** @type {RoomOptions['version']} */ (raw.version),
		expansions: [.../** @type {string[]} */ (raw.expansions)],
		variants: [.../** @type {string[]} */ (raw.variants)],
	};
	if (next !== 'solo') {
		if (asked.level !== undefined && asked.level !== null) {
			throw new PlayerError('Only a solo table has an Automa level.');
		}
		return {
			mode: /** @type {Mode} */ (next),
			options: { ...merged, level: null },
		};
	}
	const level = asked.level ?? options.level ?? DEFAULT_LEVEL;
	if (!LEVELS.includes(/** @type {number} */ (level))) {
		throw new PlayerError('Choose an Automa level from 1 to 6.');
	}
	// The Automa and the Shadow Empire are #31: until then a solo game can't be dealt.
	throw new PlayerError("Solo play isn't available yet.");
}

/**
 * A new table, hosted by its creator in seat 1.
 * @param {string} code
 * @param {Person} person
 * @param {RoomChanges | null} options - Unset ones default to online, the current official rules, no expansions and
 *   no variants
 * @param {number} now - Milliseconds, for expiry. Required: a forgotten one would expire the table at the next sweep
 * @returns {Room}
 * @throws {PlayerError} For a bad name, mode or option
 * @throws {TypeError} Without the time
 */
export function createRoom(code, person, options, now) {
	if (!Number.isFinite(now)) {
		throw new TypeError('createRoom needs the time.');
	}
	const name = cleanName(person.name);
	const settled = settle(
		'online',
		{ version: 'current', expansions: [], variants: [], level: null },
		options
	);
	return {
		code,
		...settled,
		host: person.id,
		seats: [{ player: person.id, name }],
		game: null,
		touched: now,
	};
}

/**
 * The host changes the mode or the options, while no game is running. The mode changes only before the first deal
 * and while the table has one seat, so nobody is dropped by surprise.
 * @param {Room} room
 * @param {string} personId
 * @param {RoomChanges | null} changes
 * @returns {Room} The same room when nothing changes
 * @throws {PlayerError}
 */
export function configure(room, personId, changes) {
	if (personId !== room.host) {
		throw new PlayerError('Only the host can change the table.');
	}
	if (phase(room) === 'playing') {
		throw new PlayerError('The game has already started.');
	}
	const { mode, options } = settle(room.mode, room.options, changes);
	if (mode !== room.mode) {
		if (room.game) {
			throw new PlayerError('Start a new table to change the mode.');
		}
		if (room.seats.length > 1) {
			throw new PlayerError(
				room.mode === 'hotseat'
					? 'Remove the other players before the mode changes.'
					: 'The other players must leave before the mode changes.'
			);
		}
	}
	if (
		mode === room.mode &&
		JSON.stringify(options) === JSON.stringify(room.options)
	) {
		return room;
	}
	return { ...room, mode, options };
}

/**
 * A person sits down: a present person changes nothing, an away one takes their seats back, and anyone else takes
 * the next seat at an online table where no game is running and fewer than 5 people are present.
 * @param {Room} room
 * @param {Person} person
 * @returns {Room}
 * @throws {PlayerError}
 */
export function join(room, person) {
	const name = cleanName(person.name);
	const mine = room.seats.filter((s) => s.player === person.id);
	if (mine.length > 0) {
		if (!mine.some((s) => s.away)) {
			return room;
		}
		// Newcomers may have filled a finished table; a running game has a place for everyone dealt.
		if (presentSeats(room).length >= MAX_SEATS) {
			throw new PlayerError('This table is full.');
		}
		return withHost({
			...room,
			seats: room.seats.map((seat) => {
				if (seat.player !== person.id) {
					return seat;
				}
				const { away: _away, ...back } = seat;
				return back;
			}),
		});
	}
	if (room.mode !== 'online') {
		throw new PlayerError('This table is played on one screen.');
	}
	if (phase(room) === 'playing') {
		throw new PlayerError('This game has already started.');
	}
	// At a finished table the away seats aren't dealt again, so they leave room for newcomers.
	if (presentSeats(room).length >= MAX_SEATS) {
		throw new PlayerError('This table is full.');
	}
	return withHost({
		...room,
		seats: [...room.seats, { player: person.id, name }],
	});
}

/**
 * The host of a hot-seat table seats a player by name, while no game is running.
 * @param {Room} room
 * @param {string} personId
 * @param {unknown} name
 * @returns {Room}
 * @throws {PlayerError}
 */
export function addSeat(room, personId, name) {
	if (room.mode !== 'hotseat') {
		throw new PlayerError('Only a hot-seat table seats players by name.');
	}
	if (personId !== room.host) {
		throw new PlayerError('Only the host can add players.');
	}
	if (phase(room) === 'playing') {
		throw new PlayerError('This game has already started.');
	}
	if (presentSeats(room).length >= MAX_SEATS) {
		throw new PlayerError('This table is full.');
	}
	const clean = cleanName(name);
	// The pass screen (#30) tells the players at one screen apart by name.
	if (room.seats.some((s) => s.name.toLowerCase() === clean.toLowerCase())) {
		throw new PlayerError(
			'Each player at this screen needs a different name.'
		);
	}
	return {
		...room,
		seats: [...room.seats, { player: room.host, name: clean }],
	};
}

/**
 * While no game is running, the host clears a seat (the X on a player card): online any seat but their own, at a
 * hot-seat table any seat while another present one remains. At a finished table a dealt seat is only marked away,
 * so it isn't dealt into the next game.
 * @param {Room} room
 * @param {string} personId
 * @param {number} seat - 1 to the number of seats
 * @returns {Room} The same room for a seat already away
 * @throws {PlayerError}
 */
export function removeSeat(room, personId, seat) {
	if (personId !== room.host) {
		throw new PlayerError('Only the host can remove a player.');
	}
	if (phase(room) === 'playing') {
		throw new PlayerError(
			'Players can only be removed while no game is running.'
		);
	}
	const target = Number.isInteger(seat) ? room.seats[seat - 1] : undefined;
	if (!target || seat < 1) {
		throw new PlayerError('There is no such seat.');
	}
	if (target.away) {
		return room;
	}
	if (room.mode === 'hotseat') {
		if (presentSeats(room).length === 1) {
			throw new PlayerError('A table needs at least one player.');
		}
	} else if (target.player === room.host) {
		throw new PlayerError("The host can't remove their own seat.");
	}
	return withHost(vacate(room, (s) => s === target));
}

/**
 * A person leaves. In the lobby their seats go, and the last one out closes the room. A seat dealt in the game on
 * the table is marked away, so the seat numbers still match it; a newcomer's seat at a finished table goes. A
 * finished table closes once nobody present is left; a running one never does (the host may end it, see end()).
 * @param {Room} room
 * @param {string} personId
 * @returns {{ room: Room | null, saved: boolean }} `saved`: the seats wait for a game in progress
 * @throws {PlayerError} When the person holds no seat
 */
export function leave(room, personId) {
	if (!room.seats.some((s) => s.player === personId)) {
		throw new PlayerError("You aren't at this table.");
	}
	const now = phase(room);
	const next = vacate(room, (s) => s.player === personId);
	const closes =
		(now === 'lobby' && next.seats.length === 0) ||
		(now === 'finished' && presentSeats(next).length === 0);
	return {
		room: closes ? null : next === room ? room : withHost(next),
		saved: now === 'playing',
	};
}

/**
 * The host deals a game with the room's options, to every seat in the lobby, or to the present seats at a finished
 * table, whose away seats are dropped.
 * @param {Room} room
 * @param {string} personId
 * @param {Random} random
 * @returns {Room}
 * @throws {PlayerError}
 */
export function start(room, personId, random) {
	if (personId !== room.host) {
		throw new PlayerError('Only the host can start the game.');
	}
	if (phase(room) === 'playing') {
		throw new PlayerError('The game is already running.');
	}
	// Tapestry seats one human alone only against the Automa, which is #31.
	const seats = presentSeats(room).map(({ player, name }) => ({
		player,
		name,
	}));
	if (seats.length < 2) {
		throw new PlayerError('A game needs at least 2 players.');
	}
	const { version, expansions, variants } = room.options;
	const game = createGame({
		players: seats.map(({ name }) => ({ name })),
		version,
		expansions,
		variants,
		random,
	});
	return withHost({ ...room, seats, game });
}

/**
 * The host abandons a running game, and the table goes back to the lobby with the people present: at a hot-seat
 * table at any time, online once everyone else has left. Without it a game everyone left would hold its players
 * until the table expires.
 * @param {Room} room
 * @param {string} personId
 * @returns {Room}
 * @throws {PlayerError}
 */
export function end(room, personId) {
	if (phase(room) !== 'playing') {
		throw new PlayerError('There is no game to end.');
	}
	if (personId !== room.host) {
		throw new PlayerError('Only the host can end the game.');
	}
	if (!isPresent(room, personId)) {
		throw new PlayerError('Come back to the table first.');
	}
	if (presentSeats(room).some((s) => s.player !== personId)) {
		throw new PlayerError(
			'The game can end only once the other players have left.'
		);
	}
	return {
		...room,
		seats: presentSeats(room).map(({ player, name }) => ({ player, name })),
		game: null,
	};
}

/**
 * A person answers a decision of the game for a seat they play and are present at. The engine does the rest.
 * @param {Room} room
 * @param {string} personId
 * @param {number} seat
 * @param {{ decision: number } & Record<string, any>} action
 * @param {Random} random
 * @returns {Room}
 * @throws {PlayerError}
 */
export function play(room, personId, seat, action, random) {
	if (!room.game) {
		throw new PlayerError('Start the game first.');
	}
	if (!seatsOf(room, personId).includes(seat)) {
		throw new PlayerError("That seat isn't yours.");
	}
	if (room.seats[seat - 1].away) {
		throw new PlayerError('Come back to the table first.');
	}
	return { ...room, game: playGame(room.game, seat, action, random) };
}

/** Most tables the server keeps at once: a single process keeps them all in memory. */
export const MAX_ROOMS = 1000;

/** How long a table nobody uses is kept: a day, as in Fablewood and Bird Table. */
export const ROOM_IDLE_MS = 24 * 60 * 60 * 1000;

/** How many hexadecimal digits a table code has, as in Fablewood (`3f9a1c07`). */
const CODE_LENGTH = 8;

/**
 * A new table code: 8 lowercase hexadecimal digits that no room has yet.
 * @param {Map<string, Room>} rooms - By code
 * @param {Random} random - The server passes crypto.randomInt
 * @returns {string}
 */
export function newCode(rooms, random) {
	for (;;) {
		const code = Array.from({ length: CODE_LENGTH }, () =>
			random(16).toString(16)
		).join('');
		if (!rooms.has(code)) {
			return code;
		}
	}
}

/**
 * Keeps a new room in the server's map.
 * @param {Map<string, Room>} rooms - By code; changed in place
 * @param {Room} room
 * @throws {PlayerError} Once MAX_ROOMS tables are open; the server sweeps expired ones first (expireRooms)
 * @throws {Error} For a code that already has a room: newCode() never gives one
 */
export function addRoom(rooms, room) {
	if (rooms.has(room.code)) {
		throw new Error(`The code ${room.code} already has a room.`);
	}
	if (rooms.size >= MAX_ROOMS) {
		throw new PlayerError(
			'There are too many tables right now. Try again later.'
		);
	}
	rooms.set(room.code, room);
}

/**
 * Removes every room nobody has used for more than ROOM_IDLE_MS.
 * @param {Map<string, Room>} rooms - By code; changed in place
 * @param {number} now - Milliseconds
 * @returns {string[]} The codes removed, so the server can answer their waiting requests
 */
export function expireRooms(rooms, now) {
	const expired = [...rooms.values()]
		.filter((room) => now - room.touched > ROOM_IDLE_MS)
		.map((room) => room.code);
	for (const code of expired) {
		rooms.delete(code);
	}
	return expired;
}

/**
 * The tables the landing page lists: online lobbies with a free seat, most recently used first.
 * @param {Map<string, Room>} rooms - By code
 * @returns {{ code: string, host: string, seats: number, version: string, expansions: string[] }[]}
 */
export function openTables(rooms) {
	return [...rooms.values()]
		.filter(
			(room) =>
				room.mode === 'online' &&
				phase(room) === 'lobby' &&
				room.seats.length < MAX_SEATS
		)
		.sort((a, b) => b.touched - a.touched)
		.map((room) => ({
			code: room.code,
			host: room.seats.find((s) => s.player === room.host)?.name ?? '',
			seats: room.seats.length,
			version: room.options.version,
			expansions: [...room.options.expansions],
		}));
}

/**
 * Another online table where a person holds a seat, away or not, in a game still running. The server keeps them
 * from sitting down elsewhere until it ends, as Bird Table does, so nobody abandons the others by opening a new
 * table. A hot-seat game holds nobody: its host is the only one it affects.
 * @param {Map<string, Room>} rooms - By code
 * @param {string} personId
 * @param {string} exceptCode - The table they are trying to sit at
 * @returns {string | null} Its code
 */
export function unfinishedSeat(rooms, personId, exceptCode) {
	for (const room of rooms.values()) {
		if (
			room.code !== exceptCode &&
			room.mode === 'online' &&
			phase(room) === 'playing' &&
			room.seats.some((s) => s.player === personId)
		) {
			return room.code;
		}
	}
	return null;
}
