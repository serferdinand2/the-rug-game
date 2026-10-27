// Both sides of the map board: every hex, the printed territories with their terrains, and which neighbour each hex side faces (R2, R3).
// Hexes use the BGA axial keys `a_b`, with the middle island at `0_0` (01 §2.3, Appendix A).
import { deepFreeze, terrainsFrom } from './ids.js';

/** @typedef {import('./ids.js').TerrainId} TerrainId */

/**
 * The terrains of a territory: its 6 corners, and an island in its middle.
 * @typedef {Object} Terrains
 * @property {readonly TerrainId[]} corners - The 6 corner terrains, clockwise from the top-left corner, before turning
 * @property {readonly TerrainId[]} island - The terrains of an island in the middle, empty when there is none
 * @property {boolean} [clouds] - Its picture shows clouds (R77); every territory tile and printed territory has it
 * @property {boolean} [volcano] - Its picture shows a volcano (R77); every territory tile and printed territory has it
 */

/**
 * A territory printed on the board.
 * @typedef {Object} PrintedTerritory
 * @property {number} tile - The BGA tile id, 49–77; the same id has the same terrains on both maps
 * @property {number} orient - How far it is turned clockwise, in 60° steps
 * @property {readonly TerrainId[]} corners - As in Terrains
 * @property {readonly TerrainId[]} island - As in Terrains
 * @property {boolean} clouds - Its picture shows clouds, which Cloud Colonies scores (R77)
 * @property {boolean} volcano - Its picture shows a volcano, whose smoke is not a cloud (R77)
 */

/**
 * One side of the map board.
 * @typedef {Object} MapSide
 * @property {'large' | 'small'} id
 * @property {string} name
 * @property {readonly number[]} players - The player counts that use this side
 * @property {readonly string[]} hexes - Every hex on this side
 * @property {Readonly<Record<string, PrintedTerritory>>} printed - The printed territories, by hex; every other hex starts unexplored
 * @property {string} middle - The middle island's hex
 */

/**
 * The terrains of the printed territories, by BGA tile id (01 Appendix A, checked against BGA's material.inc.php).
 * The middle island, 49, is sea at every corner with land of all four terrains in its middle.
 * @type {Readonly<Record<number, Terrains>>}
 */
const PRINTED_TILES = deepFreeze(
	Object.fromEntries(
		/** @type {[number, string, string?][]} */ ([
			[49, 'S,S,S,S,S,S', 'D,F,G,M'],
			[50, 'S,S,S,S,F,S'],
			[51, 'F,S,S,S,F,F'],
			[52, 'M,F,F,F,S,M'],
			[53, 'S,D,M,M,S,S'],
			[54, 'M,M,G,G,M,S'],
			[55, 'G,G,S,S,S,G'],
			[56, 'S,G,S,S,S,S'],
			[57, 'S,S,M,F,F,S'],
			[58, 'G,D,D,S,S,S'],
			[59, 'S,S,S,G,G,D'],
			[60, 'S,D,G,F,D,D'],
			[61, 'M,F,F,M,S,M'],
			[62, 'S,M,M,D,S,S'],
			[63, 'D,G,G,D,S,D'],
			[64, 'S,S,S,S,D,S'],
			[65, 'D,S,S,S,D,D'],
			[66, 'G,D,D,D,S,G'],
			[67, 'S,M,G,G,S,S'],
			[68, 'F,S,S,S,G,G'],
			[69, 'S,F,S,S,S,D'],
			[70, 'M,G,G,S,M,M'],
			[71, 'F,F,D,D,S,D'],
			[72, 'S,M,S,S,S,S'],
			[73, 'S,M,M,M,S,S'],
			[74, 'F,S,S,S,G,F'],
			[75, 'M,G,G,S,M,M'],
			[76, 'S,S,M,F,F,S'],
			[77, 'S,S,S,G,S,S'],
		]).map(([tile, corners, island]) => [
			tile,
			{
				corners: terrainsFrom(corners),
				island: island ? terrainsFrom(island) : [],
			},
		])
	)
);

/**
 * The printed territories of one side, with their terrains filled in from the tile id. Clouds and the volcano belong
 * to the hex's picture, not the tile id: a cloud across a hex line counts only where most of it lies (R77).
 * @param {Record<string, [tile: number, orient: number]>} hexes
 * @param {{ clouds: string[], volcano?: string }} pictures - The hexes whose pictures show clouds, and the volcano's
 * @returns {Record<string, PrintedTerritory>}
 */
function printed(hexes, { clouds, volcano }) {
	return Object.fromEntries(
		Object.entries(hexes).map(([key, [tile, orient]]) => [
			key,
			{
				tile,
				orient,
				...PRINTED_TILES[tile],
				clouds: clouds.includes(key),
				volcano: key === volcano,
			},
		])
	);
}

