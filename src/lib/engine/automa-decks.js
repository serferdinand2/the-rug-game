// The serializable draw/discard state for the solo Automa pair and standalone Shadow Empire.
import { AUTOMA_CARDS } from './data/automa-cards.js';
import { shuffle } from './random.js';

/** @typedef {import('./random.js').Random} Random */
/** @typedef {{ trackCard: number, tiebreakerCard: number }} DecisionPair */

/** @typedef {Object} AutomaDeckState
 * @property {number[]} decisionDeck
 * @property {number[]} progressDeck
 * @property {number[]} decisionDiscard
 * @property {number[]} progressDiscard
 * @property {DecisionPair | null} currentPair
 * @property {string[]} multiplierCards
 * @property {string[]} trapCards
 */

/** @typedef {Object} ShadowDeckState
 * @property {number[]} decisionDeck
 * @property {number[]} discard
 * @property {DecisionPair | null} currentPair
 * @property {number | null} previousTiebreaker
 */

/**
 * Builds the base Automa's initial decks: shuffle progress, fold its top card into 1–7, then shuffle all eight.
 * @param {Random} random
 * @returns {AutomaDeckState}
 */
export function createAutomaDecks(random) {
	const progressDeck = shuffle(
		AUTOMA_CARDS.filter((card) => card.deck === 'progress').map(
			(card) => card.id
		),
		random
	);
	const firstProgress = progressDeck.shift();
	if (firstProgress === undefined) {
		throw new Error('The Automa needs a progress card to start its deck.');
	}
	const decisionDeck = shuffle(
		[
			...AUTOMA_CARDS.filter((card) => card.deck === 'decision').map(
				(card) => card.id
			),
			firstProgress,
		],
		random
	);
	return {
		decisionDeck,
		progressDeck,
		decisionDiscard: [],
		progressDiscard: [],
		currentPair: null,
		multiplierCards: [],
		trapCards: [],
	};
}

/**
 * Builds the standalone two-human Shadow Empire's shuffled card-1–12 deck (§9.9).
 * @param {Random} random
 * @returns {ShadowDeckState}
 */
export function createShadowEmpireDeck(random) {
	return {
		decisionDeck: shuffle(
			AUTOMA_CARDS.filter((card) => card.id <= 12).map((card) => card.id),
			random
		),
		discard: [],
		currentPair: null,
		previousTiebreaker: null,
	};
}

/**
 * Discards the previous solo pair, then draws two cards and randomly orients them as track/tiebreaker.
 * If the decision deck is empty, income happens instead; the latest face-up pair remains available.
 * @param {AutomaDeckState} automa
 * @param {Random} random
 * @returns {DecisionPair | null}
 */
export function drawAutomaPair(automa, random) {
	if (automa.decisionDeck.length < 2) {
		if (automa.decisionDeck.length === 1) {
			throw new Error(
				'The Automa decision deck must contain pairs of cards.'
			);
		}
		return null;
	}
	if (automa.currentPair) {
		automa.decisionDiscard.push(
			automa.currentPair.trackCard,
			automa.currentPair.tiebreakerCard
		);
	}
	const drawn = automa.decisionDeck.splice(0, 2);
	if (random(2) === 1) {
		drawn.reverse();
	}
	automa.currentPair = {
		trackCard: drawn[0],
		tiebreakerCard: drawn[1],
	};
	return { ...automa.currentPair };
}

/**
 * Draws the standalone Shadow Empire's next pair, recycling all twelve cards when needed (§9.9).
 * The previous pair's tiebreaker remains available for the favourite-track reroll rule.
 * @param {ShadowDeckState} shadow
 * @param {Random} random
 * @returns {DecisionPair}
 */
export function drawShadowEmpirePair(shadow, random) {
	if (shadow.currentPair) {
		shadow.discard.push(
			shadow.currentPair.trackCard,
			shadow.currentPair.tiebreakerCard
		);
	}
	if (shadow.decisionDeck.length < 2) {
		if (shadow.decisionDeck.length === 1) {
			throw new Error(
				'The Shadow Empire decision deck must contain pairs of cards.'
			);
		}
		shadow.previousTiebreaker =
			shadow.currentPair?.tiebreakerCard ?? shadow.previousTiebreaker;
		shadow.decisionDeck = shuffle(shadow.discard, random);
		shadow.discard = [];
		shadow.currentPair = null;
	}
	const drawn = shadow.decisionDeck.splice(0, 2);
	if (random(2) === 1) {
		drawn.reverse();
	}
	shadow.currentPair = {
		trackCard: drawn[0],
		tiebreakerCard: drawn[1],
	};
	return { ...shadow.currentPair };
}
