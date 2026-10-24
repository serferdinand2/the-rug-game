// Tests for paying costs: resources, and discarded tiles and cards (#14).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
	canPay,
	payments,
	checkPayment,
	pay,
} from '../src/lib/engine/payment.js';
import { contextFor } from '../src/lib/engine/loop.js';
import { startedGame } from './helpers/engine.mjs';

/**
 * A started 2-player game whose seat 1 holds what `fill` gives it.
 * @param {(seat: any) => void} fill
 */
function holding(fill) {
	const { state, random } = startedGame(2);
	const next = structuredClone(state);
	fill(next.seats[0]);
	return { state: next, random };
}

test('a tier II cost is the track resource plus 1 of any kind, the track resource included', () => {
	const { state } = holding((seat) => {
		seat.resources.food = 2;
		seat.resources.coin = 1;
	});
	assert.deepEqual(payments(state, 1, { food: 1, any: 1 }), [
		{ coin: 1, food: 1 },
		{ food: 2 },
	]);
	assert.equal(canPay(state, 1, { food: 1, any: 1 }), true);
});

test('a cost the player cannot meet has no payments', () => {
	const { state } = holding((seat) => {
		seat.resources.coin = 1;
	});
	assert.equal(canPay(state, 1, { food: 2 }), false);
	assert.deepEqual(payments(state, 1, { food: 2 }), []);
	assert.equal(canPay(state, 1, { coin: 1, any: 1 }), false);
	assert.equal(canPay(state, 1, { territory: 2 }), false);
});

test('a payment must be exactly the cost', () => {
	const { state } = holding((seat) => {
		seat.resources.food = 3;
		seat.resources.coin = 3;
	});
	const cost = { food: 1, any: 1 };
	for (const payment of [
		{ food: 1 },
		{ food: 1, coin: 2 },
		{ coin: 2 },
		{ food: -1, coin: 3 },
		{ food: 1.5, coin: 0.5 },
		{ food: 1, gold: 1 },
		{ food: 1, territory: [] },
		null,
		'food',
	]) {
		assert.throws(
			() => checkPayment(state, 1, cost, /** @type {any} */ (payment)),
			{ name: 'PlayerError' },
			JSON.stringify(payment)
		);
	}
	assert.doesNotThrow(() =>
		checkPayment(state, 1, cost, { food: 1, coin: 1 })
	);
});

test('a payment may not spend resources the player lacks', () => {
	const { state } = holding((seat) => {
		seat.resources.food = 1;
	});
	assert.throws(() => checkPayment(state, 1, { any: 1 }, { coin: 1 }), {
		name: 'PlayerError',
		message: /coin/,
	});
});

test('discards name tiles and cards the player holds, each once', () => {
	const { state } = holding((seat) => {
		seat.territoryTiles = [5, 9, 12];
		seat.hand = ['age-of-sail', 'trap-1'];
		seat.tech = { bottom: ['pottery'], middle: ['clocks'], top: ['radio'] };
	});
	assert.deepEqual(payments(state, 1, { territory: 2 }), [
		{ territory: [5, 9] },
		{ territory: [5, 12] },
		{ territory: [9, 12] },
	]);
	assert.deepEqual(payments(state, 1, { tapestry: 2 }), [
		{ tapestry: ['age-of-sail', 'trap-1'] },
	]);
	assert.equal(payments(state, 1, { tech: 3 }).length, 1);
	for (const payment of [
		{ territory: [5, 5] },
		{ territory: [5, 40] },
		{ territory: [5] },
		{ territory: [5, 9], coin: 1 },
		{ territory: '5,9' },
	]) {
		assert.throws(
			() =>
				checkPayment(
					state,
					1,
					{ territory: 2 },
					/** @type {any} */ (payment)
				),
			{ name: 'PlayerError' },
			JSON.stringify(payment)
		);
	}
});

test('paying discards territory tiles out of the game and cards onto their public piles (FAQ #20)', () => {
	const { state, random } = holding((seat) => {
		seat.resources.coin = 2;
		seat.territoryTiles = [5, 9, 12];
		seat.hand = ['age-of-sail', 'trap-1', 'capitalism'];
		seat.tech = { bottom: ['pottery'], middle: ['clocks'], top: ['radio'] };
	});
	const ctx = contextFor(state, random, state.pending);
	const before = state.events.length;
	pay(ctx, 1, { coin: 1 });
	pay(ctx, 1, { territory: [5, 12] });
	pay(ctx, 1, { tapestry: ['trap-1', 'capitalism'] });
	pay(ctx, 1, { tech: ['clocks', 'radio'] });
	const seat = /** @type {any} */ (state.seats[0]);
	assert.equal(seat.resources.coin, 1);
	assert.deepEqual(seat.territoryTiles, [9]);
	assert.deepEqual(state.supply.territoryDiscard, [5, 12]);
	assert.deepEqual(seat.hand, ['age-of-sail']);
	assert.deepEqual(state.supply.tapestry.discard, ['trap-1', 'capitalism']);
	assert.deepEqual(seat.tech, { bottom: ['pottery'], middle: [], top: [] });
	assert.deepEqual(state.supply.tech.discard, ['clocks', 'radio']);
	assert.deepEqual(
		state.events.slice(before).map(({ seq: _seq, ...event }) => event),
		[
			{ type: 'resourcesPaid', player: 1, paid: { coin: 1 } },
			{
				type: 'tilesDiscarded',
				player: 1,
				stack: 'territory',
				tiles: [5, 12],
			},
			{
				type: 'cardsDiscarded',
				player: 1,
				deck: 'tapestry',
				cards: ['trap-1', 'capitalism'],
			},
			{
				type: 'cardsDiscarded',
				player: 1,
				deck: 'tech',
				cards: ['clocks', 'radio'],
			},
		]
	);
});

test('a new game has an empty territory discard', () => {
	const { state } = startedGame(2);
	assert.deepEqual(state.supply.territoryDiscard, []);
});
