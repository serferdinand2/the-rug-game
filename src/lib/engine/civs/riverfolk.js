// The Riverfolk (03 §1.3): VP for the districts with impassable plots, buildings over them, a resource for each district they clear, and a VP loss for each one still showing on income turn 5.
import { emit } from '../events.js';
import { playerSeat } from '../state.js';
import { cityPlots } from '../city.js';
import { groupsOf } from '../../capital.js';
import { CAPITAL_MATS, impassablePlots } from '../data/capitals.js';
import { offer } from './civ.js';

/**
 * The Riverfolk's own state.
 * @typedef {Object} RiverfolkData
 * @property {number[]} cleared - The districts (0-8) whose impassable plots are all covered: paid for once, or already
 * covered when the Riverfolk came, in the order cleared
 */

/** The VP the Riverfolk start with for each district with enough impassable plots. */
export const RIVERFOLK_DISTRICT_VP = 4;

/** The impassable plots a district needs to score at the start. */
const DISTRICT_PLOTS = 2;

/**
 * The impassable plots of a seat's capital, shown or covered: the mat's and the Architects' cubes.
 * @param {import('../state.js').PlayerSeat} seat
 * @returns {number[]}
 */
function impassableOf(seat) {
	const mat = CAPITAL_MATS[/** @type {number} */ (seat.capital.mat) - 1];
	return [...impassablePlots(mat), ...seat.capital.cubes];
}

/**
 * The districts with impassable plots none of which still shows, in reading order.
 * @param {import('../state.js').PlayerSeat} seat
 * @returns {number[]}
 */
function clearDistricts(seat) {
	const impassable = impassableOf(seat);
	const plots = cityPlots(seat);
	return groupsOf('districts').flatMap((group, district) =>
		group.some((p) => impassable.includes(p)) &&
		group.every((p) => plots[p] !== 'blocked')
			? [district]
			: []
	);
}

/**
 * The Riverfolk's start, at setup or when kept mid-game (R113): 4 VP for each district with at least 2 impassable
 * plots showing. A district covered before they came pays nothing later.
 * @param {import('../state.js').Context} ctx
 * @param {number} player
 */
function start(ctx, player) {
	const seat = playerSeat(ctx.state, player);
	seat.civData.riverfolk = /** @type {RiverfolkData} */ ({
		cleared: clearDistricts(seat),
	});
	const plots = cityPlots(seat);
	const districts = groupsOf('districts').filter(
		(group) =>
			group.filter((p) => plots[p] === 'blocked').length >= DISTRICT_PLOTS
	).length;
	if (districts > 0) {
		ctx.push([
			{
				player,
				kind: 'effects',
				effects: [{ vp: RIVERFOLK_DISTRICT_VP * districts }],
			},
		]);
	}
}

/**
 * The Riverfolk's start after the offer to discard them, unless they were discarded.
 * @type {import('../state.js').AutomaticKind}
 */
export function riverfolkStart(ctx, op) {
	const player = /** @type {number} */ (op.player);
	if (playerSeat(ctx.state, player).civs.includes('riverfolk')) {
		start(ctx, player);
	}
}

/**
 * Marks the districts a placement cleared and pays 1 resource of the player's choice for each. One marked since the
 * placement is skipped, so each district pays once.
 * @type {import('../state.js').AutomaticKind}
 */
export function riverfolkClear(ctx, op) {
	const player = /** @type {number} */ (op.player);
	/** @type {RiverfolkData} */
	const data = playerSeat(ctx.state, player).civData.riverfolk;
	/** @type {number[]} */
	const fresh = op.districts.filter(
		(/** @type {number} */ district) => !data.cleared.includes(district)
	);
	if (fresh.length === 0) {
		return;
	}
	data.cleared.push(...fresh);
	emit(ctx.state, { type: 'districtsCleared', player, districts: fresh });
	ctx.push([
		{ player, kind: 'effects', effects: [{ gain: { any: fresh.length } }] },
	]);
}

/** @type {import('./civ.js').Civ} */
export const riverfolk = {
	id: 'riverfolk',
	incomeTurns: [5],
	// Gained mid-game, they may be discarded for another civilization first; kept, their start follows (R113).
	setup(ctx, player, midGame) {
		if (!midGame) {
			start(ctx, player);
			return;
		}
		ctx.push([
			offer(ctx.state, player, [
				{ discardCiv: { civ: 'riverfolk' } },
				{ gainCiv: {} },
			]),
			{ player, kind: 'riverfolkStart' },
		]);
	},
	// The final income turn: 1 VP for each impassable plot still showing, but never below 0 VP (my call).
	income(ctx, player) {
		const seat = playerSeat(ctx.state, player);
		const showing = cityPlots(seat).filter(
			(kind) => kind === 'blocked'
		).length;
		const lost = Math.min(showing, seat.vp);
		if (lost > 0) {
			ctx.push([{ player, kind: 'effects', effects: [{ vp: -lost }] }]);
		}
	},
	hooks: {
		// Only a piece of their own that covered an impassable plot can clear one of their districts. Nothing before
		// they are set up: kept mid-game, they wait for the offer first.
		piecePlaced(state, owner, { player, impassable }) {
			const seat = playerSeat(state, owner);
			/** @type {RiverfolkData | undefined} */
			const data = seat.civData.riverfolk;
			if (owner !== player || !(impassable > 0) || !data) {
				return [];
			}
			const districts = clearDistricts(seat).filter(
				(district) => !data.cleared.includes(district)
			);
			return districts.length > 0
				? [{ player: owner, kind: 'riverfolkClear', districts }]
				: [];
		},
	},
};
