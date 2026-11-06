// Tests for the client module that decides what each capital plot shows.
import assert from 'node:assert/strict';
import { test } from 'vitest';
import { plotTerrain, reliefUrl } from '../src/lib/capital-terrain.js';
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
