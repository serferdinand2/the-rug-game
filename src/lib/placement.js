// Landmark placement on the capital grid: pieces as occupied plots, snapping, keyboard moves, turning, and the shape a piece is drawn in.
// The rules engine decides whether a placement is legal; this only answers where a piece fits and how it looks.
import {
	GRID_SIZE,
	rotateFootprint,
	footprintCells,
	fits,
	nearestFit,
	completedGroups,
} from './capital.js';

/** @typedef {import('./capital.js').PlotKind} PlotKind */
/** @typedef {import('./capital.js').Position} Position */

/**
 * A landmark on the capital grid, placed or locked.
 * @typedef {Object} PlacedPiece
 * @property {string} id - The landmark's slug, such as 'lighthouse'
 * @property {readonly string[]} footprint - Its footprint as printed, before rotation
 * @property {number} row - The top row of its turned shape
 * @property {number} col - The left column of its turned shape
 * @property {number} [rotation=0] - Quarter turns clockwise, 0–3
 * @property {boolean} [locked=false] - Confirmed: it can no longer move and counts towards completed groups
 */

/**
 * A piece's footprint turned by its rotation.
 * @param {Pick<PlacedPiece, 'footprint' | 'rotation'>} piece
 * @returns {string[]}
 */
export function pieceShape(piece) {
	return rotateFootprint(piece.footprint, piece.rotation ?? 0);
}

/**
 * The plots with every given piece's plots filled as landmarks.
 * @param {readonly PlotKind[]} plots - All 81 plots, row by row
 * @param {readonly PlacedPiece[]} pieces
 * @returns {PlotKind[]} A new list; the plots given are left as they are.
 */
export function withPieces(plots, pieces) {
	const filled = [...plots];
	for (const piece of pieces) {
		for (const index of footprintCells(
			pieceShape(piece),
			piece.row,
			piece.col
		)) {
			filled[index] = 'landmark';
		}
	}
	return filled;
}

/**
 * How many rows, columns and districts are complete. A placed piece counts only once it is locked.
 * @param {readonly PlotKind[]} plots
 * @param {readonly PlacedPiece[]} pieces
 * @returns {{ rows: number, columns: number, districts: number }}
 */
export function completionCounts(plots, pieces) {
	const filled = withPieces(
		plots,
		pieces.filter((piece) => piece.locked)
	);
	return {
		rows: completedGroups(filled, 'rows').length,
		columns: completedGroups(filled, 'columns').length,
		districts: completedGroups(filled, 'districts').length,
	};
}

/**
 * The plots a piece may not cover: the plots given plus every other piece.
 * @param {readonly PlotKind[]} plots
 * @param {readonly PlacedPiece[]} pieces
 * @param {string} id - The piece that is moving
 * @returns {PlotKind[]}
 */
function othersFilled(plots, pieces, id) {
	return withPieces(
		plots,
		pieces.filter((other) => other.id !== id)
	);
}

/**
 * The legal position nearest to (row, col) for a piece, ignoring its own plots.
 * @param {readonly PlotKind[]} plots
 * @param {readonly PlacedPiece[]} pieces - Every piece on the grid; the moving one may be among them
 * @param {Pick<PlacedPiece, 'id' | 'footprint' | 'rotation'>} piece
 * @param {number} row
 * @param {number} col
 * @returns {Position | null} Null when it fits nowhere.
 */
export function snapPiece(plots, pieces, piece, row, col) {
	return nearestFit(
		othersFilled(plots, pieces, piece.id),
		pieceShape(piece),
		row,
		col
	);
}

/**
 * Where an arrow key moves a piece: the next position in that direction where it fits, hopping over plots it cannot cover.
 * @param {readonly PlotKind[]} plots
 * @param {readonly PlacedPiece[]} pieces
 * @param {PlacedPiece} piece
 * @param {number} dRow - -1, 0 or 1
 * @param {number} dCol - -1, 0 or 1
 * @returns {Position | null} Null when there is nowhere further to go.
 */
export function stepPiece(plots, pieces, piece, dRow, dCol) {
	const filled = othersFilled(plots, pieces, piece.id);
	const shape = pieceShape(piece);
	for (let step = 1; step < GRID_SIZE; step++) {
		const row = piece.row + dRow * step;
		const col = piece.col + dCol * step;
		if (
			row < 0 ||
			col < 0 ||
			row + shape.length > GRID_SIZE ||
			col + shape[0].length > GRID_SIZE
		) {
			return null;
		}
		if (fits(filled, shape, row, col)) {
			return { row, col };
		}
	}
	return null;
}

/**
 * A piece turned a quarter clockwise, moved to the nearest position where its turned shape fits.
 * @param {readonly PlotKind[]} plots
 * @param {readonly PlacedPiece[]} pieces
 * @param {PlacedPiece} piece
 * @returns {{ rotation: number, row: number, col: number } | null} Null when the turned shape fits nowhere.
 */
export function rotatePiece(plots, pieces, piece) {
	const rotation = ((piece.rotation ?? 0) + 1) % 4;
	const position = snapPiece(
		plots,
		pieces,
		{ ...piece, rotation },
		piece.row,
		piece.col
	);
	return position && { rotation, ...position };
}

/**
 * The covered plots of a shape as an SVG path, one unit square per plot.
 * @param {readonly string[]} shape - Rows, top first, with X for a covered plot
 * @returns {string}
 */
export function fillPath(shape) {
	return shape
		.flatMap((line, row) =>
			[...line].map((cell, col) =>
				cell === 'X' ? `M${col} ${row}h1v1h-1z` : ''
			)
		)
		.join('');
}

/**
 * The border of a shape as an SVG path: one unit segment for each plot edge that has no covered plot beyond it.
 * @param {readonly string[]} shape
 * @returns {string}
 */
export function outlinePath(shape) {
	/** @param {number} row @param {number} col */
	const covered = (row, col) => shape[row]?.[col] === 'X';
	return shape
		.flatMap((line, row) =>
			[...line].flatMap((cell, col) => {
				if (cell !== 'X') {
					return [];
				}
				return [
					covered(row - 1, col) ? '' : `M${col} ${row}h1`,
					covered(row + 1, col) ? '' : `M${col} ${row + 1}h1`,
					covered(row, col - 1) ? '' : `M${col} ${row}v1`,
					covered(row, col + 1) ? '' : `M${col + 1} ${row}v1`,
				];
			})
		)
		.join('');
}

/**
 * The plot the rotate, confirm and return controls hang from: the rightmost covered plot of the top row.
 * @param {readonly string[]} shape
 * @returns {Position}
 */
export function controlsAnchor(shape) {
	return { row: 0, col: shape[0].lastIndexOf('X') };
}

/** The drag data type that says where a dragged piece was grabbed, as "x y" in plots from its top-left corner. */
export const GRAB_TYPE = 'application/x-rug-game-grab';
