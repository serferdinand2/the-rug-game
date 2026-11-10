// Starting and ending a turn: the turn choice, passing to the next seat, and the end of the game.
import { emit } from './events.js';
import { turnOptions } from './decisions/choose-turn.js';
import { rankPlayers } from './ranking.js';
import { liftBlocks, triggered } from './abilities.js';
import { startIncomeTurn } from './income.js';
import { seatOf } from './state.js';
import { landmarkCardOps } from './landmark-cards.js';
import { startBotTurn, sharedShadow } from './automa.js';
import { omenRewards } from './effects/ff-looks.js';
import { spymasterAdvances } from './spymaster.js';
import { playOnOptions } from './civs/elder-ones.js';
import { endEra } from './tapestry.js';

/**
 * Starts a seat's turn: its Dictatorship blocks lift (R26), nothing is activated yet (R19) nor locked by Ceramics, no tier entered for the Castle (#35), and the turn choice sits above the turn's end, which the player confirms first on a turn they chose (#146).
 * A player's first turn must be income turn 1 (01 §4.1), so it starts at once, with nobody asked (#77).
 * The turn has no kind until it is chosen (`turnKind`, #33).
 * @param {import('./state.js').Context} ctx
 * @param {number} player
 */
export function startTurn(ctx, player) {
	const { state } = ctx;
	liftBlocks(ctx, player);
	state.current = player;
	state.turn += 1;
	state.turnKind = null;
	state.activated.length = 0;
	state.usedThisTurn.length = 0;
	state.lockedTech.length = 0;
	state.takenTiers.length = 0;
	emit(state, { type: 'turnStarted', player });
	const seat = seatOf(state, player);
	if (seat.kind !== 'player') {
		startBotTurn(ctx, player);
		return;
	}
	if (seat.kind === 'player' && seat.incomeTurns === 0) {
		state.turnKind = 'income';
		emit(state, { type: 'turnChosen', player, turn: 'income' });
		// The income turn goes on top of the turn's end. Nobody chose it, so it waits for no confirmation (#146).
		ctx.push([{ player, kind: 'endTurn' }]);
		startIncomeTurn(ctx, player);
		return;
	}
	// Pushed apart, so the confirmation isn't in the turn choice's batch and opens only once the turn is done (#146).
	ctx.push(endOf(state, player));
	// The Elder Ones and the Merfolk after income turn 5: only their own turns (03 FF.3); endTurn skips a seat with none.
	if (playingOn(seat)) {
		ctx.push([
			{
				player,
				kind: 'chooseTurn',
				options: playOnOptions(state, player),
			},
		]);
		return;
	}
	// A&A's Urban Planners may first place the landmarks they kept (R130); the turn choice then sees the result.
	if (storedLandmarks(state, player)) {
		ctx.push([
			{ player, kind: 'plannersOffer' },
			{ player, kind: 'askTurn' },
		]);
		return;
	}
	askTurn(ctx, { id: 0, batch: 0, player, kind: 'askTurn' });
}

/**
 * Asks the player which turn to take, from what they can do now.
 * @type {import('./state.js').AutomaticKind}
 */
export function askTurn(ctx, op) {
	const player = /** @type {number} */ (op.player);
	ctx.push([
		{ player, kind: 'chooseTurn', options: turnOptions(ctx.state, player) },
	]);
}

/**
 * Whether a player holds landmarks on the Urban Planners' mat (#37).
 * @param {import('./state.js').State} state
 * @param {number} player
 * @returns {boolean}
 */
function storedLandmarks(state, player) {
	const seat = seatOf(state, player);
	return (
		seat.kind === 'player' &&
		/** @type {import('./state.js').PlayerSeat} */ (seat).civData[
			'urban-planners'
		]?.stored.length > 0
	);
}

/**
 * The operations that close a turn: the player's confirmation first when the table asks for one (#146), then `endTurn`.
 * @param {import('./state.js').State} state
 * @param {number} player
 * @returns {import('./state.js').NewOperation[]}
 */
