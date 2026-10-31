// The Canyon mat's printed layout (#6); its relief and features are tested with the others (#132).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { LAYOUT } from '../tools/art/parts/capital-biomes/canyon.js';

test('the layout matches the printed mat', () => {
	assert.equal(LAYOUT.length, 9);
	assert.ok(LAYOUT.every((row) => row.length === 9));
	assert.equal(LAYOUT.join('').split('X').length - 1, 19);
	assert.equal(LAYOUT.join('').split('C').length - 1, 6);
});
