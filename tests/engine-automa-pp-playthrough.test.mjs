// Scripted full solo games for the P&P Automa civilizations in scope (#34).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { createGame, play, view } from '../src/lib/engine/game.js';
import { openDecisions } from '../src/lib/engine/stack.js';
import { seededRandom } from '../src/lib/engine/random.js';
import { allOps } from './helpers/views.mjs';

const participants = [
	{ kind: 'player', name: 'Ana' },
	{ kind: 'automa', name: 'Automa', level: 2 },
	{ kind: 'shadow', name: 'Shadow' },
];

function setupFor(civilization) {
	for (let seed = 1; seed <= 500; seed++) {
		const random = seededRandom(seed);
		const state = createGame({
			version: 'current',
			expansions: ['pp'],
			participants,
			random,
		});
		if (state.seats[1].civilization === civilization)
			return { state, random, seed };
	}
	throw new Error(`Could not find a seeded ${civilization} setup.`);
}

function playSolo(civilization) {
	const { seed, random, state: initial } = setupFor(civilization);
	let state = initial;
	const choose = seededRandom(seed * 7919);
	let actions = 0;
	for (; actions < 5000; actions++) {
		const open = openDecisions(state);
		if (open.length === 0) break;
		const decision = open[choose(open.length)];
		const visible = allOps(view(state, decision.player)).find(
			(op) => op.id === decision.id
		);
		assert.ok(visible, `decision ${decision.id} is visible to its player`);
		const answers = visible.answers ?? [];
		assert.ok(answers.length, `${decision.kind} has a legal answer`);
		let answer = answers[choose(answers.length)];
		if (decision.kind === 'chooseHuckstersTile')
			answer = answers.find((option) => option.pile === 'supply') ?? answer;
		if (decision.kind === 'chooseHuckstersTapestry')
			answer = answers.find((option) => option.card === null) ?? answer;
		state = play(
			state,
			decision.player,
			{ decision: decision.id, ...answer },
			random
		);
	}
	assert.ok(actions < 5000, `${civilization} solo game completes`);
	assert.equal(state.phase, 'over');
	assert.equal(state.seats[1].civilization, civilization);
	assert.equal(state.seats[0].incomeTurns, 5, 'human completes five incomes');
	assert.equal(state.seats[1].incomeTurns, 5, 'Automa completes five incomes');
	return state;
}

test.each(['equalizers', 'hucksters'])(
	'%s completes a full Plans & Ploys solo game',
	(civilization) => {
		const state = playSolo(civilization);
		const bot = state.seats[1];
		if (civilization === 'hucksters') {
			const pooled = Object.values(bot.huckstersPool).reduce(
				(total, items) => total + items.length,
				0
			);
			assert.equal(pooled, 7, 'setup and income turns 2–5 add pool items');
		}
	}
);
