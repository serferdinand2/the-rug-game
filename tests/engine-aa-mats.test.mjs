// Tests for the six Arts & Architecture advanced capital mats (#36): their data, grids, placement, completion and scoring.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import {
	ADVANCED_MATS,
	advancedMatsFor,
	capitalMat,
	impassablePlots,
	matShape,
} from '../src/lib/engine/data/capitals.js';
import {
	buildingProblem,
	buildingSpots,
	capitalScore,
	cityPlots,
	completeDistricts,
	landmarkProblem,
	landmarkSpots,
	seatImpassable,
	seatShape,
} from '../src/lib/engine/city.js';
import { placePiece } from '../src/lib/engine/placing.js';
import { contextFor, run } from '../src/lib/engine/loop.js';
import { openDecisions, push } from '../src/lib/engine/stack.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import { play } from '../src/lib/engine/play.js';
import { PlayerError } from '../src/lib/engine/errors.js';
import { INCOME_STEPS, INCOME_STEP_KINDS } from '../src/lib/engine/income.js';
import { startedGame } from './helpers/engine.mjs';
import * as archipelagoArt from '../tools/art/parts/capital-biomes/archipelago.js';
import * as canyonArt from '../tools/art/parts/capital-biomes/canyon.js';
import * as cavernArt from '../tools/art/parts/capital-biomes/cavern.js';
import * as cloudCityArt from '../tools/art/parts/capital-biomes/cloud-city.js';
import * as mesaArt from '../tools/art/parts/capital-biomes/mesa.js';
import * as swampArt from '../tools/art/parts/capital-biomes/swamp.js';

/** #132's art module for each mat slug. */
const ART = {
	archipelago: archipelagoArt,
	canyon: canyonArt,
	cavern: cavernArt,
	'cloud-city': cloudCityArt,
	mesa: mesaArt,
	swamp: swampArt,
};

/**
 * The [row, column] of every plot of a mat's grid printed with a symbol.
 * @param {import('../src/lib/engine/data/capitals.js').CapitalMat} mat
 * @param {string} symbol
 * @returns {number[][]}
 */
function printed(mat, symbol) {
	return mat.grid.flatMap((line, row) =>
		[...line].flatMap((ch, col) => (ch === symbol ? [[row, col]] : []))
	);
}

test('the six A&A mats are numbered 7–12 (R49)', () => {
	assert.deepEqual(
		ADVANCED_MATS.map((m) => [m.number, m.id, m.name, m.expansion]),
		[
			[7, 'archipelago', 'Archipelago', 'aa'],
			[8, 'canyon', 'Canyon', 'aa'],
			[9, 'cavern', 'Cavern', 'aa'],
			[10, 'cloud-city', 'Cloud City', 'aa'],
			[11, 'mesa', 'Mesa', 'aa'],
			[12, 'swamp', 'Swamp', 'aa'],
		]
	);
	for (let n = 1; n <= 12; n++) {
		assert.equal(capitalMat(n).number, n);
	}
	assert.throws(() => capitalMat(13), /no capital mat 13/i);
	assert.ok(Object.isFrozen(ADVANCED_MATS[0].grid));
});

test("each mat's plots match 03 §2", () => {
	const impassable = Object.fromEntries(
		ADVANCED_MATS.map((m) => [m.id, impassablePlots(m).length])
	);
	assert.deepEqual(impassable, {
		archipelago: 44,
		canyon: 19,
		cavern: 20,
		'cloud-city': 22,
		mesa: 22,
		swamp: 18,
	});
	const archipelago = capitalMat(7);
	assert.equal(archipelago.grid.length, 11);
	assert.ok(archipelago.grid.every((line) => line.length === 9));
	assert.deepEqual(printed(capitalMat(8), 'C'), [
		[1, 1],
		[1, 7],
		[4, 1],
		[4, 7],
		[7, 1],
		[7, 7],
	]);
	assert.deepEqual(printed(capitalMat(12), 'L'), [
		[0, 2],
		[1, 4],
		[2, 8],
		[6, 1],
		[6, 5],
		[7, 7],
	]);
	for (const mat of ADVANCED_MATS.filter((m) => m.number !== 7)) {
		assert.equal(mat.grid.length, 9, mat.id);
		assert.ok(
			mat.grid.every((line) => /^[01CL]{9}$/.test(line)),
			mat.id
		);
	}
});

