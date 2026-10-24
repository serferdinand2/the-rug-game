// The capital city: what each plot shows, where a building or landmark may go, and which districts and lines are complete (R13-R15).
import { GRID_SIZE, plotIndex, rotateFootprint, groupsOf } from '../capital.js';
import { FOOTPRINTS } from '../art/footprints.js';
import { CAPITAL_MATS, impassablePlots } from './data/capitals.js';

/** @typedef {import('../capital.js').PlotKind} PlotKind */
/** @typedef {import('./state.js').PlayerSeat} PlayerSeat */
/** @typedef {import('./data/ids.js').BuildingId} BuildingId */
/** @typedef {{ building: BuildingId, row: number, col: number }} PlacedBuilding */
/** @typedef {{ landmark: string, row: number, col: number, rotation: number }} PlacedLandmark */
/** @typedef {{ row: number, col: number }} Cell - May be off the grid. */

/** @param {number} row @param {number} col */
function onGrid(row, col) {
	return row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE;
}

/**
 * Every plot the turned footprint covers, on and off the grid.
 * @param {PlacedLandmark} piece
 * @returns {Cell[]}
 */
export function landmarkCells(piece) {
	const rows = rotateFootprint(FOOTPRINTS[piece.landmark], piece.rotation);
	return rows.flatMap((line, dy) =>
		[...line].flatMap((x, dx) =>
			x === 'X' ? [{ row: piece.row + dy, col: piece.col + dx }] : []
		)
	);
}

/**
 * What each of the 81 plots shows, row by row: blocked, a building, a landmark or empty.
 * @param {PlayerSeat} seat
 * @returns {PlotKind[]}
 */
export function cityPlots(seat) {
	const number = seat.capital.mat;
	if (number === null) {
		throw new Error('This seat has no capital mat yet.');
	}
	/** @type {PlotKind[]} */
	const plots = Array(GRID_SIZE * GRID_SIZE).fill('empty');
	for (const index of impassablePlots(CAPITAL_MATS[number - 1])) {
		plots[index] = 'blocked';
	}
	for (const b of seat.capital.buildings) {
		plots[plotIndex(b.row, b.col)] = b.building;
	}
	for (const piece of seat.capital.landmarks) {
		for (const { row, col } of landmarkCells(piece)) {
			if (onGrid(row, col)) {
				plots[plotIndex(row, col)] = 'landmark';
			}
		}
	}
	return plots;
}

/**
 * Why a building can't go on a plot, or null when it can.
 * @param {PlayerSeat} seat
 * @param {Cell} at
 * @returns {string | null} A PlayerError sentence.
 */
export function buildingProblem(seat, { row, col }) {
	if (!onGrid(row, col)) {
		return 'A building must go on a plot of your city.';
	}
	return cityPlots(seat)[plotIndex(row, col)] === 'empty'
		? null
		: "That plot isn't open.";
}

/**
 * Why a landmark can't go there, or null when it can (R14: it may hang off the edge, R15: any of 4 turns).
 * @param {PlayerSeat} seat
 * @param {PlacedLandmark} piece
 * @returns {string | null} A PlayerError sentence.
 */
export function landmarkProblem(seat, piece) {
	const cells = landmarkCells(piece);
	const inside = cells.filter((c) => onGrid(c.row, c.col));
	if (inside.length === 0) {
		return 'A landmark must cover at least one plot of your city.';
	}
	const plots = cityPlots(seat);
	if (inside.some((c) => plots[plotIndex(c.row, c.col)] !== 'empty')) {
		return "That plot isn't open.";
	}
	const taken = new Set(
		seat.capital.landmarks.flatMap((p) =>
			landmarkCells(p).map((c) => `${c.row},${c.col}`)
		)
	);
	if (cells.some((c) => taken.has(`${c.row},${c.col}`))) {
		return 'Another landmark is already there.';
	}
	return null;
}

/**
 * The open plots, in reading order.
 * @param {PlayerSeat} seat
 * @returns {Cell[]}
 */
export function buildingSpots(seat) {
	return cityPlots(seat).flatMap((kind, index) =>
		kind === 'empty'
			? [{ row: Math.floor(index / GRID_SIZE), col: index % GRID_SIZE }]
			: []
	);
}

/**
 * Every legal place for a landmark: fully on the grid first, then by rotation, row and column.
 * @param {PlayerSeat} seat
 * @param {string} landmark
 * @returns {{ row: number, col: number, rotation: number }[]}
 */
export function landmarkSpots(seat, landmark) {
	/** @type {{ row: number, col: number, rotation: number, inside: boolean }[]} */
	const found = [];
	for (let rotation = 0; rotation < 4; rotation++) {
		const rows = rotateFootprint(FOOTPRINTS[landmark], rotation);
		for (let row = 1 - rows.length; row < GRID_SIZE; row++) {
			for (let col = 1 - rows[0].length; col < GRID_SIZE; col++) {
				const piece = { landmark, row, col, rotation };
				if (landmarkProblem(seat, piece) === null) {
					found.push({
						row,
						col,
						rotation,
						inside: landmarkCells(piece).every((c) =>
							onGrid(c.row, c.col)
						),
					});
				}
			}
		}
	}
	return found
		.sort((a, b) => Number(b.inside) - Number(a.inside))
		.map(({ row, col, rotation }) => ({ row, col, rotation }));
}

/**
 * The districts (0-8, reading order) with no empty plot; impassable plots count as filled.
 * @param {readonly PlotKind[]} plots
 * @returns {number[]}
 */
export function completeDistricts(plots) {
	return groupsOf('districts').flatMap((group, i) =>
		group.every((index) => plots[index] !== 'empty') ? [i] : []
	);
}

/**
 * How many rows and columns have no empty plot.
 * @param {readonly PlotKind[]} plots
 * @returns {{ rows: number, columns: number }}
 */
export function completeLines(plots) {
	const full = (/** @type {'rows' | 'columns'} */ kind) =>
		groupsOf(kind).filter((g) => g.every((i) => plots[i] !== 'empty'))
			.length;
	return { rows: full('rows'), columns: full('columns') };
}
