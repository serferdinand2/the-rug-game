// Tests for the room transitions (#22): creating, configuring, joining, leaving, starting and playing at a table, with the timer and undo in the random steps (#24).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import {
	HISTORY_LIMIT,
	MAX_ROOMS,
	LOBBY_IDLE_MS,
	MAX_SEATS,
	MODES,
	ROOM_IDLE_MS,
	TIMERS,
	addRoom,
	addSeat,
	cleanName,
	configure,
	createRoom,
	end,
	expireRooms,
	join,
	leave,
	newCode,
	openTables,
	phase,
	play,
	ready,
	removeSeat,
	roomView,
	seatsOf,
	settings,
	start,
	tableChoices,
	tick,
	timeout,
	undo,
	unfinishedSeat,
} from '../rooms.mjs';
import { checkOptions, PlayerError, VARIANTS } from '../src/lib/engine/game.js';
import { seededRandom } from '../src/lib/engine/random.js';
import { openDecisions } from '../src/lib/engine/stack.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import { checkState } from './helpers/invariants.mjs';

/** @typedef {import('../rooms.mjs').Room} Room */

/** A person, named after their id. @param {string} id */
const P = (id) => ({ id, name: id.toUpperCase() });
/** The ids seated, in seat order. @param {Room} room */
const ids = (room) => room.seats.map((s) => s.player);
/** An online lobby with these people seated in order. @param {...string} people */
const lobby = (...people) =>
	people
		.slice(1)
		.reduce(
			(r, id) => join(r, P(id)),
			createRoom('3f9a1c07', P(people[0]), {}, 0)
		);
/** A hot-seat lobby whose host is `a`, with these players by name. @param {...string} names */
const hotseat = (...names) =>
	names.reduce(
		(r, name) => addSeat(r, 'a', name),
		createRoom('3f9a1c07', P('a'), { mode: 'hotseat' }, 0)
	);
/** @param {Room} room */
const dealt = (room) => start(room, room.host, seededRandom(7));
/**
 * The room with its game marked over, as play() would leave it.
 * @param {Room} room
 * @returns {Room}
 */
const finish = (room) => ({
	...room,
	game: { .../** @type {any} */ (room.game), phase: 'over' },
});
/**
 * The first open decision of the room's game and its default answer, as an action.
 * @param {Room} room
 */
function firstAction(room) {
	const game = /** @type {any} */ (room.game);
	const decision = openDecisions(game)[0];
	const answer = DECISIONS[decision.kind].answers(game, decision)[0];
	return {
		seat: /** @type {number} */ (decision.player),
		action: { decision: decision.id, ...answer },
	};
}
/**
 * Asserts that `run` throws a PlayerError with exactly this message.
 * @param {() => unknown} run
 * @param {string} message
 */
function refuses(run, message) {
	assert.throws(run, { name: 'PlayerError', message });
}

test('the creator hosts seat 1 of an online table with the current rules', () => {
	const room = createRoom('3f9a1c07', { id: 'a', name: ' Ana ' }, {}, 5);
	assert.deepEqual(room, {
		code: '3f9a1c07',
		mode: 'online',
		options: {
			version: 'current',
			expansions: [],
			variants: [],
			level: null,
		},
		timer: 0,
		undo: true,
		host: 'a',
		seats: [{ player: 'a', name: 'Ana' }],
		game: null,
		deal: 0,
		clocks: {},
		declines: [],
		history: [],
		touched: 5,
	});
	assert.equal(phase(room), 'lobby');
	assert.deepEqual(seatsOf(room, 'a'), [1]);
	assert.deepEqual(seatsOf(room, 'b'), []);
});

test("a table's mode and options are checked when it is created", () => {
	const make = (/** @type {Record<string, unknown>} */ options) => () =>
		createRoom('3f9a1c07', P('a'), /** @type {any} */ (options), 0);
	assert.equal(
		createRoom('3f9a1c07', P('a'), { version: 'original' }, 0).options
			.version,
		'original'
	);
	assert.equal(
		createRoom('3f9a1c07', P('a'), { mode: 'hotseat' }, 0).mode,
		'hotseat'
	);
	refuses(make({ mode: 'dungeon' }), 'Unknown table mode: dungeon.');
	refuses(make({ version: '2024' }), 'Unknown rules version: 2024.');
	refuses(make({ expansions: ['pp'] }), "Plans & Ploys isn't available yet.");
	refuses(make({ variants: ['draft'] }), 'Unknown variant: draft.');
	refuses(make({ level: 3 }), 'Only a solo table has an Automa level.');
});

test('malformed options are refused as a player mistake, never a crash', () => {
	const base = lobby('a');
	const any = (/** @type {unknown} */ value) => /** @type {any} */ (value);
	refuses(
		() => createRoom('3f9a1c07', P('a'), any({ expansions: 'pp' }), 0),
		'The expansions must be a list.'
	);
	refuses(
		() => configure(base, 'a', any({ expansions: 5 })),
		'The expansions must be a list.'
	);
	refuses(
		() => configure(base, 'a', any({ variants: {} })),
		'The variants must be a list.'
	);
	refuses(
		() => configure(base, 'a', any({ mode: 7 })),
		'Unknown table mode: 7.'
	);
	refuses(
		() => configure(base, 'a', any('online')),
		'Choose the table options.'
	);
	assert.equal(configure(base, 'a', any(null)), base);
	assert.deepEqual(createRoom('3f9a1c07', P('a'), any(null), 0), base);
	assert.throws(
		() => createRoom('3f9a1c07', P('a'), {}, any(undefined)),
		TypeError,
		'the time is required, or a forgotten one would expire the table at once'
	);
});

