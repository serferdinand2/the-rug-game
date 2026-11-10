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
			pushOtherwise(ctx, player, decision.otherwise, decision.source);
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
			// What follows a trade made, such as the Utilitarians marking their Lighthouse used (#33).
			...(decision.then
				? [{ ...structuredClone(decision.then), player }]
				: []),
		]);
	},
};

/**
 * What a trade not made gives instead, if anything (Moon Landing's invent, #37).
 * @param {import('../state.js').Context} ctx
 * @param {number} player
 * @param {import('../data/effects.js').Effect[] | undefined} otherwise
 * @param {unknown} source
 */
export function pushOtherwise(ctx, player, otherwise, source) {
	if (otherwise === undefined) {
		return;
	}
	ctx.push([
		{
			player,
			kind: 'effects',
			effects: structuredClone(otherwise),
			...(source !== undefined && { source }),
		},
	]);
}
