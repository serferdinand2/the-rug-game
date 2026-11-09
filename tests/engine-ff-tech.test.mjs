// Fantasies & Futures' 12 tech cards (#39 part 1): the deck, the cards, the charm-or-5 prerequisite and single use.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import {
	AA_TECH,
	BASE_TECH,
	FF_TECH,
	techDeck,
} from '../src/lib/engine/decks.js';
import { TECH_CARDS, techCard } from '../src/lib/engine/data/tech-cards.js';
import { upgradable } from '../src/lib/engine/tech.js';
import { resolveEffects } from '../src/lib/engine/loop.js';
import { newGame, readyTurn } from './helpers/engine.mjs';
import { openDecisions } from '../src/lib/engine/stack.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import { play } from '../src/lib/engine/play.js';
import { checkState } from './helpers/invariants.mjs';

test("F&F's 12 tech cards follow the others in the deck, in catalog order", () => {
	assert.deepEqual(FF_TECH, [
		'golem-minions',
		'levitation',
		'mind-control',
		'object-cloning',
		'perfect-memory',
		'pyrokinesis',
		'remote-viewing',
		'superhuman-strength',
		'super-speed',
		'teleportation',
		'transmogrification',
		'weather-control',
	]);
	assert.deepEqual(techDeck(['ff'], []), [...BASE_TECH, ...FF_TECH]);
	assert.deepEqual(techDeck(['aa', 'ff'], []), [
		...BASE_TECH,
		...AA_TECH,
		...FF_TECH,
	]);
	const deal = (/** @type {string[]} */ expansions) => {
		const { tech } = newGame(3, { expansions }).state.supply;
		return tech.deck.length + tech.faceUp.length;
	};
	assert.equal(deal(['ff']), 45);
	assert.equal(deal(['aa', 'ff']), 56);
});

/** An advance on one of two tracks: without benefit for the circle, with it (the bonus payable) for the square. */
const twoTracks = (/** @type {string[]} */ tracks) => [
	[{ advance: { tracks, noBenefit: true } }],
	[{ advance: { tracks } }],
	true,
];

/** Each card's circle, square and single use, as 03 FF.5 prints them (#39 design §9). */
const CARDS = {
	'golem-minions': [
		[{ vp: { per: 'landmark' } }],
		[
			{ advance: { tracks: ['military'], noBenefit: true } },
			{ vp: { per: 'trackSpace', track: 'military' } },
		],
		false,
	],
	levitation: [
		[{ choice: [[{ explore: {} }], [{ gain: { space: 1 } }]] }],
		[{ exploreSpace: {} }],
		true,
	],
	'mind-control': twoTracks(['science', 'military']),
	'object-cloning': twoTracks(['arts', 'technology']),
	'perfect-memory': twoTracks(['science', 'arts']),
	pyrokinesis: [
		[{ building: 'armory' }],
		[{ vp: { per: 'territory' } }, { vp: { per: 'armory' } }],
		false,
	],
	'remote-viewing': [
		[{ gain: { territory: 1 } }, { explore: { anywhere: true } }],
		[{ research: {} }],
		true,
	],
	'superhuman-strength': twoTracks(['exploration', 'military']),
	'super-speed': [
		[{ vp: { per: 'territoryTile' } }],
		[{ explore: {} }, { explore: {} }],
		false,
	],
	teleportation: twoTracks(['exploration', 'technology']),
	transmogrification: [[{ invent: {} }], [{ anyBuilding: {} }], false],
	'weather-control': [[{ explore: {} }], [{ repeat: {} }], true],
};

