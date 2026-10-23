// The vp effect: victory points gained now.
import { emit } from '../events.js';
import { seatOf } from '../state.js';

/**
 * Adds victory points to a seat (any kind, since bots gain them too).
 * @type {import('../state.js').EffectHandler}
 */
export function vp(ctx, player, value) {
	if (typeof value !== 'number') {
		throw new Error('VP counters arrive with #14.');
	}
	const seat = seatOf(ctx.state, player);
	seat.vp += value;
	emit(ctx.state, { type: 'vpGained', player, vp: value, total: seat.vp });
}
