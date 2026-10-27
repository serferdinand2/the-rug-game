// The Quagmire capital terrain (#6): 14 distinct full-bleed tiles and an example mat that follows the printed layout.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as pinned from '../art/parts/capital-biomes/quagmire.js';
import {
	LAYOUT,
	WISPS,
	REEDS,
	PLACEMENT,
	drawBiomeTile,
	drawBiomeMat,
} from '../art/parts/capital-biomes/quagmire.js';

/** @returns {import('../art/painter.js').Canvas[]} */
function allTiles() {
	const tiles = [];
	for (let v = 0; v < 8; v++) tiles.push(drawBiomeTile(false, v));
	for (let v = 0; v < 6; v++) tiles.push(drawBiomeTile(true, v));
	return tiles;
}

test('the layout is the printed 9×9 mat with 22 impassable plots, 4 of them wisps', () => {
	assert.equal(LAYOUT.length, 9);
	assert.ok(LAYOUT.every((row) => row.length === 9));
	assert.equal(LAYOUT.join('').split('X').length - 1, 22);
	for (const [r, c] of WISPS) assert.equal(LAYOUT[r][c], 'X');
	for (const [r, c] of REEDS) assert.equal(LAYOUT[r][c], '.');
	assert.equal(WISPS.length, 4);
	assert.equal(REEDS.length, 7);
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

test('the example mat is 288×288 and its impassable plots are exactly the layout X plots', () => {
	const mat = drawBiomeMat();
	assert.deepEqual([mat.w, mat.h], [9 * 32, 9 * 32]);
	LAYOUT.forEach((row, r) =>
		[...row].forEach((cell, c) => {
			const placed = PLACEMENT[r][c];
			assert.equal(placed.blocked, cell === 'X', `plot ${r},${c}`);
			const tile = drawBiomeTile(placed.blocked, placed.variant);
			for (let y = 0; y < 32; y++) {
				for (let x = 0; x < 32; x++) {
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

test('wisps use the wisp tile and reeds the reed tiles', () => {
	for (const [r, c] of WISPS)
		assert.deepEqual(PLACEMENT[r][c], { blocked: true, variant: 5 });
	for (const [r, c] of REEDS)
		assert.ok(PLACEMENT[r][c].variant >= 6 && !PLACEMENT[r][c].blocked);
});

/**
 * The printed grid copied from docs/research/03-expansions.md, Quagmire (#13), so the layout can't drift with its own code.
 * @type {readonly string[]}
 */
const PRINTED = [
	'.....XWr.',
	'.....Xr..',
	'....X....',
	'...XWr...',
	'...Xr....',
	'...X.....',
	'..XX...rX',
	'.rWX..rWX',
	'.XXXX.XXX',
];

test('the layout equals the research grid', () => {
	const impassable = (/** @type {string} */ row) =>
		[...row].map((ch) => ('XW'.includes(ch) ? 'X' : '.')).join('');
	assert.deepEqual(pinned.LAYOUT.map(impassable), PRINTED.map(impassable));

	/** @type {number[][]} */
	const wisps = [];
	/** @type {number[][]} */
	const reeds = [];
	PRINTED.forEach((row, r) =>
		[...row].forEach((ch, c) => {
			if (ch === 'W') {
				wisps.push([r, c]);
			}
			if (ch === 'r') {
				reeds.push([r, c]);
			}
		})
	);
	assert.deepEqual(
		pinned.WISPS.map((p) => [...p]),
		wisps
	);
	assert.deepEqual(
		pinned.REEDS.map((p) => [...p]),
		reeds
	);
});
