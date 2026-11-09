// Fantasies & Futures' 11 tapestry cards that reserve an item (#39 part 2): the deck, their data, and each played to its use on income turn 5.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { BASE_TAPESTRY, tapestryFor } from '../src/lib/engine/decks.js';
import { tapestryCard } from '../src/lib/engine/data/tapestry-cards.js';
import { playTapestry } from '../src/lib/engine/tapestry.js';
import { contextFor, resolveEffects, run } from '../src/lib/engine/loop.js';
import { openDecisions } from '../src/lib/engine/stack.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import { answer, readyTurn } from './helpers/engine.mjs';
import { checkState } from './helpers/invariants.mjs';

/** The 11 cards, in catalog order. */
const RESERVING = [
	'ecstatic-visions',
	'generation-ships',
	'ghost-towns',
	'great-library-of-potions',
	'lost-artifacts',
	'microbial-magic',
	'phantasmal-paladins',
	'quest-culture',
	'secret-societies',
	'suspended-animation',
	'zombie-army',
];

const ANY = ['exploration', 'science', 'technology', 'military', 'arts'];
const ARTS_X = { advance: { tracks: ['arts'], noBenefit: true } };

/** Each card's ability, charms and income-turn-5 reminder, as #39 design §8 lists them (03 FF.4.1, FF.4.3). */
const CARDS = {
	'ecstatic-visions': [
		[{ ecstaticVisions: {} }],
		{
			left: [
				{
					choice: [
						[{ gain: { territory: 1, tapestry: 1 } }],
						[ARTS_X],
					],
				},
			],
		},
	],
	'generation-ships': [
		[{ reserve: { space: 3 } }],
		{
			right: [
				{
					choice: [
						[{ vp: { per: 'territoryTile' } }],
						[{ regress: { tracks: ['arts'], noBenefit: true } }],
					],
				},
			],
		},
	],
	'ghost-towns': [
		[{ reserve: { token: true } }],
		{
			left: [{ advance: { tracks: ANY, noBenefit: true } }],
			right: [{ advance: { tracks: ANY, noBenefit: true } }],
		},
		[{ vp: { per: 'buildingLeft', each: 3 } }],
	],
	'great-library-of-potions': [
		[{ reserve: { building: 'market' } }],
		{ left: [{ gain: { coin: 1 } }, { vp: 5 }], right: [{ invent: {} }] },
	],
	'lost-artifacts': [
		[{ reserve: { tech: true } }],
		{ right: [{ advance: { tracks: ['technology'], noBenefit: true } }] },
	],
	'microbial-magic': [
		[{ reserve: { building: 'farm' } }],
		{
			left: [{ gain: { food: 1 } }, { vp: 5 }],
			right: [{ vp: { per: 'territoryTile' } }],
		},
	],
	'phantasmal-paladins': [
		[{ reserve: { building: 'armory' } }],
		{
			left: [{ gain: { culture: 1 } }, { vp: 5 }],
			right: [{ vp: { per: 'territory' } }],
		},
	],
	'quest-culture': [
		[{ reserve: { territory: 3 } }],
		{
			right: [
				{ choice: [[{ gain: { territory: 1 } }], [{ explore: {} }]] },
			],
		},
	],
	'secret-societies': [
		[{ reserve: { building: 'house' } }],
		{
			left: [{ choice: [[{ gain: { tapestry: 2 } }], [ARTS_X]] }],
			right: [{ gain: { worker: 1 } }, { vp: 5 }],
		},
	],
	'suspended-animation': [
		[{ reserve: { token: true } }],
		{
			left: [{ gain: { tapestry: 1 } }],
			right: [{ gain: { tapestry: 1 } }],
		},
		[{ advance: { tracks: ANY, freeBonus: true } }],
	],
	'zombie-army': [
		[{ reserve: { outposts: 3 } }],
		{ left: [{ building: 'armory' }] },
	],
};

test("F&F's 11 reserving cards follow the others in the deck, in catalog order", () => {
	assert.deepEqual(tapestryFor(['ff']), [...BASE_TAPESTRY, ...RESERVING]);
	// None leaves without the arts track (#39 design §8).
	assert.deepEqual(
		tapestryFor(['aa', 'ff'], ['no-arts-track']).slice(-11),
		RESERVING
	);
});