test("solo tables check the Automa's level, then wait for the Automa (#31)", () => {
	const solo = (/** @type {unknown} */ level) => () =>
		createRoom(
			'3f9a1c07',
			P('a'),
			/** @type {any} */ ({ mode: 'solo', level }),
			0
		);
	refuses(solo(7), 'Choose an Automa level from 1 to 6.');
	refuses(solo(0), 'Choose an Automa level from 1 to 6.');
	refuses(solo('2'), 'Choose an Automa level from 1 to 6.');
	refuses(solo(2), "Solo play isn't available yet.");
	refuses(solo(undefined), "Solo play isn't available yet.");
	refuses(
		() => configure(lobby('a'), 'a', { mode: 'solo' }),
		"Solo play isn't available yet."
	);
});

test('only the host changes the options, and never during a game', () => {
	const room = lobby('a', 'b');
	refuses(
		() => configure(room, 'b', { version: 'original' }),
		'Only the host can change the table.'
	);
	const changed = configure(room, 'a', { version: 'original' });
	assert.equal(changed.options.version, 'original');
	assert.equal(room.options.version, 'current', 'the old room is unchanged');
	assert.equal(configure(changed, 'a', { version: 'original' }), changed);
	refuses(
		() => configure(dealt(room), 'a', { version: 'original' }),
		'The game has already started.'
	);
	const done = finish(dealt(room));
	assert.equal(
		configure(done, 'a', { version: 'original' }).options.version,
		'original',
		'a finished table may change its rules before the next deal'
	);
	refuses(
		() => configure(done, 'a', { mode: 'hotseat' }),
		'Start a new table to change the mode.'
	);
});

test('the mode changes only while the table has one seat, so nobody is dropped by surprise', () => {
	refuses(
		() => configure(lobby('a', 'b'), 'a', { mode: 'hotseat' }),
		'The other players must leave before the mode changes.'
	);
	const local = configure(lobby('a'), 'a', { mode: 'hotseat' });
	assert.equal(local.mode, 'hotseat');
	refuses(
		() => configure(addSeat(local, 'a', 'Bo'), 'a', { mode: 'online' }),
		'Remove the other players before the mode changes.'
	);
	const online = configure(local, 'a', { mode: 'online' });
	assert.equal(online.mode, 'online');
	assert.deepEqual(online.seats, [{ player: 'a', name: 'A' }]);
});

test('joining: present changes nothing, away comes back, newcomers sit at the end', () => {
	const room = lobby('a', 'b', 'c');
	assert.deepEqual(ids(room), ['a', 'b', 'c']);
	assert.equal(join(room, P('b')), room);
	const away = leave(dealt(room), 'a').room;
	assert.ok(away);
	assert.equal(away.host, 'b');
	const back = join(away, P('a'));
	assert.equal(back.seats[0].away, undefined);
	assert.equal(
		back.host,
		'b',
		'a returning host does not take the role back'
	);
	assert.equal(back.game, away.game);
});

test('newcomers join only an online table, before its game and up to 5 seats', () => {
	const full = lobby('a', 'b', 'c', 'd', 'e');
	assert.equal(full.seats.length, MAX_SEATS);
	refuses(() => join(full, P('f')), 'This table is full.');
	refuses(
		() => join(dealt(lobby('a', 'b')), P('c')),
		'This game has already started.'
	);
	refuses(
		() => join(hotseat('Bo'), P('b')),
		'This table is played on one screen.'
	);
	const done = finish(dealt(lobby('a', 'b')));
	assert.deepEqual(
		ids(join(done, P('c'))),
		['a', 'b', 'c'],
		'a finished table seats newcomers'
	);
});

test('at a finished table only the people present take seats, and a newcomer who leaves is gone', () => {
	let done = finish(dealt(lobby('a', 'b', 'c', 'd', 'e')));
	done = /** @type {Room} */ (leave(done, 'd').room);
	done = /** @type {Room} */ (leave(done, 'e').room);
	const joined = join(join(done, P('f')), P('g'));
	assert.deepEqual(ids(joined), ['a', 'b', 'c', 'd', 'e', 'f', 'g']);
	refuses(() => join(joined, P('h')), 'This table is full.');
	const left = /** @type {Room} */ (leave(joined, 'f').room);
	assert.deepEqual(ids(left), ['a', 'b', 'c', 'd', 'e', 'g']);
	assert.equal(left.seats[3].away, true, 'a dealt seat stays, away');
	const back = join(left, P('h'));
	refuses(() => join(back, P('d')), 'This table is full.');
	assert.equal(
		join(left, P('d')).seats[3].away,
		undefined,
		'with a place free, a player who left a finished game may come back'
	);
	const again = start(left, 'a', seededRandom(3));
	assert.deepEqual(ids(again), ['a', 'b', 'c', 'g']);
});

test('a hot-seat host seats players by name, each name different', () => {
	const room = hotseat('Bo', 'Cy');
	assert.deepEqual(room.seats, [
		{ player: 'a', name: 'A' },
		{ player: 'a', name: 'Bo' },
		{ player: 'a', name: 'Cy' },
	]);
	assert.deepEqual(seatsOf(room, 'a'), [1, 2, 3]);
	refuses(
		() => addSeat(room, 'a', ' bo '),
		'Each player at this screen needs a different name.'
	);
	refuses(() => addSeat(room, 'b', 'Dee'), 'Only the host can add players.');
	refuses(
		() => addSeat(lobby('a'), 'a', 'Dee'),
		'Only a hot-seat table seats players by name.'
	);
	refuses(
		() => addSeat(hotseat('Bo', 'Cy', 'Dee', 'Eli'), 'a', 'Fay'),
		'This table is full.'
	);
	refuses(
		() => addSeat(dealt(room), 'a', 'Dee'),
		'This game has already started.'
	);
});

