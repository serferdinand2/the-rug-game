// Masterpieces (#35 part 2): the supply, create, refresh, firing, broadcast, Streaming Implants and the 20 cards.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import {
	MASTERPIECES,
	masterpiece,
} from '../src/lib/engine/data/masterpieces.js';
import { EFFECT_KINDS } from '../src/lib/engine/data/effects.js';
import { ASSETS } from '../src/lib/art/catalog.js';
import { view } from '../src/lib/engine/view.js';
import { revealed } from '../src/lib/engine/table.js';
import { openDecisions } from '../src/lib/engine/stack.js';
import { newGame, startedGame } from './helpers/engine.mjs';
import { countVp } from '../src/lib/engine/effects/vp.js';
import { capitalScore } from '../src/lib/engine/city.js';
import { checkState } from './helpers/invariants.mjs';
import { AA } from './helpers/arts.mjs';

/** The masterpiece ids, as the art catalog lists them. */
const ART_IDS = ASSETS.filter((a) => a.group === 'masterpiece').map((a) =>
	a.id.replace('masterpiece/', '')
);

/**
 * Calls back for every effect in a list, inside choices and trades too.
 * @param {any[]} effects
 * @param {(effect: any) => void} visit
 */
function eachEffect(effects, visit) {
	for (const effect of effects) {
		visit(effect);
		if ('choice' in effect) {
			effect.choice.forEach((/** @type {any[]} */ option) =>
				eachEffect(option, visit)
			);
		}
		if ('trade' in effect) {
			effect.trade.offers.forEach((/** @type {any} */ offer) =>
				eachEffect(offer.gain, visit)
			);
		}
	}
}

test("the 20 masterpieces are the art's 20, two of them single-use", () => {
	assert.equal(MASTERPIECES.length, 20);
	assert.deepEqual(
		MASTERPIECES.map((m) => m.id),
		ART_IDS
	);
	assert.deepEqual(
		MASTERPIECES.filter((m) => m.singleUse).map((m) => m.id),
		['art-deco', 'mime']
	);
	for (const card of MASTERPIECES) {
		eachEffect(card.effects, (effect) => {
			const keys = Object.keys(effect);
			assert.equal(keys.length, 1, card.id);
			assert.ok(EFFECT_KINDS.includes(keys[0]), `${card.id}: ${keys[0]}`);
		});
	}
	assert.equal(masterpiece('painting').name, 'Painting');
	assert.throws(() => masterpiece('sculpture'), /no masterpiece/);
});

test('setup shuffles the masterpieces and turns 3 face up, with the arts track only', () => {
	const { state } = newGame(3, AA);
	const { deck, faceUp, discard } = state.supply.masterpieces;
	assert.equal(deck.length, 17);
	assert.equal(faceUp.length, 3);
	assert.deepEqual(discard, []);
	assert.deepEqual([...deck, ...faceUp].sort(), [...ART_IDS].sort());
	for (const seat of state.seats) {
		assert.deepEqual(seat.masterpieces, []);
		assert.deepEqual(seat.inspired, []);
	}
	checkState(state);
	for (const options of [
		{},
		{ expansions: ['pp'] },
		{ expansions: ['aa'], variants: ['no-arts-track'] },
	]) {
		const { state: off } = newGame(3, options);
		assert.ok(!('masterpieces' in off.supply), JSON.stringify(options));
		for (const seat of off.seats) {
			assert.ok(!('masterpieces' in seat));
			assert.ok(!('inspired' in seat));
		}
		checkState(off);
	}
});

test('a base game draws the same as before', () => {
	// Recorded before part 2 (seed 1, 3 players): the masterpieces' shuffle must not move a base game's draws.
	const { state } = newGame(3);
	assert.deepEqual(state.supply.tech.faceUp, [
		'the-nail',
		'eyeglasses',
		'com-tower',
	]);
	assert.deepEqual(state.supply.tapestry.deck.slice(0, 3), [
		'militarism',
		'age-of-wonders',
		'trap-5',
	]);
	assert.deepEqual(state.supply.territory.slice(0, 3), [26, 15, 24]);
	assert.equal(state.first, 3);
	assert.deepEqual(
		openDecisions(state)
			.filter((d) => d.kind === 'chooseCiv')
			.map((d) => d.options),
		[
			['merrymakers', 'historians'],
			['nomads', 'traders'],
			['the-chosen', 'inventors'],
		]
	);
});

test('view() shows the masterpiece deck as a count, and the face-up row as it is', () => {
	const { state } = newGame(3, AA);
	const shown = /** @type {any} */ (view(state, 1)).supply.masterpieces;
	assert.equal(shown.deck, 17);
	assert.deepEqual(shown.faceUp, state.supply.masterpieces.faceUp);
	assert.deepEqual(shown.discard, []);
	assert.ok(
		!(
			'masterpieces' in
			/** @type {any} */ (view(newGame(3).state, 1)).supply
		)
	);
});

test('revealed() sees a masterpiece drawn from the deck', () => {
	const { state: before } = newGame(3, AA);
	const after = structuredClone(before);
	const { masterpieces } = after.supply;
	masterpieces.faceUp.push(/** @type {string} */ (masterpieces.deck.shift()));
	assert.equal(revealed(before, after), true);
	const { state: base } = newGame(3);
	assert.equal(revealed(base, structuredClone(base)), false);
});

test("Ballet's and Modern Dance's counters count the capital's complete rows and columns", () => {
	const { state: started } = startedGame(2);
	const state = structuredClone(started);
	const seat = /** @type {any} */ (state.seats[0]);
	assert.equal(countVp(state, 1, 'capitalRow'), 0);
	// As in the capital-scoring test: row 0 and column 0 of mat 5 complete.
	seat.capital.mat = 5;
	for (let col = 0; col <= 6; col++) {
		seat.capital.buildings.push({ building: 'house', row: 0, col });
	}
	for (const row of [3, 4, 6, 7, 8]) {
		seat.capital.buildings.push({ building: 'house', row, col: 0 });
	}
	seat.capital.landmarks.push({
		landmark: 'lighthouse',
		row: -1,
		col: 7,
		rotation: 0,
	});
	const { rows, columns } = capitalScore(seat);
	assert.equal(rows, 1);
	assert.equal(columns, 1);
	assert.equal(countVp(state, 1, 'capitalRow'), rows);
	assert.equal(countVp(state, 1, 'capitalColumn'), columns);
});
