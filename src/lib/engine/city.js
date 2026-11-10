// The capital city: what each plot shows, where a building or landmark may go, and which districts and lines are complete (R13-R15).
// Each seat's mat sets its shape: its rows, columns and districts (#36).
import {
	plotIndex,
	plotPosition,
	rotateFootprint,
	groupsOf,
} from '../capital.js';
import { FOOTPRINTS } from '../art/footprints.js';
import { capitalMat, impassablePlots, matShape } from './data/capitals.js';
import { BUILDING_IDS } from './data/ids.js';

/** @typedef {import('../capital.js').PlotKind} PlotKind */
/** @typedef {import('../capital.js').Shape} Shape */
/** @typedef {import('./state.js').PlayerSeat} PlayerSeat */
/** @typedef {import('./data/ids.js').BuildingId} BuildingId */
/** @typedef {import('./data/capitals.js').CapitalMat} CapitalMat */
/** @typedef {{ building: BuildingId, row: number, col: number }} PlacedBuilding */
/** @typedef {{ landmark: string, row: number, col: number, rotation: number }} PlacedLandmark */
/** @typedef {{ row: number, col: number }} Cell - May be off the grid. */

/**
 * A seat's capital mat.
 * @param {PlayerSeat} seat
 * @returns {CapitalMat}
 */
export function seatMat(seat) {
	const number = seat.capital.mat;
	if (number === null) {
		throw new Error('This seat has no capital mat yet.');
	}
	return capitalMat(number);
}

/**
 * A seat's capital shape: its mat's rows, columns and districts.
 * @param {PlayerSeat} seat
 * @returns {Shape}
 */
export function seatShape(seat) {
	return matShape(seatMat(seat));
}

/**
 * What each plot shows before the mat's printed features are read: the impassable plots, the cubes and the pieces.
 * @param {PlayerSeat} seat
 * @param {Shape} shape
 * @returns {PlotKind[]}
 */
function piecePlots(seat, shape) {
	/** @type {PlotKind[]} */
	const plots = Array(shape.rows * shape.cols).fill('empty');
	for (const index of [
		...impassablePlots(seatMat(seat)),
		...seat.capital.cubes,
	]) {
		plots[index] = 'blocked';
	}
	for (const b of seat.capital.buildings) {
		plots[plotIndex(b.row, b.col, shape)] = b.building;
	}
	for (const piece of seat.capital.landmarks) {
		for (const { row, col } of landmarkCells(piece)) {
			if (onGrid(row, col, shape)) {
				plots[plotIndex(row, col, shape)] = 'landmark';
			}
		}
	}
	// F&F's player tokens fill their plots, but are neither buildings nor landmarks (R78, #40).
	for (const { row, col } of seat.capital.tokens ?? []) {
		plots[plotIndex(row, col, shape)] = 'token';
	}
	return plots;
}

/**
 * The Canyon's cacti whose 8 neighbours are all filled, by buildings, landmarks, impassable plots or cubes: each counts
 * as filled and becomes impassable (03 §2 Canyon; R122). A cactus is never on the edge, so all 8 are on the grid.
 * @param {CapitalMat} mat
 * @param {Shape} shape
 * @param {readonly PlotKind[]} plots - From piecePlots
 * @returns {number[]}
 */
function surroundedCacti(mat, shape, plots) {
	return mat.grid.flatMap((line, row) =>
		[...line].flatMap((symbol, col) => {
			if (symbol !== 'C') {
				return [];
			}
			for (let dy = -1; dy <= 1; dy++) {
				for (let dx = -1; dx <= 1; dx++) {
					if (
						(dy !== 0 || dx !== 0) &&
						plots[plotIndex(row + dy, col + dx, shape)] === 'empty'
					) {
						return [];
					}
				}
			}
			return [plotIndex(row, col, shape)];
		})
	);
}

/**
 * The impassable plots of a seat's capital, shown or covered: the mat's, the Architects' cubes and the Canyon's
 * surrounded cacti (03 §2.12: the Riverfolk count those too).
 * @param {PlayerSeat} seat
 * @returns {number[]}
 */
