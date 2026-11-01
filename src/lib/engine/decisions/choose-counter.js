// The attacker's question after a trap (#33; 03 §1.2, §1.4): counter it with Double Cross or Stolen Plans, or let it act.
import { PlayerError } from '../errors.js';
import { emit } from '../events.js';
import { playerSeat } from '../state.js';
import { counterCards, playCounter, springTrap } from '../responses.js';

/** @type {import('../state.js').DecisionKind} */
export const chooseCounter = {
	hidden: [],
	answers(state, decision) {
		return [
			{ card: null },
			...counterCards(state, /** @type {number} */ (decision.player)).map(
				(card) => ({ card })
			),
		];
	},
	check(state, decision, answer) {
		if (
			!chooseCounter
				.answers(state, decision)
				.some((a) => a.card === answer.card)
		) {
			throw new PlayerError("You can't play that card against a trap.");
		}
	},
	resolve(ctx, decision, answer) {
		const state = ctx.state;
		const attacker = /** @type {number} */ (decision.player);
		const defender = /** @type {number} */ (decision.defender);
		const hex = /** @type {string} */ (decision.hex);
		const both = decision.both === true;
		if (answer.card === null) {
			emit(state, { type: 'counterDeclined', player: attacker, hex });
			springTrap(ctx, defender, attacker, hex, both);
			return;
		}
		const seat = playerSeat(state, attacker);
		seat.hand.splice(seat.hand.indexOf(answer.card), 1);
		state.supply.tapestry.discard.push(answer.card);
		emit(state, {
			type: 'counterPlayed',
			player: attacker,
			card: answer.card,
			defender,
			hex,
		});
		playCounter(ctx, { attacker, defender, hex, card: answer.card, both });
	},
};
