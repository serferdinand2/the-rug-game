// Starting and ending a turn: the turn choice, passing to the next seat, and the end of the game.
import { emit } from './events.js';
import { turnOptions } from './decisions/choose-turn.js';
import { rankPlayers } from './ranking.js';
import { liftBlocks } from './abilities.js';
import { startIncomeTurn } from './income.js';
import { seatOf } from './state.js';
import { landmarkCardOps } from './landmark-cards.js';
import { startBotTurn, sharedShadow } from './automa.js';

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
	ctx.push([
		{ player, kind: 'chooseTurn', options: turnOptions(state, player) },
	]);
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
 * First, a player whose landmark card's goal is met gains its landmark, and the turn ends after it is placed (#32, R111).
 * @type {import('./state.js').AutomaticKind}
 */
export function endTurn(ctx, op) {
	const gain = landmarkCardOps(ctx.state, /** @type {number} */ (op.player));
	if (gain.length > 0) {
		ctx.push([...gain, { player: op.player, kind: 'endTurn' }]);
		return;
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
		if (!next.finished && !sharedShadow(ctx.state, next.seat)) {
			startTurn(ctx, next.seat);
			return;
		}
		liftBlocks(ctx, next.seat);
	}
	endGame(ctx);
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
