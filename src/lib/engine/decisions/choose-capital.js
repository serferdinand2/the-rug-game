// The setup decision on the small map: which of the two dealt capital city mats to keep.
import { PlayerError } from '../errors.js';
import { emit } from '../events.js';
import { playerSeat } from '../state.js';

/** @type {import('../state.js').DecisionKind} */
export const chooseCapital = {
	hidden: [],
	answers(state, decision) {
		return decision.options.map((/** @type {number} */ capital) => ({
			capital,
		}));
	},
	check(state, decision, answer) {
		if (!decision.options.includes(answer.capital)) {
			throw new PlayerError('Choose one of your two capital city mats.');
		}
	},
	resolve(ctx, decision, answer) {
		playerSeat(
			ctx.state,
			/** @type {number} */ (decision.player)
		).picks.capital = answer.capital;
		emit(ctx.state, {
			type: 'capitalChosen',
			player: decision.player,
			secret: { capital: answer.capital },
		});
	},
};
