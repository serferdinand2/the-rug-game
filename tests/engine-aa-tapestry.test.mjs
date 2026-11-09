// Arts & Architecture's 20 tapestry cards (#37 part 2): the deck and each card's ability, numbers as 03 §2.5.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { BASE_TAPESTRY, tapestryFor } from '../src/lib/engine/decks.js';
import { slugsOf } from '../src/lib/engine/decks.js';
import {
	TAPESTRY_CARDS,
	tapestryCard,
} from '../src/lib/engine/data/tapestry-cards.js';
import { resolveEffects } from '../src/lib/engine/loop.js';
import { openDecisions } from '../src/lib/engine/stack.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import { play } from '../src/lib/engine/play.js';
import { landmarkCardOps } from '../src/lib/engine/landmark-cards.js';
import { controlledTerritories } from '../src/lib/engine/control.js';
import { hexNeighbours } from '../src/lib/engine/data/maps.js';
import {
	answer,
	answerDefaults,
	newGame,
	readyTurn,
	resolveTapestry,
	startedGame,
} from './helpers/engine.mjs';
import { AA } from './helpers/arts.mjs';
import { checkState } from './helpers/invariants.mjs';

/** The 6 A&A tapestry cards with the arts icon (03 §2.5, R124). */
const ARTS_CARDS = [
	'artistic-inspiration',
	'found-art',
	'government-grants',
	'granges',
	'silk-road',
	'steam',
];

/**
 * A started A&A game for 3 players, its pending stack cleared, after `fill` changes it.
 * @param {(state: any) => void} [fill]
 * @param {Record<string, any>} [options]
 */
function aaGame(fill = () => {}, options = {}) {
	const { state, random } = startedGame(3, { ...AA, ...options });
	state.pending.length = 0;
	fill(state);
	return { state, random };
}

/**
 * The events of a type.
 * @param {any} state
 * @param {string} type
 * @returns {any[]}
 */
const events = (state, type) => state.events.filter((e) => e.type === type);

// The deck

test('R124: the A&A cards join the deck after the base and P&P cards; without the arts track the arts ones stay out', () => {
	assert.deepEqual(tapestryFor([], []), [...BASE_TAPESTRY]);
	const aa = tapestryFor(['aa'], []).slice(BASE_TAPESTRY.length);
	assert.ok(aa.length > 0);
	assert.ok(aa.every((id) => tapestryCard(id).expansion === 'aa'));
	assert.deepEqual(
		aa,
		slugsOf('tapestry', 'aa').filter((id) => aa.includes(id)),
		'catalog order'
	);
	const off = tapestryFor(['aa'], ['no-arts-track']);
	assert.ok(off.every((id) => !ARTS_CARDS.includes(id)));
	assert.ok(aa.includes('steam') && !off.includes('steam'));
	const both = tapestryFor(['pp', 'aa'], []);
	assert.deepEqual(both.slice(0, tapestryFor(['pp'], []).length), [
		...tapestryFor(['pp'], []),
	]);
	checkState(newGame(3, AA).state);
});

// S.T.E.A.M.

test('S.T.E.A.M.: 1 worker for each new tier entered on science or arts, none on the other tracks (03 §2.5)', () => {
	const { state, random } = aaGame((s) => {
		s.seats[0].tracks.science = [3];
		s.seats[0].tracks.arts = [5];
		s.seats[0].tracks.military = [3];
		// Taken already, so no placement or district reward changes the count.
		s.landmarks = s.landmarks.filter(
			(/** @type {string} */ id) =>
				id !== 'apothecary' && id !== 'barracks'
		);
	});
	const played = resolveTapestry(state, random, 1, 'steam');
	const workers = played.seats[0].resources.worker;
	const advance = (/** @type {string} */ track) =>
		answerDefaults(
			resolveEffects(
				played,
				1,
				[{ advance: { tracks: [track], noBenefit: true } }],
				random
			),
			random
		);
	assert.equal(advance('science').seats[0].resources.worker, workers + 1);
	assert.equal(advance('arts').seats[0].resources.worker, workers);
	assert.equal(advance('military').seats[0].resources.worker, workers);
	assert.equal(tapestryCard('steam').timing, 'era');
	assert.equal(tapestryCard('steam').name, 'S.T.E.A.M.');
});

