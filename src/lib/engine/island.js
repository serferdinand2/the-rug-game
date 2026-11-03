// The Islanders' mat (03 §1.3, R115): a printed centre hex ringed by 6 hexes where their territory tiles lie, scored like the board's (R5).
// It imports only data and state, so the explore and map modules can read the mat without the civilization cycle.
import { terrainsFrom } from './data/ids.js';
import { TERRITORY_TILES } from './data/territory-tiles.js';
import { playerSeat } from './state.js';
import { turned } from './terrain.js';

/** @typedef {import('./data/ids.js').TerrainId} TerrainId */

/**
 * A territory tile lying on a mat hex.
 * @typedef {{ tile: number, orient: number }} MatTile
 */

/**
 * The mat's printed centre hex: four equal quarters, mountain top-left, grassland top-right, forest bottom-right and
 * desert bottom-left (R115, owner, 2026-11-03). Held as the terrain along each half of each side, clockwise from the
 * top-left corner: two to each side, the half at its start corner then the half at its end corner. An ordinary
 * territory is the same with each corner's two halves alike; the centre's left and right corners are split between
 * two quarters.
 */
export const ISLANDERS_CENTRE_SLOTS = Object.freeze(
	terrainsFrom('M,G,G,G,F,F,F,D,D,D,M,M')
);

/**
 * The centre's 6 corners, for the picture only: each corner takes the slot at the start of the side it begins. Scoring
 * reads the slots.
 */
export const ISLANDERS_CENTRE = Object.freeze(
	[0, 1, 2, 3, 4, 5].map((k) => ISLANDERS_CENTRE_SLOTS[2 * k])
);

/** The hexes round the centre; hex `n` touches the centre, hex `n - 1` and hex `n + 1`. */
export const MAT_HEXES = 6;

/**
 * The id of a mat hex, which carries its seat so it can be read from the state alone (the board's hexes are 'a_b').
 * @param {number} player - The seat 1 to n
 * @param {number} position - 0 to 5
 * @returns {string}
 */
export function matHex(player, position) {
	return `mat:${player}:${position}`;
}

/**
 * The seat and position of a mat hex id, or null for a hex on the board.
 * @param {string} hex
 * @returns {{ player: number, position: number } | null}
 */
export function parseMatHex(hex) {
	const parts = hex.split(':');
	return parts[0] === 'mat' && parts.length === 3
		? { player: Number(parts[1]), position: Number(parts[2]) }
		: null;
}

/**
 * The tiles on a player's mat by position, or null when they are not the Islanders.
 * @param {import('./state.js').State} state
 * @param {number} player
 * @returns {(MatTile | null)[] | null}
 */
export function matOf(state, player) {
	return playerSeat(state, player).civData.islanders?.hexes ?? null;
}

/**
 * The empty mat hexes of a player, in position order; none when they have no mat.
 * @param {import('./state.js').State} state
 * @param {number} player
 * @returns {string[]}
 */
export function openMatHexes(state, player) {
	const mat = matOf(state, player);
	if (!mat) {
		return [];
	}
	return mat.flatMap((tile, position) =>
		tile === null ? [matHex(player, position)] : []
	);
}

/**
 * The corners the neighbouring mat tiles show on the sides of a mat hex: the hexes either side of it on sides
 * `position + 2` and `position + 4` (as the board's sides run, see `HEX_SIDES`), null where nothing lies. The centre,
 * on side `position + 3`, is read from its slots instead.
 * @param {(MatTile | null)[]} mat
 * @param {number} position
 * @returns {(readonly TerrainId[] | null)[]}
 */
function neighbourCorners(mat, position) {
	/** @type {(readonly TerrainId[] | null)[]} */
	const sides = Array(6).fill(null);
	const ring = [
		[(position + 1) % MAT_HEXES, (position + 2) % 6],
		[(position + MAT_HEXES - 1) % MAT_HEXES, (position + 4) % 6],
	];
	for (const [other, side] of ring) {
		const lying = mat[other];
		if (lying) {
			sides[side] = turned(
				TERRITORY_TILES[lying.tile - 1].corners,
				lying.orient
			);
		}
	}
	return sides;
}

/**
 * How many sides of a tile lying on a mat hex match its neighbours on the mat, as `matchingSides` counts them on the
 * board (R5): a side matches when either of its two corners equals the facing corner of the neighbour.
 * @param {import('./state.js').State} state
 * @param {string} hex - A mat hex id
 * @param {number} tile - 1-48
 * @param {number} orient - 0-5
 * @returns {number}
 */
export function matMatchingSides(state, hex, tile, orient) {
	const where = /** @type {{ player: number, position: number }} */ (
		parseMatHex(hex)
	);
	const mat = matOf(state, where.player) ?? [];
	const mine = turned(TERRITORY_TILES[tile - 1].corners, orient);
	let count = 0;
	const centreSide = (where.position + 3) % 6;
	// The centre's side facing this hex: its slot at the side's start corner, then at its end corner. Our corner e faces
	// the end slot and our corner e + 1 the start slot, as on the board.
	const start = ISLANDERS_CENTRE_SLOTS[2 * ((centreSide + 3) % 6)];
	const end = ISLANDERS_CENTRE_SLOTS[2 * ((centreSide + 3) % 6) + 1];
	if (mine[centreSide] === end || mine[(centreSide + 1) % 6] === start) {
		count++;
	}
	neighbourCorners(mat, where.position).forEach((theirs, e) => {
		if (!theirs) {
			return;
		}
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
 * Whether a tile lying on a mat hex shows only sea on its three outward sides, at all 4 of their corners: the sides
 * that face neither the centre nor the hexes beside it (03 §1.3).
 * @param {MatTile} lying
 * @param {number} position
 * @returns {boolean}
 */
export function seaOutside({ tile, orient }, position) {
	const corners = turned(TERRITORY_TILES[tile - 1].corners, orient);
	// Sides position - 1, position and position + 1 run over the corners position - 1 to position + 2.
	return [5, 0, 1, 2].every((k) => corners[(position + k) % 6] === 'sea');
}