test('the islands and clouds are districts', () => {
	const sizes = (/** @type {number} */ n) =>
		matShape(capitalMat(n)).districts.map((d) => d.length);
	assert.deepEqual(sizes(7), [6, 10, 4, 4, 12, 5, 3, 6, 8]);
	assert.deepEqual(sizes(10), [8, 8, 7, 9, 9, 12, 9, 9, 10]);
	const archipelago = matShape(capitalMat(7));
	assert.deepEqual([archipelago.rows, archipelago.cols], [11, 9]);
	const land = new Set(archipelago.districts.flat());
	const water = impassablePlots(capitalMat(7)).filter((p) => !land.has(p));
	assert.equal(water.length, 41);
	assert.equal(new Set(matShape(capitalMat(10)).districts.flat()).size, 81);
	for (const n of [8, 9, 11, 12]) {
		const shape = matShape(capitalMat(n));
		assert.deepEqual([shape.rows, shape.cols], [9, 9]);
		assert.deepEqual(shape.districts[0], [0, 1, 2, 9, 10, 11, 18, 19, 20]);
		assert.deepEqual(
			shape.districts[8],
			[60, 61, 62, 69, 70, 71, 78, 79, 80]
		);
	}
});

test("R51: Cavern's rows score 2 and 3, its columns 0", () => {
	const cavern = capitalMat(9);
	assert.deepEqual(cavern.rowValues, [2, 2, 2, 2, 2, 2, 3, 3, 3]);
	assert.equal(cavern.columnValue, 0);
	assert.equal(cavern.gated, true);
	for (const mat of ADVANCED_MATS.filter((m) => m.number !== 9)) {
		assert.equal(mat.rowValues, undefined, mat.id);
		assert.equal(mat.columnValue, undefined, mat.id);
	}
	assert.equal(capitalMat(11).landmarksInside, true);
	assert.equal(capitalMat(10).cloudMoves, 2);
	assert.equal(capitalMat(12).lilyPenalty, 2);
});

test("the engine's layouts agree with #132's art", () => {
	for (const mat of ADVANCED_MATS) {
		const art = ART[/** @type {keyof typeof ART} */ (mat.id)];
		assert.deepEqual(
			mat.grid.map((line) => line.replace(/1/g, 'X').replace(/0/g, '.')),
			[...art.LAYOUT],
			mat.id
		);
	}
	assert.deepEqual(capitalMat(10).districts, [...cloudCityArt.CLOUDS]);
	const shape = matShape(capitalMat(7));
	const island = (/** @type {number} */ plot) =>
		shape.districts.findIndex((d) => d.includes(plot));
	assert.deepEqual(
		archipelagoArt.VOLCANOES.map(([r, c]) => island(r * 9 + c)),
		[4, 4, 7]
	);
	for (const [r, c] of archipelagoArt.VOLCANOES) {
		assert.equal(capitalMat(7).grid[r][c], '1');
	}
});

test('an Archipelago capital has 99 plots and its islands as districts', () => {
	const seat = structuredClone(startedGame(2).state.seats[0]);
	seat.capital.mat = 7;
	const plots = cityPlots(seat);
	assert.equal(plots.length, 99);
	assert.equal(plots.filter((k) => k === 'blocked').length, 44);
	assert.equal(seatShape(seat).rows, 11);
	assert.equal(seatShape(seat).districts.length, 9);
	assert.equal(buildingProblem(seat, { row: 10, col: 0 }), null);
	const spots = landmarkSpots(seat, 'lighthouse');
	// Fully on the grid on the bottom row, and hanging off the bottom edge (R106).
	assert.ok(spots.some((s) => s.row === 9 && s.col === 3));
	assert.ok(spots.some((s) => s.row === 10 && s.col === 3));
	assert.ok(spots.every((s) => s.row <= 10));
	// Nothing lands on water: every spot covers open plots only.
	assert.equal(
		landmarkProblem(seat, {
			landmark: 'lighthouse',
			row: 3,
			col: 0,
			rotation: 0,
		}),
		"That plot isn't open."
	);
});

