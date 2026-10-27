// Tests for the civilizations that change where pieces go: Craftsmen and Nomads (#20, design §7, §8, §9).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { push, openDecisions } from '../src/lib/engine/stack.js';
import { run, resolveEffects } from '../src/lib/engine/loop.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import {
	buildingSpots,
	cityPlots,
	completeDistricts,
	completeLines,
	landmarkSpots,
} from '../src/lib/engine/city.js';
import { conquerTargets } from '../src/lib/engine/map.js';
import { controlledTerritories } from '../src/lib/engine/control.js';
import { toppledBy } from '../src/lib/engine/achievements.js';
import { countVp, landmarksOwned } from '../src/lib/engine/effects/vp.js';
import { rankPlayers, landmarksInCity } from '../src/lib/engine/ranking.js';
import { CIVS } from '../src/lib/engine/civs/index.js';
import { HEIGHT_RANKING, LANDMARKS } from '../src/lib/engine/data/landmarks.js';
import { MAPS } from '../src/lib/engine/data/maps.js';
import { groupsOf } from '../src/lib/capital.js';
import { startedGame, answer, answerDefaults } from './helpers/engine.mjs';

const VERSIONS = /** @type {const} */ (['original', 'current']);

/**
 * A copy of a small-map 2-player game with nothing pending and every outpost cleared, in which seat 1 holds the
 * named civilizations, set up as at the start, and controls '-2_-2'. Only '-2_-2' and the listed hexes stay explored
 * (all printed territories), so the Nomads' hexes are known.
 * @param {string[]} civs
 * @param {{ explored?: string[], version?: 'original' | 'current' }} [options]
 * @returns {{ state: any, random: any }}
 */
function game(civs, { explored = ['-2_-1'], version } = {}) {
	const { state: started, random } = startedGame(2, { version });
	const state = structuredClone(started);
	state.pending.length = 0;
	for (const [key, hex] of Object.entries(state.hexes)) {
		hex.outposts = [];
		if (key !== '-2_-2' && !explored.includes(key)) {
			/** @type {any} */ (hex).tile = null;
		}
	}
	state.hexes['-2_-2'].outposts = [{ seat: 1, toppled: false }];
	const seat = state.seats[0];
	seat.civs = [...civs];
	if (civs.includes('craftsmen')) {
		seat.civData.craftsmen = [[], [], []];
	}
	// No response question when an opponent conquers seat 1's territory.
	seat.hand = [];
	return { state, random };
}

/**
 * Pushes operations for a copy of the state and runs them to the next decision.
 * @param {any} state
 * @param {any} random
 * @param {any[]} ops
 */
function pushed(state, random, ops) {
	const next = structuredClone(state);
	push(next, next.pending, ops);
	run(next, random);
	return next;
}

/** Seat 1 gains a building of a type and waits to place it. */
const gain = (
	/** @type {any} */ state,
	/** @type {any} */ random,
	building = 'farm'
) => resolveEffects(state, 1, [{ building }], random);

/** Seat 1 gains a landmark and waits to place it. */
const gainLandmark = (
	/** @type {any} */ state,
	/** @type {any} */ random,
	landmark = 'lighthouse'
) => pushed(state, random, [{ player: 1, kind: 'placeLandmark', landmark }]);

/** The open decision of a kind. */
const decisionOf = (/** @type {any} */ state, /** @type {string} */ kind) =>
	openDecisions(state).find((d) => d.kind === kind);

/** The answers of the open placement. */
const placements = (/** @type {any} */ state) =>
	DECISIONS.choosePlacement.answers(
		state,
		decisionOf(state, 'choosePlacement')
	);

/**
 * Checks an answer to the open placement.
 * @param {any} state
 * @param {Record<string, any>} placement
 */
const check = (state, placement) =>
	DECISIONS.choosePlacement.check(
		state,
		decisionOf(state, 'choosePlacement'),
		placement
	);

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

/** The resources a seat holds, all kinds together. */
const held = (/** @type {any} */ seat) =>
	Object.values(seat.resources).reduce(
		(sum, n) => /** @type {number} */ (sum) + /** @type {number} */ (n),
		0
	);

