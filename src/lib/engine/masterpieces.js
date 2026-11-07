// The masterpiece supply (#35, 03 §2.7): drawing with R119's reshuffle, the face-up row, refreshing it, and creating.
import { emit } from './events.js';
import { shuffle } from './random.js';
import { playerSeat } from './state.js';

/** How many masterpieces lie face up (03 §2.2, setup step 2). */
export const FACE_UP = 3;

/**
 * The masterpiece supply, which only a game with the arts track has.
 * @param {import('./state.js').State} state
 * @returns {NonNullable<import('./state.js').Supply['masterpieces']>}
 * @throws {Error} Without one (a bug: nothing reaches a masterpiece without the arts track)
 */
function pile(state) {
	const found = state.supply.masterpieces;
	if (!found) {
		throw new Error(
			'This game has no masterpieces: the arts track is off.'
		);
	}
	return found;
}

/**
 * Takes the deck's top masterpiece. An empty deck is first rebuilt by shuffling the discards (R119).
 * @param {import('./state.js').Context} ctx
 * @returns {string | null} The card, or null with neither deck nor discards
 */
export function drawMasterpiece(ctx) {
	const supply = pile(ctx.state);
	if (supply.deck.length === 0 && supply.discard.length > 0) {
		supply.deck = shuffle(supply.discard, ctx.random);
		supply.discard = [];
		emit(ctx.state, {
			type: 'masterpieceDeckShuffled',
			count: supply.deck.length,
		});
	}
	return supply.deck.shift() ?? null;
}

/**
 * Turns masterpieces face up until there are 3 or nothing is left (R119).
 * @param {import('./state.js').Context} ctx
 */
export function refillMasterpieces(ctx) {
	const supply = pile(ctx.state);
	while (supply.faceUp.length < FACE_UP) {
		const card = drawMasterpiece(ctx);
		if (card === null) {
			return;
		}
		supply.faceUp.push(card);
	}
}

/**
 * Discards the face-up masterpieces, then turns 3 new ones up (Rock Opera). The discards go first, so a reshuffle
 * may deal one back, as the tech display does.
 * @param {import('./state.js').Context} ctx
 * @param {number} player - Who refreshed them
 */
export function refreshFaceUp(ctx, player) {
	const supply = pile(ctx.state);
	const discarded = supply.faceUp.splice(0);
	supply.discard.push(...discarded);
	refillMasterpieces(ctx);
	emit(ctx.state, {
		type: 'masterpiecesRefreshed',
		player,
		discarded,
		faceUp: [...supply.faceUp],
	});
}

/**
 * Whether the face-up row could change: a card is face up, or one could be drawn.
 * @param {import('./state.js').State} state
 * @returns {boolean}
 */
export function canRefresh(state) {
	const supply = state.supply.masterpieces;
	return (
		!!supply &&
		supply.faceUp.length + supply.deck.length + supply.discard.length > 0
	);
}

/**
 * What a create may take: each face-up masterpiece, then the deck's top card when the deck or its discards hold one
 * (R119). None without the arts track.
 * @param {import('./state.js').State} state
 * @returns {string[]} Card ids, and `'deck'` for the deck's top card
 */
export function createOptions(state) {
	const supply = state.supply.masterpieces;
	if (!supply) {
		return [];
	}
	return [
		...supply.faceUp,
		...(supply.deck.length + supply.discard.length > 0 ? ['deck'] : []),
	];
}

/**
 * Creates: the player takes a face-up masterpiece or the deck's top card, and the face-up row refills at once.
 * @param {import('./state.js').Context} ctx
 * @param {number} player
 * @param {string} card - A face-up card's id, or `'deck'`
 * @throws {Error} For a card that isn't face up, or an empty deck (createOptions offers neither)
 */
export function takeMasterpiece(ctx, player, card) {
	const supply = pile(ctx.state);
	/** @type {string | null} */
	let taken = card;
	if (card === 'deck') {
		taken = drawMasterpiece(ctx);
	} else if (supply.faceUp.includes(card)) {
		supply.faceUp.splice(supply.faceUp.indexOf(card), 1);
	} else {
		taken = null;
	}
	if (taken === null) {
		throw new Error(`The masterpiece ${card} can't be taken.`);
	}
	const seat = playerSeat(ctx.state, player);
	(seat.masterpieces ??= []).push({ card: taken, used: false });
	emit(ctx.state, {
		type: 'masterpieceCreated',
		player,
		card: taken,
		from: card === 'deck' ? 'deck' : 'faceUp',
	});
	refillMasterpieces(ctx);
}
