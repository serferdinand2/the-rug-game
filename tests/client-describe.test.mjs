// Words for the engine's effects, costs, decisions and answers (#26): short English the play screen shows.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import {
	civilizationName,
	decisionTitle,
	describeAnswer,
	describeBonus,
	describeCost,
	describeEffects,
	describePayment,
	describeTapestryCard,
} from '../src/lib/describe.js';
import { createGame, play, VARIANTS, view } from '../src/lib/engine/game.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import { openDecisions } from '../src/lib/engine/stack.js';
import { seededRandom } from '../src/lib/engine/random.js';
import { EFFECT_KINDS, VP_COUNTERS } from '../src/lib/engine/data/effects.js';
import { TRACKS } from '../src/lib/engine/data/tracks.js';
import { TRACK_IDS } from '../src/lib/engine/data/ids.js';
import { TAPESTRY_CARDS } from '../src/lib/engine/data/tapestry-cards.js';
import { TECH_CARDS } from '../src/lib/engine/data/tech-cards.js';
import { SPACE_TILES } from '../src/lib/engine/data/space-tiles.js';
import { TERRITORY_TILES } from '../src/lib/engine/data/territory-tiles.js';
import { RED_DIE, BLACK_DIE } from '../src/lib/engine/data/dice.js';
import { allOps } from './helpers/views.mjs';

/**
 * Checks that a description is a sentence a player can read: never empty, and no JSON or missing value shows through.
 * @param {unknown} text
 * @param {string} what - Named in the failure
 */
function assertReadable(text, what) {
	assert.equal(typeof text, 'string', `${what} is not a string`);
	const words = /** @type {string} */ (text);
	assert.ok(words.trim().length > 0, `${what} is empty`);
	for (const bad of ['undefined', 'null', 'NaN', '[object', '{', '}', '"']) {
		assert.ok(!words.includes(bad), `${what} reads "${words}"`);
	}
	assert.equal(words, words.trim(), `${what} has stray spaces: "${words}"`);
	assert.ok(!words.includes('  '), `${what} has a double space: "${words}"`);
	assert.match(
		words,
		/^[A-Z0-9]/,
		`${what} starts in lower case: "${words}"`
	);
}

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

