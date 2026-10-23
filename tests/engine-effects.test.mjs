// Tests for the gain effect and the chooseResource decision (#13, task 5).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { play } from '../src/lib/engine/play.js';
import { openDecisions, pushGroup } from '../src/lib/engine/stack.js';
import { run, resolveEffects } from '../src/lib/engine/loop.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import { startedGame } from './helpers/engine.mjs';

/** A started 2-player game with a pending `gain { any: 2 }` for seat 2. */
function anyChoice() {
	const { state, random } = startedGame(2);
	const after = resolveEffects(state, 2, [{ gain: { any: 2 } }], random);
	const decision = openDecisions(after).find(
		(d) => d.kind === 'chooseResource'
	);
	return { after, decision, random };
}

test('resources stop at 8 and the event reports the loss (01 §1.2)', () => {
	const { state: start, random } = startedGame(2);
	const state = structuredClone(start);
	state.seats[0].resources.coin = 7;
	const after = resolveEffects(
		state,
		1,
		[{ gain: { coin: 3, food: 1 } }],
		random
	);
	assert.equal(after.seats[0].resources.coin, 8);
	assert.deepEqual(after.events.at(-1), {
		seq: after.seq,
		type: 'resourcesGained',
		player: 1,
		gained: { coin: 1, food: 1 },
		lost: { coin: 2 },
	});
});

test('any resources become a choice, after the named ones are gained', () => {
	const { state, random } = startedGame(2);
	const after = resolveEffects(
		state,
		2,
		[{ gain: { food: 1, any: 2 } }],
		random
	);
	assert.equal(after.seats[1].resources.food, 1);
	assert.deepEqual(
		openDecisions(after).map((d) => [d.kind, d.player, d.count, d.from]),
		[['chooseResource', 2, 2, 'any']]
	);
});

test('answering chooseResource gains those resources, then the turn choice is open again', () => {
	const { after, decision, random } = anyChoice();
	const next = play(
		after,
		2,
		{ decision: decision.id, resources: { coin: 1, culture: 1 } },
		random
	);
	assert.equal(next.seats[1].resources.coin, 1);
	assert.equal(next.seats[1].resources.culture, 1);
	assert.equal(openDecisions(next)[0].kind, 'chooseTurn');
});

test('a resource answer that does not add up is refused', () => {
	const { after, decision, random } = anyChoice();
	for (const resources of [
		{ coin: 1 },
		{ coin: 3 },
		{ gold: 2 },
		{ coin: -1, food: 3 },
		{ coin: 1.5, food: 0.5 },
		undefined,
	]) {
		assert.throws(
			() => play(after, 2, { decision: decision.id, resources }, random),
			{ name: 'PlayerError' }
		);
	}
});

test('a resource answer outside the allowed list is refused', () => {
	const { state, random } = startedGame(2);
	const after = structuredClone(state);
	pushGroup(after, [
		{
			player: 1,
			ops: [
				{
					player: 1,
					kind: 'chooseResource',
					count: 1,
					from: ['coin', 'food'],
				},
			],
		},
	]);
	run(after, random);
	const decision = openDecisions(after).find(
		(d) => d.kind === 'chooseResource'
	);
	assert.throws(
		() =>
			play(
				after,
				1,
				{ decision: decision.id, resources: { worker: 1 } },
				random
			),
		{ name: 'PlayerError', message: "You can't choose worker here." }
	);
	assert.throws(
		() =>
			play(
				after,
				1,
				{ decision: decision.id, resources: { coin: 2 } },
				random
			),
		{ name: 'PlayerError', message: 'Choose exactly 1 resource.' }
	);
});

test('chooseResource lists every combination, the ones losing least to the cap first', () => {
	const { after, decision } = anyChoice();
	const state = structuredClone(after);
	state.seats[1].resources.coin = 8;
	const answers = DECISIONS.chooseResource.answers(state, decision);
	assert.equal(answers.length, 10);
	for (const answer of answers) {
		DECISIONS.chooseResource.check(state, decision, answer);
	}
	assert.deepEqual(answers[0], { resources: { worker: 2 } });
	assert.deepEqual(answers.at(-1), { resources: { coin: 2 } });
});

