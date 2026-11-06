// Tests for the client module that decides what each capital plot shows.
import assert from 'node:assert/strict';
import { test } from 'vitest';
import {
	featureUrl,
	plotTerrain,
	reliefUrl,
} from '../src/lib/capital-terrain.js';
import { matPlots } from '../src/lib/area/capital.js';

test('a relief mat draws every plot on open ground', () => {
	const terrain = plotTerrain(matPlots(1), 'mountain', 7);
	for (const plot of terrain) {
		assert.match(plot.ground, /mountain-open-0[1-8]\.svg$/);
		assert.equal(plot.cleared, false);
		assert.equal(plot.cube, false);
	}
});

test('a terraformed plot is cleared', () => {
	const plots = matPlots(1);
	plots[9] = 'farm';
	assert.equal(plotTerrain(plots, 'mountain', 7)[9].cleared, true);
});

test("an Architects' cube is a cube on open ground", () => {
	const plots = matPlots(1);
	plots[0] = 'blocked';
	const plot = plotTerrain(plots, 'mountain', 7)[0];
	assert.equal(plot.cube, true);
	assert.match(plot.ground, /mountain-open-0[1-8]\.svg$/);
});

test('a Fantasies & Futures mat shows its ground under its relief on every plot, as every mat does (#133)', () => {
	const plots = matPlots(1).map((_, i) =>
		i % 7 === 3 ? 'blocked' : 'empty'
	);
	const printed = plotTerrain(plots, 'polar', 7);
	for (const [i, kind] of plots.entries()) {
		assert.match(printed[i].ground, /polar-open-0[1-8]\.svg$/);
		assert.equal(printed[i].cleared, false);
		assert.equal(printed[i].cube, false, `${kind} ${i}`);
	}
	assert.equal(reliefUrl('polar'), '/art/capital-relief/polar.svg');
});

test('reliefUrl names the relief', () => {
	assert.equal(reliefUrl('forest'), '/art/capital-relief/forest.svg');
	assert.equal(reliefUrl('wetland'), '/art/capital-relief/wetland.svg');
	assert.equal(reliefUrl('tropical'), '/art/capital-relief/tropical.svg');
	assert.equal(reliefUrl('desert'), '/art/capital-relief/desert.svg');
	assert.equal(reliefUrl('grassland'), '/art/capital-relief/grassland.svg');
});

test("Cloud City picks each plot's ground by its cloud's tint (#36)", () => {
	const terrain = plotTerrain(matPlots(10), 'cloud-city', 7);
	// Cloud 1 at (0,0) is grey; cloud 2 at (0,3) tan; cloud 3 at (0,8) cream; cloud 4 at (2,3) white.
	assert.match(terrain[0].ground, /cloud-city-grey-open-0[1-8]\.svg$/);
	assert.match(terrain[3].ground, /cloud-city-tan-open-0[1-8]\.svg$/);
	assert.match(terrain[8].ground, /cloud-city-cream-open-0[1-8]\.svg$/);
	assert.match(terrain[21].ground, /cloud-city-white-open-0[1-8]\.svg$/);
});

test('an A&A mat draws its own open ground on every plot (#36)', () => {
	for (const [n, slug] of /** @type {[number, string][]} */ ([
		[7, 'archipelago'],
		[8, 'canyon'],
		[9, 'cavern'],
		[11, 'mesa'],
		[12, 'swamp'],
	])) {
		for (const plot of plotTerrain(matPlots(n), slug, 3)) {
			assert.match(plot.ground, new RegExp(`${slug}-open-0[1-8]\\.svg$`));
			assert.equal(plot.cube, false);
		}
	}
});

test('a surrounded Canyon cactus is no cube, an unsurrounded blocked one is a cube, and a building hides a lily pad or a cactus (#36)', () => {
	const canyon = matPlots(8);
	// Plot 10 is the cactus at (1, 1). Blocked with an empty neighbour, it can only hold an Architects cube.
	canyon[10] = 'blocked';
	assert.equal(plotTerrain(canyon, 'canyon', 3)[10].cube, true);
	// With all 8 neighbours filled it is surrounded: impassable on its own, so no cube is drawn.
	for (const index of [0, 1, 2, 9, 11, 18, 19, 20]) {
		canyon[index] = 'farm';
	}
	assert.equal(plotTerrain(canyon, 'canyon', 3)[10].cube, false);
	canyon[10] = 'farm';
	assert.equal(plotTerrain(canyon, 'canyon', 3)[10].cleared, true);
	const swamp = matPlots(12);
	// Plot 2 is the lily pad at (0, 2).
	assert.equal(swamp[2], 'lily');
	assert.equal(plotTerrain(swamp, 'swamp', 3)[2].cleared, false);
	swamp[2] = 'market';
	assert.equal(plotTerrain(swamp, 'swamp', 3)[2].cleared, true);
});

test('featureUrl names the features picture of the mats that have one (#132)', () => {
	assert.equal(featureUrl('canyon'), '/art/capital-feature/canyon.svg');
	assert.equal(featureUrl('swamp'), '/art/capital-feature/swamp.svg');
	assert.equal(featureUrl('cavern'), null);
	assert.equal(featureUrl('mountain'), null);
});
