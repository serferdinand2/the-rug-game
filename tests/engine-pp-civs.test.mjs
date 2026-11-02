// Plans & Ploys' civilizations (#33; 03 §1.3): each one's setup, ability and mid-game gain, one section per civilization.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { play } from '../src/lib/engine/play.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import { openDecisions, push } from '../src/lib/engine/stack.js';
import { run, resolveEffects } from '../src/lib/engine/loop.js';
import { cityPlots } from '../src/lib/engine/city.js';
import { groupsOf } from '../src/lib/capital.js';
import { readyTurn, startedGame, answer } from './helpers/engine.mjs';

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
	const ready = readyTurn(
		2,
		(seat, state) => {
			seat.incomeTurns = 4;
			for (const other of state.seats) {
				if (other !== seat) {
					other.incomeTurns = 4;
				}
			}
			seat.vp = 50;
			seat.vpSources = { tracks: 50 };
		},
		{ civs: ['nomads', 'riverfolk'], ...PP }
	);
	assert.equal(ready.player, 2);
	const since = ready.state.seq;
	const showing = cityPlots(ready.state.seats[1]).filter(
		(kind) => kind === 'blocked'
	).length;
	const state = answer(ready.state, ready.random, 2, 'chooseTurn', {
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
		[2, -showing, 'civ']
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
