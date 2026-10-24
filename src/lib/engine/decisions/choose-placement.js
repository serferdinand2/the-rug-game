// The decision to pick a plot in the capital city for a gained building or landmark.
import { PlayerError } from '../errors.js';
import { playerSeat } from '../state.js';
import {
	buildingProblem,
	buildingSpots,
	landmarkProblem,
	landmarkSpots,
} from '../city.js';
import { placePiece } from '../placing.js';

/** @type {import('../state.js').DecisionKind} */
export const choosePlacement = {
	hidden: [],
	answers(state, decision) {
		const seat = playerSeat(state, /** @type {number} */ (decision.player));
		if (decision.landmark !== undefined) {
			return landmarkSpots(
				seat,
				/** @type {string} */ (decision.landmark)
			);
		}
		return buildingSpots(seat);
	},
	check(state, decision, answer) {
		if (!Number.isInteger(answer.row) || !Number.isInteger(answer.col)) {
			throw new PlayerError('Choose a row and a column.');
		}
		const seat = playerSeat(state, /** @type {number} */ (decision.player));
		if (decision.landmark !== undefined) {
			if (![0, 1, 2, 3].includes(answer.rotation)) {
				throw new PlayerError('Choose a rotation from 0 to 3.');
			}
			const problem = landmarkProblem(seat, {
				landmark: /** @type {string} */ (decision.landmark),
				row: answer.row,
				col: answer.col,
				rotation: answer.rotation,
			});
			if (problem !== null) {
				throw new PlayerError(problem);
			}
			return;
		}
		if (answer.rotation !== undefined) {
			throw new PlayerError('Only a landmark can be turned.');
		}
		const problem = buildingProblem(seat, {
			row: answer.row,
			col: answer.col,
		});
		if (problem !== null) {
			throw new PlayerError(problem);
		}
	},
	resolve(ctx, decision, answer) {
		const player = /** @type {number} */ (decision.player);
		if (decision.landmark !== undefined) {
			placePiece(
				ctx,
				player,
				{
					landmark: /** @type {string} */ (decision.landmark),
					row: answer.row,
					col: answer.col,
					rotation: answer.rotation,
				},
				false
			);
			return;
		}
		placePiece(
			ctx,
			player,
			{
				building: decision.building,
				row: answer.row,
				col: answer.col,
			},
			false
		);
	},
};
