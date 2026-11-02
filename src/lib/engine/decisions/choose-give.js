// The Advisors' decision to give a neighbour a tapestry card from their hand, or to decline (#33; 03 §1.3).
import { PlayerError } from '../errors.js';
import { playerSeat } from '../state.js';
import { giveAnswered } from '../civs/advisors.js';

/**
 * Two questions share this kind, both answered `{ card }`, null declining. Instead of a card the neighbour `to` would
 * draw on their advance turn, any card in hand may be given. Of the Advisors' new cards when gained mid-game (`cards`,
 * hidden: they are the Advisors' own), one may be given for `vp` VP; the neighbours in `after` are asked next.
 * Asking reveals nothing, as any card may be given (#17); with no card to give, only the decline is left, and
 * declineOnly() (table.js) lets the server answer it.
 * @type {import('../state.js').DecisionKind}
 */
export const chooseGive = {
	hidden: ['cards'],
	answers(state, decision) {
		const { hand } = playerSeat(
			state,
			/** @type {number} */ (decision.player)
		);
		/** @type {string[] | undefined} */
		const cards = decision.cards;
		const offered = cards
			? hand.filter((card) => cards.includes(card))
			: hand;
		return [{ card: null }, ...offered.map((card) => ({ card }))];
	},
	check(state, decision, answer) {
		const offered = chooseGive
			.answers(state, decision)
			.some((a) => a.card === answer.card);
		if (!offered) {
			throw new PlayerError(
				decision.cards
					? 'Give one of the tapestry cards you just drew, or decline.'
					: 'Give a tapestry card from your hand, or let them draw.'
			);
		}
	},
	resolve(ctx, decision, answer) {
		giveAnswered(ctx, decision, answer.card);
	},
};
