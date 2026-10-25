// The decision of which opponent's track space to gain the benefit of (Trade Economy).
import { PlayerError } from '../errors.js';
import { tradeSpace } from '../effects/cards.js';

/** @typedef {{ player: number, track: import('../data/ids.js').TrackId, space: number }} Space - `player` owns the token there */

/** @type {import('../state.js').DecisionKind} */
export const chooseSpace = {
	hidden: [],
	answers(state, decision) {
		return decision.options.map((/** @type {Space} */ o) => ({
			player: o.player,
			track: o.track,
			space: o.space,
		}));
	},
	check(state, decision, answer) {
		const offered = decision.options.some(
			(/** @type {Space} */ o) =>
				o.player === answer.player &&
				o.track === answer.track &&
				o.space === answer.space
		);
		if (!offered) {
			throw new PlayerError('Choose one of the spaces offered.');
		}
	},
	resolve(ctx, decision, answer) {
		tradeSpace(ctx, /** @type {number} */ (decision.player), {
			player: answer.player,
			track: answer.track,
			space: answer.space,
		});
	},
};
