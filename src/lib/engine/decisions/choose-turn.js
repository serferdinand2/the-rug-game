// The decision a player faces at the start of their turn: an income turn or an advance turn.
import { PlayerError } from '../errors.js';
import { emit } from '../events.js';
import { seatOf } from '../state.js';
import { advances } from './choose-advance.js';

/**
 * The turns a seat may choose. The first turn must be an income turn, and there is no pass:
 * advancing is offered only when some advance can be paid for (01 §4.1).
 * @param {import('../state.js').State} state
 * @param {number} player
 * @returns {('income' | 'advance')[]}
 */
export function turnOptions(state, player) {
	if (seatOf(state, player).incomeTurns === 0) {
		return ['income'];
	}
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
			const player = /** @type {number} */ (decision.player);
			if (seatOf(state, player).incomeTurns === 0) {
				throw new PlayerError(
					'Your first turn must be an income turn.'
				);
			}
			throw new PlayerError(
				"You can't pay for any advance, so take an income turn."
			);
		}
		if (!decision.options.includes(answer.turn)) {
			throw new PlayerError('Choose an income turn or an advance turn.');
		}
	},
	resolve(ctx, decision, answer) {
		if (answer.turn === 'income') {
			throw new Error('Income turns arrive with #15.');
		}
		emit(ctx.state, {
			type: 'turnChosen',
			player: decision.player,
			turn: answer.turn,
		});
		ctx.push([{ player: decision.player, kind: 'chooseAdvance' }]);
	},
};
