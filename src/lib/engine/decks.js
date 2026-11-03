// The card lists, read from the asset catalog: civilizations, tech cards and tapestry cards, with the expansions' (#33).
import { ASSETS } from '../art/catalog.js';

/**
 * The slugs of a group's base-game assets.
 * @param {string} group
 * @returns {string[]}
 */
function baseSlugs(group) {
	return slugsOf(group, 'base');
}

/**
 * The slugs of a group's assets from one expansion, in catalog order.
 * @param {string} group
 * @param {string} expansion
 * @returns {string[]}
 */
function slugsOf(group, expansion) {
	return ASSETS.filter(
		(asset) => asset.group === group && asset.expansion === expansion
	).map((asset) => asset.id.slice(group.length + 1));
}

/** The 16 base civilizations. @type {readonly string[]} */
export const BASE_CIVS = Object.freeze(baseSlugs('civ'));

/**
 * The Plans & Ploys civilizations, in the order built; each civilization's task appends its id (#33). The Islanders
 * came last (#165, R115).
 * @type {readonly string[]}
 */
export const PP_CIVS = Object.freeze([
	'riverfolk',
	'recyclers',
	'aliens',
	'treasure-hunters',
	'tinkerers',
	'spies',
	'utilitarians',
	'infiltrators',
	'advisors',
	'islanders',
]);

/**
 * The civilizations a game with these expansions deals from: the base 16, then Plans & Ploys' built ones (#33). With
 * the variant "All civilizations from Plans & Ploys" the deck is the Plans & Ploys ones only.
 * @param {readonly string[]} expansions
 * @param {readonly string[]} [variants] - The table's variants
 * @returns {string[]}
 */
export function civsFor(expansions, variants = []) {
	if (expansions.includes('pp') && variants.includes('civs-from-pp')) {
		return [...PP_CIVS];
	}
	return [...BASE_CIVS, ...(expansions.includes('pp') ? PP_CIVS : [])];
}

/** The 33 base tech cards. @type {readonly string[]} */
export const BASE_TECH = Object.freeze(baseSlugs('tech'));

/** The tech cards the no-radio-battery variant leaves out (03 FF.2.6, 02 §4). */
const LEFT_OUT_TECH = ['radio', 'lithium-ion-battery'];

/**
 * The tech cards a game with these variants plays with, in BASE_TECH order (#53 design §4.4).
 * @param {readonly string[]} variants
 * @returns {string[]}
 */
export function techDeck(variants) {
	return variants.includes('no-radio-battery')
		? BASE_TECH.filter((card) => !LEFT_OUT_TECH.includes(card))
		: [...BASE_TECH];
}

/** The 50 base tapestry cards: the 43 different cards, then 7 traps (`trap-1` to `trap-7`). @type {readonly string[]} */
export const BASE_TAPESTRY = Object.freeze([
	...baseSlugs('tapestry').filter((slug) => slug !== 'trap'),
	...Array.from({ length: 7 }, (_, i) => `trap-${i + 1}`),
]);

/**
 * The tapestry cards a game with these expansions plays with: the base 50, then Plans & Ploys' 13 (R43 and R44 leave
 * out the other two; the catalog lists only these), in catalog order (#33).
 * @param {readonly string[]} expansions
 * @returns {string[]}
 */
export function tapestryFor(expansions) {
	return [
		...BASE_TAPESTRY,
		...(expansions.includes('pp') ? slugsOf('tapestry', 'pp') : []),
	];
}
