// The 33 base tech cards: the circle and square benefits and the top-row prerequisite (02 §4, R18).
import { deepFreeze } from './ids.js';

/** @typedef {import('./ids.js').TrackId} TrackId */
/** @typedef {import('./effects.js').Effect} Effect */

/**
 * What a card needs before it goes to the top row: you or a neighbour is in or beyond a track tier, or has uncovered an income-mat innovation (R18).
 * @typedef {{ track: TrackId, tier: 2 | 3 | 4 } | { innovation: string }} TechRequirement
 */

/**
 * A tech card.
 * @typedef {Object} TechCard
 * @property {string} id - The slug the asset catalog uses, such as 'air-conditioning'
 * @property {string} name
 * @property {Effect[]} circle - Gained when the card moves from the bottom row to the middle row
 * @property {Effect[]} square - Gained when the card moves from the middle row to the top row
 * @property {TechRequirement} requires - The top-row prerequisite
 * @property {string} [landmark] - The landmark the square places, on the landmark cards
 */

/** @param {TrackId} track @param {2 | 3 | 4} tier @returns {TechRequirement} */
const tier = (track, tier) => ({ track, tier });

/** @param {string} innovation @returns {TechRequirement} */
const innovation = (innovation) => ({ innovation });

/** @param {TrackId} track @returns {Effect[]} */
const advanceX = (track) => [{ advance: { tracks: [track], noBenefit: true } }];

/** @param {TrackId} track @returns {Effect[]} */
const perSpace = (track) => [{ vp: { per: 'trackSpace', track } }];

/**
 * A landmark card: 4 VP-style circle, and the square places its landmark.
 * @param {string} id @param {string} name @param {number} vp @param {string} need
 * @returns {TechCard}
 */
const landmarkCard = (id, name, vp, need) => ({
	id,
	name,
	circle: [{ vp }],
	square: [{ landmark: id }],
	requires: innovation(need),
	landmark: id,
});

/**
 * The 33 cards in BASE_TECH order (alphabetical).
 * @type {readonly TechCard[]}
 */
