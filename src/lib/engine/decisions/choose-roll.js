// The decision of which of two science die results to use (Empiricism); the answer goes on to `then`.
import { PlayerError } from '../errors.js';

/** @type {import('../state.js').DecisionKind} */
export const chooseRoll = {
	hidden: [],
	answers(state, decision) {
		return decision.options.map(
			(/** @type {import('../data/ids.js').TrackId} */ track) => ({
				track,
			})
		);
	},
	check(state, decision, answer) {
		if (!decision.options.includes(answer.track)) {
			throw new PlayerError('Choose one of the two results.');
		}
	},
	resolve(ctx, decision, answer) {
		ctx.push([
			{ ...decision.then, player: decision.player, track: answer.track },
		]);
	},
};
