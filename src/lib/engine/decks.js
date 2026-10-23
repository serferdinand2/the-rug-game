// The base game's card lists, read from the asset catalog: civilizations, tech cards and tapestry cards.
import { ASSETS } from '../art/catalog.js';

/**
 * The slugs of a group's base-game assets.
 * @param {string} group
 * @returns {string[]}
 */
function baseSlugs(group) {
	return ASSETS.filter(
		(asset) => asset.group === group && asset.expansion === 'base'
	).map((asset) => asset.id.slice(group.length + 1));
}

/** The 16 base civilizations. @type {readonly string[]} */
export const BASE_CIVS = Object.freeze(baseSlugs('civ'));

/** The 33 base tech cards. @type {readonly string[]} */
export const BASE_TECH = Object.freeze(baseSlugs('tech'));

/** The 50 base tapestry cards: the 43 different cards, then 7 traps (`trap-1` to `trap-7`). @type {readonly string[]} */
export const BASE_TAPESTRY = Object.freeze([
	...baseSlugs('tapestry').filter((slug) => slug !== 'trap'),
	...Array.from({ length: 7 }, (_, i) => `trap-${i + 1}`),
]);
