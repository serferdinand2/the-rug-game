// Plans & Ploys' civilizations (#33; 03 §1.3): each one's setup, ability and mid-game gain, one section per civilization.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { play } from '../src/lib/engine/play.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import { openDecisions, push } from '../src/lib/engine/stack.js';
import { run, resolveEffects } from '../src/lib/engine/loop.js';
import { cityPlots } from '../src/lib/engine/city.js';
import { groupsOf } from '../src/lib/capital.js';
import { view, controlledTerritories } from '../src/lib/engine/game.js';
import { CIVS } from '../src/lib/engine/civs/index.js';
import { revealed } from '../src/lib/engine/table.js';
import { conquerTargets, loneOpponent } from '../src/lib/engine/map.js';
import { seededRandom } from '../src/lib/engine/random.js';
import { MAPS, hexNeighbours } from '../src/lib/engine/data/maps.js';
import { TERRITORY_TILES } from '../src/lib/engine/data/territory-tiles.js';
import { RED_DIE } from '../src/lib/engine/data/dice.js';
import {
	readyTurn,
	startedGame,
	answer,
	conquestGame,
	placeAll,
	resolveTapestry,
} from './helpers/engine.mjs';
import { ERA_HOOKS } from '../src/lib/engine/eras.js';
import { allOps, checkViews, setupFacts } from './helpers/views.mjs';
import { checkState } from './helpers/invariants.mjs';

const VERSIONS = /** @type {const} */ (['original', 'current']);

const PP = { expansions: ['pp'] };

/**
 * A copy of a started two-player game in which no civilization is held and nothing is pending, so each test gives
 * seat 1 the one it needs. Both seats build on the Mountain mat (mat 1), with nothing on it.
 * @param {{ expansions?: string[] }} [options]
 * @returns {{ state: any, random: any }}
 */
function game(options = PP) {
	const { state: started, random } = startedGame(2, options);
	const state = /** @type {any} */ (structuredClone(started));
	state.pending.length = 0;
	for (const seat of state.seats) {
		seat.capital = { mat: 1, buildings: [], landmarks: [], cubes: [] };
	}
	return { state, random };
}

/**
 * Runs operations pushed onto a copy of the state.
 * @param {any} state - Left unchanged
 * @param {any} random
 * @param {any[]} ops
 */
function pushed(state, random, ops) {
	const next = structuredClone(state);
	push(next, next.pending, ops);
	run(next, random);
	return next;
}

/**
 * The events of one type after a sequence number, without their numbers.
 * @param {any} state
 * @param {string} type
 * @param {number} [since]
 */
const eventsOf = (state, type, since = 0) =>
	state.events
		.filter((/** @type {any} */ e) => e.type === type && e.seq > since)
		.map(({ seq: _seq, ...e }) => e);

/** The open decision of a kind. */
const decisionOf = (/** @type {any} */ state, /** @type {string} */ kind) =>
	openDecisions(state).find((d) => d.kind === kind);

/** The resources a seat holds, all kinds together. */
const held = (/** @type {any} */ seat) =>
	Object.values(seat.resources).reduce(
		(sum, n) => /** @type {number} */ (sum) + /** @type {number} */ (n),
		0
	);

/** The row and column of a plot index. */
const cell = (/** @type {number} */ p) => ({
	row: Math.floor(p / 9),
	col: p % 9,
});

/**
 * Puts income buildings on plots of a seat's capital, without placing them (no reward, no trigger).
 * @param {any} seat
 * @param {number[]} plots
 */
function build(seat, plots) {
	for (const p of plots) {
		seat.capital.buildings.push({ building: 'house', ...cell(p) });
	}
}

/**
 * Seat 1 gains a farm and places it on a plot, answering any resource it gains with its first answer.
 * @param {any} state
 * @param {any} random
 * @param {number} plot
 * @param {number} [player]
 */
function placeFarm(state, random, plot, player = 1) {
	let next = resolveEffects(state, player, [{ building: 'farm' }], random);
	next = answer(next, random, player, 'choosePlacement', cell(plot));
	return next;
}

/**
 * Answers a player's open decision of a kind with its first answer.
 * @param {any} state
 * @param {any} random
 * @param {number} player
 * @param {string} kind
 */
function answerFirst(state, random, player, kind) {
	const decision = /** @type {any} */ (decisionOf(state, kind));
	assert.equal(decision?.player, player, `seat ${player} has no ${kind}`);
	const [first] = DECISIONS[kind].answers(state, decision);
	return play(state, player, { decision: decision.id, ...first }, random);
}

/**
 * A readyTurn() of a two-player Plans & Ploys game, the Nomads and `civ`, whose current player holds `civ`. The first
 * player is drawn at random after decks that grow with each civilization built, so when the other seat was dealt
 * `civ`, the two seats trade civilizations and their civData (what their setups gave stays where it went).
 * @param {string} civ
 * @param {(seat: any, state: any) => void} fill - As readyTurn()'s, after the trade
 * @param {{ version?: 'original' | 'current' }} [options]
 */
function turnHolding(civ, fill, options = {}) {
	return readyTurn(
		2,
		(seat, state) => {
			const holder = state.seats.find(
				(/** @type {any} */ s) => s.civs[0] === civ
			);
			if (holder !== seat) {
				[holder.civs, seat.civs] = [seat.civs, holder.civs];
				[holder.civData, seat.civData] = [seat.civData, holder.civData];
			}
			fill(seat, state);
		},
		{ civs: ['nomads', civ], ...PP, ...options }
	);
}

// The Riverfolk.
// The Mountain mat's impassable plots by district, in reading order: 2, 4, 2, 2, 5, 4, 2, 0 and 1. District 6 holds
// plots 56 and 74, district 8 only plot 70, district 7 none.

test('the Mountain mat has the impassable plots by district these tests rely on', () => {
	const { state } = game();
	const plots = cityPlots(state.seats[0]);
	assert.deepEqual(
		groupsOf('districts').map(
			(group) => group.filter((p) => plots[p] === 'blocked').length
		),
		[2, 4, 2, 2, 5, 4, 2, 0, 1]
	);
});

test('Riverfolk start with 4 VP for each district with at least 2 impassable plots, Architects cubes included (03 §1.3)', () => {
	const { state, random } = game();
	state.seats[0].civs = ['riverfolk'];
	/** The VP seat 1's Riverfolk start with, once `fill` has changed the seat. */
	const start = (/** @type {(seat: any) => void} */ fill = () => {}) => {
		const ready = structuredClone(state);
		fill(ready.seats[0]);
		const next = pushed(ready, random, [
			{
				player: 1,
				kind: 'civSetup',
				civ: 'riverfolk',
				midGame: false,
				origin: 'civ',
			},
		]);
		assert.deepEqual(openDecisions(next), []);
		return next.seats[0].vp - ready.seats[0].vp;
	};
	// Districts 0 to 6.
	assert.equal(start(), 28);
	// A cube beside district 8's one impassable plot makes 2 there.
	assert.equal(
		start((seat) => {
			seat.capital.cubes = [80];
		}),
		32
	);
	// A covered impassable plot no longer shows: district 6 keeps only 1.
	assert.equal(
		start((seat) => build(seat, [56])),
		24
	);
	const next = pushed(state, random, [
		{
			player: 1,
			kind: 'civSetup',
			civ: 'riverfolk',
			midGame: false,
			origin: 'civ',
		},
	]);
	assert.deepEqual(next.seats[0].civData.riverfolk, { cleared: [] });
	assert.equal(next.seats[0].vpSources.civ, 28);
});

test('Riverfolk chosen at setup score their start in both versions, with no adjustment (03 §1.3)', () => {
	for (const version of VERSIONS) {
		const { state } = startedGame(2, {
			civs: ['riverfolk', 'leaders'],
			version,
			...PP,
		});
		const base = startedGame(2, {
			civs: ['leaders', 'nomads'],
			version,
			...PP,
		}).state;
		const seat = state.seats[0];
		const plots = cityPlots(seat);
		const districts = groupsOf('districts').filter(
			(group) => group.filter((p) => plots[p] === 'blocked').length >= 2
		).length;
		assert.ok(districts > 0, version);
		assert.equal(seat.vp - base.seats[0].vp, 4 * districts, version);
		assert.deepEqual(seat.resources, base.seats[0].resources, version);
	}
});

test('Riverfolk may place a building or a landmark on an impassable plot; without them the plot is closed', () => {
	const { state, random } = game();
	/** How many places a gained farm is offered. */
	const spots = (/** @type {any} */ s) => {
		const next = resolveEffects(s, 1, [{ building: 'farm' }], random);
		return DECISIONS.choosePlacement.answers(
			next,
			/** @type {any} */ (decisionOf(next, 'choosePlacement'))
		).length;
	};
	// Plot 9, row 1 and column 0, is impassable.
	assert.equal(spots(state), 59);
	const closed = resolveEffects(state, 1, [{ building: 'farm' }], random);
	assert.throws(() => answer(closed, random, 1, 'choosePlacement', cell(9)), {
		name: 'PlayerError',
		message: "That plot isn't open.",
	});
	const landmark = {
		player: 1,
		kind: 'placeLandmark',
		landmark: 'lighthouse',
	};
	const over = { row: 1, col: 0, rotation: 0 };
	assert.throws(
		() =>
			answer(
				pushed(state, random, [landmark]),
				random,
				1,
				'choosePlacement',
				over
			),
		{ name: 'PlayerError', message: "That plot isn't open." }
	);

	state.seats[0].civs = ['riverfolk'];
	state.seats[0].civData.riverfolk = { cleared: [] };
	assert.equal(spots(state), 81);
	const vp = state.seats[0].vp;
	const placed = placeFarm(state, random, 9);
	assert.equal(cityPlots(placed.seats[0])[9], 'farm');
	// No Terraforming VP, and plot 10 still shows in district 0, so nothing more.
	assert.equal(placed.seats[0].vp, vp);
	assert.deepEqual(openDecisions(placed), []);
	const landed = answer(
		pushed(state, random, [landmark]),
		random,
		1,
		'choosePlacement',
		over
	);
	assert.deepEqual(landed.seats[0].capital.landmarks, [
		{ landmark: 'lighthouse', ...over },
	]);
	assert.equal(landed.seats[0].vp, vp);
});

test("covering a district's last impassable plot gains the Riverfolk 1 resource of their choice, once for each district (03 §1.3)", () => {
	const { state: fresh, random } = game();
	fresh.seats[0].civs = ['riverfolk'];
	fresh.seats[0].civData.riverfolk = { cleared: [] };
	fresh.seats[0].resources = { coin: 0, worker: 0, food: 0, culture: 0 };

	// District 8's only impassable plot.
	let state = placeFarm(fresh, random, 70);
	let since = fresh.seq;
	assert.deepEqual(eventsOf(state, 'districtsCleared', since), [
		{ type: 'districtsCleared', player: 1, districts: [8] },
	]);
	assert.equal(decisionOf(state, 'chooseResource')?.count, 1);
	state = answerFirst(state, random, 1, 'chooseResource');
	assert.equal(held(state.seats[0]), 1);
	assert.deepEqual(state.seats[0].civData.riverfolk.cleared, [8]);

	// The first of district 6's two gives nothing; the second gives 1, and district 8 is not paid again.
	since = state.seq;
	state = placeFarm(state, random, 56);
	assert.deepEqual(eventsOf(state, 'districtsCleared', since), []);
	assert.deepEqual(openDecisions(state), []);
	state = placeFarm(state, random, 74);
	assert.deepEqual(eventsOf(state, 'districtsCleared', since), [
		{ type: 'districtsCleared', player: 1, districts: [6] },
	]);
	state = answerFirst(state, random, 1, 'chooseResource');
	assert.equal(held(state.seats[0]), 2);
	assert.deepEqual(state.seats[0].civData.riverfolk.cleared, [8, 6]);

	// A district without impassable plots gives nothing.
	since = state.seq;
	state = placeFarm(state, random, 67);
	assert.deepEqual(eventsOf(state, 'districtsCleared', since), []);
	assert.equal(held(state.seats[0]), 2);

	// One landmark covering the last plots of districts 1 and 2 gives 2.
	const both = structuredClone(fresh);
	build(both.seats[0], [21, 22, 16]);
	const landing = pushed(both, random, [
		{ player: 1, kind: 'placeLandmark', landmark: 'lighthouse' },
	]);
	const landed = answer(landing, random, 1, 'choosePlacement', {
		row: 1,
		col: 5,
		rotation: 0,
	});
	assert.deepEqual(eventsOf(landed, 'districtsCleared', both.seq), [
		{ type: 'districtsCleared', player: 1, districts: [1, 2] },
	]);
	assert.equal(decisionOf(landed, 'chooseResource')?.count, 2);
});

test('a district already covered when the Riverfolk come in never pays, and an opponent covering theirs pays no one', () => {
	const { state, random } = game();
	const seat = state.seats[0];
	seat.civs = ['riverfolk'];
	build(seat, [70]);
	const set = pushed(state, random, [
		{
			player: 1,
			kind: 'civSetup',
			civ: 'riverfolk',
			midGame: false,
			origin: 'civ',
		},
	]);
	assert.deepEqual(set.seats[0].civData.riverfolk, { cleared: [8] });
	// Covering one of district 0's two leaves it showing, and district 8 is not paid for now.
	const next = placeFarm(set, random, 9);
	assert.deepEqual(eventsOf(next, 'districtsCleared', set.seq), []);
	assert.deepEqual(openDecisions(next), []);

	// Seat 2 covers its own district 8 under Terraforming: its 5 VP only.
	set.seats[1].era = { card: 'terraforming', ability: 'terraforming' };
	const vp = set.seats[1].vp;
	const theirs = placeFarm(set, random, 70, 2);
	assert.equal(theirs.seats[1].vp, vp + 5);
	assert.deepEqual(eventsOf(theirs, 'districtsCleared', set.seq), []);
	assert.deepEqual(openDecisions(theirs), []);
});

test('Terraforming is unchanged by the Riverfolk: its 5 VP alone in a base game, and both rewards for a Riverfolk player', () => {
	for (const options of [{}, PP]) {
		const { state, random } = game(options);
		state.seats[0].era = { card: 'terraforming', ability: 'terraforming' };
		const vp = state.seats[0].vp;
		const placed = placeFarm(state, random, 70);
		assert.equal(placed.seats[0].vp, vp + 5);
		assert.deepEqual(eventsOf(placed, 'districtsCleared', state.seq), []);
		assert.deepEqual(openDecisions(placed), []);
	}
	const { state, random } = game();
	state.seats[0].era = { card: 'terraforming', ability: 'terraforming' };
	state.seats[0].civs = ['riverfolk'];
	state.seats[0].civData.riverfolk = { cleared: [] };
	const vp = state.seats[0].vp;
	const placed = placeFarm(state, random, 70);
	assert.equal(placed.seats[0].vp, vp + 5);
	assert.equal(decisionOf(placed, 'chooseResource')?.count, 1);
});

test('Riverfolk lose 1 VP for each impassable plot still showing on income turn 5, never going below 0 VP', () => {
	const { state, random } = game();
	const seat = state.seats[0];
	seat.civs = ['riverfolk'];
	seat.civData.riverfolk = { cleared: [] };
	// 2 of the Mountain mat's 22 are covered.
	build(seat, [9, 10]);
	/** Seat 1's Riverfolk ability on income turn 5, with `vp` VP. */
	const lost = (/** @type {number} */ vp) => {
		const ready = structuredClone(state);
		ready.seats[0].vp = vp;
		ready.seats[0].vpSources = { tracks: vp };
		const next = pushed(ready, random, [
			{
				player: 1,
				kind: 'civIncome',
				civ: 'riverfolk',
				turn: 5,
				origin: 'civ',
			},
		]);
		return eventsOf(next, 'vpGained', ready.seq).map((e) => [
			e.vp,
			e.total,
			e.source,
		]);
	};
	assert.deepEqual(lost(30), [[-20, 10, 'civ']]);
	assert.deepEqual(lost(7), [[-7, 0, 'civ']]);
	assert.deepEqual(lost(0), []);
	// With every one covered, nothing is lost.
	build(
		seat,
		[
			14, 15, 16, 21, 22, 23, 30, 31, 32, 33, 34, 41, 42, 46, 47, 48, 53,
			56, 70, 74,
		]
	);
	assert.deepEqual(lost(30), []);
});

test('Riverfolk lose their VP in step 1 of income turn 5', () => {
	const ready = turnHolding('riverfolk', (seat, state) => {
		for (const other of state.seats) {
			other.incomeTurns = 4;
		}
		seat.vp = 50;
		seat.vpSources = { tracks: 50 };
	});
	const { player } = ready;
	const since = ready.state.seq;
	const showing = cityPlots(ready.state.seats[player - 1]).filter(
		(kind) => kind === 'blocked'
	).length;
	const state = answer(ready.state, ready.random, player, 'chooseTurn', {
		turn: 'income',
	});
	const events = state.events.filter((e) => e.seq > since);
	const used = events.findIndex(
		(e) => e.type === 'civAbilityUsed' && e.civ === 'riverfolk'
	);
	assert.ok(used !== -1);
	const scored = events.slice(used).find((e) => e.type === 'vpGained');
	assert.deepEqual(
		[scored?.player, scored?.vp, scored?.source],
		[player, -showing, 'civ']
	);
});

test('Riverfolk gained mid-game may be discarded for another civilization; kept, they score their start (R113)', () => {
	const { state, random } = game();
	state.seats[0].civs = ['leaders'];
	state.supply.civs = [
		'riverfolk',
		'merrymakers',
		...state.supply.civs.filter(
			(/** @type {string} */ c) =>
				c !== 'riverfolk' && c !== 'merrymakers'
		),
	];
	const offered = resolveEffects(state, 1, [{ gainCiv: {} }], random);
	const decision = /** @type {any} */ (decisionOf(offered, 'chooseOption'));
	assert.deepEqual(
		[decision.player, decision.purpose, decision.options],
		[
			1,
			'civOffer',
			[[], [{ discardCiv: { civ: 'riverfolk' } }, { gainCiv: {} }]],
		]
	);
	assert.deepEqual(offered.seats[0].civs, ['leaders', 'riverfolk']);
	// No VP before the answer.
	assert.equal(offered.seats[0].vp, state.seats[0].vp);

	const discarded = answer(offered, random, 1, 'chooseOption', { option: 1 });
	assert.deepEqual(discarded.seats[0].civs, ['leaders', 'merrymakers']);
	assert.deepEqual(discarded.supply.civDiscard, ['riverfolk']);
	assert.deepEqual(
		discarded.events
			.filter(
				(/** @type {any} */ e) =>
					e.seq > state.seq && e.type.startsWith('civ')
			)
			.map((/** @type {any} */ e) => [e.type, e.player, e.civ]),
		[
			['civGained', 1, 'riverfolk'],
			['civDiscarded', 1, 'riverfolk'],
			['civGained', 1, 'merrymakers'],
		]
	);
	assert.equal(discarded.seats[0].civData.riverfolk, undefined);
	assert.equal(discarded.seats[0].vp, state.seats[0].vp);

	const kept = answer(offered, random, 1, 'chooseOption', { option: 0 });
	assert.deepEqual(kept.seats[0].civs, ['leaders', 'riverfolk']);
	assert.deepEqual(kept.supply.civDiscard, []);
	assert.equal(kept.seats[0].vp, state.seats[0].vp + 28);
	assert.deepEqual(kept.seats[0].civData.riverfolk, { cleared: [] });
	assert.deepEqual(openDecisions(kept), []);
});

// The Recyclers.

/**
 * Takes tech cards out of the supply (the deck, the display and the discard pile), so a test can put them elsewhere
 * and every card stays in one place.
 * @param {any} state
 * @param {string[]} cards
 * @returns {string[]} The cards
 */
function takeTech(state, cards) {
	const { tech } = state.supply;
	for (const card of cards) {
		for (const list of [tech.deck, tech.faceUp, tech.discard]) {
			const at = list.indexOf(card);
			if (at !== -1) {
				list.splice(at, 1);
			}
		}
	}
	return cards;
}

/**
 * A game in which seat 1 holds the Recyclers and these tech rows, taken out of the supply.
 * @param {{ bottom?: string[], middle?: string[], top?: string[] }} [rows]
 */
function recyclersGame(rows = {}) {
	const { state, random } = game();
	state.seats[0].civs = ['recyclers'];
	const { bottom = [], middle = [], top = [] } = rows;
	takeTech(state, [...bottom, ...middle, ...top]);
	state.seats[0].tech = { bottom, middle, top };
	return { state, random };
}

/** The answers of the open decision of a kind. */
const answersOf = (/** @type {any} */ state, /** @type {string} */ kind) =>
	DECISIONS[kind].answers(
		state,
		/** @type {any} */ (decisionOf(state, kind))
	);

/** The Recyclers' setup, at the start or mid-game. */
const recyclersSetup = (/** @type {boolean} */ midGame) => ({
	player: 1,
	kind: 'civSetup',
	civ: 'recyclers',
	midGame,
	origin: 'civ',
});

