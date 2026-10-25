// The Leaders (02 §1.2): once per track, a free advance with the benefit but no bonus.
import { playerSeat } from '../state.js';
import { askSlot } from '../decisions/choose-slot.js';
import { advanceBlocked } from '../abilities.js';
import { movableFroms } from '../movement.js';
import { TRACK_IDS } from '../data/ids.js';

/**
 * The Leaders' own state.
 * @typedef {Object} LeadersData
 * @property {import('../data/ids.js').TrackId[]} used - The leader squares already covered
 */

/**
 * Covers the picked leader square and advances on its track, with the benefit and no bonus.
 * @type {import('../state.js').AutomaticKind}
 */
export function leadersAdvance(ctx, op) {
	const player = /** @type {number} */ (op.player);
	const track = op.slot;
	/** @type {LeadersData} */
	const data = playerSeat(ctx.state, player).civData.leaders;
	data.used.push(track);
	ctx.push([
		{
			player,
			kind: 'effects',
			effects: [{ advance: { tracks: [track], noBonus: true } }],
		},
	]);
}

/** @type {import('./civ.js').Civ} */
export const leaders = {
	id: 'leaders',
	incomeTurns: [2, 3, 4, 5],
	setup(ctx, player) {
		const seat = playerSeat(ctx.state, player);
		seat.civData.leaders = /** @type {LeadersData} */ ({ used: [] });
	},
	// A square is offered while its track is free of blocks and a token can still advance on it (design §7).
	income(ctx, player) {
		const { state } = ctx;
		const seat = playerSeat(state, player);
		/** @type {LeadersData} */
		const data = seat.civData.leaders;
		askSlot(ctx, player, {
			options: TRACK_IDS.filter(
				(track) =>
					!data.used.includes(track) &&
					!advanceBlocked(state, player, track) &&
					movableFroms(seat, track, 'advance').length > 0
			),
			optional: true,
			purpose: 'leaders',
			then: { kind: 'leadersAdvance' },
		});
	},
};
