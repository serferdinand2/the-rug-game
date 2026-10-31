// The player area's terrain (#27): a seat's territory tiles and space tiles, held and explored.
import { existsSync } from 'node:fs';
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { terrainView, territoryBenefit } from '../src/lib/area/terrain.js';
import { describeEffects } from '../src/lib/describe.js';
import { TERRITORY_TILES } from '../src/lib/engine/data/territory-tiles.js';

test('territory tiles carry their corners and island from the data', () => {
	const island = TERRITORY_TILES.find((tile) => tile.island.length > 0);
	assert.ok(island);
	const view = terrainView({
		territoryTiles: [1, island.id],
		spaceTiles: [],
		exploredSpace: [],
	});
	assert.equal(view.territories.length, 2);
	assert.deepEqual(view.territories[0], {
		id: 1,
		corners: [...TERRITORY_TILES[0].corners],
		island: [...TERRITORY_TILES[0].island],
		clouds: TERRITORY_TILES[0].clouds,
		volcano: TERRITORY_TILES[0].volcano,
	});
	assert.deepEqual(view.territories[1].island, [...island.island]);
});

test('space tiles split held and explored', () => {
	const view = terrainView({
		territoryTiles: [],
		spaceTiles: [3, 7],
		exploredSpace: [2],
	});
	assert.deepEqual(view.space, [
		{ id: 3, explored: false, art: 'space-tile/3' },
		{ id: 7, explored: false, art: 'space-tile/7' },
		{ id: 2, explored: true, art: 'space-tile/2' },
	]);
});

test('an empty seat has nothing', () => {
	assert.deepEqual(
		terrainView({ territoryTiles: [], spaceTiles: [], exploredSpace: [] }),
		{ territories: [], space: [] }
	);
});

test('every territory tile exposes its benefit icon and words', () => {
	for (const tile of TERRITORY_TILES) {
		const benefit = territoryBenefit(tile.id);
		assert.ok(benefit.icon);
		assert.ok(
			existsSync(
				new URL(`../static/art/${benefit.icon}.svg`, import.meta.url)
			),
			`tile ${tile.id} uses existing art ${benefit.icon}`
		);
		assert.equal(benefit.words, describeEffects(tile.benefit));
		assert.ok(benefit.count > 0);
	}
});

test('territory rewards map to their existing icons and special markers', () => {
	assert.deepEqual(territoryBenefit(1), {
		icon: 'resource-24/coin',
		count: 1,
		crossed: false,
		upgrade: false,
		words: describeEffects(TERRITORY_TILES[0].benefit),
	});
	assert.deepEqual(territoryBenefit(2), {
		icon: 'symbol/territory-tile',
		count: 2,
		crossed: false,
		upgrade: false,
		words: describeEffects(TERRITORY_TILES[1].benefit),
	});
	assert.deepEqual(territoryBenefit(8), {
		icon: 'building/farm',
		count: 1,
		crossed: false,
		upgrade: false,
		words: describeEffects(TERRITORY_TILES[7].benefit),
	});
	assert.equal(territoryBenefit(12).icon, 'symbol/science-die');
	assert.equal(territoryBenefit(12).crossed, true);
	assert.equal(territoryBenefit(23).icon, 'symbol/invent');
	assert.equal(territoryBenefit(22).icon, 'symbol/tech-card');
	assert.equal(territoryBenefit(22).upgrade, true);
	assert.equal(territoryBenefit(9).icon, 'symbol/tapestry-card');
});
