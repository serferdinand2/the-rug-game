// The decision of which drawn tapestry card to keep; the others are discarded (the tapestry-draft variant, #53).
import { PlayerError } from '../errors.js';
import { emit } from '../events.js';
import { playerSeat } from '../state.js';
import { triggered } from '../abilities.js';

/** @type {import('../state.js').DecisionKind} */
export const chooseKeep = {
	hidden: ['options'],
	answers(state, decision) {
		return decision.options.map((/** @type {string} */ card) => ({ card }));
	},
	check(state, decision, answer) {
		if (!decision.options.includes(answer.card)) {
			throw new PlayerError('Keep one of the cards you drew.');
		}
	},
	// The card kept is the one gained, so only it triggers what gaining a tapestry card triggers (design §4.1).
	resolve(ctx, decision, answer) {
		const { state } = ctx;
		const player = /** @type {number} */ (decision.player);
		const { hand } = playerSeat(state, player);
		const others = decision.options.filter(
			(/** @type {string} */ card) => card !== answer.card
		);
		for (const card of others) {
			hand.splice(hand.indexOf(card), 1);
		}
		state.supply.tapestry.discard.push(...others);
		emit(state, {
			type: 'cardsDiscarded',
			player,
			deck: 'tapestry',
			cards: others,
		});
		ctx.push(
			triggered(state, 'tapestryGained', { player, cards: [answer.card] })
		);
	},
};