test('Recyclers draw 3 tech cards when they come in, keep 1 in the bottom row and discard the other 2 (03 §1.3)', () => {
	const { state, random } = recyclersGame();
	const deck = state.supply.tech.deck.length;
	const drawn = state.supply.tech.deck.slice(0, 3);
	const asked = pushed(state, random, [recyclersSetup(false)]);
	const decision = /** @type {any} */ (decisionOf(asked, 'chooseKeepTech'));
	assert.deepEqual([decision.player, decision.options], [1, drawn]);
	assert.deepEqual(
		answersOf(asked, 'chooseKeepTech'),
		drawn.map((card) => ({ card }))
	);
	assert.equal(asked.supply.tech.deck.length, deck - 3);
	assert.deepEqual(eventsOf(asked, 'techDrawn', state.seq), [
		{ type: 'techDrawn', player: 1, count: 3, secret: { cards: drawn } },
	]);
	// The opponent sees how many were drawn, not which.
	const theirs = /** @type {any} */ (view(asked, 2));
	const shown = allOps(theirs).find((op) => op.kind === 'chooseKeepTech');
	assert.ok(shown && !('options' in shown) && !('answers' in shown));
	assert.ok(
		theirs.events
			.filter((/** @type {any} */ e) => e.type === 'techDrawn')
			.every((/** @type {any} */ e) => !('secret' in e))
	);
	assert.throws(
		() => answer(asked, random, 1, 'chooseKeepTech', { card: 'bakery' }),
		{ name: 'PlayerError', message: 'Keep one of the tech cards you drew.' }
	);

	const kept = answer(asked, random, 1, 'chooseKeepTech', {
		card: drawn[1],
	});
	assert.deepEqual(kept.seats[0].tech, {
		bottom: [drawn[1]],
		middle: [],
		top: [],
	});
	assert.deepEqual(kept.supply.tech.discard, [drawn[0], drawn[2]]);
	assert.deepEqual(
		[
			...eventsOf(kept, 'techInvented', asked.seq),
			...eventsOf(kept, 'cardsDiscarded', asked.seq),
		],
		[
			{ type: 'techInvented', player: 1, card: drawn[1], from: 'deck' },
			{
				type: 'cardsDiscarded',
				player: 1,
				deck: 'tech',
				cards: [drawn[0], drawn[2]],
			},
		]
	);
	assert.deepEqual(openDecisions(kept), []);
});

test('the card the Recyclers keep is a tech card gained, so what inventing triggers follows (Academia)', () => {
	const { state, random } = recyclersGame();
	state.seats[0].era = { card: 'academia', ability: 'academia' };
	const asked = pushed(state, random, [recyclersSetup(false)]);
	const [first] = answersOf(asked, 'chooseKeepTech');
	const kept = answer(asked, random, 1, 'chooseKeepTech', first);
	assert.equal(kept.seats[0].vp, state.seats[0].vp + 3);
});

test('Recyclers keep what they can draw: a lone card without asking, and nothing from an empty supply', () => {
	const { state, random } = recyclersGame();
	const { tech } = state.supply;
	const last = tech.deck[tech.deck.length - 1];
	tech.deck = [last];
	tech.discard = [];
	const lone = pushed(state, random, [recyclersSetup(false)]);
	assert.deepEqual(lone.seats[0].tech.bottom, [last]);
	assert.deepEqual(openDecisions(lone), []);
	assert.deepEqual(eventsOf(lone, 'techDrawn', state.seq), [
		{ type: 'techDrawn', player: 1, count: 1, secret: { cards: [last] } },
	]);

	tech.deck = [];
	const none = pushed(state, random, [recyclersSetup(false)]);
	assert.deepEqual(none.seats[0].tech.bottom, []);
	assert.deepEqual(openDecisions(none), []);
	assert.deepEqual(eventsOf(none, 'techDrawn', state.seq), [
		{ type: 'techDrawn', player: 1, count: 0, secret: { cards: [] } },
	]);
});

test('Recyclers gained mid-game draw 3 and keep 1, and upgrade nothing (R113, R34)', () => {
	const { state, random } = game();
	state.seats[0].civs = ['leaders'];
	state.supply.civs = [
		'recyclers',
		...state.supply.civs.filter(
			(/** @type {string} */ c) => c !== 'recyclers'
		),
	];
	const drawn = state.supply.tech.deck.slice(0, 3);
	const gained = resolveEffects(state, 1, [{ gainCiv: {} }], random);
	assert.deepEqual(gained.seats[0].civs, ['leaders', 'recyclers']);
	assert.deepEqual(decisionOf(gained, 'chooseKeepTech')?.options, drawn);
	const kept = answer(gained, random, 1, 'chooseKeepTech', {
		card: drawn[2],
	});
	assert.deepEqual(kept.seats[0].tech, {
		bottom: [drawn[2]],
		middle: [],
		top: [],
	});
	assert.deepEqual(openDecisions(kept), []);
});

test('Recyclers chosen at setup also upgrade a tech card under the current rules only (R34)', () => {
	for (const version of VERSIONS) {
		const { state } = startedGame(2, {
			civs: ['recyclers', 'leaders'],
			version,
			...PP,
		});
		const { bottom, middle, top } = state.seats[0].tech;
		assert.deepEqual(
			[bottom.length, middle.length, top.length],
			version === 'current' ? [0, 1, 0] : [1, 0, 0],
			version
		);
		assert.equal(state.supply.tech.discard.length, 2, version);
	}
});

test('Recyclers may upgrade a tech card at the start of income turns 2 to 5, as well as the usual upgrade (03 §1.3)', () => {
	const ready = turnHolding(
		'recyclers',
		(seat, state) => {
			seat.tech.bottom.push(...takeTech(state, ['bakery', 'barn']));
		},
		{ version: 'original' }
	);
	const { player } = ready;
	const { bottom } = ready.state.seats[player - 1].tech;
	const since = ready.state.seq;
	let state = answer(ready.state, ready.random, player, 'chooseTurn', {
		turn: 'income',
	});
	/** @type {string[]} */
	const upgraded = [];
	for (;;) {
		const [open] = openDecisions(state);
		if (!open || open.kind === 'chooseTurn') {
			break;
		}
		const answers = DECISIONS[open.kind].answers(state, open);
		const pick =
			open.kind === 'chooseUpgrade'
				? answers.find((a) => a.card !== null)
				: answers[0];
		if (open.kind === 'chooseUpgrade') {
			upgraded.push(pick?.card);
		}
		state = play(
			state,
			/** @type {number} */ (open.player),
			{ decision: open.id, ...pick },
			ready.random
		);
	}
	assert.deepEqual(upgraded, bottom.slice(0, 2));
	const events = state.events.filter((e) => e.seq > since);
	const used = events.findIndex(
		(e) => e.type === 'civAbilityUsed' && e.civ === 'recyclers'
	);
	const first = events.findIndex((e) => e.type === 'techUpgraded');
	assert.ok(used !== -1 && used < first);

	// Declined, the ability upgrades nothing.
	const { state: fresh, random } = recyclersGame({ bottom: ['bakery'] });
	const asked = pushed(fresh, random, [
		{
			player: 1,
			kind: 'civIncome',
			civ: 'recyclers',
			turn: 2,
			origin: 'civ',
		},
	]);
	assert.deepEqual(answersOf(asked, 'chooseUpgrade'), [
		{ card: null },
		{ card: 'bakery' },
	]);
	const declined = answer(asked, random, 1, 'chooseUpgrade', { card: null });
	assert.deepEqual(declined.seats[0].tech.bottom, ['bakery']);
});

test('a Recyclers upgrade may instead move a top-row card back to the bottom row for 5 VP, in an income upgrade and in a track upgrade (03 §1.3)', () => {
	const { state, random } = recyclersGame({
		bottom: ['bakery'],
		top: ['com-tower'],
	});
	const vp = state.seats[0].vp;
	/** Recycles the Com Tower from an open upgrade, and checks what follows. */
	const recycle = (/** @type {any} */ asked) => {
		const next = answer(asked, random, 1, 'chooseUpgrade', {
			card: 'com-tower',
		});
		assert.deepEqual(next.seats[0].tech, {
			bottom: ['bakery', 'com-tower'],
			middle: [],
			top: [],
		});
		assert.deepEqual(eventsOf(next, 'techRecycled', asked.seq), [
			{ type: 'techRecycled', player: 1, card: 'com-tower' },
		]);
		assert.deepEqual(eventsOf(next, 'techUpgraded', asked.seq), []);
		assert.deepEqual(
			eventsOf(next, 'vpGained', asked.seq).map((e) => [e.vp, e.source]),
			[[5, 'civ']]
		);
		assert.equal(next.seats[0].vp, vp + 5);
		assert.deepEqual(openDecisions(next), []);
	};

	// The income turn's upgrade, which may be declined.
	const income = resolveEffects(
		state,
		1,
		[{ upgrade: { optional: true } }],
		random
	);
	assert.deepEqual(answersOf(income, 'chooseUpgrade'), [
		{ card: null },
		{ card: 'bakery' },
		{ card: 'com-tower' },
	]);
	recycle(income);

	// A track's upgrade (Electronics, Nanotechnology) must upgrade, or recycle instead: even a lone bottom card asks.
	const track = resolveEffects(state, 1, [{ upgrade: {} }], random);
	assert.deepEqual(answersOf(track, 'chooseUpgrade'), [
		{ card: 'bakery' },
		{ card: 'com-tower' },
	]);
	recycle(track);

	// With nothing else to upgrade, the recycle is a choice: it may be declined.
	const { state: alone } = recyclersGame({ top: ['com-tower'] });
	const only = resolveEffects(alone, 1, [{ upgrade: {} }], random);
	assert.deepEqual(answersOf(only, 'chooseUpgrade'), [
		{ card: null },
		{ card: 'com-tower' },
	]);
	const declined = answer(only, random, 1, 'chooseUpgrade', { card: null });
	assert.deepEqual(declined.seats[0].tech.top, ['com-tower']);
	assert.equal(declined.seats[0].vp, alone.seats[0].vp);

	// Without the Recyclers, the top row stays: a lone bottom card upgrades without asking, and none is no upgrade.
	const plain = structuredClone(state);
	plain.seats[0].civs = ['leaders'];
	const upgraded = resolveEffects(plain, 1, [{ upgrade: {} }], random);
	assert.deepEqual(upgraded.seats[0].tech, {
		bottom: [],
		middle: ['bakery'],
		top: ['com-tower'],
	});
	assert.deepEqual(openDecisions(upgraded), []);
	const lonePlain = structuredClone(alone);
	lonePlain.seats[0].civs = [];
	const none = resolveEffects(lonePlain, 1, [{ upgrade: {} }], random);
	assert.deepEqual(openDecisions(none), []);
	assert.deepEqual(eventsOf(none, 'noUpgrade', lonePlain.seq), [
		{ type: 'noUpgrade', player: 1 },
	]);
});

test('a recycle is not an upgrade: Golden Age pays nothing for it (03 §1.3)', () => {
	const { state, random } = recyclersGame({
		bottom: ['bakery'],
		top: ['com-tower'],
	});
	state.seats[0].era = { card: 'golden-age', ability: 'golden-age' };
	const asked = resolveEffects(state, 1, [{ upgrade: {} }], random);
	const recycled = answer(asked, random, 1, 'chooseUpgrade', {
		card: 'com-tower',
	});
	assert.equal(recycled.seats[0].vp, state.seats[0].vp + 5);
	// A real upgrade gains Bakery's 4 VP and Golden Age's 3.
	const upgraded = answer(asked, random, 1, 'chooseUpgrade', {
		card: 'bakery',
	});
	assert.equal(upgraded.seats[0].vp, state.seats[0].vp + 7);
});

test("an Inventors token's upgrade of a Recyclers card never recycles, and a recycled card keeps its token (03 §1.8)", () => {
	const { state, random } = recyclersGame({
		bottom: ['bakery'],
		top: ['com-tower'],
	});
	state.seats[1].civs = ['inventors'];
	state.seats[1].civData.inventors = { tokens: 4, cards: [] };
	// The token goes on a bottom- or middle-row card, never a top-row one, and upgrades it at once.
	const asked = pushed(state, random, [
		{
			player: 2,
			kind: 'civIncome',
			civ: 'inventors',
			turn: 2,
			origin: 'civ',
		},
	]);
	assert.deepEqual(answersOf(asked, 'chooseSlot'), [
		{ slot: null },
		{ slot: { player: 1, card: 'bakery' } },
	]);
	const marked = answer(asked, random, 2, 'chooseSlot', {
		slot: { player: 1, card: 'bakery' },
	});
	assert.deepEqual(marked.seats[0].tech, {
		bottom: [],
		middle: ['bakery'],
		top: ['com-tower'],
	});
	assert.deepEqual(eventsOf(marked, 'techRecycled', state.seq), []);
	assert.equal(decisionOf(marked, 'chooseUpgrade'), undefined);

	// A marked card stays in a top row only when the Inventors had finished as it got there, or they would have taken
	// it. The Recyclers' own upgrade sends it down, its token with it.
	const late = structuredClone(state);
	late.seats[1].finished = true;
	late.seats[1].civData.inventors.cards = ['com-tower'];
	const own = resolveEffects(late, 1, [{ upgrade: {} }], random);
	const recycled = answer(own, random, 1, 'chooseUpgrade', {
		card: 'com-tower',
	});
	assert.deepEqual(recycled.seats[0].tech.bottom, ['bakery', 'com-tower']);
	assert.deepEqual(recycled.seats[1].civData.inventors.cards, ['com-tower']);
});

test('an upgrade of the card just invented (Steam Tycoon, Engineering) lets the Recyclers recycle a top-row card instead (03 §1.3)', () => {
	const { state, random } = recyclersGame({
		bottom: ['barn'],
		top: ['com-tower'],
	});
	const { tech } = state.supply;
	tech.deck.push(...tech.faceUp.splice(0));
	tech.faceUp = takeTech(state, ['bakery', 'calendar', 'clocks']);
	/**
	 * Checks the question an upgrade of the Bakery just invented asks, then both answers.
	 * @param {any} invented - The state with the question open
	 */
	const offered = (invented) => {
		const decision = /** @type {any} */ (
			decisionOf(invented, 'chooseUpgrade')
		);
		assert.deepEqual(
			[decision?.player, decision?.only, decision?.optional],
			[1, 'bakery', false]
		);
		// Only the card just invented, or a recycle: not the Barn.
		assert.deepEqual(answersOf(invented, 'chooseUpgrade'), [
			{ card: 'bakery' },
			{ card: 'com-tower' },
		]);
		assert.throws(
			() =>
				answer(invented, random, 1, 'chooseUpgrade', { card: 'barn' }),
			{ name: 'PlayerError', message: "You can't upgrade that card." }
		);
		const vp = invented.seats[0].vp;
		// Upgraded: the Bakery goes up and pays its 4 VP.
		const up = answer(invented, random, 1, 'chooseUpgrade', {
			card: 'bakery',
		});
		assert.deepEqual(up.seats[0].tech, {
			bottom: ['barn'],
			middle: ['bakery'],
			top: ['com-tower'],
		});
		assert.equal(up.seats[0].vp, vp + 4);
		// Recycled instead: the Bakery stays down, and the Com Tower joins it for 5 VP.
		const down = answer(invented, random, 1, 'chooseUpgrade', {
			card: 'com-tower',
		});
		assert.deepEqual(down.seats[0].tech, {
			bottom: ['barn', 'bakery', 'com-tower'],
			middle: [],
			top: [],
		});
		assert.equal(down.seats[0].vp, vp + 5);
		assert.deepEqual(eventsOf(down, 'techRecycled', invented.seq), [
			{ type: 'techRecycled', player: 1, card: 'com-tower' },
		]);
		assert.deepEqual(eventsOf(down, 'techUpgraded', invented.seq), []);
	};

	// Steam Tycoon: a face-up card, upgraded at once.
	const played = resolveTapestry(state, random, 1, 'steam-tycoon');
	offered(answer(played, random, 1, 'chooseInvent', { card: 'bakery' }));

	// Engineering: each card invented goes up at once.
	const engineering = structuredClone(state);
	engineering.seats[0].era = { card: 'engineering', ability: 'engineering' };
	const inventing = resolveEffects(engineering, 1, [{ invent: {} }], random);
	offered(answer(inventing, random, 1, 'chooseInvent', { card: 'bakery' }));

	// With an empty top row, or without the Recyclers, the card goes up at once, as before.
	for (const fill of [
		(/** @type {any} */ seat) => {
			seat.tech.top = [];
		},
		(/** @type {any} */ seat) => {
			seat.civs = [];
		},
	]) {
		const plain = structuredClone(state);
		fill(plain.seats[0]);
		const next = answer(
			resolveTapestry(plain, random, 1, 'steam-tycoon'),
			random,
			1,
			'chooseInvent',
			{ card: 'bakery' }
		);
		assert.deepEqual(next.seats[0].tech.middle, ['bakery']);
		assert.equal(decisionOf(next, 'chooseUpgrade'), undefined);
	}
});

test('Recyclers may invent a card from the tech discard pile, but not when only the deck or only the face-up cards may be taken (03 §1.3)', () => {
	const { state, random } = recyclersGame();
	state.supply.tech.discard = takeTech(state, ['bakery', 'barn']);
	const faceUp = [...state.supply.tech.faceUp];
	const asked = resolveEffects(state, 1, [{ invent: {} }], random);
	assert.deepEqual(answersOf(asked, 'chooseInvent'), [
		...faceUp.map((card) => ({ card })),
		{ card: 'deck' },
		{ card: 'bakery', from: 'discard' },
		{ card: 'barn', from: 'discard' },
	]);
	// A card is named with the pile it comes from.
	assert.throws(
		() => answer(asked, random, 1, 'chooseInvent', { card: 'barn' }),
		{ name: 'PlayerError', message: "You can't invent that card." }
	);
	assert.throws(
		() =>
			answer(asked, random, 1, 'chooseInvent', {
				card: faceUp[0],
				from: 'discard',
			}),
		{ name: 'PlayerError', message: "You can't invent that card." }
	);
	const taken = answer(asked, random, 1, 'chooseInvent', {
		card: 'barn',
		from: 'discard',
	});
	assert.deepEqual(taken.seats[0].tech.bottom, ['barn']);
	assert.deepEqual(taken.supply.tech.discard, ['bakery']);
	assert.deepEqual(taken.supply.tech.faceUp, faceUp);
	assert.deepEqual(eventsOf(taken, 'techInvented', asked.seq), [
		{ type: 'techInvented', player: 1, card: 'barn', from: 'discard' },
	]);

	// The refresh still comes last.
	const refresh = resolveEffects(
		state,
		1,
		[{ invent: { refresh: true } }],
		random
	);
	assert.deepEqual(answersOf(refresh, 'chooseInvent').slice(-3), [
		{ card: 'bakery', from: 'discard' },
		{ card: 'barn', from: 'discard' },
		{ refresh: true },
	]);

	// Steam Tycoon's deck alone: drawn without asking. The face-up cards alone: no discard pile.
	const top = state.supply.tech.deck[0];
	const deckOnly = resolveEffects(
		state,
		1,
		[{ invent: { deckOnly: true } }],
		random
	);
	assert.deepEqual(deckOnly.seats[0].tech.bottom, [top]);
	assert.deepEqual(openDecisions(deckOnly), []);
	const faceUpOnly = resolveEffects(
		state,
		1,
		[{ invent: { faceUpOnly: true } }],
		random
	);
	assert.deepEqual(
		answersOf(faceUpOnly, 'chooseInvent'),
		faceUp.map((card) => ({ card }))
	);

	// Without the Recyclers, the discard pile is never offered.
	const plain = structuredClone(state);
	plain.seats[0].civs = [];
	assert.deepEqual(
		answersOf(
			resolveEffects(plain, 1, [{ invent: {} }], random),
			'chooseInvent'
		),
		[...faceUp.map((card) => ({ card })), { card: 'deck' }]
	);
});

// The Aliens.

/**
 * Takes space tiles out of the stack, so a test can put them elsewhere and every tile stays in one place.
 * @param {any} state
 * @param {number[]} tiles
 * @returns {number[]} The tiles
 */
function takeSpace(state, tiles) {
	state.supply.space = state.supply.space.filter(
		(/** @type {number} */ t) => !tiles.includes(t)
	);
	return tiles;
}

/**
 * A game in which seat 1 holds the Aliens, these space tiles in their supply and `onMat` on their mat, all taken out
 * of the stack, and these resources.
 * @param {number[]} tiles
 * @param {number | null} onMat
 * @param {Record<string, number>} [resources]
 */
function aliensGame(tiles, onMat, resources = { coin: 1, food: 1 }) {
	const { state, random } = game();
	const seat = state.seats[0];
	seat.civs = ['aliens'];
	takeSpace(state, [...tiles, ...(onMat === null ? [] : [onMat])]);
	seat.spaceTiles = [...tiles];
	seat.civData.aliens = { tile: onMat };
	seat.resources = { coin: 0, worker: 0, food: 0, culture: 0, ...resources };
	return { state, random };
}

/** The Aliens' ability on an income turn. */
const aliensIncome = (/** @type {number} */ turn) => ({
	player: 1,
	kind: 'civIncome',
	civ: 'aliens',
	turn,
	origin: 'civ',
});

