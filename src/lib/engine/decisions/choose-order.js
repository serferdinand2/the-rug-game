// The decision of which part of an "any order" benefit comes next, when the order can matter (01 §3.1, step 4).
import { PlayerError } from '../errors.js';

/**
 * Whether an answer names one of a list's indexes.
 * @param {unknown} index
 * @param {unknown[]} list
 * @returns {boolean}
 */
export function isIndexOf(index, list) {
	return (
		Number.isInteger(index) &&
		/** @type {number} */ (index) >= 0 &&
		/** @type {number} */ (index) < list.length
	);
}

/** @type {import('../state.js').DecisionKind} */
export const chooseOrder = {
	hidden: [],
	answers(state, decision) {
		return decision.effects.map(
			(/** @type {object} */ _, /** @type {number} */ i) => ({
				effect: i,
			})
		);
	},
	check(state, decision, answer) {
		if (!isIndexOf(answer.effect, decision.effects)) {
			throw new PlayerError(
				'Choose which part of the benefit comes next.'
			);
		}
	},
	resolve(ctx, decision, answer) {
		const { player, effects, source } = decision;
		ctx.push([
			{
				player,
				kind: 'effects',
				effects: [effects[answer.effect]],
				ordered: true,
				source,
			},
			{
				player,
				kind: 'effects',
				effects: effects.filter(
					(/** @type {object} */ _, /** @type {number} */ i) =>
						i !== answer.effect
				),
				ordered: false,
				source,
			},
		]);
	},
};