/** The listed hexes in map order, as `{ hex }` answers. */
const hexAnswers = (/** @type {any} */ state, /** @type {string[]} */ hexes) =>
	MAPS[state.map].hexes
		.filter((hex) => hexes.includes(hex))
		.map((hex) => ({ hex }));

/** A random that gives every roll the same face. */
const face = (/** @type {number} */ n) => () => n;

/**
 * Gives seat 2 a test civilization, registered until the test ends, that records the seat of every countsChanged.
 * @param {import('vitest').TestContext} t
 * @param {any} state
 * @returns {number[]}
 */
function watchCounts(t, state) {
	/** @type {number[]} */
	const seats = [];
	CIVS.watcher = {
		id: 'watcher',
		hooks: {
			countsChanged: (_state, _owner, { player }) => {
				seats.push(player);
				return [];
			},
		},
	};
	t.onTestFinished(() => {
		delete CIVS.watcher;
	});
	state.seats[1].civs = ['watcher'];
	return seats;
}

test("Craftsmen offer each column's lowest open space besides the capital and gain its benefit", (t) => {
	const { state, random } = game(['craftsmen']);
	const counted = watchCounts(t, state);
	const gained = gain(state, random);
	assert.deepEqual(placements(gained), [
		...buildingSpots(state.seats[0]),
		{ craftsmen: 0 },
		{ craftsmen: 1 },
		{ craftsmen: 2 },
	]);
	for (const placement of placements(gained)) {
		assert.doesNotThrow(() => check(gained, placement));
	}
	const placed = answer(gained, random, 1, 'choosePlacement', {
		craftsmen: 1,
	});
	const seat = placed.seats[0];
	assert.deepEqual(seat.civData.craftsmen, [[], ['farm'], []]);
	assert.deepEqual(seat.capital.buildings, []);
	assert.equal(seat.resources.coin, state.seats[0].resources.coin + 1);
	assert.deepEqual(eventsOf(placed, 'buildingPlaced', gained.seq), [
		{
			type: 'buildingPlaced',
			player: 1,
			building: 'farm',
			craftsmen: 1,
			automatic: false,
		},
	]);
	assert.deepEqual(openDecisions(placed), []);
	assert.deepEqual(counted, [1]);

	// Only the lowest open space of each column is offered, and a full column isn't.
	const filled = structuredClone(state);
	filled.seats[0].civData.craftsmen = [
		['farm', 'house', 'farm'],
		['house'],
		['farm', 'farm', 'farm', 'house'],
	];
	const next = gain(filled, random, 'market');
	assert.deepEqual(placements(next).slice(-2), [
		{ craftsmen: 1 },
		{ craftsmen: 2 },
	]);
	for (const refused of [
		{ craftsmen: 0 },
		{ craftsmen: 3 },
		{ craftsmen: -1 },
		{ craftsmen: '1' },
	]) {
		assert.throws(
			() => check(next, refused),
			{ name: 'PlayerError', message: "You can't place it there." },
			JSON.stringify(refused)
		);
	}
	// The top of column C: 15 VP.
	const top = answer(next, random, 1, 'choosePlacement', { craftsmen: 2 });
	assert.equal(top.seats[0].vp, filled.seats[0].vp + 15);
	assert.deepEqual(top.seats[0].civData.craftsmen[2], [
		'farm',
		'farm',
		'farm',
		'house',
		'market',
	]);
	// The second space of column B: invent.
	const invent = answer(next, random, 1, 'choosePlacement', {
		craftsmen: 1,
	});
	assert.ok(decisionOf(invent, 'chooseInvent'));
	// The bottom of column A: 1 worker.
	const worker = answer(gained, random, 1, 'choosePlacement', {
		craftsmen: 0,
	});
	assert.equal(
		worker.seats[0].resources.worker,
		state.seats[0].resources.worker + 1
	);

	// A landmark never goes on the columns.
	const landmark = gainLandmark(state, random);
	assert.deepEqual(
		placements(landmark),
		landmarkSpots(state.seats[0], 'lighthouse')
	);
	assert.throws(() => check(landmark, { craftsmen: 0 }), {
		name: 'PlayerError',
		message: "You can't place it there.",
	});
});

