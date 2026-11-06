// The Savanna mat's printed layout and herds (#6); its relief, overlay and ground are tested with the others (#133).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import * as pinned from '../tools/art/parts/capital-biomes/savanna.js';
import {
	LAYOUT,
	UNICORNS,
	DISTRICTS,
} from '../tools/art/parts/capital-biomes/savanna.js';

/**
 * The printed grid copied from docs/research/03-expansions.md, Savanna (#16), so the layout can't drift with its own code.
 * @type {readonly string[]}
 */
const PRINTED = [
	'....XXXUX',
	'...XU....',
	'.........',
	'...X.....',
	'UXXU..XX.',
	'XX...XU..',
	'.....XX..',
	'.........',
	'XU.......',
];

test('the layout equals the research grid', () => {
	const impassable = (/** @type {string} */ row) =>
		[...row].map((ch) => ('XU'.includes(ch) ? 'X' : '.')).join('');
	assert.deepEqual(pinned.LAYOUT.map(impassable), PRINTED.map(impassable));

	/** @type {number[][]} */
	const herds = [];
	PRINTED.forEach((row, r) =>
		[...row].forEach((ch, c) => {
			if (ch === 'U') {
				herds.push([r, c]);
			}
		})
	);
	assert.deepEqual(
		pinned.UNICORNS.map((p) => [...p]),
		herds
	);
});

test('the six herds stand on impassable plots, one in the middle of each district (#133)', () => {
	assert.equal(UNICORNS.length, 6);
	const seen = new Set();
	for (const [r, c] of UNICORNS) {
		assert.equal(LAYOUT[r][c], 'X', `${r},${c}`);
		const district = DISTRICTS[r][c];
		assert.match(district, /[1-6]/, `${r},${c}`);
		seen.add(district);
	}
	assert.equal(seen.size, 6);
});
