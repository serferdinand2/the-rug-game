// The 33 base tech cards as data (#18): order, effect kinds, prerequisites (R18) and spot values from 02 §4.
import test from 'node:test';
import assert from 'node:assert/strict';
import { BASE_TECH } from '../src/lib/engine/decks.js';
import { EFFECT_KINDS } from '../src/lib/engine/data/effects.js';
import { INCOME_MAT } from '../src/lib/engine/data/income-mat.js';
import { TRACK_IDS } from '../src/lib/engine/data/ids.js';
import { TECH_CARDS, techCard } from '../src/lib/engine/data/tech-cards.js';

test('the 33 base tech cards are in BASE_TECH order', () => {
	assert.equal(TECH_CARDS.length, 33);
	assert.deepEqual(
		TECH_CARDS.map((card) => card.id),
		[...BASE_TECH]
	);
	assert.equal(techCard('clocks').name, 'Clocks');
	assert.throws(() => techCard('nope'), /nope/);
});

test('every benefit is a list of one-key effects of a known kind', () => {
	const visit = (/** @type {any[]} */ list) => {
		assert.ok(Array.isArray(list) && list.length > 0);
		for (const effect of list) {
			const keys = Object.keys(effect);
			assert.equal(keys.length, 1, JSON.stringify(effect));
			assert.ok(EFFECT_KINDS.includes(/** @type {any} */ (keys[0])));
			if (effect.choice) {
				effect.choice.forEach(visit);
			}
		}
	};
	for (const card of TECH_CARDS) {
		visit(/** @type {any} */ (card.circle));
		visit(/** @type {any} */ (card.square));
	}
});

test('27 cards need a track tier and 6 need an income-mat innovation (R18)', () => {
	const innovations = {
		treasury: 'currency',
		'stock-market': 'banking',
		bakery: 'farming',
		barn: 'breeding',
		library: 'writing',
		'com-tower': 'telephone',
	};
	const spaces = new Set(
		Object.values(INCOME_MAT).flatMap((row) => row.map((s) => s.id))
	);
	let tracks = 0;
	let inventions = 0;
	for (const card of TECH_CARDS) {
		const need = /** @type {any} */ (card.requires);
		if ('track' in need) {
			tracks++;
			assert.ok(TRACK_IDS.includes(need.track));
			assert.ok([2, 3, 4].includes(need.tier));
		} else {
			inventions++;
			assert.equal(need.innovation, innovations[card.id], card.id);
			assert.ok(spaces.has(need.innovation));
		}
	}
	assert.equal(tracks, 27);
	assert.equal(inventions, 6);
});

test('the cards match 02 §4', () => {
	const c = (/** @type {string} */ id) => techCard(id);
	assert.deepEqual(c('irrigation').circle, [{ gain: { food: 1 } }]);
	assert.deepEqual(c('irrigation').square, [{ building: 'farm' }]);
	assert.deepEqual(c('irrigation').requires, { track: 'science', tier: 2 });
	assert.deepEqual(c('clocks').circle, [
		{ advance: { tracks: ['technology'], noBenefit: true } },
	]);
	assert.deepEqual(c('clocks').square, [
		{ vp: { per: 'trackSpace', track: 'technology' } },
	]);
	assert.deepEqual(c('clocks').requires, { track: 'technology', tier: 2 });
	assert.deepEqual(c('the-nail').circle, [{ gain: { tapestry: 1 } }]);
	assert.deepEqual(c('the-nail').square, [
		{
			choice: [
				[{ building: 'market' }],
				[{ building: 'house' }],
				[{ building: 'farm' }],
			],
		},
	]);
	assert.deepEqual(c('time-travel').circle, [{ gain: { coin: 1 } }]);
	assert.deepEqual(c('time-travel').square, [
		{ regress: { tracks: ['exploration', 'military'], noBenefit: true } },
	]);
	assert.deepEqual(c('time-travel').requires, {
		track: 'technology',
		tier: 4,
	});
	assert.deepEqual(c('lithium-ion-battery').circle, [{ vp: 4 }]);
	assert.deepEqual(c('lithium-ion-battery').square, [
		{ repeat: { oncePerTurn: true } },
	]);
	assert.deepEqual(c('lithium-ion-battery').requires, {
		track: 'exploration',
		tier: 4,
	});
	assert.deepEqual(c('assembly-line').circle, [
		{ techBenefit: { icon: 'square' } },
	]);
	assert.deepEqual(c('assembly-line').square, [
		{ techBenefit: { icon: 'circle' } },
	]);
	assert.deepEqual(c('assembly-line').requires, {
		track: 'exploration',
		tier: 3,
	});
	assert.deepEqual(c('transistors').square, [
		{ gain: { culture: 1 } },
		{ vp: 4 },
	]);
	assert.deepEqual(c('telescope').circle, [
		{ gain: { culture: 1, territory: 1 } },
	]);
	assert.deepEqual(c('telescope').square, [{ vp: { per: 'territoryTile' } }]);
	assert.deepEqual(c('dynamite').circle, [{ conquer: {} }]);
	assert.deepEqual(c('warships').square, [{ conquer: {} }]);
	assert.deepEqual(c('compass').circle, [{ gain: { territory: 2 } }]);
	assert.deepEqual(c('compass').square, [{ explore: {} }]);
	assert.deepEqual(c('eyeglasses').circle, [{ invent: {} }]);
	assert.deepEqual(c('penicillin').circle, [
		{ research: { noBenefit: true } },
	]);
	assert.deepEqual(c('radio').square, [{ gainCiv: {} }]);
	assert.deepEqual(c('printing-press').square, [{ tapestryOnTop: {} }]);
	const landmarks = {
		bakery: 4,
		barn: 3,
		'com-tower': 5,
		library: 3,
		'stock-market': 5,
		treasury: 4,
	};
	for (const [id, vp] of Object.entries(landmarks)) {
		assert.deepEqual(c(id).circle, [{ vp }], id);
		assert.deepEqual(c(id).square, [{ landmark: id }], id);
		assert.equal(c(id).landmark, id);
	}
});

test('the data is frozen', () => {
	assert.ok(Object.isFrozen(TECH_CARDS));
	assert.ok(Object.isFrozen(TECH_CARDS[0]));
	assert.ok(Object.isFrozen(techCard('the-nail').square[0]));
	assert.ok(Object.isFrozen(techCard('irrigation').requires));
});