test('Craftsmen buildings count for building VP but never complete rows, columns or districts (R71)', () => {
	const { state, random } = game(['craftsmen']);
	const me = state.seats[0];
	// Every open plot of district 0, its rows and its columns is built on but its last one, so a building there
	// would complete the district and lines.
	const open = cityPlots(me).flatMap((kind, i) =>
		kind === 'empty' ? [i] : []
	);
	const last = groupsOf('districts')[0]
		.filter((p) => open.includes(p))
		.at(-1);
	assert.ok(last !== undefined, 'district 0 has an open plot');
	const lines = [...groupsOf('rows'), ...groupsOf('columns')].filter((g) =>
		g.includes(/** @type {number} */ (last))
	);
	for (const p of open) {
		if (
			p !== last &&
			(groupsOf('districts')[0].includes(p) ||
				lines.some((g) => g.includes(p)))
		) {
			me.capital.buildings.push({
				building: 'house',
				row: Math.floor(p / 9),
				col: p % 9,
			});
		}
	}
	const districts = completeDistricts(cityPlots(me));
	const complete = completeLines(cityPlots(me));
	const farms = countVp(state, 1, 'farm');
	const gained = gain(state, random);
	const placed = answer(gained, random, 1, 'choosePlacement', {
		craftsmen: 0,
	});
	const seat = placed.seats[0];
	assert.deepEqual(completeDistricts(cityPlots(seat)), districts);
	assert.deepEqual(completeLines(cityPlots(seat)), complete);
	assert.equal(cityPlots(seat)[/** @type {number} */ (last)], 'empty');
	assert.deepEqual(eventsOf(placed, 'districtsCompleted'), []);
	// Only the column's 1 worker; no district reward is asked.
	assert.deepEqual(openDecisions(placed), []);
	assert.equal(held(seat), held(me) + 1);
	// The farm counts as a building, like any that has left the income mat.
	assert.equal(countVp(placed, 1, 'farm'), farms + 1);
	const scored = resolveEffects(placed, 1, [{ scoreCapital: {} }], random);
	assert.deepEqual(
		eventsOf(scored, 'capitalScored', placed.seq).map((e) => [
			e.rows,
			e.columns,
		]),
		[[complete.rows, complete.columns]]
	);
});

test('Craftsmen placement scores Monarchy', () => {
	const { state, random } = game(['craftsmen']);
	state.seats[0].era = { card: 'monarchy', ability: 'monarchy' };
	const placed = answer(gain(state, random), random, 1, 'choosePlacement', {
		craftsmen: 0,
	});
	assert.equal(placed.seats[0].vp, state.seats[0].vp + 3);
	// It covers no impassable plot, so Terraforming scores nothing.
	state.seats[0].era = { card: 'terraforming', ability: 'terraforming' };
	const terraformed = answer(
		gain(state, random),
		random,
		1,
		'choosePlacement',
		{ craftsmen: 0 }
	);
	assert.equal(terraformed.seats[0].vp, state.seats[0].vp);
});

