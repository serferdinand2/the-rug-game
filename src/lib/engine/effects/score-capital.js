// The scoreCapital effect: 1 VP for each complete row and each complete column of the capital city (01 §6.1; R71: only pieces on the grid count).
import { emit } from '../events.js';
import { playerSeat } from '../state.js';
import { cityPlots, completeLines, uniformLines } from '../city.js';
import { vp } from './vp.js';

/**
 * Counts the capital's complete rows and columns and scores them. Impassable plots count as filled;
 * plots a landmark covers off the grid are not part of any row or column. For the Architects, a complete line of
 * one type of income building scores 2 VP instead of 1 (02 §1.2): `uniform` counts those lines, 0 without them.
 * @type {import('../state.js').EffectHandler}
 */
export function scoreCapital(ctx, player, value, op) {
	const seat = playerSeat(ctx.state, player);
	const { rows, columns } = completeLines(cityPlots(seat));
	const uniform = seat.civs.includes('architects') ? uniformLines(seat) : 0;
	emit(ctx.state, { type: 'capitalScored', player, rows, columns, uniform });
	vp(ctx, player, rows + columns + uniform, op);
}
