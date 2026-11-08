// The masterpiece supply (#35, 03 §2.7): drawing with R119's reshuffle, the face-up row, refreshing it, and creating.
import { emit } from './events.js';
import { shuffle } from './random.js';
import { isPlayerSeat, neighbours, playerSeat } from './state.js';
import { masterpiece } from './data/masterpieces.js';
import {
	askCloudMove,
	canMoveInClouds,
} from './decisions/choose-cloud-move.js';

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

/**
 * Why a masterpiece fires: at the start of an income turn (each held card once, in the player's order), through
 * Broadcast (one of yours) or through Streaming Implants (up to 3, yours or your neighbours').
 * @typedef {'income' | 'broadcast' | 'implants'} FirePurpose
 */

/**
 * A masterpiece a player may fire: whose it is and which card.
 * @typedef {{ seat: number, card: string }} FireOption
 */

/**
 * The unused masterpieces a seat holds, in the order gained; none for a bot.
 * @param {import('./state.js').State} state
 * @param {number} seat
 * @returns {string[]}
 */
function unused(state, seat) {
	if (!isPlayerSeat(state, seat)) {
		return [];
	}
	return (playerSeat(state, seat).masterpieces ?? [])
		.filter((held) => !held.used)
		.map((held) => held.card);
}

/**
 * The masterpieces a player may fire now, leaving out those already `chosen`: their own unused ones and, for
 * Streaming Implants, each neighbour's unused ones that aren't single-use (03 §2.3, §2.12).
 * @param {import('./state.js').State} state
 * @param {number} player
 * @param {FirePurpose} purpose
 * @param {readonly string[]} [chosen]
 * @returns {FireOption[]}
 */
export function masterpieceOptions(state, player, purpose, chosen = []) {
	const own = unused(state, player).map((card) => ({ seat: player, card }));
	const theirs =
		purpose === 'implants'
			? neighbours(state, player).flatMap((seat) =>
					unused(state, seat)
						.filter((card) => !masterpiece(card).singleUse)
						.map((card) => ({ seat, card }))
				)
			: [];
	return [...own, ...theirs].filter((o) => !chosen.includes(o.card));
}

/**
 * Asks for the next masterpiece to fire, or fires it. With none, nothing happens (Broadcast says so). For the income
 * turn and Broadcast a single one fires without asking; Streaming Implants always asks, since it may stop, and stops
 * after 3 (`left`). On an income turn Cloud City's moves (`cloud`) are one more item while a building can move: asked
 * with the masterpieces, or made at once when no masterpiece is left (R121).
 * @param {import('./state.js').Context} ctx
 * @param {number} player
 * @param {FirePurpose} purpose
 * @param {string[]} chosen - Fired already by this income step or these Streaming Implants
 * @param {number} [left] - Streaming Implants' masterpieces still to choose
 * @param {number} [cloud] - Cloud City's moves still to make this income turn, before or after any masterpiece
 */
export function askMasterpiece(ctx, player, purpose, chosen, left, cloud) {
	if (left === 0) {
		return;
	}
	const options = masterpieceOptions(ctx.state, player, purpose, chosen);
	const moves =
		purpose === 'income' && cloud && canMoveInClouds(ctx.state, player)
			? cloud
			: 0;
	if (options.length === 0) {
		if (moves) {
			askCloudMove(ctx, player, moves);
		}
		if (purpose === 'broadcast') {
			emit(ctx.state, { type: 'noBroadcast', player });
		}
		return;
	}
	if (purpose !== 'implants' && options.length === 1 && !moves) {
		fireChosen(ctx, { player, purpose, chosen, left }, options[0]);
		return;
	}
	ctx.push([
		{
			player,
			kind: 'chooseMasterpiece',
			purpose,
			options,
			chosen,
			...(left !== undefined && { left }),
			...(moves && { cloud: moves }),
		},
	]);
}

/**
 * Makes Cloud City's moves now, the item the player put next in the masterpieces' order, then asks for the next
 * masterpiece (R121).
 * @param {import('./state.js').Context} ctx
 * @param {{ player: number | null, purpose: FirePurpose, chosen?: string[], cloud?: number }} asked - The decision
 */
export function moveInClouds(ctx, asked) {
	const player = /** @type {number} */ (asked.player);
	ctx.push([
		{
			player,
			kind: 'askMasterpiece',
			purpose: asked.purpose,
			chosen: asked.chosen ?? [],
		},
	]);
	// Pushed above the next question, so the moves come first.
	askCloudMove(ctx, player, asked.cloud ?? 0);
}

/**
 * Fires the masterpiece chosen, then, for the income turn and Streaming Implants, asks for the next one once its
 * benefit is done: so a masterpiece gained meanwhile fires in the same income step (03 §2.2).
 * @param {import('./state.js').Context} ctx
 * @param {{ player: number | null, purpose: FirePurpose, chosen?: string[], left?: number, cloud?: number }} asked - The ask or decision, with Cloud City's moves still to make (R121)
 * @param {FireOption} option
 */
export function fireChosen(ctx, asked, { seat, card }) {
	const player = /** @type {number} */ (asked.player);
	const { purpose, left, cloud } = asked;
	const chosen = [...(asked.chosen ?? []), card];
	emit(ctx.state, { type: 'masterpieceFired', player, card, owner: seat });
	ctx.push([
		{
			player,
			kind: 'effects',
			effects: structuredClone(masterpiece(card).effects),
			ordered: true,
			source: { masterpiece: card },
		},
		...(purpose === 'broadcast'
			? []
			: [
					{
						player,
						kind: 'askMasterpiece',
						purpose,
						chosen,
						...(left !== undefined && { left: left - 1 }),
						...(cloud && { cloud }),
					},
				]),
	]);
}

/**
 * The automatic operation that asks for the next masterpiece to fire (askMasterpiece).
 * @type {import('./state.js').AutomaticKind}
 */
export function nextMasterpiece(ctx, op) {
	askMasterpiece(
		ctx,
		/** @type {number} */ (op.player),
		op.purpose,
		op.chosen ?? [],
		op.left,
		op.cloud
	);
}
