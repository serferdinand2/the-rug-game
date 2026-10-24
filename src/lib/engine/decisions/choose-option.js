// The decision for a choice effect: which one of its options to take.
import { PlayerError } from '../errors.js';
import { isIndexOf } from './choose-order.js';

/** @type {import('../state.js').DecisionKind} */
export const chooseOption = {
	hidden: [],
	answers(state, decision) {
		return decision.options.map(
			(/** @type {object[]} */ _, /** @type {number} */ i) => ({
				option: i,
			})
		);
	},
	check(state, decision, answer) {
		if (!isIndexOf(answer.option, decision.options)) {
			throw new PlayerError('Choose one of the options.');
		}
	},
	resolve(ctx, decision, answer) {
		ctx.push([
			{
				player: decision.player,
				kind: 'effects',
				effects: decision.options[answer.option],
				ordered: true,
				source: decision.source,
			},
		]);
	},
};