export function seatImpassable(seat) {
	const mat = seatMat(seat);
	const shape = matShape(mat);
	return [
		...impassablePlots(mat),
		...seat.capital.cubes,
		...surroundedCacti(mat, shape, piecePlots(seat, shape)),
	];
}

/**
 * Whether a plot is on the capital grid; a landmark may hang over its edge (R106).
 * @param {number} row
 * @param {number} col
 * @param {Shape} shape
 * @returns {boolean}
 */
export function onGrid(row, col, shape) {
	return row >= 0 && row < shape.rows && col >= 0 && col < shape.cols;
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
 * What each plot shows, row by row: blocked, a building, a landmark, a lily pad or empty. The Architects' cubes are
 * impassable plots like the mat's, so Terraforming and the Riverfolk may build over them (#20 design §5). A Swamp
 * lily pad still showing is 'lily' (R52), and a surrounded Canyon cactus 'blocked' (R122).
 * @param {PlayerSeat} seat
 * @returns {PlotKind[]}
 */
export function cityPlots(seat) {
	const mat = seatMat(seat);
	const shape = matShape(mat);
	const plots = piecePlots(seat, shape);
	for (const index of surroundedCacti(mat, shape, plots)) {
		if (plots[index] === 'empty') {
			plots[index] = 'blocked';
		}
	}
	mat.grid.forEach((line, row) =>
		[...line].forEach((symbol, col) => {
			const index = plotIndex(row, col, shape);
			if (symbol === 'L' && plots[index] === 'empty') {
				plots[index] = 'lily';
			}
		})
	);
	return plots;
}

/**
 * Whether a piece may cover a plot: an empty one or a lily pad, or an impassable one when the player builds over them.
 * @param {PlotKind} kind
 * @param {boolean} overImpassable
 * @returns {boolean}
 */
function coverable(kind, overImpassable) {
	return (
		kind === 'empty' ||
		kind === 'lily' ||
		(overImpassable && kind === 'blocked')
	);
}

/** The Cavern's rule, as a PlayerError sentence. */
const CAVERN_GATE =
	'In the Cavern, build in a district only once the district above it is complete.';

/**
 * Whether the Cavern lets a piece cover these plots: each in the second or third row of districts needs the district
 * directly above complete once the piece is placed, so a landmark may complete the district above and reach into the
 * one below (03 §2 Cavern, BGG-2793639, BGG-3040953). Other mats have no gate.
 * @param {CapitalMat} mat
 * @param {Shape} shape
 * @param {readonly PlotKind[]} plots
 * @param {readonly number[]} covered - The plots the piece covers on the grid
 * @returns {boolean}
 */
function gateOpen(mat, shape, plots, covered) {
	if (!mat.gated) {
		return true;
	}
	const after = [...plots];
	for (const index of covered) {
		after[index] = 'landmark';
	}
	return covered.every((index) => {
		const district = shape.districts.findIndex((d) => d.includes(index));
		return (
			district < 3 ||
			shape.districts[district - 3].every((p) => after[p] !== 'empty')
		);
	});
}

/**
 * Why a building can't go on a plot, or null when it can.
 * @param {PlayerSeat} seat
 * @param {Cell} at
 * @param {boolean} [overImpassable] - It may cover an impassable plot (placing.js's buildsOverImpassable)
 * @returns {string | null} A PlayerError sentence.
 */
export function buildingProblem(seat, { row, col }, overImpassable = false) {
	const mat = seatMat(seat);
	const shape = matShape(mat);
	if (!onGrid(row, col, shape)) {
		return 'A building must go on a plot of your city.';
	}
	const plots = cityPlots(seat);
	const index = plotIndex(row, col, shape);
	if (!coverable(plots[index], overImpassable)) {
		return "That plot isn't open.";
	}
	return gateOpen(mat, shape, plots, [index]) ? null : CAVERN_GATE;
}

/**
 * Why a landmark can't go there, or null when it can (R14: it may hang off the edge, R15: any of 4 turns).
 * @param {PlayerSeat} seat
 * @param {PlacedLandmark} piece
 * @param {boolean} [overImpassable] - It may cover impassable plots (placing.js's buildsOverImpassable)
 * @returns {string | null} A PlayerError sentence.
 */
export function landmarkProblem(seat, piece, overImpassable = false) {
	const mat = seatMat(seat);
	const shape = matShape(mat);
	const cells = landmarkCells(piece);
	const inside = cells.filter((c) => onGrid(c.row, c.col, shape));
	// City in a Bottle: no landmark goes in the city; it may be set aside instead (FF.6 2.1, #40).
	if (mat.noLandmarks) {
		return `No landmark may go in your ${mat.name}.`;
	}
	if (inside.length === 0) {
		return 'A landmark must cover at least one plot of your city.';
	}
	if (mat.landmarksInside && inside.length < cells.length) {
		return 'On the Mesa, a landmark must lie wholly inside your city.';
	}
	const plots = cityPlots(seat);
	if (
		inside.some(
			(c) =>
				!coverable(
					plots[plotIndex(c.row, c.col, shape)],
					overImpassable
				)
		)
	) {
		return "That plot isn't open.";
	}
	// R106: two landmarks can't share a plot off the grid either.
	const taken = new Set(
		seat.capital.landmarks.flatMap((p) =>
			landmarkCells(p).map((c) => `${c.row},${c.col}`)
		)
	);
	if (cells.some((c) => taken.has(`${c.row},${c.col}`))) {
		return 'Another landmark is already there.';
	}
	const covered = inside.map((c) => plotIndex(c.row, c.col, shape));
	return gateOpen(mat, shape, plots, covered) ? null : CAVERN_GATE;
}

/**
 * The plots a building may go on now, in reading order.
 * @param {PlayerSeat} seat
 * @param {boolean} [overImpassable] - The impassable plots are open too (placing.js's buildsOverImpassable)
 * @returns {Cell[]}
 */
export function buildingSpots(seat, overImpassable = false) {
	const mat = seatMat(seat);
	const shape = matShape(mat);
	const plots = cityPlots(seat);
	return plots.flatMap((kind, index) =>
		coverable(kind, overImpassable) && gateOpen(mat, shape, plots, [index])
			? [plotPosition(index, shape)]
			: []
	);
}

/**
 * Every legal place for a landmark: fully on the grid first, then by rotation, row and column.
 * @param {PlayerSeat} seat
 * @param {string} landmark
 * @param {boolean} [overImpassable] - It may cover impassable plots (placing.js's buildsOverImpassable)
 * @returns {{ row: number, col: number, rotation: number }[]}
 */
export function landmarkSpots(seat, landmark, overImpassable = false) {
	const shape = seatShape(seat);
	/** @type {{ row: number, col: number, rotation: number, inside: boolean }[]} */
	const found = [];
	for (let rotation = 0; rotation < 4; rotation++) {
		const rows = rotateFootprint(FOOTPRINTS[landmark], rotation);
		for (let row = 1 - rows.length; row < shape.rows; row++) {
			for (let col = 1 - rows[0].length; col < shape.cols; col++) {
				const piece = { landmark, row, col, rotation };
				if (landmarkProblem(seat, piece, overImpassable) === null) {
					found.push({
						row,
						col,
						rotation,
						inside: landmarkCells(piece).every((c) =>
							onGrid(c.row, c.col, shape)
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
 * The Netherworld's imps (in order) whose plot and the centre's are covered and joined by an orthogonal chain of
 * plots holding income buildings or landmarks; impassable plots and overhangs never link (FF.6 2.2, R87, #40).
 * @param {readonly PlotKind[]} plots
 * @param {Shape} shape
 * @param {{ imps: readonly number[], centre: number }} paths
 * @returns {number[]}
 */
function joinedImps(plots, shape, paths) {
	const link = (/** @type {number} */ i) =>
		plots[i] === 'landmark' ||
		/** @type {readonly string[]} */ (BUILDING_IDS).includes(plots[i]);
	if (!link(paths.centre)) {
		return [];
	}
	const reached = new Set([paths.centre]);
	const queue = [paths.centre];
	while (queue.length > 0) {
		const at = /** @type {number} */ (queue.shift());
		const row = Math.floor(at / shape.cols);
		const col = at % shape.cols;
		for (const [r, c] of [
			[row - 1, col],
			[row + 1, col],
			[row, col - 1],
			[row, col + 1],
		]) {
			const next = r * shape.cols + c;
			if (onGrid(r, c, shape) && !reached.has(next) && link(next)) {
				reached.add(next);
				queue.push(next);
			}
		}
	}
	return paths.imps.flatMap((imp, i) => (reached.has(imp) ? [i] : []));
}

/**
 * The districts (in the shape's order) with no empty plot; impassable plots count as filled. The Netherworld's are its
 * imps, each complete once joined to the centre (#40).
 * @param {readonly PlotKind[]} plots
 * @param {Shape} [shape] - The basic mats' without it
 * @returns {number[]}
 */
export function completeDistricts(plots, shape) {
	if (shape?.paths) {
		return joinedImps(plots, shape, shape.paths);
	}
	return groupsOf('districts', shape).flatMap((group, i) =>
		group.every((index) => plots[index] !== 'empty') ? [i] : []
	);
}

/**
 * How many rows and columns have no empty plot.
 * @param {readonly PlotKind[]} plots
 * @param {Shape} [shape] - The basic mats' without it
 * @returns {{ rows: number, columns: number }}
 */
export function completeLines(plots, shape) {
	const full = (/** @type {'rows' | 'columns'} */ kind) =>
		groupsOf(kind, shape).filter((g) =>
			g.every((i) => plots[i] !== 'empty')
		).length;
	return { rows: full('rows'), columns: full('columns') };
}

/**
 * Whether a group of plots holds income buildings of one type only, at least one (Architects). Landmarks, impassable
 * plots and cubes don't count (02 §1.2).
 * @param {PlayerSeat} seat
 * @param {readonly number[]} group - Plot indexes, such as a district's
 * @returns {boolean}
 */
export function uniformGroup(seat, group) {
	const shape = seatShape(seat);
	const types = new Set(
		seat.capital.buildings
			.filter((b) => group.includes(plotIndex(b.row, b.col, shape)))
			.map((b) => b.building)
	);
	return types.size === 1;
}

/**
 * How many complete rows and columns hold income buildings of one type only (Architects).
 * @param {PlayerSeat} seat
 * @returns {number}
 */
export function uniformLines(seat) {
	const shape = seatShape(seat);
	const plots = cityPlots(seat);
	return [...groupsOf('rows', shape), ...groupsOf('columns', shape)].filter(
		(group) =>
			group.every((i) => plots[i] !== 'empty') &&
			uniformGroup(seat, group)
	).length;
}

/**
 * What the capital scores now (01 §6.1; R71): 1 VP for each complete row and column and, for the Architects, 1 more
 * for each of those lines that holds income buildings of one type only (02 §1.2). A seat with no capital mat yet
 * scores nothing. The Cavern scores its own row values and nothing for columns (R51); there the Architects' bonus does
 * nothing, as no line is worth 1 (03 §2 Cavern).
 * @param {PlayerSeat} seat
 * @returns {{ rows: number, columns: number, uniform: number, vp: number }}
 */
export function capitalScore(seat) {
	if (seat.capital.mat === null) {
		return { rows: 0, columns: 0, uniform: 0, vp: 0 };
	}
	const mat = seatMat(seat);
	const shape = matShape(mat);
	const plots = cityPlots(seat);
	const full = groupsOf('rows', shape).map((g) =>
		g.every((i) => plots[i] !== 'empty')
	);
	const { rows, columns } = completeLines(plots, shape);
	const uniform =
		seat.civs.includes('architects') && !mat.rowValues
			? uniformLines(seat)
			: 0;
	const rowVp = full.reduce(
		(sum, done, row) => sum + (done ? (mat.rowValues?.[row] ?? 1) : 0),
		0
	);
	const vp = rowVp + columns * (mat.columnValue ?? 1) + uniform;
	return { rows, columns, uniform, vp };
}