/**
 * A started 2-player game with nothing pending, seat 1 on the given mat.
 * @param {number} mat
 */
function onMat(mat) {
	const { state: started, random } = startedGame(2);
	const state = structuredClone(started);
	state.pending.length = 0;
	state.seats[0].capital.mat = mat;
	return { state, random, seat: state.seats[0] };
}

/**
 * Puts farms on plots of a seat's capital directly.
 * @param {import('../src/lib/engine/state.js').PlayerSeat} seat
 * @param {number[][]} cells - [row, column] pairs
 */
function farms(seat, cells) {
	for (const [row, col] of cells) {
		seat.capital.buildings.push({ building: 'farm', row, col });
	}
}

/**
 * The plots offered for the first Architects cube on seat 1's capital.
 * @param {ReturnType<typeof onMat>} game
 * @returns {number[]}
 */
function cubeOptions({ state, random, seat }) {
	seat.civs = ['architects'];
	push(state, state.pending, [
		{ player: 1, kind: 'civAdjust', phase: 'setup' },
	]);
	run(state, random);
	const decision = openDecisions(state).find((d) => d.kind === 'chooseCube');
	return decision?.options ?? [];
}

test('Mesa: a landmark may not hang off the edge', () => {
	const { seat } = onMat(11);
	const spots = landmarkSpots(seat, 'lighthouse');
	assert.ok(spots.length > 0);
	assert.ok(spots.every((s) => s.row >= 0 && s.row + 2 <= 9));
	assert.ok(spots.every((s) => s.col >= 0 && s.col + 2 <= 9));
	assert.equal(
		landmarkProblem(seat, {
			landmark: 'lighthouse',
			row: 3,
			col: 8,
			rotation: 0,
		}),
		'On the Mesa, a landmark must lie wholly inside your city.'
	);
});

test('Archipelago: no piece on water, and landmarks may hang off the outer edge (R14, R106)', () => {
	const { seat } = onMat(7);
	assert.equal(
		buildingProblem(seat, { row: 3, col: 0 }),
		"That plot isn't open."
	);
	assert.ok(
		landmarkSpots(seat, 'lighthouse').some(
			(s) => s.row === 0 && s.col === -1
		)
	);
});

test('R123: on the Archipelago, the Riverfolk and Terraforming may build on water and volcanoes, which complete no island', () => {
	const { state, random, seat } = onMat(7);
	assert.equal(buildingProblem(seat, { row: 3, col: 0 }, true), null);
	assert.equal(buildingProblem(seat, { row: 4, col: 3 }, true), null);
	const ctx = contextFor(state, random, state.pending);
	placePiece(ctx, 1, { building: 'farm', row: 3, col: 0 }, false);
	assert.equal(
		state.events.filter((e) => e.type === 'districtsCompleted').length,
		0
	);
});

test('Cavern: a building below an incomplete district is refused', () => {
	const { seat } = onMat(9);
	const gate =
		'In the Cavern, build in a district only once the district above it is complete.';
	assert.equal(buildingProblem(seat, { row: 3, col: 0 }), gate);
	// The top row of districts is always open.
	assert.equal(buildingProblem(seat, { row: 0, col: 2 }), null);
	assert.ok(
		buildingSpots(seat).every((c) => c.row < 3 || c.col > 2 || c.row > 5)
	);
	farms(seat, [
		[0, 2],
		[1, 0],
		[1, 1],
		[1, 2],
		[2, 0],
		[2, 1],
		[2, 2],
	]);
	assert.equal(buildingProblem(seat, { row: 3, col: 0 }), null);
	// District 6 waits for district 3.
	assert.equal(buildingProblem(seat, { row: 6, col: 0 }), gate);
});

test('Cavern: a landmark may complete the district above and reach into the one below', () => {
	const { seat } = onMat(9);
	farms(seat, [
		[0, 2],
		[1, 0],
		[1, 1],
		[1, 2],
		[2, 2],
	]);
	const piece = { landmark: 'lighthouse', row: 2, col: 0, rotation: 0 };
	assert.equal(landmarkProblem(seat, piece), null);
	seat.capital.buildings = seat.capital.buildings.filter((b) => b.row !== 1);
	assert.equal(
		landmarkProblem(seat, piece),
		'In the Cavern, build in a district only once the district above it is complete.'
	);
});

