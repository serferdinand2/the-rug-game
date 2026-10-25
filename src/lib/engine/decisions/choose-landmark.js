// The decision to pick a track landmark nobody owns (Dystopia).
import { PlayerError } from '../errors.js';
import { gainTrackLandmark } from '../effects/cards.js';

/** @type {import('../state.js').DecisionKind} */
export const chooseLandmark = {
	hidden: [],
	answers(state, decision) {
		return decision.options.map((/** @type {string} */ landmark) => ({
			landmark,
		}));
	},
	check(state, decision, answer) {
		if (!decision.options.includes(answer.landmark)) {
			throw new PlayerError('Choose one of the landmarks offered.');
		}
	},
	resolve(ctx, decision, answer) {
		gainTrackLandmark(
			ctx,
			/** @type {number} */ (decision.player),
			answer.landmark
		);
	},
};
