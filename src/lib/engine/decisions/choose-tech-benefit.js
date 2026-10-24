// The decision to pick which middle-row or top-row tech card gives its benefit.
import { PlayerError } from '../errors.js';
import { useTechBenefit } from '../effects/tech.js';

/** @type {import('../state.js').DecisionKind} */
export const chooseTechBenefit = {
	hidden: [],
	answers(_state, decision) {
		return decision.options.map((/** @type {string} */ card) => ({
			card,
		}));
	},
	check(state, decision, answer) {
		if (
			!chooseTechBenefit
				.answers(state, decision)
				.some((a) => a.card === answer.card)
		) {
			throw new PlayerError('Choose one of the cards offered.');
		}
	},
	resolve(ctx, decision, answer) {
		useTechBenefit(
			ctx,
			/** @type {number} */ (decision.player),
			answer.card,
			decision.icon
		);
	},
};
