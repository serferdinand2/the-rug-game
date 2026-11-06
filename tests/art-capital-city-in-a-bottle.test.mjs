// The City in a Bottle mat's printed layout (#6); its relief, overlay and ground are tested with the others (#133).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import * as pinned from '../tools/art/parts/capital-biomes/city-in-a-bottle.js';
import { LAYOUT } from '../tools/art/parts/capital-biomes/city-in-a-bottle.js';

test('the layout is the printed 6×6 mat with 17 impassable plots', () => {
	assert.equal(LAYOUT.length, 6);
	assert.ok(LAYOUT.every((row) => row.length === 6));
	assert.equal(LAYOUT.join('').split('X').length - 1, 17);
});

/**
 * The printed grid copied from docs/research/03-expansions.md, City in a Bottle (#14), so the layout can't drift with its own code.
 * @type {readonly string[]}
 */
const PRINTED = ['.XX..X', '.X.X.X', '...XX.', '.XX.X.', 'XX...X', '..XXX.'];

test('the layout equals the research grid', () => {
	const impassable = (/** @type {string} */ row) =>
		[...row].map((ch) => ('X'.includes(ch) ? 'X' : '.')).join('');
	assert.deepEqual(pinned.LAYOUT.map(impassable), PRINTED.map(impassable));
});
