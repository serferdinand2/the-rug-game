// Fantasies & Futures' charms (#39 part 2): when a left or right charm triggers, its order with the card's ability, R67, R72 and R131.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { playTapestry } from '../src/lib/engine/tapestry.js';
import { copyAbility } from '../src/lib/engine/effects/tapestry.js';
import { contextFor, resolveEffects, run } from '../src/lib/engine/loop.js';
import { openDecisions } from '../src/lib/engine/stack.js';
import { readyTurn } from './helpers/engine.mjs';
import { checkState } from './helpers/invariants.mjs';

/**
 * An F&F game whose current player's era slots hold `slots` (face up unless listed in `faceDown`), their turn choice
 * open; every card named is taken out of the deck.
 * @param {string[][]} slots - Eras 1 to 4
 * @param {{ faceDown?: string[], fill?: (seat: any, state: any) => void, version?: 'original' | 'current' }} [options]
 */
function game(slots, { faceDown = [], fill = () => {}, version } = {}) {
	return readyTurn(
		2,
		(seat, state) => {
			const named = slots.flat();
			state.supply.tapestry.deck = state.supply.tapestry.deck.filter(
				(/** @type {string} */ c) => !named.includes(c)
			);
			seat.incomeMat.tapestry = slots.map((slot) => [...slot]);
			seat.incomeMat.faceDown = [...faceDown];
			fill(seat, state);
		},
		{ expansions: ['ff'], ...(version && { version }) }
	);
}

/**
 * Places a card from the deck onto one of the player's era slots and runs until the next decision.
 * @param {any} state
 * @param {any} random
 * @param {number} player
 * @param {string} card
 * @param {number} era
 * @param {boolean} [faceDown]
 */
function place(state, random, player, card, era, faceDown = false) {
	const next = structuredClone(state);
	next.supply.tapestry.deck = next.supply.tapestry.deck.filter(
		(/** @type {string} */ c) => c !== card
	);
	playTapestry(
		contextFor(next, random, next.pending),
		player,
		card,
		era,
		faceDown
	);
	run(next, random);
	return next;
}

/** The charms a player gained in a state's events, as `card side`. */
const gained = (/** @type {any} */ state, /** @type {number} */ player) =>
	state.events
		.filter(
			(/** @type {any} */ e) =>
				e.type === 'charmGained' && e.player === player
		)
		.map((/** @type {any} */ e) => `${e.card} ${e.side}`);

test('a left charm is gained when the slot to the left holds a card, face up or down (03 FF.2.1)', () => {
	for (const faceDown of [[], ['academia']]) {
		const { state, random, player } = game([['academia'], [], [], []], {
			faceDown,
		});
		const before = /** @type {any} */ (state.seats[player - 1]);
		const next = place(state, random, player, 'microbial-magic', 2);
		const seat = /** @type {any} */ (next.seats[player - 1]);
		assert.deepEqual(gained(next, player), ['microbial-magic left']);
		assert.equal(seat.resources.food, before.resources.food + 1);
		assert.equal(seat.vp, before.vp + 5);
		// An all-gain charm runs first without asking.
		assert.ok(!openDecisions(next).some((d) => d.kind === 'chooseOrder'));
		assert.equal(seat.playedCharmed, true);
		checkState(next);
	}
});

test('no left charm beside Maker of Fire: era 1, or era 2 beside an empty era-1 slot', () => {
	const { state, random, player } = game([[], [], [], []]);
	assert.deepEqual(
		gained(place(state, random, player, 'microbial-magic', 1), player),
		[]
	);
	assert.deepEqual(
		gained(place(state, random, player, 'microbial-magic', 2), player),
		[]
	);
});

test('R67: a right charm triggers the first time a card is placed to its right, face down too, covered or not', () => {
	const { state, random, player } = game([[], ['microbial-magic'], [], []], {
		fill: (seat, s) => {
			seat.territoryTiles = s.supply.territory.splice(0, 3);
		},
	});
	const vp = state.seats[player - 1].vp;
	const next = place(state, random, player, 'academia', 3, true);
	assert.deepEqual(gained(next, player), ['microbial-magic right']);
	assert.equal(next.seats[player - 1].vp, vp + 3);
	assert.deepEqual(/** @type {any} */ (next.seats[player - 1]).charmsUsed, [
		'microbial-magic',
	]);
	// A later card on the same slot triggers nothing.
	const again = place(next, random, player, 'militarism', 3, true);
	assert.deepEqual(gained(again, player), ['microbial-magic right']);
	checkState(again);
	// A covered card's right charm still triggers.
	const covered = game([[], ['microbial-magic', 'academia'], [], []]);
	assert.deepEqual(
		gained(
			place(
				covered.state,
				covered.random,
				covered.player,
				'militarism',
				3,
				true
			),
			covered.player
		),
		['microbial-magic right']
	);
});

test('R131: a charmed card played face down has no charms and is no charmed card played', () => {
	const { state, random, player } = game([['academia'], [], [], []]);
	const next = place(state, random, player, 'microbial-magic', 2, true);
	assert.deepEqual(gained(next, player), []);
	assert.equal(
		/** @type {any} */ (next.seats[player - 1]).playedCharmed,
		false
	);
	const later = place(next, random, player, 'theocracy', 3, true);
	assert.deepEqual(gained(later, player), []);
});

test('a base card is no charmed card played', () => {
	const { state, random, player } = game([['academia'], [], [], []]);
	const next = place(state, random, player, 'militarism', 2);
	assert.equal(
		/** @type {any} */ (next.seats[player - 1]).playedCharmed,
		false
	);
});

test('a charm and the ability are ordered by the player when the order can matter', () => {
	const { state, random, player } = game([['academia'], [], [], []]);
	const next = place(state, random, player, 'ghost-towns', 2);
	const order = openDecisions(next).find((d) => d.kind === 'chooseOrder');
	assert.ok(order, 'chooseOrder is asked');
	assert.deepEqual(order.effects, [
		{ charm: { card: 'ghost-towns', side: 'left' } },
		{ ability: { card: 'ghost-towns', era: 2 } },
	]);
	checkState(next);
});

test('a copied ability gains no charm (03 FF.2.1)', () => {
	const { state, random, player } = game([['academia'], [], [], []]);
	const next = structuredClone(state);
	copyAbility(
		contextFor(next, random, next.pending),
		player,
		null,
		'microbial-magic'
	);
	run(next, random);
	assert.deepEqual(gained(next, player), []);
});

test('R72: a card placed on slot 4 after income turn 5 triggers no right charm already used', () => {
	const { state, random, player } = game(
		[['academia'], ['militarism'], ['ghost-towns'], ['microbial-magic']],
		{
			fill: (seat) => {
				seat.incomeTurns = 5;
				seat.charmsUsed = ['ghost-towns'];
			},
		}
	);
	const next = place(state, random, player, 'monarchy', 4, true);
	assert.deepEqual(gained(next, player), []);
});

test('R118: a choice drops an option that moves only on tracks out of play, and runs the lone one left', () => {
	const { state, random, player } = readyTurn(2);
	const coins = state.seats[player - 1].resources.coin;
	const next = resolveEffects(
		state,
		player,
		[
			{
				choice: [
					[{ gain: { coin: 1 } }],
					[{ advance: { tracks: ['arts'], noBenefit: true } }],
				],
			},
		],
		random
	);
	assert.ok(!openDecisions(next).some((d) => d.kind === 'chooseOption'));
	assert.equal(next.seats[player - 1].resources.coin, coins + 1);
});
