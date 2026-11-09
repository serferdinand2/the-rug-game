// Arts & Architecture's 5 civilizations (#37 part 3), numbers as 03 §2.4: the deck, then each civilization.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import {
	AA_CIVS,
	BASE_CIVS,
	PP_CIVS,
	civsFor,
} from '../src/lib/engine/decks.js';
import { contextFor, run } from '../src/lib/engine/loop.js';
import { openDecisions } from '../src/lib/engine/stack.js';
import { endTurn } from '../src/lib/engine/turn.js';
import { emit } from '../src/lib/engine/events.js';
import { answer, startedGame } from './helpers/engine.mjs';
import { AA } from './helpers/arts.mjs';

/**
 * A started A&A game for 3 players, seat 1 holding `civ`, its pending stack cleared, after `fill` changes it.
 * @param {string} civ
 * @param {(state: any) => void} [fill]
 * @param {Record<string, any>} [options]
 */
function holding(civ, fill = () => {}, options = {}) {
	const { state, random } = startedGame(3, {
		...AA,
		...options,
		civs: [civ, 'leaders', 'nomads'],
	});
	state.pending.length = 0;
	fill(state);
	return { state, random };
}

/**
 * Ends seat 1's turn of a kind, as the engine does once the turn's work is done, and runs what follows until a
 * question.
 * @param {any} state
 * @param {any} random
 * @param {'advance' | 'income'} kind
 * @param {string[]} [gained] - Event types emitted during the turn first, such as 'buildingGained'
 */
function endOf(state, random, kind, gained = []) {
	state.current = 1;
	state.turnKind = kind;
	emit(state, { type: 'turnStarted', player: 1 });
	for (const type of gained) {
		emit(state, { type, player: 1, building: 'farm', landmark: 'forge' });
	}
	endTurn(contextFor(state, random, state.pending), {
		id: 0,
		batch: 0,
		player: 1,
		kind: 'endTurn',
	});
	run(state, random);
	return state;
}

// The deck

test("A&A's civilizations join its deck after the base and P&P ones, as they are built", () => {
	assert.deepEqual(civsFor([]), [...BASE_CIVS]);
	assert.deepEqual(civsFor(['pp']), [...BASE_CIVS, ...PP_CIVS]);
	assert.deepEqual(civsFor(['aa']), [...BASE_CIVS, ...AA_CIVS]);
	assert.deepEqual(civsFor(['pp', 'aa']), [
		...BASE_CIVS,
		...PP_CIVS,
		...AA_CIVS,
	]);
	assert.ok(AA_CIVS.includes('relentless'));
	// The one-expansion variant stays Plans & Ploys' (#37 design §4).
	assert.deepEqual(civsFor(['pp', 'aa'], ['civs-from-pp']), [...PP_CIVS]);
});

// The Relentless

test('the Relentless: a token at the end of an income or advance turn on which a building or landmark was gained', () => {
	const { state, random } = holding('relentless');
	const tokens = () => state.seats[0].civData.relentless.tokens;
	assert.equal(tokens(), 0);
	endOf(state, random, 'income', ['buildingGained']);
	assert.equal(tokens(), 1);
	state.pending.length = 0;
	endOf(state, random, 'advance', ['landmarkGained']);
	assert.equal(tokens(), 2);
	// An income turn without a building keeps them.
	state.pending.length = 0;
	endOf(state, random, 'income');
	assert.equal(tokens(), 2);
});

test('the Relentless: an advance turn without one cashes them in: 2 tokens are 3 VP and a tapestry card', () => {
	const { state, random } = holding('relentless', (s) => {
		s.seats[0].civData.relentless.tokens = 2;
	});
	const vp = state.seats[0].vp;
	const hand = state.seats[0].hand.length;
	endOf(state, random, 'advance');
	assert.equal(state.seats[0].civData.relentless.tokens, 0);
	assert.equal(state.seats[0].vp, vp + 3);
	assert.equal(state.seats[0].hand.length, hand + 1);
});

test("the Relentless' chart: 1, 3, 6, 10 and 15 VP, with a choice of extras from 3 tokens (R62: the teal icon is explore)", () => {
	/** @type {[number, number, number][]} */
	const chart = [
		[1, 1, 0],
		[3, 6, 2],
		[4, 10, 3],
		[5, 15, 4],
		[7, 15, 4],
	];
	for (const [count, vp, extras] of chart) {
		const { state, random } = holding('relentless', (s) => {
			s.seats[0].civData.relentless.tokens = count;
		});
		const before = state.seats[0].vp;
		endOf(state, random, 'advance');
		assert.equal(state.seats[0].vp, before + vp, `${count} tokens`);
		const [choice] = openDecisions(state);
		if (extras === 0) {
			assert.notEqual(choice?.kind, 'chooseOption', `${count} tokens`);
			continue;
		}
		assert.equal(choice.kind, 'chooseOption', `${count} tokens`);
		assert.deepEqual(
			choice.options,
			[
				[{ gain: { tapestry: 1 } }],
				[{ gain: { any: 1 } }],
				[{ explore: {} }],
				[{ invent: {} }],
			].slice(0, extras),
			`${count} tokens`
		);
		const next = answer(state, random, 1, 'chooseOption', { option: 0 });
		assert.equal(next.seats[0].civData.relentless.tokens, 0);
	}
});
