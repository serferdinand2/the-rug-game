// The Archipelago mat's printed layout and volcanoes (#6); its relief and features are tested with the others (#132).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import {
	LAYOUT,
	VOLCANOES,
} from '../tools/art/parts/capital-biomes/archipelago.js';

test('the layout matches the printed mat', () => {
	assert.equal(LAYOUT.length, 11);
	assert.ok(LAYOUT.every((row) => row.length === 9));
	// 41 water plots and 3 volcanoes are impassable; 55 are buildable.
	assert.equal(LAYOUT.join('').split('X').length - 1, 44);
	assert.equal(VOLCANOES.length, 3);
	assert.ok(VOLCANOES.every(([r, c]) => LAYOUT[r][c] === 'X'));
});