test('with a full capital Craftsmen choose a column or beside the mat', () => {
	const { state, random } = game(['craftsmen']);
	const me = state.seats[0];
	const spots = buildingSpots(me);
	const [lastSpot] = spots.splice(-1);
	for (const spot of spots) {
		me.capital.buildings.push({ building: 'house', ...spot });
	}
	// One open plot: it is no longer the only place, so the player is asked.
	const one = gain(state, random);
	assert.deepEqual(placements(one), [
		lastSpot,
		{ craftsmen: 0 },
		{ craftsmen: 1 },
		{ craftsmen: 2 },
	]);
	assert.throws(() => check(one, { besideMat: true }), {
		name: 'PlayerError',
		message: "You can't place it there.",
	});

	const full = structuredClone(state);
	full.seats[0].capital.buildings.push({ building: 'house', ...lastSpot });
	const gained = gain(full, random);
	assert.deepEqual(placements(gained), [
		{ besideMat: true },
		{ craftsmen: 0 },
		{ craftsmen: 1 },
		{ craftsmen: 2 },
	]);
	assert.throws(() => check(gained, lastSpot), {
		name: 'PlayerError',
		message: "That plot isn't open.",
	});
	assert.throws(() => check(gained, { besideMat: false }), {
		name: 'PlayerError',
		message: "You can't place it there.",
	});
	const beside = answer(gained, random, 1, 'choosePlacement', {
		besideMat: true,
	});
	assert.deepEqual(beside.seats[0].besideMat, ['farm']);
	assert.deepEqual(beside.seats[0].civData.craftsmen, [[], [], []]);
	assert.deepEqual(eventsOf(beside, 'placedBesideMat', gained.seq), [
		{ type: 'placedBesideMat', player: 1, building: 'farm' },
	]);
	const column = answer(gained, random, 1, 'choosePlacement', {
		craftsmen: 2,
	});
	assert.deepEqual(column.seats[0].besideMat, []);
	assert.deepEqual(column.seats[0].civData.craftsmen, [[], [], ['farm']]);
	assert.equal(column.seats[0].resources.food, me.resources.food + 1);

	// With the columns full too, the building goes beside the mat without asking.
	full.seats[0].civData.craftsmen = [
		['house', 'house', 'house'],
		['house', 'house', 'house', 'house'],
		['farm', 'farm', 'farm', 'farm', 'farm'],
	];
	const none = gain(full, random);
	assert.equal(decisionOf(none, 'choosePlacement'), undefined);
	assert.deepEqual(none.seats[0].besideMat, ['farm']);
});

test('Nomads may put a building on a controlled territory with one item for 1 resource, making it unconquerable', () => {
	const { state, random } = game(['nomads'], { explored: ['-1_-2'] });
	// An opponent's territory next to it: one item, but not the Nomads'.
	state.hexes['-1_-2'].outposts = [{ seat: 2, toppled: false }];
	state.seats[0].era = { card: 'monarchy', ability: 'monarchy' };
	assert.deepEqual(conquerTargets(state, 2, false), ['-2_-2']);
	const gained = gain(state, random);
	assert.deepEqual(placements(gained), [
		...buildingSpots(state.seats[0]),
		{ hex: '-2_-2' },
	]);
	for (const refused of [{ hex: '-1_-2' }, { hex: '-1_-1' }, { hex: 3 }]) {
		assert.throws(
			() => check(gained, refused),
			{ name: 'PlayerError', message: "You can't place it there." },
			JSON.stringify(refused)
		);
	}
	const placed = answer(gained, random, 1, 'choosePlacement', {
		hex: '-2_-2',
	});
	assert.deepEqual(placed.hexes['-2_-2'].outposts, [
		{ seat: 1, toppled: false },
		{ seat: 1, toppled: false, piece: { building: 'farm' } },
	]);
	assert.deepEqual(eventsOf(placed, 'piecePlacedOnMap', gained.seq), [
		{
			type: 'piecePlacedOnMap',
			player: 1,
			hex: '-2_-2',
			piece: { building: 'farm' },
		},
	]);
	assert.deepEqual(placed.seats[0].capital.buildings, []);
	// 1 resource of the player's choice.
	assert.ok(decisionOf(placed, 'chooseResource'));
	const done = answerDefaults(placed, random);
	assert.equal(held(done.seats[0]), held(state.seats[0]) + 1);
	// Two items: nobody can conquer it now.
	assert.deepEqual(conquerTargets(done, 2, false), []);
	assert.deepEqual(conquerTargets(done, 2, true), []);
	// It counts as a building, but isn't in the capital, so Monarchy scores nothing.
	assert.equal(countVp(done, 1, 'farm'), countVp(state, 1, 'farm') + 1);
	assert.equal(done.seats[0].vp, state.seats[0].vp);
	assert.deepEqual(eventsOf(done, 'buildingPlaced'), []);
	// A territory with two items isn't offered, nor one with a token beside the outpost.
	for (const tokens of [[], [{ seat: 2, civ: 'traders' }]]) {
		const busy = structuredClone(done);
		busy.hexes['-2_-2'].outposts.splice(1);
		busy.hexes['-2_-2'].tokens = tokens;
		if (tokens.length === 0) {
			busy.hexes['-2_-2'].outposts.push({ seat: 1, toppled: false });
		}
		assert.deepEqual(
			placements(gain(busy, random)),
			buildingSpots(busy.seats[0])
		);
	}
});

