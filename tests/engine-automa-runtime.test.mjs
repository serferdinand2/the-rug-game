import assert from 'node:assert/strict';
import { test } from 'vitest';
import { createGame } from '../src/lib/engine/setup.js';
import { seededRandom } from '../src/lib/engine/random.js';
import { contextFor, run } from '../src/lib/engine/loop.js';
import { startTurn } from '../src/lib/engine/turn.js';
import { openDecisions } from '../src/lib/engine/stack.js';
import { chooseAutomaCivilization } from '../src/lib/engine/automa.js';
import '../src/lib/engine/kinds.js';

function table(solo, level = 2) {
	const random = seededRandom(3109);
	const participants = solo
		? [
				{ kind: 'player', name: 'Ana' },
				{ kind: 'automa', name: 'Egypt', level },
				{ kind: 'shadow', name: 'Mesopotamia' },
			]
		: [
				{ kind: 'player', name: 'Ana' },
				{ kind: 'player', name: 'Bo' },
				{ kind: 'shadow', name: 'Egypt' },
			];
	const state = createGame({ participants, version: 'current', random });
	state.pending = [];
	state.phase = 'play';
	for (const seat of state.seats.filter((s) => s.kind === 'player'))
		seat.incomeTurns = 1;
	return { state, random, ctx: contextFor(state, random, state.pending) };
}

test('standalone Shadow plays its own automatic turn and leaves every open question to a human', () => {
	const { state, random, ctx } = table(false);
	startTurn(ctx, 3);
	run(state, random);
	assert.equal(state.current, 1);
	assert.equal(state.seats[2].incomeTurns, 0);
	assert.equal(state.seats[2].decisionDeck.length, 10);
	assert.equal(state.seats[2].vp, 0);
	assert.ok(
		openDecisions(state).every(
			(op) => state.seats[op.player - 1].kind === 'player'
		)
	);
});

test('the solo pair takes one shared advance turn and Shadow never receives an independent question', () => {
	const { state, random, ctx } = table(true);
	state.seats[1].incomeTurns = 1;
	startTurn(ctx, 2);
	run(state, random);
	assert.equal(state.current, 1);
	assert.equal(state.seats[1].decisionDeck.length, 6);
	assert.ok(
		state.events.some(
			(event) => event.type === 'tokenMoved' && event.player === 2
		)
	);
	assert.ok(
		state.events.some(
			(event) => event.type === 'tokenMoved' && event.player === 3
		)
	);
	assert.ok(openDecisions(state).every((op) => op.player === 1));
});

test('the pair stops after its fifth income turn while the human continues', () => {
	const { state, random, ctx } = table(true);
	state.seats[1].incomeTurns = 4;
	state.seats[1].decisionDeck = [];
	startTurn(ctx, 2);
	run(state, random);
	assert.equal(state.seats[1].incomeTurns, 5);
	assert.equal(state.seats[1].finished, true);
	assert.equal(state.seats[2].finished, true);
	assert.equal(state.current, 1);
});

test('level 6 offers the human a distinct second Automa civilization without changing its favourite', () => {
	const { state, ctx } = table(true, 6);
	const bot = state.seats[1],
		before = bot.favouriteTrack;
	const op = { player: 1, bot: 2 };
	const answers = chooseAutomaCivilization.answers(state, op);
	assert.equal(answers.length, 3);
	assert.ok(answers.every((a) => a.civilization !== bot.civilization));
	chooseAutomaCivilization.resolve(ctx, op, answers[0]);
	assert.equal(bot.secondCivilization, answers[0].civilization);
	assert.equal(bot.favouriteTrack, before);
});
