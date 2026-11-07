// The decision of which income row gets an inspiration tile (#35, 03 §2.8).
import { PlayerError } from '../errors.js';
import { placeInspiration } from '../effects/arts.js';

/** @type {import('../state.js').DecisionKind} */
export const chooseInspire = {
	hidden: [],
	// The options were read when it was asked: the rows without a tile, in income-mat order.
	answers(state, decision) {
		return decision.options.map((/** @type {string} */ row) => ({ row }));
	},
	check(state, decision, answer) {
		if (!decision.options.includes(answer.row)) {
			throw new PlayerError(
				'Choose an income row without an inspiration tile.'
			);
		}
	},
	resolve(ctx, decision, answer) {
		placeInspiration(
			ctx,
			/** @type {number} */ (decision.player),
			answer.row
		);
	},
};
