// The 43 base tapestry cards as data (#19): order, timing, effect kinds and spot values from the design.
import test from 'node:test';
import assert from 'node:assert/strict';
import { BASE_TAPESTRY } from '../src/lib/engine/decks.js';
import { EFFECT_KINDS } from '../src/lib/engine/data/effects.js';
import {
	TAPESTRY_CARDS,
	tapestryCard,
} from '../src/lib/engine/data/tapestry-cards.js';

test('the 43 base tapestry cards are in catalog order, then the trap', () => {
	assert.equal(TAPESTRY_CARDS.length, 44);
	assert.deepEqual(
		TAPESTRY_CARDS.map((card) => card.id),
		[...BASE_TAPESTRY.filter((id) => !id.startsWith('trap-')), 'trap']
	);
});

test('tapestryCard maps every trap copy to the trap (R22)', () => {
	assert.deepEqual(tapestryCard('trap-3').played, [{ vp: 10 }]);
	assert.equal(tapestryCard('trap-7').id, 'trap');
	assert.equal(tapestryCard('age-of-sail').name, 'Age of Sail');
	assert.throws(() => tapestryCard('nope'), /nope/);
});

test('20 cards are THIS ERA and 24 are played', () => {
	const cards = TAPESTRY_CARDS.filter((card) => card.id !== 'trap');
	assert.equal(cards.filter((card) => card.timing === 'era').length, 20);
	assert.equal(cards.filter((card) => card.timing === 'played').length, 23);
	assert.equal(
		TAPESTRY_CARDS.filter((card) => card.timing === 'played').length,
		24
	);
});

test('every played effect has one known kind', () => {
	/** @param {any[]} list */
	const visit = (list) => {
		for (const effect of list) {
			const keys = Object.keys(effect);
			assert.equal(keys.length, 1, JSON.stringify(effect));
			assert.ok(
				EFFECT_KINDS.includes(/** @type {any} */ (keys[0])),
				keys[0]
			);
			if (effect.choice) {
				effect.choice.forEach(visit);
			}
			if (effect.others) {
				visit(effect.others.effects);
			}
			if (effect.landmarkRank) {
				const { fewest, most, otherwise } = effect.landmarkRank;
				[fewest, most, otherwise].forEach(visit);
			}
			if (effect.trade) {
				for (const offer of effect.trade.offers) {
					visit(offer.gain);
				}
			}
		}
	};
	for (const card of TAPESTRY_CARDS) {
		visit(card.played);
		assert.equal(typeof card.ordered, 'boolean');
		if (card.timing === 'era') {
			assert.ok(card.played.length <= 1, card.id);
		}
	}
});

test('the card data is frozen', () => {
	assert.ok(Object.isFrozen(TAPESTRY_CARDS));
	assert.ok(Object.isFrozen(TAPESTRY_CARDS[0]));
	assert.ok(Object.isFrozen(tapestryCard('guilds').played[0]));
});

test('Renaissance has 4 unordered advances', () => {
	const card = tapestryCard('renaissance');
	assert.equal(card.ordered, false);
	assert.equal(card.played.length, 4);
	assert.deepEqual(card.played[0], {
		advance: { tracks: ['exploration'], noBenefit: true, freeBonus: true },
	});
	assert.equal(TAPESTRY_CARDS.filter((c) => !c.ordered).length, 1);
});

test('Guilds has 6 offers, VP for resources and resources for VP', () => {
	const { offers } = /** @type {any} */ (tapestryCard('guilds').played[0])
		.trade;
	assert.equal(offers.length, 6);
	assert.deepEqual(offers[0], {
		pay: { vp: 5 },
		gain: [{ gain: { any: 1 } }],
	});
	assert.deepEqual(offers[5], { pay: { any: 3 }, gain: [{ vp: 15 }] });
});

test('Diplomacy has two effects', () => {
	assert.deepEqual(tapestryCard('diplomacy').played, [
		{ anyBuilding: {} },
		{ others: { who: 'all', effects: [{ gain: { any: 1 } }] } },
	]);
});
