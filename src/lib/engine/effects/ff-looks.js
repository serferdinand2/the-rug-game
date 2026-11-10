// Fantasies & Futures' cards that ask other players, look at hands and decks, or guess (03 FF.4.3, #40): High Council,
// Superpower Regulators, Soothsaying, Dream Monitors and Good Omens.
import { emit } from '../events.js';
import { playerSeat, seatOf } from '../state.js';
import { takeTapestryCard } from './gain.js';
import { benefitOps } from '../movement.js';
import { artsInPlay, tracksOf } from '../tracks-in-play.js';
import {
	buildingSpots,
	cityPlots,
	completeDistricts,
	seatShape,
} from '../city.js';
import { payDistricts } from '../placing.js';
import { tapestryCard } from '../data/tapestry-cards.js';

/**
 * The players in turn order from `player`, the player first.
 * @param {import('../state.js').State} state
 * @param {number} player
 * @returns {number[]}
 */
function fromPlayer(state, player) {
	const seats = state.seats
		.filter((s) => s.kind === 'player')
		.map((s) => s.seat);
	const at = seats.indexOf(player);
	return [...seats.slice(at), ...seats.slice(0, at)];
}

/**
 * High Council: starting with its player, each player holding any tapestry card is asked whether to reveal a response
 * card for 1 resource of their choice, so nobody learns who holds one (#17, R140); then 10 VP if an opponent revealed
 * one, else an income building of the player's choice (03 FF.4.3 #17).
 * @type {import('../state.js').EffectHandler}
 */
export function highCouncil(ctx, player, value, op) {
	ctx.push([
		{
			player,
			kind: 'councilAsk',
			owner: player,
			order: fromPlayer(ctx.state, player),
			revealed: 0,
			source: op.source,
		},
	]);
}

/**
 * Asks the next player in High Council's order who holds a card, or rewards its player once all are asked.
 * @type {import('../state.js').AutomaticKind}
 */
export function councilAsk(ctx, op) {
	const [next, ...rest] = op.order;
	if (next === undefined) {
		ctx.push([
			{
				player: op.owner,
				kind: 'effects',
				effects: op.revealed > 0 ? [{ vp: 10 }] : [{ anyBuilding: {} }],
				source: op.source,
			},
		]);
		return;
	}
	const { id: _id, batch: _batch, ...kept } = op;
	const following = { ...kept, order: rest };
	if (playerSeat(ctx.state, next).hand.length === 0) {
		ctx.push([following]);
		return;
	}
	ctx.push([
		{
			player: next,
			kind: 'chooseCouncil',
			owner: op.owner,
			then: following,
		},
	]);
}

/**
 * The response cards a player may reveal for High Council.
 * @param {import('../state.js').State} state
 * @param {number} player
 * @returns {string[]}
 */
export function councilCards(state, player) {
	return playerSeat(state, player).hand.filter(
		(card) => tapestryCard(card).response !== undefined
	);
}

/**
 * Superpower Regulators: every opponent reveals the charmed cards in their hand; the player gains both charms of up to 2
 * of them, or 9 VP (R84). The opponents keep their cards.
 * @type {import('../state.js').EffectHandler}
 */
export function superpowerRegulators(ctx, player, value, op) {
	const { state } = ctx;
	const options = state.seats
		.filter((s) => s.kind === 'player' && s.seat !== player)
		.flatMap((s) =>
			playerSeat(state, s.seat).hand.filter(
				(card) => tapestryCard(card).charms
			)
		);
	emit(state, { type: 'charmsRevealed', player, cards: [...options] });
	if (options.length === 0) {
		ctx.push([
			{
				player,
				kind: 'effects',
				effects: [{ vp: 9 }],
				source: op.source,
			},
		]);
		return;
	}
	ctx.push([
		{
			player,
			kind: 'chooseRegulated',
			options,
			picked: 0,
			source: op.source,
		},
	]);
}

/**
 * Gains both charms of a card revealed for Superpower Regulators.
 * @param {import('../state.js').Context} ctx
 * @param {number} player
 * @param {string} card
 */
export function gainBothCharms(ctx, player, card) {
	const charms = tapestryCard(card).charms ?? {};
	const sides = /** @type {const} */ (['left', 'right']).filter(
		(side) => charms[side]
	);
	// Named now, as the card is picked, while it is still shown: its holder keeps it in hand.
	for (const side of sides) {
		emit(ctx.state, { type: 'charmGained', player, card, side });
	}
	ctx.push([
		{
			player,
			kind: 'effects',
			effects: sides.flatMap((side) =>
				structuredClone(charms[side] ?? [])
			),
			ordered: true,
			// The card whose ability this is: naming the opponent's card here would show it while it waits (#40).
			source: { tapestry: 'superpower-regulators', card: null },
		},
	]);
}

/**
 * Soothsaying: reveal 5 tapestry cards; for each with a charm, gain 1 resource of your choice and 2 VP, then give it to
 * an opponent of your choice (R139); discard the others (03 FF.4.3 #31). Soothsaying itself stays.
 * @type {import('../state.js').EffectHandler}
 */
