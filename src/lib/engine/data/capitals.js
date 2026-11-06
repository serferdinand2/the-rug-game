// The capital city mats: the 6 basic mats with their starting territories (R1; 01 §2.2–2.3, §6.2), and the 6
// Arts & Architecture advanced mats with their own districts and rules (R49–R52; 03 §2 "Advanced capital city mats", #36).
import { deepFreeze } from './ids.js';

/**
 * A capital city mat, basic or advanced.
 * @typedef {Object} CapitalMat
 * @property {number} number - As printed: 1–6 basic, 7–12 Arts & Architecture (R49)
 * @property {string} id - The catalog slug, such as 'mountain'
 * @property {string} name
 * @property {readonly string[]} grid - The rows, top first, as in 01 §6.2 and 03 §2: '1' is impassable, '0' is open, 'C'
 * a cactus and 'L' a lily pad (both open plots)
 * @property {'aa'} [expansion] - The expansion of an advanced mat
 * @property {readonly string[]} [districts] - One character per plot, row by row: the district it belongs to, or '.' for
 * none (the Archipelago's water). Districts are ordered by their characters. Without it, the nine 3×3 squares.
 * @property {readonly number[]} [rowValues] - VP for each complete row, top first; 1 each without it (R51)
 * @property {number} [columnValue] - VP for each complete column; 1 without it (R51)
 * @property {boolean} [landmarksInside] - Landmarks may not hang off the edge (the Mesa)
 * @property {boolean} [gated] - A district's plots open once the district above is complete (the Cavern)
 * @property {number} [cloudMoves] - Income buildings that may move between districts at the start of income turns 2–5
 * (Cloud City)
 * @property {number} [lilyPenalty] - VP lost per lily pad still showing at the start of income turn 5 (the Swamp, R52)
 */

/**
 * A basic mat, which also sets where its player starts.
 * @typedef {CapitalMat & { start: { large: string, small: string } }} BasicMat
 */

/**
 * The 6 basic mats, in number order. Every mat has 22 impassable plots and 59 buildable ones.
 * Impassable plots can't be built on but count as filled for districts, rows and columns (01 §6.1).
 * @type {readonly BasicMat[]}
 */
export const CAPITAL_MATS = deepFreeze([
	{
		number: 1,
		id: 'mountain',
		name: 'Mountain',
		grid: [
			'000000000',
			'110001110',
			'000111000',
			'000111110',
			'000001100',
			'011100001',
			'001000000',
			'000000010',
			'001000000',
		],
		start: { large: '-3_-3', small: '-2_-2' },
	},
	{
		number: 2,
		id: 'wetland',
		name: 'Wetland',
		grid: [
			'000000001',
			'110000111',
			'000000000',
			'011100110',
			'001100000',
			'111000010',
			'000001100',
			'011000000',
			'000001000',
		],
		start: { large: '-3_0', small: '0_2' },
	},
	{
		number: 3,
		id: 'tropical',
		name: 'Tropical',
		grid: [
			'000010011',
			'000100011',
			'001000001',
			'000000000',
			'010001000',
			'000000000',
			'101101010',
			'011110000',
			'001110000',
		],
		start: { large: '0_3', small: '2_0' },
	},
	{
		number: 4,
		id: 'desert',
		name: 'Desert',
		grid: [
			'000110000',
			'101000000',
			'100000110',
			'000000000',
			'010010011',
			'011000001',
			'011111000',
			'001100000',
			'000001000',
		],
		start: { large: '3_3', small: '0_2' },
	},
	{
		number: 5,
		id: 'grassland',
		name: 'Grassland',
		grid: [
			'000000000',
			'111000010',
			'111100000',
			'000111100',
			'000000111',
			'111000001',
			'001000000',
			'000000100',
			'000001000',
		],
		start: { large: '3_0', small: '2_0' },
	},
	{
		number: 6,
		id: 'forest',
		name: 'Forest',
		grid: [
			'000000000',
			'001100100',
			'000100010',
			'011000001',
			'000100000',
			'001111100',
			'010000100',
			'001000111',
			'000000011',
		],
		start: { large: '0_-3', small: '-2_-2' },
	},
]);

/**
 * With 1–3 players, each player draws one of these pairs of mat numbers and keeps one mat (01 §2.2).
 * The two mats of a pair share a starting territory on the small map.
 * @type {readonly (readonly [number, number])[]}
 */
export const SMALL_MAP_PAIRS = deepFreeze([
	[1, 6],
	[2, 4],
	[3, 5],
]);

/**
 * The 6 Arts & Architecture advanced mats, in number order (03 §2; R49). Each player draws one beside their basic mat(s)
 * and keeps one mat (03 §2.2). The layouts are #132's art layouts too, which a test keeps equal.
 * @type {readonly CapitalMat[]}
 */
