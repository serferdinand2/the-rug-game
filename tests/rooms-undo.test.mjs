// Tests for taking back choices at a table (#24): the undo history, what closes it, and undo's refusals.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import {
	HISTORY_LIMIT,
	addSeat,
	createRoom,
	end,
	join,
	leave,
	nextDeadline,
	play,
	roomView,
	settings,
	start,
	tick,
	timeout,
	undo,
} from '../rooms.mjs';
import { defaultAction } from '../src/lib/engine/game.js';
import { seededRandom } from '../src/lib/engine/random.js';
import { openDecisions, push } from '../src/lib/engine/stack.js';
import { run } from '../src/lib/engine/loop.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import { cityPlots } from '../src/lib/engine/city.js';
import { groupsOf } from '../src/lib/capital.js';
import { checkState } from './helpers/invariants.mjs';
import { readyTurn, startedGame } from './helpers/engine.mjs';

/** @typedef {import('../rooms.mjs').Room} Room */
/** @typedef {import('../src/lib/engine/state.js').State} State */

/** A minute of 1 second and declines 3 to 10 seconds out, so the times in the tests are easy to follow. */
const timing = { minuteMs: 1000, declineMinMs: 3000, declineMaxMs: 10000 };

/** A person, named after their id. @param {string} id */
const P = (id) => ({ id, name: id.toUpperCase() });

/**
 * A running 2-player table holding this game: online, a plays seat 1 and b seat 2; at a hot-seat table, a plays both.
 * @param {State} game
 * @param {{ timer?: number, mode?: 'online' | 'hotseat' }} [options] - The timer in minutes, off by default
 * @returns {Room}
 */
function table(game, { timer = 0, mode = 'online' } = {}) {
	const lobby =
		mode === 'online'
			? join(createRoom('3f9a1c07', P('a'), {}, 0), P('b'))
			: addSeat(createRoom('3f9a1c07', P('a'), { mode }, 0), 'a', 'Bo');
	return { ...start(lobby, 'a', seededRandom(7)), timer, game };
}

/** @param {Room} room */
const gameOf = (room) => /** @type {State} */ (room.game);

/**
 * The open decisions of the room's game, as [kind, player] pairs.
 * @param {Room} room
 */
const asked = (room) =>
	openDecisions(gameOf(room)).map((d) => [d.kind, d.player]);

/**
 * A seat's open decision of a kind.
 * @param {Room} room
 * @param {number} seat
 * @param {string} kind
 */
function decisionOf(room, seat, kind) {
	const decision = openDecisions(gameOf(room)).find(
		(d) => d.kind === kind && d.player === seat
	);
	assert.ok(decision, `seat ${seat} has an open ${kind}`);
	return decision;
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
	const decision = decisionOf(room, seat, kind);
	return play(
		room,
		room.seats[seat - 1].player,
		seat,
		{ decision: decision.id, ...fields },
		() => 0
	);
}

/**
 * A seat answers its open decision of a kind with the first legal answer that `which` accepts.
 * @param {Room} room
 * @param {number} seat
 * @param {string} kind
 * @param {(answer: any) => boolean} [which]
 * @returns {Room}
 */
function pick(room, seat, kind, which = () => true) {
	const decision = decisionOf(room, seat, kind);
	const chosen = DECISIONS[kind].answers(gameOf(room), decision).find(which);
	assert.ok(chosen, `seat ${seat} may answer ${kind} so`);
	return answer(room, seat, kind, chosen);
}

/**
 * A seat takes back its last choice, through the room.
 * @param {Room} room
 * @param {number} seat
 * @returns {Room}
 */
const takeBack = (room, seat) => undo(room, room.seats[seat - 1].player, seat);

/**
 * Asserts that `run` throws a PlayerError with exactly this message.
 * @param {() => unknown} run
 * @param {string} message
 */
function refuses(run, message) {
	assert.throws(run, { name: 'PlayerError', message });
}

/**
 * Asserts that a room's game is `stored` taken back by `seat`: the same game, its log carried on from `undone`, with
 * an `undone` event last that names where the log was taken back from.
 * @param {Room} room
 * @param {State} stored - The game before the choice that was taken back
 * @param {State} undone - The game that was taken back
 * @param {number} seat
 */