test('the 12 cards are data: circle, square, single use and the charm-or-5 prerequisite, as 03 FF.5 prints them', () => {
	assert.deepEqual(
		TECH_CARDS.map((card) => card.id),
		[...BASE_TECH, ...AA_TECH, ...FF_TECH]
	);
	assert.deepEqual(Object.keys(CARDS), [...FF_TECH]);
	for (const [id, [circle, square, singleUse]] of Object.entries(CARDS)) {
		const card = techCard(id);
		assert.deepEqual(card.circle, circle, `${id}'s circle`);
		assert.deepEqual(card.square, square, `${id}'s square`);
		assert.equal(card.singleUse === true, singleUse, `${id}'s single use`);
		assert.deepEqual(card.requires, { charmOrFive: true }, id);
		assert.equal(card.expansion, 'ff', id);
	}
	assert.equal(techCard('super-speed').name, 'Super Speed');
	assert.equal(techCard('irrigation').singleUse, undefined);
});

/**
 * A started F&F game for 3 players whose current player holds these tech rows, its turn choice open; `fill` changes
 * that seat and the state first.
 * @param {{ bottom?: string[], middle?: string[], top?: string[] }} rows
 * @param {(seat: any, state: any) => void} [fill]
 * @param {string[]} [expansions]
 */
export function holding(rows, fill = () => {}, expansions = ['ff']) {
	const held = Object.values(rows).flat();
	return readyTurn(
		3,
		(seat, s) => {
			seat.tech = { bottom: [], middle: [], top: [], ...rows };
			const tech = s.supply.tech;
			tech.deck = tech.deck.filter((card) => !held.includes(card));
			tech.faceUp = tech.faceUp.map((card) =>
				held.includes(card) ? tech.deck.pop() : card
			);
			fill(seat, s);
		},
		{ expansions }
	);
}

/**
 * Answers every open decision with its first answer until only the turn's choice is left; an upgrade takes `card`
 * when it may.
 * @param {any} state
 * @param {any} random
 * @param {string} [card]
 */
export function settle(state, random, card) {
	for (let step = 0; step < 100; step++) {
		const [open] = openDecisions(state);
		if (!open || open.kind === 'chooseTurn') {
			return state;
		}
		const answers = DECISIONS[open.kind].answers(state, open);
		const first =
			answers.find((a) => card !== undefined && a.card === card) ??
			answers[0];
		state = play(
			state,
			open.player,
			{ decision: open.id, ...first },
			random
		);
	}
	throw new Error('A decision never ended.');
}

test("the charm-or-5 prerequisite: a charmed card played, or income turn 5, never a neighbour's", () => {
	const { state, player } = holding({ middle: ['levitation'] });
	const seat = /** @type {any} */ (state.seats[player - 1]);
	const others = state.seats.filter((s) => s.seat !== player);
	seat.incomeTurns = 2;
	assert.deepEqual(upgradable(state, player), []);
	seat.playedCharmed = true;
	assert.deepEqual(upgradable(state, player), ['levitation']);
	seat.playedCharmed = false;
	seat.incomeTurns = 5;
	assert.deepEqual(upgradable(state, player), ['levitation']);
	// Neighbours are ignored (03 FF.2.3).
	seat.incomeTurns = 2;
	/** @type {any} */ (others[0]).playedCharmed = true;
	others[1].incomeTurns = 5;
	assert.deepEqual(upgradable(state, player), []);
	// Golden Age ignores every prerequisite.
	seat.era = { card: 'golden-age', ability: 'golden-age' };
	assert.deepEqual(upgradable(state, player), ['levitation']);
});

test('every F&F card resolves both of its upgrades, with or without the arts track', () => {
	for (const expansions of [['ff'], ['aa', 'ff']]) {
		for (const card of FF_TECH) {
			const { state, random, player } = holding(
				{ bottom: [card] },
				(seat, s) => {
					seat.playedCharmed = true;
					seat.territoryTiles = [...s.supply.territory.splice(0, 2)];
				},
				expansions
			);
			let next = resolveEffects(
				state,
				player,
				[{ upgrade: { count: 2 } }],
				random
			);
			next = settle(next, random, card);
			assert.ok(
				/** @type {any} */ (next.seats[player - 1]).tech.top.includes(
					card
				),
				`${card} on top`
			);
			checkState(next);
		}
	}
});