export const TECH_CARDS = deepFreeze(
	/** @type {TechCard[]} */ ([
		{
			id: 'air-conditioning',
			name: 'Air Conditioning',
			circle: [{ gain: { worker: 1 } }],
			square: [{ building: 'house' }],
			requires: tier('technology', 2),
		},
		{
			id: 'ammonia',
			name: 'Ammonia',
			circle: [{ building: 'farm' }],
			square: [{ vp: { per: 'farm' } }],
			requires: tier('military', 3),
		},
		{
			id: 'anesthesia',
			name: 'Anesthesia',
			circle: [{ building: 'armory' }],
			square: [{ vp: { per: 'armory' } }],
			requires: tier('science', 2),
		},
		{
			id: 'assembly-line',
			name: 'Assembly Line',
			circle: [{ techBenefit: { icon: 'square' } }],
			square: [{ techBenefit: { icon: 'circle' } }],
			requires: tier('exploration', 3),
		},
		landmarkCard('bakery', 'Bakery', 4, 'farming'),
		landmarkCard('barn', 'Barn', 3, 'breeding'),
		{
			id: 'calendar',
			name: 'Calendar',
			circle: [{ gain: { culture: 1 } }],
			square: [{ vp: 7 }],
			requires: tier('exploration', 2),
		},
		{
			id: 'canned-food',
			name: 'Canned Food',
			circle: [{ gain: { food: 1 } }],
			square: [{ vp: 7 }],
			requires: tier('military', 2),
		},
		{
			id: 'clocks',
			name: 'Clocks',
			circle: advanceX('technology'),
			square: perSpace('technology'),
			requires: tier('technology', 2),
		},
		landmarkCard('com-tower', 'Com Tower', 5, 'telephone'),
		{
			id: 'compass',
			name: 'Compass',
			circle: [{ gain: { territory: 2 } }],
			square: [{ explore: {} }],
			requires: tier('technology', 2),
		},
		{
			id: 'concrete',
			name: 'Concrete',
			circle: [{ building: 'market' }],
			square: [{ vp: { per: 'market' } }],
			requires: tier('exploration', 2),
		},
		{
			id: 'dynamite',
			name: 'Dynamite',
			circle: [{ conquer: {} }],
			square: [{ vp: { per: 'territory' } }],
			requires: tier('military', 2),
		},
		{
			id: 'eyeglasses',
			name: 'Eyeglasses',
			circle: [{ invent: {} }],
			square: [{ vp: { per: 'techCard' } }],
			requires: tier('technology', 2),
		},
		{
			id: 'irrigation',
			name: 'Irrigation',
			circle: [{ gain: { food: 1 } }],
			square: [{ building: 'farm' }],
			requires: tier('science', 2),
		},
		landmarkCard('library', 'Library', 3, 'writing'),
		{
			id: 'light-bulb',
			name: 'Light Bulb',
			circle: [{ gain: { coin: 1 } }],
			square: [{ building: 'market' }],
			requires: tier('military', 2),
		},
		{
			id: 'lithium-ion-battery',
			name: 'Lithium-Ion Battery',
			circle: [{ vp: 4 }],
			square: [{ repeat: { oncePerTurn: true } }],
			requires: tier('exploration', 4),
		},
		{
			id: 'paper',
			name: 'Paper',
			circle: [{ building: 'house' }],
			square: [{ vp: { per: 'house' } }],
			requires: tier('science', 2),
		},
		{
			id: 'penicillin',
			name: 'Penicillin',
			circle: [{ research: { noBenefit: true } }],
			square: [{ vp: 5 }],
			requires: tier('science', 2),
		},
		{
			id: 'printing-press',
			name: 'Printing Press',
			circle: [{ gain: { tapestry: 1 } }],
			square: [{ tapestryOnTop: {} }],
			requires: tier('technology', 2),
		},
		{
			id: 'radio',
			name: 'Radio',
			circle: [{ vp: 3 }],
			square: [{ gainCiv: {} }],
			requires: tier('science', 4),
		},
		{
			id: 'sewage-plumbing',
			name: 'Sewage & Plumbing',
			circle: [{ gain: { culture: 1 } }],
			square: [{ building: 'armory' }],
			requires: tier('technology', 2),
		},
		{
			id: 'siegecraft',
			name: 'Siegecraft',
			circle: advanceX('military'),
			square: perSpace('military'),
			requires: tier('military', 2),
		},
		landmarkCard('stock-market', 'Stock Market', 5, 'banking'),
		{
			id: 'telescope',
			name: 'Telescope',
			circle: [{ gain: { culture: 1, territory: 1 } }],
			square: [{ vp: { per: 'territoryTile' } }],
			requires: tier('technology', 2),
		},
		{
			id: 'the-nail',
			name: 'The Nail',
			circle: [{ gain: { tapestry: 1 } }],
			square: [
				{
					choice: [
						[{ building: 'market' }],
						[{ building: 'house' }],
						[{ building: 'farm' }],
					],
				},
			],
			requires: tier('technology', 2),
		},
		{
			id: 'time-travel',
			name: 'Time Travel',
			circle: [{ gain: { coin: 1 } }],
			square: [
				{
					regress: {
						tracks: ['exploration', 'military'],
						noBenefit: true,
					},
				},
			],
			requires: tier('technology', 4),
		},
		{
			id: 'transistors',
			name: 'Transistors',
			circle: [{ gain: { coin: 1 } }],
			square: [{ gain: { culture: 1 } }, { vp: 4 }],
			requires: tier('military', 4),
		},
		landmarkCard('treasury', 'Treasury', 4, 'currency'),
		{
			id: 'vaccines',
			name: 'Vaccines',
			circle: advanceX('science'),
			square: perSpace('science'),
			requires: tier('science', 2),
		},
		{
			id: 'warships',
			name: 'Warships',
			circle: [{ gain: { worker: 1 } }],
			square: [{ conquer: {} }],
			requires: tier('exploration', 3),
		},
		{
			id: 'zeppelins',
			name: 'Zeppelins',
			circle: advanceX('exploration'),
			square: perSpace('exploration'),
			requires: tier('exploration', 2),
		},
	])
);

/**
 * A tech card by id.
 * @param {string} id
 * @returns {TechCard}
 */
export function techCard(id) {
	const card = TECH_CARDS.find((c) => c.id === id);
	if (!card) {
		throw new Error(`no tech card ${id}`);
	}
	return card;
}
