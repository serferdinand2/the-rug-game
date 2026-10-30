// Placing on the capital (#28): a building's lit plots, and the legal places a landmark snaps to, from the prompt's options.
// The engine's answers are the only legal places; the grid's own fit check never decides one.
import { FOOTPRINTS } from '../art/footprints.js';
import { rotateFootprint } from '../capital.js';
import { landmarkName } from '../game-names.js';

/**
 * A placeable landmark as the Capital tab draws it.
 * @typedef {Object} PlaceablePiece
 * @property {string} id
 * @property {string} name
 * @property {readonly string[]} footprint
 */

/**
 * A building or landmark placement decision from the game view.
 * @typedef {Object} PlacementPrompt
 * @property {{ building?: string, landmark?: string }} piece
 * @property {PlacementOption[]} options
 * @property {number | null} picked
 */

/**
 * The landmarks and plots that were just built.
 * @typedef {Object} FreshCapital
 * @property {import('../components/player/CapitalGrid.svelte').CapitalGridTarget[]} plots
 * @property {string[]} landmarks
 */

/**
 * The values the Capital tab draws for a pending placement.
 * @typedef {Object} CapitalPlacementView
 * @property {string | null} building
 * @property {PlaceablePiece | null} landmark
 * @property {OptionPlot | null} picked
 * @property {{ row: number, col: number, index: number }[]} targets
 * @property {import('../placement.js').PiecePosition[] | null} positions
 * @property {import('../components/player/CapitalGrid.svelte').CapitalGridPreview | null} preview
 * @property {(import('../components/player/CapitalGrid.svelte').CapitalGridPiece & { rotation: number }) | null} placed
 * @property {import('../components/player/CapitalGrid.svelte').CapitalGridPiece[]} pieces
 * @property {(PlaceablePiece & { rotation: number })[]} tray
 */

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
		name: landmarkName(landmark),
		footprint: FOOTPRINTS[landmark],
	};
}

/**
 * The top-left corner that puts a turned landmark's middle on the requested plot.
 * @param {readonly string[]} footprint
 * @param {number} rotation - Quarter turns clockwise, 0–3
 * @param {number} row - The plot to centre on
 * @param {number} col - The plot to centre on
 * @returns {{ row: number, col: number }}
 */
export function centredCorner(footprint, rotation, row, col) {
	const shape = rotateFootprint(footprint, rotation);
	return {
		row: row - Math.floor((shape.length - 1) / 2),
		col: col - Math.floor((shape[0].length - 1) / 2),
	};
}

/**
 * The nearest legal option when a plot is clicked for a landmark.
 * @param {readonly PlacementOption[]} options
 * @param {PlaceablePiece} landmark
 * @param {{ row: number, col: number }} at - The plot that was clicked
 * @param {{ rotation: number } | null} placed - The landmark's current turn, or null when it is in the tray
 * @returns {number | null}
 */
export function landingIndex(options, landmark, at, placed) {
	const rotation = placed?.rotation ?? 0;
	const corner = centredCorner(landmark.footprint, rotation, at.row, at.col);
	return placed
		? legalNear(options, corner.row, corner.col, rotation)
		: placeNear(options, corner.row, corner.col, rotation);
}

/**
 * The Capital tab's placement and landmark values, derived from the prompt.
 * @param {import('./capital.js').CapitalView | null} capital
 * @param {PlacementPrompt | null} placement
 * @param {FreshCapital} fresh
 * @returns {CapitalPlacementView}
 */
export function capitalPlacement(capital, placement, fresh) {
	const building = placement?.piece.building ?? null;
	const landmark =
		placement?.piece.landmark &&
		placement.options.some((option) => option.plot)
			? placingPiece(placement.piece.landmark)
			: null;
	const picked =
		placement?.options.find(
			(option) => option.plot && option.index === placement?.picked
		)?.plot ?? null;
	const targets = building && placement ? plotTargets(placement.options) : [];
	const positions =
		landmark && placement ? landmarkPositions(placement.options) : null;
	const preview =
		building && picked
			? { row: picked.row, col: picked.col, building }
			: null;
	const placed =
		landmark && picked && picked.rotation !== null
			? {
					...landmark,
					row: picked.row,
					col: picked.col,
					rotation: picked.rotation,
				}
			: null;
	const pieces = (
		capital && placed
			? [...capital.pieces, placed]
			: (capital?.pieces ?? [])
	).map((piece) =>
		fresh.landmarks.includes(piece.id) ? { ...piece, fresh: true } : piece
	);
	const tray = landmark && !placed ? [{ ...landmark, rotation: 0 }] : [];
	return {
		building,
		landmark,
		picked,
		targets,
		positions,
		preview,
		placed,
		pieces,
		tray,
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
 * The places a landmark may go on the capital, as CapitalGrid steps and snaps among them.
 * @param {readonly PlacementOption[]} options - The prompt's options; the buildings' and the panel's are left out
 * @returns {import('../placement.js').PiecePosition[]}
 */
export function landmarkPositions(options) {
	return options.flatMap((option) =>
		option.plot && option.plot.rotation !== null
			? [
					{
						row: option.plot.row,
						col: option.plot.col,
						rotation: option.plot.rotation,
					},
				]
			: []
	);
}

/**
 * The option exactly at a landmark position, as CapitalGrid reports a move or a turn.
 * @param {readonly PlacementOption[]} options
 * @param {import('../placement.js').PiecePosition} position
 * @returns {number | null} Its index; null when no option is there.
 */
export function optionAt(options, { row, col, rotation }) {
	return (
		options.find(
			(option) =>
				option.plot?.row === row &&
				option.plot.col === col &&
				option.plot.rotation === rotation
		)?.index ?? null
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
