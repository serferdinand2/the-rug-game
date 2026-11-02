// Plans & Ploys' civilizations (#33; 03 §1.3): each one's setup, ability and mid-game gain, one section per civilization.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { play } from '../src/lib/engine/play.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import { openDecisions, push } from '../src/lib/engine/stack.js';
import { run, resolveEffects } from '../src/lib/engine/loop.js';
import { cityPlots } from '../src/lib/engine/city.js';
import { groupsOf } from '../src/lib/capital.js';
import { view } from '../src/lib/engine/game.js';
import { readyTurn, startedGame, answer } from './helpers/engine.mjs';
import { allOps } from './helpers/views.mjs';

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
	state.seats[1].civData.inventors = { tokens: 4, cards: ['com-tower'] };
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

	// The Recyclers' own upgrade sends the marked card down, its token with it.
	const own = resolveEffects(state, 1, [{ upgrade: {} }], random);
	const recycled = answer(own, random, 1, 'chooseUpgrade', {
		card: 'com-tower',
	});
	assert.deepEqual(recycled.seats[0].tech.bottom, ['bakery', 'com-tower']);
	assert.deepEqual(recycled.seats[1].civData.inventors.cards, ['com-tower']);
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