function assertRestored(room, stored, undone, seat) {
	const { seq, events, nextId, ...game } = gameOf(room);
	const { seq: was, events: log, nextId: _nextId, ...kept } = stored;
	assert.deepEqual(game, kept, 'the game is as it was before the choice');
	assert.deepEqual(events.slice(0, -1), log);
	assert.deepEqual(events.at(-1), {
		type: 'undone',
		player: seat,
		from: was + 1,
		seq: undone.seq + 1,
	});
	assert.equal(seq, undone.seq + 1, 'the event numbers keep rising');
	assert.ok(nextId >= undone.nextId, 'so do the decision ids');
	checkState(gameOf(room));
}

/** 2 of each resource. */
const rich = () => ({ coin: 2, worker: 2, food: 2, culture: 2 });

/**
 * Fills every open plot of district 0 but its last with buildings from the income mat.
 * @param {any} seat
 * @returns {{ row: number, col: number }} The last open plot
 */
function nearlyFullDistrict(seat) {
	const plots = cityPlots(seat);
	const open = groupsOf('districts')[0].filter((p) => plots[p] === 'empty');
	const kinds = ['house', 'armory', 'market', 'farm'];
	open.slice(0, -1).forEach((p, i) => {
		const building = kinds[i % kinds.length];
		seat.incomeMat.buildings[building] -= 1;
		seat.capital.buildings.push({
			building,
			row: Math.floor(p / 9),
			col: p % 9,
		});
	});
	const last = /** @type {number} */ (open.at(-1));
	return { row: Math.floor(last / 9), col: last % 9 };
}

/**
 * Seat 2's turn (the turn's number is 2), with exploration at 2 and 2 of each resource: advancing onto Wagons
 * (explore or a farm) and taking the farm asks where to place it.
 * @param {{ timer?: number, mode?: 'online' | 'hotseat', alone?: boolean, district?: boolean }} [options] - `alone`:
 *   seat 1 has finished, so seat 2 takes every turn; `district`: the farm can complete district 0, whose reward is one
 *   more choice in the turn
 * @returns {{ room: Room, plot: { row: number, col: number } | null }} `plot`: the district's last open plot
 */
function wagons({ alone = false, district = false, ...options } = {}) {
	/** @type {{ row: number, col: number } | null} */
	let plot = null;
	const { state, player } = readyTurn(2, (seat, game) => {
		seat.tracks.exploration = [2];
		seat.resources = rich();
		if (district) {
			plot = nearlyFullDistrict(seat);
		}
		if (alone) {
			game.seats[0].finished = true;
		}
	});
	assert.equal(player, 2);
	assert.equal(state.turn, 2);
	return { room: table(state, options), plot };
}

/**
 * Seat 2 advances onto Wagons and takes the farm: three choices, after which choosePlacement is open.
 * @param {Room} room
 * @returns {Room}
 */
function toPlacement(room) {
	room = answer(room, 2, 'chooseTurn', { turn: 'advance' });
	room = pick(
		room,
		2,
		'chooseAdvance',
		(a) => a.track === 'exploration' && a.from === 2
	);
	return answer(room, 2, 'chooseOption', { option: 1 });
}

/**
 * Seat 1's turn on a table of seed 3, with 2 of each resource: seat 1 holds '-2_-2', seat 2 holds '-2_-1' and holds
 * `hand`, and '-1_-2' is explored and empty. Advancing onto Archery conquers.
 * @param {string[]} hand
 * @returns {Room}
 */
function archery(hand) {
	const { state, player } = readyTurn(
		2,
		(seat, game) => {
			seat.resources = rich();
			for (const [key, hex] of Object.entries(game.hexes)) {
				hex.outposts = [];
				if (!['-2_-2', '-2_-1', '-1_-2'].includes(key)) {
					/** @type {any} */ (hex).tile = null;
				}
			}
			game.hexes['-2_-2'].outposts = [{ seat: 1, toppled: false }];
			game.hexes['-2_-1'].outposts = [{ seat: 2, toppled: false }];
			/** @type {any} */ (game.seats[1]).hand = [...hand];
		},
		{ seed: 3 }
	);
	assert.equal(player, 1);
	let room = table(state);
	room = answer(room, 1, 'chooseTurn', { turn: 'advance' });
	room = pick(
		room,
		1,
		'chooseAdvance',
		(a) => a.track === 'military' && a.from === 0
	);
	assert.deepEqual(asked(room), [['chooseConquer', 1]]);
	assert.equal(room.history.length, 2);
	return room;
}

