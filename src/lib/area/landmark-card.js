// The Civ tab's landmark card (#32, option A): the card a seat drafted, and how far its goal is, met or gained.
import { landmarkGoal } from '../engine/game.js';
import { landmarkCard } from '../engine/data/landmark-cards.js';
import { landmarkCardData } from '../cards/game-cards.js';
import { goalNoun } from '../cards/landmark-text.js';
import { landmarkName } from '../game-names.js';

/**
 * A seat's landmark card on the Civ tab.
 * @typedef {Object} HeldLandmarkCard
 * @property {import('../cards/game-cards.js').LandmarkCardData} data - The card's face
 * @property {'open' | 'met' | 'gained'} state - Its goal is not met yet, met (the landmark comes at the end of the turn), or its landmark is gained
 * @property {string} line - The goal line above the card
 */

/**
 * The landmark card a seat holds, with its goal line; null for a seat without one, as at a table without Plans & Ploys.
 * @param {any} seat - A seat of the game view: its landmark card, tech, capital and territory tiles are public
 * @param {boolean} own - The seat is the viewer's, so the line speaks to them
 * @returns {HeldLandmarkCard | null}
 */
export function heldLandmarkCard(seat, own) {
	const held = seat?.landmarkCard;
	if (!held || typeof held.card !== 'string') {
		return null;
	}
	const data = landmarkCardData(held.card);
	const name = landmarkName(landmarkCard(held.card).landmark);
	if (held.gained) {
		return {
			data,
			state: 'gained',
			line: `Gained: the ${name} is ${own ? 'yours' : 'theirs'}`,
		};
	}
	const { have, need, met } = landmarkGoal(seat, held.card);
	if (met) {
		return {
			data,
			state: 'met',
			line: own
				? `Met: you gain the ${name} at the end of your turn`
				: 'Met: its landmark comes at the end of their turn',
		};
	}
	const { kind } = landmarkCard(held.card).goal;
	return {
		data,
		state: 'open',
		line: `Not met yet: ${have} of ${need} ${goalNoun(kind, need)}`,
	};
}
