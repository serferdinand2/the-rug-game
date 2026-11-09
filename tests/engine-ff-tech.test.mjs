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
import { recyclable, upgradable } from '../src/lib/engine/tech.js';
import { contextFor, resolveEffects } from '../src/lib/engine/loop.js';
import { techBenefitOptions } from '../src/lib/engine/effects/tech.js';
import { countVp } from '../src/lib/engine/effects/vp.js';
import { neighbours } from '../src/lib/engine/state.js';
import { pay } from '../src/lib/engine/payment.js';
import { spiesTargets } from '../src/lib/engine/civs/spies.js';
import {
	inventorsOptions,
	inventorsTake,
} from '../src/lib/engine/civs/inventors.js';
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

// Single use (03 FF.2.3, R134)

test('a single-use card flips when its square is gained, and still counts as a tech card', () => {
	const { state, random, player } = holding(
		{ middle: ['mind-control'] },
		(seat) => {
			seat.playedCharmed = true;
		}
	);
	const next = settle(
		resolveEffects(state, player, [{ upgrade: {} }], random),
		random
	);
	const seat = /** @type {any} */ (next.seats[player - 1]);
	assert.deepEqual(seat.tech.top, ['mind-control']);
	assert.deepEqual(seat.flippedTech, ['mind-control']);
	assert.ok(
		next.events.some(
			(e) =>
				e.type === 'techFlipped' &&
				e.player === player &&
				e.card === 'mind-control'
		)
	);
	assert.equal(countVp(next, player, 'techCard'), 1);
	checkState(next);
});

test('a repeatable F&F card never flips', () => {
	const { state, random, player } = holding(
		{ middle: ['pyrokinesis'] },
		(seat) => {
			seat.playedCharmed = true;
		}
	);
	const next = settle(
		resolveEffects(state, player, [{ upgrade: {} }], random),
		random
	);
	assert.deepEqual(
		/** @type {any} */ (next.seats[player - 1]).flippedTech,
		[]
	);
});

test('R134: a flipped card offers no benefit again, to its owner or to the Spies', () => {
	const { state, player } = holding(
		{ top: ['mind-control', 'pyrokinesis'] },
		(seat) => {
			seat.flippedTech = ['mind-control'];
		}
	);
	assert.deepEqual(techBenefitOptions(state, player, 'square'), [
		'pyrokinesis',
	]);
	assert.deepEqual(techBenefitOptions(state, player, 'square', true), [
		'pyrokinesis',
	]);
	const spy = neighbours(state, player)[0];
	assert.deepEqual(
		spiesTargets(state, spy, 4, player).map((t) => t.card),
		['pyrokinesis']
	);
});

test('R134: the Recyclers may not recycle a flipped card', () => {
	const { state, player } = holding(
		{ top: ['mind-control', 'pyrokinesis'] },
		(seat) => {
			seat.flippedTech = ['mind-control'];
			seat.civs = ['recyclers'];
		}
	);
	assert.deepEqual(recyclable(state, player), ['pyrokinesis']);
});

test("an opponent may not send a player's single-use card to the top row; its bottom-row copy may still be marked", () => {
	const { state, player } = holding({
		bottom: ['teleportation'],
		middle: ['mind-control'],
	});
	const inventors = neighbours(state, player)[0];
	const marked = inventorsOptions(state, inventors).filter(
		(o) => o.player === player
	);
	assert.deepEqual(
		marked.map((o) => o.card),
		['teleportation']
	);
	// Their own single-use card, they may.
	/** @type {any} */ (state.seats[inventors - 1]).tech.middle = [
		'levitation',
	];
	state.supply.tech.deck = state.supply.tech.deck.filter(
		(c) => c !== 'levitation'
	);
	assert.ok(
		inventorsOptions(state, inventors).some(
			(o) => o.player === inventors && o.card === 'levitation'
		)
	);
});

test('a flipped card the Inventors take stays flipped and never upgrades again', () => {
	const { state, random, player } = holding(
		{ top: ['mind-control'] },
		(seat) => {
			seat.flippedTech = ['mind-control'];
		}
	);
	const inventors = neighbours(state, player)[0];
	const next = structuredClone(state);
	const ctx = contextFor(next, random, next.pending);
	inventorsTake(
		ctx,
		/** @type {any} */ ({
			player: inventors,
			from: player,
			card: 'mind-control',
		})
	);
	const thief = /** @type {any} */ (next.seats[inventors - 1]);
	assert.deepEqual(thief.tech.bottom, ['mind-control']);
	assert.deepEqual(thief.flippedTech, ['mind-control']);
	assert.deepEqual(
		/** @type {any} */ (next.seats[player - 1]).flippedTech,
		[]
	);
	assert.deepEqual(upgradable(next, inventors, true), []);
});

test('a flipped card paid away is no longer flipped', () => {
	const { state, random, player } = holding(
		{ top: ['mind-control'] },
		(seat) => {
			seat.flippedTech = ['mind-control'];
		}
	);
	const next = structuredClone(state);
	pay(contextFor(next, random, next.pending), player, {
		tech: ['mind-control'],
	});
	assert.ok(next.supply.tech.discard.includes('mind-control'));
	assert.deepEqual(
		/** @type {any} */ (next.seats[player - 1]).flippedTech,
		[]
	);
});

test('R134: the Inventors may not mark a flipped card they took (review fix)', () => {
	const { state, player } = holding({}, (seat) => {
		seat.tech.bottom = ['mind-control'];
		seat.flippedTech = ['mind-control'];
	});
	assert.ok(
		!inventorsOptions(state, player).some((o) => o.card === 'mind-control')
	);
});
