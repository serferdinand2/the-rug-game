// The Swamp mat's printed layout (#6); its relief and features are tested with the others (#132).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import * as pinned from '../tools/art/parts/capital-biomes/swamp.js';

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
