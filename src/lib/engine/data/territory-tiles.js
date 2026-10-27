// The 48 territory tiles: each one's corner terrains and the benefit it gives when explored (R4; 01 §7.1, Appendix B).
import { deepFreeze, terrainsFrom } from './ids.js';

/** @typedef {import('./ids.js').TerrainId} TerrainId */
/** @typedef {import('./effects.js').Effect} Effect */

/**
 * A territory tile. A tile written "isl X" in the research is sea at every corner with an island of X in its middle.
 * @typedef {Object} TerritoryTile
 * @property {number} id - 1–48, the catalog's tile number
 * @property {readonly TerrainId[]} corners - The 6 corner terrains, clockwise from the top-left corner, before turning
 * @property {readonly TerrainId[]} island - The terrain of an island in the middle, empty when there is none
 * @property {readonly Effect[]} benefit - Gained when the tile is explored, and through the black die's "?" (R8)
 * @property {boolean} clouds - Its picture shows clouds, which Cloud Colonies scores (R77)
 * @property {boolean} volcano - Its picture shows a volcano, whose smoke is not a cloud (R77)
 */

/** The tiles whose pictures show clouds (R77, read from BGA's tile images). */
const CLOUDS = [
	1, 7, 8, 9, 10, 13, 15, 16, 18, 19, 21, 22, 24, 25, 27, 30, 33, 35, 36, 39,
	40, 42, 43, 44, 45, 48,
];

/** The tile whose picture shows a volcano (R77). */
const VOLCANO = 47;

/** @type {Record<string, Effect[]>} */
const BENEFITS = {
	coin: [{ gain: { coin: 1 } }],
	worker: [{ gain: { worker: 1 } }],
	food: [{ gain: { food: 1 } }],
	culture: [{ gain: { culture: 1 } }],
	tapestry: [{ gain: { tapestry: 1 } }],
	invent: [{ invent: {} }],
	research: [{ research: { noBenefit: true } }],
	'2 tiles': [{ gain: { territory: 2 } }],
	farm: [{ building: 'farm' }],
	house: [{ building: 'house' }],
	market: [{ building: 'market' }],
	armory: [{ building: 'armory' }],
	upgrade: [{ upgrade: {} }],
};

/**
 * A tile from the research's row: its corners in letters, or 'isl X', and its benefit's name.
 * @param {number} id
 * @param {string} terrains - Such as 'S,M,M,D,D,S', or 'isl D'
 * @param {string} benefit - A key of BENEFITS
 * @returns {TerritoryTile}
 */
function tile(id, terrains, benefit) {
	const island = terrains.startsWith('isl ');
	if (!BENEFITS[benefit]) {
		throw new RangeError(`unknown territory tile benefit ${benefit}`);
	}
	return {
		id,
		corners: terrainsFrom(island ? 'S,S,S,S,S,S' : terrains),
		island: island ? terrainsFrom(terrains.slice(4)) : [],
		benefit: BENEFITS[benefit],
		clouds: CLOUDS.includes(id),
		volcano: id === VOLCANO,
	};
}

/**
 * The 48 tiles in id order. Tiles 1–12 pair desert and mountain, 13–24 forest and grassland,
 * 25–36 grassland and desert, and 37–48 forest and mountain.
 * @type {readonly TerritoryTile[]}
 */
export const TERRITORY_TILES = deepFreeze([
	tile(1, 'S,D,S,S,S,S', 'coin'),
	tile(2, 'S,M,M,D,D,S', '2 tiles'),
	tile(3, 'S,M,D,D,S,S', 'food'),
	tile(4, 'S,M,D,S,S,S', 'culture'),
	tile(5, 'isl D', 'food'),
	tile(6, 'S,D,S,S,S,S', 'worker'),
	tile(7, 'isl D', 'coin'),
	tile(8, 'S,M,M,M,D,D', 'farm'),
	tile(9, 'S,M,M,D,D,S', 'tapestry'),
	tile(10, 'S,M,D,D,S,S', 'culture'),
	tile(11, 'S,M,D,S,S,S', 'worker'),
	tile(12, 'S,M,M,M,D,D', 'research'),
	tile(13, 'S,F,S,S,S,S', 'coin'),
	tile(14, 'S,G,F,S,S,S', 'culture'),
	tile(15, 'S,F,S,S,S,S', 'worker'),
	tile(16, 'isl F', 'coin'),
	tile(17, 'isl F', 'food'),
	tile(18, 'S,G,G,G,F,F', 'market'),
	tile(19, 'S,G,G,F,F,S', 'tapestry'),
	tile(20, 'S,G,G,F,S,S', 'culture'),
	tile(21, 'S,G,F,S,S,S', 'worker'),
	tile(22, 'S,G,G,G,F,F', 'upgrade'),
	tile(23, 'S,G,G,F,F,S', 'invent'),
	tile(24, 'S,G,G,F,S,S', 'food'),
	tile(25, 'S,D,D,D,G,G', 'house'),
	tile(26, 'isl G', 'food'),
	tile(27, 'S,G,S,S,S,S', 'worker'),
	tile(28, 'isl G', 'coin'),
	tile(29, 'S,D,D,G,G,S', 'tapestry'),
	tile(30, 'S,D,D,G,S,S', 'culture'),
	tile(31, 'S,D,G,S,S,S', 'worker'),
	tile(32, 'S,D,D,D,G,G', 'invent'),
	tile(33, 'S,D,D,G,G,S', 'armory'),
	tile(34, 'S,D,D,G,S,S', 'food'),
	tile(35, 'S,D,G,S,S,S', 'culture'),
	tile(36, 'S,G,S,S,S,S', 'coin'),
	tile(37, 'S,M,S,S,S,S', 'coin'),
	tile(38, 'S,F,M,S,S,S', 'culture'),
	tile(39, 'S,M,S,S,S,S', 'worker'),
	tile(40, 'isl M', 'coin'),
	tile(41, 'isl M', 'food'),
	tile(42, 'S,F,F,F,M,M', 'invent'),
	tile(43, 'S,F,F,M,M,S', 'tapestry'),
	tile(44, 'S,F,F,M,S,S', 'culture'),
	tile(45, 'S,F,M,S,S,S', 'worker'),
	tile(46, 'S,F,F,F,M,M', 'research'),
	tile(47, 'S,F,F,M,M,S', '2 tiles'),
	tile(48, 'S,F,F,M,S,S', 'food'),
]);
