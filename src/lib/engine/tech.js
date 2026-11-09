// The tech deck and its three face-up cards: drawing, refilling and refreshing (01 §8, FAQ #24), what a card's prerequisites ask (R18), and the cards a player may upgrade or recycle.
import { emit } from './events.js';
import { shuffle } from './random.js';
import { isPlayerSeat, playerSeat, seatOf } from './state.js';
import { neighbours, exposedSpaces } from './income.js';
import { spacesAdvanced } from './movement.js';
import { hasEra } from './abilities.js';
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
 * @param {{ track: import('./data/ids.js').TrackId, tier: 2 | 3 | 4 } | { innovation: string }} need
 * @returns {boolean}
 */
function seatMeets(state, who, need) {
	const seat = seatOf(state, who);
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
 * Whether a card's top-row prerequisite is met: by the player or either neighbour (R18), by the player alone where the
 * original version prints no neighbours icon (Oil Paint, R125); a landmark on the card itself (03 §2), or nothing.
 * @param {import('./state.js').State} state
 * @param {number} player
 * @param {import('./data/tech-cards.js').TechCard} card
 * @returns {boolean}
 */
export function meetsRequirement(state, player, card) {
	const need = card.requires;
	if ('none' in need) {
		return true;
	}
	if ('landmark' in need) {
		return holdsLandmark(state, player, card.id);
	}
	const alone =
		'selfInOriginal' in need &&
		need.selfInOriginal === true &&
		state.version === 'original';
	return [player, ...(alone ? [] : neighbours(state, player))].some((who) =>
		seatMeets(state, who, need)
	);
}

/**
 * Whether one of a player's tech cards holds a landmark (A&A's landmark cards, 03 §2).
 * @param {import('./state.js').State} state
 * @param {number} player
 * @param {string} card
 * @returns {boolean}
 */
export function holdsLandmark(state, player, card) {
	return playerSeat(state, player).techLandmarks?.[card] !== undefined;
}

/**
 * The tech cards carrying an Inventors token, on any player's mat. Each ignores its prerequisite for the rest of the
 * game, for whoever holds it (02 §1.2, #20 design §7).
 * @param {import('./state.js').State} state
 * @returns {string[]}
 */
function inventorsMarks(state) {
	return state.seats
		.filter((s) => s.kind === 'player')
		.flatMap(
			({ seat }) => playerSeat(state, seat).civData.inventors?.cards ?? []
		);
}

/**
 * The cards a player may upgrade: the bottom row, then the middle-row cards whose prerequisite is met or waived, each in row order.
 * @param {import('./state.js').State} state
 * @param {number} player
 * @param {boolean} [ignorePrerequisite] - Every middle-row card counts, as Duct Tape's upgrades (03 §2)
 * @returns {string[]}
 */
export function upgradable(state, player, ignorePrerequisite = false) {
	const { bottom, middle } = playerSeat(state, player).tech;
	const marked = inventorsMarks(state);
	return [
		...bottom,
		// Golden Age ignores prerequisites, and an Inventors token waives its card's.
		...middle.filter(
			(id) =>
				ignorePrerequisite ||
				marked.includes(id) ||
				hasEra(state, player, 'golden-age') ||
				meetsRequirement(state, player, techCard(id))
		),
	].filter((id) => !isLocked(state, player, id));
}

/**
 * Whether Ceramics upgraded a player's card this turn, so it may not be upgraded again: not by the income turn's
 * upgrade, nor by a civilization (#35, RB-AA p3).
 * @param {import('./state.js').State} state
 * @param {number} player - The card's owner
 * @param {string} card
 * @returns {boolean}
 */
export function isLocked(state, player, card) {
	return state.lockedTech.some((l) => l.player === player && l.card === card);
}

/**
 * Locks a card Ceramics just upgraded until a turn starts.
 * @param {import('./state.js').State} state
 * @param {number} player - The card's owner
 * @param {string} card
 */
export function lockTech(state, player, card) {
	state.lockedTech.push({ player, card });
}

/**
 * Whether a player holds the Recyclers (03 §1.3): their own upgrades may send a top-row card back down, and they may
 * invent from the tech discard pile.
 * @param {import('./state.js').State} state
 * @param {unknown} player
 * @returns {boolean}
 */
export function recycles(state, player) {
	return (
		isPlayerSeat(state, player) &&
		playerSeat(state, /** @type {number} */ (player)).civs.includes(
			'recyclers'
		)
	);
}

/**
 * The top-row cards a player's own upgrade may send back to the bottom row instead, in row order: the Recyclers' only.
 * @param {import('./state.js').State} state
 * @param {number} player
 * @returns {string[]}
 */
export function recyclable(state, player) {
	return recycles(state, player)
		? [...playerSeat(state, player).tech.top]
		: [];
}
