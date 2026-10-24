// The decision to pick which territory to conquer.
import { PlayerError } from '../errors.js';
import { conquerHex } from '../effects/conquer.js';
import { conquerTargets } from '../map.js';

/** @type {import('../state.js').DecisionKind} */
export const chooseConquer = {
	hidden: [],
	answers(state, decision) {
		return conquerTargets(
			state,
			/** @type {number} */ (decision.player),
			decision.anywhere === true
		).map((hex) => ({ hex }));
	},
	check(state, decision, answer) {
		if (
			!chooseConquer
				.answers(state, decision)
				.some((a) => a.hex === answer.hex)
		) {
			throw new PlayerError("You can't conquer there.");
		}
	},
	resolve(ctx, decision, answer) {
		conquerHex(
			ctx,
			/** @type {number} */ (decision.player),
			answer.hex,
			/** @type {any} */ (decision.bothDice)
		);
	},
};
