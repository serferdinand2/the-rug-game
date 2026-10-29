// The base capital terrain: each biome's 8 buildable 32px plots of natural ground and its relief (#82).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { createCanvas } from '../tools/art/painter.js';
import {
	CAPITAL_GRIDS,
	OPEN_VARIANTS,
	drawTile,
} from '../tools/art/parts/capital-terrain.js';
import { drawNaturalGround } from '../tools/art/parts/capital-relief/ground.js';
import { RELIEF_BIOMES } from '../src/lib/art/relief.js';
import { ASSETS } from '../src/lib/art/catalog.js';
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

test('a base mat has no example picture: its relief preview in the library is the only one (owner, 2026-10-29)', async () => {
	const ids = await listDrawingIds();
	for (const biome of BIOMES) {
		assert.ok(!ids.includes(`capital-mat/${biome}`), biome);
		assert.ok(ids.includes(`capital-relief/${biome}`), biome);
	}
	assert.ok(
		!ASSETS.some(
			(asset) =>
				asset.id.startsWith('capital-mat/') &&
				BIOMES.includes(asset.id.split('/')[1])
		)
	);
});

test('an unknown biome has no tile', () => {
	assert.throws(() => drawTile('tundra', 0), /tundra/);
});
