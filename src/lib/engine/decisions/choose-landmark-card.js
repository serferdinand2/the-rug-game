// The decision of which landmark card to keep in the draft as setup ends, the rest passing on (#32; 03 §1.2), or to take from the landmark deck (Infrastructure Upgrade, #37).
import { PlayerError } from '../errors.js';
import {
	keepLandmarkCard,
	offerLandmarkCards,
	takeLandmarkCard,
} from '../landmark-cards.js';

/** @type {import('../state.js').DecisionKind} */
export const chooseLandmarkCard = {
	// The cards offered are the drafter's to see; the next players only learn what reaches them.
	hidden: ['options'],
	answers(state, decision) {
		return decision.options.map((/** @type {string} */ card) => ({ card }));
	},
	check(state, decision, answer) {
		if (!decision.options.includes(answer.card)) {
			throw new PlayerError(
				'Keep one of the landmark cards you were offered.'
			);
		}
	},
	resolve(ctx, decision, answer) {
		// Infrastructure Upgrade takes it from the deck; the others stay there (#37).
		if (
			decision.purpose === 'infrastructureUpgrade' ||
			decision.purpose === 'urbanPlanners'
		) {
			takeLandmarkCard(
				ctx,
				/** @type {number} */ (decision.player),
				answer.card
			);
			return;
		}
		keepLandmarkCard(
			ctx,
			/** @type {number} */ (decision.player),
			answer.card,
			false
		);
		offerLandmarkCards(
			ctx,
			decision.options.filter(
				(/** @type {string} */ c) => c !== answer.card
			),
			decision.drafters
		);
	},
};
