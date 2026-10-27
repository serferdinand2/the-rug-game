// The Capital tab (#27 design §2.1): a seat's capital as CapitalGrid draws it, from the game view.
import { cityPlots, completeLines, completeDistricts } from '../engine/game.js';
import { CAPITAL_MATS } from '../engine/data/capitals.js';
import { FOOTPRINTS } from '../art/footprints.js';
import { ASSETS } from '../art/catalog.js';

/** The income buildings' names, by id. @type {Readonly<Record<string, string>>} */
const BUILDING_NAMES = Object.freeze({
	market: 'Market',
	house: 'House',
	farm: 'Farm',
	armory: 'Armory',
});

/** All 33 landmarks' names, by id, from the asset catalog, which lists the expansions' too. */
const LANDMARK_NAMES = new Map(
	ASSETS.filter((asset) => asset.group === 'landmark').map((asset) => [
		asset.id.slice('landmark/'.length),
		asset.name,
	])
);

/**
 * What the Capital tab draws.
 * @typedef {Object} CapitalView
 * @property {number} mat - The mat's number, 1–6
 * @property {string} name - The mat's name, such as 'Mountain', for the heading
 * @property {import('../ui.js').CapitalBiome} biome - The terrain the grid is drawn on
 * @property {number} terrainSeed - From the table code, so every viewer sees the same tiles
 * @property {import('../capital.js').PlotKind[]} plots - All 81 plots, row by row, as the engine sees them
 * @property {import('../components/player/CapitalGrid.svelte').CapitalGridPiece[]} pieces - The landmarks, locked; one may hang over the edge (R106)
 * @property {{ rows: number, columns: number, districts: number }} counts - The complete rows, columns and districts
 * @property {string[]} besideMat - The names of the buildings and landmarks that didn't fit, in order
 */

/**
 * A seat's capital, or null before a mat is dealt.
 * @param {any} seat - A player seat of the game as view() gives it
 * @param {string} code - The table's code, which seeds the terrain tiles
 * @returns {CapitalView | null}
 */
export function capitalView(seat, code) {
	const mat = CAPITAL_MATS.find((m) => m.number === seat.capital.mat);
	if (!mat) {
		return null;
	}
	const plots = cityPlots(seat);
	const lines = completeLines(plots);
	return {
		mat: mat.number,
		name: mat.name,
		biome: /** @type {import('../ui.js').CapitalBiome} */ (
			mat.name.toLowerCase()
		),
		terrainSeed: terrainSeed(code),
		plots,
		pieces: seat.capital.landmarks.map(
			(
				/** @type {import('../engine/city.js').PlacedLandmark} */ piece
			) => ({
				id: piece.landmark,
				name: LANDMARK_NAMES.get(piece.landmark) ?? piece.landmark,
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
			districts: completeDistricts(plots).length,
		},
		besideMat: seat.besideMat.map(
			(/** @type {string} */ id) =>
				BUILDING_NAMES[id] ?? LANDMARK_NAMES.get(id) ?? id
		),
	};
}

/**
 * The plots of a mat on offer, before anything is built: its impassable plots blocked, the rest empty (#56).
 * @param {number} number - The mat's number, 1–6
 * @returns {import('../capital.js').PlotKind[]} All 81 plots, row by row
 * @throws {RangeError} For a number with no mat
 */
export function matPlots(number) {
	const mat = CAPITAL_MATS.find((m) => m.number === number);
	if (!mat) {
		throw new RangeError(`There is no capital mat ${number}.`);
	}
	return mat.grid
		.join('')
		.split('')
		.map((plot) => (plot === '1' ? 'blocked' : 'empty'));
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
