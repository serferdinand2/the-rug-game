// The Veil mat's printed layout (#6); its relief, overlay and ground are tested with the others (#133).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import * as pinned from '../tools/art/parts/capital-biomes/veil.js';

/**
 * The printed grid copied from docs/research/03-expansions.md, Veil (#15), so the layout can't drift with its own code.
 * @type {readonly string[]}
 */
const PRINTED = [
	'......XX.',
	'.....X...',
	'......X..',
	'......XXX',
	'.....X...',
	'....XX...',
	'...XXX...',
	'..XX..X.X',
	'XXX....XX',
];

test('the layout equals the research grid', () => {
	const impassable = (/** @type {string} */ row) =>
		[...row].map((ch) => ('X'.includes(ch) ? 'X' : '.')).join('');
	assert.deepEqual(pinned.LAYOUT.map(impassable), PRINTED.map(impassable));
});
