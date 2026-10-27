// Room rules: a table's seats, host, options and settings, its lobby → playing → finished cycle, readiness, its clocks and its undo history, as pure transitions (#22, #24, #25).
import {
	askedSeats,
	checkOptions,
	createGame,
	declineOnly,
	defaultAction,
	EXPANSIONS_BUILT,
	play as playGame,
	PlayerError,
	restore,
	revealed,
	timedOut,
	VARIANTS,
	VERSIONS,
	view,
} from '../src/lib/engine/game.js';

/** @typedef {import('../src/lib/engine/state.js').State} State */
/** @typedef {import('../src/lib/engine/random.js').Random} Random */
/** @typedef {'online' | 'hotseat' | 'solo'} Mode */
/**
 * The options a table's game is dealt with. They are fixed once a game is dealt.
 * @typedef {Object} RoomOptions
 * @property {import('../src/lib/engine/data/ids.js').VersionId} version
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
 * @property {true} [ready] - The person said they are ready, in an online lobby (#25); it decides nothing
 */
/**
 * A seat's clock, in the server's milliseconds (#24 design §5). A running clock has `ends`, a paused one `left`.
 * @typedef {Object} Clock
 * @property {string} scope - What it covers, from scopeOf(): it carries over only while that stays the same
 * @property {number} [ends] - When it runs out
 * @property {number} [left] - What it has left while paused
 * @property {true} [expired] - It has run out, and the server plays for the seat
 */
/**
 * One choice the undo history can take back (#24 design §8): the game as it was before the choice.
 * @typedef {Object} Step
 * @property {State} game
 * @property {number} seat - Who chose
 * @property {number} turn - The game's turn number before the choice
 * @property {Record<number, Clock>} clocks - The clocks before the choice, by seat
 */
/**
 * A response to a conquest that only the decline answers, which the server answers at `at` (#24 design §7).
 * @typedef {Object} Decline
 * @property {number} decision - The open chooseResponse's id
 * @property {number} player - The defender's seat
 * @property {number} at - When, in milliseconds
 */
/**
 * The times the clocks and declines use; the server reads them from its config, and tests shorten them.
 * @typedef {Object} Timing
 * @property {number} minuteMs - A minute of the timer
 * @property {number} declineMinMs - The soonest a decline-only response is answered
 * @property {number} declineMaxMs - The latest
 */
/**
 * One table.
 * @typedef {Object} Room
 * @property {string} code
 * @property {Mode} mode
 * @property {RoomOptions} options
 * @property {number} timer - Minutes on each clock, one of TIMERS; 0 is off
 * @property {boolean} undo - Whether players may take back their own choices
 * @property {string} host - The id of the person who hosts; they always hold a seat
 * @property {RoomSeat[]} seats
 * @property {State | null} game
 * @property {number} deal - Deals so far: 0 before the first, then 1 more at each start (#29)
 * @property {Record<number, Clock>} clocks - By game seat; empty unless a game is running with the timer on
 * @property {Decline[]} declines - Never shown: a screen that saw one would know the defender holds no trap
 * @property {Step[]} history - The undo history, newest last; never shown
 * @property {number} touched - When anyone last used the table, in milliseconds; the server keeps it up to date (#23)
 */
/** @typedef {{ id: string, name: string }} Person */
/**
 * What one person sees of a table (#23 design §7): seats by number and name, never the people behind them.
 * @typedef {Object} RoomView
 * @property {string} code
 * @property {Mode} mode
 * @property {RoomOptions} options
 * @property {number} timer
 * @property {boolean} undo
 * @property {'lobby' | 'playing' | 'finished'} phase
 * @property {number} host - The seat number of the host's first seat
 * @property {{ seat: number, name: string, away: boolean, ready: boolean }[]} seats
 * @property {number[]} you - The seats this person plays
 * @property {number | null} viewing - The seat whose view `game` is; null for the public view
 * @property {import('../src/lib/engine/view.js').View | null} game
 * @property {{ seat: number, ends?: number, left?: number, expired: boolean }[]} clocks - In seat order
 * @property {boolean} canUndo - Whether the seat shown can take back its last choice
 */
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

/** The timer's lengths in minutes; 0 is off (#24). */
export const TIMERS = Object.freeze([0, 1, 2, 5]);

/** Most choices the undo history keeps: the oldest goes first (#24 design §8). */
export const HISTORY_LIMIT = 20;

