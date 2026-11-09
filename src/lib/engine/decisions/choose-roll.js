// The decision of which science die result to use: Empiricism's two, or the arts track with Artistic Inspiration (#37); the answer goes on to `then`.
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
			throw new PlayerError(
				decision.options.length === 2
					? 'Choose one of the two results.'
					: 'Choose one of the results.'
			);
		}
	},
	resolve(ctx, decision, answer) {
		ctx.push([
			{ ...decision.then, player: decision.player, track: answer.track },
		]);
	},
};
