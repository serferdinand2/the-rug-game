// The player area's terrain (#27 design §2.7): a seat's territory tiles in hand and its space tiles, held and explored.
import { TERRITORY_TILES } from '../engine/data/territory-tiles.js';

/** @typedef {import('../ui.js').Terrain} Terrain */

/**
 * A territory tile in hand, ready to draw.
 * @typedef {Object} HeldTerritory
 * @property {number} id - The tile's number, 1–48
 * @property {Terrain[]} corners - Six corner terrains, clockwise from the top-left
 * @property {Terrain[]} island - The island's terrains; empty when there is none
 * @property {boolean} clouds - Its picture shows clouds (R77)
 * @property {boolean} volcano - Its picture shows a volcano (R77)
 */

/**
 * A space tile, held or explored beside the income mat.
 * @typedef {Object} SpaceEntry
 * @property {number} id - The tile's number (the art is `space-tile/<id>`)
 * @property {boolean} explored
 */

/**
 * What a seat holds of terrain: its territory tiles, and its space tiles held first, then explored.
 * @param {{ territoryTiles: number[], spaceTiles: number[], exploredSpace: number[] }} seat
 * @returns {{ territories: HeldTerritory[], space: SpaceEntry[] }}
 */
export function terrainView(seat) {
	return {
		territories: seat.territoryTiles.map((id) => {
			const tile = TERRITORY_TILES[id - 1];
			return {
				id,
				corners: /** @type {Terrain[]} */ ([...tile.corners]),
				island: /** @type {Terrain[]} */ ([...tile.island]),
				clouds: tile.clouds,
				volcano: tile.volcano,
			};
		}),
		space: [
			...seat.spaceTiles.map((id) => ({ id, explored: false })),
			...seat.exploredSpace.map((id) => ({ id, explored: true })),
		],
	};
}
