// The Artificers (F&F, #40; 03 FF.3, R70, R71): income buildings set aside or slid left on the income mat.
import { emit } from '../events.js';
import { playerSeat } from '../state.js';
import { triggered } from '../abilities.js';
import { BUILDING_IDS } from '../data/ids.js';

/** @typedef {import('../data/ids.js').BuildingId} BuildingId */
/** @typedef {{ aside: BuildingId[] }} ArtificersData - The buildings set aside, out of play, in order */
/** @typedef {{ act: 'aside' | 'slide' | 'flush', row: BuildingId } | { act: 'score' }} Artifice */

/** The spaces of an income row. */
const ROW = 6;

/**
 * What the Artificers may do on an income turn: on 2–4, set a row's leftmost building aside, or slide it 1 space left
 * onto an empty space; on 5, score 1 VP per income building off the mat (R71, R144), or slide a row flush left.
 * @param {import('../state.js').State} state
 * @param {number} player
 * @param {number} turn
 * @returns {Artifice[]}
 */
export function artificesOf(state, player, turn) {
	const { buildings, slid, flush } = playerSeat(state, player).incomeMat;
	const rows = BUILDING_IDS.filter((row) => buildings[row] > 0);
	if (turn === 5) {
		return [
			{ act: 'score' },
			...rows
				.filter((row) => !flush?.[row])
				.map((row) => ({ act: /** @type {const} */ ('flush'), row })),
		];
	}
	return rows.flatMap((row) => {
		const lead = ROW - buildings[row] - (slid?.[row] ?? 0);
		return [
			{ act: /** @type {const} */ ('aside'), row },
			...(lead > 0 ? [{ act: /** @type {const} */ ('slide'), row }] : []),
		];
	});
}

/** @type {import('./civ.js').Civ} */
export const artificers = {
	id: 'artificers',
	incomeTurns: [2, 3, 4, 5],
	setup(ctx, player) {
		playerSeat(ctx.state, player).civData.artificers =
			/** @type {ArtificersData} */ ({ aside: [] });
	},
	income(ctx, player, turn) {
		const options = artificesOf(ctx.state, player, turn);
		if (options.length > 0) {
			ctx.push([{ player, kind: 'chooseArtifice', turn, options }]);
		}
	},
};

/**
 * Does what the Artificers picked.
 * @param {import('../state.js').Context} ctx
 * @param {number} player
 * @param {Artifice} pick
 */
export function artifice(ctx, player, pick) {
	const { state } = ctx;
	const seat = playerSeat(state, player);
	const mat = seat.incomeMat;
	if (pick.act === 'score') {
		emit(state, { type: 'artificersScored', player });
		ctx.push([
			{
				player,
				kind: 'effects',
				effects: [{ vp: { per: 'incomeBuilding' } }],
				origin: 'civ',
			},
		]);
		return;
	}
	const { row } = pick;
	if (pick.act === 'aside') {
		// Out of play, not gained: it counts for its type (R71) and uncovers its space.
		mat.buildings[row] -= 1;
		if (mat.slid) {
			delete mat.slid[row];
		}
		/** @type {ArtificersData} */ (seat.civData.artificers).aside.push(row);
		emit(state, { type: 'buildingSetAside', player, building: row });
		ctx.push(triggered(state, 'countsChanged', { player }));
		return;
	}
	if (pick.act === 'slide') {
		(mat.slid ??= {})[row] = (mat.slid[row] ?? 0) + 1;
		emit(state, { type: 'buildingSlid', player, building: row });
		return;
	}
	(mat.flush ??= {})[row] = true;
	emit(state, { type: 'rowFlushed', player, building: row });
}