export const ADVANCED_MATS = deepFreeze([
	{
		number: 7,
		id: 'archipelago',
		name: 'Archipelago',
		expansion: 'aa',
		// 41 water plots and 3 volcanoes, at (4,3), (5,3) and (9,2) on islands E and H.
		grid: [
			'001001100',
			'001000110',
			'001000010',
			'111110111',
			'010111110',
			'010100100',
			'010000100',
			'011100111',
			'110111100',
			'011001000',
			'001001000',
		],
		// The 9 islands are the districts; water belongs to none (R123).
		districts: [
			'AA.BB..CC',
			'AA.BBB..C',
			'AA.BBBB.C',
			'.....B...',
			'D.EE....F',
			'D.EEEE.FF',
			'D.EEEE.FF',
			'D...EE...',
			'..H....II',
			'G.HHH.III',
			'GG.HH.III',
		],
	},
	{
		number: 8,
		id: 'canyon',
		name: 'Canyon',
		expansion: 'aa',
		grid: [
			'001100000',
			'0C11100C0',
			'000011000',
			'000011000',
			'0C00011C0',
			'000001000',
			'000011000',
			'0C01110C0',
			'001100000',
		],
	},
	{
		number: 9,
		id: 'cavern',
		name: 'Cavern',
		expansion: 'aa',
		grid: [
			'110001110',
			'000100100',
			'000100100',
			'000100000',
			'001100000',
			'001110000',
			'000000000',
			'000010000',
			'000111100',
		],
		rowValues: [2, 2, 2, 2, 2, 2, 3, 3, 3],
		columnValue: 0,
		gated: true,
	},
	{
		number: 10,
		id: 'cloud-city',
		name: 'Cloud City',
		expansion: 'aa',
		grid: [
			'000000100',
			'000000001',
			'010000001',
			'110000011',
			'000000000',
			'000001100',
			'111000011',
			'100010010',
			'100111000',
		],
		// The 9 clouds are the districts, whatever their colour (03 §2 Cloud City).
		districts: [
			'111222233',
			'111222333',
			'114442335',
			'664445555',
			'664445555',
			'666667788',
			'666977788',
			'999977788',
			'999997888',
		],
		cloudMoves: 2,
	},
	{
		number: 11,
		id: 'mesa',
		name: 'Mesa',
		expansion: 'aa',
		grid: [
			'011111111',
			'000000011',
			'000000001',
			'000000000',
			'000000000',
			'000000000',
			'000000000',
			'111000000',
			'111111110',
		],
		landmarksInside: true,
	},
	{
		number: 12,
		id: 'swamp',
		name: 'Swamp',
		expansion: 'aa',
		grid: [
			'11L000000',
			'1000L1100',
			'00000001L',
			'001000011',
			'000110000',
			'000110000',
			'0L111L000',
			'0000010L0',
			'000001000',
		],
		lilyPenalty: 2,
	},
]);

/**
 * Any mat by its printed number, basic or advanced.
 * @param {number} number
 * @returns {CapitalMat}
 */
export function capitalMat(number) {
	const mat = [...CAPITAL_MATS, ...ADVANCED_MATS].find(
		(m) => m.number === number
	);
	if (!mat) {
		throw new Error(`There is no capital mat ${number}.`);
	}
	return mat;
}

/**
 * The advanced mats a table deals from: Arts & Architecture's with it on, none without.
 * @param {readonly string[]} expansions
 * @returns {number[]}
 */
export function advancedMatsFor(expansions) {
	return ADVANCED_MATS.filter(
		(m) => m.expansion !== undefined && expansions.includes(m.expansion)
	).map((m) => m.number);
}

/**
 * A mat's shape: its rows, its columns and its districts as plot indices (row × columns + column), in order.
 * @param {CapitalMat} mat
 * @returns {import('../../capital.js').Shape}
 */
export function matShape(mat) {
	const rows = mat.grid.length;
	const cols = mat.grid[0].length;
	const map = mat.districts;
	if (!map) {
		return {
			rows,
			cols,
			districts: [...Array(9).keys()].map((d) => {
				const top = Math.floor(d / 3) * 3;
				const left = (d % 3) * 3;
				return [...Array(9).keys()].map(
					(n) => (top + Math.floor(n / 3)) * cols + left + (n % 3)
				);
			}),
		};
	}
	const ids = [...new Set(map.join('').replaceAll('.', ''))].sort();
	return {
		rows,
		cols,
		districts: ids.map((id) =>
			map.flatMap((line, row) =>
				[...line].flatMap((ch, col) =>
					ch === id ? [row * cols + col] : []
				)
			)
		),
	};
}

/**
 * The impassable plots of a mat, as plot indices in its row-by-row order.
 * @param {CapitalMat} mat
 * @returns {number[]} Ascending plot indices.
 */
export function impassablePlots(mat) {
	const cols = mat.grid[0].length;
	return mat.grid.flatMap((line, row) =>
		[...line].flatMap((ch, col) => (ch === '1' ? [row * cols + col] : []))
	);
}
