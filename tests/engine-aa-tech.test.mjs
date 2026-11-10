// Arts & Architecture's 11 tech cards (#37 part 1): the deck, the cards, their prerequisites and the landmark on a card.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { AA_TECH, BASE_TECH, techDeck } from '../src/lib/engine/decks.js';
import { TECH_CARDS, techCard } from '../src/lib/engine/data/tech-cards.js';
import { upgradable } from '../src/lib/engine/tech.js';
import { upgradeCard } from '../src/lib/engine/effects/tech.js';
import { contextFor, resolveEffects, run } from '../src/lib/engine/loop.js';
import { placements } from '../src/lib/engine/placing.js';
import { landmarksOwned } from '../src/lib/engine/effects/vp.js';
import { landmarksInCity } from '../src/lib/engine/ranking.js';
import { pay } from '../src/lib/engine/payment.js';
import { openDecisions } from '../src/lib/engine/stack.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import {
	answer,
	answerDefaults,
	newGame,
	startedGame,
} from './helpers/engine.mjs';
import { AA } from './helpers/arts.mjs';
import { checkState } from './helpers/invariants.mjs';

/** The 4 A&A tech cards that name the arts track (R124). */
const ARTS_TECH = ['microphone', 'oil-paint', 'opera', 'public-art'];

test("A&A's 11 tech cards follow the base 33 in the deck, in catalog order", () => {
	assert.deepEqual(AA_TECH, [
		'astrolabe',
		'automation',
		'calculus',
		'duct-tape',
		'jet-fuel',
		'microphone',
		'oil-paint',
		'opera',
		'public-art',
		'suburbs',
		'war-college',
	]);
	assert.deepEqual(techDeck([], []), [...BASE_TECH]);
	assert.deepEqual(techDeck(['pp'], []), [...BASE_TECH]);
	assert.deepEqual(techDeck(['aa'], []), [...BASE_TECH, ...AA_TECH]);
});

test('R124: without the arts track, the 4 tech cards that name it leave the deck', () => {
	assert.deepEqual(techDeck(['aa'], ['no-arts-track']), [
		...BASE_TECH,
		...AA_TECH.filter((card) => !ARTS_TECH.includes(card)),
	]);
	// no-radio-battery still leaves out its 2.
	const deck = techDeck(['aa'], ['no-radio-battery']);
	assert.equal(deck.length, 33 - 2 + 11);
	assert.ok(!deck.includes('radio') && !deck.includes('lithium-ion-battery'));
});

test('a game with A&A deals from the 44 tech cards; one without it is unchanged, seed for seed', () => {
	const { state } = newGame(3, { expansions: ['aa'] });
	const cards = [...state.supply.tech.deck, ...state.supply.tech.faceUp];
	assert.equal(cards.length, 44);
	checkState(state);
	const base = newGame(3, { seed: 7 }).state;
	const again = newGame(3, { seed: 7, expansions: ['pp'] }).state;
	assert.deepEqual(base.supply.tech, again.supply.tech);
	assert.equal(base.supply.tech.deck.length + 3, 33);
});

/** Each A&A card's circle, square and prerequisite, as 03 §2's A&A tech table (#37 design §5). */
const CARDS = {
	astrolabe: [
		[{ gain: { food: 1 } }],
		[{ advance: { tracks: ['exploration'] } }],
		{ landmark: true },
	],
	automation: [
		[{ gain: { coin: 1 } }],
		[{ advance: { tracks: ['technology'] } }],
		{ landmark: true },
	],
	calculus: [
		[{ gain: { worker: 1 } }],
		[{ advance: { tracks: ['science'] } }],
		{ landmark: true },
	],
	'duct-tape': [
		[{ gain: { culture: 1 } }],
		[{ upgrade: { ignorePrerequisite: true, count: 2 } }],
		{ track: 'science', tier: 3 },
	],
	'jet-fuel': [
		[{ gain: { space: 1 } }],
		[{ exploreSpace: {} }],
		{ track: 'science', tier: 3 },
	],
	microphone: [
		[{ gain: { any: 1 } }],
		[{ advance: { tracks: ['arts'] } }],
		{ landmark: true },
	],
	'oil-paint': [
		[{ gain: { any: 1 } }],
		[{ create: {} }],
		{ track: 'arts', tier: 2, selfInOriginal: true },
	],
	opera: [
		[{ advance: { tracks: ['arts'], noBenefit: true } }],
		[{ vp: { per: 'trackSpace', track: 'arts' } }],
		{ track: 'arts', tier: 2 },
	],
	'public-art': [
		[{ gain: { tapestry: 1 } }],
		[{ inspire: {} }],
		{ track: 'arts', tier: 3 },
	],
	suburbs: [[{ vp: 4 }], [{ anyBuilding: {} }], { none: true }],
	'war-college': [
		[{ gain: { culture: 1 } }],
		[{ advance: { tracks: ['military'] } }],
		{ landmark: true },
	],
};

