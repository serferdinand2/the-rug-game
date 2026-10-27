// The Cloud City capital terrain (#6): 14 distinct full-bleed plots and an example mat on the printed layout.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as biome from '../art/parts/capital-biomes/cloud-city.js';

const OPEN = 8;
const BLOCKED = 6;

/** @returns {{ blocked: boolean, variant: number, canvas: import('../art/painter.js').Canvas }[]} */
function tiles() {
	const all = [];
	for (let variant = 0; variant < OPEN; variant++) {
		all.push({
			blocked: false,
			variant,
			canvas: biome.drawBiomeTile(false, variant),
		});
	}
	for (let variant = 0; variant < BLOCKED; variant++) {
		all.push({
			blocked: true,
			variant,
			canvas: biome.drawBiomeTile(true, variant),
		});
	}
	return all;
}

test('Cloud City has 14 plots, each 32×32 and full bleed', () => {
	const all = tiles();
	assert.equal(all.length, 14);
	for (const { canvas } of all) {
		assert.deepEqual([canvas.w, canvas.h], [32, 32]);
		assert.ok(canvas.p.every((pixel) => pixel !== null));
	}
});

test("Cloud City's 14 plots are all different", () => {
	const seen = new Set(tiles().map(({ canvas }) => canvas.p.join('')));
	assert.equal(seen.size, 14);
});

test("Cloud City's layout has 22 impassable plots and its cloud map has 9 clouds", () => {
	assert.equal(biome.LAYOUT.length, 9);
	for (const row of biome.LAYOUT) {
		assert.match(row, /^[.X]{9}$/);
	}
	assert.equal(biome.LAYOUT.join('').split('X').length - 1, 22);
	assert.equal(biome.CLOUDS.length, 9);
	assert.equal(new Set(biome.CLOUDS.join('')).size, 9);
});

test("the Cloud City mat is its grid × 32 and its impassable plots are exactly the layout's Xs", () => {
	const mat = biome.drawBiomeMat();
	assert.deepEqual(
		[mat.w, mat.h],
		[biome.LAYOUT[0].length * 32, biome.LAYOUT.length * 32]
	);
	const plan = biome.matPlan();
	assert.equal(plan.length, biome.LAYOUT.length * biome.LAYOUT[0].length);
	for (const { row, col, blocked, variant, tint } of plan) {
		assert.equal(
			blocked,
			biome.LAYOUT[row][col] === 'X',
			`plot ${row},${col}`
		);
		// The mat shows that tile in the plot's middle; cloud rims are drawn only along plot edges.
		const tile = biome.drawBiomeTile(blocked, variant, tint);
		for (let y = 4; y < 28; y++) {
			for (let x = 4; x < 28; x++) {
				assert.equal(
					mat.p[(row * 32 + y) * mat.w + col * 32 + x],
					tile.p[y * 32 + x],
					`plot ${row},${col}`
				);
			}
		}
	}
});
