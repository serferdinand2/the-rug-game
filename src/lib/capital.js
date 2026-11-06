// Capital-grid geometry for the interface: plot indices, footprint rotation, legal positions and completed groups.
// The rules engine decides what may be built; this only answers where a shape fits and what the grid shows.

/** @typedef {'empty' | 'lily' | 'blocked' | 'market' | 'house' | 'farm' | 'armory' | 'landmark'} PlotKind - 'lily' is a Swamp lily pad still showing: filled for districts and lines, open to build on (#36) */
/** @typedef {'rows' | 'columns' | 'districts'} GroupKind */
/** @typedef {{ row: number, col: number }} Position */
/** @typedef {{ row: number, col: number, rows: number, cols: number }} Bounds */
/**
 * A capital's shape: its rows and columns, and its districts as plot indices (row × cols + col). The basic mats are
 * 9 × 9 in nine 3×3 districts; an advanced mat may be taller or have districts of its own shape (#36).
 * @typedef {{ rows: number, cols: number, districts: readonly (readonly number[])[] }} Shape
 */

/** A basic capital is GRID_SIZE × GRID_SIZE plots, in 3 × 3 districts. */
export const GRID_SIZE = 9;
const DISTRICT_SIZE = 3;

/**
 * The basic mats' shape, which every function here takes when given none.
 * @type {Shape}
 */
export const BASIC_SHAPE = Object.freeze({
	rows: GRID_SIZE,
	cols: GRID_SIZE,
	districts: Object.freeze(
		[...Array(GRID_SIZE).keys()].map((district) => {
			const top = Math.floor(district / DISTRICT_SIZE) * DISTRICT_SIZE;
			const left = (district % DISTRICT_SIZE) * DISTRICT_SIZE;
			return Object.freeze(
				[...Array(GRID_SIZE).keys()].map(
					(n) =>
						(top + Math.floor(n / DISTRICT_SIZE)) * GRID_SIZE +
						left +
						(n % DISTRICT_SIZE)
				)
			);
		})
	),
});

/**
 * The index of a plot in a row-by-row list of the grid.
 * @param {number} row
 * @param {number} col
 * @param {Shape} [shape]
 * @returns {number}
 */
export function plotIndex(row, col, shape = BASIC_SHAPE) {
	return row * shape.cols + col;
}

/**
 * The row and column of a plot in a row-by-row list of the grid: plotIndex the other way.
 * @param {number} index
 * @param {Shape} [shape]
 * @returns {Position}
 */
export function plotPosition(index, shape = BASIC_SHAPE) {
	return { row: Math.floor(index / shape.cols), col: index % shape.cols };
}

/**
 * Turns a footprint clockwise. Footprints are rows, top first, with X for a covered plot and . for an empty one.
 * @param {readonly string[]} rows
 * @param {number} turns - Quarter turns; negative turns go anticlockwise.
 * @returns {string[]}
 */
export function rotateFootprint(rows, turns) {
	let grid = rows.map((row) => [...row]);
	for (let turn = 0; turn < ((turns % 4) + 4) % 4; turn++) {
		grid = grid[0].map((_, col) => grid.map((row) => row[col]).reverse());
	}
	return grid.map((row) => row.join(''));
}

/**
 * Whether a plot is on the grid; a landmark may hang over the edge (R106).
 * @param {number} row
 * @param {number} col
 * @param {Shape} shape
 * @returns {boolean}
 */
function onGrid(row, col, shape) {
	return row >= 0 && row < shape.rows && col >= 0 && col < shape.cols;
}

/**
 * The plots a footprint covers when its top-left corner is at (row, col). The parts over the edge cover none (R106).
 * @param {readonly string[]} rows
 * @param {number} row
 * @param {number} col
 * @param {Shape} [shape]
 * @returns {number[]} Plot indices, row by row.
 */
export function footprintCells(rows, row, col, shape = BASIC_SHAPE) {
	return rows.flatMap((line, dy) =>
		[...line].flatMap((cell, dx) =>
			cell === 'X' && onGrid(row + dy, col + dx, shape)
				? [plotIndex(row + dy, col + dx, shape)]
				: []
		)
	);
}

/**
 * Whether a footprint fits with its top-left corner at (row, col): inside the grid and only on empty plots.
 * @param {readonly PlotKind[]} plots - Every plot, row by row.
 * @param {readonly string[]} rows
 * @param {number} row
 * @param {number} col
 * @param {Shape} [shape]
 * @returns {boolean}
 */
export function fits(plots, rows, row, col, shape = BASIC_SHAPE) {
	if (
		row < 0 ||
		col < 0 ||
		row + rows.length > shape.rows ||
		col + rows[0].length > shape.cols
	) {
		return false;
	}
	return footprintCells(rows, row, col, shape).every(
		(index) => plots[index] === 'empty'
	);
}

/**
 * The legal position nearest to (row, col), for snapping a dropped landmark.
 * @param {readonly PlotKind[]} plots
 * @param {readonly string[]} rows
 * @param {number} row
 * @param {number} col
 * @param {Shape} [shape]
 * @returns {Position | null} Null when the footprint fits nowhere.
 */
export function nearestFit(plots, rows, row, col, shape = BASIC_SHAPE) {
	/** @type {Position | null} */
	let best = null;
	let bestDistance = Infinity;
	for (let r = 0; r < shape.rows; r++) {
		for (let c = 0; c < shape.cols; c++) {
			const distance = (r - row) ** 2 + (c - col) ** 2;
			if (distance < bestDistance && fits(plots, rows, r, c, shape)) {
				best = { row: r, col: c };
				bestDistance = distance;
			}
		}
	}
	return best;
}

/**
 * Every row, column or district, each as its plot indices.
 * @param {GroupKind} kind
 * @param {Shape} [shape]
 * @returns {number[][]}
 */
export function groupsOf(kind, shape = BASIC_SHAPE) {
	const rows = [...Array(shape.rows).keys()];
	const cols = [...Array(shape.cols).keys()];
	if (kind === 'rows') {
		return rows.map((row) => cols.map((col) => plotIndex(row, col, shape)));
	}
	if (kind === 'columns') {
		return cols.map((col) => rows.map((row) => plotIndex(row, col, shape)));
	}
	return shape.districts.map((district) => [...district]);
}

/**
 * The groups whose plots are all filled. Impassable plots and lily pads count as filled (01 §6; R52).
 * @param {readonly PlotKind[]} plots
 * @param {GroupKind} kind
 * @param {Shape} [shape]
 * @returns {number[][]}
 */
export function completedGroups(plots, kind, shape = BASIC_SHAPE) {
	return groupsOf(kind, shape).filter((group) =>
		group.every((index) => plots[index] !== 'empty')
	);
}

/**
 * The rectangle a group covers, in plots.
 * @param {readonly number[]} group
 * @param {Shape} [shape]
 * @returns {Bounds}
 */
export function groupBounds(group, shape = BASIC_SHAPE) {
	const rows = group.map((index) => Math.floor(index / shape.cols));
	const cols = group.map((index) => index % shape.cols);
	const row = Math.min(...rows);
	const col = Math.min(...cols);
	return {
		row,
		col,
		rows: Math.max(...rows) - row + 1,
		cols: Math.max(...cols) - col + 1,
	};
}