function endOf(state, player) {
	return state.confirmEnd
		? [
				{ player, kind: 'confirmEndTurn' },
				{ player, kind: 'endTurn' },
			]
		: [{ player, kind: 'endTurn' }];
}

/**
 * Ends a turn once everything it started is done: the next seat in seat order that hasn't finished takes its turn,
 * and when every seat has finished, the game ends. A finished seat's Dictatorship blocks lift as it is skipped (R26).
 * First, a player whose landmark card's goal is met gains its landmark, and the turn ends after it is placed (#32, R111);
 * then each played Spymaster's advance (A&A, R127); then, once, what answers the turn's end (`turnEnding`, #37).
 * @type {import('./state.js').AutomaticKind}
 */
export function endTurn(ctx, op) {
	// Pushed again after what comes first, keeping whether the turn-end triggers already ran.
	const again = {
		player: op.player,
		kind: 'endTurn',
		...(op.ended === true && { ended: true }),
	};
	const gain = landmarkCardOps(ctx.state, /** @type {number} */ (op.player));
	if (gain.length > 0) {
		ctx.push([...gain, again]);
		return;
	}
	// A&A's Spymaster: the advance comes at the end of the turn its track was completed in (R127).
	const spied = spymasterAdvances(ctx.state);
	if (spied.length > 0) {
		ctx.push([...spied, again]);
		return;
	}
	// F&F's Good Omens: a right guess this turn is rewarded at its end (#40).
	const omens = omenRewards(ctx.state);
	if (omens.length > 0) {
		ctx.push([...omens, again]);
		return;
	}
	// What answers a turn's end (the Relentless, #37), once a turn.
	if (op.ended !== true) {
		const ending = triggered(ctx.state, 'turnEnding', {
			player: /** @type {number} */ (op.player),
		});
		if (ending.length > 0) {
			ctx.push([...ending, { ...again, ended: true }]);
			return;
		}
	}
	const { seats } = ctx.state;
	// Standalone Shadow has no income turns and stops with the last human. Solo Shadow shares Automa's turn.
	if (
		!seats.some((s) => s.kind === 'automa') &&
		seats.filter((s) => s.kind === 'player').every((s) => s.finished)
	) {
		for (const seat of seats.filter((s) => s.kind === 'shadow'))
			seat.finished = true;
	}
	const at = seats.findIndex((s) => s.seat === op.player);
	for (let step = 1; step <= seats.length; step++) {
		const next = seats[(at + step) % seats.length];
		if (playingOn(next) && !next.finished) {
			stopPlayingOn(ctx, next.seat);
		}
		if (!next.finished && !sharedShadow(ctx.state, next.seat)) {
			startTurn(ctx, next.seat);
			return;
		}
		liftBlocks(ctx, next.seat);
	}
	endGame(ctx);
}

/**
 * Whether a seat is a player playing on after income turn 5 (the Elder Ones, the Merfolk, #40).
 * @param {import('./state.js').Seat | import('./state.js').PlayerSeat} seat
 * @returns {boolean}
 */
function playingOn(seat) {
	return (
		seat.kind === 'player' &&
		/** @type {import('./state.js').PlayerSeat} */ (seat).playingOn === true
	);
}

/**
 * A seat playing on after income turn 5 with no turn left to take finishes, and its era-4 card's ability ends with it
 * (03 FF.3, DQ 8: not by choice; R150).
 * @param {import('./state.js').Context} ctx
 * @param {number} player
 */
function stopPlayingOn(ctx, player) {
	if (playOnOptions(ctx.state, player).length > 0) {
		return;
	}
	endEra(ctx, player);
	const seat = seatOf(ctx.state, player);
	seat.finished = true;
	emit(ctx.state, { type: 'playerFinished', player });
}

/**
 * Ends the game once every seat has finished: the players are ranked, and the ranking explains each tie (R10, R11).
 * @param {import('./state.js').Context} ctx
 */
function endGame(ctx) {
	const { state } = ctx;
	state.phase = 'over';
	state.current = null;
	state.turnKind = null;
	state.result = rankPlayers(state);
	emit(state, { type: 'gameEnded', result: state.result });
}
