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
import '../src/lib/engine/kinds.js';
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

test('advancedMatsFor deals the A&A mats only with A&A', () => {
	assert.deepEqual(advancedMatsFor(['aa']), [7, 8, 9, 10, 11, 12]);
	assert.deepEqual(advancedMatsFor(['pp', 'aa']), [7, 8, 9, 10, 11, 12]);
	assert.deepEqual(advancedMatsFor(['pp']), []);
	assert.deepEqual(advancedMatsFor([]), []);
});