/**
 * Every hex of a hexagonal board, column by column.
 * @param {number} radius
 * @param {string[]} [missing] - Hexes the board leaves out
 * @returns {string[]}
 */
function hexagon(radius, missing = []) {
	/** @type {string[]} */
	const hexes = [];
	for (let a = -radius; a <= radius; a++) {
		for (let b = -radius; b <= radius; b++) {
			const key = `${a}_${b}`;
			if (Math.abs(a - b) <= radius && !missing.includes(key)) {
				hexes.push(key);
			}
		}
	}
	return hexes;
}

/**
 * Both sides of the board. The orientations are BGA's: on the small map only `0_3` is turned.
 * @type {Readonly<{ large: MapSide, small: MapSide }>}
 */
export const MAPS = deepFreeze({
	// R2: a radius-4 hexagon of 61 hexes, 25 printed and 36 unexplored.
	large: {
		id: 'large',
		name: 'Large map',
		players: [4, 5],
		hexes: hexagon(4),
		printed: printed(
			{
				'0_0': [49, 0],
				// Top left, start 6
				'-1_-4': [50, 0],
				'0_-3': [51, 0],
				'1_-3': [61, 0],
				'0_-2': [62, 0],
				// Bottom left, start 5
				'3_-1': [63, 0],
				'3_0': [55, 5],
				'2_0': [57, 5],
				'4_1': [56, 5],
				// Bottom, start 4
				'2_2': [64, 0],
				'3_3': [65, 0],
				'4_3': [66, 0],
				'3_4': [67, 0],
				// Bottom right, start 3
				'0_2': [68, 0],
				'0_3': [76, 5],
				'1_4': [69, 0],
				'-1_3': [70, 0],
				// Top right, start 2
				'-4_-1': [77, 0],
				'-3_0': [59, 4],
				'-2_0': [58, 4],
				'-3_1': [71, 0],
				// Top, start 1
				'-2_-2': [72, 0],
				'-3_-3': [73, 0],
				'-4_-3': [75, 0],
				'-3_-4': [74, 0],
			},
			{
				// R77: large-map 0_2 and 1_-3 hold the edges of clouds whose most lies in a neighbour, so they don't count.
				clouds: [
					'0_0',
					'-1_-4',
					'0_-3',
					'2_0',
					'4_1',
					'3_3',
					'3_4',
					'0_3',
					'1_4',
					'-4_-1',
					'-3_0',
					'-3_1',
					'-2_-2',
				],
				volcano: '-1_3',
			}
		),
		middle: '0_0',
	},
	// R3: a radius-3 hexagon without three corners, 34 hexes, 13 printed and 21 unexplored.
	small: {
		id: 'small',
		name: 'Small map',
		players: [1, 2, 3],
		hexes: hexagon(3, ['0_-3', '-3_0', '3_3']),
		printed: printed(
			{
				'0_0': [49, 0],
				// Top, start 1/6
				'-3_-3': [50, 0],
				'-2_-2': [51, 0],
				'-1_-2': [52, 0],
				'-2_-1': [53, 0],
				// Bottom left, start 3/5
				'1_-1': [54, 0],
				'2_0': [55, 0],
				'3_0': [56, 0],
				'2_1': [76, 0],
				// Bottom right, start 2/4
				'-1_1': [58, 0],
				'0_2': [59, 0],
				'1_2': [60, 0],
				'0_3': [77, 2],
			},
			{
				// R77: small-map -1_-2 holds the edge of a cloud whose most lies in a neighbour, so it doesn't count.
				clouds: ['0_0', '-3_-3', '-2_-2', '3_0', '2_1', '0_2', '0_3'],
			}
		),
		middle: '0_0',
	},
});

/**
 * The neighbour each side of a hex faces, as [Δa, Δb]. Side i runs from corner i to corner i + 1,
 * and side i + 3 is opposite it. A territory turned by `orient` shows its printed corner k at
 * position k + orient. Read from BGA's getMatchingEdgeCount; #17 uses it to score explores.
 * @type {readonly (readonly [number, number])[]}
 */
export const HEX_SIDES = deepFreeze([
	[-1, -1],
	[-1, 0],
	[0, 1],
	[1, 1],
	[1, 0],
	[0, -1],
]);

/**
 * The six neighbours of a hex, in side order. Some may be off the map.
 * @param {string} key - A hex, such as '2_-1'
 * @returns {string[]}
 */
export function hexNeighbours(key) {
	const [a, b] = key.split('_').map(Number);
	return HEX_SIDES.map(([da, db]) => `${a + da}_${b + db}`);
}
