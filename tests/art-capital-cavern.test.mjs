// The Cavern capital terrain (#6): 14 distinct full-bleed plots and an example mat on the printed layout.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import * as pinned from '../art/parts/capital-biomes/cavern.js';
import * as biome from '../art/parts/capital-biomes/cavern.js';

const OPEN = 8;
const BLOCKED = 6;

/** @returns {{ blocked: boolean, variant: number, canvas: import('../art/painter.js').Canvas }[]} */
function tiles() {
	const all = [];
	for (let variant = 0; variant < OPEN; variant++) {
		all.push({
			blocked: false,
			variant,
			canvas: biome.drawBiomeTile(false, variant),
		});
	}
	for (let variant = 0; variant < BLOCKED; variant++) {
		all.push({
			blocked: true,
			variant,
			canvas: biome.drawBiomeTile(true, variant),
		});
	}
	return all;
}

test('Cavern has 14 plots, each 32×32 and full bleed', () => {
	const all = tiles();
	assert.equal(all.length, 14);
	for (const { canvas } of all) {
		assert.deepEqual([canvas.w, canvas.h], [32, 32]);
		assert.ok(canvas.p.every((pixel) => pixel !== null));
	}
});

test("Cavern's 14 plots are all different", () => {
	const seen = new Set(tiles().map(({ canvas }) => canvas.p.join('')));
	assert.equal(seen.size, 14);
});

test("Cavern's layout is a 9×9 grid of 20 impassable plots", () => {
	assert.equal(biome.LAYOUT.length, 9);
	for (const row of biome.LAYOUT) {
		assert.match(row, /^[.X]{9}$/);
	}
	assert.equal(biome.LAYOUT.join('').split('X').length - 1, 20);
});

test("the Cavern mat is its grid × 32 and its impassable plots are exactly the layout's Xs", () => {
	const mat = biome.drawBiomeMat();
	assert.deepEqual(
		[mat.w, mat.h],
		[biome.LAYOUT[0].length * 32, biome.LAYOUT.length * 32]
	);
	const plan = biome.matPlan();
	assert.equal(plan.length, biome.LAYOUT.length * biome.LAYOUT[0].length);
	for (const { row, col, blocked, variant } of plan) {
		assert.equal(
			blocked,
			biome.LAYOUT[row][col] === 'X',
			`plot ${row},${col}`
		);
		const tile = biome.drawBiomeTile(blocked, variant);
		for (let y = 0; y < 32; y++) {
			for (let x = 0; x < 32; x++) {
				assert.equal(
					mat.p[(row * 32 + y) * mat.w + col * 32 + x],
					tile.p[y * 32 + x],
					`plot ${row},${col}`
				);
			}
		}
	}
});

/**
 * The printed grid copied from docs/research/03-expansions.md, Cavern (#9), so the layout can't drift with its own code.
 * @type {readonly string[]}
 */
const PRINTED = [
	'XX...XXX.',
	'...X..X..',
	'...X..X..',
	'...X.....',
	'..XX.....',
	'..XXX....',
	'.........',
	'....X....',
	'...XXXX..',
];

test('the layout equals the research grid', () => {
	const impassable = (/** @type {string} */ row) =>
		[...row].map((ch) => ('X'.includes(ch) ? 'X' : '.')).join('');
	assert.deepEqual(pinned.LAYOUT.map(impassable), PRINTED.map(impassable));
});
