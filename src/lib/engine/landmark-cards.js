// Landmark cards (#32; 03 §1.2): the draft as setup ends, and the goal that gains a card's landmark at the end of a turn.
import { emit } from './events.js';
import { isPlayerSeat, playerSeat } from './state.js';
import { triggered } from './abilities.js';
import {
	cityPlots,
	completeDistricts,
	completeLines,
	seatShape,
} from './city.js';
import { controlledTerritories } from './control.js';
import { spacesAdvanced, TIER_FIRST_SPACES } from './movement.js';
import { hexNeighbours } from './data/maps.js';
import { landmarkCard, landmarkCardsFor } from './data/landmark-cards.js';

/** @typedef {import('./state.js').PlayerSeat} PlayerSeat */
/** @typedef {import('./data/landmark-cards.js').GoalKind} GoalKind */

/**
 * What a goal reads of a seat, of the state or of a view.
 * @typedef {Pick<PlayerSeat, 'seat' | 'tech' | 'capital' | 'territoryTiles' | 'tracks' | 'restartedTracks' | 'start'>} GoalSeat
 */

/**
 * What a goal reads of the game beyond the seat: the map's control for the Bridge, the turn's moves for the Castle.
 * @typedef {Pick<import('./state.js').State, 'hexes' | 'takenTiers'>} GoalGame
 */

/**
 * How far a seat is towards a landmark card's goal. "In your capital city" is what stands on the mat's grid (R13).
 * @param {GoalSeat} seat - A seat of the state or of a view
 * @param {string} card - The landmark card's id
 * @param {GoalGame} [game] - The state or a view; the Bridge's and the Castle's goals need it
 * @returns {{ have: number, need: number, met: boolean }}
 * @throws {Error} Without the game for a goal that reads it (a bug)
 */
export function landmarkGoal(seat, card, game) {
	const { kind, need } = landmarkCard(card).goal;
	const have = goalCount(seat, kind, game);
	return { have, need, met: have >= need };
}

/**
 * The game, for a goal that reads it.
 * @param {GoalGame | undefined} game
 * @param {GoalKind} kind
 * @returns {GoalGame}
 */
function needGame(game, kind) {
	if (!game) {
		throw new Error(`The ${kind} goal needs the game.`);
	}
	return game;
}

/**
 * What a goal counts for a seat. "Invented" is every tech card the seat holds, in any row; "advancement tracks" are
 * every track in play, the arts track too (R118); "your starting territory" is where the seat's two outposts started.
 * @param {GoalSeat} seat
 * @param {GoalKind} kind
 * @param {GoalGame} [game]
 * @returns {number}
 */
function goalCount(seat, kind, game) {
	if (kind === 'topTech') {
		return seat.tech.top.length;
	}
	if (kind === 'inventedTech') {
		const { bottom, middle, top } = seat.tech;
		return bottom.length + middle.length + top.length;
	}
	if (kind === 'buildingTypes') {
		return new Set(seat.capital.buildings.map((b) => b.building)).size;
	}
	if (kind === 'tierTwoTracks') {
		const tracks = /** @type {import('./data/ids.js').TrackId[]} */ (
			Object.keys(seat.tracks)
		);
		return tracks.filter(
			(track) => spacesAdvanced(seat, track) >= TIER_FIRST_SPACES[0]
		).length;
	}
	if (kind === 'takenTier') {
		return needGame(game, kind).takenTiers.filter(
			(entry) => entry.player === seat.seat
		).length;
	}
	if (kind === 'startNeighbours') {
		const known = needGame(game, kind);
		if (seat.start === null) {
			return 0;
		}
		const controlled = controlledTerritories(known, seat.seat);
		return hexNeighbours(seat.start).filter((key) =>
			controlled.includes(key)
		).length;
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
	const shape = seatShape(/** @type {PlayerSeat} */ (seat));
	if (kind === 'districts') {
		return completeDistricts(plots, shape).length;
	}
	const { rows, columns } = completeLines(plots, shape);
	return rows + columns;
}

/**
 * How many landmark cards the draft deals: 2 alone, otherwise one per player, and one more when the game's cards come
 * from both Plans & Ploys and A&A, so the last drafter chooses from 2 (03 §1.2, §7).
 * @param {readonly string[]} expansions
 * @param {number} players
 * @returns {number}
 */
export function landmarkCardDeal(expansions, players) {
	if (players === 1) {
		return 2;
	}
	const from = new Set(landmarkCardsFor(expansions).map((c) => c.expansion));
	return players + (from.size > 1 ? 1 : 0);
}

/**
 * The after-setup step: the player going last draws the deal (landmarkCardDeal) and keeps one; the rest pass
 * counter-clockwise, each player before them in turn order keeping one, the first player last, and any card left goes
 * under the deck (03 §1.2).
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
	const cards = state.supply.landmarkCards.splice(
		0,
		landmarkCardDeal(state.expansions, count)
	);
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
 * At the end of a player's turn, the final income turn's too (R111): for each landmark card they hold whose goal is
 * met and whose landmark is not yet gained, they must gain it and place it: the drafted one, then those Infrastructure
 * Upgrade kept (#37). Gives the operations that do so, or none.
 * @param {import('./state.js').State} state - Changed: each card met is marked gained, its landmark leaves the supply
 * @param {number} player
 * @returns {import('./state.js').NewOperation[]}
 */
export function landmarkCardOps(state, player) {
	if (!isPlayerSeat(state, player)) {
		return [];
	}
	const seat = playerSeat(state, player);
	return [seat.landmarkCard, ...(seat.extraLandmarkCards ?? [])].flatMap(
		(held) =>
			held && !held.gained && landmarkGoal(seat, held.card, state).met
				? goalMet(state, player, held)
				: []
	);
}

/**
 * A landmark card's goal is met: the card is marked gained, and its landmark is gained and placed if nobody has it.
 * @param {import('./state.js').State} state
 * @param {number} player
 * @param {{ card: string, gained: boolean }} held
 * @returns {import('./state.js').NewOperation[]}
 */
function goalMet(state, player, held) {
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

/**
 * Infrastructure Upgrade: the player chooses a card of the face-down landmark deck and keeps it as a drafted one; with
 * none left, 10 VP (03 §2.5). The deck's cards stay the player's to see.
 * @type {import('./state.js').EffectHandler}
 */
export function infrastructureUpgrade(ctx, player) {
	const deck = ctx.state.supply.landmarkCards;
	if (deck.length === 0) {
		ctx.push([{ player, kind: 'effects', effects: [{ vp: 10 }] }]);
		return;
	}
	if (deck.length === 1) {
		takeLandmarkCard(ctx, player, deck[0]);
		return;
	}
	ctx.push([
		{
			player,
			kind: 'chooseLandmarkCard',
			options: [...deck],
			drafters: [],
			purpose: 'infrastructureUpgrade',
		},
	]);
}

/**
 * Takes a card out of the landmark deck and keeps it beside the drafted one (Infrastructure Upgrade, #37).
 * @param {import('./state.js').Context} ctx
 * @param {number} player
 * @param {string} card
 */
export function takeLandmarkCard(ctx, player, card) {
	const deck = ctx.state.supply.landmarkCards;
	deck.splice(deck.indexOf(card), 1);
	const seat = playerSeat(ctx.state, player);
	(seat.extraLandmarkCards ??= []).push({ card, gained: false });
	emit(ctx.state, { type: 'landmarkCardKept', player, card, auto: false });
}