test('in the lobby the host removes a seat, but not their own online seat or the last one', () => {
	const room = lobby('a', 'b', 'c');
	assert.deepEqual(ids(removeSeat(room, 'a', 2)), ['a', 'c']);
	refuses(
		() => removeSeat(room, 'b', 3),
		'Only the host can remove a player.'
	);
	refuses(
		() => removeSeat(room, 'a', 1),
		"The host can't remove their own seat."
	);
	refuses(() => removeSeat(room, 'a', 4), 'There is no such seat.');
	refuses(
		() => removeSeat(dealt(room), 'a', 2),
		'Players can only be removed while no game is running.'
	);
	const local = hotseat('Bo');
	assert.deepEqual(removeSeat(local, 'a', 1).seats, [
		{ player: 'a', name: 'Bo' },
	]);
	refuses(
		() => removeSeat(hotseat(), 'a', 1),
		'A table needs at least one player.'
	);
});

test('at a finished table the host may drop a player from the next game', () => {
	const local = finish(dealt(hotseat('Bo', 'Cy')));
	const dropped = removeSeat(local, 'a', 2);
	assert.deepEqual(
		ids(dropped),
		['a', 'a', 'a'],
		'the seat numbers still match'
	);
	assert.equal(dropped.seats[1].away, true);
	assert.deepEqual(
		start(dropped, 'a', seededRandom(5)).seats.map((s) => s.name),
		['A', 'Cy']
	);
	const online = join(finish(dealt(lobby('a', 'b'))), P('c'));
	assert.deepEqual(
		ids(removeSeat(online, 'a', 3)),
		['a', 'b'],
		'a newcomer goes'
	);
	assert.equal(removeSeat(dropped, 'a', 2), dropped, 'already away');
});

test('the host may end a running game: at one screen at any time, online once the others have left', () => {
	const local = dealt(hotseat('Bo'));
	const ended = end(local, 'a');
	assert.equal(phase(ended), 'lobby');
	assert.deepEqual(ended.seats, local.seats);
	const running = dealt(lobby('a', 'b', 'c'));
	refuses(() => end(running, 'b'), 'Only the host can end the game.');
	refuses(
		() => end(running, 'a'),
		'The game can end only once the other players have left.'
	);
	const alone = /** @type {Room} */ (
		leave(/** @type {Room} */ (leave(running, 'b').room), 'c').room
	);
	const back = end(alone, 'a');
	assert.equal(phase(back), 'lobby');
	assert.deepEqual(ids(back), ['a'], 'the away seats go with the game');
	refuses(() => end(lobby('a'), 'a'), 'There is no game to end.');
	refuses(() => end(finish(running), 'a'), 'There is no game to end.');
	// Everyone left: the first to come back hosts, and may end it.
	const empty = /** @type {Room} */ (leave(alone, 'a').room);
	const returned = join(empty, P('c'));
	assert.equal(returned.host, 'c');
	assert.deepEqual(ids(end(returned, 'c')), ['c']);
});

test('leaving a lobby gives up the seat and hands the host on; the last one out closes it', () => {
	const left = leave(lobby('a', 'b'), 'a');
	assert.equal(left.saved, false);
	assert.ok(left.room);
	assert.deepEqual(ids(left.room), ['b']);
	assert.equal(left.room.host, 'b');
	assert.deepEqual(leave(left.room, 'b'), { room: null, saved: false });
	refuses(() => leave(left.room, 'z'), "You aren't at this table.");
	assert.equal(
		leave(hotseat('Bo'), 'a').room,
		null,
		'a hot-seat host leaving a lobby closes it'
	);
});

test('leaving a running game keeps the seat as away, and the table stays even if everyone left', () => {
	const running = dealt(lobby('a', 'b'));
	const first = leave(running, 'a');
	assert.equal(first.saved, true);
	assert.ok(first.room);
	assert.equal(first.room.seats[0].away, true);
	assert.equal(first.room.host, 'b');
	assert.equal(first.room.game, running.game);
	const both = leave(first.room, 'b');
	assert.ok(both.room, 'nobody present, but the game waits for them');
	assert.ok(both.room.seats.every((s) => s.away));
	const local = leave(dealt(hotseat('Bo')), 'a');
	assert.equal(local.saved, true);
	assert.ok(
		local.room?.seats.every((s) => s.away),
		'every hot-seat seat goes away with its host'
	);
	assert.ok(
		local.room && join(local.room, P('a')).seats.every((s) => !s.away)
	);
});

test('leaving a finished game keeps the seat numbers, and the last present person closes it', () => {
	const done = finish(dealt(lobby('a', 'b', 'c')));
	const first = leave(done, 'b');
	assert.equal(first.saved, false);
	assert.ok(first.room);
	assert.deepEqual(ids(first.room), ['a', 'b', 'c']);
	assert.equal(first.room.seats[1].away, true);
	const second = leave(first.room, 'a').room;
	assert.ok(second);
	assert.equal(second.host, 'c');
	assert.equal(leave(second, 'c').room, null);
});

test('only the host starts, with 2 to 5 players, and the game has their names in seat order', () => {
	const room = configure(lobby('a', 'b', 'c'), 'a', { version: 'original' });
	refuses(
		() => start(room, 'b', seededRandom(1)),
		'Only the host can start the game.'
	);
	refuses(
		() => start(lobby('a'), 'a', seededRandom(1)),
		'A game needs at least 2 players.'
	);
	const running = start(room, 'a', seededRandom(1));
	assert.equal(phase(running), 'playing');
	const game = /** @type {any} */ (running.game);
	assert.deepEqual(
		game.seats.map((/** @type {any} */ s) => s.name),
		['A', 'B', 'C']
	);
	assert.equal(game.version, 'original');
	refuses(
		() => start(running, 'a', seededRandom(1)),
		'The game is already running.'
	);
	assert.equal(phase(finish(running)), 'finished');
});

