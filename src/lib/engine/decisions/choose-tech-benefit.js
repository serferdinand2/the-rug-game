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
		// Technomancy picks 2 (#40): the next pick comes after this card's benefit, from the cards left.
		if (decision.count > 1) {
			const options = decision.options.filter(
				(/** @type {string} */ card) => card !== answer.card
			);
			ctx.push([
				{
					player: decision.player,
					kind: 'chooseTechBenefit',
					icon: decision.icon,
					options,
					count: decision.count - 1,
				},
			]);
		}
		useTechBenefit(
			ctx,
			/** @type {number} */ (decision.player),
			answer.card,
			decision.icon
		);
	},
};
