// The scoreCapital effect: 1 VP for each complete row and each complete column of the capital city (R13).
import { emit } from '../events.js';
import { playerSeat } from '../state.js';
import { cityPlots, completeLines } from '../city.js';
import { vp } from './vp.js';

/**
 * Counts the capital's complete rows and columns and scores them. Impassable plots count as filled;
 * plots a landmark covers off the grid are not part of any row or column.
 * @type {import('../state.js').EffectHandler}
 */
export function scoreCapital(ctx, player, value, op) {
	const { rows, columns } = completeLines(
		cityPlots(playerSeat(ctx.state, player))
	);
	emit(ctx.state, { type: 'capitalScored', player, rows, columns });
	vp(ctx, player, rows + columns, op);
}
