// The Alchemists (02 §1.2): push-your-luck rolls of the science die, then an advance on each marked track.
import { playerSeat } from '../state.js';
import { emit } from '../events.js';
import { SCIENCE_DIE } from '../data/dice.js';

/**
 * The Alchemists' own state.
 * @typedef {Object} AlchemistsData
 * @property {import('../data/ids.js').TrackId[]} marked - The tracks rolled in this activation, in roll order
 */

/**
 * Stops: an optional advance without benefit on each marked track in roll order, 5 VP instead on a track whose
 * tokens are all on space 12. The marks clear.
 * @param {import('../state.js').Context} ctx
 * @param {number} player
 * @param {import('../data/ids.js').TrackId[]} marked
 */
export function stopAlchemists(ctx, player, marked) {
	/** @type {AlchemistsData} */
	const data = playerSeat(ctx.state, player).civData.alchemists;
	data.marked = [];
	ctx.push(
		marked.map((track) => ({
			player,
			kind: 'effects',
			effects: [
				{
					advance: {
						tracks: [track],
						noBenefit: true,
						optional: true,
						offTrackVp: 5,
					},
				},
			],
		}))
	);
}

/**
 * Rolls the science die and marks the track, then asks whether to roll again. A track already marked is a bust: the
 * marks clear and the player gains 1 resource of their choice. Empiricism doesn't apply (design §7, BGA).
 * @type {import('../state.js').AutomaticKind}
 */
export function alchemistsRoll(ctx, op) {
	const player = /** @type {number} */ (op.player);
	/** @type {AlchemistsData} */
	const data = playerSeat(ctx.state, player).civData.alchemists;
	const track = SCIENCE_DIE[ctx.random(SCIENCE_DIE.length)];
	if (data.marked.includes(track)) {
		data.marked = [];
		emit(ctx.state, { type: 'alchemistsBust', player, track });
		ctx.push([
			{ player, kind: 'effects', effects: [{ gain: { any: 1 } }] },
		]);
		return;
	}
	data.marked.push(track);
	emit(ctx.state, {
		type: 'alchemistsRolled',
		player,
		track,
		marked: [...data.marked],
	});
	ctx.push([{ player, kind: 'chooseAlchemists', marked: [...data.marked] }]);
}

/** @type {import('./civ.js').Civ} */
export const alchemists = {
	id: 'alchemists',
	incomeTurns: [2, 3, 4, 5],
	setup(ctx, player) {
		const seat = playerSeat(ctx.state, player);
		seat.civData.alchemists = /** @type {AlchemistsData} */ ({
			marked: [],
		});
	},
	income(ctx, player) {
		ctx.push([{ player, kind: 'alchemistsRoll' }]);
	},
	adjustment: {
		setup(ctx, player) {
			ctx.push([
				{
					player,
					kind: 'effects',
					effects: [{ gain: { any: 1 } }, { vp: 10 }],
				},
			]);
		},
	},
};
