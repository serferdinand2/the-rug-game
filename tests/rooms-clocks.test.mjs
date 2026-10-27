// Tests for a table's timer and undo settings, its clocks, timeouts and the server's scheduled declines (#24).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import {
	AUTO_LIMIT,
	HISTORY_LIMIT,
	TIMERS,
	createRoom,
	end,
	join,
	leave,
	nextDeadline,
	play,
	roomView,
	scopeOf,
	settings,
	start,
	tableChoices,
	tick,
	timeout,
} from '../rooms.mjs';
import { defaultAction } from '../src/lib/engine/game.js';
import { seededRandom } from '../src/lib/engine/random.js';
import { openDecisions, push } from '../src/lib/engine/stack.js';
import { run } from '../src/lib/engine/loop.js';
import { conquestGame, newGame, startedGame } from './helpers/engine.mjs';

/** @typedef {import('../rooms.mjs').Room} Room */
/** @typedef {import('../src/lib/engine/state.js').State} State */

/** A minute of 1 second and declines 3 to 10 seconds out, so the times in the tests are easy to follow. */
const timing = { minuteMs: 1000, declineMinMs: 3000, declineMaxMs: 10000 };

/** A person, named after their id. @param {string} id */
const P = (id) => ({ id, name: id.toUpperCase() });
/** An online lobby with these people seated in order. @param {...string} people */
const lobby = (...people) =>
	people
		.slice(1)
		.reduce(
			(r, id) => join(r, P(id)),
			createRoom('3f9a1c07', P(people[0]), {}, 0)
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
 * Asserts that `run` throws a PlayerError with exactly this message.
 * @param {() => unknown} run
 * @param {string} message
 */
function refuses(run, message) {
	assert.throws(run, { name: 'PlayerError', message });
}

/**
 * A running online table where a plays seat 1 and b seat 2, holding this game.
 * @param {State} game
 * @param {number} [timer] - Minutes
 * @returns {Room}
 */
const table = (game, timer = 1) => ({ ...dealt(lobby('a', 'b')), timer, game });

/**
 * A table in seat 1's turn, with seat 1 choosing which territory to conquer: seat 2's lone outpost on '-2_-1', where
 * seat 2 holds `hand`, or the empty '-1_-2'.
 * @param {string[]} hand
 * @param {number} [timer]
 * @returns {Room}
 */
function conquest(hand, timer) {
	// Seed 3 gives seat 1 the first turn.
	const game = conquestGame(hand, { seed: 3 });
	game.hexes['-1_-2'].tile = startedGame(2, { seed: 3 }).state.hexes[
		'-1_-2'
	].tile;
	push(game, game.pending, [
		{ player: 1, kind: 'effects', effects: [{ conquer: {} }] },
	]);
	run(game, () => 0);
	assert.equal(game.current, 1);
	assert.deepEqual(
		openDecisions(game).map((d) => [d.kind, d.player]),
		[['chooseConquer', 1]]
	);
	return table(game, timer);
}

/**
 * A seat answers its open decision of a kind, through the room.
 * @param {Room} room
 * @param {number} seat
 * @param {string} kind
 * @param {Record<string, unknown>} fields
 * @returns {Room}
 */
function answer(room, seat, kind, fields) {
	const game = /** @type {State} */ (room.game);
	const decision = openDecisions(game).find(
		(d) => d.kind === kind && d.player === seat
	);
	assert.ok(decision, `seat ${seat} has an open ${kind}`);
	return play(
		room,
		room.seats[seat - 1].player,
		seat,
		{ decision: decision.id, ...fields },
		() => 0
	);
}

/**
 * A seat answers its first open decision with the default answer, through the room.
 * @param {Room} room
 * @param {number} seat
 * @returns {Room}
 */
function answerDefault(room, seat) {
	const action = defaultAction(/** @type {State} */ (room.game), seat);
	assert.ok(action, `seat ${seat} is asked`);
	return play(room, room.seats[seat - 1].player, seat, action, () => 0);
}

/** A random that must not be used. */
const unused = () => assert.fail('no random number is needed');

test('a table starts with the timer off, undo on, and no clocks', () => {
	const room = lobby('a', 'b');
	assert.equal(room.timer, 0);
	assert.equal(room.undo, true);
	assert.deepEqual(room.clocks, {});
	assert.deepEqual(room.declines, []);
	assert.deepEqual(room.history, []);
	assert.deepEqual(TIMERS, [0, 1, 2, 5]);
	assert.ok(Object.isFrozen(TIMERS));
	assert.equal(HISTORY_LIMIT, 20);
	assert.equal(AUTO_LIMIT, 1000);
	assert.deepEqual(tableChoices().timers, [0, 1, 2, 5]);
	const view = roomView(room, 'b');
	assert.equal(view.timer, 0);
	assert.equal(view.undo, true);
	assert.deepEqual(view.clocks, []);
	assert.equal(tick(room, 0, timing, unused), room, 'a lobby has no clocks');
	assert.deepEqual(
		tick(dealt(room), 0, timing, unused).clocks,
		{},
		'a game with the timer off has no clocks'
	);
});

test('only the host changes the timer and undo, to allowed values, in the lobby, during a game and when finished', () => {
	const room = lobby('a', 'b');
	const any = (/** @type {unknown} */ value) => /** @type {any} */ (value);
	refuses(
		() => settings(room, 'b', { timer: 1 }),
		'Only the host can change the table.'
	);
	refuses(
		() => settings(room, 'z', { undo: false }),
		'Only the host can change the table.'
	);
	for (const timer of [3, '1', -1, null, 1.5, 60]) {
		refuses(
			() => settings(room, 'a', any({ timer })),
			'Choose a timer of off, 1, 2 or 5 minutes.'
		);
	}
	for (const undo of ['yes', 1, 0, null]) {
		refuses(
			() => settings(room, 'a', any({ undo })),
			'Choose whether undo is on.'
		);
	}
	assert.equal(settings(room, 'a', {}), room, 'no change, the same room');
	assert.equal(settings(room, 'a', { timer: 0, undo: true }), room);
	assert.equal(settings(room, 'a', any(null)), room);
	const playing = dealt(room);
	for (const before of [room, playing, finish(playing)]) {
		const changed = settings(before, 'a', { timer: 5, undo: false });
		assert.equal(changed.timer, 5);
		assert.equal(changed.undo, false);
		assert.equal(before.timer, 0, 'the old room is unchanged');
		assert.equal(before.undo, true);
		assert.equal(settings(changed, 'a', { timer: 5 }), changed);
		assert.equal(settings(changed, 'a', { timer: 2 }).undo, false);
		assert.equal(settings(changed, 'a', { undo: true }).timer, 5);
	}
	// Switching undo off or changing the timer empties the history; a change to neither keeps it.
	const game = /** @type {State} */ (playing.game);
	const history = [{ game, seat: 1, turn: 1, clocks: {} }];
	const kept = { ...playing, history };
	assert.deepEqual(settings(kept, 'a', { timer: 1 }).history, []);
	assert.deepEqual(settings(kept, 'a', { undo: false }).history, []);
	assert.equal(settings(kept, 'a', { timer: 0, undo: true }), kept);
	assert.deepEqual(kept.history, history, 'the old room is unchanged');
});

test("the turn's clock covers the whole turn", () => {
	let room = tick(conquest([]), 0, timing, unused);
	assert.deepEqual(room.clocks, { 1: { scope: 'turn:1', ends: 1000 } });
	// A defender with an empty hand isn't asked, so the turn goes on with the dice.
	room = answer(room, 1, 'chooseConquer', { hex: '-2_-1' });
	assert.deepEqual(
		openDecisions(/** @type {State} */ (room.game)).map((d) => d.kind),
		['chooseDie']
	);
	room = tick(room, 300, timing, unused);
	assert.deepEqual(room.clocks, { 1: { scope: 'turn:1', ends: 1000 } });
	assert.deepEqual(roomView(room, 'b').clocks, [
		{ seat: 1, ends: 1000, expired: false },
	]);
});

test("the turn's clock pauses while a defender answers, and resumes with what it had left", () => {
	let room = tick(conquest(['trap-3']), 0, timing, unused);
	room = tick(
		answer(room, 1, 'chooseConquer', { hex: '-2_-1' }),
		300,
		timing,
		unused
	);
	assert.deepEqual(room.clocks, {
		1: { scope: 'turn:1', left: 700 },
		2: { scope: 'asked:1', ends: 1300 },
	});
	const view = roomView(room, 'a');
	assert.deepEqual(view.clocks, [
		{ seat: 1, left: 700, expired: false },
		{ seat: 2, ends: 1300, expired: false },
	]);
	assert.ok(!('declines' in view) && !('history' in view));
	assert.ok(view.clocks.every((clock) => !('scope' in clock)));
	room = tick(
		answer(room, 2, 'chooseResponse', { card: null }),
		900,
		timing,
		unused
	);
	assert.deepEqual(room.clocks, { 1: { scope: 'turn:1', ends: 1600 } });
	// A clock that has run out pauses at nothing left and resumes run out, still marked expired.
	let late = tick(conquest(['trap-3']), 0, timing, unused);
	late = {
		...late,
		clocks: { 1: { scope: 'turn:1', ends: 200, expired: true } },
	};
	late = tick(
		answer(late, 1, 'chooseConquer', { hex: '-2_-1' }),
		300,
		timing,
		unused
	);
	assert.deepEqual(late.clocks[1], {
		scope: 'turn:1',
		left: 0,
		expired: true,
	});
	assert.deepEqual(roomView(late, 'a').clocks[0], {
		seat: 1,
		left: 0,
		expired: true,
	});
	late = tick(
		answer(late, 2, 'chooseResponse', { card: null }),
		900,
		timing,
		unused
	);
	assert.deepEqual(late.clocks, {
		1: { scope: 'turn:1', ends: 900, expired: true },
	});
});

test('a defender gets a fresh clock that goes once they answer', () => {
	let room = tick(conquest(['trap-3']), 0, timing, unused);
	room = tick(
		answer(room, 1, 'chooseConquer', { hex: '-2_-1' }),
		600,
		timing,
		unused
	);
	assert.deepEqual(
		room.clocks[2],
		{ scope: 'asked:1', ends: 1600 },
		'a whole minute, however long the turn has run'
	);
	// Springing the trap asks the defender for a resource: still asked, so the same clock runs on.
	room = tick(
		answer(room, 2, 'chooseResponse', { card: 'trap-3' }),
		800,
		timing,
		unused
	);
	assert.deepEqual(room.clocks[2], { scope: 'asked:1', ends: 1600 });
	room = tick(
		answer(room, 2, 'chooseResource', { resources: { coin: 1 } }),
		900,
		timing,
		unused
	);
	assert.deepEqual(room.clocks, { 1: { scope: 'turn:1', ends: 1300 } });
});

test('setup gives every player one clock for all of setup', () => {
	// Seed 1 deals seat 1 a civilization whose setup asks for a resource after the reveal.
	let room = tick(table(newGame(2).state), 0, timing, unused);
	const game = () => /** @type {State} */ (room.game);
	assert.equal(scopeOf(game(), 1), 'setup');
	assert.deepEqual(room.clocks, {
		1: { scope: 'setup', ends: 1000 },
		2: { scope: 'setup', ends: 1000 },
	});
	// Seat 1 picks a capital and still has its civilization to pick.
	room = tick(answerDefault(room, 1), 200, timing, unused);
	assert.deepEqual(room.clocks[1], { scope: 'setup', ends: 1000 });
	room = tick(answerDefault(room, 1), 300, timing, unused);
	assert.deepEqual(room.clocks, {
		1: { scope: 'setup', left: 700 },
		2: { scope: 'setup', ends: 1000 },
	});
	room = tick(answerDefault(room, 2), 400, timing, unused);
	room = tick(answerDefault(room, 2), 500, timing, unused);
	assert.equal(game().phase, 'setup');
	assert.deepEqual(room.clocks, {
		1: { scope: 'setup', ends: 1200 },
		2: { scope: 'setup', left: 500 },
	});
	// The setup ends, and the first turn's player gets a fresh clock.
	room = tick(answerDefault(room, 1), 600, timing, unused);
	assert.equal(game().phase, 'play');
	assert.equal(game().current, 2);
	assert.deepEqual(room.clocks, { 2: { scope: 'turn:1', ends: 1600 } });
});

test('a new turn gets a fresh clock, even for the same player twice in a row', () => {
	let room = tick(table(startedGame(2).state), 0, timing, unused);
	assert.deepEqual(room.clocks, { 2: { scope: 'turn:1', ends: 1000 } });
	// Seat 2's income turn ends the turn.
	room = tick(answerDefault(room, 2), 300, timing, unused);
	const game = /** @type {State} */ (room.game);
	assert.equal(game.turn, 2);
	assert.equal(scopeOf(game, 1), 'turn:2');
	assert.equal(scopeOf(game, 2), 'asked:2');
	assert.deepEqual(room.clocks, { 1: { scope: 'turn:2', ends: 1300 } });
	// Once seat 1 has finished, seat 2 takes every turn.
	const alone = structuredClone(startedGame(2).state);
	alone.seats[0].finished = true;
	let solo = tick(table(alone), 0, timing, unused);
	solo = tick(answerDefault(solo, 2), 300, timing, unused);
	assert.equal(/** @type {State} */ (solo.game).current, 2);
	assert.deepEqual(solo.clocks, { 2: { scope: 'turn:2', ends: 1300 } });
});

test('changing the timer restarts every clock, and off clears them', () => {
	let room = tick(conquest(['trap-3']), 0, timing, unused);
	room = tick(
		answer(room, 1, 'chooseConquer', { hex: '-2_-1' }),
		300,
		timing,
		unused
	);
	assert.equal(settings(room, 'a', { timer: 1 }), room);
	assert.equal(settings(room, 'a', { undo: false }).clocks, room.clocks);
	room = settings(room, 'a', { timer: 2 });
	assert.deepEqual(room.clocks, {});
	room = tick(room, 500, timing, unused);
	assert.deepEqual(room.clocks, { 2: { scope: 'asked:1', ends: 2500 } });
	room = tick(
		answer(room, 2, 'chooseResponse', { card: null }),
		600,
		timing,
		unused
	);
	assert.deepEqual(
		room.clocks,
		{ 1: { scope: 'turn:1', ends: 2600 } },
		'the paused clock starts again at the new length'
	);
	room = tick(settings(room, 'a', { timer: 0 }), 700, timing, unused);
	assert.deepEqual(room.clocks, {});
	assert.deepEqual(roomView(room, 'a').clocks, []);
	room = tick(settings(room, 'a', { timer: 5 }), 800, timing, unused);
	assert.deepEqual(room.clocks, { 1: { scope: 'turn:1', ends: 5800 } });
});

test('a decline-only response is scheduled 3 to 10 seconds out, and a trap holder is not', () => {
	for (const timer of [0, 1]) {
		const asked = answer(
			tick(conquest(['age-of-sail'], timer), 0, timing, unused),
			1,
			'chooseConquer',
			{ hex: '-2_-1' }
		);
		const [question] = openDecisions(/** @type {State} */ (asked.game));
		assert.equal(question.kind, 'chooseResponse');
		/** @type {number[]} */
		const drawn = [];
		const soonest = tick(asked, 1000, timing, (n) => {
			drawn.push(n);
			return 0;
		});
		assert.deepEqual(drawn, [7001], 'one draw from 0 to 7,000');
		assert.deepEqual(soonest.declines, [
			{ decision: question.id, player: 2, at: 4000 },
		]);
		const latest = tick(asked, 1000, timing, (n) => n - 1);
		assert.equal(latest.declines[0].at, 11000);
		for (let seed = 1; seed <= 20; seed++) {
			const { at } = tick(asked, 1000, timing, seededRandom(seed))
				.declines[0];
			assert.ok(at >= 4000 && at <= 11000, `${at} is 3 to 10 s out`);
		}
		// It stays as it was while the response is open, and goes once the defender declines.
		assert.equal(tick(soonest, 2000, timing, unused), soonest);
		assert.deepEqual(
			tick(
				answer(soonest, 2, 'chooseResponse', { card: null }),
				2500,
				timing,
				unused
			).declines,
			[]
		);
		assert.ok(!('declines' in roomView(soonest, 'b')));
	}
	const trap = answer(
		tick(conquest(['trap-3']), 0, timing, unused),
		1,
		'chooseConquer',
		{ hex: '-2_-1' }
	);
	assert.deepEqual(tick(trap, 1000, timing, unused).declines, []);
});

test('nextDeadline is the earliest running clock or decline, and paused clocks do not count', () => {
	assert.equal(nextDeadline(lobby('a', 'b')), null);
	let room = tick(conquest(['age-of-sail']), 0, timing, unused);
	assert.equal(nextDeadline(room), 1000);
	room = tick(
		answer(room, 1, 'chooseConquer', { hex: '-2_-1' }),
		300,
		timing,
		() => 0
	);
	assert.deepEqual(room.clocks[1], { scope: 'turn:1', left: 700 });
	assert.equal(nextDeadline(room), 1300, "the defender's clock");
	assert.equal(
		nextDeadline({ ...room, clocks: { 1: room.clocks[1] } }),
		3300,
		'the decline'
	);
	assert.equal(
		nextDeadline({ ...room, clocks: { 1: room.clocks[1] }, declines: [] }),
		null,
		'a paused clock alone'
	);
	const off = tick(settings(room, 'a', { timer: 0 }), 300, timing, unused);
	assert.equal(nextDeadline(off), 3300);
	const long = tick(settings(room, 'a', { timer: 5 }), 300, timing, unused);
	assert.equal(nextDeadline(long), 3300, 'the decline comes first');
	const due = { ...room, clocks: { 1: { scope: 'turn:1', ends: 50 } } };
	assert.equal(nextDeadline(due), 50, 'a clock already past is due');
});

test('start and end clear the clocks, the declines and the history', () => {
	let room = tick(conquest(['age-of-sail']), 0, timing, unused);
	room = tick(
		answer(room, 1, 'chooseConquer', { hex: '-2_-1' }),
		300,
		timing,
		() => 0
	);
	const game = /** @type {State} */ (room.game);
	room = { ...room, history: [{ game, seat: 1, turn: 1, clocks: {} }] };
	assert.notDeepEqual(room.clocks, {});
	assert.notDeepEqual(room.declines, []);
	const again = start(finish(room), 'a', seededRandom(7));
	assert.deepEqual(again.clocks, {});
	assert.deepEqual(again.declines, []);
	assert.deepEqual(again.history, []);
	assert.equal(again.timer, 1, 'the settings stay');
	const left = /** @type {Room} */ (leave(room, 'b').room);
	const ended = end(left, 'a');
	assert.equal(ended.game, null);
	assert.deepEqual(ended.clocks, {});
	assert.deepEqual(ended.declines, []);
	assert.deepEqual(ended.history, []);
	assert.equal(ended.undo, true);
});

/**
 * The number of `timedOut` events in a room's game.
 * @param {Room} room
 * @returns {number}
 */
const timedOutEvents = (room) =>
	/** @type {State} */ (room.game).events.filter((e) => e.type === 'timedOut')
		.length;

/**
 * A conquest in which seat 1 has chosen the empty territory and the dice wait, 300 ms into a 1,000 ms clock.
 * @returns {Room}
 */
function chosen() {
	return tick(
		answer(tick(conquest([]), 0, timing, unused), 1, 'chooseConquer', {
			hex: '-1_-2',
		}),
		300,
		timing,
		unused
	);
}

test('nothing due, nothing happens', () => {
	const room = chosen();
	assert.equal(timeout(room, 999, unused), room);
	const lobbyRoom = lobby('a', 'b');
	assert.equal(timeout(lobbyRoom, 5000, unused), lobbyRoom);
	const off = tick(table(startedGame(2).state, 0), 0, timing, unused);
	assert.equal(timeout(off, 1e9, unused), off);
});

test('when the clock runs out the server finishes the turn from where it is, and logs it once', () => {
	const room = chosen();
	const before = /** @type {State} */ (room.game);
	assert.equal(before.turn, 1);
	assert.deepEqual(
		openDecisions(before).map((d) => d.kind),
		['chooseDie']
	);
	const done = timeout(room, 1000, () => 0);
	const game = /** @type {State} */ (done.game);
	assert.equal(game.turn, 2, 'the turn passed');
	assert.equal(timedOutEvents(done), 1);
	const after = game.events.filter((e) => e.seq > before.seq);
	assert.deepEqual(
		after
			.filter((e) => e.type === 'timedOut')
			.map(({ type, player }) => ({ type, player })),
		[{ type: 'timedOut', player: 1 }]
	);
	// What the player had started is finished first (the conquest scores), then the turn left open gets
	// the default income turn; it is not switched for another one.
	const types = after.map((e) => e.type);
	assert.ok(types.includes('vpGained'), 'the conquest was finished');
	assert.ok(
		types.indexOf('vpGained') < types.indexOf('turnChosen'),
		'the conquest finished before the turn was completed'
	);
	assert.equal(types.filter((t) => t === 'turnChosen').length, 1);
	assert.equal(done.clocks[1].expired, true);
	assert.deepEqual(done.history, []);
	assert.equal(room.game, before, 'the old room is unchanged');
	// A second timeout at the same time adds nothing.
	assert.equal(timedOutEvents(timeout(done, 1000, () => 0)), 1);
});

test("the next player's fresh clock is not played", () => {
	const done = tick(
		timeout(chosen(), 1000, () => 0),
		1000,
		timing,
		unused
	);
	const game = /** @type {State} */ (done.game);
	assert.equal(game.current, 2);
	assert.deepEqual(done.clocks, { 2: { scope: 'turn:2', ends: 2000 } });
	assert.equal(timeout(done, 1500, unused), done);
	assert.deepEqual(
		openDecisions(game).map((d) => [d.kind, d.player]),
		[['chooseTurn', 2]]
	);
});

test('auto-play waits for a defender, then goes on as soon as the turn comes back', () => {
	let room = tick(conquest(['trap-3']), 0, timing, unused);
	room = tick(
		answer(room, 1, 'chooseConquer', { hex: '-2_-1' }),
		300,
		timing,
		unused
	);
	// Seat 1's clock is paused with 700 left; run it out by hand.
	room = {
		...room,
		clocks: { ...room.clocks, 1: { scope: 'turn:1', ends: 500 } },
	};
	room = tick(timeout(room, 600, unused), 600, timing, unused);
	assert.equal(timedOutEvents(room), 1);
	assert.equal(room.clocks[1].expired, true);
	assert.deepEqual(
		openDecisions(/** @type {State} */ (room.game)).map((d) => [
			d.kind,
			d.player,
		]),
		[['chooseResponse', 2]],
		'it waits for the defender'
	);
	room = tick(
		answer(room, 2, 'chooseResponse', { card: null }),
		700,
		timing,
		unused
	);
	assert.deepEqual(room.clocks[1], {
		scope: 'turn:1',
		ends: 700,
		expired: true,
	});
	room = timeout(room, 700, () => 0);
	assert.equal(timedOutEvents(room), 1, 'no second timedOut');
	assert.equal(/** @type {State} */ (room.game).turn, 2);
});

test('both setup clocks run out together and the whole setup is answered', () => {
	let room = tick(table(newGame(2).state), 0, timing, unused);
	room = timeout(room, 1000, () => 0);
	const game = /** @type {State} */ (room.game);
	assert.equal(game.phase, 'play');
	assert.equal(game.turn, 1, 'the fresh turn-1 clock was not played');
	assert.deepEqual(
		openDecisions(game).map((d) => [d.kind, d.player]),
		[['chooseTurn', game.current]]
	);
	assert.deepEqual(
		game.events.filter((e) => e.type === 'timedOut').map((e) => e.player),
		[1, 2]
	);
});

test('a due decline is answered, and one the defender answered first is dropped', () => {
	const asked = tick(
		answer(
			tick(conquest(['age-of-sail'], 0), 0, timing, unused),
			1,
			'chooseConquer',
			{ hex: '-2_-1' }
		),
		1000,
		timing,
		() => 0
	);
	assert.equal(asked.declines[0].at, 4000);
	assert.equal(timeout(asked, 3999, unused), asked);
	const done = timeout(asked, 4000, () => 0);
	assert.ok(
		!openDecisions(/** @type {State} */ (done.game)).some(
			(d) => d.kind === 'chooseResponse'
		)
	);
	assert.deepEqual(done.history, []);
	// The defender declined first: the stale decline is dropped, nothing else happens.
	const first = answer(asked, 2, 'chooseResponse', { card: null });
	const late = timeout(first, 5000, unused);
	assert.equal(late.game, first.game);
	assert.deepEqual(late.declines, []);
});

test('an away seat and a hot-seat seat are played the same way', () => {
	const plain = timeout(chosen(), 1000, () => 0);
	const away = chosen();
	const awayDone = timeout(
		{
			...away,
			seats: away.seats.map((s, i) =>
				i === 0 ? { ...s, away: true } : s
			),
		},
		1000,
		() => 0
	);
	assert.deepEqual(awayDone.game, plain.game);
	const hot = timeout({ ...chosen(), mode: 'hotseat' }, 1000, () => 0);
	assert.deepEqual(hot.game, plain.game);
});

test('a timeout that cannot finish within its limit throws (1,000 by default)', () => {
	assert.equal(AUTO_LIMIT, 1000);
	const room = tick(table(newGame(2).state), 0, timing, unused);
	assert.throws(() => timeout(room, 1000, () => 0, 1), {
		message: 'The timer could not finish the turn.',
	});
	assert.ok(timeout(room, 1000, () => 0, 10).game);
});
