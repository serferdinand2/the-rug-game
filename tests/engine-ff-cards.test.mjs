// Fantasies & Futures' other tapestry cards (#40 part 2): their data, charms and abilities, numbers exact (03 FF.4).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { tapestryCard } from '../src/lib/engine/data/tapestry-cards.js';
import { tapestryFor } from '../src/lib/engine/decks.js';
import { playTapestry } from '../src/lib/engine/tapestry.js';
import { contextFor, resolveEffects, run } from '../src/lib/engine/loop.js';
import { openDecisions } from '../src/lib/engine/stack.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import { countVp } from '../src/lib/engine/effects/vp.js';
import { seerSightReveals } from '../src/lib/engine/effects/ff-cards.js';
import { buildingSpots } from '../src/lib/engine/city.js';
import { answer, conquestGame, readyTurn } from './helpers/engine.mjs';
import { push } from '../src/lib/engine/stack.js';
import { play } from '../src/lib/engine/play.js';
import { checkState } from './helpers/invariants.mjs';

const ARTS_X = { advance: { tracks: ['arts'], noBenefit: true } };

/** Batch (a): each card's ability and charms, as #40's part 2 plan lists them (03 FF.4.1, FF.4.3). */
const BATCH_A = {
	'alien-disclosure': [
		[{ alienDisclosure: {} }],
		{ left: [{ invent: { refresh: true } }] },
	],
	'chimera-citizen-rights': [
		[{ chimera: {} }],
		{ right: [{ gain: { tapestry: 1 } }] },
	],
	'citadel-of-power': [
		[{ citadelOfPower: {} }],
		{ right: [{ vp: { per: 'landmark' } }] },
	],
	'deja-vu': [
		[{ dejaVu: {} }],
		{ right: [{ research: { noBenefit: true } }] },
	],
	'haunted-houses': [
		[
			{
				trade: {
					offers: [
						{
							pay: { tapestry: 7 },
							gain: [{ gainCiv: {} }, { vp: 7 }],
						},
					],
					optional: true,
					otherwise: [
						{ gain: { tapestry: 1 } },
						{ building: 'house' },
					],
				},
			},
		],
		{ right: [{ vp: 2 }] },
	],
	'hive-mind': [
		[{ vp: { per: 'marketRow', each: 2 } }],
		{ left: [{ building: 'market' }] },
	],
	muses: [
		[{ muses: {} }],
		{
			left: [
				{
					choice: [
						[{ vp: { per: 'trackSpace', track: 'arts' } }],
						[{ vp: 5 }],
					],
				},
			],
		},
	],
	technomancy: [
		[{ technomancy: {} }],
		{ right: [{ vp: { per: 'techCard' } }] },
	],
	'temporal-nomadism': [
		[{ temporalNomadism: {} }],
		{ right: [{ gain: { any: 1 } }] },
	],
	'uploaded-consciousness': [
		[{ uploadedConsciousness: { left: 3 } }],
		{ right: [{ vp: { per: 'techCard' } }] },
	],
	'wizards-guild': [
		[{ vp: { per: 'charm', each: 3 } }],
		{
			left: [
				{
					choice: [
						[{ gain: { worker: 1 } }],
						[{ gain: { food: 1 } }],
					],
				},
			],
			right: [
				{
					choice: [
						[{ gain: { culture: 1 } }],
						[{ gain: { coin: 1 } }],
					],
				},
			],
		},
	],
};

test("batch (a)'s 11 cards are data: WHEN PLAYED, ability and charms, numbers exact", () => {
	for (const [id, [played, charms]] of Object.entries(BATCH_A)) {
		const card = tapestryCard(id);
		assert.equal(card.timing, 'played', id);
		assert.equal(card.expansion, 'ff', id);
		assert.deepEqual(card.played, played, `${id}'s ability`);
		assert.deepEqual(card.charms, charms, `${id}'s charms`);
		assert.ok(tapestryFor(['ff']).includes(id), `${id} is dealt`);
	}
	assert.equal(tapestryCard('deja-vu').name, 'Déjà Vu');
	assert.equal(tapestryCard('wizards-guild').name, "Wizards' Guild");
	assert.equal(
		tapestryCard('chimera-citizen-rights').name,
		'Chimera-Citizen Rights'
	);
});

