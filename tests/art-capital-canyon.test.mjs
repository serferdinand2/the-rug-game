// The canyon capital terrain (#6): 14 distinct full-bleed tiles and an example mat on the printed layout.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import {
	LAYOUT,
	drawBiomeTile,
	drawBiomeMat,
	placement,
} from '../art/parts/capital-biomes/canyon.js';

const tiles = [
	...Array.from({ length: 8 }, (_, v) => [false, v]),
	...Array.from({ length: 6 }, (_, v) => [true, v]),
].map(([blocked, v]) => drawBiomeTile(blocked, v));

test('the 14 tiles are 32×32, full bleed and distinct', () => {
	for (const tile of tiles) {
		assert.deepEqual([tile.w, tile.h], [32, 32]);
		assert.ok(tile.p.every((pixel) => pixel !== null));
	}
	assert.equal(new Set(tiles.map((t) => t.p.join())).size, 14);
});

test('the layout matches the printed mat', () => {
	assert.equal(LAYOUT.length, 9);
	assert.ok(LAYOUT.every((row) => row.length === 9));
	assert.equal(LAYOUT.join('').split('X').length - 1, 19);
	assert.equal(LAYOUT.join('').split('C').length - 1, 6);
});

test('the mat is the grid times 32 and its impassable plots are exactly the layout X plots', () => {
	const mat = drawBiomeMat();
	assert.deepEqual([mat.w, mat.h], [9 * 32, 9 * 32]);
	const blockedTiles = Array.from({ length: 6 }, (_, v) =>
		drawBiomeTile(true, v).p.join()
	);
	const plan = placement();
	LAYOUT.forEach((line, row) =>
		[...line].forEach((ch, col) => {
			const plot = [];
			for (let y = 0; y < 32; y++) {
				for (let x = 0; x < 32; x++) {
					plot.push(mat.p[(row * 32 + y) * mat.w + col * 32 + x]);
				}
			}
			assert.equal(plan[row][col].blocked, ch === 'X');
			if (ch === 'X') {
				assert.equal(
					plot.join(),
					drawBiomeTile(true, plan[row][col].variant).p.join()
				);
			} else {
				assert.ok(!blockedTiles.includes(plot.join()));
			}
		})
	);
});
