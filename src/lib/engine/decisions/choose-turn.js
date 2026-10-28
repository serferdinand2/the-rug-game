// The decision a player faces at the start of their turn: an income turn or an advance turn.
import { PlayerError } from '../errors.js';
import { emit } from '../events.js';
import { advances } from './choose-advance.js';
import { startIncomeTurn } from '../income.js';

/**
 * The turns a seat may choose. There is no pass: advancing is offered only when some advance can be paid for
 * (01 §4.1). The first turn is never a choice, since startTurn() takes income turn 1 itself (#77).
 * @param {import('../state.js').State} state
 * @param {number} player
 * @returns {('income' | 'advance')[]}
 */
export function turnOptions(state, player) {
	return advances(state, player).length > 0
		? ['income', 'advance']
		: ['income'];
}

/** @type {import('../state.js').DecisionKind} */
export const chooseTurn = {
	hidden: [],
	answers(state, decision) {
		return decision.options.map((/** @type {string} */ turn) => ({ turn }));
	},
	check(state, decision, answer) {
		if (
			answer.turn === 'advance' &&
			!decision.options.includes('advance')
		) {
			throw new PlayerError(
				"You can't pay for any advance, so take an income turn."
			);
		}
		if (!decision.options.includes(answer.turn)) {
			throw new PlayerError('Choose an income turn or an advance turn.');
		}
	},
	resolve(ctx, decision, answer) {
		const player = /** @type {number} */ (decision.player);
		emit(ctx.state, { type: 'turnChosen', player, turn: answer.turn });
		if (answer.turn === 'income') {
			startIncomeTurn(ctx, player);
			return;
		}
		ctx.push([{ player, kind: 'chooseAdvance' }]);
	},
};
