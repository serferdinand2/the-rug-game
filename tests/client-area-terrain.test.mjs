// The player area's terrain (#27): a seat's territory tiles and space tiles, held and explored.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { terrainView } from '../src/lib/area/terrain.js';
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
		{ id: 3, explored: false },
		{ id: 7, explored: false },
		{ id: 2, explored: true },
	]);
});

test('an empty seat has nothing', () => {
	assert.deepEqual(
		terrainView({ territoryTiles: [], spaceTiles: [], exploredSpace: [] }),
		{ territories: [], space: [] }
	);
});