export function soothsaying(ctx, player, value, op) {
	const { state } = ctx;
	/** @type {string[]} */
	const cards = [];
	while (cards.length < 5) {
		const card = takeTapestryCard(ctx);
		if (card === undefined) {
			break;
		}
		cards.push(card);
	}
	const charmed = cards.filter((card) => tapestryCard(card).charms);
	const discarded = cards.filter((card) => !charmed.includes(card));
	// The charmed ones go to opponents, so the log names only the discards (final review).
	emit(state, {
		type: 'tapestryRevealed',
		player,
		cards: [...cards],
		discarded: [...discarded],
	});
	state.supply.tapestry.discard.push(...discarded);
	const opponents = state.seats
		.filter((s) => s.kind === 'player' && s.seat !== player)
		.map((s) => s.seat);
	ctx.push(
		charmed.flatMap((card) => [
			{
				player,
				kind: 'effects',
				effects: [{ gain: { any: 1 } }, { vp: 2 }],
				ordered: true,
				source: op.source,
			},
			{ player, kind: 'chooseRecipient', card, options: opponents },
		])
	);
}

/**
 * Gives a card Soothsaying revealed to an opponent's hand, or discards it with none to take it.
 * @param {import('../state.js').Context} ctx
 * @param {number} player
 * @param {string} card
 * @param {number | null} to
 */
export function giveRevealed(ctx, player, card, to) {
	if (to === null) {
		ctx.state.supply.tapestry.discard.push(card);
		return;
	}
	playerSeat(ctx.state, to).hand.push(card);
	emit(ctx.state, { type: 'cardGiven', player, to, card });
}

/**
 * Dream Monitors: a player token into an open plot of the capital, filling it as an income building would (R78), and 2
 * resources of your choice when a house is beside it, diagonally included (03 FF.4.3 #8).
 * @type {import('../state.js').EffectHandler}
 */
export function dreamMonitors(ctx, player, value, op) {
	const seat = playerSeat(ctx.state, player);
	if (seat.capital.mat === null) {
		return;
	}
	const options = buildingSpots(seat).map(({ row, col }) => ({ row, col }));
	if (options.length === 0) {
		emit(ctx.state, { type: 'noPlot', player });
		return;
	}
	ctx.push([
		{
			player,
			kind: 'choosePlot',
			purpose: 'dreamMonitors',
			options,
			source: op.source,
		},
	]);
}

/**
 * Puts a player's token on a plot of a capital: its own (Dream Monitors) or, later, an opponent's (the Weefolk). The
 * plot is filled, so the districts it completes pay their owner.
 * @param {import('../state.js').Context} ctx
 * @param {number} owner - Whose capital
 * @param {number} token - Whose token
 * @param {{ row: number, col: number }} plot
 * @returns {import('../state.js').NewOperation[]} What follows: the districts' rewards
 */
export function placeCapitalToken(ctx, owner, token, { row, col }) {
	const seat = playerSeat(ctx.state, owner);
	const before = completeDistricts(cityPlots(seat), seatShape(seat));
	(seat.capital.tokens ??= []).push({ row, col, seat: token });
	emit(ctx.state, {
		type: 'capitalTokenPlaced',
		player: token,
		owner,
		row,
		col,
	});
	return payDistricts(ctx, owner, before);
}

/**
 * Whether a house stands beside a plot of a seat's capital, diagonally included.
 * @param {import('../state.js').PlayerSeat} seat
 * @param {{ row: number, col: number }} plot
 * @returns {boolean}
 */
export function houseBeside(seat, { row, col }) {
	return seat.capital.buildings.some(
		(b) =>
			b.building === 'house' &&
			Math.abs(b.row - row) <= 1 &&
			Math.abs(b.col - col) <= 1 &&
			(b.row !== row || b.col !== col)
	);
}

/**
 * Whether Good Omens works for a player: it tops one of their era slots, face up (CONTINUOUS, #37).
 * @param {import('../state.js').State} state
 * @param {number} player
 * @returns {boolean}
 */
export function omensWork(state, player) {
	const found = seatOf(state, player);
	if (found.kind !== 'player') {
		return false;
	}
	const { tapestry, faceDown } = playerSeat(state, player).incomeMat;
	return tapestry.some(
		(slot) =>
			slot.at(-1) === 'good-omens' && !faceDown.includes('good-omens')
	);
}

/**
 * The tracks a Good Omens guess may name: the faces of the science die in play (03 FF.4.3 #13).
 * @param {import('../state.js').State} state
 * @returns {import('../data/ids.js').TrackId[]}
 */
export function guessOptions(state) {
	return tracksOf(state);
}

/**
 * After a roll, records a right Good Omens guess for the turn's end; the first right one counts (Mike Young, R138).
 * @param {import('../state.js').State} state
 * @param {number} player
 * @param {readonly string[]} rolled - The faces rolled
 */
export function checkGuess(state, player, rolled) {
	const omen = (state.omens ?? []).find((o) => o.player === player);
	if (!omen || omen.hit || omen.guess === undefined) {
		return;
	}
	if (rolled.includes(omen.guess)) {
		omen.hit = omen.guess;
		emit(state, { type: 'omenCome', player, track: omen.guess });
	}
	delete omen.guess;
}

/**
 * The rewards of the right Good Omens guesses at a turn's end: 1 VP per arts space advanced (none without the arts
 * track, R81) and the benefit of the guessed track's 4th space, once a turn. The record is cleared.
 * @param {import('../state.js').State} state - Changed: the record is emptied
 * @returns {import('../state.js').NewOperation[]}
 */
export function omenRewards(state) {
	if (state.omens === undefined) {
		return [];
	}
	const hits = state.omens.filter((o) => o.hit);
	state.omens = [];
	return hits.flatMap(({ player, hit }) => [
		...(artsInPlay(state)
			? [
					{
						player,
						kind: 'effects',
						effects: [{ vp: { per: 'trackSpace', track: 'arts' } }],
						source: { tapestry: 'good-omens' },
					},
				]
			: []),
		...benefitOps(state, player, /** @type {any} */ (hit), 4),
	]);
}
