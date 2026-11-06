// The Polar mat's printed layout (#6); its relief, overlay and ground are tested with the others (#133).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import * as pinned from '../tools/art/parts/capital-biomes/polar.js';
import { LAYOUT } from '../tools/art/parts/capital-biomes/polar.js';

test('the layout is 9×9 with 22 impassable plots', () => {
	assert.equal(LAYOUT.length, 9);
	assert.ok(LAYOUT.every((row) => row.length === 9));
	assert.equal(LAYOUT.join('').split('X').length - 1, 22);
});

/**
 * The printed grid copied from docs/research/03-expansions.md, Polar (#17), so the layout can't drift with its own code.
 * @type {readonly string[]}
 */
const PRINTED = [
	'.A.XB.X..',
	'..A.XX.CC',
	'D..X.BXXX',
	'.D.XA.BBX',
	'..X.XXXX.',
	'XX.DXXAAA',
	'.EEE.X...',
	'F...X.DD.',
	'.F.X.E..D',
];

test('the layout equals the research grid', () => {
	assert.deepEqual([...pinned.LAYOUT], PRINTED);
});
