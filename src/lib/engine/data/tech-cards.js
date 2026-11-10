// The tech cards: the base 33 (02 §4, R18), Arts & Architecture's 11 (03 §2, #37) and Fantasies & Futures' 12 (03 FF.5, #39), with their circle and square benefits and their top-row prerequisite.
import { deepFreeze } from './ids.js';

/** @typedef {import('./ids.js').TrackId} TrackId */
/** @typedef {import('./effects.js').Effect} Effect */

/**
 * What a card needs before it goes to the top row: you or a neighbour is in or beyond a track tier, or has uncovered
 * an income-mat innovation (R18); `selfInOriginal` asks it of you alone in the original version (Oil Paint, R125). A&A
 * adds a landmark on the card itself (`landmark`, 03 §2) and no prerequisite at all (`none`, Suburbs). F&F's cards ask
 * that the player ever played a charmed tapestry card or is on or after income turn 5, neighbours ignored
 * (`charmOrFive`, 03 FF.2.3).
 * @typedef {{ track: TrackId, tier: 2 | 3 | 4, selfInOriginal?: true } | { innovation: string } | { landmark: true } | { none: true } | { charmOrFive: true }} TechRequirement
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
 * @property {true} [singleUse] - The square may be gained once, then the card is flipped (F&F, 03 FF.2.3)
 * @property {'base' | 'aa' | 'ff'} expansion - Where the card comes from (#37, #39)
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
 * A landmark card: circle of 3 to 5 VP, and the square places its landmark.
 * @param {string} id @param {string} name @param {number} vp @param {string} need
 * @returns {Omit<TechCard, 'expansion'>}
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
 * The 33 base cards in BASE_TECH order (alphabetical).
 * @type {Omit<TechCard, 'expansion'>[]}
 */
const BASE_CARDS = [
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
];

/** Advance on a track, with its benefit, and the bonus may be paid: A&A's landmark cards' squares. @param {TrackId} track @returns {Effect[]} */
const advanceOn = (track) => [{ advance: { tracks: [track] } }];

/** A&A's landmark prerequisite: a landmark on this card (03 §2). @type {TechRequirement} */
const LANDMARK_ON_CARD = { landmark: true };

/**
 * Arts & Architecture's 11 cards in AA_TECH order (03 §2's A&A tech table, #37 design §5).
 * @type {Omit<TechCard, 'expansion'>[]}
 */
const AA_CARDS = [
	{
		id: 'astrolabe',
		name: 'Astrolabe',
		circle: [{ gain: { food: 1 } }],
		square: advanceOn('exploration'),
		requires: LANDMARK_ON_CARD,
	},
	{
		id: 'automation',
		name: 'Automation',
		circle: [{ gain: { coin: 1 } }],
		square: advanceOn('technology'),
		requires: LANDMARK_ON_CARD,
	},
	{
		id: 'calculus',
		name: 'Calculus',
		circle: [{ gain: { worker: 1 } }],
		square: advanceOn('science'),
		requires: LANDMARK_ON_CARD,
	},
	{
		id: 'duct-tape',
		name: 'Duct Tape',
		circle: [{ gain: { culture: 1 } }],
		// 1 card twice or 2 cards once each: two upgrades in a row, each ignoring prerequisites (03 §2, the landmark one too).
		square: [{ upgrade: { ignorePrerequisite: true, count: 2 } }],
		requires: tier('science', 3),
	},
	{
		id: 'jet-fuel',
		name: 'Jet Fuel',
		circle: [{ gain: { space: 1 } }],
		square: [{ exploreSpace: {} }],
		requires: tier('science', 3),
	},
	{
		id: 'microphone',
		name: 'Microphone',
		circle: [{ gain: { any: 1 } }],
		square: advanceOn('arts'),
		requires: LANDMARK_ON_CARD,
	},
	{
		id: 'oil-paint',
		name: 'Oil Paint',
		circle: [{ gain: { any: 1 } }],
		square: [{ create: {} }],
		// R125: the first printing lacks the neighbours icon; F&F's replacement card has it.
		requires: { track: 'arts', tier: 2, selfInOriginal: true },
	},
	{
		id: 'opera',
		name: 'Opera',
		circle: advanceX('arts'),
		square: perSpace('arts'),
		requires: tier('arts', 2),
	},
	{
		id: 'public-art',
		name: 'Public Art',
		circle: [{ gain: { tapestry: 1 } }],
		square: [{ inspire: {} }],
		requires: tier('arts', 3),
	},
	{
		id: 'suburbs',
		name: 'Suburbs',
		circle: [{ vp: 4 }],
		square: [{ anyBuilding: {} }],
		requires: { none: true },
	},
	{
		id: 'war-college',
		name: 'War College',
		circle: [{ gain: { culture: 1 } }],
		square: advanceOn('military'),
		requires: LANDMARK_ON_CARD,
	},
];

