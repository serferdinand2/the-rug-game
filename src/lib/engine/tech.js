// The tech deck and its three face-up cards: drawing, refilling and refreshing (01 §8, FAQ #24), and what a card's prerequisites ask (R18).
import { emit } from './events.js';
import { shuffle } from './random.js';
import { playerSeat, seatOf } from './state.js';
import { neighbours, exposedSpaces } from './income.js';
import { spacesAdvanced } from './movement.js';
import { techCard } from './data/tech-cards.js';
import { BUILDING_IDS } from './data/ids.js';

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

/** The spaces advanced that each track tier needs (R18). */
const TIER_SPACES = { 2: 4, 3: 7, 4: 10 };

/**
 * Whether one seat currently has what a card asks for: a track tier or an uncovered innovation (R18).
 * @param {import('./state.js').State} state
 * @param {number} who
 * @param {import('./data/tech-cards.js').TechCard} card
 * @returns {boolean}
 */
function seatMeets(state, who, card) {
	const seat = seatOf(state, who);
	const need = card.requires;
	if ('track' in need) {
		return spacesAdvanced(seat, need.track) >= TIER_SPACES[need.tier];
	}
	// A bot has no income mat, so no innovation is uncovered for it.
	if (seat.kind !== 'player') {
		return false;
	}
	const mat = /** @type {import('./state.js').PlayerSeat} */ (seat);
	return BUILDING_IDS.some((row) =>
		exposedSpaces(mat, row).some((space) => space.id === need.innovation)
	);
}

/**
 * Whether a card's top-row prerequisite is met by the player or either neighbour (R18).
 * @param {import('./state.js').State} state
 * @param {number} player
 * @param {import('./data/tech-cards.js').TechCard} card
 * @returns {boolean}
 */
export function meetsRequirement(state, player, card) {
	return [player, ...neighbours(state, player)].some((who) =>
		seatMeets(state, who, card)
	);
}

/**
 * The cards a player may upgrade: the bottom row, then the middle-row cards whose prerequisite is met, each in row order.
 * @param {import('./state.js').State} state
 * @param {number} player
 * @returns {string[]}
 */
export function upgradable(state, player) {
	const { bottom, middle } = playerSeat(state, player).tech;
	return [
		...bottom,
		...middle.filter((id) => meetsRequirement(state, player, techCard(id))),
	];
}