test('a finished table deals a new game to the people still present', () => {
	let room = leave(dealt(lobby('a', 'b', 'c')), 'c').room;
	assert.ok(room);
	room = join(finish(room), P('d'));
	const again = start(room, 'a', seededRandom(2));
	assert.equal(phase(again), 'playing');
	assert.deepEqual(again.seats, [
		{ player: 'a', name: 'A' },
		{ player: 'b', name: 'B' },
		{ player: 'd', name: 'D' },
	]);
	const game = /** @type {any} */ (again.game);
	assert.deepEqual(
		game.seats.map((/** @type {any} */ s) => s.name),
		['A', 'B', 'D']
	);
});

test('a person answers only for a seat they play and are present at', () => {
	const room = lobby('a', 'b');
	refuses(
		() => play(room, 'a', 1, { decision: 1 }, seededRandom(1)),
		'Start the game first.'
	);
	const running = dealt(room);
	const { seat, action } = firstAction(running);
	const other = seat === 1 ? 'b' : 'a';
	const owner = seat === 1 ? 'a' : 'b';
	refuses(
		() => play(running, other, seat, action, seededRandom(1)),
		"That seat isn't yours."
	);
	const away = leave(running, owner).room;
	assert.ok(away);
	refuses(
		() => play(away, owner, seat, action, seededRandom(1)),
		'Come back to the table first.'
	);
	const kept = structuredClone(running);
	const moved = play(running, owner, seat, action, seededRandom(1));
	assert.ok(
		/** @type {any} */ (moved.game).seq >
			/** @type {any} */ (running.game).seq
	);
	assert.deepEqual(running, kept, 'the old room and its game are unchanged');
});

test('a hot-seat host answers for every seat', () => {
	let room = dealt(hotseat('Bo', 'Cy'));
	for (let step = 0; step < 6; step++) {
		const { seat, action } = firstAction(room);
		room = play(room, 'a', seat, action, seededRandom(step));
	}
	assert.equal(phase(room), 'playing');
});

test('names are trimmed, squeezed and cut to 24 characters', () => {
	assert.equal(cleanName('  Ana \n  Maria  '), 'Ana Maria');
	assert.equal(cleanName('Ana\u0007Bo'), 'AnaBo');
	assert.equal(cleanName('x'.repeat(30)), 'x'.repeat(24));
	assert.equal(cleanName('🦊'.repeat(30)), '🦊'.repeat(24));
	assert.equal(cleanName('a \u0007 b'), 'a b');
	assert.equal(cleanName('\u202Eevil'), 'evil', 'no bidi overrides');
	assert.equal(cleanName('👩‍💻 Ana'), '👩‍💻 Ana', 'emoji keep their joiners');
	refuses(() => cleanName('\u200B\u200B'), 'Enter a name.');
	refuses(() => cleanName('   '), 'Enter a name.');
	refuses(() => cleanName(undefined), 'Enter a name.');
	refuses(() => join(lobby('a'), { id: 'b', name: ' ' }), 'Enter a name.');
});

test('the room view shows seats by number and name, never the people behind them (#23)', () => {
	const room = lobby('a', 'b');
	assert.deepEqual(roomView(room, 'b'), {
		code: '3f9a1c07',
		mode: 'online',
		options: {
			version: 'current',
			expansions: [],
			variants: [],
			level: null,
		},
		timer: 0,
		undo: true,
		phase: 'lobby',
		host: 1,
		seats: [
			{ seat: 1, name: 'A', away: false, ready: false },
			{ seat: 2, name: 'B', away: false, ready: false },
		],
		you: [2],
		viewing: 2,
		deal: 0,
		game: null,
		clocks: [],
		canUndo: false,
	});
	const secret = join(
		createRoom('3f9a1c07', { id: 'secret-id-1', name: 'Ana' }, {}, 0),
		{ id: 'secret-id-2', name: 'Bo' }
	);
	const text = JSON.stringify(roomView(dealt(secret), 'secret-id-1'));
	assert.ok(!text.includes('secret-id'), 'no person ids');
	assert.ok(!text.includes('touched'));
	refuses(() => roomView(room, 'z'), "You aren't at this table.");
	refuses(() => roomView(room, 'a', 2), "That seat isn't yours.");
});

test("online, the room view holds the game as the person's own seat sees it", () => {
	const room = dealt(lobby('a', 'b'));
	const mine = roomView(room, 'b');
	assert.equal(mine.viewing, 2);
	const game = /** @type {any} */ (mine.game);
	assert.ok('picks' in game.seats[1], 'their own picks');
	assert.ok(!('picks' in game.seats[0]), "not the other seat's");
	assert.equal(roomView(room, 'b', 2).viewing, 2);
});

test('at a hot-seat table the view is public until a seat is asked for', () => {
	const room = dealt(hotseat('Bo'));
	const shared = roomView(room, 'a');
	assert.deepEqual(shared.you, [1, 2]);
	assert.equal(shared.viewing, null);
	const game = /** @type {any} */ (shared.game);
	assert.ok(game.seats.every((/** @type {any} */ s) => !('picks' in s)));
	const second = /** @type {any} */ (roomView(room, 'a', 2).game);
	assert.ok('picks' in second.seats[1]);
	assert.ok(!('picks' in second.seats[0]));
});

