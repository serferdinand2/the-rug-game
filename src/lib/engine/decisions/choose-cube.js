// The decision of which open plot an Architects cube goes on: answered with a plot's row and column, as a building's place is, and sent on as an architectsCube (02 §1.2).
import { PlayerError } from '../errors.js';
import { playerSeat } from '../state.js';
import { seatShape } from '../city.js';
import { plotIndex, plotPosition } from '../../capital.js';

/**
 * The shape of the capital a cube decision is about (#36: a mat may be taller than 9 rows).
 * @param {import('../state.js').State} state
 * @param {import('../state.js').Operation} decision
 * @returns {import('../../capital.js').Shape}
 */
function shapeOf(state, decision) {
	return seatShape(
		playerSeat(state, /** @type {number} */ (decision.player))
	);
}

/** @type {import('../state.js').DecisionKind} */
export const chooseCube = {
	hidden: [],
	answers(state, decision) {
		const shape = shapeOf(state, decision);
		return decision.options.map((/** @type {number} */ plot) =>
			plotPosition(plot, shape)
		);
	},
	check(state, decision, answer) {
		const shape = shapeOf(state, decision);
		const offered = decision.options.some(
			(/** @type {number} */ plot) =>
				answer.row === plotPosition(plot, shape).row &&
				answer.col === plotPosition(plot, shape).col
		);
		if (!offered) {
			throw new PlayerError('Choose one of the plots offered.');
		}
	},
	// The cube goes down, then the next is asked for while some are left.
	resolve(ctx, decision, answer) {
		ctx.push([
			{
				player: decision.player,
				kind: 'architectsCube',
				slot: plotIndex(
					answer.row,
					answer.col,
					shapeOf(ctx.state, decision)
				),
				left: decision.left,
			},
		]);
	},
};