test('Aliens gain 4 space tiles into their supply when they come in, at setup or mid-game, with nothing on their mat (03 §1.3, R113)', () => {
	for (const version of VERSIONS) {
		const { state } = startedGame(2, {
			civs: ['aliens', 'leaders'],
			version,
			...PP,
		});
		const [seat, other] = /** @type {any[]} */ (state.seats);
		assert.equal(seat.spaceTiles.length, 4, version);
		assert.deepEqual(seat.exploredSpace, [], version);
		assert.deepEqual(seat.civData.aliens, { tile: null }, version);
		assert.deepEqual(other.spaceTiles, [], version);
		assert.ok(
			seat.spaceTiles.every(
				(/** @type {number} */ t) => !state.supply.space.includes(t)
			),
			version
		);
	}

	const { state, random } = game();
	state.seats[0].civs = ['leaders'];
	state.supply.civs = [
		'aliens',
		...state.supply.civs.filter(
			(/** @type {string} */ c) => c !== 'aliens'
		),
	];
	const top = state.supply.space.slice(0, 4);
	const gained = resolveEffects(state, 1, [{ gainCiv: {} }], random);
	assert.deepEqual(gained.seats[0].civs, ['leaders', 'aliens']);
	assert.deepEqual(gained.seats[0].spaceTiles, top);
	assert.deepEqual(gained.seats[0].civData.aliens, { tile: null });
	assert.deepEqual(openDecisions(gained), []);
});

test('Aliens explore a space tile from their supply onto their mat: it gives its benefit, but is not explored beside the income mat (03 §1.3)', () => {
	const { state, random } = aliensGame([13], null);
	const since = state.seq;
	const asked = pushed(state, random, [aliensIncome(2)]);
	// Nothing was on the mat, so nothing is discarded and exploring costs nothing.
	assert.deepEqual(eventsOf(asked, 'tilesDiscarded', since), []);
	const decision = /** @type {any} */ (decisionOf(asked, 'chooseOption'));
	assert.deepEqual(
		[decision.player, decision.purpose, decision.options],
		[
			1,
			'aliens',
			[[{ exploreSpace: { civ: 'aliens' } }], [{ gain: { any: 1 } }]],
		]
	);

	// A lone tile is explored without asking which.
	const explored = answer(asked, random, 1, 'chooseOption', { option: 0 });
	const seat = explored.seats[0];
	assert.deepEqual(seat.civData.aliens, { tile: 13 });
	assert.deepEqual(seat.spaceTiles, []);
	assert.deepEqual(seat.exploredSpace, []);
	assert.equal(seat.vp, state.seats[0].vp + 13);
	assert.deepEqual(eventsOf(explored, 'spaceExplored', since), [
		{ type: 'spaceExplored', player: 1, tile: 13, civ: 'aliens' },
	]);
	assert.deepEqual(seat.resources, state.seats[0].resources);
	assert.deepEqual(openDecisions(explored), []);

	// Or a resource of their choice instead, the tile staying in the supply.
	const gained = answer(asked, random, 1, 'chooseOption', { option: 1 });
	const choice = answer(gained, random, 1, 'chooseResource', {
		resources: { culture: 1 },
	});
	assert.equal(choice.seats[0].resources.culture, 1);
	assert.deepEqual(choice.seats[0].spaceTiles, [13]);
	assert.deepEqual(choice.seats[0].civData.aliens, { tile: null });
	assert.deepEqual(openDecisions(choice), []);
});

test('Aliens first discard the tile on their mat, out of the game; then exploring onto it costs 1 resource of their choice, paid before the tile is chosen (03 §1.3)', () => {
	const { state, random } = aliensGame([13, 5], 7);
	const since = state.seq;
	const asked = pushed(state, random, [aliensIncome(3)]);
	assert.deepEqual(asked.supply.spaceDiscard, [7]);
	assert.deepEqual(asked.seats[0].civData.aliens, { tile: null });
	assert.deepEqual(eventsOf(asked, 'tilesDiscarded', since), [
		{
			type: 'tilesDiscarded',
			player: 1,
			stack: 'space',
			tiles: [7],
			civ: 'aliens',
		},
	]);
	const decision = /** @type {any} */ (decisionOf(asked, 'chooseOption'));
	assert.deepEqual(decision.options, [
		[{ pay: { any: 1 } }, { exploreSpace: { civ: 'aliens' } }],
		[{ gain: { any: 1 } }],
	]);

	// The resource first: coin or food, the two they hold.
	const paying = answer(asked, random, 1, 'chooseOption', { option: 0 });
	assert.deepEqual(answersOf(paying, 'chooseSlot'), [
		{ slot: 'coin' },
		{ slot: 'food' },
	]);
	assert.equal(decisionOf(paying, 'chooseSpaceTile'), undefined);
	const paid = answer(paying, random, 1, 'chooseSlot', { slot: 'food' });
	assert.deepEqual(eventsOf(paid, 'resourcesPaid', since), [
		{ type: 'resourcesPaid', player: 1, paid: { food: 1 } },
	]);
	assert.deepEqual(answersOf(paid, 'chooseSpaceTile'), [
		{ tile: 13 },
		{ tile: 5 },
	]);
	const explored = answer(paid, random, 1, 'chooseSpaceTile', { tile: 5 });
	const seat = explored.seats[0];
	assert.deepEqual(seat.civData.aliens, { tile: 5 });
	assert.deepEqual(seat.spaceTiles, [13]);
	assert.deepEqual(seat.exploredSpace, []);
	// Tile 5: 1 coin, 1 worker and 8 VP.
	assert.deepEqual(seat.resources, {
		coin: 2,
		worker: 1,
		food: 0,
		culture: 0,
	});
	assert.equal(seat.vp, state.seats[0].vp + 8);
	assert.deepEqual(explored.supply.spaceDiscard, [7]);
	assert.deepEqual(openDecisions(explored), []);

	// With only one kind of resource, it is paid without asking.
	const coin = aliensGame([13], 7, { coin: 2 });
	const one = answer(
		pushed(coin.state, coin.random, [aliensIncome(3)]),
		coin.random,
		1,
		'chooseOption',
		{ option: 0 }
	);
	assert.equal(one.seats[0].resources.coin, 1);
	assert.deepEqual(one.seats[0].civData.aliens, { tile: 13 });
	assert.deepEqual(openDecisions(one), []);
});

test('Aliens may explore only with a space tile in their supply, and after a discard only with a resource to pay; otherwise they gain a resource (03 §1.3)', () => {
	/** What seat 1's Aliens are offered on an income turn: the options, or 'resource' for a resource gained without a choice. */
	const offered = (
		/** @type {number[]} */ tiles,
		/** @type {number | null} */ onMat,
		/** @type {Record<string, number>} */ resources
	) => {
		const { state, random } = aliensGame(tiles, onMat, resources);
		const next = pushed(state, random, [aliensIncome(4)]);
		const option = /** @type {any} */ (decisionOf(next, 'chooseOption'));
		if (option) {
			return option.options;
		}
		const resource = /** @type {any} */ (
			decisionOf(next, 'chooseResource')
		);
		assert.deepEqual(
			[resource?.player, resource?.count],
			[1, 1],
			'no choice and no resource'
		);
		return 'resource';
	};
	// Nothing was discarded: exploring is free, so no resource is needed.
	assert.deepEqual(offered([13], null, {}), [
		[{ exploreSpace: { civ: 'aliens' } }],
		[{ gain: { any: 1 } }],
	]);
	// A tile was discarded and nothing can pay for the next one.
	assert.equal(offered([13], 7, {}), 'resource');
	// No space tile to explore.
	assert.equal(offered([], null, { coin: 3 }), 'resource');
	assert.equal(offered([], 7, { coin: 3 }), 'resource');
});

test('an ongoing space tile on the Aliens mat gains 5 VP for each advance on its track, until the next income turn discards it (03 §1.3, §1.5)', () => {
	// Tile 16: 5 VP whenever its player advances on Technology.
	const { state, random } = aliensGame([], 16, { coin: 8, culture: 8 });
	/** The VP seat 1 gains from space tiles for one advance on a track, each open decision answered with its first answer. */
	const tileVp = (/** @type {any} */ from, /** @type {string} */ track) => {
		let next = resolveEffects(
			from,
			1,
			[{ advance: { tracks: [track], noBenefit: true } }],
			random
		);
		for (;;) {
			const [open] = openDecisions(next);
			if (!open) {
				break;
			}
			next = answerFirst(next, random, 1, open.kind);
		}
		return eventsOf(next, 'vpGained', from.seq)
			.filter((e) => e.source === 'map')
			.map((e) => e.vp);
	};
	assert.deepEqual(tileVp(state, 'technology'), [5]);
	assert.deepEqual(tileVp(state, 'science'), []);

	// The next income turn discards it; it no longer counts.
	let discarded = pushed(state, random, [aliensIncome(3)]);
	assert.deepEqual(discarded.supply.spaceDiscard, [16]);
	discarded = answer(discarded, random, 1, 'chooseResource', {
		resources: { food: 1 },
	});
	assert.deepEqual(openDecisions(discarded), []);
	assert.deepEqual(tileVp(discarded, 'technology'), []);
});

test('the state checks count the space tiles discarded and the one on the Aliens mat', () => {
	const { state } = startedGame(2, { civs: ['aliens', 'leaders'], ...PP });
	const seat = /** @type {any} */ (state.seats[0]);
	seat.civData.aliens.tile = seat.spaceTiles.pop();
	state.supply.spaceDiscard.push(
		/** @type {number} */ (state.supply.space.shift())
	);
	checkState(state);

	const lost = /** @type {any} */ (structuredClone(state));
	lost.seats[0].civData.aliens.tile = null;
	assert.throws(() => checkState(lost), /space tiles/);
	const twice = structuredClone(state);
	twice.supply.space.push(twice.supply.spaceDiscard[0]);
	assert.throws(() => checkState(twice), /space tiles/);
});

test('Aliens use their ability in step 1 of income turns 2 to 5: the tile on their mat goes, then they choose', () => {
	const ready = turnHolding('aliens', (seat, state) => {
		// Dealt to the other seat, the Aliens' space tiles stayed there when the civilizations were traded.
		for (const other of state.seats) {
			if (other !== seat) {
				seat.spaceTiles.push(...other.spaceTiles.splice(0));
			}
		}
		seat.civData.aliens.tile = seat.spaceTiles.shift();
		seat.resources.coin = 1;
	});
	const { player } = ready;
	const tile = /** @type {any} */ (ready.state.seats[player - 1]).civData
		.aliens.tile;
	const since = ready.state.seq;
	const state = answer(ready.state, ready.random, player, 'chooseTurn', {
		turn: 'income',
	});
	const events = state.events.filter((e) => e.seq > since);
	const used = events.findIndex(
		(e) => e.type === 'civAbilityUsed' && e.civ === 'aliens'
	);
	const gone = events.findIndex(
		(e) => e.type === 'tilesDiscarded' && e.stack === 'space'
	);
	assert.ok(used !== -1 && used < gone);
	assert.deepEqual(state.supply.spaceDiscard, [tile]);
	const decision = /** @type {any} */ (decisionOf(state, 'chooseOption'));
	assert.deepEqual([decision?.player, decision?.purpose], [player, 'aliens']);
});

// The Treasure Hunters.

/** Their id, also their civData key. */
const TH = 'treasure-hunters';

/**
 * A random whose first rolls follow a script, each checked against the die it rolls; later calls are seeded.
 * @param {...number} faces
 */
function dice(...faces) {
	const base = seededRandom(5);
	return (/** @type {number} */ n) => {
		const face = faces.shift();
		if (face === undefined) {
			return base(n);
		}
		assert.ok(face < n, `face ${face} on a die of ${n}`);
		return face;
	};
}

/**
 * A game in which seat 1 holds the Treasure Hunters with these treasures used and a token for each other one, and
 * their only item is an outpost on `home`. Only the hexes `tiles` names are explored: each with a territory tile's
 * number (taken out of the stack) or a printed territory's.
 * @param {Record<string, number>} tiles
 * @param {{ home?: string, used?: string[], tokens?: number }} [options]
 */
function treasureGame(tiles, { home = '-2_-2', used = [], tokens } = {}) {
	const { state, random } = game();
	const seat = state.seats[0];
	seat.civs = [TH];
	seat.civData[TH] = { tokens: tokens ?? 4 - used.length, used: [...used] };
	for (const [key, hex] of Object.entries(state.hexes)) {
		hex.outposts = [];
		hex.tokens = [];
		hex.tile = Object.hasOwn(tiles, key) ? tiles[key] : null;
		hex.orient = 0;
	}
	state.supply.territory = state.supply.territory.filter(
		(/** @type {number} */ t) => !Object.values(tiles).includes(t)
	);
	state.hexes[home].outposts = [{ seat: 1, toppled: false }];
	return { state, random };
}

/** A printed territory of the small map, by hex. */
const printed = (/** @type {string} */ hex) => MAPS.small.printed[hex].tile;

/** The Treasure Hunters' ability on an income turn. */
const treasureIncome = (/** @type {number} */ turn) => ({
	player: 1,
	kind: 'civIncome',
	civ: TH,
	turn,
	origin: 'civ',
});

/**
 * Seat 1's income ability, then the territory picked.
 * @param {any} state
 * @param {any} random
 * @param {string} hex
 */
function claim(state, random, hex) {
	const asked = pushed(state, random, [treasureIncome(2)]);
	return answer(asked, random, 1, 'chooseHex', { hex });
}

test('Treasure Hunters put 4 tokens on their mat and gain 2 territory tiles when they come in, at setup or mid-game (03 §1.3, R113)', () => {
	for (const version of VERSIONS) {
		const { state } = startedGame(2, {
			civs: [TH, 'leaders'],
			version,
			...PP,
		});
		const base = startedGame(2, {
			civs: ['leaders', 'nomads'],
			version,
			...PP,
		}).state;
		const seat = /** @type {any} */ (state.seats[0]);
		assert.deepEqual(seat.civData[TH], { tokens: 4, used: [] }, version);
		assert.equal(
			seat.territoryTiles.length,
			base.seats[0].territoryTiles.length + 2,
			version
		);
		// No setup adjustment: the F&F list leaves them unchanged.
		assert.deepEqual(seat.resources, base.seats[0].resources, version);
		assert.equal(seat.vp, base.seats[0].vp, version);
		checkState(state);
	}

	const { state, random } = game();
	state.seats[0].civs = ['leaders'];
	state.supply.civs = [
		TH,
		...state.supply.civs.filter((/** @type {string} */ c) => c !== TH),
	];
	const top = state.supply.territory.slice(0, 2);
	const tiles = state.seats[0].territoryTiles.length;
	const gained = resolveEffects(state, 1, [{ gainCiv: {} }], random);
	const seat = gained.seats[0];
	assert.deepEqual(seat.civs, ['leaders', TH]);
	assert.deepEqual(seat.civData[TH], { tokens: 4, used: [] });
	assert.equal(seat.territoryTiles.length, tiles + 2);
	assert.deepEqual(seat.territoryTiles.slice(-2), top);
	assert.deepEqual(openDecisions(gained), []);
});

test('Treasure Hunters may claim an empty explored territory next to one they control that shows an unused treasure anywhere, tile or printed (R114)', () => {
	const { state, random } = treasureGame({
		'-2_-2': printed('-2_-2'),
		// Sea and forest.
		'-3_-3': printed('-3_-3'),
		// Desert and mountain.
		'-2_-1': printed('-2_-1'),
		// Mountain and forest, under an opponent's outpost.
		'-1_-2': printed('-1_-2'),
		// All sea, with an island of desert.
		'-1_-1': 5,
		// Not next to their territory.
		'0_0': printed('0_0'),
	});
	state.hexes['-1_-2'].outposts = [{ seat: 2, toppled: false }];
	const asked = pushed(state, random, [treasureIncome(2)]);
	const decision = /** @type {any} */ (decisionOf(asked, 'chooseHex'));
	assert.deepEqual(
		[decision.player, decision.purpose, decision.optional],
		[1, 'treasureHunters', true]
	);
	assert.deepEqual(
		decision.options,
		MAPS.small.hexes.filter((hex) =>
			['-3_-3', '-2_-1', '-1_-1'].includes(hex)
		)
	);
	assert.deepEqual(answersOf(asked, 'chooseHex')[0], { hex: null });

	// Declined, nothing changes.
	const declined = answer(asked, random, 1, 'chooseHex', { hex: null });
	assert.deepEqual(declined.seats[0].civData[TH], { tokens: 4, used: [] });
	assert.deepEqual(declined.hexes['-3_-3'].tokens, []);
	assert.deepEqual(openDecisions(declined), []);

	// A civilization token is an item too.
	const traded = structuredClone(state);
	traded.hexes['-3_-3'].tokens = [{ seat: 2, civ: 'traders' }];
	const fewer = /** @type {any} */ (
		decisionOf(pushed(traded, random, [treasureIncome(3)]), 'chooseHex')
	);
	assert.ok(!fewer.options.includes('-3_-3'));

	// With no token left, nothing is asked.
	const spent = structuredClone(state);
	spent.seats[0].civData[TH].tokens = 0;
	assert.deepEqual(
		openDecisions(pushed(spent, random, [treasureIncome(4)])),
		[]
	);
});

test('a Forest treasure: the token controls the territory, then 1 food and both results of the red die rolled twice (03 §1.3, R114)', () => {
	const { state } = treasureGame({
		'-2_-2': printed('-2_-2'),
		'-3_-3': printed('-3_-3'),
	});
	const since = state.seq;
	// 7 VP, then 1 VP for each territory they control, the new one included.
	const random = dice(3, 4);
	// Only forest shows, so no treasure is asked for.
	const next = claim(state, random, '-3_-3');
	const seat = next.seats[0];
	assert.deepEqual(seat.civData[TH], { tokens: 3, used: ['forest'] });
	assert.deepEqual(next.hexes['-3_-3'].tokens, [{ seat: 1, civ: TH }]);
	assert.deepEqual(next.hexes['-3_-3'].outposts, []);
	assert.deepEqual(controlledTerritories(next, 1).sort(), ['-2_-2', '-3_-3']);
	assert.equal(seat.resources.food, state.seats[0].resources.food + 1);
	assert.equal(seat.vp, state.seats[0].vp + 9);
	assert.equal(
		seat.vpSources.civ ?? 0,
		(state.seats[0].vpSources.civ ?? 0) + 9
	);
	assert.deepEqual(eventsOf(next, 'tokenPlaced', since), [
		{ type: 'tokenPlaced', player: 1, civ: TH, hex: '-3_-3' },
	]);
	assert.deepEqual(eventsOf(next, 'treasureRolled', since), [
		{ type: 'treasureRolled', player: 1, die: 'red', faces: [3, 4] },
	]);
	// It is no conquest.
	assert.deepEqual(eventsOf(next, 'conquered', since), []);
	assert.deepEqual(openDecisions(next), []);
});

test('a territory showing several unused treasures asks which; a Mountain treasure gives 1 worker, then both conquer dice, black first (03 §1.3, R114)', () => {
	const { state } = treasureGame({
		'-2_-2': printed('-2_-2'),
		'-2_-1': printed('-2_-1'),
	});
	const since = state.seq;
	// Red 6 VP, black 1 worker.
	const random = dice(2, 1);
	const asked = claim(state, random, '-2_-1');
	const pick = /** @type {any} */ (decisionOf(asked, 'chooseSlot'));
	assert.deepEqual(
		[pick.player, pick.purpose, pick.optional, pick.options],
		[1, 'treasureHunters', false, ['desert', 'mountain']]
	);
	assert.deepEqual(asked.hexes['-2_-1'].tokens, []);
	const next = answer(asked, random, 1, 'chooseSlot', { slot: 'mountain' });
	const seat = next.seats[0];
	assert.deepEqual(seat.civData[TH], { tokens: 3, used: ['mountain'] });
	assert.equal(seat.resources.worker, state.seats[0].resources.worker + 2);
	assert.equal(seat.vp, state.seats[0].vp + 6);
	assert.deepEqual(eventsOf(next, 'treasureRolled', since), [
		{ type: 'treasureRolled', player: 1, die: 'conquer', faces: [2, 1] },
	]);
	// The worker first, then black's worker, then red's VP.
	const order = next.events
		.filter(
			(e) =>
				e.seq > since &&
				['resourcesGained', 'treasureRolled', 'vpGained'].includes(
					e.type
				)
		)
		.map((e) => e.type);
	assert.deepEqual(order, [
		'resourcesGained',
		'treasureRolled',
		'resourcesGained',
		'vpGained',
	]);
	assert.deepEqual(openDecisions(next), []);
});