test('a newcomer at a finished table sees the finished game publicly', () => {
	const room = join(finish(dealt(lobby('a', 'b'))), P('c'));
	const view = roomView(room, 'c');
	assert.equal(view.viewing, 3);
	const game = /** @type {any} */ (view.game);
	assert.ok(game.seats.every((/** @type {any} */ s) => !('picks' in s)));
	assert.equal(view.seats[2].name, 'C');
});

test('the table choices are what a new table may pick today', () => {
	assert.deepEqual(tableChoices(), {
		modes: ['online', 'hotseat'],
		versions: [
			{ id: 'original', name: 'Original 2019 printing' },
			{ id: 'current', name: 'Current official rules' },
		],
		expansions: [],
		variants: VARIANTS.map(({ id, name }) => ({ id, name })),
		levels: [1, 2, 3, 4, 5, 6],
		maxSeats: 5,
		timers: [0, 1, 2, 5],
	});
});

/**
 * A map of rooms by code.
 * @param {...Room} rooms
 * @returns {Map<string, Room>}
 */
const mapOf = (...rooms) => new Map(rooms.map((r) => [r.code, r]));

test('a table code is 8 hexadecimal digits that no room has yet', () => {
	const taken = { ...lobby('a'), code: '00000000' };
	const digits = [...'00000000', ...'3f9a1c07'].map((d) => parseInt(d, 16));
	const random = (/** @type {number} */ n) => {
		assert.equal(n, 16);
		return /** @type {number} */ (digits.shift());
	};
	assert.equal(newCode(mapOf(taken), random), '3f9a1c07');
	assert.match(newCode(new Map(), seededRandom(4)), /^[0-9a-f]{8}$/);
});

test('the server refuses a new table once 1,000 are open', () => {
	/** @type {Map<string, Room>} */
	const rooms = new Map();
	for (let i = 0; i < MAX_ROOMS - 1; i++) {
		rooms.set(`r${i}`, { ...lobby('a'), code: `r${i}` });
	}
	addRoom(rooms, lobby('b'));
	assert.equal(rooms.size, MAX_ROOMS);
	assert.equal(rooms.get('3f9a1c07')?.host, 'b');
	refuses(
		() => addRoom(rooms, { ...lobby('c'), code: 'cccccccc' }),
		'There are too many tables right now. Try again later.'
	);
	rooms.delete('r0');
	assert.throws(
		() => addRoom(rooms, lobby('d')),
		/already has a room/,
		'a code is never reused while its room is kept'
	);
	assert.equal(MAX_ROOMS, 1000);
});

test('a game nobody used for a day expires, and a lobby nobody used for an hour', () => {
	const now = 10 * ROOM_IDLE_MS;
	const game = dealt(lobby('a', 'b'));
	const rooms = mapOf(
		{ ...game, code: 'aaaaaaaa', touched: now - ROOM_IDLE_MS },
		{ ...game, code: 'bbbbbbbb', touched: now - ROOM_IDLE_MS - 1 },
		{ ...lobby('c'), code: 'cccccccc', touched: now - LOBBY_IDLE_MS },
		{ ...lobby('d'), code: 'dddddddd', touched: now - LOBBY_IDLE_MS - 1 }
	);
	assert.deepEqual(expireRooms(rooms, now), ['bbbbbbbb', 'dddddddd']);
	assert.deepEqual([...rooms.keys()], ['aaaaaaaa', 'cccccccc']);
	assert.equal(ROOM_IDLE_MS, 24 * 60 * 60 * 1000);
	assert.equal(LOBBY_IDLE_MS, 60 * 60 * 1000);
});

test('the open tables are the online lobbies with a free seat, most recently used first', () => {
	const old = { ...lobby('a', 'b'), code: 'aaaaaaaa', touched: 1 };
	const recent = {
		...configure(lobby('c'), 'c', { version: 'original' }),
		code: 'cccccccc',
		touched: 5,
	};
	const full = {
		...lobby('d', 'e', 'f', 'g', 'h'),
		code: 'dddddddd',
		touched: 9,
	};
	const local = { ...hotseat('Bo'), code: 'eeeeeeee', touched: 9 };
	const running = { ...dealt(lobby('i', 'j')), code: 'ffffffff', touched: 9 };
	const done = {
		...finish(dealt(lobby('k', 'l'))),
		code: '99999999',
		touched: 9,
	};
	assert.deepEqual(
		openTables(mapOf(old, recent, full, local, running, done)),
		[
			{
				code: 'cccccccc',
				host: 'C',
				seats: 1,
				version: 'original',
				expansions: [],
			},
			{
				code: 'aaaaaaaa',
				host: 'A',
				seats: 2,
				version: 'current',
				expansions: [],
			},
		]
	);
});

test('a person sitting in a running game elsewhere is found, so they can be kept from a new table', () => {
	const running = { ...dealt(lobby('a', 'b')), code: 'aaaaaaaa' };
	const away = {
		.../** @type {Room} */ (leave(running, 'b').room),
		code: 'aaaaaaaa',
	};
	const done = { ...finish(dealt(lobby('c', 'd'))), code: 'cccccccc' };
	const waiting = { ...lobby('e'), code: 'eeeeeeee' };
	const rooms = mapOf(away, done, waiting);
	assert.equal(
		unfinishedSeat(rooms, 'b', 'zzzzzzzz'),
		'aaaaaaaa',
		'an away seat still holds them'
	);
	assert.equal(
		unfinishedSeat(rooms, 'b', 'aaaaaaaa'),
		null,
		'returning to that table is fine'
	);
	assert.equal(
		unfinishedSeat(rooms, 'c', 'zzzzzzzz'),
		null,
		'a finished game holds nobody'
	);
	assert.equal(
		unfinishedSeat(rooms, 'e', 'zzzzzzzz'),
		null,
		'nor does a lobby'
	);
	const local = { ...dealt(hotseat('Bo')), code: 'hhhhhhhh' };
	assert.equal(
		unfinishedSeat(mapOf(local), 'a', 'zzzzzzzz'),
		null,
		'a hot-seat game holds nobody: its host is the only one it affects'
	);
});

