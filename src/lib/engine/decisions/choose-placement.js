// The decision to pick a plot in the capital city for a gained building (landmarks follow in the same decision).
import { PlayerError } from '../errors.js';
import { playerSeat } from '../state.js';
import { buildingProblem, buildingSpots } from '../city.js';
import { placePiece } from '../placing.js';

/** @type {import('../state.js').DecisionKind} */
export const choosePlacement = {
	hidden: [],
	answers(state, decision) {
		const seat = playerSeat(state, /** @type {number} */ (decision.player));
		if (decision.landmark !== undefined) {
			throw new Error('Placing a landmark is not built yet.');
		}
		return buildingSpots(seat);
	},
	check(state, decision, answer) {
		if (decision.landmark !== undefined) {
			throw new Error('Placing a landmark is not built yet.');
		}
		if (!Number.isInteger(answer.row) || !Number.isInteger(answer.col)) {
			throw new PlayerError('Choose a row and a column.');
		}
		if (answer.rotation !== undefined) {
			throw new PlayerError('Only a landmark can be turned.');
		}
		const seat = playerSeat(state, /** @type {number} */ (decision.player));
		const problem = buildingProblem(seat, {
			row: answer.row,
			col: answer.col,
		});
		if (problem !== null) {
			throw new PlayerError(problem);
		}
	},
	resolve(ctx, decision, answer) {
		placePiece(
			ctx,
			/** @type {number} */ (decision.player),
			{
				building: decision.building,
				row: answer.row,
				col: answer.col,
			},
			false
		);
	},
};
