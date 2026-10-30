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
]);

/**
 * The data the library's play state shows for the six card civilizations: the reviewed illustration of each card,
 * drawn as live data is.
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
 * Each reviewed card's play illustration, as the view a live card gets (`civCardView`): the six card civilizations'
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
	// The outpost, the house and the tech card collected.
	collectors: sample(['outpost', 'house', 'tech'], 'token'),
	architects: sample([], 'token'),
	// Desert used.
	'treasure-hunters': sample(['desert'], 'used'),
	// A house on column A's bottom space and a farm above it.
	craftsmen: {
		...sample(['c0s0', 'c0s1'], 'token'),
		pieces: { c0s0: 'house', c0s1: 'farm' },
	},
	// Exploration and Science rolled.
	alchemists: sample(['exploration', 'science'], 'token'),
	isolationists: sample(['token0'], 'used'),
	traders: sample(['token0', 'token1'], 'used'),
	// One token sent, moving a card from an opponent's top row to your bottom row.
	inventors: {
		marks: { token0: ['used'], transfer: ['token'] },
		choices: {},
	},
	futurists: sample([], 'token'),
	heralds: sample(['token0'], 'used'),
	nomads: sample([], 'token'),
	'the-chosen': sample([], 'token'),
});