/** The people of the randomized test. */
const PEOPLE = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
/** Names for hot-seat players: few, so some clash. */
const LOCAL_NAMES = ['Bo', 'Cy', 'Dee', 'bo', 'Eli', 'Fay'];

/** The random steps' times: a minute of 1 second, and declines 3 to 10 seconds out. */
const TIMING = { minuteMs: 1000, declineMinMs: 3000, declineMaxMs: 10000 };

/**
 * A random undo: mostly for the seat whose choice is last, by the person who plays it.
 * @param {Room} room
 * @param {import('../src/lib/engine/random.js').Random} random
 * @param {string} someone - Anyone, seated or not
 * @returns {{ step: string, next: Room, undone?: import('../rooms.mjs').Step }} `undone`: the step taken back
 */
function randomUndo(room, random, someone) {
	const last = room.history.at(-1);
	const seat = last && random(4) ? last.seat : 1 + random(room.seats.length);
	const person = random(6) ? room.seats[seat - 1].player : someone;
	return {
		step: `${person} undoes seat ${seat}`,
		next: undo(room, person, seat),
		undone: last,
	};
}

/**
 * One random step on a room: a transition, a timeout, or (rarely) the game ending, as the engine would end it.
 * @param {Room} room
 * @param {import('../src/lib/engine/random.js').Random} random
 * @param {number} now - Milliseconds
 * @returns {{ step: string, next: Room | null, saved?: boolean, undone?: import('../rooms.mjs').Step }} `undone`: the
 *   step an undo takes back
 */
function randomStep(room, random, now) {
	const someone = PEOPLE[random(PEOPLE.length)];
	const seated = room.seats[random(room.seats.length)].player;
	const who = random(4) ? room.host : someone;
	// An undo is tried more often while there is a choice to take back.
	if (room.history.length > 0 && random(4) === 0) {
		return randomUndo(room, random, someone);
	}
	if (random(12) === 0) {
		const isReady = /** @type {any[]} */ ([true, false, 'yes'])[random(3)];
		return {
			step: `${someone} is ready: ${JSON.stringify(isReady)}`,
			next: ready(room, someone, isReady),
		};
	}
	const roll = random(100);
	if (roll < 15) {
		return { step: `join ${someone}`, next: join(room, P(someone)) };
	}
	if (roll < 27) {
		const leaver = roll < 24 ? seated : someone;
		const { room: next, saved } = leave(room, leaver);
		return { step: `leave ${leaver}`, next, saved };
	}
	if (roll < 35) {
		const name = LOCAL_NAMES[random(LOCAL_NAMES.length)];
		return { step: `${who} adds ${name}`, next: addSeat(room, who, name) };
	}
	if (roll < 39) {
		const seat = 1 + random(room.seats.length + 1);
		return {
			step: `${who} removes seat ${seat}`,
			next: removeSeat(room, who, seat),
		};
	}
	if (roll < 42) {
		return { step: `${who} ends the game`, next: end(room, who) };
	}
	if (roll < 46) {
		const changes = /** @type {any[]} */ ([
			{ timer: TIMERS[random(TIMERS.length)] },
			{ undo: random(2) === 0 },
			{ timer: TIMERS[random(TIMERS.length)], undo: true },
			{ timer: 3 },
			{ undo: 'yes' },
		])[random(5)];
		return {
			step: `${who} sets ${JSON.stringify(changes)}`,
			next: settings(room, who, changes),
		};
	}
	if (roll < 54) {
		return randomUndo(room, random, someone);
	}
	if (roll < 58) {
		return { step: 'the clocks run out', next: timeout(room, now, random) };
	}
	if (roll < 63) {
		const changes = /** @type {any[]} */ ([
			{ version: 'original' },
			{ version: 'current' },
			{ mode: MODES[random(MODES.length)] },
			{ expansions: ['pp'] },
			{ level: 3 },
		])[random(5)];
		return {
			step: `${who} configures ${JSON.stringify(changes)}`,
			next: configure(room, who, changes),
		};
	}
	if (roll < 71) {
		return { step: `${who} starts`, next: start(room, who, random) };
	}
	if (roll < 73 && room.game && room.game.phase !== 'over') {
		// The engine's last answer would empty the undo history too.
		return {
			step: 'the game ends',
			next: { ...finish(room), history: [] },
		};
	}
	if (!room.game || room.game.phase === 'over') {
		return { step: 'nothing', next: room };
	}
	const decisions = openDecisions(room.game);
	const decision = decisions[random(decisions.length)];
	const seat = /** @type {number} */ (decision.player);
	const answers = DECISIONS[decision.kind].answers(room.game, decision);
	const owner = room.seats[seat - 1].player;
	const answerer = random(5) ? owner : someone;
	return {
		step: `${answerer} answers seat ${seat}'s ${decision.kind}`,
		next: play(
			room,
			answerer,
			seat,
			{ decision: decision.id, ...answers[random(answers.length)] },
			random
		),
	};
}

/**
 * Checks the room rules after a step (#22 design §9).
 * @param {Room} room
 * @param {Room} before
 * @param {string} step
 */