test("a Desert treasure gives 1 coin, then one of two black die results; its '?' is the claimed tile's benefit (03 §1.3, R8)", () => {
	// Territory tile 1 shows desert; its benefit is 1 coin.
	const { state } = treasureGame({ '-2_-2': printed('-2_-2'), '-1_-1': 1 });
	const since = state.seq;
	const random = dice(4, 1);
	const asked = claim(state, random, '-1_-1');
	assert.deepEqual(eventsOf(asked, 'treasureRolled', since), [
		{ type: 'treasureRolled', player: 1, die: 'black', faces: [4, 1] },
	]);
	const choice = /** @type {any} */ (decisionOf(asked, 'chooseOption'));
	assert.deepEqual(
		[choice.player, choice.purpose, choice.options],
		[
			1,
			'treasureHunters',
			[[{ tileBenefit: {} }], [{ gain: { worker: 1 } }]],
		]
	);
	const coin = state.seats[0].resources.coin;
	const tile = answer(asked, random, 1, 'chooseOption', { option: 0 });
	assert.equal(tile.seats[0].resources.coin, coin + 2);
	assert.deepEqual(eventsOf(tile, 'tileBenefit', since), [
		{ type: 'tileBenefit', player: 1, hex: '-1_-1', tile: 1 },
	]);
	assert.deepEqual(openDecisions(tile), []);
	const worker = answer(asked, random, 1, 'chooseOption', { option: 1 });
	assert.equal(worker.seats[0].resources.coin, coin + 1);
	assert.equal(
		worker.seats[0].resources.worker,
		state.seats[0].resources.worker + 1
	);

	// Two rolls alike leave nothing to choose.
	const same = claim(state, dice(0, 0), '-1_-1');
	assert.equal(decisionOf(same, 'chooseOption'), undefined);
	assert.equal(same.seats[0].resources.coin, coin + 2);
	assert.deepEqual(openDecisions(same), []);
});

test('a Grassland treasure gives 1 culture, then one of two science die results to advance on with its benefit; the middle island gives no achievement (03 §1.3)', () => {
	const tiles = { '-1_-1': 1, '0_0': printed('0_0') };
	const { state } = treasureGame(tiles, { home: '-1_-1' });
	const since = state.seq;
	// Exploration and Military.
	const random = dice(0, 3);
	const asked = claim(state, random, '0_0');
	// The middle island shows all four on its island.
	assert.deepEqual(answersOf(asked, 'chooseSlot'), [
		{ slot: 'desert' },
		{ slot: 'grassland' },
		{ slot: 'mountain' },
		{ slot: 'forest' },
	]);
	const rolled = answer(asked, random, 1, 'chooseSlot', {
		slot: 'grassland',
	});
	assert.equal(
		rolled.seats[0].resources.culture,
		state.seats[0].resources.culture + 1
	);
	assert.deepEqual(eventsOf(rolled, 'treasureRolled', since), [
		{ type: 'treasureRolled', player: 1, die: 'science', faces: [0, 3] },
	]);
	assert.deepEqual(answersOf(rolled, 'chooseRoll'), [
		{ track: 'exploration' },
		{ track: 'military' },
	]);
	const chosen = answer(rolled, random, 1, 'chooseRoll', {
		track: 'military',
	});
	const move = /** @type {any} */ (decisionOf(chosen, 'chooseMove'));
	assert.deepEqual(
		[
			move.player,
			move.direction,
			move.options,
			move.benefit,
			move.optional,
		],
		[1, 'advance', [{ track: 'military', from: 0 }], true, true]
	);
	assert.ok(!chosen.achievements['middle-island'].includes(1));
	assert.ok(controlledTerritories(chosen, 1).includes('0_0'));

	// The same track twice leaves nothing to choose.
	const twice = dice(1, 5);
	const science = answer(claim(state, twice, '0_0'), twice, 1, 'chooseSlot', {
		slot: 'grassland',
	});
	assert.equal(decisionOf(science, 'chooseRoll'), undefined);
	assert.deepEqual(
		/** @type {any} */ (decisionOf(science, 'chooseMove')).options,
		[{ track: 'science', from: 0 }]
	);
});

test('each treasure is claimed once: a territory showing only used ones is not offered (03 §1.3)', () => {
	const tiles = {
		'-2_-2': printed('-2_-2'),
		'-3_-3': printed('-3_-3'),
		'-2_-1': printed('-2_-1'),
		'-1_-2': printed('-1_-2'),
	};
	const { state, random } = treasureGame(tiles, {
		used: ['forest', 'mountain'],
	});
	const asked = pushed(state, random, [treasureIncome(4)]);
	assert.deepEqual(
		/** @type {any} */ (decisionOf(asked, 'chooseHex')).options,
		['-2_-1']
	);
	// Only the desert is left there, so it is claimed without asking.
	const next = answer(asked, random, 1, 'chooseHex', { hex: '-2_-1' });
	assert.deepEqual(next.seats[0].civData[TH].used, [
		'forest',
		'mountain',
		'desert',
	]);
	assert.equal(decisionOf(next, 'chooseSlot'), undefined);

	const all = treasureGame(tiles, {
		used: ['forest', 'mountain', 'desert', 'grassland'],
	});
	assert.deepEqual(
		openDecisions(pushed(all.state, all.random, [treasureIncome(5)])),
		[]
	);
});

test('a claimed territory changes the counts the Mystics predict, so their check follows (#20 design §7)', () => {
	const { state } = treasureGame({
		'-2_-2': printed('-2_-2'),
		'-3_-3': printed('-3_-3'),
	});
	state.seats[0].civs = [TH, 'mystics'];
	state.seats[0].civData.mystics = {
		predictions: { techCards: 9, districts: 9, territories: 2, tracks: 4 },
		reached: [],
	};
	const next = claim(state, dice(0, 0), '-3_-3');
	assert.deepEqual(next.seats[0].civData.mystics.reached, ['territories']);
	assert.deepEqual(eventsOf(next, 'prophecyReached', state.seq), [
		{ type: 'prophecyReached', player: 1, category: 'territories' },
	]);
});

/**
 * #17's conquest game, in which seat 2's only item on '-2_-1' is a Treasure Hunters token.
 * @param {string[]} hand - Seat 2's
 */
function tokenConquest(hand) {
	const state = /** @type {any} */ (conquestGame(hand, PP));
	state.hexes['-2_-1'].outposts = [];
	state.hexes['-2_-1'].tokens = [{ seat: 2, civ: TH }];
	state.seats[0].hand = [];
	state.seats[1].civs = [TH];
	state.seats[1].civData = { [TH]: { tokens: 3, used: ['desert'] } };
	return state;
}

/** A random that gives every roll the same face. */
const face = (/** @type {number} */ n) => () => n;

test('the Treasure Hunters token controls its territory; an opponent conquering it asks them to respond, never with Retreat, and Tanks gives both dice (R114, R17)', () => {
	const state = tokenConquest([
		'trap-1',
		'retreat',
		'surprise-party',
		'surrender',
	]);
	assert.deepEqual(controlledTerritories(state, 2), ['-2_-1']);
	// Somewhere to retreat to, and further along military, so only the token keeps Retreat out.
	state.hexes['-1_-1'].tile = state.supply.territory.shift();
	state.hexes['-1_-1'].outposts = [{ seat: 2, toppled: false }];
	state.seats[1].tracks.military = [3];
	const tanks = pushed(state, face(0), [
		{
			player: 1,
			kind: 'effects',
			effects: [{ conquer: { bothDice: 'ifOpponent', only: ['-2_-1'] } }],
		},
	]);
	const question = /** @type {any} */ (decisionOf(tanks, 'chooseResponse'));
	assert.deepEqual(
		[question.player, question.attacker, question.hex, question.both],
		[2, 1, '-2_-1', true]
	);
	assert.deepEqual(
		answersOf(tanks, 'chooseResponse').map((a) => a.card),
		[null, 'trap-1', 'surprise-party', 'surrender']
	);
	// Nothing to topple: the token stays beside the attacker's outpost.
	assert.deepEqual(eventsOf(tanks, 'outpostToppled', state.seq), []);

	const declined = answer(tanks, face(0), 2, 'chooseResponse', {
		card: null,
	});
	assert.deepEqual(declined.hexes['-2_-1'].outposts, [
		{ seat: 1, toppled: false },
	]);
	assert.deepEqual(declined.hexes['-2_-1'].tokens, [{ seat: 2, civ: TH }]);
	assert.ok(controlledTerritories(declined, 1).includes('-2_-1'));
	assert.ok(!controlledTerritories(declined, 2).includes('-2_-1'));
	// Two items: nobody can conquer it now.
	assert.ok(!conquerTargets(declined, 2, true).includes('-2_-1'));
	// Both dice, black first: 1 coin and 4 VP, without choosing.
	assert.equal(decisionOf(declined, 'chooseDie'), undefined);
	assert.equal(
		declined.seats[0].resources.coin,
		state.seats[0].resources.coin + 1
	);
	assert.equal(declined.seats[0].vp, state.seats[0].vp + 4);
});

test('a trap or a Surprise Party against the conquest of a Treasure Hunters token gives them back its territory (R114)', () => {
	const conquered = (/** @type {string} */ card) => {
		const state = tokenConquest([card]);
		state.seats[1].tracks.military = [3];
		const asked = pushed(state, face(0), [
			{ player: 1, kind: 'effects', effects: [{ conquer: {} }] },
		]);
		return answer(asked, face(0), 2, 'chooseResponse', { card });
	};
	for (const card of ['trap-1', 'surprise-party']) {
		const after = conquered(card);
		assert.deepEqual(
			after.hexes['-2_-1'].outposts,
			[{ seat: 1, toppled: true, toppledBy: 2 }],
			card
		);
		assert.deepEqual(after.hexes['-2_-1'].tokens, [{ seat: 2, civ: TH }]);
		assert.ok(controlledTerritories(after, 2).includes('-2_-1'), card);
		assert.ok(!controlledTerritories(after, 1).includes('-2_-1'), card);
	}
	// The trap's resource, then the attacker's dice: the conquest failed.
	const trapped = answer(conquered('trap-1'), face(0), 2, 'chooseResource', {
		resources: { coin: 1 },
	});
	assert.deepEqual(eventsOf(trapped, 'conquered'), [
		{ type: 'conquered', player: 1, hex: '-2_-1', trapped: true },
	]);
});

test('only a Treasure Hunters token controls: a Traders token alone controls nothing and defends nothing, as in a base game (R33)', () => {
	const state = /** @type {any} */ (conquestGame(['trap-1']));
	state.hexes['-2_-1'].outposts = [];
	state.hexes['-2_-1'].tokens = [{ seat: 2, civ: 'traders' }];
	state.seats[1].civs = ['traders'];
	state.seats[1].civData = { traders: { tokens: 3 } };
	assert.deepEqual(controlledTerritories(state, 2), []);
	const next = pushed(state, face(0), [
		{
			player: 1,
			kind: 'effects',
			effects: [{ conquer: { bothDice: 'ifOpponent' } }],
		},
	]);
	assert.equal(decisionOf(next, 'chooseResponse'), undefined);
	// No opponent controlled it, so Tanks gives one die.
	assert.ok(decisionOf(next, 'chooseDie'));
	assert.deepEqual(next.hexes['-2_-1'].outposts, [
		{ seat: 1, toppled: false },
	]);
});

test('the state checks count the Treasure Hunters tokens on their mat and on the map', () => {
	const { state } = startedGame(2, { civs: [TH, 'leaders'], ...PP });
	const hex = /** @type {string} */ (
		MAPS[state.map].hexes.find((key) => state.hexes[key].tile === null)
	);
	state.hexes[hex].tokens.push({ seat: 1, civ: TH });
	/** @type {any} */ (state.seats[0]).civData[TH].tokens = 3;
	checkState(state);
	const lost = /** @type {any} */ (structuredClone(state));
	lost.hexes[hex].tokens = [];
	assert.throws(() => checkState(lost), /treasure-hunters tokens/);
});

test('Treasure Hunters use their ability in step 1 of income turns 2 to 5', () => {
	/** @type {string | undefined} */
	let near;
	const ready = turnHolding(TH, (seat, state) => {
		near = hexNeighbours(seat.start).find(
			(key) => state.hexes[key]?.tile === null
		);
		assert.ok(near, 'an unexplored territory beside the start');
		const tile = /** @type {number} */ (
			state.supply.territory.find((/** @type {number} */ t) =>
				TERRITORY_TILES[t - 1].corners.some(
					(/** @type {string} */ c) => c !== 'sea'
				)
			)
		);
		state.supply.territory.splice(state.supply.territory.indexOf(tile), 1);
		state.hexes[near].tile = tile;
		state.hexes[near].orient = 0;
	});
	const { player } = ready;
	const since = ready.state.seq;
	const state = answer(ready.state, ready.random, player, 'chooseTurn', {
		turn: 'income',
	});
	assert.ok(
		eventsOf(state, 'civAbilityUsed', since).some((e) => e.civ === TH)
	);
	const decision = /** @type {any} */ (decisionOf(state, 'chooseHex'));
	assert.deepEqual(
		[decision?.player, decision?.purpose],
		[player, 'treasureHunters']
	);
	assert.ok(decision.options.includes(near));
});

// The Tinkerers.

/**
 * A game for `count` players in which seat 1 holds the Tinkerers with these options used. Each seat's tokens stand
 * where `tracks` puts them (by seat, then track), the others on the start; every capital is the empty Mountain mat.
 * @param {Record<number, Record<string, number[]>>} tracks
 * @param {{ count?: number, used?: number[] }} [options]
 * @returns {{ state: any, random: any }}
 */
function tinkerersGame(tracks, { count = 2, used = [] } = {}) {
	const { state: started, random } = startedGame(count, PP);
	const state = /** @type {any} */ (structuredClone(started));
	state.pending.length = 0;
	for (const seat of state.seats) {
		seat.capital = { mat: 1, buildings: [], landmarks: [], cubes: [] };
		seat.tracks = {
			exploration: [0],
			science: [0],
			technology: [0],
			military: [0],
			...tracks[seat.seat],
		};
	}
	state.seats[0].civs = ['tinkerers'];
	state.seats[0].civData.tinkerers = { used: [...used] };
	return { state, random };
}

/** The Tinkerers' ability on an income turn. */
const tinkerersIncome = (/** @type {number} */ turn) => ({
	player: 1,
	kind: 'civIncome',
	civ: 'tinkerers',
	turn,
	origin: 'civ',
});

/**
 * Seat 1's income ability, then the option picked.
 * @param {any} state
 * @param {any} random
 * @param {number} option
 */
function tinker(state, random, option) {
	const asked = pushed(state, random, [tinkerersIncome(2)]);
	return answer(asked, random, 1, 'chooseSlot', { slot: option });
}

/**
 * The options seat 1's income question offers, or null when it asks nothing.
 * @param {{ state: any, random: any }} game
 * @returns {number[] | null}
 */
function offered({ state, random }) {
	const asked = pushed(state, random, [tinkerersIncome(2)]);
	return decisionOf(asked, 'chooseSlot')?.options ?? null;
}

test('Tinkerers chosen at setup give each opponent 1 tech card from the deck, and under the current rules 1 tapestry card too (R48, R113)', () => {
	for (const version of VERSIONS) {
		const { state } = startedGame(3, {
			civs: ['tinkerers', 'leaders', 'nomads'],
			version,
			...PP,
		});
		const [own, ...others] = /** @type {any[]} */ (state.seats);
		assert.deepEqual(own.civData.tinkerers, { used: [] }, version);
		assert.deepEqual(own.tech.bottom, [], version);
		assert.deepEqual(own.hand, [], version);
		for (const seat of others) {
			assert.equal(seat.tech.bottom.length, 1, version);
			assert.deepEqual(
				[seat.tech.middle, seat.tech.top],
				[[], []],
				version
			);
			assert.equal(
				seat.hand.length,
				version === 'current' ? 1 : 0,
				version
			);
		}
		assert.deepEqual(
			eventsOf(state, 'techInvented').map((e) => [e.player, e.from]),
			[
				[2, 'deck'],
				[3, 'deck'],
			],
			version
		);
		checkState(state);
	}
});

test('Tinkerers gained mid-game give the opponents nothing (R113, R34)', () => {
	const { state, random } = game();
	state.seats[0].civs = ['leaders'];
	state.supply.civs = [
		'tinkerers',
		...state.supply.civs.filter(
			(/** @type {string} */ c) => c !== 'tinkerers'
		),
	];
	const gained = resolveEffects(state, 1, [{ gainCiv: {} }], random);
	const [own, other] = /** @type {any[]} */ (gained.seats);
	assert.deepEqual(own.civs, ['leaders', 'tinkerers']);
	assert.deepEqual(own.civData.tinkerers, { used: [] });
	assert.deepEqual(other.tech, state.seats[1].tech);
	assert.deepEqual(other.hand, state.seats[1].hand);
	assert.deepEqual(eventsOf(gained, 'techInvented', state.seq), []);
	assert.deepEqual(eventsOf(gained, 'cardsDrawn', state.seq), []);
	assert.deepEqual(openDecisions(gained), []);
});

test('Tinkerers may put a token on an unused option at the start of income turns 2 to 5, or decline (03 §1.3)', () => {
	const { state, random } = tinkerersGame({ 1: { science: [5] } });
	const asked = pushed(state, random, [tinkerersIncome(2)]);
	const decision = /** @type {any} */ (decisionOf(asked, 'chooseSlot'));
	assert.deepEqual(
		[decision.player, decision.purpose, decision.optional],
		[1, 'tinkerers', true]
	);
	// Nobody is ahead of them anywhere, so Catch up is left out.
	assert.deepEqual(answersOf(asked, 'chooseSlot'), [
		{ slot: null },
		{ slot: 1 },
		{ slot: 3 },
		{ slot: 4 },
	]);
	const declined = answer(asked, random, 1, 'chooseSlot', { slot: null });
	assert.deepEqual(declined.seats[0].civData.tinkerers.used, []);
	assert.deepEqual(declined.seats[0].tracks, state.seats[0].tracks);
	assert.deepEqual(openDecisions(declined), []);
	assert.deepEqual(eventsOf(declined, 'tinkerersUsed', state.seq), []);
});

test('each Tinkerers option is used once a game, and one with nothing to act on is not offered (03 §1.3)', () => {
	const tracks = { 1: { science: [5] }, 2: { military: [3] } };
	assert.deepEqual(offered(tinkerersGame(tracks)), [1, 2, 3, 4]);
	assert.deepEqual(offered(tinkerersGame(tracks, { used: [2, 4] })), [1, 3]);
	assert.equal(offered(tinkerersGame(tracks, { used: [4, 1, 3, 2] })), null);
	// Every token on the start: no space paid for, none to go back from, nobody ahead, but bonus spaces ahead.
	assert.deepEqual(offered(tinkerersGame({})), [4]);

	const { state, random } = tinkerersGame(tracks);
	const used = tinker(state, random, 3);
	assert.deepEqual(used.seats[0].civData.tinkerers.used, [3]);
	assert.deepEqual(eventsOf(used, 'tinkerersUsed', state.seq), [
		{ type: 'tinkerersUsed', player: 1, option: 3 },
	]);
	assert.deepEqual(openDecisions(used), []);
	assert.deepEqual(offered({ state: used, random }), [1, 2, 4]);
});

test('Pay back (option 1) gains the resources it cost to advance into the space of a token the player chooses (03 §1.3)', () => {
	const { state, random } = tinkerersGame({
		1: { exploration: [2], science: [5], military: [10] },
	});
	const payBack = tinker(state, random, 1);
	const decision = /** @type {any} */ (decisionOf(payBack, 'chooseSlot'));
	assert.deepEqual(
		[decision.purpose, decision.optional, decision.options],
		[
			'tinkerersPayBack',
			false,
			[
				{ track: 'exploration', space: 2 },
				{ track: 'science', space: 5 },
				{ track: 'military', space: 10 },
			],
		]
	);
	// Tier IV: 2 of the track's resource.
	const military = answer(payBack, random, 1, 'chooseSlot', {
		slot: { track: 'military', space: 10 },
	});
	assert.deepEqual(military.seats[0].resources, {
		coin: 0,
		worker: 0,
		food: 0,
		culture: 2,
	});
	assert.deepEqual(openDecisions(military), []);
	// Tier II: 1 worker and 1 resource of the player's choice.
	const science = answer(payBack, random, 1, 'chooseSlot', {
		slot: { track: 'science', space: 5 },
	});
	const paid = answer(science, random, 1, 'chooseResource', {
		resources: { coin: 1 },
	});
	assert.deepEqual(paid.seats[0].resources, {
		coin: 1,
		worker: 1,
		food: 0,
		culture: 0,
	});
	// The tokens stay where they are.
	assert.deepEqual(paid.seats[0].tracks, state.seats[0].tracks);
	assert.deepEqual(openDecisions(paid), []);
});

test('Pay back offers each token past the start, two on one track apart, and asks nothing for a lone one (03 §1.3)', () => {
	const twice = tinkerersGame({ 1: { technology: [7, 2] } });
	const asked = tinker(twice.state, twice.random, 1);
	assert.deepEqual(decisionOf(asked, 'chooseSlot')?.options, [
		{ track: 'technology', space: 2 },
		{ track: 'technology', space: 7 },
	]);

	const lone = tinkerersGame({ 1: { technology: [11] } });
	const gained = tinker(lone.state, lone.random, 1);
	assert.equal(gained.seats[0].resources.coin, 2);
	assert.deepEqual(openDecisions(gained), []);
});

