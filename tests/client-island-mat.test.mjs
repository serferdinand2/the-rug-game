// The Islanders' mat on screen (#165): its hexes as a small map the World Map draws, and the keys tying them to the engine's mat hex ids.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { hexNeighbours } from '../src/lib/engine/data/maps.js';
import {
	CENTRE_KEY,
	hasMat,
	matId,
	matKey,
	matMapHexes,
	matPrompt,
} from '../src/lib/island-mat.js';
import { mapView } from '../src/lib/hexmap.js';
import { ISLANDERS_CENTRE } from '../src/lib/engine/island.js';

const empty = () => Array(6).fill(null);
const game = (/** @type {any[]} */ hexes) => ({
	seats: [
		{ seat: 1, civData: { islanders: { hexes } } },
		{ seat: 2, civData: {} },
	],
});

test('a mat hex id and the small map key name each other, and the centre has no id', () => {
	for (let position = 0; position < 6; position++) {
		const key = matKey(`mat:1:${position}`);
		assert.equal(key, hexNeighbours(CENTRE_KEY)[position]);
		assert.equal(
			matId(1, /** @type {string} */ (key)),
			`mat:1:${position}`
		);
	}
	assert.equal(matKey('2_-1'), null);
	assert.equal(matKey('mat:1:6'), null);
	assert.equal(matId(1, CENTRE_KEY), null);
});

test('only a seat that holds the mat has one', () => {
	assert.equal(hasMat(game(empty()), 1), true);
	assert.equal(hasMat(game(empty()), 2), false);
	assert.equal(hasMat(undefined, 1), false);
});

test('the mat is 7 hexes: the printed centre, then each position empty or with its tile turned', () => {
	const hexes = matMapHexes(
		game([{ tile: 17, orient: 1 }, ...empty().slice(1)]),
		1
	);
	assert.equal(hexes.length, 7);
	assert.deepEqual(hexes[0].corners, [...ISLANDERS_CENTRE]);
	assert.equal(hexes[0].key, CENTRE_KEY);
	assert.notEqual(hexes[1].corners, null);
	assert.deepEqual(hexes[1].island.length > 0, true);
	assert.deepEqual(
		hexes.slice(2).map((hex) => hex.corners),
		Array(5).fill(null)
	);
	assert.deepEqual(
		hexes.slice(1).map((hex) => hex.key),
		hexNeighbours(CENTRE_KEY)
	);
});

test('the small map is laid out as the engine scores the mat: neighbours on the map are neighbours on the mat', () => {
	const hexes = matMapHexes(game(empty()), 1);
	const near = (/** @type {string} */ a, /** @type {string} */ b) => {
		const [p, q] = [a, b].map((key) =>
			hexes.find((hex) => hex.key === key)
		);
		const distance = Math.hypot(
			/** @type {any} */ (p).center[0] - /** @type {any} */ (q).center[0],
			/** @type {any} */ (p).center[1] - /** @type {any} */ (q).center[1]
		);
		return distance < 80 * 0.9 + 1; // one hex apart at size 40
	};
	const ring = hexNeighbours(CENTRE_KEY);
	for (let position = 0; position < 6; position++) {
		assert.ok(near(ring[position], CENTRE_KEY));
		assert.ok(near(ring[position], ring[(position + 1) % 6]));
		assert.ok(!near(ring[position], ring[(position + 3) % 6]));
	}
});

test('matPrompt keeps only the mat hexes of a prompt, under the small map keys', () => {
	const preview = { hex: 'mat:1:2', corners: [], island: [] };
	const small = matPrompt({
		targets: ['0_0', 'mat:1:0', 'mat:1:2'],
		scores: { 'mat:1:2': 3, '1_1': 5 },
		selected: 'mat:1:2',
		preview: /** @type {any} */ (preview),
	});
	const ring = hexNeighbours(CENTRE_KEY);
	assert.deepEqual(small.targets, [ring[0], ring[2]]);
	assert.deepEqual(small.scores, { [ring[2]]: 3 });
	assert.equal(small.selected, ring[2]);
	assert.equal(small.preview?.hex, ring[2]);
	const none = matPrompt({
		targets: ['1_1'],
		scores: {},
		selected: '1_1',
		preview: /** @type {any} */ ({ hex: '1_1', corners: [], island: [] }),
	});
	assert.deepEqual(
		[none.targets, none.selected, none.preview],
		[[], null, null]
	);
});

test('the World Map takes the mat as its hexes: a lit empty hex is outlined and the others dim', () => {
	const hexes = matMapHexes(game(empty()), 1);
	const ring = hexNeighbours(CENTRE_KEY);
	const drawn = mapView(hexes, {
		targets: [ring[1]],
		scores: { [ring[1]]: 2 },
		selected: null,
		preview: null,
		fresh: [],
	});
	assert.equal(drawn.length, 7);
	assert.ok(drawn.find((hex) => hex.key === ring[1])?.outlined);
});