// Artistic Inspiration

test('Artistic Inspiration: 3 VP for each arts-track advance, and a science-die roll may use the arts track instead (03 §2.5)', () => {
	const { state, random } = aaGame((s) => {
		s.seats[0].tracks.arts = [1];
		s.seats[0].tracks.science = [1];
	});
	const played = resolveTapestry(state, random, 1, 'artistic-inspiration');
	const vp = played.seats[0].vp;
	const advanced = answerDefaults(
		resolveEffects(
			played,
			1,
			[{ advance: { tracks: ['arts'], noBenefit: true } }],
			random
		),
		random
	);
	assert.equal(advanced.seats[0].vp, vp + 3);
	// The roll comes first; then the rolled face or the arts track.
	// A die that always lands on its first face, Exploration, whatever the deck's shuffle.
	const rolled = resolveEffects(
		played,
		1,
		[{ research: { noBenefit: true } }],
		() => 0
	);
	const [decision] = openDecisions(rolled);
	const face = events(rolled, 'scienceDieRolled').at(-1).track;
	assert.notEqual(face, 'arts', 'this seed rolls another face');
	assert.equal(decision.kind, 'chooseRoll');
	assert.deepEqual(decision.options, [face, 'arts']);
	const onArts = answer(rolled, random, 1, 'chooseRoll', { track: 'arts' });
	const [move] = openDecisions(onArts);
	assert.equal(move.kind, 'chooseMove');
	assert.deepEqual(move.options, [{ track: 'arts', from: 1 }]);
});

// Found Art

test('Found Art: 2 territory tiles may stand in for one resource of an arts-track price, once per advance (03 §2.5)', () => {
	const { state, random, player } = readyTurn(
		3,
		(seat) => {
			seat.era = { card: null, ability: 'found-art' };
			seat.tracks.arts = [3];
			seat.resources = { coin: 1, worker: 0, food: 0, culture: 0 };
			seat.territoryTiles = [5, 9, 12];
		},
		AA
	);
	const chosen = answer(state, random, player, 'chooseTurn', {
		turn: 'advance',
	});
	const [decision] = openDecisions(chosen);
	const arts = DECISIONS.chooseAdvance
		.answers(chosen, decision)
		.filter((a) => a.track === 'arts');
	// Tier II asks 2 different resources: 1 coin and 2 tiles do, 3 tiles never.
	assert.deepEqual(
		arts.map((a) => a.pay),
		[
			{ coin: 1, territory: [5, 9] },
			{ coin: 1, territory: [5, 12] },
			{ coin: 1, territory: [9, 12] },
		]
	);
	// Another track's price takes no tiles.
	assert.ok(
		DECISIONS.chooseAdvance
			.answers(chosen, decision)
			.every((a) => a.track === 'arts' || a.pay.territory === undefined)
	);
	const paid = play(
		chosen,
		player,
		{ decision: decision.id, ...arts[0] },
		random
	);
	const seat = paid.seats[player - 1];
	assert.deepEqual(seat.territoryTiles, [12]);
	assert.equal(seat.resources.coin, 0);
	assert.equal(seat.tracks.arts.at(-1), 4);
});

// Government Grants

test('Government Grants: advance on arts with its benefit and a free bonus, then go back on another track without its bonus (03 §2.5)', () => {
	let { state, random } = aaGame((s) => {
		const seat = s.seats[0];
		seat.tracks.arts = [1];
		seat.tracks.science = [3];
		seat.resources = { coin: 0, worker: 0, food: 0, culture: 0 };
	});
	const vp = state.seats[0].vp;
	const left = (/** @type {any} */ s) =>
		Object.values(s.seats[0].incomeMat.buildings).reduce(
			(/** @type {number} */ a, /** @type {number} */ b) => a + b,
			0
		);
	const buildings = left(state);
	state = resolveTapestry(state, random, 1, 'government-grants');
	// Flutes' bonus (pay 1 resource for an income building) is free.
	const [bonus] = openDecisions(state);
	assert.equal(bonus.kind, 'chooseBonus');
	const take = DECISIONS.chooseBonus
		.answers(state, bonus)
		.find((a) => a.pay !== null);
	assert.deepEqual(take, { pay: {} });
	state = answerDefaults(
		play(state, 1, { decision: bonus.id, ...take }, random),
		random
	);
	const seat = state.seats[0];
	assert.deepEqual(seat.tracks.arts, [2]);
	assert.deepEqual(seat.tracks.science, [2]);
	assert.equal(left(state), buildings - 1);
	assert.ok(seat.vp >= vp + 5);
	assert.ok(
		!events(state, 'spaceActivated').some(
			(e) => e.track === 'science' && e.space === 2 && e.bonus
		)
	);
	assert.deepEqual(tapestryCard('government-grants').played, [
		{ advance: { tracks: ['arts'], freeBonus: true } },
		{
			regress: {
				tracks: ['exploration', 'science', 'technology', 'military'],
				noBonus: true,
			},
		},
	]);
});

