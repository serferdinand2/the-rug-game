// The decision for a choice effect: which one of its options to take.
import { PlayerError } from '../errors.js';
import { isIndexOf } from './choose-order.js';
import { buildingsOut, noneLeftMessage } from '../effects/building.js';

/**
 * The options that can be picked: each but one that would only gain buildings none of which is left (R117). When that
 * is every option, they all stay, so the question can still be answered; the choice effect asks nothing then.
 * @param {import('../state.js').State} state
 * @param {import('../state.js').Operation} decision
 * @returns {number[]}
 */
function pickable(state, decision) {
	/** @type {number[]} */
	const all = decision.options.map(
		(/** @type {object[]} */ _, /** @type {number} */ i) => i
	);
	const left = all.filter(
		(i) =>
			buildingsOut(
				state,
				/** @type {number} */ (decision.player),
				decision.options[i]
			) === null
	);
	return left.length > 0 ? left : all;
}

/** @type {import('../state.js').DecisionKind} */
export const chooseOption = {
	hidden: [],
	answers(state, decision) {
		return pickable(state, decision).map((i) => ({ option: i }));
	},
	check(state, decision, answer) {
		if (!isIndexOf(answer.option, decision.options)) {
			throw new PlayerError('Choose one of the options.');
		}
		if (!pickable(state, decision).includes(answer.option)) {
			throw new PlayerError(
				noneLeftMessage(
					/** @type {string[]} */ (
						buildingsOut(
							state,
							/** @type {number} */ (decision.player),
							decision.options[answer.option]
						)
					)
				)
			);
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
				...(decision.passive && { passive: true }),
			},
		]);
	},
};
