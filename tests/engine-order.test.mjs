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
		openDecisions(state).map((d) => [d.kind, d.building]),
		[['choosePlacement', 'farm']]
	);
	assert.deepEqual(handoffs.calls, []);
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
	const after = play(state, 1, { decision: order.id, effect: 1 }, random);
	// The tech benefit ran first (stood in for, #18 task 4), then the upgrade found no card.
	assert.deepEqual(
		handoffs.calls.map((c) => c.kind),
		['techBenefit']
	);
	assert.equal(after.events.filter((e) => e.type === 'noUpgrade').length, 1);
});

test('an explore could change any counter, so it asks for an order beside a VP counter (#17)', () => {
	const effects = [{ explore: {} }, { vp: { per: 'farm' } }];
	const { state } = benefit(effects, false);
	const [order] = openDecisions(state);
	assert.equal(order.kind, 'chooseOrder');
	assert.deepEqual(order.effects, effects);
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
		['techBenefit']
	);
	assert.equal(state.events.filter((e) => e.type === 'noUpgrade').length, 1);
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
	assert.deepEqual(
		openDecisions(next).map((d) => [d.kind, d.building]),
		[['choosePlacement', 'armory']]
	);
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

test('a VP counter waits when another part could change what it counts, and the player chooses the order', (t) => {
	const handoffs = stubHandoffs();
	t.after(handoffs.restore);
	// Space tile 1's shape: advance on science, and 1 VP per science space.
	const { state } = benefit(
		[
			{ advance: { tracks: ['science'] } },
			{ vp: { per: 'trackSpace', track: 'science' } },
		],
		false
	);
	const [order] = openDecisions(state);
	assert.equal(order?.kind, 'chooseOrder');
	assert.equal(state.seats[0].vp, 0);
});

test('Nuclear Bomb asks whether to score before or after the tapestry card on top', (t) => {
	const handoffs = stubHandoffs();
	t.after(handoffs.restore);
	const { state, random } = benefit(
		[
			{ vp: { per: 'trackSpace', track: 'exploration' } },
			{ tapestryOnTop: {} },
		],
		false
	);
	const [order] = openDecisions(state);
	assert.equal(order?.kind, 'chooseOrder');
	play(state, 1, { decision: order.id, effect: 1 }, random);
	assert.deepEqual(
		handoffs.calls.map((c) => c.kind),
		['tapestryOnTop']
	);
});

test('a VP counter that nothing else in the benefit changes runs without a question', (t) => {
	const handoffs = stubHandoffs();
	t.after(handoffs.restore);
	// Steel's shape: 1 VP per armory, and a market.
	const { state: started, random } = startedGame(2);
	const state = structuredClone(started);
	state.seats[0].incomeMat.buildings.armory = 3;
	push(state, state.pending, [
		{
			player: 1,
			kind: 'effects',
			effects: [{ vp: { per: 'armory' } }, { building: 'market' }],
			ordered: false,
		},
	]);
	run(state, random);
	assert.equal(state.seats[0].vp, 2);
	assert.ok(!openDecisions(state).some((d) => d.kind === 'chooseOrder'));
});
