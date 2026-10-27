// The Savanna capital terrain (#6): 14 distinct full-bleed plots and an example mat on the printed layout.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import * as pinned from '../art/parts/capital-biomes/savanna.js';
import {
	LAYOUT,
	UNICORNS,
	drawBiomeTile,
	drawBiomeMat,
	matPlacement,
} from '../art/parts/capital-biomes/savanna.js';

const tiles = [
	...Array.from({ length: 8 }, (_, v) => ({ blocked: false, variant: v })),
	...Array.from({ length: 6 }, (_, v) => ({ blocked: true, variant: v })),
];

test('the Savanna has 14 distinct, full-bleed 32×32 plots', () => {
	const seen = new Set();
	for (const { blocked, variant } of tiles) {
		const tile = drawBiomeTile(blocked, variant);
		assert.deepEqual([tile.w, tile.h], [32, 32]);
		assert.ok(
			tile.p.every((pixel) => pixel !== null),
			`${blocked} ${variant}`
		);
		seen.add(tile.p.join());
	}
	assert.equal(seen.size, 14);
});

test('the Savanna mat is 9×9 plots with 22 impassable ones, the six unicorn herds among them', () => {
	assert.equal(LAYOUT.length, 9);
	assert.ok(LAYOUT.every((row) => row.length === 9));
	assert.equal(LAYOUT.join('').split('X').length - 1, 22);
	for (const [row, col] of UNICORNS) {
		assert.equal(LAYOUT[row][col], 'X', `unicorn ${row},${col}`);
	}
	const mat = drawBiomeMat();
	assert.deepEqual([mat.w, mat.h], [288, 288]);
	const placement = matPlacement();
	for (let y = 0; y < 9; y++) {
		for (let x = 0; x < 9; x++) {
			const { blocked, variant, herd } = placement[y][x];
			assert.equal(blocked, LAYOUT[y][x] === 'X', `plot ${y},${x}`);
			assert.equal(
				herd,
				UNICORNS.some(([r, c]) => r === y && c === x)
			);
			if (herd) {
				continue;
			}
			// Thin district borders are drawn over the edge pixels, so most of the plot is the tile.
			const tile = drawBiomeTile(blocked, variant);
			let same = 0;
			for (let i = 0; i < 1024; i++) {
				const col =
					mat.p[
						(y * 32 + Math.floor(i / 32)) * 288 + x * 32 + (i % 32)
					];
				same += col === tile.p[i] ? 1 : 0;
			}
			assert.ok(same >= 900, `plot ${y},${x} is its tile`);
		}
	}
});

/**
 * The printed grid copied from docs/research/03-expansions.md, Savanna (#16), so the layout can't drift with its own code.
 * @type {readonly string[]}
 */
const PRINTED = [
	'....XXXUX',
	'...XU....',
	'.........',
	'...X.....',
	'UXXU..XX.',
	'XX...XU..',
	'.....XX..',
	'.........',
	'XU.......',
];

test('the layout equals the research grid', () => {
	const impassable = (/** @type {string} */ row) =>
		[...row].map((ch) => ('XU'.includes(ch) ? 'X' : '.')).join('');
	assert.deepEqual(pinned.LAYOUT.map(impassable), PRINTED.map(impassable));

	/** @type {number[][]} */
	const herds = [];
	PRINTED.forEach((row, r) =>
		[...row].forEach((ch, c) => {
			if (ch === 'U') {
				herds.push([r, c]);
			}
		})
	);
	assert.deepEqual(
		pinned.UNICORNS.map((p) => [...p]),
		herds
	);
});