test("Cavern: the Architects' cubes ignore the gates", () => {
	// Plot 27 is row 3, column 0, in district 3, below district 0, which is incomplete.
	assert.ok(cubeOptions(onMat(9)).includes(27));
});

test('R122: on the Canyon, a cactus is an open plot until all 8 neighbours are filled, landmarks included', () => {
	const { state, random, seat } = onMat(8);
	farms(seat, [
		[0, 0],
		[0, 1],
		[1, 0],
		[2, 0],
		[2, 1],
	]);
	assert.equal(cityPlots(seat)[10], 'empty');
	assert.equal(buildingProblem(seat, { row: 1, col: 1 }), null);
	// A landmark's corner fills the last neighbour, (2, 2), diagonally below the cactus at (1, 1).
	const ctx = contextFor(state, random, state.pending);
	placePiece(
		ctx,
		1,
		{ landmark: 'lighthouse', row: 2, col: 2, rotation: 0 },
		false
	);
	assert.equal(cityPlots(seat)[10], 'blocked');
	assert.deepEqual(
		state.events.find((e) => e.type === 'districtsCompleted')?.districts,
		[0]
	);
	// The Riverfolk count it as impassable (03 §2.12).
	assert.ok(seatImpassable(seat).includes(10));
});

test('R52: on the Swamp, lily pads count as filled and may be built on', () => {
	const { state, random, seat } = onMat(12);
	// Plot 2 is the lily pad at row 0, column 2, in district 0.
	assert.equal(cityPlots(seat)[2], 'lily');
	assert.ok(buildingSpots(seat).some((c) => c.row === 0 && c.col === 2));
	farms(seat, [
		[1, 1],
		[1, 2],
		[2, 0],
		[2, 1],
		[2, 2],
	]);
	assert.ok(completeDistricts(cityPlots(seat), seatShape(seat)).includes(0));
	const ctx = contextFor(state, random, state.pending);
	placePiece(ctx, 1, { building: 'farm', row: 0, col: 2 }, false);
	assert.equal(cityPlots(seat)[2], 'farm');
	assert.equal(
		state.events.filter((e) => e.type === 'districtsCompleted').length,
		0
	);
});

test("Swamp: no Architects' cube goes on a lily pad", () => {
	const options = cubeOptions(onMat(12));
	assert.ok(options.length > 0);
	for (const pad of [2, 13, 26, 55, 59, 70]) {
		assert.ok(!options.includes(pad), `pad ${pad}`);
	}
});

/**
 * Every open plot of a row of the seat's mat, as [row, column] pairs.
 * @param {import('../src/lib/engine/state.js').PlayerSeat} seat
 * @param {number} row
 * @returns {number[][]}
 */
function openInRow(seat, row) {
	const line = capitalMat(/** @type {number} */ (seat.capital.mat)).grid[row];
	return [...line].flatMap((ch, col) => (ch === '1' ? [] : [[row, col]]));
}

test('R50: the Archipelago scores its 11 rows and 9 columns', () => {
	const { seat } = onMat(7);
	for (let row = 0; row < 11; row++) {
		farms(seat, openInRow(seat, row));
	}
	assert.deepEqual(capitalScore(seat), {
		rows: 11,
		columns: 9,
		uniform: 0,
		vp: 20,
	});
});

test('R51: the Cavern scores 2 for rows 1–6, 3 for rows 7–9 and nothing for columns', () => {
	const { seat } = onMat(9);
	farms(seat, [...openInRow(seat, 0), ...openInRow(seat, 8)]);
	farms(seat, [
		[1, 4],
		[2, 4],
		[3, 4],
		[4, 4],
		[6, 4],
	]);
	assert.deepEqual(capitalScore(seat), {
		rows: 2,
		columns: 1,
		uniform: 0,
		vp: 5,
	});
});

test("the Architects' bonus does nothing on the Cavern", () => {
	const { seat } = onMat(9);
	seat.civs = ['architects'];
	for (const [row, col] of openInRow(seat, 6)) {
		seat.capital.buildings.push({ building: 'market', row, col });
	}
	assert.deepEqual(capitalScore(seat), {
		rows: 1,
		columns: 0,
		uniform: 0,
		vp: 3,
	});
});

