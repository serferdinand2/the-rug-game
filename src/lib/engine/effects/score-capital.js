// The scoreCapital effect: 1 VP for each complete row and each complete column of the capital city (01 §6.1; R71: only pieces on the grid count).
import { emit } from '../events.js';
import { playerSeat } from '../state.js';
import { capitalScore } from '../city.js';
import { vp } from './vp.js';

/**
 * Counts the capital's complete rows and columns and scores them. Impassable plots count as filled;
 * plots a landmark covers off the grid are not part of any row or column. For the Architects, a complete line of
 * one type of income building scores 2 VP instead of 1 (02 §1.2): `uniform` counts those lines, 0 without them.
 * The count is city.js's capitalScore, which the player cards show too (#128).
 * @type {import('../state.js').EffectHandler}
 */
export function scoreCapital(ctx, player, value, op) {
	const {
		rows,
		columns,
		uniform,
		vp: points,
	} = capitalScore(playerSeat(ctx.state, player));
	emit(ctx.state, { type: 'capitalScored', player, rows, columns, uniform });
	vp(ctx, player, points, { ...op, origin: 'capital' });
}
