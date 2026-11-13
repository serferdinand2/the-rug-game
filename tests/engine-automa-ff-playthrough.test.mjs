// Scripted full solo games for the F&F Automa civilizations (#41).
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

function setupFor(civilization, expansions, variants) {
	for (let seed = 1; seed <= 1000; seed++) {
		const random = seededRandom(seed);
		const state = createGame({
			version: 'current',
			expansions,
			variants,
			participants,
			random,
		});
		if (state.seats[1].civilization === civilization)
			return { state, random, seed };
	}
	throw new Error(`Could not find a seeded ${civilization} setup.`);
}

function playSolo(civilization, expansions, variants) {
	const { seed, random, state: initial } = setupFor(
		civilization,
		expansions,
		variants
	);
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
		const answer = answers[choose(answers.length)];
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

const ffSetups = [
	['F&F', ['ff'], []],
	['P&P + F&F', ['pp', 'ff'], []],
	['A&A + F&F without arts track', ['aa', 'ff'], ['no-arts-track']],
	[
		'P&P + A&A + F&F without arts track',
		['pp', 'aa', 'ff'],
		['no-arts-track'],
	],
];

test.each(ffSetups.flatMap(([setup, expansions, variants]) =>
	['charmers', 'erratics', 'time-travelers'].map((civilization) => [
		civilization,
		setup,
		expansions,
		variants,
	])
))(
	'%s completes a full F&F solo game with %s',
	(civilization, _setup, expansions, variants) => {
		const state = playSolo(civilization, expansions, variants);
		const bot = state.seats[1];
		if (civilization === 'charmers') {
			assert.ok(Array.isArray(bot.faceUpCharms));
			assert.ok(Array.isArray(bot.charmDeck));
		}
		if (civilization === 'erratics') {
			const shadow = state.seats.find((seat) => seat.kind === 'shadow');
			assert.ok(shadow);
			assert.ok(Object.values(shadow.tracks).every((tokens) => tokens.length === 0));
		}
		if (civilization === 'time-travelers') {
			assert.ok(bot.timeTravelersLandmark);
		}
	}
);