/** F&F's prerequisite, on all 12 of its cards (03 FF.5). @type {TechRequirement} */
const CHARM_OR_FIVE = { charmOrFive: true };

/**
 * An F&F card that advances on one of two tracks: without benefit for the circle; with it, the bonus payable, for the
 * square, and then the card flips (03 FF.5).
 * @param {string} id @param {string} name @param {TrackId[]} tracks
 * @returns {Omit<TechCard, 'expansion'>}
 */
const twoTracks = (id, name, tracks) => ({
	id,
	name,
	circle: [{ advance: { tracks, noBenefit: true } }],
	square: [{ advance: { tracks } }],
	requires: CHARM_OR_FIVE,
	singleUse: true,
});

/**
 * Fantasies & Futures' 12 cards in FF_TECH order (catalog order), as 03 FF.5's table (#39 design §9).
 * @type {Omit<TechCard, 'expansion'>[]}
 */
const FF_CARDS = [
	{
		id: 'golem-minions',
		name: 'Golem Minions',
		// R71: every landmark the player owns, wherever it is.
		circle: [{ vp: { per: 'landmark' } }],
		square: [...advanceX('military'), ...perSpace('military')],
		requires: CHARM_OR_FIVE,
	},
	{
		id: 'levitation',
		name: 'Levitation',
		circle: [{ choice: [[{ explore: {} }], [{ gain: { space: 1 } }]] }],
		square: [{ exploreSpace: {} }],
		requires: CHARM_OR_FIVE,
		singleUse: true,
	},
	twoTracks('mind-control', 'Mind Control', ['science', 'military']),
	// Without the arts track only technology is offered (R118).
	twoTracks('object-cloning', 'Object Cloning', ['arts', 'technology']),
	twoTracks('perfect-memory', 'Perfect Memory', ['science', 'arts']),
	{
		id: 'pyrokinesis',
		name: 'Pyrokinesis',
		circle: [{ building: 'armory' }],
		square: [{ vp: { per: 'territory' } }, { vp: { per: 'armory' } }],
		requires: CHARM_OR_FIVE,
	},
	{
		id: 'remote-viewing',
		name: 'Remote Viewing',
		circle: [{ gain: { territory: 1 } }, { explore: { anywhere: true } }],
		square: [{ research: {} }],
		requires: CHARM_OR_FIVE,
		singleUse: true,
	},
	twoTracks('superhuman-strength', 'Superhuman Strength', [
		'exploration',
		'military',
	]),
	{
		id: 'super-speed',
		name: 'Super Speed',
		circle: [{ vp: { per: 'territoryTile' } }],
		square: [{ explore: {} }, { explore: {} }],
		requires: CHARM_OR_FIVE,
	},
	twoTracks('teleportation', 'Teleportation', ['exploration', 'technology']),
	{
		id: 'transmogrification',
		name: 'Transmogrification',
		circle: [{ invent: {} }],
		square: [{ anyBuilding: {} }],
		requires: CHARM_OR_FIVE,
	},
	{
		id: 'weather-control',
		name: 'Weather Control',
		circle: [{ explore: {} }],
		// Lithium-Ion Battery's icon; the card prints no once a turn, and is single use anyway (03 FF.5).
		square: [{ repeat: {} }],
		requires: CHARM_OR_FIVE,
		singleUse: true,
	},
];

/**
 * Every card: the base 33 in BASE_TECH order, then A&A's 11 in AA_TECH order, then F&F's 12 in FF_TECH order.
 * @type {readonly TechCard[]}
 */
export const TECH_CARDS = deepFreeze([
	...BASE_CARDS.map((card) => ({
		...card,
		expansion: /** @type {const} */ ('base'),
	})),
	...AA_CARDS.map((card) => ({
		...card,
		expansion: /** @type {const} */ ('aa'),
	})),
	...FF_CARDS.map((card) => ({
		...card,
		expansion: /** @type {const} */ ('ff'),
	})),
]);

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
