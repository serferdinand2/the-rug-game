// The decision of which masterpiece to create: a face-up card or the deck's top card (#35, 03 §2.7).
import { PlayerError } from '../errors.js';
import { takeMasterpiece } from '../masterpieces.js';

/** @type {import('../state.js').DecisionKind} */
export const chooseCreate = {
	hidden: [],
	// The options were read when it was asked (createOptions): the face-up cards, then 'deck'.
	answers(state, decision) {
		return decision.options.map((/** @type {string} */ card) => ({ card }));
	},
	check(state, decision, answer) {
		if (!decision.options.includes(answer.card)) {
			throw new PlayerError('Choose a face-up masterpiece or the deck.');
		}
	},
	resolve(ctx, decision, answer) {
		takeMasterpiece(
			ctx,
			/** @type {number} */ (decision.player),
			answer.card
		);
	},
};
