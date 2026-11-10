// The Artificers' pick on an income turn (F&F, #40): a row's building set aside or slid, or income turn 5's choice.
import { PlayerError } from '../errors.js';
import { artifice } from '../civs/artificers.js';

/** @type {import('../state.js').DecisionKind} */
export const chooseArtifice = {
	hidden: [],
	answers(state, decision) {
		return decision.options.map((/** @type {any} */ o) => ({ ...o }));
	},
	check(state, decision, answer) {
		const offered = decision.options.some(
			(/** @type {any} */ o) =>
				o.act === answer.act && o.row === answer.row
		);
		if (!offered) {
			throw new PlayerError('Choose one of the Artificers’ options.');
		}
	},
	resolve(ctx, decision, answer) {
		artifice(
			ctx,
			/** @type {number} */ (decision.player),
			/** @type {any} */ (answer)
		);
	},
};
