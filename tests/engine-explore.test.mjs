// Tests for exploring: the explore effect, the chooseExplore decision and the tile's score and benefit (#17; R5, FAQ #19).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { push, openDecisions } from '../src/lib/engine/stack.js';
import { run } from '../src/lib/engine/loop.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import { MAPS } from '../src/lib/engine/data/maps.js';
import { exploreHexes } from '../src/lib/engine/map.js';
import { exploreAnswers } from '../src/lib/engine/effects/explore.js';
import { startedGame, answer } from './helpers/engine.mjs';

/**
 * A small-map game with every outpost cleared, where seat 1 controls '-2_-2' and holds the tiles.
 * @param {number[]} tiles
 * @returns {{ state: any, random: any }}
 */
function game(tiles) {
	const { state: started, random } = startedGame(2);
	const state = structuredClone(started);
	for (const hex of Object.values(state.hexes)) {
		hex.outposts = [];
	}
	state.hexes['-2_-2'].outposts = [{ seat: 1, toppled: false }];
	state.seats[0].territoryTiles = tiles;
	return { state, random };
}

/**
 * Runs an explore effect for seat 1 on top of the stack.
 * @param {any} state
 * @param {any} random
 * @param {{ anywhere?: boolean }} [value]
 */
function explore(state, random, value = {}) {
	push(state, state.pending, [
		{ player: 1, kind: 'effects', effects: [{ explore: value }] },
	]);
	run(state, random);
}

const types = (/** @type {any} */ state, /** @type {number} */ from) =>
	state.events.slice(from).map((/** @type {any} */ e) => e.type);

test('exploring places the tile, scores its matching sides and gives its benefit', () => {
	const { state, random } = game([2]);
	explore(state, random);
	const [decision] = openDecisions(state);
	assert.equal(decision.kind, 'chooseExplore');
	const before = state.events.length;
	const done = answer(state, random, 1, 'chooseExplore', {
		tile: 2,
		hex: '-3_-2',
		orient: 0,
	});
	assert.equal(done.hexes['-3_-2'].tile, 2);
	assert.equal(done.hexes['-3_-2'].orient, 0);
	const seat = done.seats[0];
	// The tile is gone from the hand; its benefit (2 territory tiles) came in.
	assert.equal(seat.territoryTiles.length, 2);
	assert.equal(seat.vp, 3);
	const explored = done.events
		.slice(before)
		.find((e) => e.type === 'explored');
	assert.deepEqual(
		{ ...explored, seq: undefined },
		{
			type: 'explored',
			player: 1,
			hex: '-3_-2',
			tile: 2,
			orient: 0,
			vp: 3,
			seq: undefined,
		}
	);
	assert.deepEqual(
		types(done, before).filter((t) => t !== 'tilesGained'),
		['explored', 'vpGained']
	);
	assert.deepEqual(
		openDecisions(done).map((d) => d.kind),
		['chooseTurn']
	);
});

test('exploring places no outpost and gives no control (01 §7.2)', () => {
	const { state, random } = game([2]);
	explore(state, random);
	const done = answer(state, random, 1, 'chooseExplore', {
		tile: 2,
		hex: '-3_-2',
		orient: 0,
	});
	assert.deepEqual(done.hexes['-3_-2'].outposts, []);
});

test('the default answer scores the most', () => {
	const { state, random } = game([2]);
	explore(state, random);
	const [decision] = openDecisions(state);
	const [best] = DECISIONS.chooseExplore.answers(state, decision);
	const done = answer(state, random, 1, 'chooseExplore', best);
	assert.equal(done.events.findLast((e) => e.type === 'explored').vp, 3);
	const all = exploreAnswers(state, 1, false);
	assert.deepEqual(all[0], best);
	assert.equal(all.length, exploreHexes(state, 1, false).length * 6);
});

test('with no tile, or no legal hex, nothing happens (FAQ #19)', () => {
	const none = game([]);
	explore(none.state, none.random);
	assert.equal(
		none.state.events.filter((e) => e.type === 'noExplore').length,
		1
	);
	assert.deepEqual(
		openDecisions(none.state).map((d) => d.kind),
		['chooseTurn']
	);

	const nowhere = game([2]);
	for (const o of Object.values(nowhere.state.hexes)) {
		o.outposts = [];
	}
	explore(nowhere.state, nowhere.random);
	assert.equal(
		nowhere.state.events.filter((e) => e.type === 'noExplore').length,
		1
	);
	assert.deepEqual(
		openDecisions(nowhere.state).map((d) => d.kind),
		['chooseTurn']
	);
	assert.deepEqual(nowhere.state.seats[0].territoryTiles, [2]);
});

test('a single option is explored automatically', () => {
	const { state, random } = game([5]);
	const legal = exploreHexes(state, 1, false);
	// Leave one hex open next to the territory: explore all the others.
	for (const hex of legal.slice(1)) {
		state.hexes[hex].tile = 49;
		state.hexes[hex].orient = 0;
	}
	assert.equal(exploreHexes(state, 1, false).length, 1);
	explore(state, random);
	assert.deepEqual(
		openDecisions(state).map((d) => d.kind),
		['chooseTurn']
	);
	assert.equal(state.hexes[legal[0]].tile, 5);
	assert.equal(state.seats[0].territoryTiles.length, 0);
	assert.equal(state.events.filter((e) => e.type === 'explored').length, 1);
});

test('anywhere offers every unexplored hex (Airplanes)', () => {
	const { state, random } = game([2]);
	const next = exploreHexes(state, 1, false);
	const every = MAPS[state.map].hexes.filter(
		(h) => state.hexes[h].tile === null
	);
	assert.ok(every.length > next.length);
	explore(state, random, { anywhere: true });
	const [decision] = openDecisions(state);
	assert.equal(decision.anywhere, true);
	const hexes = new Set(
		DECISIONS.chooseExplore.answers(state, decision).map((a) => a.hex)
	);
	assert.deepEqual([...hexes].sort(), [...every].sort());
});

test('an answer not offered is refused', () => {
	const { state, random } = game([2]);
	explore(state, random);
	for (const bad of [
		{ tile: 2, hex: '-3_-2', orient: 6 },
		{ tile: 2, hex: '9_9', orient: 0 },
		{ tile: '2', hex: '-3_-2', orient: 0 },
		{ tile: 2, orient: 0 },
		{ tile: 3, hex: '-3_-2', orient: 0 },
	]) {
		assert.throws(
			() => answer(state, random, 1, 'chooseExplore', bad),
			{ name: 'PlayerError', message: "You can't explore there." },
			JSON.stringify(bad)
		);
	}
});
