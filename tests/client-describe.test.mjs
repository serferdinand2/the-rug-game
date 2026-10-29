// Words for the engine's effects, costs, bonuses and payments (#26, #126): short English the play screen shows.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import * as describe from '../src/lib/describe.js';
import {
	describeBonus,
	describeCost,
	describeEffects,
	priceWords,
} from '../src/lib/describe.js';
import { EFFECT_KINDS, VP_COUNTERS } from '../src/lib/engine/data/effects.js';
import { TRACKS } from '../src/lib/engine/data/tracks.js';
import { TRACK_IDS } from '../src/lib/engine/data/ids.js';
import { TAPESTRY_CARDS } from '../src/lib/engine/data/tapestry-cards.js';
import { TECH_CARDS } from '../src/lib/engine/data/tech-cards.js';
import { SPACE_TILES } from '../src/lib/engine/data/space-tiles.js';
import { TERRITORY_TILES } from '../src/lib/engine/data/territory-tiles.js';
import { RED_DIE, BLACK_DIE } from '../src/lib/engine/data/dice.js';
import { assertReadable } from './helpers/readable.mjs';

test('a cost names each resource, and "any" as resources of your choice', () => {
	assert.equal(
		describeCost({ food: 1, any: 1 }),
		'1 food and 1 resource of your choice'
	);
	assert.equal(describeCost({ any: 2 }), '2 resources of your choice');
	assert.equal(describeCost({ coin: 2, worker: 1 }), '2 coins and 1 worker');
	assert.equal(
		describeCost({ coin: 1, worker: 2, culture: 1 }),
		'1 coin, 2 workers and 1 culture'
	);
	assert.equal(describeCost({ territory: 2 }), '2 territory tiles');
	assert.equal(describeCost({ tapestry: 1 }), '1 tapestry card');
	assert.equal(describeCost({ tech: 3 }), '3 tech cards');
	assert.equal(describeCost({ vp: 5 }), '5 VP');
	assert.equal(describeCost({}), 'Nothing');
});

test('a price reads as its amounts, in the order its symbols first appear (#124)', () => {
	assert.equal(priceWords(['any']), '1 resource of your choice');
	assert.equal(
		priceWords(['food', 'any']),
		'1 food and 1 resource of your choice'
	);
	assert.equal(
		priceWords(['worker', 'any', 'any']),
		'1 worker and 2 resources of your choice'
	);
	assert.equal(priceWords(['coin', 'coin']), '2 coins');
	assert.equal(priceWords(['culture', 'culture']), '2 culture');
	assert.equal(
		priceWords(['any', 'coin', 'worker', 'coin']),
		'1 resource of your choice, 2 coins and 1 worker'
	);
	assert.equal(priceWords([]), 'nothing');
});

test('a benefit reads as a short sentence', () => {
	assert.equal(
		describeEffects([{ gain: { coin: 1, culture: 1 } }]),
		'Gain 1 coin and 1 culture'
	);
	assert.equal(describeEffects([{ explore: {} }]), 'Explore a territory');
	assert.equal(
		describeEffects([{ vp: { per: 'territory' } }]),
		'Gain 1 VP for each territory you control'
	);
	assert.equal(
		describeEffects([{ vp: { per: 'techCard', each: 2 } }]),
		'Gain 2 VP for each tech card you have'
	);
	assert.equal(describeEffects([{ building: 'farm' }]), 'Gain a Farm');
	assert.equal(describeEffects([{ building: 'armory' }]), 'Gain an Armory');
	assert.equal(
		describeEffects([{ gain: { territory: 1 } }, { explore: {} }], {
			ordered: true,
		}),
		'Gain 1 territory tile, then explore a territory'
	);
	assert.equal(
		describeEffects([
			{ choice: [[{ explore: {} }], [{ building: 'farm' }]] },
		]),
		'Choose one: explore a territory or gain a Farm'
	);
	assert.equal(
		describeEffects([{ vp: { per: 'trackSpace', track: 'technology' } }]),
		'Gain 1 VP for each space you have advanced on Technology'
	);
	assert.equal(
		describeEffects([{ landmark: 'bakery' }]),
		'Gain the Bakery landmark'
	);
	assert.equal(describeEffects([]), 'Nothing');
});

test('plain gains side by side read as one, and a repeated effect as "twice"', () => {
	assert.equal(
		describeEffects([{ gain: { coin: 1, worker: 1 } }, { vp: 8 }]),
		'Gain 1 coin, 1 worker and 8 VP'
	);
	assert.equal(
		describeEffects([{ gain: { territory: 1 } }, { building: 'farm' }]),
		'Gain 1 territory tile and a Farm'
	);
	assert.equal(
		describeEffects(TRACKS.technology[5].benefit),
		'Gain a Farm, a House or an Armory'
	);
	assert.equal(
		describeEffects(TRACKS.science[11].benefit, { ordered: true }),
		'Advance on Exploration, Technology or Military twice'
	);
	assert.equal(
		describeEffects([{ building: 'armory' }, { building: 'armory' }]),
		'Gain 2 Armories'
	);
	assert.equal(
		describeEffects(TRACKS.science[1].benefit),
		'Roll the science die to advance on the track rolled without its benefit or bonus'
	);
});

test('a trade hosted by another seat names its host from the state', () => {
	const state = { seats: [{ name: 'Ana' }, { name: 'Bo' }] };
	assert.equal(
		describeEffects(
			[
				{
					trade: {
						offers: [{ pay: { any: 1 }, gain: [{ vp: 5 }] }],
						host: 2,
					},
				},
			],
			{ state }
		),
		'Make one trade with Bo: pay 1 resource of your choice to gain 5 VP'
	);
});