test('Catch up (option 2) advances to the closest opponent ahead, with the benefit and the landmarks passed, as an advance (03 §1.3, R9)', () => {
	// Tile 18: 5 VP whenever its player advances on Military.
	const { state, random } = tinkerersGame(
		{ 1: { military: [3] }, 2: { military: [9] }, 3: { military: [4] } },
		{ count: 3 }
	);
	state.seats[0].exploredSpace = [18];
	const caught = tinker(state, random, 2);
	assert.deepEqual(caught.seats[0].tracks.military, [4]);
	assert.deepEqual(eventsOf(caught, 'landmarkGained', state.seq), [
		{
			type: 'landmarkGained',
			player: 1,
			landmark: 'barracks',
			track: 'military',
		},
	]);
	const placed = answerFirst(caught, random, 1, 'choosePlacement');
	// Standing Army's benefit gives 1 worker; the space tile gives 5 VP for the advance.
	assert.equal(placed.seats[0].resources.worker, 1);
	assert.deepEqual(
		eventsOf(placed, 'vpGained', state.seq)
			.filter((e) => e.source === 'map')
			.map((e) => e.vp),
		[5]
	);
	assert.deepEqual(openDecisions(placed), []);
});

test('Catch up gains no bonus, and leaves out tracks where nobody is ahead or the player is blocked (03 §1.3, #19 design §5)', () => {
	const { state, random } = tinkerersGame({
		1: { exploration: [4], science: [6], technology: [2] },
		2: { exploration: [5], science: [6], technology: [5] },
	});
	state.seats[0].resources = { coin: 3, worker: 3, food: 3, culture: 3 };
	// The opponent's Dictatorship blocks Technology.
	state.blocks = [{ player: 2, track: 'technology' }];
	const caught = tinker(state, random, 2);
	// The one move left is made without asking: Ships' benefit, but not its bonus farm.
	assert.deepEqual(caught.seats[0].tracks.exploration, [5]);
	assert.deepEqual(caught.seats[0].tracks.technology, [2]);
	assert.deepEqual(eventsOf(caught, 'spaceActivated', state.seq), [
		{
			type: 'spaceActivated',
			player: 1,
			track: 'exploration',
			space: 5,
		},
	]);
	assert.deepEqual(openDecisions(caught), []);
});

test('with several tracks to catch up on, the player chooses the move (03 §1.3)', () => {
	const { state, random } = tinkerersGame({
		1: { exploration: [4], military: [1] },
		2: { exploration: [5], military: [2] },
	});
	state.seats[0].resources = { coin: 3, worker: 3, food: 3, culture: 3 };
	const asked = tinker(state, random, 2);
	const decision = /** @type {any} */ (decisionOf(asked, 'chooseMove'));
	assert.deepEqual(
		[decision.direction, decision.purpose, decision.option],
		['jump', 'tinkerers', 2]
	);
	assert.deepEqual(answersOf(asked, 'chooseMove'), [
		{ track: 'exploration', from: 4, to: 5 },
		{ track: 'military', from: 1, to: 2 },
	]);
	const moved = answer(asked, random, 1, 'chooseMove', {
		track: 'military',
		from: 1,
		to: 2,
	});
	assert.deepEqual(moved.seats[0].tracks, {
		...state.seats[0].tracks,
		military: [2],
	});
	// Bladed Weapons' benefit is 1 tapestry card; its armory bonus is not offered.
	assert.equal(moved.seats[0].hand.length, 1);
	assert.deepEqual(openDecisions(moved), []);
});

test('Step back (option 3) goes back exactly 3 spaces, with the benefit, and the bonus may be paid; it gains no landmark and is no advance (03 §1.3, R9)', () => {
	// Tile 16: 5 VP whenever its player advances on Technology.
	const { state, random } = tinkerersGame({
		1: { exploration: [8], science: [2], technology: [3] },
	});
	state.seats[0].resources = { coin: 3, worker: 0, food: 0, culture: 0 };
	state.seats[0].exploredSpace = [16];
	const asked = tinker(state, random, 3);
	// Science 2 is too close to the start; Technology 3 may go back onto it.
	assert.deepEqual(answersOf(asked, 'chooseMove'), [
		{ track: 'exploration', from: 8, to: 5 },
		{ track: 'technology', from: 3, to: 0 },
	]);
	const back = answer(asked, random, 1, 'chooseMove', {
		track: 'exploration',
		from: 8,
		to: 5,
	});
	assert.deepEqual(back.seats[0].tracks.exploration, [5]);
	assert.deepEqual(eventsOf(back, 'landmarkGained', state.seq), []);
	// Ships' benefit, then its bonus: pay 1 resource for a farm.
	const bonus = /** @type {any} */ (decisionOf(back, 'chooseBonus'));
	assert.deepEqual(
		[bonus.track, bonus.space, bonus.cost],
		['exploration', 5, { any: 1 }]
	);

	const start = answer(asked, random, 1, 'chooseMove', {
		track: 'technology',
		from: 3,
		to: 0,
	});
	assert.deepEqual(start.seats[0].tracks.technology, [0]);
	assert.deepEqual(eventsOf(start, 'vpGained', state.seq), []);
	assert.deepEqual(openDecisions(start), []);
});

test('Jump ahead (option 4) moves to the next space with a bonus and offers it free: no benefit, no landmark for the tier passed, and no advance (03 §1.3, R9)', () => {
	// Tile 17: 5 VP whenever its player advances on Science.
	const { state, random } = tinkerersGame({
		1: {
			exploration: [12],
			science: [2],
			technology: [12],
			military: [11],
		},
	});
	state.seats[0].exploredSpace = [17];
	// No other token has a bonus space ahead, so the jump is made without asking.
	const jumped = tinker(state, random, 4);
	assert.deepEqual(jumped.seats[0].tracks.science, [5]);
	assert.ok(jumped.landmarks.includes('apothecary'));
	assert.deepEqual(eventsOf(jumped, 'landmarkGained', state.seq), []);
	// Chemistry's research is its benefit: no die is rolled.
	assert.deepEqual(eventsOf(jumped, 'scienceDieRolled', state.seq), []);
	const bonus = /** @type {any} */ (decisionOf(jumped, 'chooseBonus'));
	assert.deepEqual(
		[bonus.track, bonus.space, bonus.cost],
		['science', 5, {}]
	);
	assert.deepEqual(answersOf(jumped, 'chooseBonus')[0], { pay: null });
	const taken = answer(jumped, random, 1, 'chooseBonus', { pay: {} });
	// Chemistry's bonus is 5 VP, and the space tile gives none.
	assert.deepEqual(
		eventsOf(taken, 'vpGained', state.seq).map((e) => e.vp),
		[5]
	);
	assert.equal(taken.seats[0].vp, state.seats[0].vp + 5);
	assert.deepEqual(openDecisions(taken), []);
});

test('Jump ahead leaves out a blocked track, and with several tracks the player chooses (03 §1.3, #19 design §5)', () => {
	const { state, random } = tinkerersGame({});
	state.blocks = [{ player: 2, track: 'science' }];
	const asked = tinker(state, random, 4);
	assert.deepEqual(answersOf(asked, 'chooseMove'), [
		{ track: 'exploration', from: 0, to: 2 },
		{ track: 'technology', from: 0, to: 2 },
		{ track: 'military', from: 0, to: 2 },
	]);
	const jumped = answer(asked, random, 1, 'chooseMove', {
		track: 'military',
		from: 0,
		to: 2,
	});
	assert.deepEqual(jumped.seats[0].tracks.military, [2]);
	// Bladed Weapons' benefit, 1 tapestry card, is not gained; its bonus is free.
	assert.deepEqual(jumped.seats[0].hand, []);
	const bonus = /** @type {any} */ (decisionOf(jumped, 'chooseBonus'));
	assert.deepEqual([bonus.space, bonus.cost], [2, {}]);
});

test('Tinkerers use their ability in step 1 of income turns 2 to 5', () => {
	const ready = turnHolding('tinkerers', (seat) => {
		seat.tracks.science = [5];
	});
	const { player } = ready;
	const since = ready.state.seq;
	const state = answer(ready.state, ready.random, player, 'chooseTurn', {
		turn: 'income',
	});
	assert.ok(
		eventsOf(state, 'civAbilityUsed', since).some(
			(e) => e.civ === 'tinkerers'
		)
	);
	const decision = /** @type {any} */ (decisionOf(state, 'chooseSlot'));
	assert.deepEqual(
		[decision?.player, decision?.purpose],
		[player, 'tinkerers']
	);
	assert.ok(decision.options.includes(1));
});

// The Spies.

/**
 * What a seat holds in a Spies test, each taken out of its deck or stack: tapestry cards face up on its mat's slots
 * (`mat`, era by era), tiles in its supply, its tokens, the tech cards above its bottom row, and its hand.
 * @typedef {{ mat?: string[][], territory?: number[], space?: number[], tracks?: Record<string, number[]>, tech?: { middle?: string[], top?: string[] }, hand?: string[] }} Holdings
 */

/**
 * A game for `count` players in which seat 1 holds the Spies with these options used, and each seat holds only what
 * `holdings` gives it (by seat), so the state checks still hold.
 * @param {Record<number, Holdings>} holdings
 * @param {{ count?: number, used?: number[] }} [options]
 * @returns {{ state: any, random: any }}
 */
function spiesGame(holdings, { count = 2, used = [] } = {}) {
	const { state: started, random } = startedGame(count, PP);
	const state = /** @type {any} */ (structuredClone(started));
	state.pending.length = 0;
	for (const seat of state.seats) {
		const {
			mat = [],
			territory = [],
			space = [],
			tracks = {},
			tech = {},
			hand = [],
		} = holdings[seat.seat] ?? {};
		const { middle = [], top = [] } = tech;
		const cards = [...mat.flat(), ...hand];
		state.supply.tapestry.deck = state.supply.tapestry.deck.filter(
			(/** @type {string} */ card) => !cards.includes(card)
		);
		state.supply.territory = state.supply.territory.filter(
			(/** @type {number} */ tile) => !territory.includes(tile)
		);
		takeSpace(state, space);
		takeTech(state, [...middle, ...top]);
		seat.incomeMat.tapestry = [0, 1, 2, 3].map((era) => [
			...(mat[era] ?? []),
		]);
		seat.territoryTiles = [...territory];
		seat.spaceTiles = [...space];
		seat.tracks = {
			exploration: [0],
			science: [0],
			technology: [0],
			military: [0],
			...tracks,
		};
		seat.tech = { bottom: [], middle: [...middle], top: [...top] };
		seat.hand = [...hand];
	}
	state.seats[0].civs = ['spies'];
	state.seats[0].civData.spies = { used: [...used], watching: [] };
	state.supply.civs = state.supply.civs.filter(
		(/** @type {string} */ civ) => civ !== 'spies'
	);
	return { state, random };
}

/** A neighbour with something for every Spies option: a WHEN PLAYED card face up, a tile, a token, a middle-row card. */
const STOCKED = /** @type {Holdings} */ ({
	mat: [['trap-1']],
	territory: [1],
	tracks: { science: [5] },
	tech: { middle: ['canned-food'] },
});

/** The Spies' ability on an income turn. */
const spiesIncome = (/** @type {number} */ turn) => ({
	player: 1,
	kind: 'civIncome',
	civ: 'spies',
	turn,
	origin: 'civ',
});

/**
 * Seat 1's income ability, then the option picked.
 * @param {any} state
 * @param {any} random
 * @param {number} option
 */
function spy(state, random, option) {
	const asked = pushed(state, random, [spiesIncome(2)]);
	return answer(asked, random, 1, 'chooseSlot', { slot: option });
}

/**
 * The options seat 1's income question offers, or null when it asks nothing.
 * @param {{ state: any, random: any }} game
 * @returns {number[] | null}
 */
function spiesOffered({ state, random }) {
	const asked = pushed(state, random, [spiesIncome(2)]);
	return decisionOf(asked, 'chooseSlot')?.options ?? null;
}

/**
 * The VP a seat gains from space tiles for one advance on a track, each open decision answered with its first answer.
 * @param {any} from
 * @param {any} random
 * @param {number} player
 * @param {string} track
 * @returns {number[]}
 */
function spaceTileVp(from, random, player, track) {
	let next = resolveEffects(
		from,
		player,
		[{ advance: { tracks: [track], noBenefit: true } }],
		random
	);
	for (;;) {
		const [open] = openDecisions(next);
		if (!open) {
			break;
		}
		next = answerFirst(next, random, open.player, open.kind);
	}
	return eventsOf(next, 'vpGained', from.seq)
		.filter((e) => e.source === 'map' && e.player === player)
		.map((e) => e.vp);
}

test('Spies come in with their 4 options unused and no tile watched, at setup or mid-game, and are marked as no solo civilization (03 §1.3, R113)', () => {
	for (const version of VERSIONS) {
		const { state } = startedGame(2, {
			civs: ['spies', 'leaders'],
			version,
			...PP,
		});
		assert.deepEqual(
			/** @type {any} */ (state.seats[0]).civData.spies,
			{ used: [], watching: [] },
			version
		);
		checkState(state);
	}
	assert.equal(CIVS.spies.solo, false);

	const { state, random } = game();
	state.seats[0].civs = ['leaders'];
	state.supply.civs = [
		'spies',
		...state.supply.civs.filter((/** @type {string} */ c) => c !== 'spies'),
	];
	const gained = resolveEffects(state, 1, [{ gainCiv: {} }], random);
	assert.deepEqual(gained.seats[0].civs, ['leaders', 'spies']);
	assert.deepEqual(gained.seats[0].civData.spies, {
		used: [],
		watching: [],
	});
	assert.deepEqual(openDecisions(gained), []);
});

test('Spies may put a token on an unused option at the start of income turns 2 to 5, or decline (03 §1.3)', () => {
	const { state, random } = spiesGame({ 2: STOCKED });
	const asked = pushed(state, random, [spiesIncome(2)]);
	const decision = /** @type {any} */ (decisionOf(asked, 'chooseSlot'));
	assert.deepEqual(
		[decision.player, decision.purpose, decision.optional],
		[1, 'spies', true]
	);
	assert.deepEqual(answersOf(asked, 'chooseSlot'), [
		{ slot: null },
		{ slot: 1 },
		{ slot: 2 },
		{ slot: 3 },
		{ slot: 4 },
	]);
	const declined = answer(asked, random, 1, 'chooseSlot', { slot: null });
	assert.deepEqual(declined.seats[0].civData.spies, {
		used: [],
		watching: [],
	});
	assert.deepEqual(openDecisions(declined), []);
	assert.deepEqual(eventsOf(declined, 'spiesUsed', state.seq), []);
});

test('each Spies option is used once a game, and one with nothing to take from a neighbour is not offered (03 §1.3)', () => {
	assert.deepEqual(spiesOffered(spiesGame({ 2: STOCKED })), [1, 2, 3, 4]);
	assert.deepEqual(
		spiesOffered(spiesGame({ 2: STOCKED }, { used: [2, 4] })),
		[1, 3]
	);
	assert.equal(
		spiesOffered(spiesGame({ 2: STOCKED }, { used: [4, 1, 3, 2] })),
		null
	);
	// No card on their mat, no tile, every token on the start, no tech card above the bottom row.
	assert.equal(spiesOffered(spiesGame({})), null);
	// What the Spies hold themselves never counts.
	assert.equal(spiesOffered(spiesGame({ 1: STOCKED })), null);
	assert.deepEqual(
		spiesOffered(spiesGame({ 2: { mat: [['trap-1']] } })),
		[1]
	);
	assert.deepEqual(spiesOffered(spiesGame({ 2: { space: [13] } })), [2]);
	assert.deepEqual(
		spiesOffered(spiesGame({ 2: { tracks: { military: [1] } } })),
		[3]
	);
	assert.deepEqual(
		spiesOffered(spiesGame({ 2: { tech: { top: ['calendar'] } } })),
		[4]
	);

	// A lone target is taken without asking; the token stays on its option.
	const { state, random } = spiesGame({ 2: STOCKED });
	const used = spy(state, random, 2);
	assert.deepEqual(used.seats[0].civData.spies.used, [2]);
	assert.deepEqual(eventsOf(used, 'spiesUsed', state.seq), [
		{
			type: 'spiesUsed',
			player: 1,
			option: 2,
			from: 2,
			stack: 'territory',
			tile: 1,
		},
	]);
	assert.deepEqual(openDecisions(used), []);
	assert.deepEqual(spiesOffered({ state: used, random }), [1, 3, 4]);
});

test('Spies take only from a neighbour: in a 4-player game the seats either side, never the one across (03 §1.3)', () => {
	const { state, random } = spiesGame(
		{
			2: { mat: [['trap-1']] },
			3: { mat: [['trap-2']] },
			4: { mat: [['trap-3']] },
		},
		{ count: 4 }
	);
	const asked = spy(state, random, 1);
	const decision = /** @type {any} */ (decisionOf(asked, 'chooseSlot'));
	assert.deepEqual(
		[decision.player, decision.purpose, decision.optional],
		[1, 'spiesCard', false]
	);
	assert.deepEqual(decision.options, [
		{ player: 2, card: 'trap-1' },
		{ player: 4, card: 'trap-3' },
	]);
	assert.equal(spiesOffered(spiesGame({ 3: STOCKED }, { count: 4 })), null);
});

test("option 1 copies a face-up WHEN PLAYED tapestry card on a neighbour's income mat, as the Heralds copy one (03 §1.3)", () => {
	// A WHEN PLAYED card on top, a THIS ERA card on top of one, another WHEN PLAYED card, and one face down.
	const { state, random } = spiesGame({
		1: { mat: [['trap-2']] },
		2: {
			mat: [
				['trap-1'],
				['boast-of-superiority', 'academia'],
				['double-cross'],
				['retreat'],
			],
		},
	});
	state.seats[1].incomeMat.faceDown = ['retreat'];
	const asked = spy(state, random, 1);
	assert.deepEqual(answersOf(asked, 'chooseSlot'), [
		{ slot: { player: 2, card: 'trap-1' } },
		{ slot: { player: 2, card: 'double-cross' } },
	]);
	const since = asked.seq;
	const copied = answer(asked, random, 1, 'chooseSlot', {
		slot: { player: 2, card: 'double-cross' },
	});
	const [own, other] = /** @type {any[]} */ (copied.seats);
	// Double Cross as a tapestry: 9 VP and 1 territory tile, as the Spies' own; the card stays where it is.
	assert.equal(own.vp, state.seats[0].vp + 9);
	assert.equal(own.territoryTiles.length, 1);
	assert.deepEqual(own.civData.spies.used, [1]);
	assert.equal(own.era, null);
	assert.deepEqual(other.incomeMat, state.seats[1].incomeMat);
	assert.deepEqual(other.territoryTiles, []);
	assert.deepEqual(eventsOf(copied, 'spiesUsed', since), [
		{
			type: 'spiesUsed',
			player: 1,
			option: 1,
			from: 2,
			card: 'double-cross',
		},
	]);
	assert.deepEqual(
		eventsOf(copied, 'vpGained', since).map((e) => [e.vp, e.source]),
		[[9, 'tapestry']]
	);
	assert.deepEqual(openDecisions(copied), []);
});

test('option 1 may copy Espionage, and through it a THIS ERA card, with no card of the Spies behind it (03 §1.8)', () => {
	const { state, random } = spiesGame({
		2: { mat: [['espionage'], ['golden-age']] },
	});
	// Golden Age is THIS ERA, so Espionage is the lone card offered and is copied without asking.
	const copied = spy(state, random, 1);
	assert.deepEqual(copied.seats[0].era, {
		card: null,
		ability: 'golden-age',
	});
	assert.deepEqual(eventsOf(copied, 'eraStarted', state.seq), [
		{ type: 'eraStarted', player: 1, card: null, ability: 'golden-age' },
	]);
	assert.equal(copied.seats[1].era, null);
	assert.deepEqual(openDecisions(copied), []);
});

test("option 2 gains the benefit of a territory or space tile in a neighbour's supply, which stays there (03 §1.3)", () => {
	// Territory tile 1: 1 coin. Space tile 5: 1 coin, 1 worker and 8 VP.
	const { state, random } = spiesGame({ 2: { territory: [1], space: [5] } });
	const asked = spy(state, random, 2);
	const decision = /** @type {any} */ (decisionOf(asked, 'chooseSlot'));
	assert.deepEqual(
		[decision.purpose, decision.optional, decision.options],
		[
			'spiesTile',
			false,
			[
				{ player: 2, stack: 'territory', tile: 1 },
				{ player: 2, stack: 'space', tile: 5 },
			],
		]
	);
	// The token is on the option as soon as it is picked, so the card shows it while the tile is chosen.
	assert.deepEqual(asked.seats[0].civData.spies.used, [2]);
	assert.deepEqual(eventsOf(asked, 'spiesUsed', state.seq), []);

	const since = asked.seq;
	const space = answer(asked, random, 1, 'chooseSlot', {
		slot: { player: 2, stack: 'space', tile: 5 },
	});
	const [own, other] = /** @type {any[]} */ (space.seats);
	assert.deepEqual(own.resources, {
		...state.seats[0].resources,
		coin: state.seats[0].resources.coin + 1,
		worker: state.seats[0].resources.worker + 1,
	});
	assert.deepEqual(
		eventsOf(space, 'vpGained', since).map((e) => [e.vp, e.source]),
		[[8, 'map']]
	);
	assert.deepEqual(
		[own.spaceTiles, own.exploredSpace, other.exploredSpace],
		[[], [], []]
	);
	assert.deepEqual(other.spaceTiles, [5]);
	assert.deepEqual(eventsOf(space, 'spaceExplored', since), []);
	// Not an ongoing tile: nothing is watched.
	assert.deepEqual(own.civData.spies.watching, []);
	assert.deepEqual(openDecisions(space), []);

	const territory = answer(asked, random, 1, 'chooseSlot', {
		slot: { player: 2, stack: 'territory', tile: 1 },
	});
	assert.equal(
		territory.seats[0].resources.coin,
		state.seats[0].resources.coin + 1
	);
	assert.deepEqual(territory.seats[1].territoryTiles, [1]);
	assert.deepEqual(territory.seats[0].territoryTiles, []);
	assert.deepEqual(openDecisions(territory), []);
});

