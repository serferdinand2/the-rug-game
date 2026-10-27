// Tests for the tracks and achievements the board components take from a game view.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { view } from '../src/lib/engine/game.js';
import { newGame } from './helpers/engine.mjs';
import { TRACKS } from '../src/lib/engine/data/tracks.js';
import { trackBoard, achievements } from '../src/lib/board.js';

/**
 * A view of a fresh game, after changes to a copy of its state.
 * @param {number} count
 * @param {(state: any) => void} [change]
 */
function viewOf(count, change) {
	const { state } = newGame(count);
	const copy = structuredClone(state);
	if (change) {
		change(copy);
	}
	return /** @type {any} */ (view(copy, 1));
}

test('trackBoard gives the four tracks of twelve spaces', () => {
	const tracks = trackBoard(viewOf(2));
	assert.deepEqual(
		tracks.map((track) => track.id),
		['exploration', 'science', 'technology', 'military']
	);
	for (const track of tracks) {
		assert.equal(track.spaces.length, 12);
		assert.equal(track.tiers.length, 4);
	}
	assert.equal(tracks[0].spaces[0].name, 'Scouting');
});

test('tier prices use the track resource, one symbol per unit', () => {
	const tracks = trackBoard(viewOf(2));
	assert.deepEqual(tracks[0].tiers, [
		['any'],
		['food', 'any'],
		['food', 'any', 'any'],
		['food', 'food'],
	]);
	assert.deepEqual(tracks[3].tiers[3], ['culture', 'culture']);
});

test('a landmark shows on its space only while unowned', () => {
	const open = trackBoard(viewOf(2));
	assert.ok(open[0].spaces[3].landmark);
	const taken = trackBoard(
		viewOf(2, (state) => {
			state.landmarks = state.landmarks.filter(
				(/** @type {string} */ id) =>
					id !== TRACKS.exploration[4].landmark
			);
		})
	);
	assert.equal(taken[0].spaces[3].landmark, undefined);
	assert.ok(taken[0].spaces[6].landmark);
});

test("a player's lane is their furthest token", () => {
	const tracks = trackBoard(
		viewOf(2, (state) => {
			state.seats[0].tracks.science = [2, 5];
		})
	);
	const lane = tracks[1].players.find((p) => p.seat === 1);
	assert.equal(lane?.position, 5);
	assert.equal(tracks[1].players.length, 2);
});

test('achievements list claimants in order and the next VP by map size', () => {
	const large = achievements(
		viewOf(4, (state) => {
			state.achievements['complete-track'] = [3, 1];
		})
	);
	assert.equal(large.length, 3);
	assert.deepEqual(large[0].claimed, [3, 1]);
	assert.equal(large[0].vp, 5);
	assert.equal(large[1].vp, 15);
	assert.equal(large[2].vp, 10);
	const small = achievements(viewOf(2));
	assert.equal(small[0].vp, 10);
	const done = achievements(
		viewOf(2, (state) => {
			state.achievements['middle-island'] = [1, 2];
		})
	);
	assert.equal(done[2].vp, null);
});
