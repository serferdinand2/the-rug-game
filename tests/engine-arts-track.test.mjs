// The arts track (#35 part 1): the switch, the fifth track, its prices, landmarks and spaces, the d20 and R118.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import {
	checkOptions,
	createGame,
	EXPANSIONS_BUILT,
} from '../src/lib/engine/setup.js';
import { seededRandom } from '../src/lib/engine/random.js';
import { artsInPlay, tracksOf } from '../src/lib/engine/tracks-in-play.js';
import { TRACK_IDS } from '../src/lib/engine/data/ids.js';
import { newGame } from './helpers/engine.mjs';
import { checkState } from './helpers/invariants.mjs';

const AA = { expansions: ['aa'] };

test('Arts & Architecture is built, and its two variants need it', () => {
	assert.deepEqual(EXPANSIONS_BUILT, ['pp', 'aa']);
	assert.doesNotThrow(() =>
		checkOptions({
			version: 'current',
			expansions: ['aa'],
			variants: ['no-arts-track'],
		})
	);
	assert.throws(
		() =>
			checkOptions({
				version: 'current',
				variants: ['either-science-die'],
			}),
		{ name: 'PlayerError', message: /needs Arts & Architecture/ }
	);
});

test('either science die is refused without the arts track', () => {
	assert.throws(
		() =>
			checkOptions({
				version: 'current',
				expansions: ['aa'],
				variants: ['no-arts-track', 'either-science-die'],
			}),
		{ name: 'PlayerError', message: /arts track/ }
	);
});

test('a game with the arts track puts every token on its start, and tracksOf lists five', () => {
	const { state } = newGame(3, AA);
	for (const seat of state.seats) {
		assert.deepEqual(seat.tracks.arts, [0]);
	}
	assert.deepEqual(tracksOf(state), [...TRACK_IDS, 'arts']);
	assert.equal(artsInPlay(state), true);
	checkState(state);
});

test('without the arts track no seat has an arts token', () => {
	for (const options of [
		{},
		{ expansions: ['pp'] },
		{ expansions: ['aa'], variants: ['no-arts-track'] },
	]) {
		const { state } = newGame(3, options);
		for (const seat of state.seats) {
			assert.ok(!('arts' in seat.tracks));
		}
		assert.deepEqual(tracksOf(state), [...TRACK_IDS]);
		assert.equal(artsInPlay(state), false);
	}
});

test('R59: a one-player game with the arts track is refused', () => {
	assert.throws(
		() =>
			createGame({
				players: [{ name: 'Ana' }],
				version: 'current',
				expansions: ['aa'],
				random: seededRandom(1),
			}),
		{ name: 'PlayerError', message: /2 or more players/ }
	);
	assert.doesNotThrow(() =>
		createGame({
			players: [{ name: 'Ana' }],
			version: 'current',
			expansions: ['aa'],
			variants: ['no-arts-track'],
			random: seededRandom(1),
		})
	);
});