/** Most automatic answers one timeout gives before it stops as a bug (#24 design §6). */
export const AUTO_LIMIT = 1_000;

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
		timer: 0,
		undo: true,
		host: person.id,
		seats: [{ player: person.id, name }],
		game: null,
		deal: 0,
		clocks: {},
		declines: [],
		history: [],
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
	return unready({ ...room, mode, options });
}

/**
 * The host sets the timer and switches undo, in the lobby, during a game or at a finished table: with no kick, the
 * timer is how a host keeps a table moving (#24 design §4). A new timer restarts every clock (tick() starts them
 * again), and off clears them. A new timer also empties the undo history, since an undo puts back the clocks of its
 * step: it would bring back a clock of the old length, or a fresh one from a step taken with the timer off. Switching
 * undo off empties the history too.
 * @param {Room} room
 * @param {string} personId
 * @param {{ timer?: unknown, undo?: unknown } | null} changes - Straight from a request; unset ones stay
 * @returns {Room} The same room when nothing changes
 * @throws {PlayerError}
 */
export function settings(room, personId, changes) {
	if (personId !== room.host) {
		throw new PlayerError('Only the host can change the table.');
	}
	const asked = changes ?? {};
	const timer = asked.timer === undefined ? room.timer : asked.timer;
	const undo = asked.undo === undefined ? room.undo : asked.undo;
	if (!TIMERS.includes(/** @type {number} */ (timer))) {
		throw new PlayerError('Choose a timer of off, 1, 2 or 5 minutes.');
	}
	if (typeof undo !== 'boolean') {
		throw new PlayerError('Choose whether undo is on.');
	}
	if (timer === room.timer && undo === room.undo) {
		return room;
	}
	return unready({
		...room,
		timer: /** @type {number} */ (timer),
		undo,
		clocks: timer === room.timer ? room.clocks : {},
		history: undo && timer === room.timer ? room.history : [],
	});
}

/**
 * The room with nobody ready: a host change means READY no longer says yes to the table as it is (#25 design §6.4).
 * @param {Room} room
 * @returns {Room}
 */
function unready(room) {
	if (!room.seats.some((s) => s.ready)) {
		return room;
	}
	return {
		...room,
		seats: room.seats.map(({ ready: _ready, ...seat }) => seat),
	};
}

/**
 * A player at an online lobby says whether they are ready (#25 design §6.4). It is only a sign to the others: the
 * host may start without it.
 * @param {Room} room
 * @param {string} personId
 * @param {unknown} isReady - Straight from a request
 * @returns {Room} The same room when nothing changes
 * @throws {PlayerError}
 */
export function ready(room, personId, isReady) {
	const index = room.seats.findIndex((s) => s.player === personId);
	if (index < 0) {
		throw new PlayerError("You aren't at this table.");
	}
	if (room.mode === 'hotseat') {
		throw new PlayerError('Everyone here shares one screen.');
	}
	if (room.game) {
		throw new PlayerError('The game has already started.');
	}
	if (typeof isReady !== 'boolean') {
		throw new PlayerError('Choose whether you are ready.');
	}
	if ((room.seats[index].ready === true) === isReady) {
		return room;
	}
	const { ready: _ready, ...seat } = room.seats[index];
	const seats = room.seats.with(
		index,
		isReady ? { ...seat, ready: /** @type {true} */ (true) } : seat
	);
	return { ...room, seats };
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
	return withHost({
		...room,
		seats,
		game,
		// Each deal numbers its events from 1 again, so the client tells deals apart by this (#29 design §3).
		deal: (room.deal ?? 0) + 1,
		clocks: {},
		declines: [],
		history: [],
	});
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
		clocks: {},
		declines: [],
		history: [],
	};
}

/**
 * The game, once it is checked that the person plays the seat and is present at it.
 * @param {Room} room
 * @param {string} personId
 * @param {number} seat
 * @returns {State}
 * @throws {PlayerError}
 */
function playable(room, personId, seat) {
	if (!room.game) {
		throw new PlayerError('Start the game first.');
	}
	if (!seatsOf(room, personId).includes(seat)) {
		throw new PlayerError("That seat isn't yours.");
	}
	if (room.seats[seat - 1].away) {
		throw new PlayerError('Come back to the table first.');
	}
	return room.game;
}

/**
 * A person answers a decision of the game for a seat they play and are present at. The engine does the rest, and the
 * undo history keeps the choice when it can be taken back (see remember()).
 * @param {Room} room
 * @param {string} personId
 * @param {number} seat
 * @param {{ decision: number } & Record<string, any>} action
 * @param {Random} random
 * @returns {Room}
 * @throws {PlayerError}
 */
