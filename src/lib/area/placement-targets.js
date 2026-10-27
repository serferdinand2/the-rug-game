// Placing on the capital (#28): a building's lit plots, and the legal places a landmark snaps to, from the prompt's options.
// The engine's answers are the only legal places; the grid's own fit check never decides one.
import { FOOTPRINTS } from '../art/footprints.js';
import { ASSETS } from '../art/catalog.js';

/** All 33 landmarks' names, by id, from the asset catalog. */
const LANDMARK_NAMES = new Map(
	ASSETS.filter((asset) => asset.group === 'landmark').map((asset) => [
		asset.id.slice('landmark/'.length),
		asset.name,
	])
);

/**
 * A capital plot an option stands for: a building's plot, or a landmark's top-left corner and turn.
 * @typedef {Object} OptionPlot
 * @property {number} row - The plot's row, or the top row of the landmark's turned shape; it may be off the grid (R106)
 * @property {number} col - The plot's column, or the left column of the turned shape; it may be off the grid (R106)
 * @property {number | null} rotation - Quarter turns clockwise, 0–3; null for a building
 */

/**
 * The part of a prompt option the capital reads. Options without a plot are chosen in the panel.
 * @typedef {Object} PlacementOption
 * @property {number} index - The answer's index in the decision's answers
 * @property {OptionPlot} [plot] - Set for an option on the capital
 */

/**
 * The landmark being placed, as the tray and the capital draw it.
 * @param {string} landmark - Its id, such as 'lighthouse'
 * @returns {{ id: string, name: string, footprint: readonly string[] }}
 */
export function placingPiece(landmark) {
	return {
		id: landmark,
		name: LANDMARK_NAMES.get(landmark) ?? landmark,
		footprint: FOOTPRINTS[landmark],
	};
}

/**
 * The plots a building may go on, each with its option's index.
 * @param {readonly PlacementOption[]} options - The prompt's options; the panel's are left out
 * @returns {{ row: number, col: number, index: number }[]}
 */
export function plotTargets(options) {
	return options.flatMap((option) =>
		option.plot && option.plot.rotation === null
			? [
					{
						row: option.plot.row,
						col: option.plot.col,
						index: option.index,
					},
				]
			: []
	);
}

/**
 * The option with that rotation whose top-left corner is nearest (row, col), by squared distance.
 * @param {readonly PlacementOption[]} options
 * @param {number} row
 * @param {number} col
 * @param {number} rotation - Quarter turns clockwise, 0–3
 * @returns {number | null} Its index; a tie goes to the lower index. Null when no option has that rotation.
 */
export function legalNear(options, row, col, rotation) {
	return nearest(
		options.filter((option) => option.plot?.rotation === rotation),
		row,
		col
	);
}

/**
 * The next legal turn of a placed landmark: from the option at `current`, the option of the next rotation (+1, then
 * +2, then +3, cycling past 3 to 0) nearest the same top-left corner.
 * @param {readonly PlacementOption[]} options
 * @param {number} current - The index of the option the landmark is on
 * @returns {number | null} Null when no other rotation is legal.
 */
export function nextRotation(options, current) {
	const plot = options.find((option) => option.index === current)?.plot;
	if (!plot || plot.rotation === null) {
		return null;
	}
	for (let turn = 1; turn < 4; turn++) {
		const index = legalNear(
			options,
			plot.row,
			plot.col,
			(plot.rotation + turn) % 4
		);
		if (index !== null) {
			return index;
		}
	}
	return null;
}

/**
 * Where a landmark from the tray lands: legalNear at that rotation, or the nearest legal place of any rotation.
 * @param {readonly PlacementOption[]} options
 * @param {number} row
 * @param {number} col
 * @param {number} rotation - Quarter turns clockwise, 0–3
 * @returns {number | null} Its index. Null when no option is on the capital.
 */
export function placeNear(options, row, col, rotation) {
	return (
		legalNear(options, row, col, rotation) ??
		nearest(
			options.filter(
				(option) => option.plot && option.plot.rotation !== null
			),
			row,
			col
		)
	);
}

/**
 * The index of the option whose plot is nearest (row, col), by squared distance, a tie going to the lower index.
 * @param {readonly PlacementOption[]} options - Each with a plot
 * @param {number} row
 * @param {number} col
 * @returns {number | null} Null when there is none.
 */
function nearest(options, row, col) {
	/** @type {number | null} */
	let best = null;
	let bestDistance = Infinity;
	for (const option of options) {
		const plot = /** @type {OptionPlot} */ (option.plot);
		const distance = (plot.row - row) ** 2 + (plot.col - col) ** 2;
		if (
			distance < bestDistance ||
			(distance === bestDistance && best !== null && option.index < best)
		) {
			best = option.index;
			bestDistance = distance;
		}
	}
	return best;
}