test("option 2 never takes the Monolith's space tile: a copied landmark benefit gives nothing, as option 4 prints (#33 ruling)", () => {
	// Space tile 19 places the Monolith; tile 13 gives 13 VP.
	assert.equal(spiesOffered(spiesGame({ 2: { space: [19] } })), null);
	const { state, random } = spiesGame({ 2: { space: [19, 13] } });
	assert.deepEqual(spiesOffered({ state, random }), [2]);
	// Tile 13 is the only one left, so it is taken without asking; the Monolith stays for the neighbour.
	const taken = spy(state, random, 2);
	assert.deepEqual(eventsOf(taken, 'spiesUsed', state.seq), [
		{
			type: 'spiesUsed',
			player: 1,
			option: 2,
			from: 2,
			stack: 'space',
			tile: 13,
		},
	]);
	assert.equal(taken.seats[0].vp, state.seats[0].vp + 13);
	assert.ok(taken.landmarks.includes('monolith'));
	assert.deepEqual(taken.seats[1].spaceTiles, [19, 13]);
	assert.deepEqual(openDecisions(taken), []);
});

test("an ongoing space tile taken with option 2 gives the Spies 5 VP for each advance on its track while it stays in the neighbour's supply, and stops once they explore it (03 §1.3, §1.5)", () => {
	// Tile 16: 5 VP whenever its player advances on Technology.
	const { state, random } = spiesGame({ 2: { space: [16] } });
	for (const seat of state.seats) {
		seat.resources = { coin: 8, worker: 8, food: 8, culture: 8 };
	}
	const watched = spy(state, random, 2);
	assert.deepEqual(watched.seats[0].civData.spies.watching, [
		{ tile: 16, from: 2 },
	]);
	assert.equal(watched.seats[0].vp, state.seats[0].vp);
	// Watching takes nothing: the tile stays in the neighbour's supply alone.
	assert.deepEqual(watched.seats[1].spaceTiles, [16]);
	assert.deepEqual(
		[watched.seats[0].spaceTiles, watched.seats[0].exploredSpace],
		[[], []]
	);
	assert.deepEqual(openDecisions(watched), []);

	assert.deepEqual(spaceTileVp(watched, random, 1, 'technology'), [5]);
	assert.deepEqual(spaceTileVp(watched, random, 1, 'science'), []);
	// The neighbour has not explored it, so it gives them nothing.
	assert.deepEqual(spaceTileVp(watched, random, 2, 'technology'), []);

	// Once the neighbour explores it, it is theirs alone.
	const explored = resolveEffects(watched, 2, [{ exploreSpace: {} }], random);
	assert.deepEqual(explored.seats[1].exploredSpace, [16]);
	assert.deepEqual(spaceTileVp(explored, random, 1, 'technology'), []);
	assert.deepEqual(spaceTileVp(explored, random, 2, 'technology'), [5]);
});

test("option 3 gains the benefit of a neighbour's track space for the Spies alone, with no bonus for anyone, except a space they activated this turn (03 §1.3, R19)", () => {
	// Carpentry (technology 2): 1 tapestry card, and a bonus. Standing Army (military 4): 1 worker and 1 VP per territory tile.
	const { state, random } = spiesGame({
		2: { tracks: { technology: [2], military: [4] } },
	});
	for (const seat of state.seats) {
		seat.resources = { coin: 3, worker: 0, food: 0, culture: 0 };
	}
	const asked = spy(state, random, 3);
	const decision = /** @type {any} */ (decisionOf(asked, 'chooseSlot'));
	assert.deepEqual(
		[decision.purpose, decision.optional, decision.options],
		[
			'spiesSpace',
			false,
			[
				{ player: 2, track: 'technology', space: 2 },
				{ player: 2, track: 'military', space: 4 },
			],
		]
	);
	const since = asked.seq;
	const gained = answer(asked, random, 1, 'chooseSlot', {
		slot: { player: 2, track: 'technology', space: 2 },
	});
	const [own, other] = /** @type {any[]} */ (gained.seats);
	assert.equal(own.hand.length, 1);
	assert.deepEqual(own.tracks, state.seats[0].tracks);
	assert.deepEqual(other.hand, []);
	assert.deepEqual(other.resources, state.seats[1].resources);
	assert.equal(decisionOf(gained, 'chooseBonus'), undefined);
	assert.deepEqual(eventsOf(gained, 'spaceActivated', since), [
		{ type: 'spaceActivated', player: 1, track: 'technology', space: 2 },
	]);
	assert.deepEqual(openDecisions(gained), []);

	// R19: a space the Spies activated this turn is left out, so the other is taken without asking.
	state.activated = [{ player: 1, track: 'technology', space: 2 }];
	const military = spy(state, random, 3);
	assert.equal(military.seats[0].resources.worker, 1);
	assert.deepEqual(military.seats[0].hand, []);
	assert.deepEqual(openDecisions(military), []);
});

test("option 4 gains the circle of a neighbour's middle-row tech card or the square of a top-row one; a landmark card's square gives nothing, so it is not offered (03 §1.3)", () => {
	// Canned Food's circle: 1 food. Calendar's square: 7 VP. Bakery's square: its landmark.
	const { state, random } = spiesGame({
		2: { tech: { middle: ['canned-food'], top: ['calendar', 'bakery'] } },
	});
	const asked = spy(state, random, 4);
	const decision = /** @type {any} */ (decisionOf(asked, 'chooseSlot'));
	assert.deepEqual(
		[decision.purpose, decision.optional, decision.options],
		[
			'spiesTech',
			false,
			[
				{ player: 2, card: 'canned-food', icon: 'circle' },
				{ player: 2, card: 'calendar', icon: 'square' },
			],
		]
	);
	const since = asked.seq;
	const square = answer(asked, random, 1, 'chooseSlot', {
		slot: { player: 2, card: 'calendar', icon: 'square' },
	});
	assert.deepEqual(
		eventsOf(square, 'vpGained', since).map((e) => [e.vp, e.source]),
		[[7, 'tech']]
	);
	assert.deepEqual(eventsOf(square, 'techBenefitUsed', since), [
		{
			type: 'techBenefitUsed',
			player: 1,
			card: 'calendar',
			icon: 'square',
		},
	]);
	assert.deepEqual(square.seats[1].tech, state.seats[1].tech);
	assert.deepEqual(square.seats[0].tech, state.seats[0].tech);
	assert.deepEqual(openDecisions(square), []);

	const circle = answer(asked, random, 1, 'chooseSlot', {
		slot: { player: 2, card: 'canned-food', icon: 'circle' },
	});
	assert.equal(
		circle.seats[0].resources.food,
		state.seats[0].resources.food + 1
	);
	assert.deepEqual(openDecisions(circle), []);

	assert.equal(
		spiesOffered(spiesGame({ 2: { tech: { top: ['bakery'] } } })),
		null
	);
});

test("after the benefit the Spies may look at that neighbour's hand, which only the Spies see, and undo closes (03 §1.3, #24)", () => {
	const { state, random } = spiesGame({
		2: { mat: [['trap-1']], hand: ['academia', 'alliance'] },
	});
	const asked = spy(state, random, 1);
	// The trap's 10 VP come first, then the question.
	assert.equal(asked.seats[0].vp, state.seats[0].vp + 10);
	const decision = /** @type {any} */ (decisionOf(asked, 'chooseSlot'));
	assert.deepEqual(
		[decision.player, decision.purpose, decision.optional],
		[1, 'spiesLook', true]
	);
	assert.deepEqual(answersOf(asked, 'chooseSlot'), [
		{ slot: null },
		{ slot: 2 },
	]);

	const declined = answer(asked, random, 1, 'chooseSlot', { slot: null });
	assert.deepEqual(eventsOf(declined, 'handSeen', state.seq), []);
	assert.deepEqual(openDecisions(declined), []);
	assert.equal(revealed(state, declined), false);

	const looked = answer(asked, random, 1, 'chooseSlot', { slot: 2 });
	assert.deepEqual(eventsOf(looked, 'handSeen', state.seq), [
		{
			type: 'handSeen',
			player: 1,
			from: 2,
			secret: { cards: ['academia', 'alliance'] },
		},
	]);
	assert.deepEqual(looked.seats[1].hand, ['academia', 'alliance']);
	assert.deepEqual(looked.seats[0].hand, []);
	assert.deepEqual(openDecisions(looked), []);
	const seen = (/** @type {number | null} */ seat) =>
		/** @type {any} */ (view(looked, seat)).events.find(
			(/** @type {any} */ e) => e.type === 'handSeen'
		);
	assert.deepEqual(seen(1)?.secret, { cards: ['academia', 'alliance'] });
	assert.deepEqual(
		[seen(2)?.from, seen(2)?.secret, seen(null)?.secret],
		[2, undefined, undefined]
	);
	assert.ok(revealed(asked, looked));
	checkViews(looked, setupFacts(state), { before: asked });

	// With an empty hand there is nothing to look at.
	const empty = spiesGame({ 2: { mat: [['trap-1']] } });
	assert.deepEqual(openDecisions(spy(empty.state, empty.random, 1)), []);
});

test('the Spies look at the hand of the neighbour they took from, not the other (03 §1.3)', () => {
	const { state, random } = spiesGame(
		{
			2: { hand: ['academia'] },
			3: { mat: [['trap-1']], hand: ['alliance'] },
		},
		{ count: 3 }
	);
	const asked = spy(state, random, 1);
	assert.deepEqual(answersOf(asked, 'chooseSlot'), [
		{ slot: null },
		{ slot: 3 },
	]);
	const looked = answer(asked, random, 1, 'chooseSlot', { slot: 3 });
	assert.deepEqual(eventsOf(looked, 'handSeen', state.seq), [
		{
			type: 'handSeen',
			player: 1,
			from: 3,
			secret: { cards: ['alliance'] },
		},
	]);
});

test('Spies lose 1 resource of their choice at the end of income turn 1, only in the current version and only when they start with them (R34)', () => {
	for (const version of VERSIONS) {
		const r = turnHolding(
			'spies',
			(seat) => {
				seat.incomeTurns = 0;
				seat.resources = { coin: 2, worker: 0, food: 1, culture: 0 };
			},
			{ version }
		);
		const seat = /** @type {any} */ (r.state.seats[r.player - 1]);
		const pick = /** @type {any} */ (decisionOf(r.state, 'chooseSlot'));
		if (version === 'original') {
			assert.equal(pick, undefined);
			// Only income turn 1's income: 1 of each.
			assert.deepEqual(seat.resources, {
				coin: 3,
				worker: 1,
				food: 2,
				culture: 1,
			});
			continue;
		}
		assert.deepEqual(
			[pick.player, pick.purpose, pick.options],
			[r.player, 'loseResource', ['coin', 'worker', 'food', 'culture']]
		);
		const paid = answer(r.state, r.random, r.player, 'chooseSlot', {
			slot: 'food',
		});
		assert.deepEqual(paid.seats[r.player - 1].resources, {
			coin: 3,
			worker: 1,
			food: 1,
			culture: 1,
		});
	}
	// Spies gained mid-game lose nothing (R34).
	const gained = turnHolding(
		'spies',
		(seat) => {
			seat.incomeTurns = 0;
			seat.civs = ['leaders', 'spies'];
		},
		{ version: 'current' }
	);
	assert.deepEqual(
		eventsOf(gained.state, 'resourcesLost').filter(
			(e) => e.player === gained.player
		),
		[]
	);
});

test('Spies use their ability in step 1 of income turns 2 to 5', () => {
	const ready = turnHolding('spies', (seat, state) => {
		for (const other of state.seats) {
			if (other !== seat) {
				other.tracks.science = [5];
			}
		}
	});
	const { player } = ready;
	const since = ready.state.seq;
	const state = answer(ready.state, ready.random, player, 'chooseTurn', {
		turn: 'income',
	});
	assert.ok(
		eventsOf(state, 'civAbilityUsed', since).some((e) => e.civ === 'spies')
	);
	const decision = /** @type {any} */ (decisionOf(state, 'chooseSlot'));
	assert.deepEqual([decision?.player, decision?.purpose], [player, 'spies']);
	assert.ok(decision.options.includes(3));
});

// The Utilitarians.

/** The landmarks the Utilitarians' mat lists, in the card's order (03 §1.3). */
const LISTED = [
	'forge',
	'barracks',
	'lighthouse',
	'apothecary',
	'rubber-works',
	'tank-factory',
	'train-station',
	'academy',
];

/**
 * A started two-player game with nothing pending, in which seat 1 holds the Utilitarians, owns `owned` beside its
 * capital mat (out of the supply) and has a token beside each of `active`. The capitals stay as dealt, so the state
 * checks hold.
 * @param {string[]} owned
 * @param {string[]} [active]
 * @returns {{ state: any, random: any }}
 */
function utilitariansGame(owned, active = []) {
	const { state: started, random } = startedGame(2, PP);
	const state = /** @type {any} */ (structuredClone(started));
	state.pending.length = 0;
	const seat = state.seats[0];
	seat.civs = ['utilitarians'];
	seat.civData.utilitarians = { active: [...active] };
	state.landmarks = state.landmarks.filter(
		(/** @type {string} */ id) => !owned.includes(id)
	);
	seat.besideMat.push(...owned);
	state.supply.civs = state.supply.civs.filter(
		(/** @type {string} */ civ) => civ !== 'utilitarians'
	);
	return { state, random };
}

/** The Utilitarians' setup, at the start or mid-game. */
const utilitariansSetup = (/** @type {boolean} */ midGame) => ({
	player: 1,
	kind: 'civSetup',
	civ: 'utilitarians',
	midGame,
	origin: 'civ',
});

/**
 * Seat 1 gains a landmark through the landmark effect, every placement answered with its first answer.
 * @param {any} state
 * @param {any} random
 * @param {string} landmark
 */
function gainLandmark(state, random, landmark) {
	return placeAll(resolveEffects(state, 1, [{ landmark }], random), random);
}

/**
 * The VP seat 1's civilization gains for one advance on a track, each open decision answered with its first answer.
 * @param {any} from
 * @param {any} random
 * @param {string} track
 * @returns {number[]}
 */
function civVp(from, random, track) {
	let next = resolveEffects(
		from,
		1,
		[{ advance: { tracks: [track], noBenefit: true } }],
		random
	);
	for (;;) {
		const [open] = openDecisions(next);
		if (!open) {
			break;
		}
		next = answerFirst(next, random, open.player, open.kind);
	}
	return eventsOf(next, 'vpGained', from.seq)
		.filter((e) => e.source === 'civ' && e.player === 1)
		.map((e) => e.vp);
}

test('Utilitarians who start the game choose a tier II track landmark nobody owns and place it, with a token beside it; the other token stays on the mat (03 §1.3, R113)', () => {
	const { state, random } = utilitariansGame([]);
	delete state.seats[0].civData.utilitarians;
	// Another seat owns the Barracks, so only the other three are offered.
	state.landmarks = state.landmarks.filter(
		(/** @type {string} */ id) => id !== 'barracks'
	);
	state.seats[1].besideMat.push('barracks');
	const asked = pushed(state, random, [utilitariansSetup(false)]);
	const pick = /** @type {any} */ (decisionOf(asked, 'chooseSlot'));
	assert.deepEqual(
		[pick.player, pick.purpose, pick.optional, pick.options],
		[
			1,
			'utilitariansLandmark',
			false,
			['forge', 'lighthouse', 'apothecary'],
		]
	);
	const chosen = placeAll(
		answer(asked, random, 1, 'chooseSlot', { slot: 'lighthouse' }),
		random
	);
	const seat = chosen.seats[0];
	assert.deepEqual(seat.civData.utilitarians, { active: ['lighthouse'] });
	assert.deepEqual(
		seat.capital.landmarks.map(
			(/** @type {any} */ piece) => piece.landmark
		),
		['lighthouse']
	);
	assert.ok(!chosen.landmarks.includes('lighthouse'));
	// Gained from the civilization, not from a track.
	assert.deepEqual(eventsOf(chosen, 'landmarkGained', state.seq), [
		{
			type: 'landmarkGained',
			player: 1,
			landmark: 'lighthouse',
			civ: 'utilitarians',
		},
	]);
	assert.deepEqual(eventsOf(chosen, 'utilitariansToken', state.seq), [
		{ type: 'utilitariansToken', player: 1, landmark: 'lighthouse' },
	]);
	// Its token is beside it already: nothing more is asked.
	assert.deepEqual(openDecisions(chosen), []);

	// In a game, in both versions, setup's first answer is the Forge.
	for (const version of VERSIONS) {
		const { state: started } = startedGame(2, {
			civs: ['utilitarians', 'nomads'],
			version,
			...PP,
		});
		const own = /** @type {any} */ (started.seats[0]);
		assert.deepEqual(own.civData.utilitarians, { active: ['forge'] });
		assert.deepEqual(
			own.capital.landmarks.map((/** @type {any} */ p) => p.landmark),
			['forge'],
			version
		);
		checkState(started);
	}
});

test("the state checks hold the Utilitarians' tokens beside listed landmarks they own, 2 at most and each once", () => {
	const { state } = startedGame(2, {
		civs: ['utilitarians', 'leaders'],
		...PP,
	});
	const seat = /** @type {any} */ (state.seats[0]);
	state.landmarks = state.landmarks.filter(
		(/** @type {string} */ id) => id !== 'academy' && id !== 'launch-pad'
	);
	seat.besideMat.push('academy', 'launch-pad');
	seat.civData.utilitarians.active = ['forge', 'academy'];
	checkState(state);
	for (const active of [
		['forge', 'academy', 'barracks'],
		['forge', 'forge'],
		['forge', 'barracks'],
		['launch-pad'],
	]) {
		const broken = /** @type {any} */ (structuredClone(state));
		broken.seats[0].civData.utilitarians.active = active;
		assert.throws(() => checkState(broken), /utilitarians/, `${active}`);
	}
});

test('Utilitarians gained mid-game gain no landmark, and may put up to 2 tokens beside listed landmarks they already own (03 §1.3, R113)', () => {
	const { state, random } = utilitariansGame([
		'launch-pad',
		'lighthouse',
		'forge',
		'academy',
	]);
	const seat = state.seats[0];
	seat.civs = ['leaders'];
	delete seat.civData.utilitarians;
	state.supply.civs = [
		'utilitarians',
		...state.supply.civs.filter(
			(/** @type {string} */ civ) => civ !== 'leaders'
		),
	];
	const landmarks = [...state.landmarks];
	const asked = resolveEffects(state, 1, [{ gainCiv: {} }], random);
	assert.deepEqual(asked.seats[0].civs, ['leaders', 'utilitarians']);
	assert.deepEqual(asked.seats[0].civData.utilitarians, { active: [] });
	const first = /** @type {any} */ (decisionOf(asked, 'chooseSlot'));
	// In the card's order; the Launch Pad isn't listed.
	assert.deepEqual(
		[first.player, first.purpose, first.optional, first.options],
		[1, 'utilitariansPlace', true, ['forge', 'lighthouse', 'academy']]
	);
	const one = answer(asked, random, 1, 'chooseSlot', { slot: 'academy' });
	assert.deepEqual(
		/** @type {any} */ (decisionOf(one, 'chooseSlot')).options,
		['forge', 'lighthouse']
	);
	const two = answer(one, random, 1, 'chooseSlot', { slot: 'forge' });
	assert.deepEqual(two.seats[0].civData.utilitarians, {
		active: ['academy', 'forge'],
	});
	// Both tokens are out: nothing more is asked, and no landmark was gained.
	assert.deepEqual(openDecisions(two), []);
	assert.deepEqual(two.landmarks, landmarks);
	assert.deepEqual(eventsOf(two, 'landmarkGained', state.seq), []);
	assert.deepEqual(eventsOf(two, 'utilitariansToken', state.seq), [
		{ type: 'utilitariansToken', player: 1, landmark: 'academy' },
		{ type: 'utilitariansToken', player: 1, landmark: 'forge' },
	]);
	// Declining keeps both tokens on the mat.
	const declined = answer(asked, random, 1, 'chooseSlot', { slot: null });
	assert.deepEqual(declined.seats[0].civData.utilitarians, { active: [] });
	assert.deepEqual(openDecisions(declined), []);
	// Without a listed landmark, nothing is asked.
	const bare = utilitariansGame(['launch-pad']);
	delete bare.state.seats[0].civData.utilitarians;
	const none = pushed(bare.state, bare.random, [utilitariansSetup(true)]);
	assert.deepEqual(none.seats[0].civData.utilitarians, { active: [] });
	assert.deepEqual(openDecisions(none), []);
});

