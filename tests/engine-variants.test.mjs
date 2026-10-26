// Tests for the optional variants a table may switch on (#53).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { view } from '../src/lib/engine/view.js';
import { openDecisions } from '../src/lib/engine/stack.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import { play } from '../src/lib/engine/play.js';
import { answer, readyTurn, startedGame } from './helpers/engine.mjs';

/** @typedef {import('../src/lib/engine/state.js').State} State */
/** @typedef {import('../src/lib/engine/random.js').Random} Random */

/**
 * The current player takes an income turn, run until the next decision.
 * @param {State} state
 * @param {Random} random
 */
function takeIncome(state, random) {
	const player = /** @type {number} */ (state.current);
	return {
		state: answer(state, random, player, 'chooseTurn', { turn: 'income' }),
		player,
	};
}

/**
 * Answers a player's open decisions with their defaults until a decision of `kind` opens or the player has none left.
 * @param {State} state
 * @param {Random} random
 * @param {number} player
 * @param {string} kind
 * @returns {State}
 */
function answerUntil(state, random, player, kind) {
	for (;;) {
		const open = openDecisions(state).find((d) => d.player === player);
		if (!open || open.kind === kind) {
			return state;
		}
		const [first] = DECISIONS[open.kind].answers(state, open);
		state = play(state, player, { decision: open.id, ...first }, random);
	}
}

/**
 * The open decision of a kind, if any.
 * @param {State} state
 * @param {string} kind
 */
const openOf = (state, kind) =>
	openDecisions(state).find((d) => d.kind === kind);

/**
 * Whether a view shows an id anywhere.
 * @param {unknown} seen
 * @param {string} id
 */
const shows = (seen, id) => JSON.stringify(seen).includes(`"${id}"`);

test('tapestry-draft: income turn 1 draws 2 tapestry cards and asks which to keep', () => {
	const { state: started, random } = startedGame(2, {
		variants: ['tapestry-draft'],
	});
	const top = started.supply.tapestry.deck.slice(0, 2);
	const { state, player } = takeIncome(started, random);
	const keep = openOf(state, 'chooseKeep');
	assert.ok(keep);
	assert.equal(keep.player, player);
	assert.deepEqual(keep.options, top);
	assert.equal(keep.keep, 1);
	assert.deepEqual(state.seats[player - 1].hand, top);
	assert.deepEqual(
		DECISIONS.chooseKeep.answers(state, keep),
		top.map((card) => ({ card }))
	);
	const other = player === 1 ? 2 : 1;
	for (const card of top) {
		assert.ok(!shows(view(state, other), card), card);
	}
	assert.throws(
		() => answer(state, random, player, 'chooseKeep', { card: 'nope' }),
		{ name: 'PlayerError' }
	);

	const after = answer(state, random, player, 'chooseKeep', {
		card: top[1],
	});
	assert.deepEqual(after.seats[player - 1].hand, [top[1]]);
	assert.deepEqual(after.supply.tapestry.discard, [top[0]]);
	const discarded = after.events.find((e) => e.type === 'cardsDiscarded');
	assert.equal(discarded?.player, player);
	assert.equal(discarded?.deck, 'tapestry');
	assert.deepEqual(discarded?.cards, [top[0]]);
	assert.equal(openOf(after, 'chooseKeep'), undefined);
});

test('tapestry-draft: without the variant, income turn 1 draws 1 card and asks nothing', () => {
	const { state: started, random } = startedGame(2);
	const [first] = started.supply.tapestry.deck;
	const { state, player } = takeIncome(started, random);
	assert.equal(openOf(state, 'chooseKeep'), undefined);
	assert.deepEqual(state.seats[player - 1].hand, [first]);
});

test('tapestry-draft: income turn 2 draws its 1 card as usual', () => {
	const { state: ready, random } = readyTurn(2, () => {}, {
		variants: ['tapestry-draft'],
	});
	const { state: taken, player } = takeIncome(ready, random);
	const state = answerUntil(taken, random, player, 'chooseKeep');
	assert.equal(openOf(state, 'chooseKeep'), undefined);
	assert.equal(state.seats[player - 1].incomeTurns, 2);
	assert.equal(state.seats[player - 1].hand.length, 1);
});

test('tapestry-draft: with 1 card left in the deck and none in the discards, it is gained without a question', () => {
	const { state: started, random } = startedGame(2, {
		variants: ['tapestry-draft'],
	});
	const [last] = started.supply.tapestry.deck;
	started.supply.tapestry.deck = [last];
	const { state, player } = takeIncome(started, random);
	assert.equal(openOf(state, 'chooseKeep'), undefined);
	assert.deepEqual(state.seats[player - 1].hand, [last]);
});

test('tapestry-draft: gaining a tapestry card triggers for the kept card only (Academia)', () => {
	const { state: started, random } = startedGame(2, {
		variants: ['tapestry-draft'],
	});
	const player = /** @type {number} */ (started.current);
	started.seats[player - 1].era = { card: null, ability: 'academia' };
	const { state } = takeIncome(started, random);
	assert.equal(state.seats[player - 1].vp, 0);
	const [card] = openOf(state, 'chooseKeep')?.options ?? [];
	const after = answer(state, random, player, 'chooseKeep', { card });
	assert.equal(after.seats[player - 1].vp, 3);
});
