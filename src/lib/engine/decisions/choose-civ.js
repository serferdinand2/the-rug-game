// Which of two civilizations to keep: the two dealt at setup, or the two drawn mid-game with civ-draft (#53).
import { PlayerError } from '../errors.js';
import { emit } from '../events.js';
import { playerSeat } from '../state.js';
import { gainDrawnCiv } from '../civ-turns.js';

/** @type {import('../state.js').DecisionKind} */
export const chooseCiv = {
	hidden: ['options'],
	answers(state, decision) {
		return decision.options.map((/** @type {string} */ civ) => ({ civ }));
	},
	check(state, decision, answer) {
		if (!decision.options.includes(answer.civ)) {
			throw new PlayerError(
				decision.midGame
					? 'Choose one of the two civilizations you drew.'
					: 'Choose one of the two civilizations you were dealt.'
			);
		}
	},
	resolve(ctx, decision, answer) {
		// Mid-game, the other goes face up onto the discards (#53 design §4.2).
		if (decision.midGame) {
			const player = /** @type {number} */ (decision.player);
			for (const civ of decision.options) {
				if (civ !== answer.civ) {
					ctx.state.supply.civDiscard.push(civ);
					emit(ctx.state, { type: 'civDiscarded', player, civ });
				}
			}
			gainDrawnCiv(ctx, player, answer.civ);
			return;
		}
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