// Information Age

test("Information Age: invent, then upgrade a tech card or gain any of your cards' circle benefit (03 §2.5)", () => {
	assert.deepEqual(tapestryCard('information-age').played, [
		{ invent: {} },
		{
			choice: [
				[{ upgrade: {} }],
				[{ techBenefit: { icon: 'circle', anyRow: true } }],
			],
		},
	]);
	// A top-row card's circle counts too.
	const { state, random } = aaGame((s) => {
		s.seats[0].tech = { bottom: [], middle: [], top: ['transistors'] };
		s.supply.tech.deck = s.supply.tech.deck.filter(
			(/** @type {string} */ c) => c !== 'transistors'
		);
	});
	const coin = state.seats[0].resources.coin;
	const next = resolveEffects(
		state,
		1,
		[{ techBenefit: { icon: 'circle', anyRow: true } }],
		random
	);
	assert.equal(next.seats[0].resources.coin, coin + 1);
});

// Political Posturing

test('Political Posturing: the highest open box of an achievement you have not earned, and its VP (03 §2.12)', () => {
	let { state, random } = aaGame((s) => {
		s.achievements['complete-track'] = [2];
		s.achievements['middle-island'] = [2, 3];
	});
	const vp = state.seats[0].vp;
	state = resolveTapestry(state, random, 1, 'political-posturing');
	const [decision] = openDecisions(state);
	assert.equal(decision.kind, 'chooseSlot');
	assert.equal(decision.purpose, 'politicalPosturing');
	// Middle island's two boxes are taken.
	assert.deepEqual(decision.options, ['complete-track', 'topple-two']);
	state = answer(state, random, 1, 'chooseSlot', { slot: 'complete-track' });
	assert.deepEqual(state.achievements['complete-track'], [2, 1]);
	// The small map's second box is 5 VP.
	assert.equal(state.seats[0].vp, vp + 5);
});

// Spymaster, played as a tapestry card

test('Spymaster played: 5 VP, then draw a tapestry card, which may cover it at once (03 §2.5)', () => {
	let { state, random } = aaGame();
	const vp = state.seats[0].vp;
	const hand = state.seats[0].hand.length;
	state = resolveTapestry(state, random, 1, 'spymaster');
	const [decision] = openDecisions(state);
	assert.equal(decision.kind, 'chooseTapestry');
	assert.equal(decision.optional, true);
	assert.equal(decision.era, 2);
	const [drawn] = decision.options;
	assert.equal(state.seats[0].hand.length, hand + 1);
	assert.ok(state.seats[0].hand.includes(drawn));
	assert.equal(state.seats[0].vp, vp + 5);
	const played = answer(state, random, 1, 'chooseTapestry', { card: drawn });
	assert.deepEqual(played.seats[0].incomeMat.tapestry[1].slice(-2), [
		'spymaster',
		drawn,
	]);
	const kept = answer(state, random, 1, 'chooseTapestry', { card: null });
	assert.ok(kept.seats[0].hand.includes(drawn));
});

// Moon Landing