export function play(room, personId, seat, action, random) {
	const before = playable(room, personId, seat);
	let drawn = false;
	const after = playGame(before, seat, action, (n) => {
		drawn = true;
		return random(n);
	});
	return {
		...room,
		game: after,
		history: remember(room, before, after, seat, drawn),
	};
}

/**
 * The undo history after a seat's choice (#24 design §8). The choice is kept only when the turn's player made it in
 * their own turn of a game in play, and taking it back can't show anything or dodge anything:
 * - nothing random was drawn (a die roll, a shuffle) and nothing hidden changed (`revealed()`);
 * - the game goes on, so the final ranking can't be taken back;
 * - nobody else is asked while the turn is still theirs, such as a defender (a response still open after 10 seconds
 *   would tell them the defender holds a trap). Once the turn has passed, the next player is asked because of that,
 *   and the last choice of the turn can still be taken back until the next player's first choice.
 * Any other choice empties the history. A kept choice starts the history afresh when the last step was another seat's
 * or another turn's, so the history only ever holds one seat's choices in one turn.
 * @param {Room} room - Before the choice
 * @param {State} before
 * @param {State} after
 * @param {number} seat
 * @param {boolean} drawn - Whether the engine drew a random number
 * @returns {Step[]}
 */
function remember(room, before, after, seat, drawn) {
	const kept =
		room.undo &&
		before.phase === 'play' &&
		seat === before.current &&
		!drawn &&
		after.phase !== 'over' &&
		!revealed(before, after) &&
		(after.turn !== before.turn ||
			askedSeats(after).every((asked) => asked === seat));
	if (!kept) {
		return [];
	}
	const last = room.history.at(-1);
	const earlier =
		last && last.seat === seat && last.turn === before.turn
			? room.history
			: [];
	return [
		...earlier,
		{ game: before, seat, turn: before.turn, clocks: room.clocks },
	].slice(-HISTORY_LIMIT);
}

/**
 * A person takes back the last choice of a seat they play and are present at (#24 design §8): the game goes back to
 * how it was before that choice, with its log carried on and an `undone` event, and the clocks go back to that step's.
 * The end times are absolute, so the time spent still counts; a clock that has run out meanwhile is due at once.
 * @param {Room} room
 * @param {string} personId
 * @param {number} seat
 * @returns {Room}
 * @throws {PlayerError}
 */
export function undo(room, personId, seat) {
	const game = playable(room, personId, seat);
	if (!room.undo) {
		throw new PlayerError('Undo is off at this table.');
	}
	const step = room.history.at(-1);
	if (!step) {
		throw new PlayerError('There is nothing to undo.');
	}
	if (step.seat !== seat) {
		throw new PlayerError('You can only take back your own choices.');
	}
	return {
		...room,
		game: restore(step.game, game, seat),
		clocks: step.clocks,
		history: room.history.slice(0, -1),
	};
}

/**
 * What a seat's clock covers (#24 design §5): all of setup; for the turn's player, the whole turn, so a new turn, even
 * the same player's next one, starts a fresh clock; for anyone else, being asked during this turn.
 * @param {State} game
 * @param {number} seat
 * @returns {string}
 */
export function scopeOf(game, seat) {
	if (game.phase === 'setup') {
		return 'setup';
	}
	return seat === game.current ? `turn:${game.turn}` : `asked:${game.turn}`;
}

/**
 * Brings the clocks and the declines up to date after any change (#24 design §5, §7).
 * - A clock carries over only while its scope stays the same. A setup or turn clock pauses while its seat isn't
 *   asked and resumes with what it had left; any other clock goes. A seat asked without a clock gets a fresh one.
 *   With the timer off, or no game running, there are none.
 * - A response only the decline answers is scheduled 3 to 10 seconds out (`timing`'s range) while a game runs, with
 *   the timer on or off, and keeps its time until it is answered. Not at a hot-seat table: there the defender answers
 *   through the pass screen like any other question, so a decline that came by itself would give the no-trap defender
 *   away (#30 design §4).
 * @param {Room} room
 * @param {number} now - Milliseconds
 * @param {Timing} timing
 * @param {Random} random - Draws each new decline's wait
 * @returns {Room} The same room when nothing changes
 */
export function tick(room, now, timing, random) {
	const game = room.game;
	const running = game !== null && game.phase !== 'over';
	const declines =
		running && room.mode !== 'hotseat'
			? schedule(room, game, now, timing, random)
			: [];
	const clocks =
		running && room.timer > 0 ? runClocks(room, game, now, timing) : {};
	if (
		JSON.stringify(clocks) === JSON.stringify(room.clocks) &&
		JSON.stringify(declines) === JSON.stringify(room.declines)
	) {
		return room;
	}
	return { ...room, clocks, declines };
}