test('the 11 cards are data: circle, square and prerequisite as 03 §2 prints them', () => {
	// F&F's follow (#39).
	assert.deepEqual(
		TECH_CARDS.filter((card) => card.expansion !== 'ff').map(
			(card) => card.id
		),
		[...BASE_TECH, ...AA_TECH]
	);
	assert.deepEqual(Object.keys(CARDS), [...AA_TECH]);
	for (const [id, [circle, square, requires]] of Object.entries(CARDS)) {
		const card = techCard(id);
		assert.deepEqual(card.circle, circle, `${id}'s circle`);
		assert.deepEqual(card.square, square, `${id}'s square`);
		assert.deepEqual(card.requires, requires, `${id}'s prerequisite`);
		assert.equal(card.expansion, 'aa', id);
	}
	assert.equal(techCard('war-college').name, 'War College');
	assert.equal(techCard('duct-tape').name, 'Duct Tape');
	assert.equal(techCard('irrigation').expansion, 'base');
});

// The prerequisites and Duct Tape

/**
 * A started A&A game for 3 players whose seat 1 holds these tech rows; `fill` changes the state first.
 * @param {{ bottom?: string[], middle?: string[], top?: string[] }} rows
 * @param {(state: any) => void} [fill]
 * @param {'original' | 'current'} [version]
 */
function holding(rows, fill = () => {}, version = 'current') {
	const { state, random } = startedGame(3, { ...AA, version });
	state.pending.length = 0;
	state.seats[0].tech = { bottom: [], middle: [], top: [], ...rows };
	const held = Object.values(rows).flat();
	const tech = state.supply.tech;
	tech.deck = tech.deck.filter((card) => !held.includes(card));
	tech.faceUp = tech.faceUp.map((card) =>
		held.includes(card) ? tech.deck.pop() : card
	);
	fill(state);
	return { state, random };
}

test('Suburbs has no prerequisite; a landmark card needs a landmark on itself (03 §2)', () => {
	const { state } = holding({ middle: ['suburbs', 'astrolabe'] });
	assert.deepEqual(upgradable(state, 1), ['suburbs']);
	state.seats[0].techLandmarks.astrolabe = 'villa';
	assert.deepEqual(upgradable(state, 1), ['suburbs', 'astrolabe']);
	// A neighbour's landmark card holding one meets nothing for this player's.
	const other = holding({ middle: ['calculus'] }, (s) => {
		s.seats[1].techLandmarks.astrolabe = 'villa';
	});
	assert.deepEqual(upgradable(other.state, 1), []);
});

test("R125: Oil Paint's arts tier II may be a neighbour's in the current version, only yours in the original", () => {
	const neighbour = (/** @type {any} */ state) => {
		state.seats[1].tracks.arts = [4];
	};
	assert.deepEqual(
		upgradable(holding({ middle: ['oil-paint'] }, neighbour).state, 1),
		['oil-paint']
	);
	assert.deepEqual(
		upgradable(
			holding({ middle: ['oil-paint'] }, neighbour, 'original').state,
			1
		),
		[]
	);
	const mine = holding(
		{ middle: ['oil-paint'] },
		(state) => {
			state.seats[0].tracks.arts = [4];
		},
		'original'
	);
	assert.deepEqual(upgradable(mine.state, 1), ['oil-paint']);
	// Opera keeps the neighbours icon in both versions.
	assert.deepEqual(
		upgradable(
			holding({ middle: ['opera'] }, neighbour, 'original').state,
			1
		),
		['opera']
	);
});

