// The Mesa capital terrain (#6): 14 distinct full-bleed 32×32 tiles and an example mat on the printed layout.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
	LAYOUT,
	drawBiomeTile,
	drawBiomeMat,
	placements,
} from '../art/parts/capital-biomes/mesa.js';

const tiles = [];
for (let v = 0; v < 8; v++) tiles.push(['open', v, drawBiomeTile(false, v)]);
for (let v = 0; v < 6; v++) tiles.push(['blocked', v, drawBiomeTile(true, v)]);

test('mesa: 14 tiles are 32×32 and full bleed', () => {
	assert.equal(tiles.length, 14);
	for (const [kind, v, t] of tiles) {
		assert.deepEqual([t.w, t.h], [32, 32], kind + v);
		assert.ok(
			t.p.every((p) => p !== null),
			kind + v + ' has empty pixels'
		);
	}
});

test('mesa: the 14 tiles are distinct and repeatable', () => {
	assert.equal(new Set(tiles.map(([, , t]) => t.p.join())).size, 14);
	for (const [kind, v, t] of tiles) {
		assert.deepEqual(drawBiomeTile(kind === 'blocked', v), t);
	}
});

test("mesa: the mat is its layout × 32 and its impassable plots are the layout's Xs", () => {
	const mat = drawBiomeMat();
	assert.equal(LAYOUT.length, 9);
	assert.deepEqual(
		[mat.w, mat.h],
		[LAYOUT[0].length * 32, LAYOUT.length * 32]
	);
	assert.equal(LAYOUT.join('').split('X').length - 1, 22);
	const placed = placements();
	LAYOUT.forEach((row, r) =>
		[...row].forEach((ch, c) => {
			const cell = placed[r][c];
			assert.equal(cell.blocked, ch === 'X', r + ',' + c);
			const tile = drawBiomeTile(cell.blocked, cell.variant);
			for (let y = 0; y < 32; y++) {
				for (let x = 0; x < 32; x++) {
					assert.equal(
						mat.p[(r * 32 + y) * mat.w + c * 32 + x],
						tile.p[y * 32 + x],
						r + ',' + c
					);
				}
			}
		})
	);
});
