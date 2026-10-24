// Tests for exploring: the explore effect, the chooseExplore decision and the tile's score and benefit (#17; R5, FAQ #19).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { push, openDecisions } from '../src/lib/engine/stack.js';
import { run } from '../src/lib/engine/loop.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import { MAPS } from '../src/lib/engine/data/maps.js';
import { exploreHexes } from '../src/lib/engine/map.js';
import { exploreAnswers } from '../src/lib/engine/effects/explore.js';
import { play } from '../src/lib/engine/play.js';
import {
	startedGame,
	readyTurn,
	answer,
	stubHandoffs,
} from './helpers/engine.mjs';

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

/**
 * Runs an exploreSpace effect for seat 1 on top of the stack.
 * @param {any} state
 * @param {any} random
 * @param {Record<string, any>} [value]
 */
function exploreSpace(state, random, value = {}) {
	push(state, state.pending, [
		{ player: 1, kind: 'effects', effects: [{ exploreSpace: value }] },
	]);
	run(state, random);
}

/**
 * Advances the current player onto Interstellar Travel (exploration 11) or Warpgates (12), holding `held` space tiles
 * with `supply` left in the stack. The operations that later issues build are stood in for.
 * @param {import('node:test').TestContext} t
 * @param {number} space
 * @param {number[]} held
 * @param {number[]} supply
 */
function onto(t, space, held, supply) {
	const handoffs = stubHandoffs();
	t.after(handoffs.restore);
	const ready = readyTurn(2, (seat, state) => {
		seat.tracks.exploration = [space - 1];
		seat.resources = { coin: 2, worker: 2, food: 2, culture: 2 };
		seat.spaceTiles = [...held];
		state.supply.space = [...supply];
	});
	const { random, player } = ready;
	const chosen = answer(ready.state, random, player, 'chooseTurn', {
		turn: 'advance',
	});
	const [decision] = openDecisions(chosen);
	const move = DECISIONS.chooseAdvance
		.answers(chosen, decision)
		.find((a) => a.track === 'exploration' && a.from === space - 1);
	const state = play(
		chosen,
		player,
		{ decision: decision.id, ...move },
		random
	);
	return {
		state,
		random,
		player,
		calls: handoffs.calls,
		restore: handoffs.restore,
	};
}

test('a space tile goes beside the income mat and gives its benefits', () => {
	const { state, random } = game([]);
	state.seats[0].spaceTiles = [13];
	const before = state.events.length;
	exploreSpace(state, random);
	const seat = state.seats[0];
	assert.deepEqual(seat.spaceTiles, []);
	assert.deepEqual(seat.exploredSpace, [13]);
	assert.equal(seat.vp, 13);
	const events = state.events.slice(before);
	assert.deepEqual(
		events.map((e) => e.type),
		['spaceExplored', 'vpGained']
	);
	assert.deepEqual(
		{ ...events[0], seq: undefined },
		{ type: 'spaceExplored', player: 1, tile: 13, seq: undefined }
	);
	assert.ok(openDecisions(state).every((d) => d.kind === 'chooseTurn'));
});

test('space tile 11 conquers, then scores 1 VP per territory (R5)', (t) => {
	const handoffs = stubHandoffs();
	t.after(handoffs.restore);
	const { state, random } = game([]);
	state.seats[0].spaceTiles = [11];
	exploreSpace(state, random);
	assert.deepEqual(
		handoffs.calls.map((c) => c.kind),
		['conquer']
	);
	// The conquer ran before the VP counter: the counter then scored the one territory seat 1 controls.
	assert.equal(state.seats[0].vp, 1);
	const types = state.events.map((e) => e.type);
	assert.ok(
		types.lastIndexOf('spaceExplored') < types.lastIndexOf('vpGained')
	);
});

test('with two space tiles held the player chooses which to explore', () => {
	const { state, random } = game([]);
	state.seats[0].spaceTiles = [5, 11];
	exploreSpace(state, random);
	// Two tiles: the player chooses; nothing has run yet.
	const [decision] = openDecisions(state);
	assert.equal(decision.kind, 'chooseSpaceTile');
	assert.deepEqual(decision.options, [5, 11]);
	const next = answer(state, random, 1, 'chooseSpaceTile', { tile: 5 });
	assert.deepEqual(next.seats[0].exploredSpace, [5]);
	assert.equal(next.seats[0].spaceTiles.length, 1);
});

test('R105: Interstellar Travel explores only a tile it just gained', (t) => {
	const r = onto(t, 11, [9], [3, 7, 12]);
	assert.deepEqual(r.state.seats[r.player - 1].spaceTiles, [9, 3, 7, 12]);
	const [decision] = openDecisions(r.state);
	assert.equal(decision.kind, 'chooseSpaceTile');
	assert.deepEqual(decision.options, [3, 7, 12]);
	assert.deepEqual(DECISIONS.chooseSpaceTile.answers(r.state, decision), [
		{ tile: 3 },
		{ tile: 7 },
		{ tile: 12 },
	]);
	assert.throws(
		() =>
			answer(r.state, r.random, r.player, 'chooseSpaceTile', { tile: 9 }),
		{
			name: 'PlayerError',
			message: 'Choose one of the space tiles offered.',
		}
	);
});

test('R105: with fewer than 3 left it offers those gained, and with none nothing happens', (t) => {
	const one = onto(t, 11, [9], [4]);
	assert.ok(
		openDecisions(one.state).every((d) => d.kind !== 'chooseSpaceTile')
	);
	assert.deepEqual(one.state.seats[one.player - 1].exploredSpace, [4]);
	assert.deepEqual(one.state.seats[one.player - 1].spaceTiles, [9]);
	one.restore();
	const none = onto(t, 11, [9], []);
	assert.equal(
		none.state.events.filter((e) => e.type === 'noSpaceTile').length,
		1
	);
	assert.ok(
		openDecisions(none.state).every((d) => d.kind !== 'chooseSpaceTile')
	);
	assert.deepEqual(none.state.seats[none.player - 1].spaceTiles, [9]);
	assert.deepEqual(none.state.seats[none.player - 1].exploredSpace, []);
});

test('R105: fromGained without a track space is a bug, not a player mistake', () => {
	const { state, random } = game([]);
	state.seats[0].spaceTiles = [5, 13];
	assert.throws(
		() => exploreSpace(state, random, { fromGained: true }),
		(e) => e.name === 'Error'
	);
});

test('Warpgates offers every space tile the player holds', (t) => {
	const r = onto(t, 12, [5, 13], [3]);
	const [decision] = openDecisions(r.state);
	assert.equal(decision.kind, 'chooseSpaceTile');
	assert.deepEqual(decision.options, [5, 13]);
});

test('a tile not offered is refused', () => {
	const { state, random } = game([]);
	state.seats[0].spaceTiles = [5, 13];
	exploreSpace(state, random);
	for (const bad of [{ tile: 3 }, { tile: '5' }, {}, { tile: null }]) {
		assert.throws(
			() => answer(state, random, 1, 'chooseSpaceTile', bad),
			{
				name: 'PlayerError',
				message: 'Choose one of the space tiles offered.',
			},
			JSON.stringify(bad)
		);
	}
});