/**
 * Answers open decisions with their first answer until only the turn's choice is left.
 * @param {any} state
 * @param {any} random
 */
export function settle(state, random) {
	for (let step = 0; step < 300; step++) {
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
 * An F&F game whose current player plays `card` onto era 2, beside an era-1 card, and settles it.
 * @param {string} card
 * @param {string[]} expansions
 * @param {(seat: any, state: any) => void} [fill]
 */
export function played(card, expansions = ['ff'], fill = () => {}) {
	const { state, random, player } = readyTurn(
		3,
		(seat, s) => {
			s.supply.tapestry.deck = s.supply.tapestry.deck.filter(
				(/** @type {string} */ c) => c !== card && c !== 'academia'
			);
			seat.incomeMat.tapestry = [['academia'], [], [], []];
			seat.territoryTiles = s.supply.territory.splice(0, 2);
			fill(seat, s);
		},
		{ expansions }
	);
	const next = structuredClone(state);
	playTapestry(contextFor(next, random, next.pending), player, card, 2);
	run(next, random);
	const after = settle(next, random);
	return {
		state: after,
		random,
		player,
		seat: /** @type {any} */ (after.seats[player - 1]),
	};
}

test('every batch (a) card plays to the end, with and without the arts track', () => {
	for (const expansions of [['ff'], ['aa', 'ff']]) {
		for (const card of Object.keys(BATCH_A)) {
			const { state } = played(card, expansions);
			checkState(state);
		}
	}
});

test("Hive Mind: 2 VP per capital row holding a market; Wizards' Guild: 3 VP per charm tag on the mat's top cards", () => {
	const { state, player } = readyTurn(
		2,
		(seat) => {
			seat.capital.buildings = [
				{ building: 'market', row: 0, col: 0 },
				{ building: 'market', row: 0, col: 3 },
				{ building: 'market', row: 4, col: 4 },
			];
			seat.incomeMat.buildings.market = 2;
			seat.incomeMat.tapestry = [
				['academia'],
				['microbial-magic', 'ghost-towns'],
				['wizards-guild'],
				[],
			];
		},
		{ expansions: ['ff'] }
	);
	assert.equal(countVp(state, player, 'marketRow'), 2);
	// Ghost Towns (2 tags, on top of Microbial Magic) and Wizards' Guild (2): 4.
	assert.equal(countVp(state, player, 'charm'), 4);
});

test('Muses offers only the tracks where you are ahead of every opponent, and always 7 VP', () => {
	const { state, random, player } = readyTurn(
		2,
		(seat, s) => {
			seat.tracks.science = [5];
			for (const other of s.seats) {
				if (other.seat !== seat.seat) {
					other.tracks.science = [3];
					other.tracks.military = [2];
				}
			}
		},
		{ expansions: ['ff'] }
	);
	const next = resolveEffects(state, player, [{ muses: {} }], random);
	const ask = openDecisions(next).find((d) => d.kind === 'chooseOption');
	assert.ok(ask);
	assert.deepEqual(ask.options, [[{ vp: 7 }], [{ research: {} }]]);
});

test('Déjà Vu offers 7 VP or a tier-II space reached; Temporal Nomadism a lower space on a track not completed', () => {
	const { state, random, player } = readyTurn(
		2,
		(seat) => {
			seat.tracks.exploration = [5];
			seat.tracks.military = [12];
		},
		{ expansions: ['ff'] }
	);
	const deja = resolveEffects(state, player, [{ dejaVu: {} }], random);
	const ask = openDecisions(deja).find((d) => d.kind === 'chooseTrackSpace');
	assert.ok(ask);
	const spaces = ask.options.map(
		(/** @type {any} */ o) => `${o.track} ${o.space}`
	);
	assert.deepEqual(spaces, [
		'exploration 4',
		'exploration 5',
		'military 4',
		'military 5',
		'military 6',
	]);
	assert.equal(ask.vp, 7);
	const nomad = resolveEffects(
		state,
		player,
		[{ temporalNomadism: {} }],
		random
	);
	const back = openDecisions(nomad).find(
		(d) => d.kind === 'chooseTrackSpace'
	);
	assert.deepEqual(
		back.options.map((/** @type {any} */ o) => `${o.track} ${o.space}`),
		['exploration 1', 'exploration 2', 'exploration 3', 'exploration 4']
	);
});

test('Citadel of Power gains the first landmark tech card revealed and keeps the tech decks whole', () => {
	const { state, random, player } = readyTurn(2, () => {}, {
		expansions: ['ff'],
	});
	const next = settle(
		resolveEffects(state, player, [{ citadelOfPower: {} }], random),
		random
	);
	const gained = next.events.filter(
		(/** @type {any} */ e) =>
			e.type === 'landmarkGained' && e.player === player
	);
	assert.equal(gained.length, 1);
	assert.ok(
		next.events.some((/** @type {any} */ e) => e.type === 'techRevealed')
	);
	checkState(next);
});

test('Technomancy gains the circles of 2 face-up tech cards without taking them', () => {
	const { state, random, player } = readyTurn(2, () => {}, {
		expansions: ['ff'],
	});
	const faceUp = [...state.supply.tech.faceUp];
	const next = settle(
		resolveEffects(state, player, [{ technomancy: {} }], random),
		random
	);
	const used = next.events.filter(
		(/** @type {any} */ e) =>
			e.type === 'techBenefitUsed' && e.player === player
	);
	assert.equal(used.length, 2);
	assert.ok(used.every((/** @type {any} */ e) => faceUp.includes(e.card)));
	assert.equal(
		/** @type {any} */ (next.seats[player - 1]).tech.bottom.length,
		0
	);
});

test('Uploaded Consciousness trades up to 3 territory tiles, one at a time; Alien Disclosure needs 5 VP to explore', () => {
	const { state, random, player } = readyTurn(
		2,
		(seat, s) => {
			seat.territoryTiles = s.supply.territory.splice(0, 4);
		},
		{ expansions: ['ff'] }
	);
	let next = resolveEffects(
		state,
		player,
		[{ uploadedConsciousness: { left: 3 } }],
		random
	);
	// Accept every trade offered, answering the resource each gives, until none is offered.
	let trades = 0;
	for (let step = 0; step < 20; step++) {
		const [open] = openDecisions(next);
		if (!open || open.kind === 'chooseTurn') {
			break;
		}
		const answers = DECISIONS[open.kind].answers(next, open);
		const pick =
			open.kind === 'chooseTrade'
				? answers.find((a) => a.offer === 0)
				: answers[0];
		trades += open.kind === 'chooseTrade' ? 1 : 0;
		next = answer(
			next,
			random,
			player,
			open.kind,
			/** @type {any} */ (pick)
		);
	}
	assert.equal(trades, 3);
	assert.ok(!openDecisions(next).some((d) => d.kind === 'chooseTrade'));
	assert.equal(
		/** @type {any} */ (next.seats[player - 1]).territoryTiles.length,
		1
	);
	const poor = resolveEffects(
		state,
		player,
		[{ alienDisclosure: {} }],
		random
	);
	assert.ok(!openDecisions(poor).some((d) => d.kind === 'chooseTrade'));
	assert.equal(
		/** @type {any} */ (poor.seats[player - 1]).spaceTiles.length,
		1
	);
});

// Batch (b): era, continuous and looking cards (#40 part 2)

/** Batch (b)'s cards and timings, with their charms (03 FF.4.1). */
const BATCH_B = {
	'astral-expeditions': ['era', { left: [{ gain: { any: 1 } }] }],
	'interdimensional-trade': ['era', { right: [{ building: 'market' }] }],
	'living-cities': ['era', { left: [{ building: 'farm' }] }],
	doppelgangers: ['played', { right: [{ gain: { worker: 1 } }] }],
	'seer-sight': [
		'played',
		{ right: [{ invent: { refresh: true } }, { gain: { any: 1 } }] },
	],
};

test("batch (b)'s cards are data: their timing and charms", () => {
	for (const [id, [timing, charms]] of Object.entries(BATCH_B)) {
		const card = tapestryCard(id);
		assert.equal(card.timing, timing, id);
		assert.deepEqual(card.charms, charms, `${id}'s charms`);
		assert.ok(tapestryFor(['ff']).includes(id), `${id} is dealt`);
	}
});

test('every batch (b) card plays to the end, with and without the arts track', () => {
	for (const expansions of [['ff'], ['aa', 'ff']]) {
		for (const card of Object.keys(BATCH_B)) {
			checkState(played(card, expansions).state);
		}
	}
});

test('Living Cities: a landmark gained this era scores 1 VP per farm', () => {
	const { state, random, player } = readyTurn(
		2,
		(seat) => {
			seat.era = { card: null, ability: 'living-cities' };
			seat.incomeMat.buildings.farm = 3;
		},
		{ expansions: ['ff'] }
	);
	const vp = state.seats[player - 1].vp;
	const next = settle(
		resolveEffects(state, player, [{ landmark: 'barracks' }], random),
		random
	);
	assert.equal(next.seats[player - 1].vp, vp + 2);
});

test('Interdimensional Trade: a tapestry card gained may be traded for a card discarded, an invent and 2 VP', () => {
	const { state, random, player } = readyTurn(
		2,
		(seat) => {
			seat.era = { card: null, ability: 'interdimensional-trade' };
		},
		{ expansions: ['ff'] }
	);
	const next = resolveEffects(
		state,
		player,
		[{ gain: { tapestry: 1 } }],
		random
	);
	const trade = openDecisions(next).find((d) => d.kind === 'chooseTrade');
	assert.ok(trade, 'the trade is offered');
	assert.deepEqual(trade.offers[0].gain, [{ invent: {} }, { vp: 2 }]);
});

test('Astral Expeditions: a bonus paid may give a space tile, or explore one, instead', () => {
	const { state, random, player } = readyTurn(
		2,
		(seat) => {
			seat.era = { card: null, ability: 'astral-expeditions' };
			seat.resources = { coin: 3, worker: 3, food: 3, culture: 3 };
			seat.tracks.exploration = [1];
		},
		{ expansions: ['ff'] }
	);
	const next = resolveEffects(
		state,
		player,
		[{ advance: { tracks: ['exploration'] } }],
		random
	);
	const bonus = openDecisions(next).find((d) => d.kind === 'chooseBonus');
	assert.ok(bonus);
	const answers = DECISIONS.chooseBonus.answers(next, bonus);
	assert.ok(answers.some((a) => a.instead === 'gain'));
	const swapped = answers.find((a) => a.instead === 'gain');
	const after = answer(
		next,
		random,
		player,
		'chooseBonus',
		/** @type {any} */ (swapped)
	);
	assert.equal(
		/** @type {any} */ (after.seats[player - 1]).spaceTiles.length,
		1
	);
});

test("Doppelgangers: a second token of yours on an opponent's space, with no benefit", () => {
	const { state, random, player } = readyTurn(
		2,
		(seat, s) => {
			for (const other of s.seats) {
				if (other.seat !== seat.seat) {
					other.tracks.science = [6];
				}
			}
		},
		{ expansions: ['ff'] }
	);
	const next = resolveEffects(state, player, [{ doppelgangers: {} }], random);
	const ask = openDecisions(next).find((d) => d.kind === 'chooseTrackSpace');
	assert.ok(
		ask.options.some(
			(/** @type {any} */ o) => o.track === 'science' && o.space === 6
		)
	);
	const after = answer(next, random, player, 'chooseTrackSpace', {
		track: 'science',
		space: 6,
	});
	assert.deepEqual(
		/** @type {any} */ (after.seats[player - 1]).tracks.science,
		[0, 6]
	);
	assert.ok(
		!after.events.some(
			(/** @type {any} */ e) =>
				e.type === 'spaceActivated' && e.player === player
		)
	);
	checkState(after);
});

test('Seer Sight: 3 VP per THIS ERA card among one revealed per completed district; they are discarded', () => {
	const { state, random, player } = readyTurn(
		2,
		(seat, s) => {
			seat.capital.buildings = [];
			s.supply.tapestry.deck = [
				'academia',
				'dark-ages',
				...s.supply.tapestry.deck.filter(
					(c) => c !== 'academia' && c !== 'dark-ages'
				),
			];
		},
		{ expansions: ['ff'] }
	);
	// No district complete: nothing revealed.
	const none = resolveEffects(state, player, [{ seerSight: {} }], random);
	assert.equal(none.seats[player - 1].vp, state.seats[player - 1].vp);
	assert.equal(seerSightReveals(state, player), 0);
});

/** Batch (b), second half: the cards that need new questions, with their charms (03 FF.4.1). */
const BATCH_B2 = {
	'good-omens': ['continuous', { left: [{ research: {} }] }],
	'dream-monitors': ['played', { right: [{ vp: { per: 'territory' } }] }],
	'high-council': [
		'played',
		{
			left: [{ vp: { per: 'tapestryCard' } }],
			right: [{ vp: { per: 'territory' } }],
		},
	],
	soothsaying: ['played', { right: [{ gain: { any: 1 } }] }],
	'superpower-regulators': [
		'played',
		{ left: [{ advance: { tracks: ['science'], noBenefit: true } }] },
	],
};

test("batch (b)'s second half is data, and plays to the end with and without the arts track", () => {
	for (const [id, [timing, charms]] of Object.entries(BATCH_B2)) {
		const card = tapestryCard(id);
		assert.equal(card.timing, timing, id);
		assert.deepEqual(card.charms, charms, `${id}'s charms`);
	}
	for (const expansions of [['ff'], ['aa', 'ff']]) {
		for (const card of Object.keys(BATCH_B2)) {
			checkState(played(card, expansions).state);
		}
	}
});

test('Dream Monitors: a token fills a plot of the capital (R78), and 2 resources beside a house', () => {
	const { state, random, player } = readyTurn(
		2,
		(seat) => {
			// A house on an open plot with an open plot beside it.
			const open = buildingSpots(seat);
			const house = open.find((a) =>
				open.some(
					(b) =>
						b !== a &&
						Math.abs(a.row - b.row) <= 1 &&
						Math.abs(a.col - b.col) <= 1
				)
			);
			seat.capital.buildings = [
				{ building: 'house', row: house.row, col: house.col },
			];
			seat.incomeMat.buildings.house = 4;
		},
		{ expansions: ['ff'] }
	);
	const next = resolveEffects(state, player, [{ dreamMonitors: {} }], random);
	const ask = openDecisions(next).find((d) => d.kind === 'choosePlot');
	assert.ok(ask);
	const [house] = /** @type {any} */ (next.seats[player - 1]).capital
		.buildings;
	const beside = ask.options.find(
		(/** @type {any} */ o) =>
			Math.abs(o.row - house.row) <= 1 && Math.abs(o.col - house.col) <= 1
	);
	const placed = settle(
		answer(next, random, player, 'choosePlot', beside),
		random
	);
	const seat = /** @type {any} */ (placed.seats[player - 1]);
	assert.deepEqual(seat.capital.tokens, [
		{ row: beside.row, col: beside.col, seat: player },
	]);
	const total = Object.values(seat.resources).reduce((a, b) => a + b, 0);
	assert.ok(total >= 2, `${total} resources`);
	checkState(placed);
});

test('High Council asks each player with a card in turn; an opponent revealing a response card gives 10 VP', () => {
	const { state, random, player } = readyTurn(
		2,
		(seat, s) => {
			seat.hand = [];
			const other = s.seats.find((o) => o.seat !== seat.seat);
			s.supply.tapestry.deck = s.supply.tapestry.deck.filter(
				(c) => c !== 'trap-1'
			);
			other.hand = ['trap-1'];
		},
		{ expansions: ['ff'] }
	);
	const vp = state.seats[player - 1].vp;
	let next = resolveEffects(state, player, [{ highCouncil: {} }], random);
	const ask = openDecisions(next).find((d) => d.kind === 'chooseCouncil');
	assert.ok(ask && ask.player !== player);
	next = settle(
		answer(next, random, ask.player, 'chooseCouncil', { card: 'trap-1' }),
		random
	);
	assert.equal(next.seats[player - 1].vp, vp + 10);
	checkState(next);
});

test("Superpower Regulators: 9 VP, or both charms of up to 2 charmed cards in opponents' hands (R84); they keep them", () => {
	const { state, random, player } = readyTurn(
		2,
		(seat, s) => {
			const other = s.seats.find((o) => o.seat !== seat.seat);
			s.supply.tapestry.deck = s.supply.tapestry.deck.filter(
				(c) => c !== 'microbial-magic'
			);
			other.hand = ['microbial-magic'];
		},
		{ expansions: ['ff'] }
	);
	const next = resolveEffects(
		state,
		player,
		[{ superpowerRegulators: {} }],
		random
	);
	const ask = openDecisions(next).find((d) => d.kind === 'chooseRegulated');
	assert.ok(ask);
	const answers = DECISIONS.chooseRegulated.answers(next, ask);
	assert.ok(answers.some((a) => a.vp === true));
	assert.ok(answers.some((a) => a.card === 'microbial-magic'));
	const after = settle(
		answer(next, random, player, 'chooseRegulated', {
			card: 'microbial-magic',
		}),
		random
	);
	const gained = after.events.filter(
		(/** @type {any} */ e) =>
			e.type === 'charmGained' && e.player === player
	);
	assert.equal(gained.length, 2);
	const other = after.seats.find((o) => o.seat !== player);
	assert.ok(/** @type {any} */ (other).hand.includes('microbial-magic'));
});

test('Soothsaying: 5 revealed; each charmed one gives 1 resource and 2 VP and goes to an opponent; the rest are discarded', () => {
	const { state, random, player } = readyTurn(
		2,
		(seat, s) => {
			const top = [
				'microbial-magic',
				'academia',
				'ghost-towns',
				'dark-ages',
				'capitalism',
			];
			s.supply.tapestry.deck = [
				...top,
				...s.supply.tapestry.deck.filter((c) => !top.includes(c)),
			];
		},
		{ expansions: ['ff'] }
	);
	const vp = state.seats[player - 1].vp;
	const next = settle(
		resolveEffects(state, player, [{ soothsaying: {} }], random),
		random
	);
	assert.equal(next.seats[player - 1].vp, vp + 4);
	const other = /** @type {any} */ (
		next.seats.find((o) => o.seat !== player)
	);
	assert.ok(
		other.hand.includes('microbial-magic') &&
			other.hand.includes('ghost-towns')
	);
	assert.ok(
		['academia', 'dark-ages', 'capitalism'].every((c) =>
			next.supply.tapestry.discard.includes(c)
		)
	);
	// The log says which were discarded: the charmed ones go to an opponent (final review).
	const revealed = next.events.find(
		(/** @type {any} */ e) => e.type === 'tapestryRevealed'
	);
	assert.deepEqual(revealed.discarded, [
		'academia',
		'dark-ages',
		'capitalism',
	]);
	checkState(next);
});

test("Good Omens: a guess before each roll; a right one gives, at the end of the turn, 1 VP per arts space and the guessed track's space 4 benefit", () => {
	const { state, random, player } = readyTurn(
		2,
		(seat, s) => {
			s.supply.tapestry.deck = s.supply.tapestry.deck.filter(
				(c) => c !== 'good-omens'
			);
			seat.incomeMat.tapestry = [[], ['good-omens'], [], []];
		},
		{ expansions: ['ff'] }
	);
	const next = resolveEffects(
		state,
		player,
		[{ research: { noBenefit: true } }],
		random
	);
	const ask = openDecisions(next).find((d) => d.kind === 'chooseGuess');
	assert.ok(ask, 'a guess before the roll');
	assert.deepEqual(
		DECISIONS.chooseGuess.answers(next, ask).map((a) => a.track),
		['exploration', 'science', 'technology', 'military']
	);
});

// Batch (c): the 5 response cards (03 FF.4.2)

/** Each response card: as a tapestry, its timing and effects; its two charms (03 FF.4.1). */
const RESPONSES = {
	'ghost-ship': [
		'played',
		[{ vp: 7 }],
		{ left: [{ gain: { territory: 2 } }], right: [{ explore: {} }] },
	],
	gremlins: [
		'played',
		[{ vp: 7 }],
		{
			left: [{ invent: {} }],
			right: [{ vp: { per: 'trackSpace', track: 'technology' } }],
		},
	],
	'the-kraken': [
		'played',
		[{ vp: 7 }],
		{
			left: [{ gain: { culture: 1 } }],
			right: [{ vp: { per: 'territory' } }],
		},
	],
	'league-of-the-charmed': [
		'played',
		[{ gain: { culture: 1 } }, { vp: 2 }],
		{ left: [{ explore: {} }], right: [{ vp: { per: 'armory' } }] },
	],
	'robotic-decoys': [
		'era',
		[],
		{
			left: [{ advance: { tracks: ['science'], noBenefit: true } }],
			right: [{ vp: { per: 'trackSpace', track: 'science' } }],
		},
	],
};

test('the 5 response cards are data: conquest responses with their tapestry text and charms (R75)', () => {
	for (const [id, [timing, effects, charms]] of Object.entries(RESPONSES)) {
		const card = tapestryCard(id);
		assert.equal(card.response, 'conquest', id);
		assert.equal(card.timing, timing, id);
		assert.deepEqual(card.played, effects, id);
		assert.deepEqual(card.charms, charms, id);
	}
	assert.equal(
		tapestryCard('league-of-the-charmed').name,
		'League of the Charmed'
	);
	for (const expansions of [['ff'], ['aa', 'ff']]) {
		for (const card of Object.keys(RESPONSES)) {
			checkState(played(card, expansions).state);
		}
	}
});

test("a response card topples the attacker and gives one of its two charms, the defender's pick (03 FF.4.2)", () => {
	const state = conquestGame(['the-kraken'], { expansions: ['ff'] });
	state.supply.tapestry.deck = state.supply.tapestry.deck.filter(
		(c) => c !== 'the-kraken'
	);
	push(state, state.pending, [
		{ player: 1, kind: 'effects', effects: [{ conquer: {} }] },
	]);
	run(state, () => 0);
	const question = openDecisions(state).find(
		(d) => d.kind === 'chooseResponse'
	);
	assert.ok(question);
	assert.ok(
		DECISIONS.chooseResponse
			.answers(state, question)
			.some((a) => a.card === 'the-kraken')
	);
	let next = play(
		state,
		2,
		{ decision: question.id, card: 'the-kraken' },
		() => 0
	);
	const pick = openDecisions(next).find(
		(d) => d.kind === 'chooseOption' && d.player === 2
	);
	assert.ok(pick, 'the defender picks a charm');
	next = play(next, 2, { decision: pick.id, option: 0 }, () => 0);
	assert.ok(
		next.events.some(
			(/** @type {any} */ e) =>
				e.type === 'charmGained' &&
				e.player === 2 &&
				e.card === 'the-kraken'
		)
	);
	assert.ok(
		next.hexes['-2_-1'].outposts.some((o) => o.seat === 1 && o.toppled)
	);
	assert.ok(!next.seats[1].hand.includes('the-kraken'));
});

test('Robotic Decoys: after you or a neighbour advances on Science, you may pay 1 coin for 1 worker and 5 VP', () => {
	const { state, random, player } = readyTurn(
		2,
		(seat) => {
			seat.era = { card: null, ability: 'robotic-decoys' };
			seat.resources.coin = 2;
		},
		{ expansions: ['ff'] }
	);
	const next = resolveEffects(
		state,
		player,
		[{ advance: { tracks: ['science'], noBenefit: true } }],
		random
	);
	const trade = openDecisions(next).find((d) => d.kind === 'chooseTrade');
	assert.ok(trade);
	assert.deepEqual(trade.offers[0], {
		pay: { coin: 1 },
		gain: [{ gain: { worker: 1 } }, { vp: 5 }],
	});
});

test('an answer with a field no offered answer has is refused: no 9 VP on top of a card for Superpower Regulators, no 7 VP for a track space (security review)', () => {
	const { state } = readyTurn(2, () => {}, { expansions: ['ff'] });
	const second = {
		id: 99,
		batch: 99,
		player: 1,
		kind: 'chooseRegulated',
		options: ['microbial-magic', 'ghost-towns'],
		picked: 1,
	};
	assert.throws(
		() =>
			DECISIONS.chooseRegulated.check(state, second, {
				card: 'microbial-magic',
				vp: true,
			}),
		{ name: 'PlayerError' }
	);
	assert.doesNotThrow(() =>
		DECISIONS.chooseRegulated.check(state, second, {
			card: 'microbial-magic',
		})
	);
	const nomadism = {
		id: 98,
		batch: 98,
		player: 1,
		kind: 'chooseTrackSpace',
		purpose: 'temporalNomadism',
		options: [{ track: 'science', space: 1 }],
	};
	assert.throws(
		() =>
			DECISIONS.chooseTrackSpace.check(state, nomadism, {
				track: 'science',
				space: 1,
				vp: true,
			}),
		{ name: 'PlayerError' }
	);
	assert.doesNotThrow(() =>
		DECISIONS.chooseTrackSpace.check(state, nomadism, {
			track: 'science',
			space: 1,
		})
	);
});
