// The decision of which drawn tech card the Recyclers keep in the bottom row; the others are discarded (03 §1.3).
import { PlayerError } from '../errors.js';
import { keepTech } from '../civs/recyclers.js';

/** @type {import('../state.js').DecisionKind} */
export const chooseKeepTech = {
	// The cards drawn are the owner's to see until the others are discarded face up.
	hidden: ['options'],
	answers(state, decision) {
		return decision.options.map((/** @type {string} */ card) => ({ card }));
	},
	check(state, decision, answer) {
		if (!decision.options.includes(answer.card)) {
			throw new PlayerError('Keep one of the tech cards you drew.');
		}
	},
	resolve(ctx, decision, answer) {
		keepTech(
			ctx,
			/** @type {number} */ (decision.player),
			answer.card,
			decision.options.filter(
				(/** @type {string} */ card) => card !== answer.card
			)
		);
	},
};
