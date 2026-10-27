// Tests for the map rules: matching sides, legal explore and conquer hexes (#17; R5, R16).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { MAPS, hexNeighbours } from '../src/lib/engine/data/maps.js';
import { TERRITORY_TILES } from '../src/lib/engine/data/territory-tiles.js';
import {
	matchingSides,
	exploreHexes,
	conquerTargets,
	loneOpponent,
} from '../src/lib/engine/map.js';
import { cornersOf, turned } from '../src/lib/engine/terrain.js';
import { startedGame } from './helpers/engine.mjs';

/**
 * A small-map game with every outpost cleared.
 * @returns {any}
 */
function bareGame() {
	const { state } = startedGame(2);
	for (const hex of Object.values(state.hexes)) {
		hex.outposts = [];
	}
	return state;
}

/**
 * @param {any} state
 * @param {string} hex
 * @param {...[number, boolean]} outposts - [seat, toppled]
 */
function put(state, hex, ...outposts) {
	state.hexes[hex].outposts = outposts.map(([seat, toppled]) => ({
		seat,
		toppled,
	}));
}

test('every pair of neighbouring printed territories matches on the shared side, on both maps (R5)', () => {
	for (const side of [MAPS.small, MAPS.large]) {
		let pairs = 0;
		for (const [key, p] of Object.entries(side.printed)) {
			hexNeighbours(key).forEach((other, e) => {
				const q = side.printed[other];
				if (!q) {
					return;
				}
				pairs++;
				const mine = turned(p.corners, p.orient);
				const theirs = turned(q.corners, q.orient);
				const w = (e + 3) % 6;
				assert.ok(
					mine[e] === theirs[(w + 1) % 6] ||
						mine[(e + 1) % 6] === theirs[w],
					`${side.id} ${key} side ${e} against ${other}`
				);
			});
		}
		assert.ok(pairs > 0);
	}
});

test('a tile scores 1 VP per matching side (BGA corner model)', () => {
	const state = bareGame();
	const score = (/** @type {number} */ orient) =>
		matchingSides(state, '-3_-2', 2, orient);
	assert.equal(score(0), 3);
	assert.equal(score(1), 1);
	assert.equal(score(2), 0);
	assert.equal(score(4), 2);
});

test('sides facing the middle island can score, and unexplored neighbours never do', () => {
	const state = bareGame();
	for (let orient = 0; orient < 6; orient++) {
		assert.equal(matchingSides(state, '-1_-1', 5, orient), 3);
	}
});

test('exploreHexes offers unexplored hexes next to a controlled territory, or all of them with anywhere', () => {
	const state = bareGame();
	put(state, '-2_-2', [1, false], [1, false]);
	assert.deepEqual(exploreHexes(state, 1, false), [
		'-3_-2',
		'-2_-3',
		'-1_-1',
	]);
	assert.equal(exploreHexes(state, 1, true).length, 21);
	assert.deepEqual(exploreHexes(state, 2, false), []);
});

test('conquerTargets follows R16 and the item rule', () => {
	const state = bareGame();
	put(state, '-2_-2', [1, false], [1, false]);
	assert.deepEqual(conquerTargets(state, 1, false), [
		'-3_-3',
		'-2_-1',
		'-1_-2',
	]);
	put(state, '-3_-3', [2, false], [1, true]);
	put(state, '-2_-1', [1, false]);
	assert.deepEqual(conquerTargets(state, 1, false), ['-1_-2']);
	const anywhere = conquerTargets(state, 1, true);
	assert.ok(anywhere.includes('0_0'));
	assert.ok(!anywhere.includes('-3_-2'));
	assert.ok(!anywhere.includes('-3_-3'));
	assert.ok(!anywhere.includes('-2_-1'));
});

test('loneOpponent names a lone upright outpost of another seat, and nothing else', () => {
	const state = bareGame();
	put(state, '-2_-2', [2, false]);
	assert.equal(loneOpponent(state, '-2_-2', 1), 2);
	assert.equal(loneOpponent(state, '-2_-2', 2), null);
	put(state, '-2_-2', [2, true]);
	assert.equal(loneOpponent(state, '-2_-2', 1), null);
	put(state, '-2_-2', [2, false], [2, false]);
	assert.equal(loneOpponent(state, '-2_-2', 1), null);
	put(state, '-2_-2');
	assert.equal(loneOpponent(state, '-2_-2', 1), null);
});

test('cornersOf reads territory tiles, printed territories and unexplored hexes', () => {
	const state = bareGame();
	assert.equal(cornersOf(state, '-3_-2'), null);
	assert.deepEqual(
		cornersOf(state, '-2_-2'),
		MAPS.small.printed['-2_-2'].corners
	);
	state.hexes['-3_-2'].tile = 2;
	assert.deepEqual(cornersOf(state, '-3_-2'), TERRITORY_TILES[1].corners);
	assert.deepEqual(turned(['a', 'b', 'c', 'd', 'e', 'f'], 1), [
		'f',
		'a',
		'b',
		'c',
		'd',
		'e',
	]);
});