/**
 * Seat 2's turn, with 2 of each resource, changed by `fill`; seat 2 chooses to advance.
 * @param {(seat: any, game: State) => void} fill
 * @returns {Room}
 */
function advancing(fill) {
	const { state } = readyTurn(2, (seat, game) => {
		seat.resources = rich();
		fill(seat, game);
	});
	const room = answer(table(state), 2, 'chooseTurn', { turn: 'advance' });
	assert.equal(room.history.length, 1);
	return room;
}

test('a placement is taken back within the turn', () => {
	const { room: ready, plot } = wagons({ district: true });
	const placing = toPlacement(ready);
	const stored = gameOf(placing);
	const question = decisionOf(placing, 2, 'choosePlacement');
	// The farm completes district 0, whose reward is still to choose: the turn goes on.
	const placed = answer(placing, 2, 'choosePlacement', { ...plot });
	assert.deepEqual(asked(placed), [['chooseResource', 2]]);
	assert.equal(gameOf(placed).turn, 2);
	assert.equal(placed.history.length, 4);
	const back = takeBack(placed, 2);
	assert.deepEqual(openDecisions(gameOf(back)), [question], 'the same id');
	assertRestored(back, stored, gameOf(placed), 2);
	assert.ok(
		!(
			/** @type {any} */ (gameOf(back).seats[1]).capital.buildings.some(
				(/** @type {any} */ b) =>
					b.row === plot?.row && b.col === plot?.col
			)
		),
		'the farm is off the plot'
	);
	assert.equal(back.history.length, 3);
	assert.equal(placed.history.length, 4, 'the old room is unchanged');
	// It can go somewhere else now.
	const elsewhere = pick(
		back,
		2,
		'choosePlacement',
		(a) => a.row !== plot?.row || a.col !== plot?.col
	);
	assert.equal(gameOf(elsewhere).turn, 3, 'that ends the turn');
});

test('choices come back one at a time, back to the start of the turn', () => {
	let { room, plot } = wagons({ district: true });
	/** @type {{ game: State, question: any }[]} */
	const taken = [];
	/** @param {(room: Room) => Room} choice */
	const choose = (choice) => {
		const game = gameOf(room);
		taken.push({ game, question: openDecisions(game)[0] });
		room = choice(room);
		assert.equal(room.history.length, taken.length);
	};
	choose((r) => answer(r, 2, 'chooseTurn', { turn: 'advance' }));
	choose((r) =>
		pick(r, 2, 'chooseAdvance', (a) => a.track === 'exploration')
	);
	choose((r) => answer(r, 2, 'chooseOption', { option: 1 }));
	choose((r) => answer(r, 2, 'choosePlacement', { ...plot }));
	choose((r) => answer(r, 2, 'chooseResource', { resources: { coin: 1 } }));
	assert.equal(gameOf(room).turn, 3, 'the last choice ended the turn');
	while (taken.length > 0) {
		const { game, question } = /** @type {any} */ (taken.pop());
		const undone = gameOf(room);
		room = takeBack(room, 2);
		assert.deepEqual(openDecisions(gameOf(room)), [question]);
		assertRestored(room, game, undone, 2);
		assert.equal(room.history.length, taken.length);
	}
	assert.equal(gameOf(room).turn, 2);
	assert.deepEqual(asked(room), [['chooseTurn', 2]]);
	refuses(() => takeBack(room, 2), 'There is nothing to undo.');
});

test('undo is refused after a roll', () => {
	// A defender with no card isn't asked, so the dice roll at once.
	const conquered = answer(archery([]), 1, 'chooseConquer', {
		hex: '-2_-1',
	});
	assert.deepEqual(asked(conquered), [['chooseDie', 1]]);
	assert.deepEqual(conquered.history, []);
	refuses(() => takeBack(conquered, 1), 'There is nothing to undo.');
	// Astronomy researches: the science die rolls.
	const researched = pick(
		advancing(() => {}),
		2,
		'chooseAdvance',
		(a) => a.track === 'science' && a.from === 0
	);
	assert.ok(
		gameOf(researched).events.some((e) => e.type === 'scienceDieRolled')
	);
	assert.deepEqual(asked(researched), [['chooseMove', 2]]);
	assert.deepEqual(researched.history, []);
	refuses(() => takeBack(researched, 2), 'There is nothing to undo.');
});

