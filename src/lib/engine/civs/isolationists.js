// The Isolationists (02 §1.2): a token beside the outpost on an empty territory they conquer, and VP for their largest land mass of one terrain on income turn 5.
import { isPlayerSeat, playerSeat } from '../state.js';
import { controlledTerritories, itemCount } from '../control.js';
import { terrainsOf, turned } from '../terrain.js';
import { hexNeighbours } from '../data/maps.js';
import { TERRAIN_IDS } from '../data/ids.js';
import { offer } from './civ.js';

/** @typedef {import('../data/ids.js').TerrainId} TerrainId */

/**
 * The Isolationists' own state.
 * @typedef {Object} IsolationistsData
 * @property {number} tokens - The tokens still on the mat
 */

/** The terrains a land mass can be of: water never counts (R32). */
const LAND = TERRAIN_IDS.filter((terrain) => terrain !== 'sea');

/** R31: the VP for a land mass of 0 to 6 territories; 6 or more score 40. */
export const LAND_MASS_VP = [0, 5, 10, 16, 23, 31, 40];

/** The tokens the Isolationists start with, for the engine and the card (#107). */
export const ISOLATIONISTS_TOKENS = 4;

/**
 * The offer that comes with a conquest, made before the outpost goes on: when the territory holds no item and the
 * player holds the Isolationists with a token left, one of them may go there too, for 1 resource of their choice.
 * @param {import('../state.js').State} state
 * @param {number} player - The attacker
 * @param {string} hex
 * @returns {import('../state.js').NewOperation[]} Empty when there is nothing to offer
 */
export function isolationistsOffer(state, player, hex) {
	if (!isPlayerSeat(state, player) || itemCount(state, hex) > 0) {
		return [];
	}
	const seat = playerSeat(state, player);
	/** @type {IsolationistsData | undefined} */
	const data = seat.civData.isolationists;
	if (!seat.civs.includes('isolationists') || !data || data.tokens === 0) {
		return [];
	}
	return [
		offer(state, player, [
			{ placeToken: { hex, civ: 'isolationists' } },
			{ gain: { any: 1 } },
		]),
	];
}

/**
 * Whether two neighbouring territories link for a terrain (R32): it is on both sides of a corner they share. Side e of
 * one faces side (e + 3) % 6 of the other, and their corners meet as in map.js's matchingSides.
 * @param {readonly TerrainId[]} mine - The first territory's corners, turned
 * @param {readonly TerrainId[]} theirs - The neighbour's corners, turned
 * @param {number} side - The first territory's side the neighbour is on
 * @param {TerrainId} terrain
 * @returns {boolean}
 */
function linked(mine, theirs, side, terrain) {
	const facing = (side + 3) % 6;
	return (
		(mine[side] === terrain && theirs[(facing + 1) % 6] === terrain) ||
		(mine[(side + 1) % 6] === terrain && theirs[facing] === terrain)
	);
}

/**
 * The size of a player's largest land mass of one terrain (R32). For each land terrain, the controlled territories
 * showing it anywhere, corners or island, form groups of linked neighbours. A territory with sea on every corner, such
 * as the middle island, links with none, so it is a group of 1.
 * @param {import('../state.js').State} state
 * @param {number} player
 * @returns {number}
 */
function largestLandMass(state, player) {
	const owned = controlledTerritories(state, player).flatMap((hex) => {
		const terrains = terrainsOf(state, hex);
		return terrains
			? [
					{
						hex,
						corners: turned(
							terrains.corners,
							state.hexes[hex].orient
						),
						shown: [...terrains.corners, ...terrains.island],
					},
				]
			: [];
	});
	let largest = 0;
	for (const terrain of LAND) {
		/** The territories showing the terrain, with their turned corners. */
		const showing = new Map(
			owned
				.filter(({ shown }) => shown.includes(terrain))
				.map(({ hex, corners }) => [hex, corners])
		);
		/** @type {Set<string>} */
		const grouped = new Set();
		for (const [start, corners] of showing) {
			if (grouped.has(start)) {
				continue;
			}
			grouped.add(start);
			const group = [{ hex: start, corners }];
			for (let i = 0; i < group.length; i++) {
				const { hex, corners: mine } = group[i];
				hexNeighbours(hex).forEach((other, side) => {
					const theirs = showing.get(other);
					if (
						theirs &&
						!grouped.has(other) &&
						linked(mine, theirs, side, terrain)
					) {
						grouped.add(other);
						group.push({ hex: other, corners: theirs });
					}
				});
			}
			largest = Math.max(largest, group.length);
		}
	}
	return largest;
}

/** @type {import('./civ.js').Civ} */
export const isolationists = {
	id: 'isolationists',
	incomeTurns: [5],
	setup(ctx, player) {
		playerSeat(ctx.state, player).civData.isolationists =
			/** @type {IsolationistsData} */ ({ tokens: ISOLATIONISTS_TOKENS });
	},
	// The final income turn: R31's VP for the largest land mass; none without one.
	income(ctx, player) {
		const size = largestLandMass(ctx.state, player);
		const vp = LAND_MASS_VP[Math.min(size, LAND_MASS_VP.length - 1)];
		if (vp > 0) {
			ctx.push([{ player, kind: 'effects', effects: [{ vp }] }]);
		}
	},
	adjustment: {
		setup(ctx, player) {
			ctx.push([
				{
					player,
					kind: 'effects',
					effects: [{ gain: { territory: 2 } }],
				},
			]);
		},
	},
};