test('after gaining a listed landmark the Utilitarians may put a token from their mat beside it, or with both out move one there; an unlisted landmark asks nothing (03 §1.3)', () => {
	const { state, random } = utilitariansGame(['forge'], ['forge']);
	const barracks = gainLandmark(state, random, 'barracks');
	const offer = /** @type {any} */ (decisionOf(barracks, 'chooseSlot'));
	assert.deepEqual(
		[offer.player, offer.purpose, offer.optional, offer.options],
		[1, 'utilitariansToken', true, [{ landmark: 'barracks', from: 'mat' }]]
	);
	const placed = answer(barracks, random, 1, 'chooseSlot', {
		slot: { landmark: 'barracks', from: 'mat' },
	});
	assert.deepEqual(placed.seats[0].civData.utilitarians.active, [
		'forge',
		'barracks',
	]);
	assert.deepEqual(eventsOf(placed, 'utilitariansToken', barracks.seq), [
		{ type: 'utilitariansToken', player: 1, landmark: 'barracks' },
	]);

	// Both tokens are out: the next listed landmark may take either.
	const academy = gainLandmark(placed, random, 'academy');
	assert.deepEqual(
		/** @type {any} */ (decisionOf(academy, 'chooseSlot')).options,
		[
			{ landmark: 'academy', from: 'forge' },
			{ landmark: 'academy', from: 'barracks' },
		]
	);
	const moved = answer(academy, random, 1, 'chooseSlot', {
		slot: { landmark: 'academy', from: 'forge' },
	});
	assert.deepEqual(moved.seats[0].civData.utilitarians.active, [
		'academy',
		'barracks',
	]);
	assert.deepEqual(eventsOf(moved, 'utilitariansToken', academy.seq), [
		{
			type: 'utilitariansToken',
			player: 1,
			landmark: 'academy',
			from: 'forge',
		},
	]);
	const kept = answer(academy, random, 1, 'chooseSlot', { slot: null });
	assert.deepEqual(kept.seats[0].civData.utilitarians.active, [
		'forge',
		'barracks',
	]);

	// An unlisted landmark asks nothing.
	const launchPad = gainLandmark(placed, random, 'launch-pad');
	assert.equal(decisionOf(launchPad, 'chooseSlot'), undefined);
	assert.deepEqual(openDecisions(launchPad), []);
});

test('the Forge: while its token is out, each of their own upgrades to the top row also gains 1 resource of their choice (03 §1.3)', () => {
	/**
	 * Seat 1 upgrades Calendar from `row`.
	 * @param {string[]} active
	 * @param {'bottom' | 'middle'} row
	 */
	const upgraded = (active, row) => {
		const { state, random } = utilitariansGame(['forge'], active);
		takeTech(state, ['calendar']);
		// Tier II of exploration, Calendar's prerequisite for the top row.
		state.seats[0].tracks.exploration = [4];
		state.seats[0].tech = {
			bottom: row === 'bottom' ? ['calendar'] : [],
			middle: row === 'middle' ? ['calendar'] : [],
			top: [],
		};
		return {
			state,
			random,
			next: resolveEffects(state, 1, [{ upgrade: {} }], random),
		};
	};
	const on = upgraded(['forge'], 'middle');
	// Calendar's square first, then the Forge's resource.
	assert.equal(on.next.seats[0].vp, on.state.seats[0].vp + 7);
	const pick = /** @type {any} */ (decisionOf(on.next, 'chooseResource'));
	assert.deepEqual([pick.player, pick.count, pick.from], [1, 1, 'any']);
	const gained = answer(on.next, on.random, 1, 'chooseResource', {
		resources: { food: 1 },
	});
	assert.equal(
		gained.seats[0].resources.food,
		on.state.seats[0].resources.food + 1
	);
	// Off, or to the middle row, nothing more.
	assert.deepEqual(openDecisions(upgraded([], 'middle').next), []);
	assert.deepEqual(openDecisions(upgraded(['forge'], 'bottom').next), []);
	// An Inventors token's upgrade of their card isn't their own (as Golden Age, #20 design §7).
	assert.deepEqual(
		/** @type {any} */ (CIVS.utilitarians.hooks).upgraded(on.state, 1, {
			player: 1,
			card: 'calendar',
			icon: 'square',
			inventors: 2,
		}),
		[]
	);
});

/**
 * A conquest by seat 1, the Utilitarians with these tokens out, of seat 2's lone outpost; seat 2 holds `hand`, so with
 * none nobody is asked to respond.
 * @param {string[]} active
 * @param {string[]} [hand]
 */
function barracksConquest(active, hand = []) {
	const state = /** @type {any} */ (conquestGame(hand, PP));
	state.pending.length = 0;
	const seat = state.seats[0];
	seat.civs = ['utilitarians'];
	seat.civData = { utilitarians: { active: [...active] } };
	state.landmarks = state.landmarks.filter(
		(/** @type {string} */ id) => id !== 'barracks'
	);
	seat.besideMat.push('barracks');
	state.supply.civs = state.supply.civs.filter(
		(/** @type {string} */ civ) => civ !== 'utilitarians'
	);
	return state;
}

test("the Barracks: while its token is out, every conquest also gains the red die's result, even when they kept it; with Tanks they gain it twice (03 §1.3)", () => {
	/**
	 * Seat 1 conquers, the red die showing 5 VP and the black 1 culture, and keeps `die` when asked.
	 * @param {string[]} active
	 * @param {'red' | 'black' | null} die - Null when both dice come (Tanks)
	 */
	const conquest = (active, die) => {
		const state = barracksConquest(active);
		const conquer = die === null ? { bothDice: 'ifOpponent' } : {};
		let next = pushed(state, dice(1, 3), [
			{ player: 1, kind: 'effects', effects: [{ conquer }] },
		]);
		if (die !== null) {
			next = answer(next, dice(), 1, 'chooseDie', { die });
		}
		assert.deepEqual(openDecisions(next), []);
		const [before, after] = [state.seats[0], next.seats[0]];
		return [
			after.vp - before.vp,
			after.resources.culture - before.resources.culture,
			(after.vpSources.civ ?? 0) - (before.vpSources.civ ?? 0),
		];
	};
	assert.deepEqual(conquest(['barracks'], 'black'), [5, 1, 5]);
	assert.deepEqual(conquest(['barracks'], 'red'), [10, 0, 5]);
	assert.deepEqual(conquest(['barracks'], null), [10, 1, 5]);
	assert.deepEqual(conquest([], 'black'), [0, 1, 0]);
	assert.deepEqual(conquest([], null), [5, 1, 0]);
});

test('the Barracks also answer a conquest a trap answered, as the dice always roll (03 §1.3, R107)', () => {
	const state = barracksConquest(['barracks'], ['trap-1']);
	state.supply.tapestry.deck = state.supply.tapestry.deck.filter(
		(/** @type {string} */ card) => card !== 'trap-1'
	);
	const asked = pushed(state, dice(), [
		{ player: 1, kind: 'effects', effects: [{ conquer: {} }] },
	]);
	const trapped = answer(asked, dice(), 2, 'chooseResponse', {
		card: 'trap-1',
	});
	// The trap's resource, then the attacker's dice: red 5 VP, black 1 culture.
	const rolled = answer(trapped, dice(1, 3), 2, 'chooseResource', {
		resources: { coin: 1 },
	});
	assert.deepEqual(eventsOf(rolled, 'conquered', state.seq), [
		{ type: 'conquered', player: 1, hex: '-2_-1', trapped: true },
	]);
	const kept = answer(rolled, dice(), 1, 'chooseDie', { die: 'black' });
	assert.deepEqual(openDecisions(kept), []);
	const [before, after] = [state.seats[0], kept.seats[0]];
	assert.deepEqual(
		[
			after.vp - before.vp,
			after.resources.culture - before.resources.culture,
		],
		[5, 1]
	);
});

test("a base game's conquest is unchanged: nothing but the Utilitarians answers the dice rolled (conquerRolled, #33)", () => {
	assert.deepEqual(
		Object.values(CIVS)
			.filter((civ) => civ.hooks && 'conquerRolled' in civ.hooks)
			.map((civ) => civ.id),
		['utilitarians']
	);
	assert.deepEqual(
		Object.keys(ERA_HOOKS).filter(
			(card) => 'conquerRolled' in ERA_HOOKS[card]
		),
		[]
	);
	// A counted random: the conquest rolls the two dice and nothing more.
	const state = /** @type {any} */ (conquestGame([]));
	state.pending.length = 0;
	let rolls = 0;
	const counted = dice(1, 3);
	const next = pushed(
		state,
		(/** @type {number} */ n) => {
			rolls += 1;
			return counted(n);
		},
		[{ player: 1, kind: 'effects', effects: [{ conquer: {} }] }]
	);
	assert.equal(rolls, 2);
	assert.deepEqual(
		next.pending.map((/** @type {any} */ op) => [
			op.kind,
			op.red,
			op.black,
		]),
		[['chooseDie', 1, 3]]
	);
	// With the Barracks on, its red result waits below the die choice.
	const barracks = pushed(barracksConquest(['barracks']), dice(1, 3), [
		{ player: 1, kind: 'effects', effects: [{ conquer: {} }] },
	]);
	assert.deepEqual(
		barracks.pending.map((/** @type {any} */ op) => [op.kind, op.effects]),
		[
			['chooseDie', undefined],
			['effects', [{ vp: 5 }]],
		]
	);
});

/**
 * A readyTurn() in which the current player holds the Utilitarians, owns the Lighthouse, has a token beside each of
 * `active`, holds `tiles` territory tiles from the stack and these resources, and has its tokens where `tracks` puts
 * them (the others where they stand).
 * @param {string[]} active
 * @param {number} tiles
 * @param {{ resources?: Record<string, number>, tracks?: Record<string, number[]> }} [options]
 */
function lighthouseTurn(active, tiles, { resources, tracks = {} } = {}) {
	return turnHolding('utilitarians', (seat, state) => {
		state.landmarks = state.landmarks.filter(
			(/** @type {string} */ id) => id !== 'lighthouse'
		);
		seat.besideMat.push('lighthouse');
		seat.civData.utilitarians = { active: [...active] };
		seat.territoryTiles = state.supply.territory.splice(0, tiles);
		seat.resources = resources ?? {
			coin: 3,
			worker: 3,
			food: 3,
			culture: 3,
		};
		Object.assign(seat.tracks, structuredClone(tracks));
	});
}

/**
 * Answers an advance turn on: the advance on `track`, then every decision with its first answer, until the player's
 * Lighthouse is offered or their turn is over.
 * @param {any} state - The advance chosen, the advance open
 * @param {any} random
 * @param {number} player
 * @param {string} track
 */
function advanceThrough(state, random, player, track) {
	const advance = /** @type {any} */ (decisionOf(state, 'chooseAdvance'));
	let next = answer(
		state,
		random,
		player,
		'chooseAdvance',
		/** @type {any} */ (
			DECISIONS.chooseAdvance
				.answers(state, advance)
				.find((/** @type {any} */ a) => a.track === track)
		)
	);
	for (let step = 0; step < 50; step++) {
		const [open] = openDecisions(next);
		if (
			!open ||
			next.current !== player ||
			(open.kind === 'chooseTrade' && open.purpose === 'lighthouse')
		) {
			return next;
		}
		next = answerFirst(next, random, open.player, open.kind);
	}
	throw new Error('The advance never ended.');
}

/** The player's open Lighthouse trade, if any. */
const lighthouseOf = (/** @type {any} */ state) =>
	openDecisions(state).find(
		(d) => d.kind === 'chooseTrade' && d.purpose === 'lighthouse'
	);

test('the Lighthouse: while its token is out, each advance turn starts with the offer to discard 2 territory tiles for 1 resource of their choice, before the advance (03 §1.3, §1.8)', () => {
	const r = lighthouseTurn(['lighthouse'], 3);
	const seat = /** @type {any} */ (r.state.seats[r.player - 1]);
	const tiles = [...seat.territoryTiles];
	const asked = answer(r.state, r.random, r.player, 'chooseTurn', {
		turn: 'advance',
	});
	assert.equal(decisionOf(asked, 'chooseAdvance'), undefined);
	const trade = /** @type {any} */ (decisionOf(asked, 'chooseTrade'));
	assert.deepEqual(
		[trade.player, trade.purpose, trade.optional, trade.offers],
		[
			r.player,
			'lighthouse',
			true,
			[{ pay: { territory: 2 }, gain: [{ gain: { any: 1 } }] }],
		]
	);
	assert.deepEqual(answersOf(asked, 'chooseTrade'), [
		{ offer: null },
		{ offer: 0, pay: { territory: [tiles[0], tiles[1]] } },
		{ offer: 0, pay: { territory: [tiles[0], tiles[2]] } },
		{ offer: 0, pay: { territory: [tiles[1], tiles[2]] } },
	]);
	const traded = answer(
		answer(asked, r.random, r.player, 'chooseTrade', {
			offer: 0,
			pay: { territory: [tiles[0], tiles[2]] },
		}),
		r.random,
		r.player,
		'chooseResource',
		{ resources: { coin: 1 } }
	);
	const after = /** @type {any} */ (traded.seats[r.player - 1]);
	assert.deepEqual(after.territoryTiles, [tiles[1]]);
	assert.ok(
		[tiles[0], tiles[2]].every((t) =>
			traded.supply.territoryDiscard.includes(t)
		)
	);
	assert.equal(after.resources.coin, 4);
	// Then the advance; used once, it isn't offered again after it.
	assert.equal(
		/** @type {any} */ (decisionOf(traded, 'chooseAdvance'))?.player,
		r.player
	);
	const done = advanceThrough(traded, r.random, r.player, 'science');
	assert.equal(lighthouseOf(done), undefined);
	assert.notEqual(done.current, r.player);
	const declined = answer(asked, r.random, r.player, 'chooseTrade', {
		offer: null,
	});
	assert.ok(decisionOf(declined, 'chooseAdvance'));
	assert.deepEqual(declined.seats[r.player - 1].territoryTiles, tiles);
	// Declined at the start, it is offered once more after the advance, and only once.
	const later = advanceThrough(declined, r.random, r.player, 'science');
	const again = /** @type {any} */ (lighthouseOf(later));
	assert.deepEqual(
		[again?.player, again?.optional, again?.offers],
		[
			r.player,
			true,
			[{ pay: { territory: 2 }, gain: [{ gain: { any: 1 } }] }],
		]
	);
	const passed = answer(later, r.random, r.player, 'chooseTrade', {
		offer: null,
	});
	assert.equal(lighthouseOf(passed), undefined);
	assert.notEqual(passed.current, r.player);

	// Off, or with a single tile: no offer.
	for (const [active, count] of /** @type {[string[], number][]} */ ([
		[[], 3],
		[['lighthouse'], 1],
	])) {
		const other = lighthouseTurn(active, count);
		const next = answer(
			other.state,
			other.random,
			other.player,
			'chooseTurn',
			{ turn: 'advance' }
		);
		assert.equal(decisionOf(next, 'chooseTrade'), undefined, `${active}`);
		assert.ok(decisionOf(next, 'chooseAdvance'), `${active}`);
	}
	// Nor on an income turn.
	const income = answer(r.state, r.random, r.player, 'chooseTurn', {
		turn: 'income',
	});
	assert.equal(decisionOf(income, 'chooseTrade'), undefined);
});

test('the Lighthouse unused at the start of an advance turn is offered after the advance, so tiles the advance gave can be spent (03 §1.3, §1.8)', () => {
	// No tile at the start: nothing is offered before the advance.
	const r = lighthouseTurn(['lighthouse'], 0);
	const asked = answer(r.state, r.random, r.player, 'chooseTurn', {
		turn: 'advance',
	});
	assert.equal(lighthouseOf(asked), undefined);
	// Scouting gives 2 territory tiles, which the Lighthouse then takes.
	const later = advanceThrough(asked, r.random, r.player, 'exploration');
	const tiles = /** @type {any} */ (later.seats[r.player - 1]).territoryTiles;
	assert.equal(tiles.length, 2);
	assert.deepEqual(answersOf(later, 'chooseTrade'), [
		{ offer: null },
		{ offer: 0, pay: { territory: tiles } },
	]);
	const traded = answer(
		answer(later, r.random, r.player, 'chooseTrade', {
			offer: 0,
			pay: { territory: tiles },
		}),
		r.random,
		r.player,
		'chooseResource',
		{ resources: { worker: 1 } }
	);
	assert.deepEqual(traded.seats[r.player - 1].territoryTiles, []);
	assert.equal(lighthouseOf(traded), undefined);
	assert.notEqual(traded.current, r.player);
	// Off, nothing after the advance either.
	const off = lighthouseTurn([], 0);
	const offAsked = answer(off.state, off.random, off.player, 'chooseTurn', {
		turn: 'advance',
	});
	const offDone = advanceThrough(
		offAsked,
		off.random,
		off.player,
		'exploration'
	);
	assert.equal(lighthouseOf(offDone), undefined);
	assert.notEqual(offDone.current, off.player);
});

test('a player who can afford an advance only with the Lighthouse may take an advance turn: it opens with the Lighthouse, which must pay for a resource that opens an advance (03 §1.3, §1.8)', () => {
	// One coin; exploration's next space costs 1 food and 1 resource, the other tracks are finished.
	const tracks = {
		exploration: [3],
		science: [12],
		technology: [12],
		military: [12],
	};
	const resources = { coin: 1, worker: 0, food: 0, culture: 0 };
	const r = lighthouseTurn(['lighthouse'], 3, { resources, tracks });
	const turn = /** @type {any} */ (decisionOf(r.state, 'chooseTurn'));
	assert.deepEqual(turn.options, ['income', 'advance']);
	const asked = answer(r.state, r.random, r.player, 'chooseTurn', {
		turn: 'advance',
	});
	const trade = /** @type {any} */ (lighthouseOf(asked));
	assert.deepEqual(
		[trade?.player, trade?.optional, trade?.offers],
		[
			r.player,
			false,
			[{ pay: { territory: 2 }, gain: [{ gain: { food: 1 } }] }],
		]
	);
	const tiles = [
		.../** @type {any} */ (r.state.seats[r.player - 1]).territoryTiles,
	];
	assert.deepEqual(answersOf(asked, 'chooseTrade'), [
		{ offer: 0, pay: { territory: [tiles[0], tiles[1]] } },
		{ offer: 0, pay: { territory: [tiles[0], tiles[2]] } },
		{ offer: 0, pay: { territory: [tiles[1], tiles[2]] } },
	]);
	const traded = answer(asked, r.random, r.player, 'chooseTrade', {
		offer: 0,
		pay: { territory: [tiles[0], tiles[1]] },
	});
	assert.equal(traded.seats[r.player - 1].resources.food, 1);
	assert.deepEqual(
		answersOf(traded, 'chooseAdvance').map((a) => [a.track, a.from]),
		[['exploration', 3]]
	);
	// It was used at the start, so it isn't offered after the advance.
	const done = advanceThrough(traded, r.random, r.player, 'exploration');
	assert.equal(lighthouseOf(done), undefined);

	// Off, with a single tile, or with nothing one more resource opens: an income turn only.
	for (const [
		active,
		count,
		coin,
	] of /** @type {[string[], number, number][]} */ ([
		[[], 3, 1],
		[['lighthouse'], 1, 1],
		[['lighthouse'], 3, 0],
	])) {
		const other = lighthouseTurn(active, count, {
			resources: { ...resources, coin },
			tracks,
		});
		assert.deepEqual(
			/** @type {any} */ (decisionOf(other.state, 'chooseTurn')).options,
			['income'],
			`${active} ${count} ${coin}`
		);
	}
	// Only the Utilitarians open an advance turn so: a base game's turn choice is unchanged.
	assert.deepEqual(
		Object.values(CIVS)
			.filter((civ) => civ.opensAdvance)
			.map((civ) => civ.id),
		['utilitarians']
	);
});

test('the Apothecary: while its token is out, gaining another landmark gains 1 resource of their choice; the Apothecary chosen at setup gives none (03 §1.3)', () => {
	const on = utilitariansGame(['apothecary'], ['apothecary']);
	const gained = gainLandmark(on.state, on.random, 'launch-pad');
	const pick = /** @type {any} */ (decisionOf(gained, 'chooseResource'));
	assert.deepEqual([pick.player, pick.count, pick.from], [1, 1, 'any']);
	// A listed landmark also offers a token, after the resource.
	const forge = gainLandmark(on.state, on.random, 'forge');
	const took = answer(forge, on.random, 1, 'chooseResource', {
		resources: { worker: 1 },
	});
	assert.equal(
		/** @type {any} */ (decisionOf(took, 'chooseSlot'))?.purpose,
		'utilitariansToken'
	);
	// Off: nothing.
	const off = utilitariansGame(['apothecary'], []);
	assert.deepEqual(
		openDecisions(gainLandmark(off.state, off.random, 'launch-pad')),
		[]
	);
	// Chosen at setup, the Apothecary is not another landmark.
	const start = utilitariansGame([]);
	delete start.state.seats[0].civData.utilitarians;
	const asked = pushed(start.state, start.random, [utilitariansSetup(false)]);
	const chosen = placeAll(
		answer(asked, start.random, 1, 'chooseSlot', { slot: 'apothecary' }),
		start.random
	);
	assert.deepEqual(chosen.seats[0].civData.utilitarians, {
		active: ['apothecary'],
	});
	assert.deepEqual(openDecisions(chosen), []);
});

