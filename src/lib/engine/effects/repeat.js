// The repeat effect: gain the benefit of a space where one of your tokens is, and you may pay its bonus (Academic Research).
import { seatOf } from '../state.js';
import { activationOps, isActivated } from '../movement.js';
import { TRACK_IDS } from '../data/ids.js';

/**
 * The spaces a player could repeat: each space 1–12 holding one of their tokens, unless they activated it this turn.
 * So Academic Research can't repeat itself, and nothing repeats AI Singularity once its token has left (R19, FAQ #6, #9).
 * @param {import('../state.js').State} state
 * @param {number} player
 * @returns {{ track: import('../data/ids.js').TrackId, space: number }[]}
 */
export function repeatable(state, player) {
	const seat = seatOf(state, player);
	return TRACK_IDS.flatMap((track) =>
		[...new Set(seat.tracks[track])]
			.sort((a, b) => a - b)
			.filter(
				(space) =>
					space > 0 && !isActivated(state, player, track, space)
			)
			.map((space) => ({ track, space }))
	);
}

/**
 * Repeats one space. Mandatory: a single possible space is repeated without asking, and with none nothing happens.
 * @type {import('../state.js').EffectHandler}
 */
export function repeat(ctx, player) {
	const options = repeatable(ctx.state, player);
	if (options.length === 0) {
		return;
	}
	if (options.length === 1) {
		const [{ track, space }] = options;
		ctx.push(activationOps(ctx, player, track, space));
		return;
	}
	ctx.push([{ player, kind: 'chooseRepeat', options }]);
}
