// The map's rules: matching sides, and the hexes a player may explore or conquer (R5, R16).
import { MAPS, hexNeighbours } from './data/maps.js';
import { TERRITORY_TILES } from './data/territory-tiles.js';
import { controlledTerritories, itemCount } from './control.js';
import { cornersOf, turned } from './terrain.js';
import { allies } from './abilities.js';

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
 * Whether a hex touches a territory in the set.
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
 * The hexes a player may conquer, in map order (R16): explored, at most 1 item (an outpost, a Nomads piece or a
 * civilization token; #20 design §8), not already controlled by the player or an ally (Alliance), and next to a
 * territory they control unless `anywhere`.
 * @param {import('./state.js').State} state
 * @param {number} player
 * @param {boolean} anywhere
 * @returns {string[]}
 */
export function conquerTargets(state, player, anywhere) {
	const owned = new Set(controlledTerritories(state, player));
	const allied = new Set(
		allies(state, player).flatMap((ally) =>
			controlledTerritories(state, ally)
		)
	);
	return MAPS[state.map].hexes.filter(
		(hex) =>
			state.hexes[hex].tile !== null &&
			itemCount(state, hex) <= 1 &&
			!owned.has(hex) &&
			!allied.has(hex) &&
			(anywhere || touches(hex, owned))
	);
}

/**
 * The seat of another seat's upright outpost or Nomads piece, when it is the only item on the hex. A token gives no
 * control, so a hex holding only a token has no opponent to topple (R33).
 * @param {import('./state.js').State} state
 * @param {string} hex
 * @param {number} player
 * @returns {number | null}
 */
export function loneOpponent(state, hex, player) {
	const { outposts, tokens } = state.hexes[hex];
	if (outposts.length !== 1 || tokens.length > 0) {
		return null;
	}
	const [only] = outposts;
	return !only.toppled && only.seat !== player ? only.seat : null;
}
