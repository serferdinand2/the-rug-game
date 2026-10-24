// The tech deck and its three face-up cards: drawing, refilling and refreshing (01 §9.1, FAQ #24).
import { emit } from './events.js';
import { shuffle } from './random.js';

/**
 * Takes the top tech card. An empty deck is first rebuilt by shuffling the discards (FAQ #24).
 * @param {import('./state.js').Context} ctx
 * @returns {string | null} The card, or null with neither deck nor discards
 */
export function drawTech(ctx) {
	const tech = ctx.state.supply.tech;
	if (tech.deck.length === 0 && tech.discard.length > 0) {
		tech.deck = shuffle(tech.discard, ctx.random);
		tech.discard = [];
		emit(ctx.state, { type: 'techDeckShuffled', count: tech.deck.length });
	}
	return tech.deck.shift() ?? null;
}

/**
 * Whether a card could be drawn: the deck or the discards hold one.
 * @param {import('./state.js').State} state
 * @returns {boolean}
 */
export function canDraw(state) {
	const { deck, discard } = state.supply.tech;
	return deck.length + discard.length > 0;
}

/**
 * Deals face-up cards until there are 3 or nothing is left.
 * @param {import('./state.js').Context} ctx
 */
export function refillDisplay(ctx) {
	const tech = ctx.state.supply.tech;
	while (tech.faceUp.length < 3) {
		const card = drawTech(ctx);
		if (card === null) {
			return;
		}
		tech.faceUp.push(card);
	}
}

/**
 * Discards the face-up cards, then deals 3 new ones. The discards go first, so a reshuffle may deal one back (the physical order).
 * @param {import('./state.js').Context} ctx
 */
export function refreshDisplay(ctx) {
	const tech = ctx.state.supply.tech;
	const discarded = tech.faceUp.splice(0);
	tech.discard.push(...discarded);
	refillDisplay(ctx);
	emit(ctx.state, {
		type: 'techDisplayRefreshed',
		discarded,
		faceUp: [...tech.faceUp],
	});
}
