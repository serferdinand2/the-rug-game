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

test('advancedMatsFor deals the A&A mats only with A&A', () => {
	assert.deepEqual(advancedMatsFor(['aa']), [7, 8, 9, 10, 11, 12]);
	assert.deepEqual(advancedMatsFor(['pp', 'aa']), [7, 8, 9, 10, 11, 12]);
	assert.deepEqual(advancedMatsFor(['pp']), []);
	assert.deepEqual(advancedMatsFor([]), []);
});
