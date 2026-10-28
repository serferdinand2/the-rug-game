// Tests for the joined footprint of a capital layout's impassable plots (#82).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { CAPITAL_MATS } from '../src/lib/engine/data/capitals.js';
import { CAPITAL_GRIDS } from '../tools/art/parts/capital-terrain.js';
import { reliefSize } from '../src/lib/art/relief.js';
import {
	footprint,
	impassableGroups,
	isImpassable,
} from '../tools/art/parts/capital-relief/footprint.js';

const SPECIMEN = [
	'000000000',
	'010011000',
	'000000000',
	'010000100',
	'001001000',
	'000000000',
	'011000110',
	'010000110',
	'000000000',
];

test('impassable plots that touch by a side or a corner are one group', () => {
	assert.deepEqual(
		impassableGroups(SPECIMEN).map((g) => g.length),
		[1, 2, 2, 2, 3, 4]
	);
});

test('each base mat has the groups and corner joins its layout gives', () => {
	const expected = {
		mountain: [[13, 4, 2, 1, 1, 1], 0],
		wetland: [[8, 4, 3, 2, 2, 2, 1], 1],
		tropical: [[11, 5, 3, 1, 1, 1], 4],
		desert: [[10, 3, 3, 2, 2, 1, 1], 1],
		grassland: [[15, 4, 2, 1], 1],
		forest: [[19, 3], 6],
	};
	for (const mat of CAPITAL_MATS) {
		const [sizes, corners] = expected[mat.id];
		assert.deepEqual(
			impassableGroups(mat.grid)
				.map((g) => g.length)
				.sort((a, b) => b - a),
			sizes,
			mat.id
		);
		assert.equal(footprint(mat.grid).corners.length, corners, mat.id);
	}
});

test('a corner-only join is found on both diagonals', () => {
	assert.deepEqual(footprint(SPECIMEN).corners, [
		{ row: 3, col: 1, gx: 65, gy: 131, down: true },
		{ row: 3, col: 5, gx: 197, gy: 131, down: false },
	]);
});

test('a lone plot keeps a ground margin; joined plots run across their gap', () => {
	const fp = footprint(SPECIMEN);
	const at = (x, y) => fp.mask[y * fp.w + x];
	assert.equal(at(33 + 16, 33 + 16), 1); // the lone plot's middle
	assert.equal(at(33 + 0, 33 + 16), 0); // its open side's margin
	assert.equal(at(5 * 33 - 1, 33 + 16), 1); // the gap inside the side pair
	assert.equal(at(2 * 33 - 1, 33 + 16), 0); // the gap beside the lone plot
});

test('nothing reaches a buildable plot except within a corner patch', () => {
	for (const layout of [SPECIMEN, ...CAPITAL_MATS.map((m) => m.grid)]) {
		const fp = footprint(layout);
		for (let y = 0; y < fp.h; y++) {
			for (let x = 0; x < fp.w; x++) {
				const onPlot = x % 33 < 32 && y % 33 < 32;
				const open =
					onPlot &&
					!isImpassable(
						layout,
						Math.floor(y / 33),
						Math.floor(x / 33)
					);
				if (open && (fp.mask[y * fp.w + x] || fp.reach[y * fp.w + x])) {
					assert.ok(
						fp.corners.some(
							(c) => Math.hypot(x - c.gx, y - c.gy) <= 16
						),
						`${x},${y}`
					);
				}
				if (open) {
					assert.equal(fp.plots[y * fp.w + x], 0, `${x},${y}`);
				}
			}
		}
	}
});

test('the toolkit reads the base layouts from the engine', () => {
	for (const mat of CAPITAL_MATS) {
		assert.deepEqual(CAPITAL_GRIDS[mat.id], mat.grid);
	}
	assert.deepEqual(reliefSize(9, 9), { w: 296, h: 296 });
	assert.deepEqual(reliefSize(11, 9), { w: 296, h: 362 });
});
