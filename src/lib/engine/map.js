// The map's rules: matching sides, and the hexes a player may explore or conquer (R5, R16).
import { MAPS, hexNeighbours } from './data/maps.js';
import { TERRITORY_TILES } from './data/territory-tiles.js';
import { controlledTerritories } from './control.js';

/** @typedef {import('./data/ids.js').TerrainId} TerrainId */

/**
 * The 6 printed corners of the territory on a hex, or null while it is unexplored.
 * @param {import('./state.js').State} state
 * @param {string} hex
 * @returns {readonly TerrainId[] | null}
 */
export function cornersOf(state, hex) {
	const tile = state.hexes[hex]?.tile ?? null;
	if (tile === null) {
		return null;
	}
	if (tile <= 48) {
		return TERRITORY_TILES[tile - 1].corners;
	}
	return MAPS[state.map].printed[hex].corners;
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

/**
 * How many sides of a territory tile placed on a hex match the territories next to it (R5; BGA's
 * getMatchingEdgeCount). A side matches when either of its two corners equals the facing corner of the neighbour.
 * Off-map and unexplored neighbours never match.
 * @param {import('./state.js').State} state
 * @param {string} hex
 * @param {number} tile - 1-48
 * @param {number} orient - 0-5
 * @returns {number}
 */
export function matchingSides(state, hex, tile, orient) {
	const mine = turned(TERRITORY_TILES[tile - 1].corners, orient);
	let count = 0;
	hexNeighbours(hex).forEach((other, e) => {
		const corners = cornersOf(state, other);
		if (!corners) {
			return;
		}
		const theirs = turned(corners, state.hexes[other].orient);
		const w = (e + 3) % 6;
		if (
			mine[e] === theirs[(w + 1) % 6] ||
			mine[(e + 1) % 6] === theirs[w]
		) {
			count++;
		}
	});
	return count;
}

/**
 * Whether a hex touches a territory in the list.
 * @param {string} hex
 * @param {Set<string>} owned
 * @returns {boolean}
 */
function touches(hex, owned) {
	return hexNeighbours(hex).some((other) => owned.has(other));
}

/**
 * The unexplored hexes a player may explore, in map order. Without `anywhere`, only those next to a territory they control.
 * @param {import('./state.js').State} state
 * @param {number} player
 * @param {boolean} anywhere
 * @returns {string[]}
 */
export function exploreHexes(state, player, anywhere) {
	const owned = new Set(controlledTerritories(state, player));
	return MAPS[state.map].hexes.filter(
		(hex) =>
			state.hexes[hex].tile === null && (anywhere || touches(hex, owned))
	);
}

/**
 * The hexes a player may conquer, in map order (R16): explored, at most 1 outpost, not already controlled by
 * the player, and next to a territory they control unless `anywhere`.
 * @param {import('./state.js').State} state
 * @param {number} player
 * @param {boolean} anywhere
 * @returns {string[]}
 */
export function conquerTargets(state, player, anywhere) {
	const owned = new Set(controlledTerritories(state, player));
	return MAPS[state.map].hexes.filter(
		(hex) =>
			state.hexes[hex].tile !== null &&
			state.hexes[hex].outposts.length <= 1 &&
			!owned.has(hex) &&
			(anywhere || touches(hex, owned))
	);
}

/**
 * The seat of a lone upright outpost of another seat, when it is the only outpost on the hex.
 * @param {import('./state.js').State} state
 * @param {string} hex
 * @param {number} player
 * @returns {number | null}
 */
export function loneOpponent(state, hex, player) {
	const outposts = state.hexes[hex].outposts;
	if (outposts.length !== 1) {
		return null;
	}
	const [only] = outposts;
	return !only.toppled && only.seat !== player ? only.seat : null;
}
