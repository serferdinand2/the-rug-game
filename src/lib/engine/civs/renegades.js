// The Renegades (A&A, #37; 03 §2.4): their own 4-space track, one space per tier, taken instead of a track space's benefit when the tiers match.
import { emit } from '../events.js';
import { isPlayerSeat, playerSeat } from '../state.js';
import { claimAchievement } from '../achievements.js';
import { TRACKS } from '../data/tracks.js';

/** @typedef {{ at: number }} RenegadesData - 0 on the start, then the space reached, 1 to 4 */

/**
 * What each Renegades space gives, tiers I to IV (03 §2.4, from the mat's art): a tapestry card and an income building
 * of your choice; a science-die roll with its benefit, then invent; explore, conquer, then upgrade; 20 VP.
 * @type {readonly import('../data/effects.js').Effect[][]}
 */
export const RENEGADES_SPACES = Object.freeze([
	[{ gain: { tapestry: 1 } }, { anyBuilding: {} }],
	[{ research: {} }, { invent: {} }],
	[{ explore: {} }, { conquer: {} }, { upgrade: {} }],
	[{ vp: 20 }],
]);

/**
 * Whether an advance onto a track space may take the Renegades' next space instead of its benefit: the player holds
 * the Renegades, still plays, has a space left, and the board space's tier is that space's.
 * @param {import('../state.js').State} state
 * @param {number} player
 * @param {import('../data/ids.js').TrackId} track
 * @param {number} to - The space reached
 * @returns {boolean}
 */
export function renegadesMayTake(state, player, track, to) {
	if (!isPlayerSeat(state, player)) {
		return false;
	}
	const seat = playerSeat(state, player);
	/** @type {RenegadesData | undefined} */
	const data = seat.civData.renegades;
	if (!seat.civs.includes('renegades') || !data || seat.finished) {
		return false;
	}
	const next = data.at + 1;
	return next <= RENEGADES_SPACES.length && TRACKS[track][to].tier === next;
}

/**
 * Moves the Renegades token 1 space and gives that space; its end counts for "complete any track" (03 §2.4).
 * @param {import('../state.js').Context} ctx
 * @param {number} player
 */
export function renegadesAdvance(ctx, player) {
	/** @type {RenegadesData} */
	const data = playerSeat(ctx.state, player).civData.renegades;
	data.at += 1;
	emit(ctx.state, { type: 'renegadesMoved', player, at: data.at });
	if (data.at === RENEGADES_SPACES.length) {
		claimAchievement(ctx, player, 'complete-track');
	}
	ctx.push([
		{
			player,
			kind: 'effects',
			effects: structuredClone(RENEGADES_SPACES[data.at - 1]),
			ordered: true,
			origin: 'civ',
		},
	]);
}

/** @type {import('./civ.js').Civ} */
export const renegades = {
	id: 'renegades',
	setup(ctx, player) {
		playerSeat(ctx.state, player).civData.renegades =
			/** @type {RenegadesData} */ ({ at: 0 });
	},
};
