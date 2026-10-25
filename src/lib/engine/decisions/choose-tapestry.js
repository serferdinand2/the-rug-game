// The decision of which tapestry card from the hand goes onto an era's slot: income step 2 (01 §4.2), or a card on top (design §7).
import { PlayerError } from '../errors.js';
import { playerSeat } from '../state.js';
import { playTapestry } from '../tapestry.js';

/** @type {import('../state.js').DecisionKind} */
export const chooseTapestry = {
	// The options are cards from the hand, which only its player may see.
	hidden: ['options'],
	answers(state, decision) {
		const { hand } = playerSeat(
			state,
			/** @type {number} */ (decision.player)
		);
		return [
			...(decision.optional ? [{ card: null }] : []),
			...decision.options
				.filter((/** @type {string} */ card) => hand.includes(card))
				.map((/** @type {string} */ card) => ({ card })),
		];
	},
	check(state, decision, answer) {
		const { hand } = playerSeat(
			state,
			/** @type {number} */ (decision.player)
		);
		const offered =
			answer.card === null
				? decision.optional === true
				: decision.options.includes(answer.card) &&
					hand.includes(answer.card);
		if (!offered) {
			throw new PlayerError(
				'Play one of the tapestry cards in your hand.'
			);
		}
	},
	resolve(ctx, decision, answer) {
		if (answer.card === null) {
			return;
		}
		const player = /** @type {number} */ (decision.player);
		const seat = playerSeat(ctx.state, player);
		seat.hand.splice(seat.hand.indexOf(answer.card), 1);
		// Pushed first, so it waits under the card's ability.
		if (decision.afterPlay?.length) {
			ctx.push([
				{
					player,
					kind: 'effects',
					effects: structuredClone(decision.afterPlay),
					ordered: true,
				},
			]);
		}
		playTapestry(ctx, player, answer.card, decision.era);
	},
};
