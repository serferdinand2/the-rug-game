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
 * A player's name as the table shows it: spaces squeezed, control characters removed, at most 24 characters.
 * @param {unknown} name
 * @returns {string}
 * @throws {PlayerError} When nothing is left
 */
export function cleanName(name) {
	const squeezed = String(name ?? '')
		.replace(/\s+/g, ' ')
		.replace(/\p{Cc}/gu, '')
		.trim();
	const clean = Array.from(squeezed).slice(0, NAME_LENGTH).join('').trim();
	if (!clean) {
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
 * The mode and options after `changes`, checked as the engine checks them.
 * @param {Mode} mode
 * @param {RoomOptions} options
 * @param {RoomChanges} changes
 * @returns {{ mode: Mode, options: RoomOptions }}
 * @throws {PlayerError} For an unknown mode, options the engine refuses, a bad level, or solo play (#31)
 */
function settle(mode, options, changes) {
	const next = changes.mode ?? mode;
	if (!MODES.includes(next)) {
		throw new PlayerError(`Unknown table mode: ${next}.`);
	}
	const merged = {
		version: changes.version ?? options.version,
		expansions: [...(changes.expansions ?? options.expansions)],
		variants: [...(changes.variants ?? options.variants)],
	};
	checkOptions(merged);
	if (next !== 'solo') {
		if (changes.level !== undefined && changes.level !== null) {
			throw new PlayerError('Only a solo table has an Automa level.');
		}
		return { mode: next, options: { ...merged, level: null } };
	}
	const level = changes.level ?? options.level ?? DEFAULT_LEVEL;
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
 * @param {RoomChanges} [options] - Defaults: online, the current official rules, no expansions, no variants
 * @param {number} [now] - Milliseconds, for expiry
 * @returns {Room}
 * @throws {PlayerError} For a bad name, mode or option
 */
export function createRoom(code, person, options = {}, now = 0) {
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
 * and while the host is alone, and then only the host's first seat stays.
 * @param {Room} room
 * @param {string} personId
 * @param {RoomChanges} changes
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
		if (room.seats.some((s) => s.player !== room.host)) {
			throw new PlayerError(
				'The other players must leave before the mode changes.'
			);
		}
	}
	if (
		mode === room.mode &&
		JSON.stringify(options) === JSON.stringify(room.options)
	) {
		return room;
	}
	return {
		...room,
		mode,
		options,
		seats: mode === room.mode ? room.seats : [room.seats[0]],
	};
}

/**
 * A person sits down: a present person changes nothing, an away one takes their seats back, and anyone else takes
 * the next seat at an online table where no game is running.
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
	if (room.seats.length >= MAX_SEATS) {
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
	if (room.seats.length >= MAX_SEATS) {
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
 * In the lobby, the host clears a seat: online any seat but their own, at a hot-seat table any seat but the last.
 * @param {Room} room
 * @param {string} personId
 * @param {number} seat - 1 to the number of seats
 * @returns {Room}
 * @throws {PlayerError}
 */
export function removeSeat(room, personId, seat) {
	if (personId !== room.host) {
		throw new PlayerError('Only the host can remove a player.');
	}
	if (phase(room) !== 'lobby') {
		throw new PlayerError(
			'Players can only be removed before the game starts.'
		);
	}
	const target = Number.isInteger(seat) ? room.seats[seat - 1] : undefined;
	if (!target || seat < 1) {
		throw new PlayerError('There is no such seat.');
	}
	if (room.mode === 'hotseat') {
		if (room.seats.length === 1) {
			throw new PlayerError('A table needs at least one player.');
		}
	} else if (target.player === room.host) {
		throw new PlayerError("The host can't remove their own seat.");
	}
	return withHost({
		...room,
		seats: room.seats.filter((s) => s !== target),
	});
}

/**
 * A person leaves. In the lobby their seats go, and the last one out closes the room. During a game, and after it,
 * their seats are marked away, so the seat numbers still match the game; a finished table closes once nobody
 * present is left, a running one never.
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
	if (now === 'lobby') {
		const seats = room.seats.filter((s) => s.player !== personId);
		return {
			room: seats.length > 0 ? withHost({ ...room, seats }) : null,
			saved: false,
		};
	}
	const seats = room.seats.map((seat) =>
		seat.player === personId && !seat.away
			? { ...seat, away: /** @type {true} */ (true) }
			: seat
	);
	const changed = seats.some((seat, i) => seat !== room.seats[i]);
	const next = changed ? withHost({ ...room, seats }) : room;
	if (now === 'finished' && next.seats.every((s) => s.away)) {
		return { room: null, saved: false };
	}
	return { room: next, saved: now === 'playing' };
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
	const seats = room.seats
		.filter((s) => !s.away)
		.map(({ player, name }) => ({ player, name }));
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
 * @throws {PlayerError} Once MAX_ROOMS tables are open
 */
export function addRoom(rooms, room) {
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
 * Another table where a person holds a seat, away or not, in a game still running. The server keeps them from
 * sitting down elsewhere until it ends, as Bird Table does.
 * @param {Map<string, Room>} rooms - By code
 * @param {string} personId
 * @param {string} exceptCode - The table they are trying to sit at
 * @returns {string | null} Its code
 */
export function unfinishedSeat(rooms, personId, exceptCode) {
	for (const room of rooms.values()) {
		if (
			room.code !== exceptCode &&
			phase(room) === 'playing' &&
			room.seats.some((s) => s.player === personId)
		) {
			return room.code;
		}
	}
	return null;
}
