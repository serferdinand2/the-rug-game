// The Swamp capital terrain (#6): 14 distinct full-bleed 32×32 tiles and an example mat with lily pads on the printed layout.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as pinned from '../art/parts/capital-biomes/swamp.js';
import {
	LAYOUT,
	drawBiomeTile,
	drawBiomeMat,
	placements,
} from '../art/parts/capital-biomes/swamp.js';

const tiles = [];
for (let v = 0; v < 8; v++) tiles.push(['open', v, drawBiomeTile(false, v)]);
for (let v = 0; v < 6; v++) tiles.push(['blocked', v, drawBiomeTile(true, v)]);

test('swamp: 14 tiles are 32×32 and full bleed', () => {
	assert.equal(tiles.length, 14);
	for (const [kind, v, t] of tiles) {
		assert.deepEqual([t.w, t.h], [32, 32], kind + v);
		assert.ok(
			t.p.every((p) => p !== null),
			kind + v + ' has empty pixels'
		);
	}
});

test('swamp: the 14 tiles are distinct and repeatable', () => {
	assert.equal(new Set(tiles.map(([, , t]) => t.p.join())).size, 14);
	for (const [kind, v, t] of tiles) {
		assert.deepEqual(drawBiomeTile(kind === 'blocked', v), t);
	}
});

test("swamp: the mat is its layout × 32 and its impassable plots are the layout's Xs; the 6 lily pads are open", () => {
	const mat = drawBiomeMat();
	assert.equal(LAYOUT.length, 9);
	assert.deepEqual(
		[mat.w, mat.h],
		[LAYOUT[0].length * 32, LAYOUT.length * 32]
	);
	assert.equal(LAYOUT.join('').split('X').length - 1, 18);
	assert.equal(LAYOUT.join('').split('L').length - 1, 6);
	const placed = placements();
	LAYOUT.forEach((row, r) =>
		[...row].forEach((ch, c) => {
			const cell = placed[r][c];
			assert.equal(cell.blocked, ch === 'X', r + ',' + c);
			assert.equal(cell.lily, ch === 'L', r + ',' + c);
			const tile = drawBiomeTile(cell.blocked, cell.variant);
			let same = 0;
			for (let y = 0; y < 32; y++) {
				for (let x = 0; x < 32; x++) {
					if (
						mat.p[(r * 32 + y) * mat.w + c * 32 + x] ===
						tile.p[y * 32 + x]
					)
						same++;
				}
			}
			// A lily pad is drawn over its tile; every other plot is its tile exactly
			if (cell.lily) assert.ok(same < 1024 && same > 400, r + ',' + c);
			else assert.equal(same, 1024, r + ',' + c);
		})
	);
});

/**
 * The printed grid copied from docs/research/03-expansions.md, Swamp (#12), so the layout can't drift with its own code.
 * @type {readonly string[]}
 */
const PRINTED = [
	'XXL......',
	'X...LXX..',
	'.......XL',
	'..X....XX',
	'...XX....',
	'...XX....',
	'.LXXXL...',
	'.....X.L.',
	'.....X...',
];

test('the layout equals the research grid', () => {
	// A lily pad is an open plot that counts as completed, so it stays open here; the printed L is kept in LAYOUT too.
	assert.deepEqual([...pinned.LAYOUT], PRINTED);
});
