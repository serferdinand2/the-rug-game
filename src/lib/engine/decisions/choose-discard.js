// The decision to discard one hand card for VP, or to stop (Democracy).
import { PlayerError } from '../errors.js';
import { emit } from '../events.js';
import { playerSeat } from '../state.js';

/** @type {import('../state.js').DecisionKind} */
export const chooseDiscard = {
	// Only the player's own view holds `answers`, which come from the hand, so nothing else needs hiding.
	hidden: [],
	answers(state, decision) {
		const { hand } = playerSeat(
			state,
			/** @type {number} */ (decision.player)
		);
		return [{ card: null }, ...hand.map((card) => ({ card }))];
	},
	check(state, decision, answer) {
		const { hand } = playerSeat(
			state,
			/** @type {number} */ (decision.player)
		);
		if (answer.card !== null && !hand.includes(answer.card)) {
			throw new PlayerError(
				'Discard a tapestry card from your hand, or stop.'
			);
		}
	},
	resolve(ctx, decision, answer) {
		if (answer.card === null) {
			return;
		}
		const player = /** @type {number} */ (decision.player);
		const { state } = ctx;
		const { hand } = playerSeat(state, player);
		hand.splice(hand.indexOf(answer.card), 1);
		state.supply.tapestry.discard.push(answer.card);
		emit(state, {
			type: 'cardsDiscarded',
			player,
			deck: 'tapestry',
			cards: [answer.card],
		});
		ctx.push([
			{
				player,
				kind: 'effects',
				effects: [
					{ vp: decision.vpEach },
					{ discardTapestry: { vpEach: decision.vpEach } },
				],
				ordered: true,
			},
		]);
	},
};
