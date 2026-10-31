// Landmark cards (#32; 03 §1.2): the draft as setup ends, and the goal that gains a card's landmark at the end of a turn.
import { emit } from './events.js';
import { isPlayerSeat, playerSeat } from './state.js';
import { triggered } from './abilities.js';
import { cityPlots, completeDistricts, completeLines } from './city.js';
import { landmarkCard } from './data/landmark-cards.js';

/** @typedef {import('./state.js').PlayerSeat} PlayerSeat */

/**
 * How far a seat is towards a landmark card's goal. "In your capital city" is what stands on the mat's grid (R13).
 * @param {Pick<PlayerSeat, 'tech' | 'capital' | 'territoryTiles'>} seat - A seat of the state or of a view
 * @param {string} card - The landmark card's id
 * @returns {{ have: number, need: number, met: boolean }}
 */
export function landmarkGoal(seat, card) {
	const { kind, need } = landmarkCard(card).goal;
	const have = goalCount(seat, kind);
	return { have, need, met: have >= need };
}

/**
 * What a goal counts for a seat.
 * @param {Pick<PlayerSeat, 'tech' | 'capital' | 'territoryTiles'>} seat
 * @param {import('./data/landmark-cards.js').GoalKind} kind
 * @returns {number}
 */
function goalCount(seat, kind) {
	if (kind === 'topTech') {
		return seat.tech.top.length;
	}
	if (kind === 'territoryTiles') {
		return seat.territoryTiles.length;
	}
	if (kind === 'sameBuildings') {
		/** @type {Record<string, number>} */
		const counts = {};
		for (const { building } of seat.capital.buildings) {
			counts[building] = (counts[building] ?? 0) + 1;
		}
		return Math.max(0, ...Object.values(counts));
	}
	if (seat.capital.mat === null) {
		return 0;
	}
	const plots = cityPlots(/** @type {PlayerSeat} */ (seat));
	if (kind === 'districts') {
		return completeDistricts(plots).length;
	}
	const { rows, columns } = completeLines(plots);
	return rows + columns;
}

/**
 * The after-setup step: the player going last draws one landmark card per player (2 when alone) and keeps one; the
 * rest pass counter-clockwise, each player before them in turn order keeping one, the first player last (03 §1.2).
 * @param {import('./state.js').Context} ctx
 */
export function draftLandmarkCards(ctx) {
	const { state } = ctx;
	const players = state.seats.filter((s) => s.kind === 'player');
	const count = players.length;
	const at = players.findIndex((s) => s.seat === state.first);
	const drafters = players.map(
		(_, i) => players[(at - 1 - i + 2 * count) % count].seat
	);
	// Alone, the other card's landmark goes to the Automa's box once #31 builds it; until then, under the deck.
	const cards = state.supply.landmarkCards.splice(0, count === 1 ? 2 : count);
	emit(state, {
		type: 'landmarkCardsDrawn',
		player: drafters[0],
		count: cards.length,
		secret: { landmarkCards: cards },
	});
	offerLandmarkCards(ctx, cards, drafters);
}

/**
 * Offers the cards left to the next drafter: a choice of several, the last card kept without a question, and any
 * card nobody is left to keep under the deck.
 * @param {import('./state.js').Context} ctx
 * @param {string[]} cards
 * @param {number[]} drafters - The players still to keep one, in order
 */
export function offerLandmarkCards(ctx, cards, drafters) {
	const [player, ...rest] = drafters;
	if (player === undefined || cards.length === 0) {
		ctx.state.supply.landmarkCards.push(...cards);
		return;
	}
	if (cards.length === 1) {
		keepLandmarkCard(ctx, player, cards[0], true);
		offerLandmarkCards(ctx, [], rest);
		return;
	}
	ctx.push([
		{ player, kind: 'chooseLandmarkCard', options: cards, drafters: rest },
	]);
}

/**
 * A player keeps a landmark card, face up for everyone to see.
 * @param {import('./state.js').Context} ctx
 * @param {number} player
 * @param {string} card
 * @param {boolean} auto - The only card left, kept without a question
 */
export function keepLandmarkCard(ctx, player, card, auto) {
	playerSeat(ctx.state, player).landmarkCard = { card, gained: false };
	emit(ctx.state, { type: 'landmarkCardKept', player, card, auto });
}

/**
 * At the end of a player's turn, the final income turn's too (R111): if their landmark card's goal is met and its
 * landmark not yet gained, they must gain it and place it. Gives the operations that do so, or none.
 * @param {import('./state.js').State} state - Changed: the card is marked gained, its landmark leaves the supply
 * @param {number} player
 * @returns {import('./state.js').NewOperation[]}
 */
export function landmarkCardOps(state, player) {
	if (!isPlayerSeat(state, player)) {
		return [];
	}
	const seat = playerSeat(state, player);
	const held = seat.landmarkCard;
	if (!held || held.gained || !landmarkGoal(seat, held.card).met) {
		return [];
	}
	held.gained = true;
	const { landmark } = landmarkCard(held.card);
	emit(state, { type: 'landmarkCardGoalMet', player, card: held.card });
	const at = state.landmarks.indexOf(landmark);
	if (at === -1) {
		emit(state, { type: 'noLandmarkLeft', player, landmark });
		return [];
	}
	state.landmarks.splice(at, 1);
	emit(state, { type: 'landmarkGained', player, landmark, card: held.card });
	return [
		{
			player,
			kind: 'placeLandmark',
			landmark,
			source: { landmarkCard: held.card },
		},
		...triggered(state, 'landmarkGained', {
			player,
			landmark,
			fromTrack: false,
		}),
	];
}