test('a draw, a card leaving a hand, or a shuffle closes the history', () => {
	// Mathematics draws a tapestry card; its bonus is still to choose.
	const drawn = pick(
		advancing((seat) => {
			seat.tracks.science = [1];
		}),
		2,
		'chooseAdvance',
		(a) => a.track === 'science' && a.from === 1
	);
	assert.equal(/** @type {any} */ (gameOf(drawn).seats[1]).hand.length, 1);
	assert.deepEqual(asked(drawn), [['chooseBonus', 2]]);
	assert.deepEqual(drawn.history, []);
	// An income turn's choices show nothing new, until a card leaves the hand.
	const { state } = readyTurn(2, (seat) => {
		seat.hand = ['academia', 'empiricism'];
	});
	let income = answer(table(state), 2, 'chooseTurn', { turn: 'income' });
	income = answer(income, 2, 'chooseResource', { resources: { coin: 1 } });
	assert.equal(income.history.length, 2);
	income = answer(income, 2, 'chooseTapestry', { card: 'academia' });
	assert.deepEqual(income.history, []);
	// Pottery invents from the display, and the empty deck is shuffled from the discards to refill it.
	let invented = pick(
		advancing((_seat, game) => {
			const tech = game.supply.tech;
			tech.discard.push(...tech.deck.splice(0));
		}),
		2,
		'chooseAdvance',
		(a) => a.track === 'technology' && a.from === 0
	);
	assert.equal(invented.history.length, 2);
	invented = pick(invented, 2, 'chooseInvent', (a) => a.card !== 'deck');
	assert.ok(
		gameOf(invented).events.some((e) => e.type === 'techDeckShuffled')
	);
	assert.equal(gameOf(invented).turn, 3, 'even as the last choice of a turn');
	assert.deepEqual(invented.history, []);
	refuses(() => takeBack(invented, 2), 'There is nothing to undo.');
});

test('a conquest that asks the defender closes the history', () => {
	// Whether the defender holds a trap or can only decline, nothing is drawn or shown, yet the history closes.
	for (const hand of [['trap-3'], ['age-of-sail']]) {
		const room = answer(archery(hand), 1, 'chooseConquer', {
			hex: '-2_-1',
		});
		assert.deepEqual(asked(room), [['chooseResponse', 2]]);
		assert.deepEqual(room.history, []);
		refuses(() => takeBack(room, 1), 'There is nothing to undo.');
		const answered = answer(room, 2, 'chooseResponse', { card: null });
		assert.deepEqual(
			answered.history,
			[],
			"the defender's answer is no step"
		);
	}
});

test("the last choice of a turn can be taken back until the next player's first choice, and not after", () => {
	const { room: ready } = wagons();
	const placing = toPlacement(ready);
	const passed = pick(placing, 2, 'choosePlacement');
	assert.equal(gameOf(passed).turn, 3);
	assert.deepEqual(asked(passed), [['chooseTurn', 1]], 'seat 1 is asked');
	assert.equal(passed.history.length, 4);
	const back = takeBack(passed, 2);
	assertRestored(back, gameOf(placing), gameOf(passed), 2);
	assert.equal(gameOf(back).current, 2);
	// Placed again, then seat 1 makes its first choice.
	const again = pick(back, 2, 'choosePlacement');
	assert.equal(again.history.length, 4);
	assert.equal(roomView(again, 'b').canUndo, true);
	// Seat 1's first choice, its first income turn (which isn't kept either), puts seat 2's steps out of reach.
	const action = /** @type {any} */ (defaultAction(gameOf(again), 1));
	const next = play(again, 'a', 1, action, () => 0);
	assert.deepEqual(next.history, []);
	assert.equal(roomView(next, 'b').canUndo, false);
	refuses(() => takeBack(next, 2), 'There is nothing to undo.');
});

