// The modular capital terrain set has complete, repeatable 32px tile variants and six base mats.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
	CAPITAL_GRIDS,
	OPEN_VARIANTS,
	BLOCKED_VARIANTS,
	drawTile,
	drawCapitalMat,
} from '../art/parts/capital-terrain.js';

const BIOMES = Object.keys(CAPITAL_GRIDS);

test('each base capital has a 9×9 mask with 59 buildable and 22 impassable plots', () => {
	assert.equal(BIOMES.length, 6);
	for (const biome of BIOMES) {
		const rows = CAPITAL_GRIDS[biome];
		assert.equal(rows.length, 9, biome);
		assert.ok(
			rows.every((row) => row.length === 9),
			biome
		);
		assert.equal(rows.join('').split('0').length - 1, 59, biome);
		assert.equal(rows.join('').split('1').length - 1, 22, biome);
	}
});

test('all 84 terrain variants are 32×32 and deterministic; six mats are 288×288', () => {
	assert.equal(BIOMES.length * (OPEN_VARIANTS + BLOCKED_VARIANTS), 84);
	for (const biome of BIOMES) {
		for (const blocked of [false, true]) {
			const count = blocked ? BLOCKED_VARIANTS : OPEN_VARIANTS;
			for (let variant = 0; variant < count; variant++) {
				const first = drawTile(biome, blocked, variant);
				assert.deepEqual([first.w, first.h], [32, 32], biome);
				assert.deepEqual(
					first,
					drawTile(biome, blocked, variant),
					biome
				);
				assert.ok(
					first.p.some((pixel) => pixel !== null),
					biome
				);
			}
		}
		const mat = drawCapitalMat(biome);
		assert.deepEqual([mat.w, mat.h], [288, 288], biome);
	}
});