/**
 * The clocks of a running game with the timer on, as tick() keeps them.
 * @param {Room} room
 * @param {State} game
 * @param {number} now
 * @param {Timing} timing
 * @returns {Record<number, Clock>}
 */
function runClocks(room, game, now, timing) {
	const asked = new Set(askedSeats(game));
	const seats = new Set([...asked, ...Object.keys(room.clocks).map(Number)]);
	/** @type {Record<number, Clock>} */
	const clocks = {};
	for (const seat of [...seats].sort((a, b) => a - b)) {
		const scope = scopeOf(game, seat);
		const held = room.clocks[seat];
		const kept = held && held.scope === scope ? held : null;
		const expired = kept?.expired ? { expired: kept.expired } : {};
		if (asked.has(seat)) {
			if (!kept) {
				clocks[seat] = {
					scope,
					ends: now + room.timer * timing.minuteMs,
				};
			} else if (kept.left !== undefined) {
				clocks[seat] = { scope, ends: now + kept.left, ...expired };
			} else {
				clocks[seat] = kept;
			}
		} else if (kept && !scope.startsWith('asked:')) {
			clocks[seat] =
				kept.ends !== undefined
					? { scope, left: Math.max(0, kept.ends - now), ...expired }
					: kept;
		}
	}
	return clocks;
}

/**
 * The declines of a running game: each open decline-only response keeps its time, and a new one draws its own.
 * @param {Room} room
 * @param {State} game
 * @param {number} now
 * @param {Timing} timing
 * @param {Random} random
 * @returns {Decline[]}
 */
function schedule(room, game, now, timing, random) {
	return declineOnly(game).map(
		({ decision, player }) =>
			room.declines.find((d) => d.decision === decision) ?? {
				decision,
				player,
				at:
					now +
					timing.declineMinMs +
					random(timing.declineMaxMs - timing.declineMinMs + 1),
			}
	);
}

/**
 * Plays what the clocks and declines have made due (#24 design §6, §7), with the default answers.
 * - A due decline is answered with no card, unless its decision is no longer open (the defender answered first).
 * - A running clock that has run out logs `timedOut` once, then its seat is answered with the default answer for as
 *   long as it is asked within the clock's scope; it waits when someone else is asked.
 * Any answer empties the undo history (a turn the timer finished can't be undone). The caller ticks afterwards.
 * @param {Room} room
 * @param {number} now - Milliseconds
 * @param {Random} random
 * @param {number} [limit] - Most automatic answers
 * @returns {Room} The same room when nothing is due
 * @throws {Error} When the limit is passed, which can only be a bug
 */
export function timeout(room, now, random, limit = AUTO_LIMIT) {
	let game = room.game;
	if (!game || game.phase === 'over') {
		return room;
	}
	const dueDeclines = room.declines.filter((decline) => decline.at <= now);
	const dueSeats = Object.keys(room.clocks)
		.map(Number)
		.filter((seat) => {
			const ends = room.clocks[seat].ends;
			return ends !== undefined && ends <= now;
		})
		.sort((a, b) => a - b);
	if (dueDeclines.length === 0 && dueSeats.length === 0) {
		return room;
	}
	let answers = 0;
	/**
	 * @param {State} state
	 * @param {number} seat
	 * @param {Record<string, any>} action
	 * @returns {State}
	 */
	const answer = (state, seat, action) => {
		answers++;
		if (answers > limit) {
			throw new Error('The timer could not finish the turn.');
		}
		return playGame(state, seat, /** @type {any} */ (action), random);
	};
	for (const decline of dueDeclines) {
		const open = declineOnly(game).some(
			(d) =>
				d.decision === decline.decision && d.player === decline.player
		);
		if (open) {
			game = answer(game, decline.player, {
				decision: decline.decision,
				card: null,
			});
		}
	}
	/** @type {Record<number, Clock>} */
	const clocks = { ...room.clocks };
	for (const seat of dueSeats) {
		const clock = room.clocks[seat];
		if (!clock.expired) {
			game = timedOut(game, seat);
			clocks[seat] = { scope: clock.scope, ends: now, expired: true };
		}
	}
	// Setup seats wait for each other, so go round again while anyone could still be answered.
	for (let progressed = true; progressed;) {
		progressed = false;
		for (const seat of dueSeats) {
			const action =
				game.phase === 'over' ||
				scopeOf(game, seat) !== room.clocks[seat].scope
					? null
					: defaultAction(game, seat);
			if (action) {
				game = answer(game, seat, action);
				progressed = true;
			}
		}
	}
	const declines = room.declines.filter((decline) => decline.at > now);
	return {
		...room,
		game,
		declines,
		clocks,
		history: game === room.game ? room.history : [],
	};
}

