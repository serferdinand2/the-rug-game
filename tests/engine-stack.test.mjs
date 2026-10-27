// Tests for the operation stack and the run loop (#13, task 2).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { seededRandom } from '../src/lib/engine/random.js';
import {
	push,
	pushGroup,
	openDecisions,
	locate,
} from '../src/lib/engine/stack.js';
import { run, resolveEffects, contextFor } from '../src/lib/engine/loop.js';
import {
	chooseTurn,
	turnOptions,
} from '../src/lib/engine/decisions/choose-turn.js';
import { startedGame } from './helpers/engine.mjs';

function fixture() {
	return {
		seats: [
			{ seat: 1, kind: 'player', vp: 0, vpSources: {}, incomeTurns: 0 },
			{ seat: 2, kind: 'player', vp: 0, vpSources: {}, incomeTurns: 0 },
		],
		pending: [],
		nextId: 1,
		seq: 0,
		events: [],
	};
}
const turn = (p) => ({ player: p, kind: 'chooseTurn', options: ['income'] });
const effects = (p, list) => ({ player: p, kind: 'effects', effects: list });

test('pushed operations get increasing ids and the first goes on top', () => {
	const state = fixture();
	push(state, state.pending, [turn(1), turn(2)]);
	assert.deepEqual(
		state.pending.map((op) => [op.id, op.batch, op.player]),
		[
			[1, 1, 1],
			[2, 1, 2],
		]
	);
});

test('only the top batch of decisions is open', () => {
	const state = fixture();
	push(state, state.pending, [turn(1), turn(2)]);
	push(state, state.pending, [turn(1)]);
	assert.deepEqual(
		openDecisions(state).map((op) => op.id),
		[3]
	);
	state.pending.shift();
	assert.deepEqual(
		openDecisions(state).map((op) => op.id),
		[1, 2]
	);
});

test('the run loop runs automatic operations until a decision', () => {
	const state = fixture();
	push(state, state.pending, [turn(1)]);
	push(state, state.pending, [effects(1, [{ vp: 2 }, { vp: 3 }])]);
	run(state, seededRandom(1));
	assert.equal(state.seats[0].vp, 5);
	assert.equal(state.pending[0].kind, 'chooseTurn');
	assert.deepEqual(
		state.events.map((e) => e.type),
		['vpGained', 'vpGained']
	);
});

test('an effect that is not built yet is a bug, not a PlayerError', () => {
	const state = fixture();
	push(state, state.pending, [effects(1, [{ notBuilt: {} }])]);
	assert.throws(
		() => run(state, seededRandom(1)),
		(e) =>
			e instanceof Error &&
			e.name !== 'PlayerError' &&
			/notBuilt/.test(e.message)
	);
});

test('a group opens every lane at once', () => {
	const state = fixture();
	pushGroup(state, [
		{ player: 1, ops: [turn(1)] },
		{ player: 2, ops: [turn(2)] },
	]);
	run(state, seededRandom(1));
	assert.deepEqual(
		openDecisions(state).map((op) => op.player),
		[1, 2]
	);
});

test('automatic operations in a lane run straight away, and an empty group comes off the stack', () => {
	const state = fixture();
	push(state, state.pending, [turn(1)]);
	pushGroup(state, [
		{ player: 1, ops: [effects(1, [{ vp: 1 }])] },
		{ player: 2, ops: [effects(2, [{ vp: 4 }])] },
	]);
	run(state, seededRandom(1));
	assert.deepEqual(
		state.seats.map((s) => s.vp),
		[1, 4]
	);
	assert.equal(state.pending[0].kind, 'chooseTurn');
});

test('locate finds a decision in a lane and says whether it is open', () => {
	const state = fixture();
	pushGroup(state, [
		{ player: 1, ops: [turn(1)] },
		{ player: 2, ops: [turn(2)] },
	]);
	const group = state.pending[0];
	push(state, group.lanes[0].stack, [turn(1)]);
	push(state, group.lanes[0].stack, [turn(1)]);
	const [top, below] = group.lanes[0].stack;
	assert.equal(locate(state, top.id).open, true);
	assert.equal(locate(state, below.id).open, false);
	assert.equal(locate(state, top.id).stack, group.lanes[0].stack);
	assert.equal(locate(state, 999), null);
});

test('decisions pushed together in a lane are all open', () => {
	const state = fixture();
	pushGroup(state, [
		{ player: 1, ops: [turn(1), turn(1)] },
		{ player: 2, ops: [turn(2)] },
	]);
	run(state, seededRandom(1));
	assert.equal(openDecisions(state).length, 3);
	for (const op of state.pending[0].lanes[0].stack) {
		assert.equal(locate(state, op.id).open, true);
	}
});

test('pushGroup inside a lane is an Error, and push targets the lane', () => {
	const state = fixture();
	pushGroup(state, [{ player: 1, ops: [turn(1)] }]);
	const lane = state.pending[0].lanes[0];
	const ctx = contextFor(state, seededRandom(1), lane.stack);
	assert.throws(() => ctx.pushGroup([]), Error);
	ctx.push([turn(1)]);
	assert.equal(lane.stack.length, 2);
});

test('resolveEffects returns a new state and leaves its input alone', () => {
	const state = fixture();
	const snapshot = structuredClone(state);
	const next = resolveEffects(state, 1, [{ vp: 3 }], seededRandom(1));
	assert.deepEqual(state, snapshot);
	assert.equal(next.seats[0].vp, 3);
});

test('chooseTurn offers only income on a first turn (01 §4.1)', () => {
	const { state: started } = startedGame(2);
	assert.deepEqual(turnOptions(started, 1), ['income']);
	const later = structuredClone(started);
	later.seats[0].incomeTurns = 2;
	later.seats[0].resources.coin = 1;
	assert.deepEqual(turnOptions(later, 1), ['income', 'advance']);
	const decision = {
		id: 1,
		batch: 1,
		player: 1,
		kind: 'chooseTurn',
		options: ['income'],
	};
	assert.deepEqual(chooseTurn.answers(fixture(), decision), [
		{ turn: 'income' },
	]);
	assert.throws(
		() => chooseTurn.check(fixture(), decision, { turn: 'advance' }),
		{
			name: 'PlayerError',
			message: /first turn must be an income turn/,
		}
	);
	assert.throws(
		() => chooseTurn.check(fixture(), decision, { turn: 'nap' }),
		{
			name: 'PlayerError',
		}
	);
});
