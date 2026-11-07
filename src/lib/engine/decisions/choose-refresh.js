// The decision whether to refresh the 3 face-up masterpieces (Rock Opera, #35, 03 §2.3).
import { PlayerError } from '../errors.js';
import { refreshFaceUp } from '../masterpieces.js';

/** @type {import('../state.js').DecisionKind} */
export const chooseRefresh = {
	hidden: [],
	// Keeping them comes first: the answer that changes nothing.
	answers() {
		return [{ refresh: false }, { refresh: true }];
	},
	check(state, decision, answer) {
		if (typeof answer.refresh !== 'boolean') {
			throw new PlayerError('Refresh the masterpieces or keep them.');
		}
	},
	resolve(ctx, decision, answer) {
		if (answer.refresh) {
			refreshFaceUp(ctx, /** @type {number} */ (decision.player));
		}
	},
};
