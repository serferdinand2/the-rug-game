// The landmark cards' goals in words (#32): the card's own line, and the shorter phrase the goal line and log use.
import { landmarkCard } from '../engine/data/landmark-cards.js';

/** @typedef {import('../engine/data/landmark-cards.js').GoalKind} GoalKind */

/**
 * What each goal counts, for one thing and for several, as the card says it ("in your capital city") and as a line
 * about any player says it ("in the capital").
 * @type {Readonly<Record<GoalKind, { card: [string, string], short: [string, string] }>>}
 */
const NOUNS = Object.freeze({
	topTech: {
		card: ['tech card in your top row', 'tech cards in your top row'],
		short: ['tech card in the top row', 'tech cards in the top row'],
	},
	sameBuildings: {
		card: [
			'income building of the same type in your capital city',
			'income buildings of the same type in your capital city',
		],
		short: [
			'income building of one type in the capital',
			'income buildings of one type in the capital',
		],
	},
	districts: {
		card: [
			'complete district in your capital city',
			'complete districts in your capital city',
		],
		short: ['complete district', 'complete districts'],
	},
	lines: {
		card: [
			'complete row or column in your capital city',
			'complete rows or columns in your capital city',
		],
		short: ['complete row or column', 'complete rows or columns'],
	},
	territoryTiles: {
		card: [
			'territory tile in your supply',
			'territory tiles in your supply',
		],
		short: [
			'territory tile in the supply',
			'territory tiles in the supply',
		],
	},
});

/**
 * How many of what a goal counts, in words: "6 territory tiles in the supply".
 * @param {GoalKind} kind
 * @param {number} count
 * @param {'card' | 'short'} [form='short']
 * @returns {string}
 */
export function goalNoun(kind, count, form = 'short') {
	const [one, many] = NOUNS[kind][form];
	return count === 1 ? one : many;
}

/**
 * A landmark card's goal as the card prints it, finishing "Gain this landmark when you …".
 * @param {string} id - The landmark card's id
 * @returns {string}
 */
export function landmarkCondition(id) {
	const { kind, need } = landmarkCard(id).goal;
	return `have at least ${need} ${goalNoun(kind, need, 'card')}.`;
}

/**
 * A landmark card's goal as a phrase about any player: "at least 1 complete row or column".
 * @param {string} id - The landmark card's id
 * @returns {string}
 */
export function landmarkGoalPhrase(id) {
	const { kind, need } = landmarkCard(id).goal;
	return `at least ${need} ${goalNoun(kind, need)}`;
}
