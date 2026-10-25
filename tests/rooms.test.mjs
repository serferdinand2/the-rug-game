// Tests for the room transitions (#22): creating, configuring, joining, leaving, starting and playing at a table.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
	MAX_SEATS,
	addSeat,
	cleanName,
	configure,
	createRoom,
	join,
	leave,
	phase,
	play,
	removeSeat,
	seatsOf,
	start,
} from '../rooms.mjs';
import { seededRandom } from '../src/lib/engine/random.js';
import { openDecisions } from '../src/lib/engine/stack.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';

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
			createRoom('3f9a1c07', P(people[0]))
		);
/** A hot-seat lobby whose host is `a`, with these players by name. @param {...string} names */
const hotseat = (...names) =>
	names.reduce(
		(r, name) => addSeat(r, 'a', name),
		createRoom('3f9a1c07', P('a'), { mode: 'hotseat' })
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
		host: 'a',
		seats: [{ player: 'a', name: 'Ana' }],
		game: null,
		touched: 5,
	});
	assert.equal(phase(room), 'lobby');
	assert.deepEqual(seatsOf(room, 'a'), [1]);
	assert.deepEqual(seatsOf(room, 'b'), []);
});

test("a table's mode and options are checked when it is created", () => {
	const make = (/** @type {Record<string, unknown>} */ options) => () =>
		createRoom('3f9a1c07', P('a'), /** @type {any} */ (options));
	assert.equal(
		createRoom('3f9a1c07', P('a'), { version: 'original' }).options.version,
		'original'
	);
	assert.equal(
		createRoom('3f9a1c07', P('a'), { mode: 'hotseat' }).mode,
		'hotseat'
	);
	refuses(make({ mode: 'dungeon' }), 'Unknown table mode: dungeon.');
	refuses(make({ version: '2024' }), 'Unknown rules version: 2024.');
	refuses(make({ expansions: ['pp'] }), "Plans & Ploys isn't available yet.");
	refuses(make({ variants: ['draft'] }), 'Unknown variant: draft.');
	refuses(make({ level: 3 }), 'Only a solo table has an Automa level.');
});

test("solo tables check the Automa's level, then wait for the Automa (#31)", () => {
	const solo = (/** @type {unknown} */ level) => () =>
		createRoom(
			'3f9a1c07',
			P('a'),
			/** @type {any} */ ({ mode: 'solo', level })
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

test('the mode changes only while the host is alone, keeping their first seat', () => {
	refuses(
		() => configure(lobby('a', 'b'), 'a', { mode: 'hotseat' }),
		'The other players must leave before the mode changes.'
	);
	const local = configure(lobby('a'), 'a', { mode: 'hotseat' });
	assert.equal(local.mode, 'hotseat');
	const online = configure(addSeat(local, 'a', 'Bo'), 'a', {
		mode: 'online',
	});
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
		'Players can only be removed before the game starts.'
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
	refuses(() => cleanName('   '), 'Enter a name.');
	refuses(() => cleanName(undefined), 'Enter a name.');
	refuses(() => join(lobby('a'), { id: 'b', name: ' ' }), 'Enter a name.');
});