test('Nomads may put a building or landmark on an empty territory next to theirs and control it', (t) => {
	const { state, random } = game(['nomads'], {
		explored: ['-2_-1', '-1_-2', '0_0'],
	});
	// A token is an item, though it gives no control; '0_0' isn't next to '-2_-2', and '-1_-1' is unexplored.
	state.hexes['-1_-2'].tokens = [{ seat: 2, civ: 'traders' }];
	const counted = watchCounts(t, state);
	const gained = gainLandmark(state, random);
	assert.deepEqual(placements(gained), [
		...landmarkSpots(state.seats[0], 'lighthouse'),
		...hexAnswers(state, ['-2_-2', '-2_-1']),
	]);
	const placed = answer(gained, random, 1, 'choosePlacement', {
		hex: '-2_-1',
	});
	assert.deepEqual(placed.hexes['-2_-1'].outposts, [
		{ seat: 1, toppled: false, piece: { landmark: 'lighthouse' } },
	]);
	assert.deepEqual(eventsOf(placed, 'piecePlacedOnMap', gained.seq), [
		{
			type: 'piecePlacedOnMap',
			player: 1,
			hex: '-2_-1',
			piece: { landmark: 'lighthouse' },
		},
	]);
	assert.deepEqual(controlledTerritories(placed, 1).sort(), [
		'-2_-1',
		'-2_-2',
	]);
	assert.deepEqual(counted, [1]);
	// No resource, no conquest, and no outpost from the supply.
	assert.deepEqual(openDecisions(placed), []);
	assert.equal(held(placed.seats[0]), held(state.seats[0]));
	assert.equal(placed.seats[0].outposts, state.seats[0].outposts);
	assert.deepEqual(eventsOf(placed, 'conquered'), []);
	assert.deepEqual(eventsOf(placed, 'outpostPlaced'), []);
	// The landmark is owned, but not in the capital.
	assert.deepEqual(placed.seats[0].capital.landmarks, []);
	assert.deepEqual(landmarksOwned(placed, 1), ['lighthouse']);

	// A building goes the same way.
	const farm = answer(gain(state, random), random, 1, 'choosePlacement', {
		hex: '-2_-1',
	});
	assert.deepEqual(farm.hexes['-2_-1'].outposts, [
		{ seat: 1, toppled: false, piece: { building: 'farm' } },
	]);
	assert.ok(controlledTerritories(farm, 1).includes('-2_-1'));
	assert.equal(held(farm.seats[0]), held(state.seats[0]));
	assert.equal(countVp(farm, 1, 'farm'), countVp(state, 1, 'farm') + 1);
});