test('two turns in a row: the first choice of the new turn closes the old one', () => {
	const { room: ready } = wagons({ alone: true });
	const passed = pick(toPlacement(ready), 2, 'choosePlacement');
	assert.equal(gameOf(passed).turn, 3);
	assert.deepEqual(asked(passed), [['chooseTurn', 2]], 'seat 2 again');
	assert.equal(passed.history.length, 4, 'the old turn can still be undone');
	assert.ok(passed.history.every((step) => step.turn === 2));
	const advanced = answer(passed, 2, 'chooseTurn', { turn: 'advance' });
	assert.equal(advanced.history.length, 1);
	assert.equal(advanced.history[0].turn, 3);
	const back = takeBack(advanced, 2);
	assertRestored(back, gameOf(passed), gameOf(advanced), 2);
	refuses(() => takeBack(back, 2), 'There is nothing to undo.');
});

test('a timer answer, the game end, undo off, a new deal and an ended game each clear the history', () => {
	// The timer: seat 2's clock runs out after a choice.
	let timed = tick(wagons({ timer: 1 }).room, 0, timing, () => 0);
	timed = tick(
		answer(timed, 2, 'chooseTurn', { turn: 'advance' }),
		100,
		timing,
		() => 0
	);
	assert.equal(timed.history.length, 1);
	const played = timeout(timed, 1000, () => 0);
	assert.equal(gameOf(played).turn, 3, 'the timer finished the turn');
	assert.deepEqual(played.history, []);
	// The game end: seat 1 has finished, and seat 2's fifth income turn ends the game with an optional upgrade.
	const { state } = readyTurn(2, (seat, game) => {
		seat.incomeTurns = 4;
		seat.tech.bottom = [game.supply.tech.deck.shift()];
		game.seats[0].finished = true;
	});
	const last = answer(table(state), 2, 'chooseTurn', { turn: 'income' });
	assert.deepEqual(asked(last), [['chooseUpgrade', 2]]);
	assert.equal(last.history.length, 1);
	const over = answer(last, 2, 'chooseUpgrade', { card: null });
	assert.equal(gameOf(over).phase, 'over');
	assert.deepEqual(over.history, []);
	refuses(() => takeBack(over, 2), 'There is nothing to undo.');
	// Undo off: the history goes, and no choice is kept until it is on again.
	const kept = answer(wagons().room, 2, 'chooseTurn', { turn: 'advance' });
	assert.equal(kept.history.length, 1);
	const off = settings(kept, 'a', { undo: false });
	assert.deepEqual(off.history, []);
	const unkept = pick(
		off,
		2,
		'chooseAdvance',
		(a) => a.track === 'exploration'
	);
	assert.deepEqual(unkept.history, []);
	const on = answer(
		settings(unkept, 'a', { undo: true }),
		2,
		'chooseOption',
		{ option: 1 }
	);
	assert.equal(on.history.length, 1);
	// A new deal at a finished table, and a hot-seat game ended by its host.
	const finished = { ...kept, game: { ...gameOf(kept), phase: 'over' } };
	assert.deepEqual(
		start(/** @type {Room} */ (finished), 'a', seededRandom(7)).history,
		[]
	);
	const local = answer(wagons({ mode: 'hotseat' }).room, 2, 'chooseTurn', {
		turn: 'advance',
	});
	assert.equal(local.history.length, 1);
	assert.deepEqual(end(local, 'a').history, []);
});

