// The map's rules: matching sides, and the hexes a player may explore or conquer (R5, R16).
import { MAPS, hexNeighbours } from './data/maps.js';
import { TERRITORY_TILES } from './data/territory-tiles.js';
import {
	controlledTerritories,
	itemCount,
	tokenController,
} from './control.js';
import { cornersOf, turned } from './terrain.js';
import { allies } from './abilities.js';
import { matMatchingSides, parseMatHex } from './island.js';

/**
 * How many sides of a territory tile placed on a hex match the territories next to it (R5; BGA's
 * getMatchingEdgeCount). A side matches when either of its two corners equals the facing corner of the neighbour.
 * Off-map and unexplored neighbours never match. A hex of the Islanders' mat (`mat:1:0`) is scored among the mat's tiles.
 * @param {import('./state.js').State} state
 * @param {string} hex
 * @param {number} tile - 1-48
 * @param {number} orient - 0-5
 * @returns {number}
 */
export function matchingSides(state, hex, tile, orient) {
	if (parseMatHex(hex)) {
		return matMatchingSides(state, hex, tile, orient);
	}
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
 * @param {readonly string[]} [only] - When given, only these hexes may be targets (#33: Manifest Destiny, Cartography)
 * @returns {string[]}
 */
export function conquerTargets(state, player, anywhere, only) {
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
			(anywhere || touches(hex, owned)) &&
			(only === undefined || only.includes(hex))
	);
}

/**
 * The seat of another seat's upright outpost, Nomads piece or Treasure Hunters token, when it is the only item on the
 * hex: the opponent who controlled it, and who defends it. Any other token gives no control, so a hex holding only one
 * has no opponent (R33); a Treasure Hunters token does (R114), though nothing of theirs topples.
 * @param {import('./state.js').State} state
 * @param {string} hex
 * @param {number} player
 * @returns {number | null}
 */
export function loneOpponent(state, hex, player) {
	const { outposts, tokens } = state.hexes[hex];
	if (outposts.length + tokens.length !== 1) {
		return null;
	}
	const [only] = outposts;
	if (only === undefined) {
		const seat = tokenController(state.hexes[hex]);
		return seat !== player ? seat : null;
	}
	return !only.toppled && only.seat !== player ? only.seat : null;
}