test('Rubber Works, Tank Factory, Train Station and Academy: while its token is out, each advance into tier III or IV of its track gains 4 VP (03 §1.3)', () => {
	const pairs = /** @type {const} */ ([
		['rubber-works', 'technology'],
		['tank-factory', 'military'],
		['train-station', 'exploration'],
		['academy', 'science'],
	]);
	assert.deepEqual(
		pairs.map(([landmark]) => landmark),
		LISTED.slice(4)
	);
	for (const [landmark, track] of pairs) {
		/**
		 * The civilization's VP for an advance from `from` on `on`, with these tokens out.
		 * @param {string[]} active
		 * @param {string} on
		 * @param {number} from
		 */
		const vp = (active, on, from) => {
			const { state, random } = utilitariansGame([landmark], active);
			state.seats[0].tracks[on] = [from];
			return civVp(state, random, on);
		};
		assert.deepEqual(vp([landmark], track, 6), [4], `${landmark} 6`);
		assert.deepEqual(vp([landmark], track, 10), [4], `${landmark} 10`);
		assert.deepEqual(vp([landmark], track, 5), [], `${landmark} 5`);
		assert.deepEqual(vp([], track, 6), [], `${landmark} off`);
		const other = pairs.find(([, t]) => t !== track)?.[1] ?? track;
		assert.deepEqual(vp([landmark], other, 6), [], `${landmark} ${other}`);
	}
});

test('Utilitarians lose 1 resource of their choice at the end of income turn 1, only in the current version and only when they start with them (R34)', () => {
	for (const version of VERSIONS) {
		const r = turnHolding(
			'utilitarians',
			(seat) => {
				seat.incomeTurns = 0;
				seat.resources = { coin: 2, worker: 0, food: 1, culture: 0 };
			},
			{ version }
		);
		const seat = /** @type {any} */ (r.state.seats[r.player - 1]);
		const pick = /** @type {any} */ (decisionOf(r.state, 'chooseSlot'));
		if (version === 'original') {
			assert.equal(pick, undefined);
			assert.deepEqual(seat.resources, {
				coin: 3,
				worker: 1,
				food: 2,
				culture: 1,
			});
			continue;
		}
		assert.deepEqual(
			[pick.player, pick.purpose, pick.options],
			[r.player, 'loseResource', ['coin', 'worker', 'food', 'culture']]
		);
		const paid = answer(r.state, r.random, r.player, 'chooseSlot', {
			slot: 'coin',
		});
		assert.deepEqual(paid.seats[r.player - 1].resources, {
			coin: 2,
			worker: 1,
			food: 2,
			culture: 1,
		});
	}
	// Gained mid-game, they lose nothing (R34).
	const gained = turnHolding(
		'utilitarians',
		(seat) => {
			seat.incomeTurns = 0;
			seat.civs = ['leaders', 'utilitarians'];
		},
		{ version: 'current' }
	);
	assert.deepEqual(
		eventsOf(gained.state, 'resourcesLost').filter(
			(e) => e.player === gained.player
		),
		[]
	);
});

// The Infiltrators.

/** Their id, also the civilization of their tokens on the map. */
const IN = 'infiltrators';

/** Whether a territory tile's benefit is 1 coin. */
const coinTile = (/** @type {number} */ tile) =>
	JSON.stringify(TERRITORY_TILES[tile - 1].benefit) ===
	JSON.stringify([{ gain: { coin: 1 } }]);

/**
 * A started game for `count` players in which seat 1 holds the Infiltrators, its turn choice still open, so the state
 * checks hold. Each seat keeps its two outposts on its starting territory; `lone` stands one upright outpost of a seat,
 * taken from its supply, on each hex it names, an unexplored one getting a territory tile from the stack whose benefit
 * is 1 coin.
 * @param {Record<string, number>} [lone] - The seat of the lone outpost, by hex
 * @param {{ count?: number }} [options]
 * @returns {{ state: any, random: any }}
 */
function infiltratorsGame(lone = {}, { count = 2 } = {}) {
	const { state: started, random } = startedGame(count, PP);
	const state = /** @type {any} */ (structuredClone(started));
	state.seats[0].civs = [IN];
	state.supply.civs = state.supply.civs.filter(
		(/** @type {string} */ c) => c !== IN
	);
	for (const [hex, seat] of Object.entries(lone)) {
		if (state.hexes[hex].tile === null) {
			const tile = state.supply.territory.find(coinTile);
			state.supply.territory.splice(
				state.supply.territory.indexOf(tile),
				1
			);
			state.hexes[hex].tile = tile;
		}
		state.hexes[hex].outposts = [{ seat, toppled: false }];
		state.seats[seat - 1].outposts -= 1;
	}
	return { state, random };
}

/** The Infiltrators' ability on an income turn. */
const infiltratorsIncome = (/** @type {number} */ turn) => ({
	player: 1,
	kind: 'civIncome',
	civ: IN,
	turn,
	origin: 'civ',
});

/**
 * Seat 1's income ability, then the hex picked.
 * @param {any} state
 * @param {any} random
 * @param {string} hex
 */
function infiltrate(state, random, hex) {
	const asked = pushed(state, random, [infiltratorsIncome(2)]);
	return answer(asked, random, 1, 'chooseHex', { hex });
}

/**
 * Asserts that the Infiltrators' ability left nothing to answer: only the turn choice open before it.
 * @param {any} next
 * @param {any} before
 */
const asksNothing = (next, before) =>
	assert.deepEqual(openDecisions(next), openDecisions(before));

/** A seat's capital-city territory, where its two outposts started. */
const startOf = (/** @type {any} */ state, /** @type {number} */ seat) =>
	state.seats[seat - 1].start;

test('Infiltrators gain 1 culture when they come in: at setup only under the original rules, and when gained mid-game under both (03 §1.3, §6, R34, R113)', () => {
	for (const version of VERSIONS) {
		const { state } = startedGame(2, {
			civs: [IN, 'leaders'],
			version,
			...PP,
		});
		const base = /** @type {any} */ (
			startedGame(2, { civs: ['leaders', 'nomads'], version, ...PP })
				.state
		);
		const seat = /** @type {any} */ (state.seats[0]);
		assert.deepEqual(seat.civs, [IN], version);
		const culture = version === 'original' ? 1 : 0;
		assert.deepEqual(
			seat.resources,
			{
				...base.seats[0].resources,
				culture: base.seats[0].resources.culture + culture,
			},
			version
		);
		assert.equal(seat.vp, base.seats[0].vp, version);
		checkState(state);

		const { state: before, random } = game({ ...PP, version });
		before.seats[0].civs = ['leaders'];
		before.supply.civs = [
			IN,
			...before.supply.civs.filter((/** @type {string} */ c) => c !== IN),
		];
		const gained = resolveEffects(before, 1, [{ gainCiv: {} }], random);
		assert.deepEqual(gained.seats[0].civs, ['leaders', IN], version);
		assert.equal(
			gained.seats[0].resources.culture,
			before.seats[0].resources.culture + 1,
			version
		);
		assert.deepEqual(openDecisions(gained), [], version);
	}
});

test("Infiltrators may pick a territory whose only item is an opponent's upright outpost, or an opponent's capital-city territory, at the start of income turns 2 to 5, or decline (03 §1.3)", () => {
	// '1_-1' holds their own lone outpost.
	const { state, random } = infiltratorsGame({ '-1_-1': 2, '1_-1': 1 });
	const asked = pushed(state, random, [infiltratorsIncome(2)]);
	const decision = /** @type {any} */ (decisionOf(asked, 'chooseHex'));
	assert.deepEqual(
		[decision.player, decision.purpose, decision.optional],
		[1, 'infiltrators', true]
	);
	// In map order; neither their own territories nor their own capital-city territory.
	assert.deepEqual(
		decision.options,
		MAPS.small.hexes.filter((hex) =>
			['-1_-1', startOf(state, 2)].includes(hex)
		)
	);
	assert.deepEqual(answersOf(asked, 'chooseHex')[0], { hex: null });

	const declined = answer(asked, random, 1, 'chooseHex', { hex: null });
	assert.deepEqual(declined.hexes, state.hexes);
	assert.deepEqual(declined.seats, state.seats);
	asksNothing(declined, state);
});

test("option A: an outpost from their supply joins an opponent's lone outpost; both stand, both seats control the territory and count it for VP, and the Infiltrators gain its tile's benefit (03 §1.3)", () => {
	const { state, random } = infiltratorsGame({ '-1_-1': 2 });
	const tile = state.hexes['-1_-1'].tile;
	const next = infiltrate(state, random, '-1_-1');
	const hex = next.hexes['-1_-1'];
	assert.deepEqual(hex.outposts, [
		{ seat: 2, toppled: false },
		{ seat: 1, toppled: false },
	]);
	assert.equal(hex.shared, true);
	assert.deepEqual(hex.tokens, []);
	assert.equal(next.seats[0].outposts, state.seats[0].outposts - 1);
	assert.equal(
		next.seats[0].resources.coin,
		state.seats[0].resources.coin + 1
	);
	assert.deepEqual(eventsOf(next, 'outpostPlaced', state.seq), [
		{ type: 'outpostPlaced', player: 1, hex: '-1_-1', sharedWith: 2 },
	]);
	assert.deepEqual(eventsOf(next, 'tileBenefit', state.seq), [
		{ type: 'tileBenefit', player: 1, hex: '-1_-1', tile },
	]);
	// It is no conquest: nothing topples and no dice roll.
	assert.deepEqual(eventsOf(next, 'outpostToppled', state.seq), []);
	assert.deepEqual(eventsOf(next, 'conquerDiceRolled', state.seq), []);
	asksNothing(next, state);
	checkState(next);

	// Each seat controls it beside its capital-city territory, so a red die's VP per territory gives each of them 2.
	for (const seat of [1, 2]) {
		assert.deepEqual(
			controlledTerritories(next, seat).sort(),
			[startOf(state, seat), '-1_-1'].sort()
		);
		const scored = resolveEffects(
			next,
			seat,
			[structuredClone(RED_DIE[4])],
			random
		);
		assert.equal(scored.seats[seat - 1].vp, next.seats[seat - 1].vp + 2);
	}
	assert.deepEqual(controlledTerritories(state, 1), [startOf(state, 1)]);
	// It holds 2 items, so nobody can conquer it.
	for (const seat of [1, 2]) {
		assert.ok(!conquerTargets(next, seat, true).includes('-1_-1'));
		assert.equal(loneOpponent(next, '-1_-1', seat), null);
	}
});

test("option A is only for a territory whose only item is an opponent's upright outpost, not a Nomads piece, and only with an outpost in supply (03 §1.3)", () => {
	const { state, random } = infiltratorsGame({
		'-1_-1': 2,
		'-1_-2': 2,
		'-2_-1': 2,
		'1_-1': 2,
	});
	// A second item, a toppled outpost and a Nomads piece.
	state.hexes['-1_-2'].tokens = [{ seat: 2, civ: 'traders' }];
	state.hexes['-2_-1'].outposts[0].toppled = true;
	state.hexes['1_-1'].outposts[0].piece = { building: 'farm' };
	const options = (/** @type {any} */ s) =>
		/** @type {any} */ (
			decisionOf(pushed(s, random, [infiltratorsIncome(3)]), 'chooseHex')
		).options;
	assert.deepEqual(
		options(state),
		MAPS.small.hexes.filter((hex) =>
			['-1_-1', startOf(state, 2)].includes(hex)
		)
	);
	// With no outpost in their supply, only the capital-city territory is left.
	const spent = structuredClone(state);
	spent.seats[0].outposts = 0;
	assert.deepEqual(options(spent), [startOf(state, 2)]);
});

test('sharing the middle island gains no achievement, and its printed territory no benefit; the Mystics count the shared territory (03 §1.3, R8, #20 design §7)', () => {
	const { state, random } = infiltratorsGame({ '0_0': 2 });
	const next = infiltrate(state, random, '0_0');
	assert.equal(next.hexes['0_0'].shared, true);
	assert.deepEqual(next.achievements['middle-island'], []);
	assert.deepEqual(eventsOf(next, 'achievementClaimed', state.seq), []);
	assert.deepEqual(eventsOf(next, 'tileBenefit', state.seq), [
		{ type: 'tileBenefit', player: 1, hex: '0_0', tile: null },
	]);
	assert.deepEqual(next.seats[0].resources, state.seats[0].resources);
	assert.ok(controlledTerritories(next, 1).includes('0_0'));

	const mystic = structuredClone(state);
	mystic.seats[0].civs = [IN, 'mystics'];
	mystic.seats[0].civData.mystics = {
		predictions: { techCards: 9, districts: 9, territories: 2, tracks: 4 },
		reached: [],
	};
	const counted = infiltrate(mystic, random, '0_0');
	assert.deepEqual(counted.seats[0].civData.mystics.reached, ['territories']);
});

test("option B: a player token on an opponent's capital-city territory gains 1 VP for each outpost in that opponent's supply; their third token on that same territory gains a civilization (03 §1.3, §1.8)", () => {
	// Seat 2 has 3 outposts out of the 8 in its supply, so 5 are left.
	const { state, random } = infiltratorsGame(
		{ '-1_-2': 2, '-2_-1': 2, '1_-1': 2 },
		{ count: 3 }
	);
	const [two, three] = [startOf(state, 2), startOf(state, 3)];
	assert.deepEqual(
		state.seats.map((/** @type {any} */ s) => s.outposts),
		[8, 5, 8]
	);
	const first = infiltrate(state, random, two);
	assert.deepEqual(first.hexes[two].tokens, [{ seat: 1, civ: IN }]);
	assert.deepEqual(first.hexes[two].outposts, state.hexes[two].outposts);
	assert.equal(first.seats[0].vp, state.seats[0].vp + 5);
	assert.deepEqual(eventsOf(first, 'tokenPlaced', state.seq), [
		{ type: 'tokenPlaced', player: 1, civ: IN, hex: two, capital: 2 },
	]);
	assert.deepEqual(eventsOf(first, 'civsDrawn', state.seq), []);
	asksNothing(first, state);
	// The token gives no control (R33).
	assert.ok(!controlledTerritories(first, 1).includes(two));
	assert.ok(controlledTerritories(first, 2).includes(two));
	checkState(first);

	// Two tokens on seat 2's territory and one on seat 3's: a second on seat 3's gains no civilization, a third on
	// seat 2's does, after its VP, drawing 3 to keep 1.
	const placed = structuredClone(state);
	placed.hexes[two].tokens = [
		{ seat: 1, civ: IN },
		{ seat: 1, civ: IN },
	];
	placed.hexes[three].tokens = [{ seat: 1, civ: IN }];
	const elsewhere = infiltrate(placed, random, three);
	assert.equal(elsewhere.hexes[three].tokens.length, 2);
	assert.equal(elsewhere.seats[0].vp, placed.seats[0].vp + 8);
	asksNothing(elsewhere, placed);
	const third = infiltrate(placed, random, two);
	assert.equal(third.seats[0].vp, placed.seats[0].vp + 5);
	const keep = /** @type {any} */ (decisionOf(third, 'chooseCiv'));
	assert.deepEqual(
		[keep.player, keep.midGame, keep.options],
		[1, true, placed.supply.civs.slice(0, 3)]
	);

	// A fourth there gains none.
	const fourth = structuredClone(placed);
	fourth.hexes[two].tokens.push({ seat: 1, civ: IN });
	asksNothing(infiltrate(fourth, random, two), fourth);

	// With no outpost in that opponent's supply, no VP.
	const empty = structuredClone(state);
	empty.seats[1].outposts = 0;
	const none = infiltrate(empty, random, two);
	assert.equal(none.seats[0].vp, empty.seats[0].vp);
	assert.deepEqual(eventsOf(none, 'vpGained', empty.seq), []);
});

test('a player holding the Infiltrators draws 3 civilizations whenever they gain one and keeps 1, also with the civ-draft variant (03 §1.3)', () => {
	for (const variants of [[], ['civ-draft']]) {
		const { state, random } = game({ ...PP, variants });
		state.seats[0].civs = [IN];
		const top = ['leaders', 'traders', 'merrymakers'];
		state.supply.civs = [
			...top,
			...state.supply.civs.filter(
				(/** @type {string} */ c) => !top.includes(c)
			),
		];
		const drawn = resolveEffects(state, 1, [{ gainCiv: {} }], random);
		const keep = /** @type {any} */ (decisionOf(drawn, 'chooseCiv'));
		assert.deepEqual(
			[keep.player, keep.midGame, keep.options],
			[1, true, top],
			`${variants}`
		);
		assert.deepEqual(eventsOf(drawn, 'civsDrawn', state.seq), [
			{ type: 'civsDrawn', player: 1, count: 3, secret: { civs: top } },
		]);
		const kept = answer(drawn, random, 1, 'chooseCiv', { civ: 'traders' });
		assert.deepEqual(kept.seats[0].civs, [IN, 'traders']);
		assert.deepEqual(kept.supply.civDiscard, ['leaders', 'merrymakers']);

		// Their opponent draws as before: 1 without asking, or 2 with the variant.
		const other = resolveEffects(state, 2, [{ gainCiv: {} }], random);
		const choice = /** @type {any} */ (decisionOf(other, 'chooseCiv'));
		if (variants.length === 0) {
			assert.equal(choice, undefined);
			assert.deepEqual(other.seats[1].civs, ['leaders']);
		} else {
			assert.deepEqual(choice.options, ['leaders', 'traders']);
		}
	}
});

test('an Infiltrators player who keeps the Riverfolk and discards them draws 3 again for the civilization in their place (03 §1.8, ruling C)', () => {
	const { state, random } = game();
	state.seats[0].civs = [IN];
	const deck = [
		'riverfolk',
		'leaders',
		'traders',
		'merrymakers',
		'heralds',
		'nomads',
	];
	state.supply.civs = [
		...deck,
		...state.supply.civs.filter(
			(/** @type {string} */ c) => !deck.includes(c)
		),
	];
	const drawn = resolveEffects(state, 1, [{ gainCiv: {} }], random);
	const kept = answer(drawn, random, 1, 'chooseCiv', { civ: 'riverfolk' });
	const offer = /** @type {any} */ (decisionOf(kept, 'chooseOption'));
	assert.deepEqual([offer.player, offer.purpose], [1, 'civOffer']);
	const discarded = answer(kept, random, 1, 'chooseOption', { option: 1 });
	const again = /** @type {any} */ (decisionOf(discarded, 'chooseCiv'));
	assert.deepEqual(
		[again.player, again.midGame, again.options],
		[1, true, ['merrymakers', 'heralds', 'nomads']]
	);
	assert.deepEqual(discarded.seats[0].civs, [IN]);
	assert.deepEqual(discarded.supply.civDiscard, [
		'leaders',
		'traders',
		'riverfolk',
	]);
});

test("the state checks hold the Infiltrators' tokens on other seats' capital-city territories, and a shared territory's upright outposts of two seats", () => {
	const { state, random } = infiltratorsGame({ '-1_-1': 2 });
	const shared = infiltrate(state, random, '-1_-1');
	const token = infiltrate(state, random, startOf(state, 2));
	checkState(shared);
	checkState(token);

	const own = structuredClone(token);
	own.hexes[startOf(state, 2)].tokens = [];
	own.hexes[startOf(state, 1)].tokens = [{ seat: 1, civ: IN }];
	assert.throws(() => checkState(own), /infiltrators token/);

	const lone = structuredClone(shared);
	lone.hexes['-1_-1'].outposts[0].toppled = true;
	assert.throws(() => checkState(lone), /shared/);

	// A base game never shares a territory.
	const base = /** @type {any} */ (structuredClone(startedGame(2).state));
	checkState(base);
	const hex = base.hexes[startOf(base, 2)];
	hex.outposts.push({ seat: 1, toppled: false });
	hex.shared = true;
	base.seats[0].outposts -= 1;
	assert.throws(() => checkState(base), /shared/);
});

test('Infiltrators use their ability in step 1 of income turns 2 to 5', () => {
	const ready = turnHolding(IN, () => {});
	const { player } = ready;
	const other = /** @type {any} */ (
		ready.state.seats.find((s) => s.seat !== player)
	);
	const since = ready.state.seq;
	const state = answer(ready.state, ready.random, player, 'chooseTurn', {
		turn: 'income',
	});
	assert.ok(
		eventsOf(state, 'civAbilityUsed', since).some((e) => e.civ === IN)
	);
	const decision = /** @type {any} */ (decisionOf(state, 'chooseHex'));
	assert.deepEqual(
		[decision?.player, decision?.purpose],
		[player, 'infiltrators']
	);
	assert.ok(decision.options.includes(other.start));
});