test('every benefit and bonus of every track space describes to a sentence', () => {
	for (const track of TRACK_IDS) {
		for (const space of TRACKS[track].slice(1)) {
			const what = `${track} ${space.space} (${space.name})`;
			assertReadable(
				describeEffects(space.benefit, { ordered: space.ordered }),
				`the benefit of ${what}`
			);
			if (space.bonus) {
				assertReadable(
					describeCost(space.bonus.pay),
					`the bonus cost of ${what}`
				);
				assertReadable(
					describeEffects(space.bonus.gain),
					`the bonus gain of ${what}`
				);
				assertReadable(
					describeBonus(space.bonus),
					`the bonus of ${what}`
				);
			}
		}
	}
	assert.equal(
		describeBonus(TRACKS.exploration[5].bonus),
		'Pay 1 resource of your choice to gain a Farm'
	);
	assert.equal(
		describeBonus(TRACKS.exploration[8].bonus),
		'Discard 2 territory tiles to gain 5 VP'
	);
});

test('every card, tile and die face describes to a sentence', () => {
	for (const card of TAPESTRY_CARDS) {
		assertReadable(
			describeEffects(card.played, { ordered: card.ordered }),
			`tapestry card ${card.id}`
		);
	}
	for (const card of TECH_CARDS) {
		assertReadable(describeEffects(card.circle), `${card.id}'s circle`);
		assertReadable(describeEffects(card.square), `${card.id}'s square`);
	}
	for (const tile of SPACE_TILES) {
		assertReadable(
			describeEffects(tile.benefit, { ordered: tile.ordered }),
			`space tile ${tile.id}`
		);
	}
	for (const tile of TERRITORY_TILES) {
		assertReadable(
			describeEffects(tile.benefit),
			`territory tile ${tile.id}`
		);
	}
	for (const face of [...RED_DIE, ...BLACK_DIE]) {
		assertReadable(describeEffects([face]), 'a conquer die face');
	}
});

test('every effect kind and VP counter has its own words', () => {
	const fallback = describeEffects([{ notAnEffect: {} }]);
	assertReadable(fallback, 'an unknown effect');
	/** @type {Record<string, any>} */
	const examples = {
		gain: { any: 1 },
		lose: { culture: 1, any: 1 },
		building: 'house',
		landmark: 'lighthouse',
		vp: 3,
		explore: { anywhere: true },
		exploreSpace: { fromGained: true },
		conquer: { bothDice: 'always' },
		research: { noBenefit: true, rolls: 4, offTrackVp: 5 },
		advance: { tracks: ['science'], optional: true, freeBonus: true },
		regress: { tracks: ['technology', 'military'] },
		repeat: { oncePerTurn: true },
		invent: { count: 2, refresh: true },
		upgrade: {},
		techBenefit: { icon: 'square' },
		tapestryOnTop: {},
		scoreCapital: {},
		tileBenefit: {},
		gainCiv: {},
		restartToken: {},
		choice: [[{ gain: { coin: 1 } }], []],
		eraPartner: { track: true },
		copyTapestry: {},
		sharedAdvance: { track: 'roll', others: 'opponents' },
		others: {
			who: 'neighbours',
			effects: [{ invent: { deckOnly: true } }],
		},
		trade: { offers: [{ pay: { vp: 5 }, gain: [{ gain: { any: 1 } }] }] },
		discardTapestry: { vpEach: 2 },
		anyBuilding: {},
		trackLandmark: {},
		landmarkRank: {
			fewest: [{ gain: { any: 2 } }],
			most: [{ vp: 12 }],
			otherwise: [{ gain: { any: 1 } }, { vp: 6 }],
		},
		placeOutpost: { hex: '0_1' },
		placeToken: { hex: '2_-1', civ: 'traders' },
	};
	for (const kind of EFFECT_KINDS) {
		const words = describeEffects([{ [kind]: examples[kind] ?? {} }]);
		assertReadable(words, `the ${kind} effect`);
		assert.notEqual(words, fallback, `the ${kind} effect has no words`);
	}
	for (const per of VP_COUNTERS) {
		const words = describeEffects([{ vp: { per, track: 'science' } }]);
		assertReadable(words, `VP per ${per}`);
		assert.match(words, /^Gain 1 VP for each /, `VP per ${per}`);
	}
	assert.equal(
		describeEffects([{ placeOutpost: { hex: '2_-1' } }]),
		'Place an outpost on hex 2,−1'
	);
	assert.equal(describeEffects([{ darkAges: {} }]), 'Resolve Dark Ages');
});

test('unknown effects and costs fall back to a readable sentence', () => {
	assertReadable(
		describeEffects([{ gain: { coin: 1, glitter: 2 } }]),
		'an odd gain'
	);
	assertReadable(
		describeEffects([{ vp: { per: 'stars' } }]),
		'an odd counter'
	);
	assertReadable(
		describeEffects(/** @type {any} */ ([{}])),
		'an empty effect'
	);
	assertReadable(describeCost(/** @type {any} */ ({ beads: 2 })), 'odd cost');
});

test('describe.js holds the effect, cost, bonus and payment words, and what the decision words build on (#126)', () => {
	assert.deepEqual(Object.keys(describe).sort(), [
		'amounts',
		'describeBonus',
		'describeCost',
		'describeEffects',
		'describePayment',
		'describeTurn',
		'effectPhrase',
		'effectsPhrase',
		'paymentVerbs',
		'priceWords',
	]);
});
