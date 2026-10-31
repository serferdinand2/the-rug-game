// Plans & Ploys' 5 landmark cards: each one's landmark and the goal that gains it at the end of a turn (03 §1.2, §1.6).
import { deepFreeze } from './ids.js';

/**
 * What a landmark card's goal counts: tech cards in the top row, income buildings of the type most built in the
 * capital, complete districts, complete rows and columns, or territory tiles in the supply.
 * @typedef {'topTech' | 'sameBuildings' | 'districts' | 'lines' | 'territoryTiles'} GoalKind
 */

/**
 * A landmark card. Each player drafts one and gains its landmark once its goal is met at the end of their turn.
 * @typedef {Object} LandmarkCard
 * @property {string} id - The catalog slug, the same as its landmark's
 * @property {string} landmark - The landmark it gains
 * @property {{ kind: GoalKind, need: number }} goal - At least `need` of what `kind` counts
 * @property {string} expansion - Its expansion's code
 */

/**
 * Plans & Ploys' landmark cards, in the catalog's order.
 * @type {readonly LandmarkCard[]}
 */
export const LANDMARK_CARDS = deepFreeze(
	/** @type {[string, import('./landmark-cards.js').GoalKind, number][]} */ ([
		['game-store', 'topTech', 1],
		['tv-station', 'sameBuildings', 3],
		['digital-studio', 'districts', 2],
		['skyscraper', 'lines', 1],
		['urban-farm', 'territoryTiles', 6],
	]).map(([id, kind, need]) => ({
		id,
		landmark: id,
		goal: { kind, need },
		expansion: 'pp',
	}))
);

/**
 * The landmark cards of a game's expansions.
 * @param {readonly string[]} expansions
 * @returns {LandmarkCard[]}
 */
export function landmarkCardsFor(expansions) {
	return LANDMARK_CARDS.filter((card) => expansions.includes(card.expansion));
}

/**
 * A landmark card by id.
 * @param {string} id
 * @returns {LandmarkCard}
 */
export function landmarkCard(id) {
	const card = LANDMARK_CARDS.find((c) => c.id === id);
	if (!card) {
		throw new RangeError(`There is no landmark card ${id}.`);
	}
	return card;
}