/**
 * When the table next needs the server: the earliest running clock or decline. A paused clock waits for its seat.
 * @param {Room} room
 * @returns {number | null} Milliseconds; null when nothing is due
 */
export function nextDeadline(room) {
	const times = [
		...Object.values(room.clocks).flatMap((clock) =>
			clock.ends === undefined ? [] : [clock.ends]
		),
		...room.declines.map((decline) => decline.at),
	];
	return times.length > 0 ? Math.min(...times) : null;
}

/** Most tables the server keeps at once: a single process keeps them all in memory. */
export const MAX_ROOMS = 1000;

/** How long a table nobody uses is kept: a day, as in Fablewood and Bird Table. */
export const ROOM_IDLE_MS = 24 * 60 * 60 * 1000;

/**
 * How long a lobby nobody uses is kept: an hour. A lobby's clients ask after it every few seconds, so only an
 * abandoned one goes quiet, and abandoned ones mustn't fill the server (#23 design §9).
 */
export const LOBBY_IDLE_MS = 60 * 60 * 1000;

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
 * Removes every room nobody has used for more than ROOM_IDLE_MS, and every lobby nobody has used for more than
 * LOBBY_IDLE_MS.
 * @param {Map<string, Room>} rooms - By code; changed in place
 * @param {number} now - Milliseconds
 * @returns {string[]} The codes removed, so the server can answer their waiting requests
 */
export function expireRooms(rooms, now) {
	const expired = [...rooms.values()]
		.filter(
			(room) =>
				now - room.touched >
				(phase(room) === 'lobby' ? LOBBY_IDLE_MS : ROOM_IDLE_MS)
		)
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

/**
 * What one person sees of a table: the only way a room leaves the server (#23 design §7). Online they see the game
 * as their own seat; at a hot-seat table, as the seat they ask for, or the public view until they ask, so nothing
 * private shows before the pass screen (#30) picks a seat.
 * @param {Room} room
 * @param {string} personId
 * @param {number} [seat] - One of the person's seats
 * @returns {RoomView}
 * @throws {PlayerError} For a person with no seat here, or a seat they don't play
 */
export function roomView(room, personId, seat) {
	const you = seatsOf(room, personId);
	if (you.length === 0) {
		throw new PlayerError("You aren't at this table.");
	}
	if (seat !== undefined && !you.includes(seat)) {
		throw new PlayerError("That seat isn't yours.");
	}
	const viewing = seat ?? (room.mode === 'hotseat' ? null : you[0]);
	const last = room.history.at(-1);
	return {
		code: room.code,
		mode: room.mode,
		options: structuredClone(room.options),
		timer: room.timer,
		undo: room.undo,
		phase: phase(room),
		host: seatsOf(room, room.host)[0],
		seats: room.seats.map((s, i) => ({
			seat: i + 1,
			name: s.name,
			away: s.away === true,
			ready: s.ready === true,
		})),
		you,
		viewing,
		deal: room.deal ?? 0,
		game: room.game ? view(room.game, viewing) : null,
		// A clock's scope is the server's own bookkeeping: screens need only when it ends and whether it ran out.
		clocks: Object.entries(room.clocks).map(([seat, clock]) => ({
			seat: Number(seat),
			...(clock.ends === undefined
				? { left: clock.left }
				: { ends: clock.ends }),
			expired: clock.expired === true,
		})),
		// Whether undo() would take a choice back for the seat shown; never in the public view.
		canUndo:
			room.undo &&
			viewing !== null &&
			last !== undefined &&
			last.seat === viewing,
	};
}

/**
 * What a new table may choose today, for the new-table screen (#25), so it never offers what the engine refuses.
 * Solo joins the modes with the Automa (#31).
 * @returns {{ modes: Mode[], versions: { id: string, name: string }[], expansions: string[], variants: { id: string, name: string }[], levels: number[], maxSeats: number, timers: number[] }}
 */
export function tableChoices() {
	return {
		modes: ['online', 'hotseat'],
		versions: VERSIONS.map(({ id, name }) => ({ id, name })),
		expansions: [...EXPANSIONS_BUILT],
		variants: VARIANTS.map(({ id, name }) => ({ id, name })),
		levels: [...LEVELS],
		maxSeats: MAX_SEATS,
		timers: [...TIMERS],
	};
}