function checkRoom(room, before, step) {
	const now = phase(room);
	const present = room.seats.filter((s) => !s.away);
	if (room.seats.some((s) => s.ready)) {
		assert.equal(room.mode, 'online', 'readiness only at an online table');
		assert.equal(room.game, null, 'readiness only before a deal');
	}
	if (/ (configures|sets) /.test(step) && room !== before) {
		assert.ok(
			room.seats.every((s) => !s.ready),
			'a host change clears readiness'
		);
	}
	assert.ok(room.seats.length >= 1, 'a room holds a seat');
	assert.ok(present.length <= MAX_SEATS, 'at most 5 people present');
	if (now !== 'finished') {
		assert.ok(room.seats.length <= MAX_SEATS, 'at most 5 seats');
	}
	assert.equal(room.code, before.code);
	const host = room.seats.find((s) => s.player === room.host);
	assert.ok(host, 'the host holds a seat');
	if (present.length > 0) {
		assert.ok(
			present.some((s) => s.player === room.host),
			'the host is present whenever anyone is'
		);
	}
	if (room.mode === 'online') {
		const people = room.seats.map((s) => s.player);
		assert.equal(
			new Set(people).size,
			people.length,
			'nobody holds two online seats'
		);
	} else {
		assert.ok(
			room.seats.every((s) => s.player === room.host),
			'the hot-seat host plays every seat'
		);
		const names = room.seats.map((s) => s.name.toLowerCase());
		assert.equal(
			new Set(names).size,
			names.length,
			'the names at one screen differ'
		);
	}
	if (now === 'lobby') {
		assert.ok(
			room.seats.every((s) => !s.away),
			'nobody is away in the lobby'
		);
	}
	if (room.game) {
		// Room seat i is game seat i + 1, from the deal until the next one, finished or not.
		const dealt = /** @type {any} */ (room.game).seats;
		assert.ok(
			room.seats.length >= dealt.length,
			'every dealt seat is kept'
		);
		assert.deepEqual(
			room.seats.slice(0, dealt.length).map((s) => s.name),
			dealt.map((/** @type {any} */ s) => s.name),
			'the seats match the game'
		);
		if (now === 'playing') {
			assert.equal(
				room.seats.length,
				dealt.length,
				'no seat is added mid-game'
			);
		}
		if (before.game && !step.endsWith(' starts')) {
			assert.deepEqual(
				room.seats.slice(0, dealt.length).map((s) => s.player),
				before.seats.slice(0, dealt.length).map((s) => s.player),
				'nobody takes over a dealt seat'
			);
		}
	}
	if (now === 'playing' && phase(before) === 'playing') {
		assert.deepEqual(
			room.options,
			before.options,
			'the options stay during a game'
		);
		assert.equal(room.mode, before.mode);
	}
	checkOptions(room.options);
	assert.ok(MODES.includes(room.mode));
	assert.ok(TIMERS.includes(room.timer), 'the timer is one of the choices');
	assert.equal(typeof room.undo, 'boolean');
	checkHistory(room, now);
	if (room.timer !== before.timer) {
		assert.deepEqual(room.history, [], 'a new timer empties the history');
	}
	if (now !== 'playing') {
		assert.deepEqual(room.declines, [], 'no declines unless a game runs');
	}
	if (now !== 'playing' || room.timer === 0) {
		assert.deepEqual(room.clocks, {}, 'clocks run only with the timer on');
	}
	if (step.endsWith(' starts')) {
		assert.deepEqual(room.history, [], 'a new deal has no history');
		assert.deepEqual(room.declines, [], 'a new deal has no declines');
		for (const clock of Object.values(room.clocks)) {
			assert.equal(clock.scope, 'setup', 'a new deal has setup clocks');
		}
	}
	const open = openTables(mapOf(room)).length === 1;
	assert.equal(
		open,
		room.mode === 'online' &&
			now === 'lobby' &&
			room.seats.length < MAX_SEATS,
		'listed as open'
	);
	for (const person of PEOPLE) {
		const holds =
			room.mode === 'online' &&
			now === 'playing' &&
			room.seats.some((s) => s.player === person);
		assert.equal(
			unfinishedSeat(mapOf(room), person, 'elsewhere') === room.code,
			holds,
			`${person} is held by a running game`
		);
	}
}

/**
 * Checks the undo history (#24 design §8): only choices the turn's player made in one turn of a game in play, at most
 * 20 of them, and none while undo is off.
 * @param {Room} room
 * @param {'lobby' | 'playing' | 'finished'} stage - The room's phase
 */
function checkHistory(room, stage) {
	const { history } = room;
	assert.ok(history.length <= HISTORY_LIMIT, 'the history is capped');
	if (!room.undo) {
		assert.deepEqual(history, [], 'no history with undo off');
	}
	if (stage !== 'playing') {
		assert.deepEqual(history, [], 'no history unless a game runs');
	}
	assert.ok(new Set(history.map((s) => s.seat)).size <= 1, 'one seat');
	assert.ok(new Set(history.map((s) => s.turn)).size <= 1, 'one turn');
	for (const step of history) {
		assert.equal(step.game.phase, 'play', 'no setup choice is kept');
		assert.equal(step.game.current, step.seat, "the turn's player's");
		assert.equal(step.game.turn, step.turn);
	}
}

/**
 * Checks a successful undo: the game is the one before the step's choice, its log carried on with an `undone` event
 * last, and the step is gone from the history.
 * @param {Room} room
 * @param {Room} before
 * @param {import('../rooms.mjs').Step} step
 */
