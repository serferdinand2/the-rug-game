// The terrains on the map: what the territory on each explored hex shows at its corners and on its island (01 §7.1, §7.2).
// It imports only data, so civilization modules can read terrains without the civilization cycle that map.js is part of.
import { MAPS } from './data/maps.js';
import { TERRITORY_TILES } from './data/territory-tiles.js';

/** @typedef {import('./data/ids.js').TerrainId} TerrainId */

/**
 * The terrains printed on the territory on a hex, its 6 corners and its island, or null while it is unexplored.
 * @param {import('./state.js').State} state
 * @param {string} hex
 * @returns {import('./data/maps.js').Terrains | null}
 */
export function terrainsOf(state, hex) {
	const tile = state.hexes[hex]?.tile ?? null;
	if (tile === null) {
		return null;
	}
	if (tile <= 48) {
		return TERRITORY_TILES[tile - 1];
	}
	return MAPS[state.map].printed[hex];
}

/**
 * The 6 printed corners of the territory on a hex, or null while it is unexplored.
 * @param {import('./state.js').State} state
 * @param {string} hex
 * @returns {readonly TerrainId[] | null}
 */
export function cornersOf(state, hex) {
	return terrainsOf(state, hex)?.corners ?? null;
}

/**
 * Corners in position order: position k shows the printed corner (k - orient) mod 6.
 * @template T
 * @param {readonly T[]} corners
 * @param {number} orient
 * @returns {T[]}
 */
export function turned(corners, orient) {
	return corners.map((_, k) => corners[(((k - orient) % 6) + 6) % 6]);
}
