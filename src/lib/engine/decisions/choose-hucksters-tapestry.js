// Hucksters: an item in their public pool may replace a tapestry gained on your advance turn.
import { PlayerError } from '../errors.js';
import { playerSeat } from '../state.js';
import { emit } from '../events.js';
import { triggered } from '../abilities.js';
import { psionic } from '../civs/psionics.js';
import { drawTapestry } from '../effects/gain.js';
import { huckstersOffers, takeHuckstersOffer } from '../automa-expansion-pp.js';

/** An optional replacement for a pending tapestry gain, or null when none is available.
 * For a draft, count is the number of deck cards offered to keep one.
 * @param {import('../state.js').State} state @param {number} player @param {number} count @param {number | undefined} keep
 * @returns {import('../state.js').NewOperation | null}
 */
export function huckstersTapestryOffer(state, player, count, keep) {
	if (count < 1 || huckstersOffers(state, player, 'tapestry').length === 0)
		return null;
	return {
		player,
		kind: 'chooseHuckstersTapestry',
		count,
		...(keep !== undefined && { keep }),
	};
}

/** @type {import('../state.js').DecisionKind} */
export const chooseHuckstersTapestry = {
	hidden: [],
	answers(state, decision) {
		const player = /** @type {number} */ (decision.player);
		const deck = state.supply.tapestry;
		const pool = huckstersOffers(state, player, 'tapestry');
		return [
			...(deck.deck.length || deck.discard.length || pool.length === 0
				? [{ card: null }]
				: []),
			...pool.map((offer) => ({
				card: offer.item,
				owner: offer.player,
			})),
		];
	},
	check(state, decision, answer) {
		if (
			!chooseHuckstersTapestry
				.answers(state, decision)
				.some(
					(a) =>
						a.card === answer.card &&
						(a.card === null || a.owner === answer.owner)
				)
		)
			throw new PlayerError(
				'Take a face-up Hucksters tapestry, or draw from the deck.'
			);
	},
	resolve(ctx, decision, answer) {
		const player = /** @type {number} */ (decision.player);
		const remaining = decision.keep !== undefined ? 0 : decision.count - 1;
		/** @type {import('../state.js').NewOperation[]} */
		const next = [];
		if (answer.card !== null) {
			if (
				!takeHuckstersOffer(
					ctx.state,
					player,
					answer.owner,
					'tapestry',
					answer.card
				)
			)
				throw new PlayerError(
					'That Hucksters card is no longer available.'
				);
			playerSeat(ctx.state, player).hand.push(answer.card);
			emit(ctx.state, {
				type: 'cardsDrawn',
				player,
				count: 1,
				secret: { cards: [answer.card] },
			});
			next.push(
				...triggered(ctx.state, 'tapestryGained', {
					player,
					cards: [answer.card],
				})
			);
		} else {
			const sample = psionic(ctx.state, player);
			const draws =
				decision.keep !== undefined
					? decision.count + Number(sample)
					: sample
						? 2
						: 1;
			const cards = drawTapestry(ctx, player, draws);
			if ((sample || decision.keep !== undefined) && cards.length > 1)
				next.push({
					player,
					kind: 'chooseKeep',
					options: cards,
					keep: 1,
				});
			else if (cards.length)
				next.push(
					...triggered(ctx.state, 'tapestryGained', { player, cards })
				);
		}
		if (remaining > 0)
			next.push({
				player,
				kind: 'huckstersTapestryContinue',
				count: remaining,
			});
		ctx.push(next);
	},
};

/** Continue a multiple-card gain after each individual choice has resolved. */
/** @type {import('../state.js').AutomaticKind} */
export function huckstersTapestryContinue(ctx, op) {
	const player = /** @type {number} */ (op.player);
	const offer = huckstersTapestryOffer(
		ctx.state,
		player,
		op.count,
		undefined
	);
	if (offer) {
		ctx.push([offer]);
		return;
	}
	// Once the pool is empty, use the usual gain effect for everything left.
	ctx.push([
		{
			player,
			kind: 'effects',
			effects: [{ gain: { tapestry: op.count } }],
		},
	]);
}
