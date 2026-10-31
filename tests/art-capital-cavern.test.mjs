// The Cavern mat's printed layout (#6); its relief is tested with the others (#132).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import * as pinned from '../tools/art/parts/capital-biomes/cavern.js';
import * as biome from '../tools/art/parts/capital-biomes/cavern.js';

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
test("Cavern's layout is a 9×9 grid of 20 impassable plots", () => {
	assert.equal(biome.LAYOUT.length, 9);
	for (const row of biome.LAYOUT) {
		assert.match(row, /^[.X]{9}$/);
	}
	assert.equal(biome.LAYOUT.join('').split('X').length - 1, 20);
});
test('the layout equals the research grid', () => {
	const impassable = (/** @type {string} */ row) =>
		[...row].map((ch) => ('X'.includes(ch) ? 'X' : '.')).join('');
	assert.deepEqual(pinned.LAYOUT.map(impassable), PRINTED.map(impassable));
});
