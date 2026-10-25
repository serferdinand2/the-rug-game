// The decision to pick a tech card to invent, or to refresh the display first.
import { PlayerError } from '../errors.js';
import { inventAnswers, inventCard } from '../effects/tech.js';

/** @type {import('../state.js').DecisionKind} */
export const chooseInvent = {
	hidden: [],
	answers(state, decision) {
		return inventAnswers(state, {
			refresh: decision.refresh === true,
		});
	},
	check(state, decision, answer) {
		const found = chooseInvent
			.answers(state, decision)
			.some(
				(a) => a.card === answer.card && a.refresh === answer.refresh
			);
		if (!found) {
			throw new PlayerError("You can't invent that card.");
		}
	},
	resolve(ctx, decision, answer) {
		inventCard(
			ctx,
			/** @type {number} */ (decision.player),
			{ card: answer.card, refresh: answer.refresh },
			/** @type {number} */ (decision.left),
			decision.invent ?? {}
		);
	},
};
