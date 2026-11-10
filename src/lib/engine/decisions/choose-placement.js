// The decision to pick a place for a gained building or landmark: a plot in the capital city, or another place a civilization offers (#20 design §9).
import { PlayerError } from '../errors.js';
import { playerSeat } from '../state.js';
import { buildingProblem, landmarkProblem } from '../city.js';
import {
	buildsOverImpassable,
	placeBesideMat,
	placeInColumn,
	placeOnMap,
	placeOnTech,
	placePiece,
	placements,
} from '../placing.js';
import { placeInPark, placeOnCard } from '../card-pieces.js';
import { storeLandmark } from '../civs/urban-planners.js';
import { collect } from '../civs/collectors.js';

/** The answer keys of the places other than a capital plot. */
const OTHER_PLACES = /** @type {const} */ ([
	'besideMat',
	'craftsmen',
	'hex',
	'tech',
	'card',
	'planners',
	'collectors',
]);

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

/**
 * Whether an answer names exactly a place on offer: the same keys, each the same.
 * @param {object} place
 * @param {Record<string, any>} answer
 * @returns {boolean}
 */
function samePlace(place, answer) {
	const keys = Object.keys(place);
	return (
		keys.length === Object.keys(answer).length &&
		keys.every(
			(key) =>
				/** @type {Record<string, unknown>} */ (place)[key] ===
				answer[key]
		)
	);
}

/** @type {import('../state.js').DecisionKind} */
export const choosePlacement = {
	hidden: [],
	answers(state, decision) {
		return placements(
			state,
			/** @type {number} */ (decision.player),
			pieceOf(decision),
			decision.capitalOnly === true
		);
	},
	check(state, decision, answer) {
		const key = otherPlace(answer);
		if (key !== undefined) {
			// The whole place must match: a card's square and turn, a park's flag (#37).
			const offered = placements(
				state,
				/** @type {number} */ (decision.player),
				pieceOf(decision),
				decision.capitalOnly === true
			).some((place) => samePlace(place, answer));
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
		const overImpassable = buildsOverImpassable(state, player);
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
				overImpassable
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
			overImpassable
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
			// National Parks' territory, or the Nomads' (#37).
			if (answer.parks === true) {
				placeInPark(ctx, player, pieceOf(decision), answer.hex);
				return;
			}
			placeOnMap(ctx, player, pieceOf(decision), answer.hex);
			return;
		}
		if (key === 'tech') {
			placeOnTech(ctx, player, decision.landmark, answer.tech);
			return;
		}
		if (key === 'collectors') {
			collect(
				ctx,
				player,
				decision.landmark !== undefined ? 'landmark' : 'house',
				decision.landmark ?? true
			);
			return;
		}
		if (key === 'planners') {
			storeLandmark(ctx, player, decision.landmark);
			return;
		}
		if (key === 'card') {
			placeOnCard(
				ctx,
				player,
				pieceOf(decision),
				/** @type {any} */ (answer)
			);
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
