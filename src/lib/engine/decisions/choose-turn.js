// The decision a player faces at the start of their turn: an income turn or an advance turn.
import { PlayerError } from '../errors.js';

/**
 * The turns a seat may choose; the first turn must be an income turn (01 §4.1).
 * @param {{ incomeTurns: number }} seat
 * @returns {string[]}
 */
export function turnOptions(seat) {
	return seat.incomeTurns === 0 ? ['income'] : ['income', 'advance'];
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
			throw new PlayerError('Your first turn must be an income turn.');
		}
		if (!decision.options.includes(answer.turn)) {
			throw new PlayerError('Choose an income turn or an advance turn.');
		}
	},
	resolve() {
		throw new Error(
			'Advance turns arrive with #14 and income turns with #15.'
		);
	},
};
