// Capital-grid geometry for the interface: plot indices, footprint rotation, legal positions and completed groups.
// The rules engine decides what may be built; this only answers where a shape fits and what the grid shows.

/** @typedef {'empty' | 'blocked' | 'market' | 'house' | 'farm' | 'armory' | 'landmark'} PlotKind */
/** @typedef {'rows' | 'columns' | 'districts'} GroupKind */
/** @typedef {{ row: number, col: number }} Position */
/** @typedef {{ row: number, col: number, rows: number, cols: number }} Bounds */

/** A capital is GRID_SIZE × GRID_SIZE plots, in 3 × 3 districts. */
export const GRID_SIZE = 9;
const DISTRICT_SIZE = 3;

/**
 * The index of a plot in a row-by-row list of the grid.
 * @param {number} row
 * @param {number} col
 * @returns {number}
 */
export function plotIndex(row, col) {
	return row * GRID_SIZE + col;
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
 * The plots a footprint covers when its top-left corner is at (row, col).
 * @param {readonly string[]} rows
 * @param {number} row
 * @param {number} col
 * @returns {number[]} Plot indices, row by row.
 */
export function footprintCells(rows, row, col) {
	return rows.flatMap((line, dy) =>
		[...line].flatMap((cell, dx) =>
			cell === 'X' ? [plotIndex(row + dy, col + dx)] : []
		)
	);
}

/**
 * Whether a footprint fits with its top-left corner at (row, col): inside the grid and only on empty plots.
 * @param {readonly PlotKind[]} plots - All 81 plots, row by row.
 * @param {readonly string[]} rows
 * @param {number} row
 * @param {number} col
 * @returns {boolean}
 */
export function fits(plots, rows, row, col) {
	if (
		row < 0 ||
		col < 0 ||
		row + rows.length > GRID_SIZE ||
		col + rows[0].length > GRID_SIZE
	) {
		return false;
	}
	return footprintCells(rows, row, col).every(
		(index) => plots[index] === 'empty'
	);
}

/**
 * The legal position nearest to (row, col), for snapping a dropped landmark.
 * @param {readonly PlotKind[]} plots
 * @param {readonly string[]} rows
 * @param {number} row
 * @param {number} col
 * @returns {Position | null} Null when the footprint fits nowhere.
 */
export function nearestFit(plots, rows, row, col) {
	/** @type {Position | null} */
	let best = null;
	let bestDistance = Infinity;
	for (let r = 0; r < GRID_SIZE; r++) {
		for (let c = 0; c < GRID_SIZE; c++) {
			const distance = (r - row) ** 2 + (c - col) ** 2;
			if (distance < bestDistance && fits(plots, rows, r, c)) {
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
 * @returns {number[][]}
 */
export function groupsOf(kind) {
	const lines = [...Array(GRID_SIZE).keys()];
	if (kind === 'rows') {
		return lines.map((row) => lines.map((col) => plotIndex(row, col)));
	}
	if (kind === 'columns') {
		return lines.map((col) => lines.map((row) => plotIndex(row, col)));
	}
	return lines.map((district) => {
		const top = Math.floor(district / DISTRICT_SIZE) * DISTRICT_SIZE;
		const left = (district % DISTRICT_SIZE) * DISTRICT_SIZE;
		return lines.map((n) =>
			plotIndex(
				top + Math.floor(n / DISTRICT_SIZE),
				left + (n % DISTRICT_SIZE)
			)
		);
	});
}

/**
 * The groups whose plots are all filled. Impassable plots count as filled (01 §6).
 * @param {readonly PlotKind[]} plots
 * @param {GroupKind} kind
 * @returns {number[][]}
 */
export function completedGroups(plots, kind) {
	return groupsOf(kind).filter((group) =>
		group.every((index) => plots[index] !== 'empty')
	);
}

/**
 * The rectangle a group covers, in plots.
 * @param {readonly number[]} group
 * @returns {Bounds}
 */
export function groupBounds(group) {
	const rows = group.map((index) => Math.floor(index / GRID_SIZE));
	const cols = group.map((index) => index % GRID_SIZE);
	const row = Math.min(...rows);
	const col = Math.min(...cols);
	return {
		row,
		col,
		rows: Math.max(...rows) - row + 1,
		cols: Math.max(...cols) - col + 1,
	};
}