test("Swamp's lily pads count toward complete lines", () => {
	const { seat } = onMat(12);
	// Row 0 is '11L000000': a lily pad at column 2 stays showing.
	farms(
		seat,
		openInRow(seat, 0).filter(([, col]) => col !== 2)
	);
	assert.equal(capitalScore(seat).rows, 1);
});

/**
 * Runs some of seat 1's income steps for an income turn until the next decision.
 * @param {ReturnType<typeof onMat>} game
 * @param {number} turn
 * @param {string[]} steps
 */
function incomeSteps({ state, random }, turn, steps) {
	push(state, state.pending, [
		{ player: 1, kind: 'incomeSteps', turn, steps, origin: 'income' },
	]);
	run(state, random);
}

test('R52: the Swamp loses 2 VP per lily pad still showing at the start of income turn 5', () => {
	const at = INCOME_STEPS.indexOf('lilyPads');
	assert.ok(at > INCOME_STEPS.indexOf('eraEnd'));
	assert.ok(at < INCOME_STEPS.indexOf('civAbilities'));
	assert.deepEqual(INCOME_STEP_KINDS.lilyPads.turns, [5]);
	const game = onMat(12);
	// Two of the six pads are covered.
	farms(game.seat, [
		[0, 2],
		[1, 4],
	]);
	const before = game.seat.vp;
	incomeSteps(game, 5, ['lilyPads']);
	assert.equal(game.seat.vp, before - 8);
	assert.deepEqual(
		game.state.events
			.filter((e) => e.type === 'lilyPadsCounted')
			.map(({ player, pads }) => ({ player, pads })),
		[{ player: 1, pads: 4 }]
	);
	assert.equal(game.seat.vpSources.capital, -8);
});

test('a mat without lily pads loses nothing on income turn 5', () => {
	const game = onMat(1);
	const before = game.seat.vp;
	incomeSteps(game, 5, ['lilyPads']);
	assert.equal(game.seat.vp, before);
	assert.ok(!game.state.events.some((e) => e.type === 'lilyPadsCounted'));
});

/**
 * Seat 1's open decision of a kind, if any.
 * @param {ReturnType<typeof onMat>} game
 * @param {string} kind
 */
function asked({ state }, kind) {
	return openDecisions(state).find((d) => d.player === 1 && d.kind === kind);
}

/**
 * Answers seat 1's open decision of a kind, then runs on.
 * @param {ReturnType<typeof onMat>} game
 * @param {string} kind
 * @param {Record<string, unknown>} answer
 */
function answerAsked(game, kind, answer) {
	const decision = asked(game, kind);
	assert.ok(decision, `${kind} is asked`);
	game.state = play(
		game.state,
		1,
		{ decision: decision.id, ...answer },
		game.random
	);
	game.seat = game.state.seats[0];
}

test('R121: Cloud City may move up to 2 income buildings, one at a time, at the start of income turns 2–5', () => {
	const at = INCOME_STEPS.indexOf('cloudMoves');
	assert.ok(at > INCOME_STEPS.indexOf('eraEnd'));
	assert.ok(at < INCOME_STEPS.indexOf('lilyPads'));
	assert.deepEqual(INCOME_STEP_KINDS.cloudMoves.turns, [2, 3, 4, 5]);
	const game = onMat(10);
	farms(game.seat, [[0, 0]]);
	incomeSteps(game, 2, ['cloudMoves']);
	const first = asked(game, 'chooseCloudMove');
	assert.equal(first?.left, 2);
	const answers = DECISIONS.chooseCloudMove.answers(game.state, first);
	assert.deepEqual(answers, [{ stop: true }, { row: 0, col: 0 }]);
	answerAsked(game, 'chooseCloudMove', { row: 0, col: 0 });
	// The destination's decision names the building, so the Capital tab can preview it.
	assert.equal(asked(game, 'chooseCloudPlot')?.building, 'farm');
	// Not within cloud 1, which holds rows 0–1, columns 0–2: the destination is in another cloud.
	const where = DECISIONS.chooseCloudPlot.answers(
		game.state,
		asked(game, 'chooseCloudPlot')
	);
	assert.ok(!where.some((a) => a.row === 0 && a.col === 1));
	assert.ok(where.some((a) => a.row === 0 && a.col === 3));
	answerAsked(game, 'chooseCloudPlot', { row: 0, col: 3 });
	assert.deepEqual(game.seat.capital.buildings, [
		{ building: 'farm', row: 0, col: 3 },
	]);
	assert.equal(asked(game, 'chooseCloudMove')?.left, 1);
	answerAsked(game, 'chooseCloudMove', { row: 0, col: 3 });
	answerAsked(game, 'chooseCloudPlot', { row: 0, col: 0 });
	assert.equal(asked(game, 'chooseCloudMove'), undefined);
	assert.deepEqual(
		game.state.events
			.filter((e) => e.type === 'buildingMoved')
			.map(({ building, from, to }) => ({ building, from, to })),
		[
			{
				building: 'farm',
				from: { row: 0, col: 0 },
				to: { row: 0, col: 3 },
			},
			{
				building: 'farm',
				from: { row: 0, col: 3 },
				to: { row: 0, col: 0 },
			},
		]
	);
});

