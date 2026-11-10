// The Capital tab (#27 design §2.1): a seat's capital as CapitalGrid draws it, from the game view.
import { cityPlots, completeLines, completeDistricts } from '../engine/game.js';
import {
	ADVANCED_MATS,
	CAPITAL_MATS,
	IMPASSABLE,
	matShape,
} from '../engine/data/capitals.js';
import { FOOTPRINTS } from '../art/footprints.js';
import { BUILDING_IDS } from '../engine/data/ids.js';
import { buildingName, landmarkName } from '../game-names.js';

/**
 * What the Capital tab draws.
 * @typedef {Object} CapitalView
 * @property {number} mat - The mat's number, 1–12
 * @property {string} name - The mat's name, such as 'Mountain', for the heading
 * @property {import('../ui.js').CapitalBiome} biome - The terrain the grid is drawn on, which is the mat's id
 * @property {import('../capital.js').Shape} shape - The mat's rows, columns and districts (#36)
 * @property {number} terrainSeed - From the table code, so every viewer sees the same tiles
 * @property {import('../capital.js').PlotKind[]} plots - Every plot, row by row, as the engine sees them
 * @property {import('../components/player/CapitalGrid.svelte').CapitalGridPiece[]} pieces - The landmarks, locked; one may hang over the edge (R106)
 * @property {{ rows: number, columns: number, districts: number }} counts - The complete rows, columns and districts
 * @property {string[]} besideMat - The names of the buildings and landmarks that didn't fit, in order
 * @property {import('../components/player/CapitalGrid.svelte').CapitalGridToken[]} [tokens] - Players' tokens on plots:
 *   Dream Monitors' and the Weefolk's (F&F, #40)
 */

/**
 * Any mat by its number, basic or advanced, or undefined.
 * @param {unknown} number
 * @returns {import('../engine/data/capitals.js').CapitalMat | undefined}
 */
function matOf(number) {
	return [...CAPITAL_MATS, ...ADVANCED_MATS].find((m) => m.number === number);
}

/**
 * A seat's capital, or null before a mat is dealt.
 * @param {any} seat - A player seat of the game as view() gives it
 * @param {string} code - The table's code, which seeds the terrain tiles
 * @returns {CapitalView | null}
 */
export function capitalView(seat, code) {
	const mat = matOf(seat.capital.mat);
	if (!mat) {
		return null;
	}
	const shape = matShape(mat);
	const plots = cityPlots(seat);
	const lines = completeLines(plots, shape);
	return {
		mat: mat.number,
		name: mat.name,
		biome: /** @type {import('../ui.js').CapitalBiome} */ (mat.id),
		shape,
		terrainSeed: terrainSeed(code),
		plots,
		pieces: seat.capital.landmarks.map(
			(
				/** @type {import('../engine/city.js').PlacedLandmark} */ piece
			) => ({
				id: piece.landmark,
				name: landmarkName(piece.landmark),
				footprint: FOOTPRINTS[piece.landmark],
				row: piece.row,
				col: piece.col,
				rotation: piece.rotation,
				locked: true,
			})
		),
		counts: {
			rows: lines.rows,
			columns: lines.columns,
			districts: completeDistricts(plots, shape).length,
		},
		tokens: (seat.capital.tokens ?? []).map(
			(/** @type {{ row: number, col: number, seat: number }} */ t) => ({
				row: t.row,
				col: t.col,
				seat: /** @type {import('../ui.js').Seat} */ (t.seat),
			})
		),
		besideMat: seat.besideMat.map((/** @type {string} */ id) =>
			/** @type {readonly string[]} */ (BUILDING_IDS).includes(id)
				? buildingName(id)
				: landmarkName(id)
		),
	};
}

/**
 * The plots of a mat on offer, before anything is built: its impassable plots blocked, a Swamp's lily pads 'lily'
 * (R52), the rest empty (#56, #36).
 * @param {number} number - The mat's number, 1–12
 * @returns {import('../capital.js').PlotKind[]} Every plot, row by row
 * @throws {RangeError} For a number with no mat
 */
export function matPlots(number) {
	const mat = matOf(number);
	if (!mat) {
		throw new RangeError(`There is no capital mat ${number}.`);
	}
	return mat.grid
		.join('')
		.split('')
		.map((plot) =>
			// F&F's unicorns and wisps are impassable too (#40).
			IMPASSABLE.includes(plot)
				? 'blocked'
				: plot === 'L'
					? 'lily'
					: 'empty'
		);
}

/**
 * A positive whole number from the table code (FNV-1a), small enough for capitalTileUrl's 32-bit arithmetic. The
 * Capital tab and the mats on offer use it, so a mat looks the same before and after it is chosen.
 * @param {string} code
 * @returns {number}
 */
export function terrainSeed(code) {
	let hash = 0x811c9dc5;
	for (const char of String(code ?? '')) {
		hash = Math.imul(
			hash ^ /** @type {number} */ (char.codePointAt(0)),
			0x01000193
		);
	}
	return ((hash >>> 0) % 0x7fffffff) + 1;
}
