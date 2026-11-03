// The Islanders (03 §1.3, R115): 4 territory tiles when they come in, a mat of 6 hexes round a printed centre where income turns 2-5 may explore one tile, and 4 VP at the end for each mat tile with only sea on its outer sides.
import { playerSeat } from '../state.js';
import { MAT_HEXES, openMatHexes, seaOutside } from '../island.js';
import { offer } from './civ.js';

/**
 * The Islanders' own state.
 * @typedef {Object} IslandersData
 * @property {(import('../island.js').MatTile | null)[]} hexes - The tile on each mat hex by position, null while it is empty
 */

/** The territory tiles they gain when they come in (R113). */
export const ISLANDERS_TILES = 4;

/** The VP for each mat tile showing only sea on its three outward sides, on the final income turn. */
export const ISLANDERS_SEA_VP = 4;

/** The tiles a mat can hold. */
export const ISLANDERS_MAT = MAT_HEXES;

/** The final income turn. */
const LAST_TURN = 5;

/**
 * The Islanders' start: an empty mat, and the operation gaining 4 territory tiles into their supply.
 * @param {import('../state.js').State} state
 * @param {number} player
 * @returns {import('../state.js').NewOperation}
 */
function start(state, player) {
	/** @type {IslandersData} */
	const data = { hexes: Array(MAT_HEXES).fill(null) };
	playerSeat(state, player).civData.islanders = data;
	return {
		player,
		kind: 'effects',
		effects: [{ gain: { territory: ISLANDERS_TILES } }],
	};
}

/**
 * The Islanders' placing after the offer to discard them, unless they were discarded: their tiles gained, they may
 * place up to 4 of them on the mat at no benefit (R113, 03 §1.3). Each time they are asked again, until they decline,
 * run out of tiles or hexes, or have placed 4.
 * @type {import('../state.js').AutomaticKind}
 */
export function islandersPlace(ctx, op) {
	const { state } = ctx;
	const player = /** @type {number} */ (op.player);
	const seat = playerSeat(state, player);
	if (!seat.civs.includes('islanders')) {
		return;
	}
	if (op.left === undefined) {
		ctx.push([
			start(state, player),
			{
				player,
				kind: 'islandersPlace',
				left: ISLANDERS_TILES,
				tiles: null,
			},
		]);
		return;
	}
	const placed = op.tiles !== null && seat.territoryTiles.length < op.tiles;
	if (
		op.left === 0 ||
		(op.tiles !== null && !placed) ||
		seat.territoryTiles.length === 0 ||
		openMatHexes(state, player).length === 0
	) {
		return;
	}
	ctx.push([
		offer(
			state,
			player,
			[{ explore: { mat: true, free: true } }],
			'islandersPlace'
		),
		{
			player,
			kind: 'islandersPlace',
			left: op.left - 1,
			tiles: seat.territoryTiles.length,
		},
	]);
}

/** @type {import('./civ.js').Civ} */
export const islanders = {
	id: 'islanders',
	incomeTurns: [2, 3, 4, 5],
	// At setup they start at once; gained mid-game they may be discarded for another civilization first, and kept they
	// gain their tiles and may place up to 4 (R113).
	setup(ctx, player, midGame) {
		if (!midGame) {
			ctx.push([start(ctx.state, player)]);
			return;
		}
		ctx.push([
			offer(
				ctx.state,
				player,
				[{ discardCiv: { civ: 'islanders' } }, { gainCiv: {} }],
				'islandersDiscard'
			),
			{ player, kind: 'islandersPlace' },
		]);
	},
	// Income turns 2-5: they may explore one tile onto the mat, scoring its matching sides and taking its benefit. On the
	// final turn, 4 VP for each mat tile with only sea on its outward sides (their hand counts at step 3; no step 1
	// choice can change the mat's tiles after the explore).
	income(ctx, player, turn) {
		const { state } = ctx;
		const seat = playerSeat(state, player);
		/** @type {import('../state.js').NewOperation[]} */
		const ops = [];
		if (
			seat.territoryTiles.length > 0 &&
			openMatHexes(state, player).length > 0
		) {
			ops.push(
				offer(
					state,
					player,
					[{ explore: { mat: true } }],
					'islandersExplore'
				)
			);
		}
		if (turn === LAST_TURN) {
			ops.push({ player, kind: 'islandersScore' });
		}
		ctx.push(ops);
	},
};

/**
 * The final income turn's VP: 4 for each mat tile with only sea on its outward sides. Run after the explore, so a tile
 * explored on the same turn counts.
 * @type {import('../state.js').AutomaticKind}
 */
export function islandersScore(ctx, op) {
	const player = /** @type {number} */ (op.player);
	/** @type {IslandersData | undefined} */
	const data = playerSeat(ctx.state, player).civData.islanders;
	const sea =
		data?.hexes.filter(
			(lying, position) => lying !== null && seaOutside(lying, position)
		).length ?? 0;
	if (sea > 0) {
		ctx.push([
			{
				player,
				kind: 'effects',
				effects: [{ vp: sea * ISLANDERS_SEA_VP }],
			},
		]);
	}
}
