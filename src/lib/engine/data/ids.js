// The ids the rules data shares: versions, tracks, resources, income buildings and terrains, and the helpers that build frozen data.
// The strings match src/lib/ui.js and src/lib/art/catalog.js, so the interface and the art look things up by the same id.

/** @typedef {'original' | 'current'} VersionId */
/** @typedef {'exploration' | 'science' | 'technology' | 'military'} TrackId */
/** @typedef {'coin' | 'worker' | 'food' | 'culture'} ResourceId */
/** @typedef {'market' | 'house' | 'farm' | 'armory'} BuildingId */
/** @typedef {'sea' | 'desert' | 'forest' | 'grassland' | 'mountain'} TerrainId */

/**
 * One step of a tiebreak chain, tried in order until one player is ahead:
 * most VP, the tallest landmark in the capital city (R11–R13), then most resources left.
 * A tie after the last step is a shared victory.
 * @typedef {'vp' | 'tallestLandmark' | 'resources'} TiebreakStep
 */

/**
 * A rules version a table can play.
 * @typedef {Object} Version
 * @property {VersionId} id
 * @property {string} name
 * @property {TiebreakStep[]} tiebreak - The tiebreak chain (R10, R11)
 */

/**
 * Freezes a value and everything inside it, so no engine code can change the game data by accident.
 * @template T
 * @param {T} value
 * @returns {T}
 */
export function deepFreeze(value) {
	if (value && typeof value === 'object' && !Object.isFrozen(value)) {
		Object.freeze(value);
		for (const inner of Object.values(value)) {
			deepFreeze(inner);
		}
	}
	return value;
}

/**
 * The two rules versions. The base board data is the same in both (R1, R5);
 * only the tiebreak differs.
 * @type {readonly Version[]}
 */
export const VERSIONS = deepFreeze([
	// R10: the 2019 rulebook.
	{
		id: 'original',
		name: 'Original 2019 printing',
		tiebreak: ['vp', 'resources'],
	},
	// R11: the tallest landmark comes in second, and the replaced resource step stays as the third.
	{
		id: 'current',
		name: 'Current official rules',
		tiebreak: ['vp', 'tallestLandmark', 'resources'],
	},
]);

/** The four tracks, in board order. @type {readonly TrackId[]} */
export const TRACK_IDS = deepFreeze([
	'exploration',
	'science',
	'technology',
	'military',
]);

/** The four resources (01 §1.2). @type {readonly ResourceId[]} */
export const RESOURCE_IDS = deepFreeze(['coin', 'worker', 'food', 'culture']);

/** The four income buildings, in the income mat's row order (01 §5). @type {readonly BuildingId[]} */
export const BUILDING_IDS = deepFreeze(['market', 'house', 'farm', 'armory']);

/** The map's terrains (01 §7.1). @type {readonly TerrainId[]} */
export const TERRAIN_IDS = deepFreeze([
	'sea',
	'desert',
	'forest',
	'grassland',
	'mountain',
]);

/** @type {Readonly<Record<string, TerrainId>>} */
const TERRAIN_LETTERS = Object.freeze({
	S: 'sea',
	D: 'desert',
	F: 'forest',
	G: 'grassland',
	M: 'mountain',
});

/**
 * Reads terrains written with the research's letters (01 Appendix A and B): S, D, F, G and M.
 * @param {string} letters - Comma-separated, such as 'S,M,M,D,D,S'
 * @returns {TerrainId[]}
 */
export function terrainsFrom(letters) {
	return letters.split(',').map((letter) => {
		const terrain = TERRAIN_LETTERS[letter.trim()];
		if (!terrain) {
			throw new RangeError(`unknown terrain letter ${letter}`);
		}
		return terrain;
	});
}
