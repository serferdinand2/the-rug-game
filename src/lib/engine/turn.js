// Starting and ending a turn: the turn choice, passing to the next seat, and the end of the game.
import { emit } from './events.js';
import { turnOptions } from './decisions/choose-turn.js';
import { rankPlayers } from './ranking.js';

/**
 * Starts a seat's turn: nothing is activated yet (R19), and the turn choice sits above the turn's end.
 * @param {import('./state.js').Context} ctx
 * @param {number} player
 */
export function startTurn(ctx, player) {
	const { state } = ctx;
	state.current = player;
	state.activated.length = 0;
	state.usedThisTurn.length = 0;
	emit(state, { type: 'turnStarted', player });
	ctx.push([
		{ player, kind: 'chooseTurn', options: turnOptions(state, player) },
		{ player, kind: 'endTurn' },
	]);
}

/**
 * Ends a turn once everything it started is done: the next seat in seat order that hasn't finished takes its turn,
 * and when every seat has finished, the game ends.
 * @type {import('./state.js').AutomaticKind}
 */
export function endTurn(ctx, op) {
	const { seats } = ctx.state;
	const at = seats.findIndex((s) => s.seat === op.player);
	for (let step = 1; step <= seats.length; step++) {
		const next = seats[(at + step) % seats.length];
		if (!next.finished) {
			startTurn(ctx, next.seat);
			return;
		}
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
	state.result = rankPlayers(state);
	emit(state, { type: 'gameEnded', result: state.result });
}
