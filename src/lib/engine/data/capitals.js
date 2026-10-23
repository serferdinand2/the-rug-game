// The 6 basic capital city mats: their impassable plots, names and starting territories (R1; 01 §2.2–2.3, §6.2).
import { GRID_SIZE, plotIndex } from '../../capital.js';
import { deepFreeze } from './ids.js';

/**
 * A basic capital city mat.
 * @typedef {Object} CapitalMat
 * @property {number} number - 1–6, as printed; it sets the starting territory
 * @property {string} id - The catalog slug, such as 'mountain'
 * @property {string} name
 * @property {readonly string[]} grid - 9 rows, top first, as in 01 §6.2: '1' is impassable, '0' is open
 * @property {{ large: string, small: string }} start - The starting territory's hex on each map
 */

/**
 * The 6 basic mats, in number order. Every mat has 22 impassable plots and 59 buildable ones.
 * Impassable plots can't be built on but count as filled for districts, rows and columns (01 §6.1).
 * @type {readonly CapitalMat[]}
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
 * The impassable plots of a mat, as plot indices in the capital grid's row-by-row order.
 * @param {CapitalMat} mat
 * @returns {number[]} Ascending plot indices.
 */
export function impassablePlots(mat) {
	/** @type {number[]} */
	const plots = [];
	for (let row = 0; row < GRID_SIZE; row++) {
		for (let col = 0; col < GRID_SIZE; col++) {
			if (mat.grid[row][col] === '1') {
				plots.push(plotIndex(row, col));
			}
		}
	}
	return plots;
}
