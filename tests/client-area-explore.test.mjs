// Tests for the explore choices of the map prompt (#28): each tile in each turn on a hex, with the VP it scores.
import test from 'node:test';
import assert from 'node:assert/strict';
import { matchingSides, openDecisions, view } from '../src/lib/engine/game.js';
import { push } from '../src/lib/engine/stack.js';
import { run } from '../src/lib/engine/loop.js';
import { describeTile } from '../src/lib/describe.js';
import { TERRITORY_TILES } from '../src/lib/engine/data/territory-tiles.js';
import { exploreChoices } from '../src/lib/area/explore.js';
import { startedGame } from './helpers/engine.mjs';

/** A 2-player game with seat 1 holding tiles 2, 5 and 17 and an explore open. */
function exploring() {
	const { state: started, random } = startedGame(2);
	const state = structuredClone(started);
	for (const hex of Object.values(state.hexes)) {
		hex.outposts = [];
	}
	state.hexes['-2_-2'].outposts = [{ seat: 1, toppled: false }];
	state.seats[0].territoryTiles = [2, 5, 17];
	push(state, state.pending, [
		{ player: 1, kind: 'effects', effects: [{ explore: {} }] },
	]);
	run(state, random);
	const game = view(state, 1);
	const decision = openDecisions(game).find(
		(op) => op.kind === 'chooseExplore'
	);
	return { state, game, decision };
}

test('every answer for the chosen hex appears once, scored as the engine scores it', () => {
	const { state, game, decision } = exploring();
	const hex = decision.answers[0].hex;
	const choices = exploreChoices(game, decision, hex);
	const expected = decision.answers.filter(
		(/** @type {any} */ a) => a.hex === hex
	);
	assert.equal(choices.length, expected.length);
	assert.ok(choices.length >= 18);
	for (const choice of choices) {
		assert.equal(
			choice.vp,
			matchingSides(state, hex, choice.tile, choice.orient)
		);
		assert.equal(
			expected.filter(
				(/** @type {any} */ a) =>
					a.tile === choice.tile && a.orient === choice.orient
			).length,
			1
		);
	}
});

test('the choices are sorted by VP, then tile, then orientation', () => {
	const { game, decision } = exploring();
	const choices = exploreChoices(game, decision, decision.answers[0].hex);
	for (let i = 1; i < choices.length; i++) {
		const a = choices[i - 1];
		const b = choices[i];
		assert.ok(
			a.vp > b.vp ||
				(a.vp === b.vp &&
					(a.tile < b.tile ||
						(a.tile === b.tile && a.orient < b.orient)))
		);
	}
});

test("the corners are the printed corners turned, and the island is the tile's", () => {
	const { game, decision } = exploring();
	const choices = exploreChoices(game, decision, decision.answers[0].hex);
	const one = choices.find((c) => c.tile === 2 && c.orient === 1);
	const printed = TERRITORY_TILES[1].corners;
	assert.deepEqual(one?.corners, [printed[5], ...printed.slice(0, 5)]);
	const isle = choices.find((c) => c.tile === 17);
	assert.deepEqual(isle?.island, [...TERRITORY_TILES[16].island]);
	assert.ok(isle && isle.island.length > 0);
});

test('a hex with no answers has no choices', () => {
	const { game, decision } = exploring();
	assert.deepEqual(exploreChoices(game, decision, 'nowhere'), []);
});

test('each choice names its tile and turn, without the hex already chosen', () => {
	assert.equal(describeTile(19, 3), 'Tile 19, turned 3 times');
	assert.equal(describeTile(6, 0), 'Tile 6');
	assert.equal(describeTile(6, 1), 'Tile 6, turned once');
});
