// The base capital terrain: each biome's 8 buildable 32px plots of natural ground, its relief, and its example mat (#82).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { createCanvas } from '../tools/art/painter.js';
import {
	CAPITAL_GRIDS,
	OPEN_VARIANTS,
	drawTile,
	drawCapitalMat,
} from '../tools/art/parts/capital-terrain.js';
import { drawNaturalGround } from '../tools/art/parts/capital-relief/ground.js';
import { drawReliefPreview } from '../tools/art/parts/capital-relief/index.js';
import { RELIEF_BIOMES } from '../src/lib/art/relief.js';
import { listDrawingIds } from '../tools/art/build.mjs';

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

test('every base biome has a relief, so none keeps impassable tiles of its own', async () => {
	assert.deepEqual([...RELIEF_BIOMES].sort(), [...BIOMES].sort());
	const ids = await listDrawingIds();
	for (const biome of BIOMES) {
		assert.deepEqual(
			ids.filter((id) => id.startsWith(`capital-terrain/${biome}-`)),
			Array.from(
				{ length: OPEN_VARIANTS },
				(_, i) => `capital-terrain/${biome}-open-0${i + 1}`
			),
			biome
		);
	}
});

test('all 48 buildable plots are 32×32 natural ground, the same in every build', () => {
	assert.equal(BIOMES.length * OPEN_VARIANTS, 48);
	for (const biome of BIOMES) {
		for (let variant = 0; variant < OPEN_VARIANTS; variant++) {
			const tile = drawTile(biome, variant);
			assert.deepEqual([tile.w, tile.h], [32, 32], biome);
			assert.deepEqual(tile, drawTile(biome, variant), biome);
			const ground = createCanvas(32, 32);
			drawNaturalGround(ground, { biome, variant });
			assert.deepEqual(tile, ground, `${biome} ${variant}`);
		}
	}
});

test('the six example mats are 296×296: natural ground with the relief over it', () => {
	for (const biome of BIOMES) {
		const mat = drawCapitalMat(biome);
		assert.deepEqual([mat.w, mat.h], [296, 296], biome);
		assert.deepEqual(
			mat,
			drawReliefPreview(CAPITAL_GRIDS[biome], biome),
			biome
		);
	}
});

test('an unknown biome has no tile and no mat', () => {
	assert.throws(() => drawTile('tundra', 0), /tundra/);
	assert.throws(() => drawCapitalMat('tundra'), /tundra/);
});