test('Moon Landing: discard 2 territory tiles and 1 tech card for a space tile explored, or invent (03 §2.5)', () => {
	const fill = (/** @type {any} */ s) => {
		s.seats[0].territoryTiles = [5, 9];
		s.seats[0].tech = { bottom: ['paper'], middle: [], top: [] };
		s.supply.tech.deck = s.supply.tech.deck.filter(
			(/** @type {string} */ c) => c !== 'paper'
		);
		s.seats[0].spaceTiles = [];
	};
	const { state, random } = aaGame(fill);
	const played = resolveTapestry(state, random, 1, 'moon-landing');
	const [decision] = openDecisions(played);
	assert.equal(decision.kind, 'chooseTrade');
	const [decline, offer] = DECISIONS.chooseTrade.answers(played, decision);
	assert.deepEqual(decline, { offer: null });
	assert.deepEqual(offer.pay, { territory: [5, 9], tech: ['paper'] });
	const landed = answerDefaults(
		play(played, 1, { decision: decision.id, ...offer }, random),
		random
	);
	const seat = landed.seats[0];
	assert.deepEqual(seat.territoryTiles, []);
	assert.ok(!seat.tech.bottom.includes('paper'));
	assert.ok(landed.supply.tech.discard.includes('paper'));
	assert.equal(seat.exploredSpace.length, 1);
	assert.equal(seat.spaceTiles.length, 0);
	// Declined: invent instead.
	const declined = play(
		played,
		1,
		{ decision: decision.id, ...decline },
		random
	);
	assert.equal(openDecisions(declined)[0]?.kind, 'chooseInvent');
	// Nothing to discard: invent at once.
	const poor = aaGame((s) => {
		fill(s);
		s.seats[0].territoryTiles = [5];
	});
	const invented = resolveTapestry(
		poor.state,
		poor.random,
		1,
		'moon-landing'
	);
	assert.equal(openDecisions(invented)[0]?.kind, 'chooseInvent');
});

// Age of Enlightenment

test("Age of Enlightenment: roll, advance once or twice on that track without benefits, then the final space's benefit only (03 §2.5)", () => {
	const { state } = aaGame((s) => {
		s.seats[0].tracks.science = [0];
		s.seats[0].resources = { coin: 2, worker: 2, food: 2, culture: 2 };
	});
	// A die that always lands on Science, its second face.
	const always = () => 1;
	const rolled = resolveTapestry(state, always, 1, 'age-of-enlightenment');
	const [decision] = openDecisions(rolled);
	assert.equal(decision.kind, 'chooseSlot');
	assert.equal(decision.purpose, 'enlightenment');
	assert.deepEqual(decision.options, [1, 2]);
	const hand = rolled.seats[0].hand.length;
	const twice = answer(rolled, always, 1, 'chooseSlot', { slot: 2 });
	assert.deepEqual(twice.seats[0].tracks.science, [2]);
	// Only space 2's benefit, 1 tapestry card, and not its bonus (pay 1 resource for a House).
	assert.deepEqual(
		events(twice, 'spaceActivated').map((e) => [e.track, e.space]),
		[['science', 2]]
	);
	assert.equal(twice.seats[0].hand.length, hand + 1);
	assert.ok(!openDecisions(twice).some((d) => d.kind === 'chooseBonus'));
	// At space 11, only once, without asking.
	const late = aaGame((s) => {
		s.seats[0].tracks.science = [11];
	});
	const once = resolveTapestry(late.state, always, 1, 'age-of-enlightenment');
	assert.deepEqual(
		events(once, 'tokenMoved').map((e) => [e.from, e.to]),
		[[11, 12]]
	);
});

// Silk Road

