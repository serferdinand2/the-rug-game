// A&A's landmark cards (#35 part 3): the data, the deal and draft, and each goal (03 §2.10, §7).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { createGame } from '../src/lib/engine/setup.js';
import { seededRandom } from '../src/lib/engine/random.js';
import { openDecisions } from '../src/lib/engine/stack.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import { play } from '../src/lib/engine/play.js';
import { landmarkCardDeal } from '../src/lib/engine/landmark-cards.js';
import { landmarkCardsFor } from '../src/lib/engine/data/landmark-cards.js';
import {
	EXPANSION_LANDMARKS,
	landmarksFor,
} from '../src/lib/engine/data/landmarks.js';
import { FOOTPRINTS } from '../src/lib/art/footprints.js';
import { newGame } from './helpers/engine.mjs';
import { checkState } from './helpers/invariants.mjs';

/** A&A's landmark cards, in the order of 03 §2.10. */
const AA_CARDS = [
	'villa',
	'birdwatching-perch',
	'castle',
	'windmill',
	'bridge',
];

// The data

test('A&A has 5 landmark cards, each naming its own landmark and goal (03 §2.10)', () => {
	const cards = landmarkCardsFor(['aa']);
	assert.deepEqual(
		cards.map((card) => [card.id, card.landmark, card.goal]),
		[
			['villa', 'villa', { kind: 'buildingTypes', need: 3 }],
			[
				'birdwatching-perch',
				'birdwatching-perch',
				{ kind: 'inventedTech', need: 3 },
			],
			['castle', 'castle', { kind: 'takenTier', need: 1 }],
			['windmill', 'windmill', { kind: 'tierTwoTracks', need: 2 }],
			['bridge', 'bridge', { kind: 'startNeighbours', need: 3 }],
		]
	);
	assert.ok(cards.every((card) => card.expansion === 'aa'));
	assert.equal(landmarkCardsFor(['pp', 'aa']).length, 10);
});

test('A&A adds its 5 card landmarks with the shared footprints, also without the arts track (R63, R65)', () => {
	for (const id of AA_CARDS) {
		const landmark = EXPANSION_LANDMARKS.find((l) => l.id === id);
		assert.deepEqual(landmark?.source, { card: id }, id);
		assert.equal(landmark?.expansion, 'aa', id);
		assert.equal(landmark?.arts, undefined, id);
		assert.equal(landmark?.footprint, FOOTPRINTS[id], id);
	}
	const off = landmarksFor(['aa'], ['no-arts-track']).map((l) => l.id);
	assert.ok(AA_CARDS.every((id) => off.includes(id)));
	const castle = EXPANSION_LANDMARKS.find((l) => l.id === 'castle');
	assert.equal(castle?.footprint.join('').replaceAll('.', '').length, 12);
});

// The deal and the draft

/**
 * A new game played through every setup pick but the landmark draft.
 * @param {number} count
 * @param {string[]} expansions
 * @param {string[]} [variants]
 */
function draftGame(count, expansions, variants = []) {
	let { state, random } = newGame(count, { expansions, variants });
	for (let step = 0; step < 100; step++) {
		const open = openDecisions(state).filter(
			(d) => d.kind !== 'chooseLandmarkCard'
		);
		if (open.length === 0) {
			break;
		}
		const [decision] = open;
		const answer = DECISIONS[decision.kind].answers(state, decision)[0];
		state = play(
			state,
			decision.player,
			{ decision: decision.id, ...answer },
			random
		);
	}
	return { state, random };
}

/**
 * Plays the whole draft, each drafter keeping the first card offered, and returns the state and the offers' sizes.
 * @param {any} state
 * @param {any} random
 * @returns {{ state: any, offers: { player: number, options: number, drafters: number[] }[] }}
 */
function draftAll(state, random) {
	const offers = [];
	for (let step = 0; step < 10; step++) {
		const open = openDecisions(state).find(
			(d) => d.kind === 'chooseLandmarkCard'
		);
		if (!open) {
			break;
		}
		offers.push({
			player: open.player,
			options: open.options.length,
			drafters: open.drafters,
		});
		state = play(
			state,
			open.player,
			{ decision: open.id, card: open.options[0] },
			random
		);
	}
	return { state, offers };
}

for (const [count, variants] of [
	[2, []],
	[4, []],
	[3, ['no-arts-track']],
]) {
	test(`with A&A alone at ${count} players${variants.length ? ', the arts track off,' : ''} the last player draws one card per player, and each keeps one`, () => {
		const drafting = draftGame(
			/** @type {number} */ (count),
			['aa'],
			/** @type {string[]} */ (variants)
		);
		const { state, offers } = draftAll(drafting.state, drafting.random);
		assert.equal(offers[0].options, count);
		assert.equal(state.supply.landmarkCards.length, 5 - Number(count));
		const kept = state.seats.map(
			(/** @type {any} */ s) => s.landmarkCard.card
		);
		assert.equal(new Set(kept).size, count);
		assert.ok(kept.every((card) => AA_CARDS.includes(card)));
		assert.equal(state.phase, 'play');
		checkState(state);
	});
}

for (const count of [2, 3, 5]) {
	test(`with both expansions at ${count} players the draft deals ${count + 1}, and the last drafter chooses from 2 (03 §7)`, () => {
		const drafting = draftGame(count, ['pp', 'aa']);
		const { state, offers } = draftAll(drafting.state, drafting.random);
		assert.equal(offers[0].options, count + 1);
		assert.equal(offers.length, count);
		const last = offers[offers.length - 1];
		assert.deepEqual(last, {
			player: state.first,
			options: 2,
			drafters: [],
		});
		const kept = state.seats.map(
			(/** @type {any} */ s) => s.landmarkCard.card
		);
		assert.equal(new Set(kept).size, count);
		assert.equal(state.supply.landmarkCards.length, 10 - count);
		checkState(state);
	});
}

test('alone a player draws 2 whatever the expansions; otherwise one per player, and one more with both', () => {
	assert.equal(landmarkCardDeal(['pp', 'aa'], 1), 2);
	assert.equal(landmarkCardDeal(['aa'], 1), 2);
	assert.equal(landmarkCardDeal(['pp'], 3), 3);
	assert.equal(landmarkCardDeal(['aa'], 3), 3);
	assert.equal(landmarkCardDeal(['pp', 'aa'], 3), 4);
});

test('a P&P game deals as before, with the same random draws', () => {
	const state = createGame({
		players: [{ name: 'Ana' }, { name: 'Bo' }],
		version: 'current',
		expansions: ['pp'],
		random: seededRandom(7),
	});
	// Recorded before part 3 changed setup.
	assert.deepEqual(state.supply.landmarkCards, [
		'digital-studio',
		'tv-station',
		'urban-farm',
		'game-store',
		'skyscraper',
	]);
	assert.deepEqual(state.supply.tech.deck.slice(0, 5), [
		'siegecraft',
		'zeppelins',
		'irrigation',
		'the-nail',
		'time-travel',
	]);
});
