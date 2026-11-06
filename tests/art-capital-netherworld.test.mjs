// The Netherworld mat's printed layout (#6); its relief, overlay and ground are tested with the others (#133).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import * as pinned from '../tools/art/parts/capital-biomes/netherworld.js';
import { LAYOUT } from '../tools/art/parts/capital-biomes/netherworld.js';

test('the layout is 9×9 with 22 impassable plots, four imps and a centre', () => {
	assert.equal(LAYOUT.length, 9);
	assert.ok(LAYOUT.every((row) => row.length === 9));
	assert.equal(LAYOUT.join('').split('X').length - 1, 22);
	assert.equal(LAYOUT.join('').split('I').length - 1, 4);
	assert.equal(LAYOUT.join('').split('C').length - 1, 1);
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
