// The decisions of what Fantasies & Futures' cards reserve (#39): 1 of the space tiles or masterpieces drawn, or a tech card.
import { PlayerError } from '../errors.js';
import { keepReserved, reserveTech } from '../effects/reserved.js';

/** @type {import('../state.js').DecisionKind} */
export const chooseReserve = {
	// The tiles or masterpieces drawn are their player's to see; the others go back to their stack unseen.
	hidden: ['options'],
	answers(state, decision) {
		return decision.options.map((/** @type {number | string} */ item) => ({
			item,
		}));
	},
	check(state, decision, answer) {
		if (!decision.options.includes(answer.item)) {
			throw new PlayerError('Keep one of the items you drew.');
		}
	},
	resolve(ctx, decision, answer) {
		keepReserved(
			ctx,
			/** @type {number} */ (decision.player),
			{ card: decision.card, ability: decision.ability },
			decision.stack,
			answer.item,
			decision.options.filter(
				(/** @type {number | string} */ item) => item !== answer.item
			)
		);
	},
};

/** @type {import('../state.js').DecisionKind} */
export const chooseReserveTech = {
	hidden: [],
	answers(state, decision) {
		return decision.options.map((/** @type {string} */ card) => ({ card }));
	},
	check(state, decision, answer) {
		if (!decision.options.includes(answer.card)) {
			throw new PlayerError(
				'Take a face-up tech card or the top of the deck.'
			);
		}
	},
	resolve(ctx, decision, answer) {
		reserveTech(
			ctx,
			/** @type {number} */ (decision.player),
			{ card: decision.card, ability: decision.ability },
			answer.card
		);
	},
};