test("Silk Road: to the arts track's next tier, then its benefit or its landmark; R128: from the start, to space 1", () => {
	const at = (/** @type {number} */ space) =>
		aaGame((s) => {
			s.seats[0].tracks.arts = [space];
			s.seats[0].resources = { coin: 0, worker: 0, food: 0, culture: 0 };
		});
	// From space 2: space 4, Epic Poetry, with the Clock Tower still there.
	let { state, random } = at(2);
	state = resolveTapestry(state, random, 1, 'silk-road');
	assert.deepEqual(state.seats[0].tracks.arts, [4]);
	const [decision] = openDecisions(state);
	assert.equal(decision.kind, 'chooseSlot');
	assert.equal(decision.purpose, 'silkRoad');
	assert.deepEqual(decision.options, ['benefit', 'landmark']);
	const landmark = answer(state, random, 1, 'chooseSlot', {
		slot: 'landmark',
	});
	assert.ok(!landmark.landmarks.includes('clock-tower'));
	assert.equal(openDecisions(landmark)[0]?.kind, 'choosePlacement');
	assert.equal(events(landmark, 'spaceActivated').length, 0);
	const benefit = answer(state, random, 1, 'chooseSlot', { slot: 'benefit' });
	assert.ok(benefit.landmarks.includes('clock-tower'));
	assert.deepEqual(
		events(benefit, 'spaceActivated').map((e) => [e.track, e.space]),
		[['arts', 4]]
	);
	// R128: from the start, tier I's first space, with no landmark: its benefit, 1 tapestry card.
	const start = at(0);
	const hand = start.state.seats[0].hand.length;
	const one = resolveTapestry(start.state, start.random, 1, 'silk-road');
	assert.deepEqual(one.seats[0].tracks.arts, [1]);
	assert.equal(one.seats[0].hand.length, hand + 1);
	// From tier IV, nothing.
	const top = at(10);
	const none = resolveTapestry(top.state, top.random, 1, 'silk-road');
	assert.deepEqual(none.seats[0].tracks.arts, [10]);
});

// Infrastructure Upgrade

test('Infrastructure Upgrade: keep a card of the landmark deck as a drafted one, or 10 VP with none left (03 §2.5)', () => {
	let { state, random } = aaGame((s) => {
		s.supply.landmarkCards = s.supply.landmarkCards.filter(
			(/** @type {string} */ c) => c !== 'castle'
		);
		s.supply.landmarkCards.push('castle');
		for (const seat of s.seats) {
			if (seat.landmarkCard?.card === 'castle') {
				seat.landmarkCard = null;
			}
		}
	});
	const deck = [...state.supply.landmarkCards];
	assert.ok(deck.length > 1);
	state = resolveTapestry(state, random, 1, 'infrastructure-upgrade');
	const [decision] = openDecisions(state);
	assert.equal(decision.kind, 'chooseLandmarkCard');
	assert.equal(decision.purpose, 'infrastructureUpgrade');
	assert.deepEqual(decision.options, deck);
	state = answer(state, random, 1, 'chooseLandmarkCard', { card: 'castle' });
	assert.deepEqual(state.seats[0].extraLandmarkCards, [
		{ card: 'castle', gained: false },
	]);
	assert.ok(!state.supply.landmarkCards.includes('castle'));
	// Its goal is worked toward like the drafted card's: a taken tier entered on the player's turn.
	state.takenTiers.push({ player: 1, track: 'science', tier: 2 });
	const ops = landmarkCardOps(state, 1);
	assert.ok(
		ops.some(
			(op) => op.kind === 'placeLandmark' && op.landmark === 'castle'
		)
	);
	assert.deepEqual(state.seats[0].extraLandmarkCards, [
		{ card: 'castle', gained: true },
	]);
	// With no card left, 10 VP.
	const empty = aaGame((s) => {
		s.supply.landmarkCards = [];
	});
	const vp = empty.state.seats[0].vp;
	const ten = resolveTapestry(
		empty.state,
		empty.random,
		1,
		'infrastructure-upgrade'
	);
	assert.equal(ten.seats[0].vp, vp + 10);
});

// Migration

test('Migration: explore a hex next to no controlled territory, yours included, then put 2 outposts there; no conquest (03 §2.12)', () => {
	let { state, random } = aaGame((s) => {
		s.seats[0].territoryTiles = [7];
	});
	const controlled = new Set(
		state.seats.flatMap((s) => controlledTerritories(state, s.seat))
	);
	const outposts = state.seats[0].outposts;
	state = resolveTapestry(state, random, 1, 'migration');
	const [decision] = openDecisions(state);
	assert.equal(decision.kind, 'chooseExplore');
	const answers = DECISIONS.chooseExplore.answers(state, decision);
	assert.ok(answers.length > 0);
	for (const { hex } of answers) {
		assert.ok(state.hexes[hex].tile === null, hex);
		assert.ok(
			!hexNeighbours(hex).some((n) => controlled.has(n)),
			`${hex} touches a controlled territory`
		);
	}
	const [first] = answers;
	state = answerDefaults(
		play(state, 1, { decision: decision.id, ...first }, random),
		random
	);
	assert.equal(state.hexes[first.hex].tile, 7);
	assert.deepEqual(
		state.hexes[first.hex].outposts.map((o) => [o.seat, o.toppled]),
		[
			[1, false],
			[1, false],
		]
	);
	assert.equal(state.seats[0].outposts, outposts - 2);
	assert.equal(events(state, 'conquered').length, 0);
	assert.deepEqual(
		events(state, 'outpostPlaced').map((e) => e.card),
		['migration', 'migration']
	);
});

