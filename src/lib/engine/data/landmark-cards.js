// The landmark cards of Plans & Ploys and Arts & Architecture: each one's landmark and the goal that gains it at the end of
// a turn (03 §1.2, §1.6, §2.10).
import { deepFreeze } from './ids.js';

/**
 * What a landmark card's goal counts. Plans & Ploys': tech cards in the top row, income buildings of the type most built
 * in the capital, complete districts, complete rows and columns, or territory tiles in the supply. A&A's: the types of
 * income building in the capital, the tech cards invented, the tiers entered this turn whose landmark was taken, the
 * tracks at tier II or higher, or the territories controlled next to the starting territory.
 * @typedef {'topTech' | 'sameBuildings' | 'districts' | 'lines' | 'territoryTiles' | 'buildingTypes' | 'inventedTech' | 'takenTier' | 'tierTwoTracks' | 'startNeighbours'} GoalKind
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
 * Plans & Ploys' landmark cards, then A&A's, each in the catalog's order.
 * @type {readonly LandmarkCard[]}
 */
export const LANDMARK_CARDS = deepFreeze(
	/** @type {[string, GoalKind, number, string][]} */ ([
		['game-store', 'topTech', 1, 'pp'],
		['tv-station', 'sameBuildings', 3, 'pp'],
		['digital-studio', 'districts', 2, 'pp'],
		['skyscraper', 'lines', 1, 'pp'],
		['urban-farm', 'territoryTiles', 6, 'pp'],
		// R64: Villa's 3 different types.
		['villa', 'buildingTypes', 3, 'aa'],
		['birdwatching-perch', 'inventedTech', 3, 'aa'],
		['castle', 'takenTier', 1, 'aa'],
		['windmill', 'tierTwoTracks', 2, 'aa'],
		['bridge', 'startNeighbours', 3, 'aa'],
	]).map(([id, kind, need, expansion]) => ({
		id,
		landmark: id,
		goal: { kind, need },
		expansion,
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
