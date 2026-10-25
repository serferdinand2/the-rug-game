// The decision to take one of a card's trades, paying its cost (Guilds, Olympic Host).
import { PlayerError } from '../errors.js';
import { emit } from '../events.js';
import { canPay, checkPayment, pay, payments } from '../payment.js';

/** @type {import('../state.js').DecisionKind} */
export const chooseTrade = {
	hidden: [],
	answers(state, decision) {
		const player = /** @type {number} */ (decision.player);
		/** @type {Record<string, any>[]} */
		const found = decision.optional ? [{ offer: null }] : [];
		decision.offers.forEach(
			(/** @type {any} */ offer, /** @type {number} */ i) => {
				for (const payment of payments(state, player, offer.pay)) {
					found.push({ offer: i, pay: payment });
				}
			}
		);
		return found;
	},
	check(state, decision, answer) {
		const player = /** @type {number} */ (decision.player);
		if (answer.offer === null && decision.optional) {
			return;
		}
		const offer = Number.isInteger(answer.offer)
			? decision.offers[answer.offer]
			: undefined;
		if (!offer || !canPay(state, player, offer.pay)) {
			throw new PlayerError('Choose one of the trades offered.');
		}
		checkPayment(state, player, offer.pay, answer.pay);
	},
	resolve(ctx, decision, answer) {
		const player = /** @type {number} */ (decision.player);
		if (answer.offer === null) {
			return;
		}
		const offer = decision.offers[answer.offer];
		pay(ctx, player, answer.pay);
		emit(ctx.state, {
			type: 'tradeMade',
			player,
			offer: answer.offer,
			...(decision.host !== undefined && { host: decision.host }),
		});
		ctx.push([
			{
				player,
				kind: 'effects',
				effects: structuredClone(offer.gain),
				ordered: true,
				source: decision.source,
			},
		]);
	},
};