test("a Nomads piece can be conquered and toppled, and doesn't count for topple two", () => {
	const { state, random } = game(['nomads'], {
		explored: ['-2_-1', '-1_-1', '-1_-2'],
	});
	state.hexes['-1_-1'].tile = 1;
	state.hexes['-1_-1'].outposts = [{ seat: 2, toppled: false }];
	// Seat 2 has already toppled one of seat 1's outposts, still toppled.
	state.hexes['-1_-2'].outposts = [
		{ seat: 1, toppled: true, toppledBy: 2 },
		{ seat: 2, toppled: false },
	];
	assert.equal(toppledBy(state, 2), 1);
	const placed = answer(gain(state, random), random, 1, 'choosePlacement', {
		hex: '-2_-1',
	});
	const conquering = resolveEffects(placed, 2, [{ conquer: {} }], face(0));
	const conquered = answer(conquering, face(0), 2, 'chooseConquer', {
		hex: '-2_-1',
	});
	assert.deepEqual(conquered.hexes['-2_-1'].outposts, [
		{
			seat: 1,
			toppled: true,
			toppledBy: 2,
			piece: { building: 'farm' },
		},
		{ seat: 2, toppled: false },
	]);
	assert.ok(
		eventsOf(conquered, 'outpostToppled', placed.seq).some(
			(e) => e.player === 1 && e.hex === '-2_-1' && e.by === 2
		)
	);
	assert.ok(!controlledTerritories(conquered, 1).includes('-2_-1'));
	assert.ok(controlledTerritories(conquered, 2).includes('-2_-1'));
	// A toppled piece is still owned, but isn't a toppled outpost.
	assert.equal(countVp(conquered, 1, 'farm'), countVp(state, 1, 'farm') + 1);
	assert.equal(toppledBy(conquered, 2), 1);
	assert.deepEqual(
		eventsOf(
			answerDefaults(conquered, face(0)),
			'achievementClaimed',
			placed.seq
		),
		[]
	);
});

test("a Nomads landmark on the map doesn't count for the tiebreak (R13)", () => {
	const { state, random } = game(['nomads'], { version: 'current' });
	const base = HEIGHT_RANKING.filter((id) =>
		LANDMARKS.some((landmark) => landmark.id === id)
	);
	const [tallest] = base;
	const shortest = /** @type {string} */ (base.at(-1));
	state.seats[1].capital.landmarks = [
		{ landmark: shortest, row: 0, col: 0, rotation: 0 },
	];
	const placed = answer(
		gainLandmark(state, random, tallest),
		random,
		1,
		'choosePlacement',
		{ hex: '-2_-1' }
	);
	assert.deepEqual(landmarksOwned(placed, 1), [tallest]);
	assert.deepEqual(landmarksInCity(placed.seats[0]), []);
	for (const seat of placed.seats) {
		seat.vp = 50;
	}
	const { ranking, ties } = rankPlayers(placed);
	assert.deepEqual(
		ranking.map((p) => [p.seat, p.place]),
		[
			[2, 1],
			[1, 2],
		]
	);
	assert.deepEqual(ties[0].steps[0], {
		by: 'tallestLandmark',
		values: [
			{ seat: 1, value: null },
			{ seat: 2, value: shortest },
		],
	});
});

test('Craftsmen and Nomads behave the same in both versions', () => {
	/** @type {any[]} */
	const results = [];
	for (const version of VERSIONS) {
		// Their setup gives nothing and they have no adjustment.
		const { state: started } = startedGame(2, {
			civs: ['craftsmen', 'nomads'],
			version,
		});
		assert.deepEqual(
			started.seats.map((/** @type {any} */ s) => s.civs),
			[['craftsmen'], ['nomads']]
		);
		assert.deepEqual(started.seats[0].civData, {
			craftsmen: [[], [], []],
		});
		assert.deepEqual(started.seats[1].civData, {});
		// Holding both, the columns come after the capital plots and the hexes last.
		const { state, random } = game(['craftsmen', 'nomads'], { version });
		const gained = gain(state, random);
		assert.deepEqual(placements(gained), [
			...buildingSpots(state.seats[0]),
			{ craftsmen: 0 },
			{ craftsmen: 1 },
			{ craftsmen: 2 },
			...hexAnswers(state, ['-2_-2', '-2_-1']),
		]);
		const column = answer(gained, random, 1, 'choosePlacement', {
			craftsmen: 0,
		});
		const hex = answer(gained, random, 1, 'choosePlacement', {
			hex: '-2_-1',
		});
		results.push({
			seats: started.seats.map((/** @type {any} */ s) => ({
				vp: s.vp,
				resources: s.resources,
			})),
			column: column.seats[0],
			hex: hex.hexes,
		});
	}
	assert.deepEqual(results[0], results[1]);
});
