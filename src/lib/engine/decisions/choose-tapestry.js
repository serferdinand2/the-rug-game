// The decision of income step 2: which tapestry card from the hand goes onto the era's slot (01 §4.2).
import { PlayerError } from '../errors.js';
import { emit } from '../events.js';
import { playerSeat } from '../state.js';

/** @type {import('../state.js').DecisionKind} */
export const chooseTapestry = {
	// The options are the hand, which only its player may see.
	hidden: ['options'],
	answers(state, decision) {
		return decision.options.map((/** @type {string} */ card) => ({ card }));
	},
	check(state, decision, answer) {
		if (!decision.options.includes(answer.card)) {
			throw new PlayerError(
				'Play one of the tapestry cards in your hand.'
			);
		}
	},
	resolve(ctx, decision, answer) {
		const player = /** @type {number} */ (decision.player);
		const seat = playerSeat(ctx.state, player);
		seat.hand.splice(seat.hand.indexOf(answer.card), 1);
		seat.incomeMat.tapestry[decision.era - 1].push(answer.card);
		emit(ctx.state, {
			type: 'tapestryPlayed',
			player,
			era: decision.era,
			card: answer.card,
			faceDown: false,
		});
		ctx.push([
			{
				player,
				kind: 'tapestryAbility',
				card: answer.card,
				era: decision.era,
			},
		]);
	},
};
