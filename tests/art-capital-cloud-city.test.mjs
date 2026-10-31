// The Cloud City mat's printed layout and clouds (#6); its ground, relief and features are tested with the others (#132).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import * as pinned from '../tools/art/parts/capital-biomes/cloud-city.js';
import * as biome from '../tools/art/parts/capital-biomes/cloud-city.js';

const PRINTED = [
	'......X..',
	'........X',
	'.X......X',
	'XX.....XX',
	'.........',
	'.....XX..',
	'XXX....XX',
	'X...X..X.',
	'X..XXX...',
];
test("Cloud City's layout has 22 impassable plots and its cloud map has 9 clouds", () => {
	assert.equal(biome.LAYOUT.length, 9);
	for (const row of biome.LAYOUT) {
		assert.match(row, /^[.X]{9}$/);
	}
	assert.equal(biome.LAYOUT.join('').split('X').length - 1, 22);
	assert.equal(biome.CLOUDS.length, 9);
	assert.equal(new Set(biome.CLOUDS.join('')).size, 9);
});
test('the layout equals the research grid', () => {
	const impassable = (/** @type {string} */ row) =>
		[...row].map((ch) => ('X'.includes(ch) ? 'X' : '.')).join('');
	assert.deepEqual(pinned.LAYOUT.map(impassable), PRINTED.map(impassable));
});
