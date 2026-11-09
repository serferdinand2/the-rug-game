// The card lists, read from the asset catalog: civilizations, tech cards and tapestry cards, with the expansions' (#33).
import { ASSETS } from '../art/catalog.js';
import { artsTrackOn } from './data/tracks.js';
import { TAPESTRY_CARDS } from './data/tapestry-cards.js';

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
export function slugsOf(group, expansion) {
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
 * Arts & Architecture's civilizations, in the order built; each civilization's step appends its id (#37).
 * @type {readonly string[]}
 */
export const AA_CIVS = Object.freeze([
	'relentless',
	'renegades',
	'gamblers',
	'urban-planners',
	'collectors',
]);

/**
 * The civilizations a game with these expansions deals from: the base 16, then Plans & Ploys' built ones (#33), then
 * A&A's (#37). With the variant "All civilizations from Plans & Ploys" the deck is the Plans & Ploys ones only.
 * @param {readonly string[]} expansions
 * @param {readonly string[]} [variants] - The table's variants
 * @returns {string[]}
 */
export function civsFor(expansions, variants = []) {
	if (expansions.includes('pp') && variants.includes('civs-from-pp')) {
		return [...PP_CIVS];
	}
	return [
		...BASE_CIVS,
		...(expansions.includes('pp') ? PP_CIVS : []),
		...(expansions.includes('aa') ? AA_CIVS : []),
	];
}

/** The 33 base tech cards. @type {readonly string[]} */
export const BASE_TECH = Object.freeze(baseSlugs('tech'));

/** Arts & Architecture's 11 tech cards, in catalog order (#37). @type {readonly string[]} */
export const AA_TECH = Object.freeze(slugsOf('tech', 'aa'));

/** Fantasies & Futures' 12 tech cards, in catalog order (#39). @type {readonly string[]} */
export const FF_TECH = Object.freeze(slugsOf('tech', 'ff'));

/** The tech cards the no-radio-battery variant leaves out (03 FF.2.6, 02 §4). */
const LEFT_OUT_TECH = ['radio', 'lithium-ion-battery'];

/** A&A's tech cards that name the arts track, left out without it (R124). */
const ARTS_TECH = ['microphone', 'oil-paint', 'opera', 'public-art'];

/**
 * The tech cards a game with these expansions and variants plays with: BASE_TECH, then A&A's (#37), then F&F's (#39),
 * in that order (#53 design §4.4). Without the arts track, A&A's cards that name it are left out (R124); F&F's stay,
 * offering only their other track (#39 design §9).
 * @param {readonly string[]} expansions
 * @param {readonly string[]} variants
 * @returns {string[]}
 */
export function techDeck(expansions, variants) {
	const aa = expansions.includes('aa')
		? AA_TECH.filter(
				(card) =>
					artsTrackOn(expansions, variants) ||
					!ARTS_TECH.includes(card)
			)
		: [];
	const ff = expansions.includes('ff') ? FF_TECH : [];
	return [...BASE_TECH, ...aa, ...ff].filter(
		(card) =>
			!variants.includes('no-radio-battery') ||
			!LEFT_OUT_TECH.includes(card)
	);
}

/** The 50 base tapestry cards: the 43 different cards, then 7 traps (`trap-1` to `trap-7`). @type {readonly string[]} */
export const BASE_TAPESTRY = Object.freeze([
	...baseSlugs('tapestry').filter((slug) => slug !== 'trap'),
	...Array.from({ length: 7 }, (_, i) => `trap-${i + 1}`),
]);

/** A&A's tapestry cards with the arts icon, left out without the arts track (R124). */
const ARTS_TAPESTRY = [
	'artistic-inspiration',
	'found-art',
	'government-grants',
	'granges',
	'silk-road',
	'steam',
];

/**
 * The tapestry cards a game with these expansions plays with: the base 50, then Plans & Ploys' 13 (R43 and R44 leave
 * out the other two; the catalog lists only these), then A&A's built ones (#37), each in catalog order (#33). Without
 * the arts track, A&A's cards with the arts icon are left out (R124).
 * @param {readonly string[]} expansions
 * @param {readonly string[]} [variants]
 * @returns {string[]}
 */
export function tapestryFor(expansions, variants = []) {
	const arts = artsTrackOn(expansions, variants);
	return [
		...BASE_TAPESTRY,
		...(expansions.includes('pp') ? slugsOf('tapestry', 'pp') : []),
		...(expansions.includes('aa')
			? slugsOf('tapestry', 'aa').filter(
					(id) =>
						TAPESTRY_CARDS.some((card) => card.id === id) &&
						(arts || !ARTS_TAPESTRY.includes(id))
				)
			: []),
	];
}
