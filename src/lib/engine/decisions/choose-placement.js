// The decision to pick a place for a gained building or landmark: a plot in the capital city, or another place a civilization offers (#20 design §9).
import { PlayerError } from '../errors.js';
import { playerSeat } from '../state.js';
import { hasEra } from '../abilities.js';
import { buildingProblem, landmarkProblem } from '../city.js';
import {
	placeBesideMat,
	placeInColumn,
	placeOnMap,
	placePiece,
	placements,
} from '../placing.js';

/** The answer keys of the places other than a capital plot. */
const OTHER_PLACES = /** @type {const} */ (['besideMat', 'craftsmen', 'hex']);

/**
 * The piece a placement decision is for.
 * @param {import('../state.js').Operation} decision
 * @returns {import('../placing.js').Piece}
 */
function pieceOf(decision) {
	return decision.landmark !== undefined
		? { landmark: decision.landmark }
		: { building: decision.building };
}

/**
 * Which place other than a capital plot an answer names, if any.
 * @param {Record<string, any>} answer
 * @returns {(typeof OTHER_PLACES)[number] | undefined}
 */
function otherPlace(answer) {
	return OTHER_PLACES.find((key) => answer[key] !== undefined);
}

/** @type {import('../state.js').DecisionKind} */
export const choosePlacement = {
	hidden: [],
	answers(state, decision) {
		return placements(
			state,
			/** @type {number} */ (decision.player),
			pieceOf(decision)
		);
	},
	check(state, decision, answer) {
		const key = otherPlace(answer);
		if (key !== undefined) {
			const offered = placements(
				state,
				/** @type {number} */ (decision.player),
				pieceOf(decision)
			).some(
				(place) =>
					key in place &&
					/** @type {Record<string, unknown>} */ (place)[key] ===
						answer[key]
			);
			if (!offered) {
				throw new PlayerError("You can't place it there.");
			}
			return;
		}
		if (!Number.isInteger(answer.row) || !Number.isInteger(answer.col)) {
			throw new PlayerError('Choose a row and a column.');
		}
		const player = /** @type {number} */ (decision.player);
		const seat = playerSeat(state, player);
		const terraform = hasEra(state, player, 'terraforming');
		if (decision.landmark !== undefined) {
			if (![0, 1, 2, 3].includes(answer.rotation)) {
				throw new PlayerError('Choose a rotation from 0 to 3.');
			}
			const problem = landmarkProblem(
				seat,
				{
					landmark: /** @type {string} */ (decision.landmark),
					row: answer.row,
					col: answer.col,
					rotation: answer.rotation,
				},
				terraform
			);
			if (problem !== null) {
				throw new PlayerError(problem);
			}
			return;
		}
		if (answer.rotation !== undefined) {
			throw new PlayerError('Only a landmark can be turned.');
		}
		const problem = buildingProblem(
			seat,
			{ row: answer.row, col: answer.col },
			terraform
		);
		if (problem !== null) {
			throw new PlayerError(problem);
		}
	},
	resolve(ctx, decision, answer) {
		const player = /** @type {number} */ (decision.player);
		const key = otherPlace(answer);
		if (key === 'besideMat') {
			placeBesideMat(ctx, player, pieceOf(decision));
			return;
		}
		if (key === 'craftsmen') {
			placeInColumn(ctx, player, decision.building, answer.craftsmen);
			return;
		}
		if (key === 'hex') {
			placeOnMap(ctx, player, pieceOf(decision), answer.hex);
			return;
		}
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
