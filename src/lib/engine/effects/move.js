// The advance and regress effects: one space forward or back on one of the listed tracks, with that space's benefit.
import { seatOf } from '../state.js';
import { movableFroms, moveToken } from '../movement.js';

/**
 * Moves one of a player's tokens one space on one of `tracks`. Mandatory: a single possible move is made without
 * asking, and with none nothing happens. Landing on the start gains nothing.
 * @param {import('../state.js').Context} ctx
 * @param {number} player
 * @param {import('../data/ids.js').TrackId[]} tracks
 * @param {'advance' | 'regress'} direction
 * @param {boolean} benefit - False for the X (noBenefit): landmarks are still gained, but no benefit or bonus
 */
function moveOnOneOf(ctx, player, tracks, direction, benefit) {
	const seat = seatOf(ctx.state, player);
	const options = tracks.flatMap((track) =>
		movableFroms(seat, track, direction).map((from) => ({ track, from }))
	);
	if (options.length === 0) {
		return;
	}
	if (options.length === 1) {
		const [{ track, from }] = options;
		const to = direction === 'advance' ? from + 1 : from - 1;
		moveToken(ctx, player, { track, from, to, benefit });
		return;
	}
	ctx.push([
		{
			player,
			kind: 'chooseMove',
			direction,
			options,
			benefit,
			optional: false,
		},
	]);
}

/**
 * Advance 1 space on one of the listed tracks, with its benefit and optional bonus (Physics, Quantum Physics).
 * @type {import('../state.js').EffectHandler}
 */
export function advance(ctx, player, value) {
	moveOnOneOf(ctx, player, value.tracks, 'advance', !value.noBenefit);
}

/**
 * Go back 1 space on one of the listed tracks, then gain that space's benefit and optional bonus (Neuroscience).
 * @type {import('../state.js').EffectHandler}
 */
export function regress(ctx, player, value) {
	moveOnOneOf(ctx, player, value.tracks, 'regress', !value.noBenefit);
}