function checkUndone(room, before, step) {
	const { seq, events, nextId, ...game } = /** @type {any} */ (room.game);
	const { seq: was, events: log, nextId: _nextId, ...kept } = step.game;
	assert.deepEqual(game, kept, 'undo restores the game before the choice');
	assert.deepEqual(events.slice(0, -1), log);
	assert.deepEqual(events.at(-1), {
		type: 'undone',
		player: step.seat,
		from: was + 1,
		seq,
	});
	assert.equal(seq, /** @type {any} */ (before.game).seq + 1);
	assert.ok(nextId >= /** @type {any} */ (before.game).nextId);
	assert.equal(room.history.length, before.history.length - 1);
	assert.ok(room.history.every((s, i) => s === before.history[i]));
	checkState(/** @type {any} */ (room.game));
}

test('a player marks their own seat ready and unready, and the view shows it', () => {
	const room = ready(lobby('a', 'b'), 'b', true);
	assert.equal(room.seats[1].ready, true);
	assert.deepEqual(
		roomView(room, 'a').seats.map((s) => s.ready),
		[false, true]
	);
	const back = ready(room, 'b', false);
	assert.equal(back.seats[1].ready, undefined);
	assert.deepEqual(
		roomView(back, 'b').seats.map((s) => s.ready),
		[false, false]
	);
});

test('readiness that does not change returns the same room', () => {
	const room = ready(lobby('a', 'b'), 'a', true);
	assert.equal(ready(room, 'a', true), room);
	const fresh = lobby('a', 'b');
	assert.equal(ready(fresh, 'b', false), fresh);
});

test('readiness is refused at a hot-seat table, once a game is dealt, and when it is not yes or no', () => {
	refuses(
		() => ready(hotseat('Ana', 'Bo'), 'a', true),
		'Everyone here shares one screen.'
	);
	refuses(
		() => ready(dealt(lobby('a', 'b')), 'b', true),
		'The game has already started.'
	);
	refuses(
		() => ready(lobby('a', 'b'), 'b', /** @type {any} */ ('yes')),
		'Choose whether you are ready.'
	);
	refuses(
		() => ready(lobby('a', 'b'), 'z', true),
		"You aren't at this table."
	);
});

test('a joiner starts not ready and leaves the others ready', () => {
	const room = join(ready(lobby('a', 'b'), 'b', true), P('c'));
	assert.deepEqual(
		room.seats.map((s) => s.ready),
		[undefined, true, undefined]
	);
});

test('a host change to the options or the settings clears every seat in the lobby', () => {
	const both = ready(ready(lobby('a', 'b'), 'a', true), 'b', true);
	const options = configure(both, 'a', { version: 'original' });
	assert.ok(options.seats.every((s) => s.ready === undefined));
	const timer = settings(both, 'a', { timer: 2 });
	assert.ok(timer.seats.every((s) => s.ready === undefined));
	// Nothing changed, so nobody's readiness goes.
	assert.equal(configure(both, 'a', { version: 'current' }), both);
	assert.equal(settings(both, 'a', { undo: true }), both);
});

test('a game is dealt without readiness', () => {
	const room = dealt(ready(ready(lobby('a', 'b'), 'a', true), 'b', true));
	assert.ok(room.seats.every((s) => !('ready' in s)));
});

test('random steps never break the room rules', () => {
	let undone = 0;
	for (let run = 1; run <= 200; run++) {
		const random = seededRandom(run);
		/** @type {Room | null} */
		let room = null;
		let now = 0;
		for (let i = 1; i <= 300; i++) {
			// Mostly a moment later; now and then long enough for clocks and declines to come due.
			now += random(10) ? random(300) : 3000 + random(8000);
			if (!room) {
				// A closed table is followed by a new one, so every run takes all its steps.
				const mode = /** @type {import('../rooms.mjs').Mode} */ (
					random(3) ? 'online' : 'hotseat'
				);
				room = createRoom(
					'3f9a1c07',
					P(PEOPLE[random(PEOPLE.length)]),
					{ mode },
					0
				);
				continue;
			}
			const before = room;
			// The history's games are as big as the game, so its steps are compared by identity.
			const snapshot = JSON.stringify({
				...room,
				game: null,
				history: null,
			});
			const steps = [...room.history];
			const unchanged = () =>
				JSON.stringify({ ...before, game: null, history: null }) ===
					snapshot &&
				before.history.length === steps.length &&
				before.history.every((s, k) => s === steps[k]);
			let step = '?';
			try {
				const result = randomStep(room, random, now);
				step = result.step;
				assert.ok(
					unchanged(),
					'the step changed the room it was given'
				);
				if (result.saved !== undefined) {
					assert.equal(
						result.saved,
						phase(before) === 'playing',
						'saved means a game in progress waits'
					);
				}
				if (result.next === null) {
					assert.match(step, /^leave /, 'only leaving closes a room');
					const leaver = step.slice('leave '.length);
					assert.ok(
						before.seats.every(
							(s) => s.player === leaver || s.away
						),
						'a room closes only when its last present person leaves'
					);
					assert.notEqual(
						phase(before),
						'playing',
						'a running game never closes'
					);
					room = null;
					continue;
				}
				// The server brings the clocks and declines up to date with every change it keeps (#24).
				const next = tick(result.next, now, TIMING, random);
				checkRoom(next, before, step);
				if (result.undone) {
					checkUndone(next, before, result.undone);
					undone++;
				}
				room = next;
			} catch (error) {
				if (error instanceof PlayerError) {
					assert.ok(unchanged(), 'a refused step changed the room');
					continue;
				}
				const failure = /** @type {Error} */ (error);
				// A new error, because the reporter prints the stack, which holds the old message.
				throw new Error(
					`run ${run}, step ${i} (${step}): ${failure.message}`,
					{ cause: failure }
				);
			}
		}
	}
	// The default seeds take back 166 choices; fewer than 100 would mean the steps no longer reach undo.
	assert.ok(undone >= 100, `only ${undone} choices were taken back`);
});
