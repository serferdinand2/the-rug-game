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
 * Where a piece is drawn: its shape's rectangle clipped to the grid, and how many plots it hangs over each edge (R106).
 * @param {readonly string[]} shape - The turned footprint
 * @param {number} row - The top row of the shape; negative when it hangs over the top
 * @param {number} col - The left column of the shape; negative when it hangs over the left
 * @returns {{ row: number, col: number, rows: number, cols: number, top: number, right: number, bottom: number, left: number }}
 */
export function pieceArea(shape, row, col) {
	/** @param {number} start @param {number} length */
	const clip = (start, length) => {
		const from = Math.min(GRID_SIZE - 1, Math.max(0, start));
		const to = Math.max(from + 1, Math.min(GRID_SIZE, start + length));
		return { from, span: to - from, before: from - start };
	};
	const down = clip(row, shape.length);
	const across = clip(col, shape[0].length);
	return {
		row: down.from,
		col: across.from,
		rows: down.span,
		cols: across.span,
		top: down.before,
		right: shape[0].length - across.before - across.span,
		bottom: shape.length - down.before - down.span,
		left: across.before,
	};
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

/**
 * Where a piece's picture was grabbed. The pointer is held to the picture's box, which is the shape's columns and rows
 * at any size: 29 pixels a plot in the tray, the plots it covers on the grid.
 * @param {{ left: number, top: number, width: number, height: number }} box - The picture's box on the page
 * @param {number} clientX - The pointer, as the drag event has it
 * @param {number} clientY
 * @param {readonly string[]} shape - The piece's turned shape
 * @returns {{ offset: { x: number, y: number }, grab: { x: number, y: number } }} offset: in pixels from the box's
 *   corner, for the drag image; grab: in plots from the shape's top-left corner.
 */
export function grabAt(box, clientX, clientY, shape) {
	const x = Math.min(Math.max(clientX - box.left, 0), box.width);
	const y = Math.min(Math.max(clientY - box.top, 0), box.height);
	return {
		offset: { x, y },
		grab: {
			x: box.width ? (x / box.width) * shape[0].length : 0,
			y: box.height ? (y / box.height) * shape.length : 0,
		},
	};
}

/**
 * Puts where a piece was grabbed into its drag data, under GRAB_TYPE.
 * @param {Pick<DataTransfer, 'setData'>} transfer - The drag's data
 * @param {{ x: number, y: number }} grab - In plots from the shape's top-left corner
 */
export function writeGrab(transfer, grab) {
	transfer.setData(GRAB_TYPE, `${grab.x} ${grab.y}`);
}

/**
 * Reads where a dropped piece was grabbed from its drag data.
 * @param {Pick<DataTransfer, 'getData'>} transfer - The drop's data
 * @returns {{ x: number, y: number } | null} Null when the drag carries no grab, or a broken one.
 */
export function readGrab(transfer) {
	const parts = transfer.getData(GRAB_TYPE).split(' ');
	if (parts.length !== 2 || parts.some((part) => part.trim() === '')) {
		return null;
	}
	const [x, y] = parts.map(Number);
	return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null;
}
