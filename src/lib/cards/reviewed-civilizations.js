// The reviewed civilization cards' review status and the play illustrations they show; not engine rules (#107).
import { civCardMarks } from '../civ-card.js';

/** @typedef {import('../civ-card.js').CivCardView} CivCardView */

/**
 * The cards on the review page and in the library, in their order, each with its review status. The title, portrait,
 * edition and complexity come from the card's recipe (`civCard`).
 * @type {readonly { id: string, edition: 'reviewed' | 'original' | 'awaiting review' }[]}
 */
export const REVIEWED_CIVILIZATIONS = Object.freeze([
	{ id: 'collectors', edition: 'reviewed' },
	{ id: 'architects', edition: 'reviewed' },
	{ id: 'leaders', edition: 'reviewed' },
	{ id: 'treasure-hunters', edition: 'reviewed' },
	{ id: 'craftsmen', edition: 'reviewed' },
	{ id: 'entertainers', edition: 'original' },
	{ id: 'militants', edition: 'original' },
	{ id: 'mystics', edition: 'original' },
	{ id: 'alchemists', edition: 'original' },
	{ id: 'isolationists', edition: 'original' },
	{ id: 'traders', edition: 'original' },
	{ id: 'merrymakers', edition: 'original' },
	{ id: 'historians', edition: 'original' },
	{ id: 'inventors', edition: 'original' },
	// #47: the four base civilizations that had no layout, from the researched text; not yet reviewed by the owner.
	{ id: 'futurists', edition: 'awaiting review' },
	{ id: 'heralds', edition: 'awaiting review' },
	{ id: 'nomads', edition: 'awaiting review' },
	{ id: 'the-chosen', edition: 'awaiting review' },
	// #33: Plans & Ploys' other nine, from 03 §1.3's text; not yet reviewed by the owner.
	{ id: 'advisors', edition: 'awaiting review' },
	{ id: 'aliens', edition: 'awaiting review' },
	{ id: 'infiltrators', edition: 'awaiting review' },
	{ id: 'islanders', edition: 'awaiting review' },
	{ id: 'recyclers', edition: 'awaiting review' },
	{ id: 'riverfolk', edition: 'awaiting review' },
	{ id: 'spies', edition: 'awaiting review' },
	{ id: 'tinkerers', edition: 'awaiting review' },
	{ id: 'utilitarians', edition: 'awaiting review' },
	// #37: Arts & Architecture's other four, from 03 §2.4's text; not yet reviewed by the owner.
	{ id: 'relentless', edition: 'awaiting review' },
	{ id: 'renegades', edition: 'awaiting review' },
	{ id: 'gamblers', edition: 'awaiting review' },
	{ id: 'urban-planners', edition: 'awaiting review' },
	// #40: Fantasies & Futures', from 03 FF.3's text; not yet reviewed by the owner.
	{ id: 'werefolk', edition: 'awaiting review' },
	{ id: 'psionics', edition: 'awaiting review' },
	{ id: 'artificers', edition: 'awaiting review' },
	{ id: 'faefolk', edition: 'awaiting review' },
	{ id: 'celestials', edition: 'awaiting review' },
	{ id: 'genies', edition: 'awaiting review' },
	{ id: 'weefolk', edition: 'awaiting review' },
	{ id: 'illuminati', edition: 'awaiting review' },
	{ id: 'elder-ones', edition: 'awaiting review' },
	{ id: 'merfolk', edition: 'awaiting review' },
]);

/**
 * The data the library's play state shows for the card civilizations (`CARD_CIVS`): the reviewed illustration of each
 * card, drawn as live data is.
 * @type {Readonly<Record<string, any>>}
 */
export const SAMPLE_CIV_DATA = Object.freeze({
	entertainers: { at: 'c3r2' },
	merrymakers: { levels: [2, 1, 0] },
	leaders: { used: ['exploration', 'science'] },
	militants: {
		top: [false, true, true, true],
		bottom: [false, false, true, true],
	},
	historians: { squares: [false, false, true, true], given: {} },
	mystics: {
		predictions: { techCards: 4, districts: 3, territories: 5, tracks: 2 },
		reached: [],
	},
	// Desert used.
	'treasure-hunters': { tokens: 3, used: ['desert'] },
	// No option used yet; the library's live example shows one used (#33).
	tinkerers: { used: [] },
	// No option used yet; the library's live example shows two used (#33).
	spies: { used: [], watching: [] },
	// No token out yet; the library's live example shows two out (#33).
	utilitarians: { active: [] },
	// Tokens out, as the reviewed illustrations showed them (#180).
	traders: { tokens: 2 },
	isolationists: { tokens: 3 },
	heralds: { tokens: 3, cards: [] },
	// #37: 2 tokens on the mat, the token on space II, the Forge kept.
	relentless: { tokens: 2 },
	renegades: { at: 2 },
	'urban-planners': { stored: ['forge'] },
	// The outpost, the house and the tech card collected, as the reviewed illustration showed them (#37).
	collectors: {
		items: { outpost: true, house: true, tech: 'eyeglasses' },
		turn: null,
	},
	// #40: a game under way, awaiting review: a space tile on the Werefolk's mat, a building set aside, the Faefolk on
	// spot 3, the Celestials afloat, 2 Genies tokens, 2 dice left to the Illuminati, 3 cards submerged.
	werefolk: { tile: 7 },
	artificers: { aside: ['farm'] },
	faefolk: { spot: 3 },
	celestials: { hex: '-2_-1' },
	genies: { tokens: [2, 3] },
	illuminati: { onMat: ['red', 'science'] },
	merfolk: { submerged: 3 },
});

/**
 * Marks a list of spots with one mark.
 * @param {string[]} spots
 * @param {import('../civ-card.js').SpotMark} mark
 * @returns {CivCardView}
 */
function sample(spots, mark) {
	return {
		marks: Object.fromEntries(spots.map((spot) => [spot, [mark]])),
		choices: {},
	};
}

/**
 * Each reviewed card's play illustration, as the view a live card gets (`civCardView`): the card civilizations'
 * from their sample data, the others' as marks on the spots their recipe names.
 * @type {Readonly<Record<string, CivCardView>>}
 */
export const SAMPLE_VIEWS = Object.freeze({
	...Object.fromEntries(
		Object.entries(SAMPLE_CIV_DATA).map(([civ, data]) => [
			civ,
			{ marks: civCardMarks(civ, data), choices: {} },
		])
	),
	architects: sample([], 'token'),
	// A house on column A's bottom space and a farm above it.
	craftsmen: {
		...sample(['c0s0', 'c0s1'], 'token'),
		pieces: { c0s0: 'house', c0s1: 'farm' },
	},
	// Exploration and Science rolled.
	alchemists: sample(['exploration', 'science'], 'token'),
	// One token sent, moving a card from an opponent's top row to your bottom row.
	inventors: {
		marks: { token0: ['used'], transfer: ['token'] },
		choices: {},
	},
	futurists: sample([], 'token'),
	nomads: sample([], 'token'),
	'the-chosen': sample([], 'token'),
	advisors: sample([], 'token'),
	aliens: sample([], 'token'),
	infiltrators: sample([], 'token'),
	islanders: sample([], 'token'),
	recyclers: sample([], 'token'),
	riverfolk: sample([], 'token'),
	gamblers: sample([], 'token'),
	// #40: F&F's without a piece on their card.
	psionics: sample([], 'token'),
	weefolk: sample([], 'token'),
	'elder-ones': sample([], 'token'),
});
