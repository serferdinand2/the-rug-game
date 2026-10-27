// The Netherworld capital terrain (#6): 14 distinct full-bleed tiles and an example mat on the printed layout.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import * as pinned from '../tools/art/parts/capital-biomes/netherworld.js';
import {
	LAYOUT,
	PLACEMENT,
	drawBiomeTile,
	drawBiomeMat,
} from '../tools/art/parts/capital-biomes/netherworld.js';

/** @returns {import('../tools/art/painter.js').Canvas[]} */
function allTiles() {
	const tiles = [];
	for (let v = 0; v < 8; v++) tiles.push(drawBiomeTile(false, v));
	for (let v = 0; v < 6; v++) tiles.push(drawBiomeTile(true, v));
	return tiles;
}

test('the layout is 9×9 with 22 impassable plots, four imps and a centre', () => {
	assert.equal(LAYOUT.length, 9);
	assert.ok(LAYOUT.every((row) => row.length === 9));
	assert.equal(LAYOUT.join('').split('X').length - 1, 22);
	assert.equal(LAYOUT.join('').split('I').length - 1, 4);
	assert.equal(LAYOUT.join('').split('C').length - 1, 1);
});

test('the 14 tiles are 32×32, full bleed and distinct', () => {
	const tiles = allTiles();
	assert.equal(tiles.length, 14);
	for (const tile of tiles) {
		assert.deepEqual([tile.w, tile.h], [32, 32]);
		assert.ok(tile.p.every((pixel) => pixel !== null));
	}
	assert.equal(new Set(tiles.map((t) => t.p.join())).size, 14);
});

test("the example mat is its grid × 32 and its impassable plots are the layout's Xs", () => {
	const mat = drawBiomeMat();
	assert.deepEqual(
		[mat.w, mat.h],
		[LAYOUT[0].length * 32, LAYOUT.length * 32]
	);
	assert.ok(mat.p.every((pixel) => pixel !== null));
	LAYOUT.forEach((rowText, row) => {
		[...rowText].forEach((ch, col) => {
			const placed = PLACEMENT[row][col];
			assert.equal(placed.blocked, ch === 'X', `plot ${row},${col}`);
			// The plot shows the tile placed there, except for the few pixels of printed features drawn over it.
			const tile = drawBiomeTile(placed.blocked, placed.variant);
			let same = 0;
			for (let y = 0; y < 32; y++) {
				for (let x = 0; x < 32; x++) {
					if (
						mat.p[(row * 32 + y) * mat.w + col * 32 + x] ===
						tile.p[y * 32 + x]
					)
						same++;
				}
			}
			assert.ok(
				same >= 600,
				`plot ${row},${col} matches its tile (${same}/1024)`
			);
		});
	});
});

/**
 * The printed grid copied from docs/research/03-expansions.md, Netherworld (#18), so the layout can't drift with its own code.
 * @type {readonly string[]}
 */
const PRINTED = [
	'X...XX...',
	'XI..X..I.',
	'X.XXX....',
	'X.....XXX',
	'X...C....',
	'.XX......',
	'....XXX..',
	'.I.XX..I.',
	'...X.....',
];

test('the layout equals the research grid', () => {
	assert.deepEqual([...pinned.LAYOUT], PRINTED);
});