test("Duct Tape's square upgrades 1 card twice, ignoring prerequisites, the landmark one too (03 §2)", () => {
	let { state, random } = holding({
		bottom: ['astrolabe'],
		middle: ['duct-tape'],
	});
	const food = state.seats[0].resources.food;
	upgradeCard(contextFor(state, random, state.pending), 1, 'duct-tape');
	run(state, random);
	state = answerDefaults(state, random);
	assert.deepEqual(
		state.events
			.filter((e) => e.type === 'techUpgraded')
			.map((e) => [e.card, e.to]),
		[
			['duct-tape', 'top'],
			['astrolabe', 'middle'],
			['astrolabe', 'top'],
		]
	);
	assert.equal(state.seats[0].resources.food, food + 1);
	assert.equal(state.seats[0].tracks.exploration.at(-1), 1);
});

test("Duct Tape's two upgrades may take 2 cards once each", () => {
	const { state, random } = holding({
		bottom: ['suburbs'],
		middle: ['duct-tape', 'calculus'],
	});
	upgradeCard(contextFor(state, random, state.pending), 1, 'duct-tape');
	run(state, random);
	const [decision] = openDecisions(state);
	assert.equal(decision.kind, 'chooseUpgrade');
	assert.equal(decision.ignorePrerequisite, true);
	assert.deepEqual(DECISIONS.chooseUpgrade.answers(state, decision), [
		{ card: 'suburbs' },
		{ card: 'calculus' },
	]);
	let next = answer(state, random, 1, 'chooseUpgrade', { card: 'calculus' });
	next = answerDefaults(next, random);
	assert.ok(next.seats[0].tech.top.includes('calculus'));
	assert.ok(next.seats[0].tech.middle.includes('suburbs'));
	// Calculus' square: Science from the start to space 1, whatever its own roll does next.
	assert.deepEqual(
		next.events.find(
			(e) => e.type === 'tokenMoved' && e.track === 'science'
		),
		{
			...next.events.find(
				(e) => e.type === 'tokenMoved' && e.track === 'science'
			),
			player: 1,
			from: 0,
			to: 1,
		}
	);
});

// A landmark on a tech card

test('R126: a gained landmark may go on a landmark tech card in the bottom or middle row that holds none', () => {
	const { state } = holding(
		{
			bottom: ['astrolabe', 'suburbs'],
			middle: ['calculus', 'automation'],
			top: ['war-college'],
		},
		(s) => {
			s.seats[0].techLandmarks.automation = 'villa';
		}
	);
	const tech = (/** @type {any[]} */ places) =>
		places.filter((place) => 'tech' in place);
	assert.deepEqual(tech(placements(state, 1, { landmark: 'castle' })), [
		{ tech: 'astrolabe' },
		{ tech: 'calculus' },
	]);
	// A building never goes on a tech card.
	assert.deepEqual(tech(placements(state, 1, { building: 'farm' })), []);
});

test('a landmark placed on Astrolabe upgrades it at once, before the benefit of the space that gave it (03 §2)', () => {
	const { state, random } = holding({ middle: ['astrolabe'] }, (s) => {
		s.seats[0].tracks.military = [3];
		s.seats[0].territoryTiles = [];
	});
	const vp = state.seats[0].vp;
	let next = resolveEffects(
		state,
		1,
		[{ advance: { tracks: ['military'] } }],
		random
	);
	const [decision] = openDecisions(next);
	assert.equal(decision.kind, 'choosePlacement');
	assert.equal(decision.landmark, 'barracks');
	assert.ok(
		DECISIONS.choosePlacement
			.answers(next, decision)
			.some((a) => a.tech === 'astrolabe')
	);
	next = answer(next, random, 1, 'choosePlacement', { tech: 'astrolabe' });
	next = answerDefaults(next, random);
	const seat = next.seats[0];
	assert.deepEqual(seat.techLandmarks, { astrolabe: 'barracks' });
	assert.deepEqual(seat.tech.top, ['astrolabe']);
	assert.ok(!seat.capital.landmarks.some((l) => l.landmark === 'barracks'));
	const at = (/** @type {(e: any) => boolean} */ test) =>
		next.events.findIndex(test);
	const placed = at((e) => e.type === 'landmarkPlacedOnTech');
	assert.deepEqual(next.events[placed], {
		...next.events[placed],
		player: 1,
		landmark: 'barracks',
		card: 'astrolabe',
	});
	const upgraded = at((e) => e.type === 'techUpgraded');
	const explored = at(
		(e) => e.type === 'tokenMoved' && e.track === 'exploration'
	);
	const worker = at(
		(e) => e.type === 'resourcesGained' && e.gained?.worker === 1
	);
	assert.ok(placed < upgraded && upgraded < explored && explored < worker);
	// Standing Army's 1 VP per territory tile counts Scouting's 2, gained first.
	assert.equal(seat.territoryTiles.length, 2);
	assert.equal(seat.vp, vp + 2);
	// It is owned, for landmark counts, but not in the city, for ties (R13).
	assert.deepEqual(landmarksOwned(next, 1), ['barracks']);
	assert.deepEqual(landmarksInCity(seat), []);
});

