// The City in a Bottle capital terrain (#6): 14 distinct full-bleed tiles and an example mat that follows the printed layout.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
	LAYOUT,
	PLACEMENT,
	drawBiomeTile,
	drawBiomeMat,
} from '../art/parts/capital-biomes/city-in-a-bottle.js';

/** @returns {import('../art/painter.js').Canvas[]} */
function allTiles() {
	const tiles = [];
	for (let v = 0; v < 8; v++) tiles.push(drawBiomeTile(false, v));
	for (let v = 0; v < 6; v++) tiles.push(drawBiomeTile(true, v));
	return tiles;
}

test('the layout is the printed 6×6 mat with 17 impassable plots', () => {
	assert.equal(LAYOUT.length, 6);
	assert.ok(LAYOUT.every((row) => row.length === 6));
	assert.equal(LAYOUT.join('').split('X').length - 1, 17);
});

test('the 14 tiles are 32×32, full bleed, drawn the same each time and all different', () => {
	const tiles = allTiles();
	assert.equal(tiles.length, 14);
	for (const tile of tiles) {
		assert.deepEqual([tile.w, tile.h], [32, 32]);
		assert.ok(tile.p.every((pixel) => pixel !== null));
	}
	assert.deepEqual(tiles, allTiles());
	assert.equal(new Set(tiles.map((tile) => tile.p.join())).size, 14);
});

test('the example mat is 192×192 and its impassable plots are exactly the layout X plots', () => {
	const mat = drawBiomeMat();
	assert.deepEqual([mat.w, mat.h], [6 * 32, 6 * 32]);
	assert.ok(mat.p.every((pixel) => pixel !== null));
	LAYOUT.forEach((row, r) =>
		[...row].forEach((cell, c) => {
			const placed = PLACEMENT[r][c];
			assert.equal(placed.blocked, cell === 'X', `plot ${r},${c}`);
			// the bottle's glass is drawn only in the outer 4 pixels of the mat, so each plot's middle is its tile
			const tile = drawBiomeTile(placed.blocked, placed.variant);
			for (let y = 4; y < 28; y++) {
				for (let x = 4; x < 28; x++) {
					assert.equal(
						mat.p[(r * 32 + y) * mat.w + c * 32 + x],
						tile.p[y * 32 + x],
						`plot ${r},${c}`
					);
				}
			}
		})
	);
});
