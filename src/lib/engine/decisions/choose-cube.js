// The decision of which open plot an Architects cube goes on: answered with a plot's row and column, as a building's place is, and sent on as an architectsCube (02 §1.2).
import { PlayerError } from '../errors.js';
import { GRID_SIZE, plotIndex } from '../../capital.js';

/**
 * A plot index as the row and column an answer names.
 * @param {number} plot
 * @returns {{ row: number, col: number }}
 */
function placeOf(plot) {
	return { row: Math.floor(plot / GRID_SIZE), col: plot % GRID_SIZE };
}

/** @type {import('../state.js').DecisionKind} */
export const chooseCube = {
	hidden: [],
	answers(state, decision) {
		return decision.options.map(placeOf);
	},
	check(state, decision, answer) {
		const offered = decision.options.some(
			(/** @type {number} */ plot) =>
				answer.row === placeOf(plot).row &&
				answer.col === placeOf(plot).col
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
				slot: plotIndex(answer.row, answer.col),
				left: decision.left,
			},
		]);
	},
};
