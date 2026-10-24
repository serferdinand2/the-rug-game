// The decision to pick which space tile to explore.
import { PlayerError } from '../errors.js';
import { exploreSpaceTile } from '../effects/explore.js';

/** @type {import('../state.js').DecisionKind} */
export const chooseSpaceTile = {
	hidden: [],
	answers(state, decision) {
		return /** @type {number[]} */ (decision.options).map((tile) => ({
			tile,
		}));
	},
	check(state, decision, answer) {
		if (
			!(/** @type {number[]} */ (decision.options).includes(answer.tile))
		) {
			throw new PlayerError('Choose one of the space tiles offered.');
		}
	},
	resolve(ctx, decision, answer) {
		exploreSpaceTile(
			ctx,
			/** @type {number} */ (decision.player),
			answer.tile
		);
	},
};
