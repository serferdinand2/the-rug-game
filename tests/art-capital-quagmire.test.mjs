// The Quagmire mat's printed layout, wisps and reeds (#6); its relief, features and ground are tested with the others (#133).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import * as pinned from '../tools/art/parts/capital-biomes/quagmire.js';
import {
	LAYOUT,
	WISPS,
	REEDS,
} from '../tools/art/parts/capital-biomes/quagmire.js';

test('the layout is the printed 9×9 mat with 22 impassable plots, 4 of them wisps', () => {
	assert.equal(LAYOUT.length, 9);
	assert.ok(LAYOUT.every((row) => row.length === 9));
	assert.equal(LAYOUT.join('').split('X').length - 1, 22);
	for (const [r, c] of WISPS) assert.equal(LAYOUT[r][c], 'X');
	for (const [r, c] of REEDS) assert.equal(LAYOUT[r][c], '.');
	assert.equal(WISPS.length, 4);
	assert.equal(REEDS.length, 7);
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
