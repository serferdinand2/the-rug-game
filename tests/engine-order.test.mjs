// Tests for the order of a benefit's parts, and for choosing between options (#14).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { push, openDecisions } from '../src/lib/engine/stack.js';
import { run } from '../src/lib/engine/loop.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import { play } from '../src/lib/engine/play.js';
import { startedGame, stubHandoffs } from './helpers/engine.mjs';

/**
 * A started 2-player game with a benefit pushed for seat 1 and run to the next decision.
 * @param {object[]} effects
 * @param {boolean} ordered
 */
function benefit(effects, ordered) {
	const { state: started, random } = startedGame(2);
	const state = structuredClone(started);
	push(state, state.pending, [
		{
			player: 1,
			kind: 'effects',
			effects,
			ordered,
			source: { track: 'technology', space: 9 },
		},
	]);
	run(state, random);
	return { state, random };
}

test('independent parts of an unordered benefit run first, without a question', (t) => {
	const handoffs = stubHandoffs();
	t.after(handoffs.restore);
	const { state } = benefit([{ building: 'farm' }, { vp: 2 }], false);
	const types = state.events.map((e) => e.type);
	assert.ok(types.indexOf('vpGained') < types.indexOf('buildingGained'));
	assert.deepEqual(
		handoffs.calls.map((c) => c.kind),
		['placeBuilding']
	);
	assert.ok(!openDecisions(state).some((d) => d.kind === 'chooseOrder'));
});

test('two parts that both ask the player become a choice of order', (t) => {
	const handoffs = stubHandoffs();
	t.after(handoffs.restore);
	const effects = [{ upgrade: {} }, { techBenefit: { icon: 'circle' } }];
	const { state, random } = benefit(effects, false);
	const [order] = openDecisions(state);
	assert.equal(order.kind, 'chooseOrder');
	assert.deepEqual(order.effects, effects);
	assert.deepEqual(order.source, { track: 'technology', space: 9 });
	assert.deepEqual(DECISIONS.chooseOrder.answers(state, order), [
		{ effect: 0 },
		{ effect: 1 },
	]);
	play(state, 1, { decision: order.id, effect: 1 }, random);
	assert.deepEqual(
		handoffs.calls.map((c) => c.kind),
		['techBenefit', 'upgrade']
	);
});

test('an ordered benefit never asks', (t) => {
	const handoffs = stubHandoffs();
	t.after(handoffs.restore);
	const { state } = benefit(
		[{ upgrade: {} }, { techBenefit: { icon: 'circle' } }],
		true
	);
	assert.deepEqual(
		handoffs.calls.map((c) => c.kind),
		['upgrade', 'techBenefit']
	);
	assert.ok(!openDecisions(state).some((d) => d.kind === 'chooseOrder'));
});

test('a choice asks for one option, and every option may be chosen', (t) => {
	const handoffs = stubHandoffs();
	t.after(handoffs.restore);
	const options = [
		[{ building: 'farm' }],
		[{ building: 'house' }],
		[{ building: 'armory' }],
	];
	const { state, random } = benefit([{ choice: options }], true);
	const [choice] = openDecisions(state);
	assert.equal(choice.kind, 'chooseOption');
	assert.deepEqual(choice.options, options);
	assert.deepEqual(DECISIONS.chooseOption.answers(state, choice), [
		{ option: 0 },
		{ option: 1 },
		{ option: 2 },
	]);
	const next = play(state, 1, { decision: choice.id, option: 2 }, random);
	assert.equal(next.seats[0].incomeMat.buildings.armory, 4);
	assert.deepEqual(handoffs.calls, [
		{ kind: 'placeBuilding', player: 1, value: { building: 'armory' } },
	]);
});

test('an order or option answer must be one of those offered', (t) => {
	const handoffs = stubHandoffs();
	t.after(handoffs.restore);
	const order = benefit([{ upgrade: {} }, { invent: {} }], false);
	const choice = benefit([{ choice: [[{ vp: 1 }], [{ vp: 2 }]] }], true);
	for (const [game, field] of [
		[order, 'effect'],
		[choice, 'option'],
	]) {
		const [decision] = openDecisions(game.state);
		for (const value of [2, -1, '0', 0.5, undefined]) {
			assert.throws(
				() =>
					play(
						game.state,
						1,
						{ decision: decision.id, [field]: value },
						game.random
					),
				{ name: 'PlayerError' },
				`${field} ${value}`
			);
		}
	}
});
