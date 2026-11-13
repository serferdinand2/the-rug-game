// Hucksters tech can be invented in place of the normal choices, without bypassing invention.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { createGame } from '../src/lib/engine/game.js';
import { seededRandom } from '../src/lib/engine/random.js';
import { contextFor } from '../src/lib/engine/loop.js';
import { inventAnswers, inventCard } from '../src/lib/engine/effects/tech.js';
import { chooseInvent } from '../src/lib/engine/decisions/choose-invent.js';
import { addHuckstersItem } from '../src/lib/engine/automa-expansion-pp.js';

function setup() {
	const random = seededRandom(31);
	const state = createGame({
		version: 'current',
		random,
		participants: [
			{ kind: 'player', name: 'Ana' },
			{ kind: 'automa', name: 'Automa', level: 2 },
			{ kind: 'shadow', name: 'Shadow' },
		],
	});
	state.pending = [];
	state.seats[1].civilization = 'hucksters';
	state.current = 1;
	state.turnKind = 'advance';
	const ctx = contextFor(state, random, state.pending);
	const card = addHuckstersItem(ctx, 2, 'tech');
	return { state, ctx, card };
}

test('the Hucksters tech card is an explicit invent choice only on the human advance turn', () => {
	const { state, card } = setup();
	const decision = { player: 1, kind: 'chooseInvent', left: 1 };
	const answers = inventAnswers(state, decision);
	assert.ok(
		answers.some(
			(a) => a.card === card && a.from === 'hucksters' && a.owner === 2
		)
	);
	assert.ok(answers.some((a) => a.from !== 'hucksters'));
	assert.throws(() =>
		chooseInvent.check(state, decision, {
			card,
			from: 'hucksters',
			owner: 3,
		})
	);
	state.turnKind = 'income';
	assert.equal(
		inventAnswers(state, decision).some((a) => a.from === 'hucksters'),
		false
	);
});

test('inventing from Hucksters removes its card, emits invention and queues normal follow-up effects', () => {
	const { state, ctx, card } = setup();
	const display = [...state.supply.tech.faceUp];
	inventCard(ctx, 1, { card, from: 'hucksters', owner: 2 }, 1, {
		thenUpgrade: true,
	});
	assert.ok(state.seats[0].tech.bottom.includes(card));
	assert.deepEqual(state.supply.tech.faceUp, display);
	assert.deepEqual(state.seats[1].huckstersPool.tech, []);
	assert.ok(
		state.events.some(
			(e) =>
				e.type === 'techInvented' &&
				e.card === card &&
				e.from === 'hucksters'
		)
	);
	assert.ok(
		state.pending.some(
			(op) => op.kind === 'upgradeTech' && op.card === card
		)
	);
	assert.throws(() =>
		inventCard(ctx, 1, { card, from: 'hucksters', owner: 2 }, 1)
	);
});

test('a Time Travelers landmark tech card cannot be invented from the Recyclers discard', () => {
	const { state } = setup();
	state.seats[0].civs = ['recyclers'];
	state.seats[1].civilization = 'time-travelers';
	state.seats[1].timeTravelersLandmark = 'bakery';
	state.supply.tech.discard = ['bakery', 'radio'];
	const answers = inventAnswers(state, { player: 1 });
	assert.equal(
		answers.some(
			(answer) => answer.card === 'bakery' && answer.from === 'discard'
		),
		false
	);
	assert.equal(
		answers.some(
			(answer) => answer.card === 'radio' && answer.from === 'discard'
		),
		true
	);
});
