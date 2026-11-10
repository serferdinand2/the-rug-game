// The Genies' wish (F&F, #40): the circled benefit an opponent picks, or the Genies' own on income turn 5.
import { PlayerError } from '../errors.js';
import { grantWish } from '../civs/genies.js';

/** @type {import('../state.js').DecisionKind} */
export const chooseWish = {
	hidden: [],
	answers(state, decision) {
		return decision.options.map((/** @type {string} */ circle) => ({
			circle,
		}));
	},
	check(state, decision, answer) {
		if (!decision.options.includes(answer.circle)) {
			throw new PlayerError('Choose one of the wishes offered.');
		}
	},
	resolve(ctx, decision, answer) {
		grantWish(ctx, decision, answer.circle);
	},
};