test('every tapestry card face has words, also for the rules the engine keeps in code', () => {
	for (const card of TAPESTRY_CARDS) {
		const { ability, note } = describeTapestryCard(card.id);
		assertReadable(ability, `tapestry card ${card.id}'s ability`);
		assert.notEqual(ability, 'Nothing', `${card.id} has no words`);
		assert.doesNotMatch(
			ability,
			/\bresolve\b/i,
			`${card.id}: "${ability}"`
		);
		if (note !== undefined) {
			assertReadable(note, `tapestry card ${card.id}'s note`);
		}
	}
	// A card whose rules are all effects reads as them.
	const democracy = /** @type {any} */ (
		TAPESTRY_CARDS.find((c) => c.id === 'democracy')
	);
	assert.equal(
		describeTapestryCard('democracy').ability,
		describeEffects(democracy.played, { ordered: democracy.ordered })
	);
	assert.equal(describeTapestryCard('democracy').note, undefined);
	assert.equal(
		describeTapestryCard('academia').ability,
		'Whenever you invent a tech card or gain a tapestry card, gain 3 VP'
	);
	// R22: the trap is a response card, and gains 10 VP played as a card.
	assert.deepEqual(
		describeTapestryCard('trap-5'),
		describeTapestryCard('trap')
	);
	assert.equal(
		describeTapestryCard('trap').note,
		'Played as a tapestry card on an income turn: gain 10 VP'
	);
	assert.equal(
		describeTapestryCard('no-such-card').ability,
		describeEffects([{ notAnEffect: {} }])
	);
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

test('payments read as what is paid and discarded', () => {
	assert.equal(
		describePayment({ food: 1, worker: 1 }),
		'Pay 1 food and 1 worker'
	);
	assert.equal(describePayment({}), 'Pay nothing');
	assert.equal(
		describePayment({ coin: 1, tapestry: ['democracy', 'trap-3'] }),
		'Pay 1 coin and discard Democracy and Trap'
	);
	assert.equal(
		describePayment({ territory: [17, 3] }),
		'Discard territory tiles 17 and 3'
	);
	assert.equal(
		describePayment({ tech: ['clocks', 'radio', 'paper'] }),
		'Discard Clocks, Radio and Paper'
	);
	const bonus = {
		id: 7,
		batch: 1,
		player: 1,
		kind: 'chooseBonus',
		track: 'exploration',
		space: 5,
		cost: { any: 1 },
		gain: [{ building: 'farm' }],
	};
	assert.equal(
		describeAnswer(bonus, { pay: { food: 1, worker: 1 } }),
		'Pay 1 food and 1 worker'
	);
	assert.equal(describeAnswer(bonus, { pay: null }), 'No bonus');
	assert.equal(decisionTitle(bonus), 'Take the bonus: gain a Farm?');
	const advance = { id: 8, batch: 1, player: 1, kind: 'chooseAdvance' };
	assert.equal(
		describeAnswer(advance, {
			track: 'exploration',
			from: 4,
			pay: { food: 1, culture: 1 },
		}),
		'Advance to Ships and pay 1 food and 1 culture'
	);
});

test('places in the capital and on the map read as rows, columns and hexes', () => {
	const landmark = {
		id: 1,
		batch: 1,
		player: 1,
		kind: 'choosePlacement',
		landmark: 'lighthouse',
	};
	assert.equal(
		describeAnswer(landmark, { row: 2, col: 4, rotation: 1 }),
		'Row 3, column 5, turned once'
	);
	assert.equal(
		describeAnswer(landmark, { row: 2, col: 4, rotation: 2 }),
		'Row 3, column 5, turned twice'
	);
	assert.equal(
		describeAnswer(landmark, { row: 0, col: 0, rotation: 0 }),
		'Row 1, column 1'
	);
	assert.equal(decisionTitle(landmark), 'Where does the Lighthouse go?');
	const farm = { ...landmark, landmark: undefined, building: 'farm' };
	delete farm.landmark;
	assert.equal(describeAnswer(farm, { row: 8, col: 8 }), 'Row 9, column 9');
	assert.equal(
		describeAnswer(farm, { besideMat: true }),
		'Beside your capital mat'
	);
	assert.equal(decisionTitle(farm), 'Where does the Farm go?');
	const explore = { id: 2, batch: 1, player: 1, kind: 'chooseExplore' };
	assert.equal(
		describeAnswer(explore, { tile: 17, hex: '2_-1', orient: 2 }),
		'Hex 2,−1 with tile 17, turned twice'
	);
	assert.equal(
		describeAnswer(explore, { tile: 17, hex: '0_3', orient: 0 }),
		'Hex 0,3 with tile 17'
	);
});

test('answers name seats, cards and resources', () => {
	const game = { seats: [{ name: 'Ana' }, { name: 'Bo' }] };
	const gift = { id: 1, batch: 1, player: 1, kind: 'chooseGift' };
	assert.equal(
		describeAnswer(
			gift,
			{ tile: 12, player: 2 },
			/** @type {any} */ (game)
		),
		'Give tile 12 to Bo'
	);
	assert.equal(
		describeAnswer(
			{ id: 2, batch: 1, player: 1, kind: 'chooseResource', count: 2 },
			{ resources: { coin: 1, food: 1 } }
		),
		'Gain 1 coin and 1 food'
	);
	assert.equal(
		describeAnswer(
			{ id: 3, batch: 1, player: 1, kind: 'chooseCiv', options: [] },
			{ civ: 'the-chosen' }
		),
		'The Chosen'
	);
	assert.equal(
		describeAnswer(
			{ id: 4, batch: 1, player: 1, kind: 'chooseTurn' },
			{ turn: 'income' }
		),
		'Take income'
	);
	assert.equal(
		describeAnswer(
			{ id: 5, batch: 1, player: 1, kind: 'chooseInvent' },
			{ card: 'deck' }
		),
		'The top card of the deck'
	);
	assert.equal(
		describeAnswer(
			{ id: 6, batch: 1, player: 1, kind: 'chooseTapestry' },
			{ card: 'age-of-sail' }
		),
		'Age of Sail'
	);
});

test('unknown decisions and answers fall back to a readable sentence', () => {
	const odd = { id: 1, batch: 1, player: 1, kind: 'chooseSomethingNew' };
	assertReadable(decisionTitle(odd), 'an unknown title');
	assert.equal(describeAnswer(odd, { x: { y: 1 } }), 'Choose this option');
	const slot = {
		id: 2,
		batch: 1,
		player: 1,
		kind: 'chooseSlot',
		purpose: 'somethingNew',
		options: [],
	};
	assertReadable(describeAnswer(slot, { slot: { z: [1] } }), 'an odd slot');
	assertReadable(
		describeAnswer(
			{ id: 3, batch: 1, player: 1, kind: 'chooseResource' },
			{ resources: 'lots' }
		),
		'an odd resource answer'
	);
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

test('every decision kind has a title of its own', () => {
	const fallback = decisionTitle({
		id: 1,
		batch: 1,
		player: 1,
		kind: 'chooseSomethingNew',
	});
	for (const kind of Object.keys(DECISIONS)) {
		const title = decisionTitle({ id: 1, batch: 1, player: 1, kind });
		assertReadable(title, `the ${kind} title`);
		assert.notEqual(title, fallback, `${kind} has no title`);
	}
});

const NAMES = ['Ana', 'Bo', 'Cy', 'Dee', 'Eli'];

test('over 20 random games, every open decision and answer describes to a sentence', () => {
	const generic = {
		title: decisionTitle({ kind: 'chooseSomethingNew' }),
		answer: describeAnswer({ kind: 'chooseSomethingNew' }, {}),
		effect: describeEffects([{ notAnEffect: {} }]).toLowerCase(),
	};
	/**
	 * Checks words the games produce: readable, and never the fallback for a shape this module doesn't know.
	 * @param {string} words
	 * @param {string} what
	 */
	const known = (words, what) => {
		assertReadable(words, what);
		assert.ok(
			!words.toLowerCase().includes(generic.effect),
			`${what}: ${words}`
		);
		assert.notEqual(words, generic.title, what);
		assert.notEqual(words, generic.answer, what);
	};
	const kinds = new Set();
	for (let i = 0; i < 20; i++) {
		const seed = 101 + i;
		const random = seededRandom(seed);
		const pick = seededRandom(seed * 7919);
		let state = createGame({
			players: NAMES.slice(0, 1 + (i % 5)).map((name) => ({ name })),
			version: i % 2 === 0 ? 'original' : 'current',
			variants: i % 4 >= 2 ? VARIANTS.map((v) => v.id) : [],
			random,
		});
		for (let actions = 0; ; actions++) {
			const open = openDecisions(state);
			if (open.length === 0) {
				break;
			}
			assert.ok(actions < 5000, `game ${seed} never ended`);
			/** @type {Map<number, any>} */
			const seen = new Map();
			for (const decision of open) {
				const seat = /** @type {number} */ (decision.player);
				const mine = view(state, seat);
				const op = allOps(mine).find((o) => o.id === decision.id);
				assert.ok(op?.answers, `game ${seed}: ${decision.kind}`);
				seen.set(decision.id, op);
				kinds.add(op.kind);
				const what = `game ${seed}, action ${actions}, ${op.kind}`;
				known(decisionTitle(op, mine), `${what}: the title`);
				// What another player sees of it: no answers and no hidden fields.
				const stranger = { ...op };
				delete stranger.answers;
				for (const field of DECISIONS[op.kind].hidden) {
					delete stranger[field];
				}
				known(
					decisionTitle(stranger, mine),
					`${what}: a stranger's title`
				);
				for (const answer of op.answers) {
					known(
						describeAnswer(op, answer, mine),
						`${what}: the answer ${JSON.stringify(answer)}`
					);
				}
			}
			const decision = open[pick(open.length)];
			const seat = /** @type {number} */ (decision.player);
			const answers = seen.get(decision.id).answers;
			const advances = answers.filter((a) => a.turn === 'advance');
			const answer =
				advances.length > 0 && pick(100) < 85
					? advances[0]
					: answers[pick(answers.length)];
			state = play(
				state,
				seat,
				{ decision: decision.id, ...answer },
				random
			);
		}
		assert.equal(state.phase, 'over', `game ${seed} ended`);
	}
	assert.ok(kinds.size >= 15, `only ${kinds.size} decision kinds opened`);
});

test('a civilization reads by its name, for the header chips', () => {
	assert.equal(civilizationName('the-chosen'), 'The Chosen');
	assert.equal(civilizationName('alchemists'), 'Alchemists');
});