test("another seat's choice clears the history, and refusals use the exact messages", () => {
	const lobby = join(createRoom('3f9a1c07', P('a'), {}, 0), P('b'));
	refuses(() => undo(lobby, 'a', 1), 'Start the game first.');
	// Setup picks are never kept.
	const dealt = start(lobby, 'a', seededRandom(7));
	const seat = /** @type {number} */ (openDecisions(gameOf(dealt))[0].player);
	const picked = play(
		dealt,
		dealt.seats[seat - 1].player,
		seat,
		/** @type {any} */ (defaultAction(gameOf(dealt), seat)),
		() => 0
	);
	assert.deepEqual(picked.history, []);
	refuses(() => takeBack(picked, seat), 'There is nothing to undo.');
	// A choice in someone else's turn is never kept, even one that shows nothing and leaves only them asked.
	const theirs = structuredClone(startedGame(2).state);
	assert.equal(theirs.current, 2);
	push(
		theirs,
		theirs.pending,
		[1, 2].map(() => ({
			player: 1,
			kind: 'effects',
			effects: [{ gain: { any: 1 } }],
		}))
	);
	run(theirs, () => 0);
	const gained = pick(table(theirs), 1, 'chooseResource');
	assert.deepEqual(asked(gained), [['chooseResource', 1]]);
	assert.deepEqual(gained.history, []);
	// Seat 2 has a step; the checks come in order.
	const room = answer(wagons().room, 2, 'chooseTurn', { turn: 'advance' });
	assert.equal(room.history.length, 1);
	const off = { ...room, undo: false };
	refuses(() => undo(off, 'a', 2), "That seat isn't yours.");
	refuses(() => undo(off, 'z', 1), "That seat isn't yours.");
	const away = /** @type {Room} */ (leave(off, 'b').room);
	refuses(() => undo(away, 'b', 2), 'Come back to the table first.');
	refuses(() => undo(off, 'b', 2), 'Undo is off at this table.');
	refuses(
		() => undo(room, 'a', 1),
		'You can only take back your own choices.'
	);
	refuses(() => undo(wagons().room, 'b', 2), 'There is nothing to undo.');
	assert.equal(room.history.length, 1, 'a refused undo changes nothing');
	// Seat 2's turn ends; seat 1's first choice takes the last of it out of reach.
	const passed = pick(toPlacement(wagons().room), 2, 'choosePlacement');
	assert.equal(passed.history.length, 4);
	const next = play(
		passed,
		'a',
		1,
		/** @type {any} */ (defaultAction(gameOf(passed), 1)),
		() => 0
	);
	assert.ok(!next.history.some((step) => step.seat === 2));
	refuses(() => takeBack(next, 2), 'There is nothing to undo.');
});

test('undo puts back the clocks of that step, and an expired one is due at once', () => {
	let room = tick(wagons({ timer: 1 }).room, 0, timing, () => 0);
	assert.deepEqual(room.clocks, { 2: { scope: 'turn:2', ends: 1000 } });
	room = tick(
		answer(room, 2, 'chooseTurn', { turn: 'advance' }),
		200,
		timing,
		() => 0
	);
	assert.deepEqual(room.history[0].clocks, {
		2: { scope: 'turn:2', ends: 1000 },
	});
	// The clock keeps running while seat 2 takes the choice back.
	const back = tick(takeBack(room, 2), 400, timing, () => 0);
	assert.deepEqual(back.clocks, { 2: { scope: 'turn:2', ends: 1000 } });
	assert.equal(nextDeadline(back), 1000);
	// Seat 2 ends the turn, and seat 1's clock starts.
	room = tick(
		pick(toPlacement(back), 2, 'choosePlacement'),
		500,
		timing,
		() => 0
	);
	assert.deepEqual(room.clocks, { 1: { scope: 'turn:3', ends: 1500 } });
	assert.deepEqual(room.history.at(-1)?.clocks, {
		2: { scope: 'turn:2', ends: 1000 },
	});
	// Taking the placement back gives seat 2 its turn and its clock back, and seat 1's goes.
	const soon = tick(takeBack(room, 2), 600, timing, () => 0);
	assert.deepEqual(soon.clocks, { 2: { scope: 'turn:2', ends: 1000 } });
	assert.equal(nextDeadline(soon), 1000);
	// Taken back after it ran out, the clock is due at once, and the timer finishes the turn.
	const late = tick(takeBack(room, 2), 1200, timing, () => 0);
	assert.ok(/** @type {number} */ (nextDeadline(late)) <= 1200);
	const done = timeout(late, 1200, () => 0);
	assert.ok(gameOf(done).events.some((e) => e.type === 'timedOut'));
	assert.equal(gameOf(done).turn, 3);
	assert.deepEqual(done.history, []);
});

test('raising the timer mid-turn empties the history, so the new clock stands', () => {
	let room = tick(wagons({ timer: 1 }).room, 0, timing, () => 0);
	room = tick(
		answer(room, 2, 'chooseTurn', { turn: 'advance' }),
		200,
		timing,
		() => 0
	);
	assert.equal(room.history.length, 1);
	room = tick(settings(room, 'a', { timer: 5 }), 900, timing, () => 0);
	assert.deepEqual(room.clocks, { 2: { scope: 'turn:2', ends: 5900 } });
	assert.deepEqual(room.history, []);
	assert.equal(roomView(room, 'b').canUndo, false);
	// Without the history, the 1-minute clock (ends 1000) can't come back and run out at once.
	refuses(() => takeBack(room, 2), 'There is nothing to undo.');
	assert.equal(nextDeadline(tick(room, 1500, timing, () => 0)), 5900);
	assert.equal(
		timeout(room, 1500, () => 0),
		room,
		'nothing is due'
	);
});

