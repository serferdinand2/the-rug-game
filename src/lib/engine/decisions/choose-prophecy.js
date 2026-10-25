// The Mystics' prediction for one category at setup: a number among those offered (02 §1.2).
import { PlayerError } from '../errors.js';
import { predict } from '../civs/mystics.js';

/** @type {import('../state.js').DecisionKind} */
export const chooseProphecy = {
	hidden: [],
	answers(state, decision) {
		return decision.options.map((/** @type {number} */ value) => ({
			value,
		}));
	},
	check(state, decision, answer) {
		if (!decision.options.includes(answer.value)) {
			throw new PlayerError('Choose one of the numbers offered.');
		}
	},
	resolve(ctx, decision, answer) {
		predict(
			ctx,
			/** @type {number} */ (decision.player),
			decision.category,
			answer.value
		);
	},
};
