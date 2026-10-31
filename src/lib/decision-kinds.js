// Each decision kind's client facts (#129): the card shelf its answers are on, the tab it opens, its Confirm words and the art beside its answers.
// A new engine kind adds its entry here, and its title and answer words in decision-words.js.

/** @typedef {'tapestry' | 'tech' | 'civ' | 'mat' | 'landmark'} Shelf - The card shelf a decision's answers are on */

/**
 * The shapes of the art beside an answer, which prompts.js draws: a track, resources, a payment, a die face, a
 * landmark, a space tile, a gifted or an explored territory tile, a civilization, a building or landmark being placed,
 * an option's or an ordered effect's art, or a slot's track or resource.
 * @typedef {'track' | 'resources' | 'payment' | 'die' | 'landmark' | 'space-tile' | 'gift' | 'explore' | 'civ'
 *   | 'placement' | 'option' | 'order' | 'slot'} ArtShape
 */

/**
 * One decision kind's facts; each is null when the kind has none.
 * @typedef {Object} KindFacts
 * @property {Shelf | null} shelf - The card shelf its answers are on
 * @property {string | null} tab - The player tab it opens by itself
 * @property {string | null} confirm - The Confirm button's words, when not "Confirm choice"
 * @property {ArtShape | null} art - The art beside its answers; a shelf's answers are drawn from the shelf
 */

/** @type {readonly ArtShape[]} */
export const ART_SHAPES = Object.freeze([
	'track',
	'resources',
	'payment',
	'die',
	'landmark',
	'space-tile',
	'gift',
	'explore',
	'civ',
	'placement',
	'option',
	'order',
	'slot',
]);

/**
 * Every engine decision kind, in the engine's order (kinds.js), with the facts it has.
 * @type {Readonly<Record<string, Partial<KindFacts>>>}
 */
export const DECISION_KINDS = Object.freeze({
	chooseTurn: {},
	chooseCapital: { shelf: 'mat', confirm: 'Take this capital' },
	chooseCiv: { shelf: 'civ', confirm: 'Keep civilization' },
	chooseResource: { art: 'resources' },
	chooseBonus: { art: 'payment' },
	chooseAdvance: {},
	chooseOrder: { art: 'order' },
	chooseOption: { art: 'option' },
	chooseMove: { art: 'track' },
	chooseRepeat: { art: 'track' },
	chooseRestart: { art: 'track' },
	chooseTapestry: { shelf: 'tapestry', tab: 'hand', confirm: 'Play card' },
	choosePlacement: { tab: 'capital', confirm: 'Place', art: 'placement' },
	chooseExplore: { confirm: 'Explore', art: 'explore' },
	chooseSpaceTile: { tab: 'terrain', art: 'space-tile' },
	chooseConquer: { confirm: 'Conquer' },
	chooseDie: { art: 'die' },
	chooseResponse: { shelf: 'tapestry' },
	chooseInvent: { shelf: 'tech', tab: 'tech', confirm: 'Invent' },
	chooseUpgrade: { shelf: 'tech', tab: 'tech', confirm: 'Upgrade' },
	chooseTechBenefit: {
		shelf: 'tech',
		tab: 'tech',
		confirm: 'Use benefit',
	},
	chooseLandmark: { art: 'landmark' },
	chooseDiscard: { shelf: 'tapestry', tab: 'hand' },
	chooseKeep: { shelf: 'tapestry', tab: 'hand', confirm: 'Keep card' },
	chooseTrade: { art: 'payment' },
	chooseTrack: { art: 'track' },
	chooseRoll: { art: 'track' },
	chooseSpace: { art: 'track' },
	chooseHex: {},
	chooseGift: { tab: 'terrain', art: 'gift' },
	choosePartner: { art: 'track' },
	chooseCopy: { shelf: 'tapestry', tab: 'eras' },
	chooseConversion: { art: 'resources' },
	chooseCivAbility: { tab: 'civ', art: 'civ' },
	chooseSlot: { tab: 'civ', art: 'slot' },
	chooseAlchemists: { tab: 'civ' },
	chooseProphecy: { tab: 'civ' },
	chooseSwap: { tab: 'capital' },
	chooseLandmarkCard: { shelf: 'landmark', confirm: 'Keep card' },
});

/**
 * A decision kind's facts, each null when it has none, also for a kind the table doesn't know.
 * @param {string} kind
 * @returns {KindFacts}
 */
export function kindFacts(kind) {
	const facts = Object.hasOwn(DECISION_KINDS, kind)
		? DECISION_KINDS[kind]
		: {};
	return {
		shelf: facts.shelf ?? null,
		tab: facts.tab ?? null,
		confirm: facts.confirm ?? null,
		art: facts.art ?? null,
	};
}
