// The decision of which visible tapestry card Espionage copies.
import { PlayerError } from '../errors.js';
import { copyAbility } from '../effects/tapestry.js';

/** @type {import('../state.js').DecisionKind} */
export const chooseCopy = {
	hidden: [],
	answers(state, decision) {
		return decision.options.map(
			(/** @type {{ player: number, card: string }} */ o) => ({ ...o })
		);
	},
	check(state, decision, answer) {
		if (!offered(decision, answer)) {
			throw new PlayerError('Choose one of the tapestry cards offered.');
		}
	},
	resolve(ctx, decision, answer) {
		const copied = /** @type {{ player: number, card: string }} */ (
			offered(decision, answer)
		);
		copyAbility(
			ctx,
			/** @type {number} */ (decision.player),
			decision.espionage,
			copied.card
		);
	},
};

/**
 * The option an answer names: the same player's same card.
 * @param {import('../state.js').Operation} decision
 * @param {import('../state.js').Answer} answer
 * @returns {{ player: number, card: string } | undefined}
 */
function offered(decision, answer) {
	return decision.options.find(
		(/** @type {{ player: number, card: string }} */ o) =>
			o.player === answer.player && o.card === answer.card
	);
}