test('turning the timer on, or shortening it, empties the history too', () => {
	// A step taken with the timer off holds no clock: undoing it would hand out a fresh, full one.
	const off = answer(wagons().room, 2, 'chooseTurn', { turn: 'advance' });
	assert.deepEqual(off.history[0].clocks, {});
	const on = tick(settings(off, 'a', { timer: 1 }), 300, timing, () => 0);
	assert.deepEqual(on.history, []);
	refuses(() => takeBack(on, 2), 'There is nothing to undo.');
	assert.deepEqual(on.clocks, { 2: { scope: 'turn:2', ends: 1300 } });
	// A shorter timer can't be dodged by undoing back to the longer deadline.
	let long = tick(wagons({ timer: 5 }).room, 0, timing, () => 0);
	long = answer(long, 2, 'chooseTurn', { turn: 'advance' });
	assert.deepEqual(long.history[0].clocks, {
		2: { scope: 'turn:2', ends: 5000 },
	});
	const short = tick(settings(long, 'a', { timer: 1 }), 300, timing, () => 0);
	assert.deepEqual(short.history, []);
	refuses(() => takeBack(short, 2), 'There is nothing to undo.');
	assert.equal(nextDeadline(short), 1300);
	// Switching the timer off ends the clocks and the history alike; undo alone keeps the history.
	assert.deepEqual(settings(long, 'a', { timer: 0 }).history, []);
	assert.equal(settings(long, 'a', { undo: true }).history, long.history);
});

test('the history keeps the newest 20 steps', () => {
	assert.equal(HISTORY_LIMIT, 20);
	// Seat 2 gains 1 resource of their choice 25 times in a turn.
	const game = structuredClone(startedGame(2).state);
	assert.equal(game.current, 2);
	push(
		game,
		game.pending,
		Array.from({ length: 25 }, () => ({
			player: 2,
			kind: 'effects',
			effects: [{ gain: { any: 1 } }],
		}))
	);
	run(game, () => 0);
	let room = table(game);
	/** @type {State[]} */
	const before = [];
	for (let i = 0; i < 25; i++) {
		before.push(gameOf(room));
		room = pick(room, 2, 'chooseResource');
		assert.equal(room.history.length, Math.min(i + 1, HISTORY_LIMIT));
	}
	assert.equal(room.history[0].game, before[5], 'the oldest went first');
	assert.equal(room.history.at(-1)?.game, before[24]);
	for (let i = 0; i < HISTORY_LIMIT; i++) {
		room = takeBack(room, 2);
	}
	assert.deepEqual(
		openDecisions(gameOf(room)),
		openDecisions(before[5]),
		'back to the sixth choice'
	);
	refuses(() => takeBack(room, 2), 'There is nothing to undo.');
});

test('canUndo is true only for the seat whose step is last', () => {
	const ready = wagons().room;
	assert.equal(roomView(ready, 'b').canUndo, false, 'nothing to undo yet');
	const room = answer(ready, 2, 'chooseTurn', { turn: 'advance' });
	assert.equal(roomView(room, 'b').canUndo, true);
	assert.equal(roomView(room, 'a').canUndo, false);
	const view = roomView(room, 'b');
	assert.ok(!('history' in view), 'the history never shows');
	assert.equal(
		roomView(settings(room, 'a', { undo: false }), 'b').canUndo,
		false
	);
	assert.equal(roomView({ ...room, undo: false }, 'b').canUndo, false);
	// After the turn passes, until seat 1's first choice.
	const passed = pick(toPlacement(ready), 2, 'choosePlacement');
	assert.equal(roomView(passed, 'b').canUndo, true);
	assert.equal(roomView(passed, 'a').canUndo, false);
	// At one screen: never in the public view, only as seat 2.
	const local = answer(wagons({ mode: 'hotseat' }).room, 2, 'chooseTurn', {
		turn: 'advance',
	});
	assert.equal(roomView(local, 'a').viewing, null);
	assert.equal(roomView(local, 'a').canUndo, false);
	assert.equal(roomView(local, 'a', 2).canUndo, true);
	assert.equal(roomView(local, 'a', 1).canUndo, false);
	assert.equal(roomView(takeBack(local, 2), 'a', 2).canUndo, false);
});