test('a tech card discarded with its landmark discards the landmark, out of the game (03 §2)', () => {
	const { state, random } = holding({ top: ['calculus'] }, (s) => {
		s.seats[0].techLandmarks.calculus = 'villa';
		s.landmarks = s.landmarks.filter(
			(/** @type {string} */ id) => id !== 'villa'
		);
	});
	pay(contextFor(state, random, state.pending), 1, { tech: ['calculus'] });
	assert.deepEqual(state.seats[0].techLandmarks, {});
	assert.deepEqual(state.supply.landmarkDiscard, ['villa']);
	assert.deepEqual(
		state.events
			.filter((e) => e.type === 'landmarkDiscarded')
			.map((e) => [e.player, e.landmark, e.card]),
		[[1, 'villa', 'calculus']]
	);
	assert.ok(state.supply.tech.discard.includes('calculus'));
});

test('without A&A, no seat holds landmarks on tech cards and nothing is set aside for them', () => {
	const { state } = newGame(2, { expansions: ['pp'] });
	assert.equal(state.seats[0].techLandmarks, undefined);
	assert.equal(state.supply.landmarkDiscard, undefined);
	const aa = newGame(2, AA).state;
	assert.deepEqual(aa.seats[0].techLandmarks, {});
	assert.deepEqual(aa.supply.landmarkDiscard, []);
});

for (const id of AA_TECH) {
	test(`every A&A tech card's circle and square run to the end: ${id}`, () => {
		let { state, random } = holding({ bottom: [id] }, (s) => {
			const seat = s.seats[0];
			for (const track of Object.keys(seat.tracks)) {
				seat.tracks[track] = [5];
			}
			seat.spaceTiles = [];
		});
		for (const _ of [1, 2]) {
			upgradeCard(contextFor(state, random, state.pending), 1, id);
			run(state, random);
			state = answerDefaults(state, random);
		}
		assert.deepEqual(
			state.events
				.filter((e) => e.type === 'techUpgraded' && e.card === id)
				.map((e) => e.to),
			['middle', 'top']
		);
		assert.ok(state.seats[0].tech.top.includes(id));
	});
}

test("the A&A cards' benefits: Jet Fuel's space tile, Oil Paint's masterpiece, Public Art's inspiration, Suburbs' 4 VP", () => {
	let { state, random } = holding({
		middle: ['oil-paint', 'public-art'],
		bottom: ['jet-fuel', 'suburbs', 'opera'],
	});
	const seat = () => state.seats[0];
	const vp = seat().vp;
	for (const id of [
		'jet-fuel',
		'jet-fuel',
		'oil-paint',
		'public-art',
		'suburbs',
		'opera',
	]) {
		upgradeCard(contextFor(state, random, state.pending), 1, id);
		run(state, random);
		state = answerDefaults(state, random);
	}
	assert.equal(seat().spaceTiles.length, 0);
	assert.equal(seat().exploredSpace.length, 1);
	assert.equal(seat().masterpieces.length, 1);
	assert.equal(seat().inspired.length, 1);
	assert.equal(seat().tracks.arts.at(-1), 1);
	assert.ok(seat().vp >= vp + 4);
});