test('the 11 cards are data: WHEN PLAYED, their ability, charms and income-turn-5 reminder, numbers exact', () => {
	assert.deepEqual(Object.keys(CARDS), RESERVING);
	for (const [id, [played, charms, fifth]] of Object.entries(CARDS)) {
		const card = tapestryCard(id);
		assert.equal(card.timing, 'played', id);
		assert.equal(card.expansion, 'ff', id);
		assert.deepEqual(card.played, played, `${id}'s ability`);
		assert.deepEqual(card.charms, charms, `${id}'s charms`);
		assert.deepEqual(card.fifth, fifth, `${id}'s income turn 5`);
	}
	assert.equal(
		tapestryCard('great-library-of-potions').name,
		'Great Library of Potions'
	);
});

/**
 * Answers open decisions with their first answer until only the turn's choice is left.
 * @param {any} state
 * @param {any} random
 */
function settle(state, random) {
	for (let step = 0; step < 200; step++) {
		const [open] = openDecisions(state);
		if (!open || open.kind === 'chooseTurn') {
			return state;
		}
		const first = DECISIONS[open.kind].answers(state, open)[0];
		state = answer(state, random, open.player, open.kind, first);
	}
	throw new Error('A decision never ended.');
}

/**
 * Plays a card from the deck onto era 2 beside an era-1 card, settles, then uses the overlay as income turn 5 would.
 * @param {string} card
 * @param {string[]} expansions
 * @param {string[]} [variants]
 */
function playToFive(card, expansions, variants = []) {
	const { state, random, player } = readyTurn(
		3,
		(seat, s) => {
			s.supply.tapestry.deck = s.supply.tapestry.deck.filter(
				(/** @type {string} */ c) => c !== card && c !== 'academia'
			);
			seat.incomeMat.tapestry = [['academia'], [], [], []];
			seat.territoryTiles = s.supply.territory.splice(0, 2);
		},
		{ expansions, variants }
	);
	const played = structuredClone(state);
	playTapestry(contextFor(played, random, played.pending), player, card, 2);
	run(played, random);
	const after = settle(played, random);
	checkState(after);
	const seat = /** @type {any} */ (after.seats[player - 1]);
	return { state: after, random, player, seat };
}

test('every reserving card plays to the end, its item used on income turn 5, with and without the arts track', () => {
	for (const [expansions, variants] of [
		[['ff'], []],
		[['aa', 'ff'], []],
		[['aa', 'ff'], ['no-arts-track']],
	]) {
		for (const card of RESERVING) {
			const { state, random, player, seat } = playToFive(
				card,
				expansions,
				variants
			);
			assert.ok(
				seat.reserved.length > 0 || card === 'zombie-army',
				`${card} reserved something`
			);
			assert.ok(
				state.events.some(
					(/** @type {any} */ e) =>
						e.type === 'charmGained' && e.card === card
				) || !tapestryCard(card).charms?.left,
				`${card}'s left charm`
			);
			seat.incomeTurns = 5;
			const used = settle(
				resolveEffects(state, player, [{ useAllReserved: {} }], random),
				random
			);
			assert.deepEqual(
				/** @type {any} */ (used.seats[player - 1]).reserved,
				[],
				`${card}'s item used`
			);
			checkState(used);
		}
	}
});

test('Ghost Towns scores 3 VP per income building still on the income mat; Suspended Animation advances with a free bonus', () => {
	const ghost = playToFive('ghost-towns', ['ff']);
	const before = ghost.seat.vp;
	ghost.seat.incomeTurns = 5;
	const scored = settle(
		resolveEffects(
			ghost.state,
			ghost.player,
			[{ useAllReserved: {} }],
			ghost.random
		),
		ghost.random
	);
	const left = Object.values(ghost.seat.incomeMat.buildings).reduce(
		(/** @type {number} */ a, /** @type {any} */ b) => a + b,
		0
	);
	assert.equal(scored.seats[ghost.player - 1].vp, before + 3 * left);
});

test('Lost Artifacts: on income turn 5 the reserved card is invented and upgraded twice, ignoring its prerequisite', () => {
	const lost = playToFive('lost-artifacts', ['ff']);
	const [item] = lost.seat.reserved;
	lost.seat.incomeTurns = 5;
	const used = settle(
		resolveEffects(
			lost.state,
			lost.player,
			[{ useAllReserved: {} }],
			lost.random
		),
		lost.random
	);
	assert.ok(
		/** @type {any} */ (used.seats[lost.player - 1]).tech.top.includes(
			item.tech
		)
	);
});

test('Ecstatic Visions offers masterpieces only with the arts track', () => {
	const arts = playToFive('ecstatic-visions', ['aa', 'ff']);
	assert.ok(
		arts.state.events.some(
			(/** @type {any} */ e) => e.type === 'itemReserved'
		)
	);
	const none = playToFive('ecstatic-visions', ['ff']);
	assert.ok(typeof none.seat.reserved[0].space === 'number');
});
