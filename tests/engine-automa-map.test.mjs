// Tests for Automa target orderings and rulebook path distance (02 §9.6–§9.8, R41).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { MAPS, hexNeighbours } from '../src/lib/engine/data/maps.js';
import { startedGame } from './helpers/engine.mjs';
import {
	HEX_PATTERNS,
	APP_HEXES,
	hexesByPattern,
	automaDistance,
} from '../src/lib/engine/automa-map.js';

test('the ten hex tiebreaker patterns each order all 34 small-map hexes once', () => {
	assert.equal(HEX_PATTERNS.length, 10);
	for (const [index, pattern] of HEX_PATTERNS.entries()) {
		assert.equal(pattern.length, 34, `pattern ${index + 1}`);
		assert.deepEqual(
			[...pattern].sort((a, b) => a - b),
			Array.from({ length: 34 }, (_, i) => i)
		);
		assert.equal(new Set(hexesByPattern(index + 1)).size, 34);
	}
});

test('app hex ids map to board coordinates and neighbour ids independently of MAPS order (§7.3, R40)', () => {
	assert.equal(APP_HEXES[4], '-2_-2');
	assert.equal(APP_HEXES[16], '0_0');
	assert.equal(APP_HEXES[22], '2_0');
	assert.equal(APP_HEXES[24], '0_2');
	const onBoard = new Set(MAPS.small.hexes);
	const middleNeighbours = hexNeighbours(APP_HEXES[16])
		.filter((hex) => onBoard.has(hex))
		.map((hex) => APP_HEXES.indexOf(hex));
	// hexNeighbours() orders N, NE, SE, S, SW, NW; the app table lists N, NW, SW, S, SE, NE.
	assert.deepEqual(middleNeighbours, [9, 13, 20, 23, 19, 12]);
	assert.deepEqual(hexesByPattern(1).slice(0, 5), [
		'-3_-3',
		'-3_-2',
		'-3_-1',
		'-2_-3',
		'-2_-2',
	]);
	assert.throws(() => hexesByPattern(0), /pattern/i);
	assert.throws(() => hexesByPattern(11), /pattern/i);
});

/** @returns {any} */
function game() {
	return startedGame(3).state;
}

function setOutposts(state, hex, ...seats) {
	state.hexes[hex].outposts = seats.map((seat) => ({ seat, toppled: false }));
}

function setTokens(state, hex, ...seats) {
	state.hexes[hex].tokens = seats.map((seat) => ({ seat, civ: 'test' }));
}

test('path distance is zero at the source and uses adjacent hex steps (R41)', () => {
	const state = game();
	assert.equal(automaDistance(state, 2, 1, '-3_-3', '-3_-3'), 0);
	assert.equal(automaDistance(state, 2, 1, '-3_-3', '0_0'), 3);
});

test('an Automa outpost blocks a path, while other seats’ outposts and unexplored hexes do not', () => {
	const state = game();
	state.hexes['-2_-2'].tile = null;
	setOutposts(state, '-2_-2', 2);
	assert.equal(automaDistance(state, 2, 1, '-3_-3', '0_0'), 4);
	setOutposts(state, '-2_-2', 3);
	assert.equal(automaDistance(state, 2, 1, '-3_-3', '0_0'), 3);
});

test('more than one human-owned map item blocks the path, but one is allowed (R41)', () => {
	const state = game();
	setOutposts(state, '-2_-2', 1);
	assert.equal(automaDistance(state, 2, 1, '-3_-3', '0_0'), 3);
	setTokens(state, '-2_-2', 1);
	assert.equal(automaDistance(state, 2, 1, '-3_-3', '0_0'), 4);
	setTokens(state, '-2_-2', 1, 3);
	// The human outpost plus human token still block it; adding a Shadow token cannot unblock them.
	assert.equal(automaDistance(state, 2, 1, '-3_-3', '0_0'), 4);
});

test('unreachable or off-map destinations have infinite distance', () => {
	const state = game();
	for (const hex of MAPS.small.hexes) {
		if (hex !== '-3_-3' && hex !== '0_0') {
			setOutposts(state, hex, 2);
		}
	}
	assert.equal(automaDistance(state, 2, 1, '-3_-3', '0_0'), Infinity);
	assert.equal(automaDistance(state, 2, 1, '-3_-3', '4_4'), Infinity);
});
