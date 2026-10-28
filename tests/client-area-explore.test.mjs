// Tests for the explore prompt's module (#28, #74): the tiles offered, their scores on the lit hexes, and the answer they make.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import {
	matchingSides,
	openDecisions,
	turned,
	view,
} from '../src/lib/engine/game.js';
import { push } from '../src/lib/engine/stack.js';
import { run } from '../src/lib/engine/loop.js';
import { TERRITORY_TILES } from '../src/lib/engine/data/territory-tiles.js';
import {
	exploreIndex,
	exploreLine,
	exploreTiles,
	hexScores,
	tilePreview,
	tileScores,
	tileWords,
} from '../src/lib/area/explore.js';
import { territoryWords } from '../src/lib/hexmap.js';
import { startedGame } from './helpers/engine.mjs';

/** A 2-player game with seat 1 holding tiles 2, 5 and 17 and an explore open. */
function exploring(effects = [{ explore: {} }]) {
	const { state: started, random } = startedGame(2);
	const state = structuredClone(started);
	for (const hex of Object.values(state.hexes)) {
		hex.outposts = [];
	}
	state.hexes['-2_-2'].outposts = [{ seat: 1, toppled: false }];
	state.seats[0].territoryTiles = [2, 5, 17];
	push(state, state.pending, [{ player: 1, kind: 'effects', effects }]);
	run(state, random);
	const game = view(state, 1);
	const decision = openDecisions(game).find(
		(op) => op.kind === 'chooseExplore'
	);
	return { state, game, decision };
}

/** The best VP of a tile on a hex over the six turns, and the lowest turn that reaches it. */
function best(
	/** @type {any} */ state,
	/** @type {string} */ hex,
	/** @type {number} */ tile
) {
	let vp = -1;
	let orient = 0;
	for (let o = 0; o < 6; o++) {
		const sides = matchingSides(state, hex, tile, o);
		if (sides > vp) {
			vp = sides;
			orient = o;
		}
	}
	return { vp, orient };
}

test('exploreTiles lists each offered tile once, lowest first', () => {
	const { decision } = exploring();
	assert.deepEqual(exploreTiles(decision), [2, 5, 17]);
});

test('a Coal Baron explore offers only its tile', () => {
	const { decision } = exploring([{ explore: { tile: 5 } }]);
	assert.deepEqual(exploreTiles(decision), [5]);
});

test('tileScores gives each tile its best VP on a hex and the lowest turn that scores it', () => {
	const { state, game, decision } = exploring();
	const hex = decision.answers[0].hex;
	const scores = tileScores(game, decision, hex);
	assert.deepEqual(Object.keys(scores).map(Number), [2, 5, 17]);
	for (const tile of [2, 5, 17]) {
		assert.deepEqual(scores[tile], best(state, hex, tile));
	}
});

test('hexScores gives a tile its best VP and turn on every lit hex', () => {
	const { state, game, decision } = exploring();
	const scores = hexScores(game, decision, 5);
	const lit = new Set(decision.answers.map((/** @type {any} */ a) => a.hex));
	assert.deepEqual(new Set(Object.keys(scores)), lit);
	for (const hex of lit) {
		assert.deepEqual(scores[hex], best(state, hex, 5));
	}
});

test('exploreIndex finds the one answer for a tile, hex and turn, and -1 for anything else', () => {
	const { decision } = exploring();
	decision.answers.forEach(
		(/** @type {any} */ a, /** @type {number} */ i) => {
			assert.equal(exploreIndex(decision, a), i);
		}
	);
	const a = decision.answers[0];
	assert.equal(exploreIndex(decision, { ...a, tile: 48 }), -1);
	assert.equal(exploreIndex(decision, { ...a, hex: 'nowhere' }), -1);
	assert.equal(exploreIndex(decision, { ...a, orient: 6 }), -1);
});

test('tilePreview turns the printed corners and keeps the island, clouds and volcano', () => {
	const data = TERRITORY_TILES[16];
	const preview = tilePreview(17, 1);
	assert.deepEqual(preview.corners, turned(data.corners, 1));
	assert.deepEqual(preview.island, [...data.island]);
	assert.equal(preview.clouds, data.clouds);
	assert.equal(preview.volcano, data.volcano);
});

test('tileWords words the printed tile as the map does, without its number (#113)', () => {
	for (const data of TERRITORY_TILES) {
		assert.equal(
			tileWords(data.id),
			`Territory tile: ${territoryWords(data)}`
		);
	}
});

test('tileWords names the terrains, not the number', () => {
	const island = TERRITORY_TILES.findIndex((t) => t.island.length > 0) + 1;
	const words = tileWords(island);
	assert.ok(words.startsWith('Territory tile: '));
	assert.ok(words.includes('island of'));
	assert.ok(!words.includes(String(island)));
	const cloudy =
		TERRITORY_TILES.findIndex(
			(t) => t.clouds && !t.volcano && t.island.length === 0
		) + 1;
	assert.ok(cloudy > 0);
	assert.ok(tileWords(cloudy).endsWith(', with clouds'));
});

test('exploreLine names the hex and the turn', () => {
	assert.equal(exploreLine('-1_-1', 0), 'Hex −1,−1');
	assert.equal(exploreLine('-1_-1', 1), 'Hex −1,−1, turned once');
	assert.ok(exploreLine('-1_-1', 2).endsWith('turned twice'));
	assert.ok(exploreLine('-1_-1', 4).endsWith('turned 4 times'));
});