// Plague

test('Plague: a random civilization replaces one of yours for any 1 resource, or is discarded for 10 VP (03 §2.5)', () => {
	const fill = (/** @type {any} */ s) => {
		s.seats[0].civs = ['historians'];
		s.supply.civs = s.supply.civs.filter(
			(/** @type {string} */ c) => c !== 'historians' && c !== 'craftsmen'
		);
		s.supply.civs.unshift('craftsmen');
	};
	const { state, random } = aaGame(fill);
	const played = resolveTapestry(state, random, 1, 'plague');
	assert.deepEqual(
		events(played, 'plagueDrawn').map((e) => [e.player, e.civ]),
		[[1, 'craftsmen']]
	);
	const [decision] = openDecisions(played);
	assert.equal(decision.kind, 'chooseSlot');
	assert.equal(decision.purpose, 'plague');
	assert.deepEqual(decision.options, ['historians', 'discard']);
	const total = (/** @type {any} */ s) =>
		Object.values(s.seats[0].resources).reduce(
			(/** @type {number} */ a, /** @type {number} */ b) => a + b,
			0
		);
	const replaced = answerDefaults(
		answer(played, random, 1, 'chooseSlot', { slot: 'historians' }),
		random
	);
	assert.deepEqual(replaced.seats[0].civs, ['craftsmen']);
	assert.ok(replaced.supply.civDiscard.includes('historians'));
	assert.equal(total(replaced), total(played) + 1);
	const vp = played.seats[0].vp;
	const discarded = answer(played, random, 1, 'chooseSlot', {
		slot: 'discard',
	});
	assert.deepEqual(discarded.seats[0].civs, ['historians']);
	assert.ok(discarded.supply.civDiscard.includes('craftsmen'));
	assert.equal(discarded.seats[0].vp, vp + 10);
});

test("Government Grants' step back offers no bonus, even one the player could pay (03 §2.5)", () => {
	const { state, random } = aaGame((s) => {
		s.seats[0].tracks.science = [3];
		s.seats[0].resources = { coin: 2, worker: 2, food: 2, culture: 2 };
	});
	const back = (/** @type {boolean} */ noBonus) =>
		resolveEffects(
			state,
			1,
			[{ regress: { tracks: ['science'], ...(noBonus && { noBonus }) } }],
			random
		);
	// Science 2's bonus: pay 1 resource for a House.
	assert.ok(
		openDecisions(back(false)).some((d) => d.kind === 'chooseBonus'),
		'offered without noBonus'
	);
	assert.ok(!openDecisions(back(true)).some((d) => d.kind === 'chooseBonus'));
});

// Every card, run to the end

for (const card of TAPESTRY_CARDS.filter((c) => c.expansion === 'aa')) {
	test(`every A&A tapestry card's ability runs to the end: ${card.name}`, () => {
		const { state, random } = aaGame((s) => {
			const [me, ahead] = s.seats;
			for (const track of Object.keys(me.tracks)) {
				me.tracks[track] = [4];
				ahead.tracks[track] = [6];
			}
			me.resources = { coin: 2, worker: 2, food: 2, culture: 2 };
			me.territoryTiles = s.supply.territory.splice(0, 3);
			s.supply.tapestry.deck = s.supply.tapestry.deck.filter(
				(/** @type {string} */ id) => id !== card.id
			);
			me.hand = s.supply.tapestry.deck.splice(0, 2);
		});
		const played = resolveTapestry(state, random, 1, card.id);
		const done = answerDefaults(played, random);
		assert.deepEqual(openDecisions(done), []);
		assert.ok(
			events(done, 'tapestryPlayed').some(
				(e) => e.player === 1 && e.card === card.id
			)
		);
		assert.equal(
			done.seats[0].era?.ability === card.id,
			card.timing === 'era'
		);
	});
}
