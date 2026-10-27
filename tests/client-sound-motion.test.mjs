// The sound cue for a batch of fresh events (#29 design §7) and what moves for them (§8).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { CUES, cueFor } from '../src/lib/sound.js';
import { highlights } from '../src/lib/motion.js';

/** @param {string} type @param {Record<string, any>} [fields] */
const ev = (type, fields = {}) => ({ seq: 1, type, player: 1, ...fields });

test('one cue at most for a batch, the most important', () => {
	assert.equal(cueFor([], 1), null);
	assert.equal(cueFor([ev('resourcesGained')], 1), null);
	assert.equal(cueFor([ev('tokenMoved')], 1), 'move');
	assert.equal(cueFor([ev('tokenMoved'), ev('buildingPlaced')], 1), 'place');
	assert.equal(
		cueFor([ev('explored'), ev('turnStarted', { player: 1 })], 1),
		'turn'
	);
	assert.equal(
		cueFor([ev('turnStarted', { player: 1 }), ev('achievementClaimed')], 1),
		'reward'
	);
	assert.equal(cueFor([ev('landmarkGained'), ev('gameEnded')], 1), 'over');
});

test("another player's turn starting is no cue for you, but at a hot-seat table every turn is", () => {
	assert.equal(cueFor([ev('turnStarted', { player: 2 })], 1), null);
	assert.equal(cueFor([ev('turnStarted', { player: 2 })], null), 'turn');
});

test('every cue has a sound file', () => {
	for (const cue of ['turn', 'move', 'place', 'reward', 'over']) {
		assert.match(CUES[cue], /^[a-z_0-9]+$/);
	}
});

test('the map, the capital and the chips move for what just happened', () => {
	const moved = highlights(
		[
			ev('explored', { hex: '1_2' }),
			ev('conquered', { hex: '0_1', player: 2 }),
			ev('outpostPlaced', { hex: '0_1', player: 2 }),
			ev('buildingPlaced', { building: 'farm', row: 3, col: 4 }),
			ev('buildingPlaced', {
				building: 'farm',
				row: 5,
				col: 5,
				player: 2,
			}),
			ev('landmarkPlaced', {
				landmark: 'lighthouse',
				row: -1,
				col: 2,
				rotation: 1,
			}),
			ev('vpGained', { vp: 3 }),
			ev('vpGained', { vp: 0, player: 2 }),
			ev('vpGained', { vp: 2, player: 3 }),
		],
		1
	);
	assert.deepEqual(moved.hexes, ['1_2', '0_1']);
	assert.deepEqual(moved.plots, [{ row: 3, col: 4 }]);
	assert.deepEqual(moved.landmarks, ['lighthouse']);
	assert.deepEqual(moved.vp, [1, 3]);
});

test("a building that went somewhere other than a plot (the Craftsmen's columns) glows nowhere", () => {
	assert.deepEqual(
		highlights([ev('buildingPlaced', { building: 'farm' })], 1).plots,
		[]
	);
});

test('nothing moves for nothing', () => {
	assert.deepEqual(highlights([], 1), {
		hexes: [],
		plots: [],
		landmarks: [],
		vp: [],
	});
});