test('Cloud City: stopping ends the moves', () => {
	const game = onMat(10);
	farms(game.seat, [[0, 0]]);
	incomeSteps(game, 3, ['cloudMoves']);
	answerAsked(game, 'chooseCloudMove', { stop: true });
	assert.equal(asked(game, 'chooseCloudMove'), undefined);
	assert.deepEqual(game.seat.capital.buildings, [
		{ building: 'farm', row: 0, col: 0 },
	]);
});

test('Cloud City: a building may only leave a cloud that is not complete', () => {
	const game = onMat(10);
	// Cloud 3's six open plots, and a farm in cloud 1.
	farms(game.seat, [
		[0, 7],
		[0, 8],
		[1, 6],
		[1, 7],
		[2, 6],
		[2, 7],
		[0, 0],
	]);
	incomeSteps(game, 2, ['cloudMoves']);
	assert.deepEqual(
		DECISIONS.chooseCloudMove.answers(
			game.state,
			asked(game, 'chooseCloudMove')
		),
		[{ stop: true }, { row: 0, col: 0 }]
	);
	assert.throws(
		() => answerAsked(game, 'chooseCloudMove', { row: 0, col: 7 }),
		PlayerError
	);
});

test('Cloud City: a move that fills a cloud pays its resource, and places nothing', () => {
	const game = onMat(10);
	// Cloud 4 (district 3) is rows 2–4, columns 2–4, all open: fill all but (4, 4).
	farms(game.seat, [
		[2, 2],
		[2, 3],
		[2, 4],
		[3, 2],
		[3, 3],
		[3, 4],
		[4, 2],
		[4, 3],
		[0, 0],
	]);
	incomeSteps(game, 2, ['cloudMoves']);
	answerAsked(game, 'chooseCloudMove', { row: 0, col: 0 });
	answerAsked(game, 'chooseCloudPlot', { row: 4, col: 4 });
	assert.deepEqual(
		game.state.events.find((e) => e.type === 'districtsCompleted')
			?.districts,
		[3]
	);
	assert.ok(asked(game, 'chooseResource'), 'the reward: any 1 resource');
	assert.ok(!game.state.events.some((e) => e.type === 'buildingPlaced'));
});

test('no move is asked when nothing can move, or on another mat', () => {
	const empty = onMat(10);
	incomeSteps(empty, 2, ['cloudMoves']);
	assert.equal(asked(empty, 'chooseCloudMove'), undefined);
	const basic = onMat(1);
	farms(basic.seat, [[0, 0]]);
	incomeSteps(basic, 2, ['cloudMoves']);
	assert.equal(asked(basic, 'chooseCloudMove'), undefined);
});

test('advancedMatsFor deals the A&A mats only with A&A', () => {
	assert.deepEqual(advancedMatsFor(['aa']), [7, 8, 9, 10, 11, 12]);
	assert.deepEqual(advancedMatsFor(['pp', 'aa']), [7, 8, 9, 10, 11, 12]);
	assert.deepEqual(advancedMatsFor(['pp']), []);
	assert.deepEqual(advancedMatsFor([]), []);
});
