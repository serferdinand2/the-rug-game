// The decision of which civilization's step-1 ability comes next, when several fire on one income turn (01 §4.2).
import { PlayerError } from '../errors.js';
import { useCivAbility } from '../civ-turns.js';

/** @type {import('../state.js').DecisionKind} */
export const chooseCivAbility = {
	hidden: [],
	answers(state, decision) {
		return decision.options.map((/** @type {string} */ civ) => ({ civ }));
	},
	check(state, decision, answer) {
		if (!decision.options.includes(answer.civ)) {
			throw new PlayerError('Choose which civilization to use next.');
		}
	},
	resolve(ctx, decision, answer) {
		useCivAbility(
			ctx,
			/** @type {number} */ (decision.player),
			answer.civ,
			decision.turn,
			decision.done
		);
	},
};
