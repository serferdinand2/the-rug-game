// The decision of which current track space to repeat, for Academic Research.
import { PlayerError } from '../errors.js';
import { activationOps } from '../movement.js';

/** @typedef {{ track: import('../data/ids.js').TrackId, space: number }} Spot */

/** @type {import('../state.js').DecisionKind} */
export const chooseRepeat = {
	hidden: [],
	answers(state, decision) {
		return decision.options.map((/** @type {Spot} */ o) => ({
			track: o.track,
			space: o.space,
		}));
	},
	check(state, decision, answer) {
		const offered = decision.options.some(
			(/** @type {Spot} */ o) =>
				o.track === answer.track && o.space === answer.space
		);
		if (!offered) {
			throw new PlayerError('Choose one of the spaces you can repeat.');
		}
	},
	resolve(ctx, decision, answer) {
		const player = /** @type {number} */ (decision.player);
		ctx.push(activationOps(ctx, player, answer.track, answer.space));
	},
};
