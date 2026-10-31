// The Mesa mat's printed layout (#6); its relief is tested with the others (#132).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import * as pinned from '../tools/art/parts/capital-biomes/mesa.js';

const PRINTED = [
	'.XXXXXXXX',
	'.......XX',
	'........X',
	'.........',
	'.........',
	'.........',
	'.........',
	'XXX......',
	'XXXXXXXX.',
];
test('the layout equals the research grid', () => {
	const impassable = (/** @type {string} */ row) =>
		[...row].map((ch) => ('X'.includes(ch) ? 'X' : '.')).join('');
	assert.deepEqual(pinned.LAYOUT.map(impassable), PRINTED.map(impassable));
});