test('territory tiles come face up from the top of the stack', () => {
	const { state, random } = startedGame(2);
	const top = state.supply.territory.slice(0, 2);
	const after = resolveEffects(
		state,
		1,
		[{ gain: { territory: 2 } }],
		random
	);
	assert.deepEqual(after.seats[0].territoryTiles, top);
	assert.equal(
		after.supply.territory.length,
		state.supply.territory.length - 2
	);
	const event = after.events.at(-1);
	assert.equal(event.type, 'tilesGained');
	assert.deepEqual(
		[event.player, event.stack, event.tiles],
		[1, 'territory', top]
	);
	assert.equal('secret' in event, false);
});

test('an empty territory stack gives nothing (01 §7.2)', () => {
	const { state: start, random } = startedGame(2);
	const state = structuredClone(start);
	state.supply.territory = [];
	const after = resolveEffects(
		state,
		1,
		[{ gain: { territory: 2 } }],
		random
	);
	assert.deepEqual(
		after.seats[0].territoryTiles,
		start.seats[0].territoryTiles
	);
	assert.deepEqual(after.events.at(-1).tiles, []);
});

test('space tiles come from the space stack', () => {
	const { state, random } = startedGame(2);
	const top = state.supply.space.slice(0, 3);
	const after = resolveEffects(state, 2, [{ gain: { space: 3 } }], random);
	assert.deepEqual(after.seats[1].spaceTiles, top);
	assert.equal(after.events.at(-1).stack, 'space');
});

test('a tapestry draw reshuffles the discards when the deck is empty (01 §9.1)', () => {
	const { state: start, random } = startedGame(2);
	const state = structuredClone(start);
	state.supply.tapestry = { deck: [], discard: ['academia', 'trap-1'] };
	const before = state.seats[0].hand.length;
	const after = resolveEffects(state, 1, [{ gain: { tapestry: 1 } }], random);
	assert.equal(after.seats[0].hand.length, before + 1);
	assert.equal(after.supply.tapestry.deck.length, 1);
	assert.deepEqual(after.supply.tapestry.discard, []);
	const [shuffled, drawn] = after.events.slice(-2);
	assert.deepEqual(
		[shuffled.type, shuffled.deck, shuffled.count],
		['deckShuffled', 'tapestry', 2]
	);
	assert.equal(drawn.type, 'cardsDrawn');
	assert.equal(drawn.count, 1);
	assert.deepEqual(drawn.secret.cards, after.seats[0].hand.slice(-1));
});

test('with no deck and no discards nothing is drawn', () => {
	const { state: start, random } = startedGame(2);
	const state = structuredClone(start);
	state.supply.tapestry = { deck: [], discard: [] };
	const after = resolveEffects(state, 1, [{ gain: { tapestry: 2 } }], random);
	assert.deepEqual(after.seats[0].hand, start.seats[0].hand);
	assert.equal(after.events.at(-1).type, 'cardsDrawn');
	assert.equal(after.events.at(-1).count, 0);
});

test('an unknown gain key throws', () => {
	const { state, random } = startedGame(2);
	assert.throws(
		() => resolveEffects(state, 1, [{ gain: { gold: 1 } }], random),
		Error
	);
});

test('a choice in one lane keeps the other lanes open', () => {
	const { state: start, random } = startedGame(3);
	const state = structuredClone(start);
	pushGroup(
		state,
		[1, 2, 3].map((player) => ({
			player,
			ops: [{ player, kind: 'effects', effects: [{ gain: { any: 1 } }] }],
		}))
	);
	run(state, random);
	assert.equal(openDecisions(state).length, 3);
	const mine = openDecisions(state).find((d) => d.player === 1);
	let next = play(
		state,
		1,
		{ decision: mine.id, resources: { food: 1 } },
		random
	);
	assert.deepEqual(
		openDecisions(next).map((d) => d.player),
		[2, 3]
	);
	for (const player of [2, 3]) {
		const d = openDecisions(next).find((x) => x.player === player);
		next = play(
			next,
			player,
			{ decision: d.id, resources: { coin: 1 } },
			random
		);
	}
	assert.deepEqual(
		openDecisions(next).map((d) => d.kind),
		['chooseTurn']
	);
});
