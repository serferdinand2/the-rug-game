// The setup decision: which of the two dealt civilizations to keep.
import { PlayerError } from '../errors.js';
import { emit } from '../events.js';
import { playerSeat } from '../state.js';

/** @type {import('../state.js').DecisionKind} */
export const chooseCiv = {
	hidden: ['options'],
	answers(state, decision) {
		return decision.options.map((/** @type {string} */ civ) => ({ civ }));
	},
	check(state, decision, answer) {
		if (!decision.options.includes(answer.civ)) {
			throw new PlayerError(
				'Choose one of the two civilizations you were dealt.'
			);
		}
	},
	resolve(ctx, decision, answer) {
		playerSeat(
			ctx.state,
			/** @type {number} */ (decision.player)
		).picks.civ = answer.civ;
		// Only the count of the civilization deck is ever public, so the other card joins it now.
		for (const civ of decision.options) {
			if (civ !== answer.civ) {
				ctx.state.supply.civs.push(civ);
			}
		}
		emit(ctx.state, {
			type: 'civChosen',
			player: decision.player,
			secret: { civ: answer.civ },
		});
	},
};
