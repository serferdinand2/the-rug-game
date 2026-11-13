// Placing on the capital (#28): a building's lit plots, and the legal places a landmark snaps to, from the prompt's options;
// and A&A's cards under the capital that may hold the piece (#184). The engine's answers are the only legal places; the
// grid's own fit check never decides one.
import { FOOTPRINTS } from '../art/footprints.js';
import { rotateFootprint } from '../capital.js';
import {
	civilizationName,
	landmarkName,
	tapestryName,
	techName,
} from '../game-names.js';
import { PLOT_CARDS } from '../engine/data/tapestry-cards.js';

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
 * @property {{ building?: string, landmark?: string, cube?: boolean, move?: boolean, token?: number }} piece - What is placed: a building, a landmark or an Architects cube; or `move`, Cloud City's building to move (#36); or `token`, the seat whose token fills the plot (Dream Monitors, the Weefolk, #40)
 * @property {PlacementOption[]} options
 * @property {number | null} picked
 * @property {Record<string, readonly any[]>} [onCards] - The pieces already on the player's A&A cards, by card (#37, #184)
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
 * @property {boolean} cube - An Architects cube is being placed (#168)
 * @property {boolean} move - Cloud City's building to move is being chosen (#36)
 * @property {import('../ui.js').Seat | null} token - Whose player token is being placed (F&F, #40)
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
 * @property {OptionPlot & { card: string }} [square] - Set for an option on a plot card's square (#184)
 * @property {{ kind: 'tapestry' | 'tech' | 'civ', id: string }} [holder] - Set for an option on a card or mat that holds the piece whole (#184)
 * @property {string} [label] - The option in words
 */

/**
 * A plot card's square under the capital (#184).
 * @typedef {Object} PlotSquare
 * @property {number} row
 * @property {number} col
 * @property {string | null} printed - The art id of the benefit printed on it (Commercial Center), such as 'resource-24/coin'
 * @property {string | null} building - The income building on it
 * @property {number | null} index - An option that lights it: a building's place there, or a landmark's first place covering it
 * @property {boolean} chosen - The picked place is on it
 */

/**
 * A landmark drawn on a plot card: its top left may lie off the card, where it hangs.
 * @typedef {PlaceablePiece & { row: number, col: number, rotation: number }} CardLandmark
 */

/**
 * A plot card the piece may go on, as the Capital tab draws it (#184).
 * @typedef {Object} PlotCardTarget
 * @property {string} card - Its id, such as 'monuments'
 * @property {string} name
 * @property {readonly string[]} grid - Its squares, row by row, X for a square
 * @property {PlotSquare[]} squares - In reading order
 * @property {CardLandmark[]} landmarks - The landmarks already on it
 * @property {{ row: number, col: number, building: string } | null} preview - The building picked on one of its squares, drawn faintly
 * @property {CardLandmark | null} placed - The landmark picked onto it
 * @property {{ top: number, right: number, bottom: number, left: number }} room - Plots kept round the card for what may hang
 *   off it: its landmarks, and every place offered to the landmark being placed, so the card stays put as it moves
 */

/**
 * A card or mat that may hold the piece whole, as the Capital tab draws it (#184).
 * @typedef {Object} HolderTarget
 * @property {'tapestry' | 'tech' | 'civ'} kind
 * @property {string} id - The card's id, or the civilization's
 * @property {string} name
 * @property {string} label - The option in words
 * @property {number} index - Its option
 * @property {boolean} picked
 */

/** The art each benefit printed on a Commercial Center square shows, by its effect's kind (#37's order). */
const PRINTED_ART = /** @type {Readonly<Record<string, string>>} */ ({
	coin: 'resource-24/coin',
	tapestry: 'symbol/tapestry-card',
	invent: 'symbol/invent',
	research: 'symbol/science-die',
});

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
	// A&A's cards may take the landmark too (#184).
	const landmark =
		placement?.piece.landmark &&
		placement.options.some(
			(option) => option.plot || option.square || option.holder
		)
			? placingPiece(placement.piece.landmark)
			: null;
	const onCard = Boolean(
		placement?.options.find(
			(option) =>
				option.index === placement?.picked &&
				(option.square || option.holder)
		)
	);
	const picked =
		placement?.options.find(
			(option) => option.plot && option.index === placement?.picked
		)?.plot ?? null;
	const cube = placement?.piece.cube === true;
	// Cloud City's building to move: its plots light, and nothing is previewed (#36).
	const move = placement?.piece.move === true;
	const token = /** @type {import('../ui.js').Seat | null} */ (
		placement?.piece.token ?? null
	);
	const targets =
		(building || cube || move || token !== null) && placement
			? plotTargets(placement.options)
			: [];
	const positions =
		landmark && placement ? landmarkPositions(placement.options) : null;
	const preview =
		building && picked
			? { row: picked.row, col: picked.col, building }
			: cube && picked
				? { row: picked.row, col: picked.col, cube }
				: token !== null && picked
					? { row: picked.row, col: picked.col, token }
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
	const tray =
		landmark && !placed && !onCard ? [{ ...landmark, rotation: 0 }] : [];
	return {
		building,
		cube,
		move,
		token,
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

/**
 * The cells a footprint covers at a top left and turn.
 * @param {readonly string[]} footprint
 * @param {number} row
 * @param {number} col
 * @param {number} rotation
 * @returns {{ row: number, col: number }[]}
 */
function cellsAt(footprint, row, col, rotation) {
	return rotateFootprint(footprint, rotation).flatMap((line, r) =>
		[...line].flatMap((mark, c) =>
			mark === 'X' ? [{ row: row + r, col: col + c }] : []
		)
	);
}

/**
 * Whether a landmark's place on a plot card covers a square.
 * @param {OptionPlot} place
 * @param {readonly string[]} footprint
 * @param {{ row: number, col: number }} square
 */
function coversSquare(place, footprint, square) {
	return cellsAt(footprint, place.row, place.col, place.rotation ?? 0).some(
		(cell) => cell.row === square.row && cell.col === square.col
	);
}

/**
 * A plot card as drawn under the capital or on the Eras tab: its squares with the pieces on them, the ones its options
 * light, the picked place, and the room kept round it for what may hang off.
 * @param {string} card
 * @param {readonly any[]} held - The pieces on it (the engine's CardPiece)
 * @param {{ options: readonly PlacementOption[], landmark: PlaceablePiece | null, building: string | null, pick: OptionPlot | null }} placing
 * @returns {PlotCardTarget}
 */
function plotCard(card, held, { options, landmark, building, pick }) {
	const { grid, squares: printed = [] } = PLOT_CARDS[card];
	const placed =
		landmark && pick
			? {
					...landmark,
					row: pick.row,
					col: pick.col,
					rotation: pick.rotation ?? 0,
				}
			: null;
	const landmarks = held.flatMap((p) =>
		'landmark' in p && 'row' in p
			? [
					{
						...placingPiece(p.landmark),
						row: p.row,
						col: p.col,
						rotation: p.rotation ?? 0,
					},
				]
			: []
	);
	/** @type {PlotSquare[]} */
	const squares = grid
		.flatMap((line, row) =>
			[...line].flatMap((mark, col) =>
				mark === 'X' ? [{ row, col }] : []
			)
		)
		.map((square, at) => {
			const benefit = printed[at]?.[0];
			const kind = benefit
				? 'gain' in benefit
					? Object.keys(benefit.gain)[0]
					: Object.keys(benefit)[0]
				: null;
			const option = options.find((o) =>
				landmark
					? o.square &&
						coversSquare(o.square, landmark.footprint, square)
					: o.square?.row === square.row &&
						o.square?.col === square.col
			);
			return {
				...square,
				printed: kind ? (PRINTED_ART[kind] ?? null) : null,
				building:
					held.find(
						(p) =>
							'building' in p &&
							p.row === square.row &&
							p.col === square.col
					)?.building ?? null,
				index: option?.index ?? null,
				chosen: placed
					? coversSquare(placed, placed.footprint, square)
					: pick?.row === square.row && pick?.col === square.col,
			};
		});
	// Every cell a landmark here covers, or any offered place would, decides the room kept round the card.
	const cells = [
		...landmarks.flatMap((l) =>
			cellsAt(l.footprint, l.row, l.col, l.rotation)
		),
		...(landmark
			? options.flatMap((o) =>
					o.square
						? cellsAt(
								landmark.footprint,
								o.square.row,
								o.square.col,
								o.square.rotation ?? 0
							)
						: []
				)
			: []),
	];
	const rows = grid.length;
	const cols = grid[0].length;
	return {
		card,
		name: tapestryName(card),
		grid,
		squares,
		landmarks,
		preview:
			building && pick
				? { row: pick.row, col: pick.col, building }
				: null,
		placed,
		room: {
			top: Math.max(0, ...cells.map((c) => -c.row)),
			right: Math.max(0, ...cells.map((c) => c.col - (cols - 1))),
			bottom: Math.max(0, ...cells.map((c) => c.row - (rows - 1))),
			left: Math.max(0, ...cells.map((c) => -c.col)),
		},
	};
}

/**
 * The top card of an era slot as the Eras tab draws it, when it is a plot card: what it holds, nothing lit (#184).
 * @param {string} card - A tapestry card id
 * @param {readonly any[]} held - The pieces on it (the engine's CardPiece)
 * @returns {PlotCardTarget | null} Null for a card without squares
 */
export function heldPlotCard(card, held) {
	if (!Object.hasOwn(PLOT_CARDS, card)) {
		return null;
	}
	return plotCard(card, held, {
		options: [],
		landmark: null,
		building: null,
		pick: null,
	});
}

/**
 * The A&A cards under the capital a piece may go on (#184): each plot card with its squares, its pieces and the lit
 * ones, the picked place drawn on it; then each card or mat that holds the piece whole.
 * @param {PlacementPrompt | null} placement
 * @returns {{ plots: PlotCardTarget[], holders: HolderTarget[] }}
 */
export function cardTargets(placement) {
	if (!placement) {
		return { plots: [], holders: [] };
	}
	const { piece, options, picked } = placement;
	const onCards = placement.onCards ?? {};
	const landmark = piece.landmark ? placingPiece(piece.landmark) : null;
	const chosen = options.find((option) => option.index === picked) ?? null;
	const squareOptions = options.filter((option) => option.square);
	const cards = [
		...new Set(
			squareOptions.map(
				(option) => /** @type {{ card: string }} */ (option.square).card
			)
		),
	];
	const plots = cards.map((card) => {
		const pick = chosen?.square?.card === card ? chosen.square : null;
		return plotCard(card, onCards[card] ?? [], {
			options: squareOptions.filter(
				(option) => option.square?.card === card
			),
			landmark,
			building: piece.building ?? null,
			pick,
		});
	});
	const holders = options.flatMap((option) => {
		if (!option.holder) {
			return [];
		}
		const { kind, id } = option.holder;
		return [
			{
				kind,
				id,
				name:
					kind === 'tech'
						? techName(id)
						: kind === 'civ'
							? civilizationName(id)
							: tapestryName(id),
				label: option.label ?? '',
				index: option.index,
				picked: option.index === picked,
			},
		];
	});
	return { plots, holders };
}

/**
 * Where a click on a plot card's square puts the landmark (#184): the offered place covering that square, at the tray's
 * turn when one is, nearest to where the landmark is on that card; the lower index on a tie. Null when none covers it.
 * @param {readonly PlacementOption[]} options
 * @param {string} card
 * @param {{ row: number, col: number }} square
 * @param {number} rotation - The tray's turn
 * @param {{ row: number, col: number } | null} current - The landmark's top left on that card, if it is there
 * @param {string} landmark - Its id
 * @returns {number | null}
 */
export function plotLanding(
	options,
	card,
	square,
	rotation,
	current,
	landmark
) {
	const footprint = FOOTPRINTS[landmark];
	const covering = options.filter(
		(option) =>
			option.square?.card === card &&
			coversSquare(option.square, footprint, square)
	);
	const turned = covering.filter(
		(option) => option.square?.rotation === rotation
	);
	const pool = turned.length > 0 ? turned : covering;
	const from = current ?? square;
	/** @param {PlacementOption} option */
	const distance = (option) => {
		const at = /** @type {OptionPlot} */ (option.square);
		return Math.abs(at.row - from.row) + Math.abs(at.col - from.col);
	};
	return (
		[...pool].sort(
			(a, b) => distance(a) - distance(b) || a.index - b.index
		)[0]?.index ?? null
	);
}
