// The Merfolk's questions (F&F, #40): a card put away (submerged, or discarded down to 5), and a turn after income
// turn 5 (a WHEN PLAYED card onto the era-4 stack, or cards discarded for 5 VP each, DQ 16, 17).
import { PlayerError } from '../errors.js';
import { emit } from '../events.js';
import { playerSeat } from '../state.js';
import { putAway } from '../civs/merfolk.js';
import { playTapestry } from '../tapestry.js';
import { tapestryCard } from '../data/tapestry-cards.js';

/** @type {import('../state.js').DecisionKind} */
export const choosePutAway = {
	hidden: [],
	answers(state, decision) {
		return playerSeat(
			state,
			/** @type {number} */ (decision.player)
		).hand.map((card) => ({ card }));
	},
	check(state, decision, answer) {
		if (
			!playerSeat(
				state,
				/** @type {number} */ (decision.player)
			).hand.includes(answer.card)
		) {
			throw new PlayerError('Choose a card from your hand.');
		}
	},
	resolve(ctx, decision, answer) {
		putAway(
			ctx,
			/** @type {number} */ (decision.player),
			answer.card,
			decision.keep,
			decision.purpose
		);
	},
};

/** @type {import('../state.js').DecisionKind} */
export const chooseMerfolkTurn = {
	hidden: [],
	answers(state, decision) {
		const { hand } = playerSeat(
			state,
			/** @type {number} */ (decision.player)
		);
		return [
			// Only a card with a WHEN PLAYED ability is played; a trap has one (DQ 17).
			...hand
				.filter((card) => tapestryCard(card).timing === 'played')
				.map((card) => ({ play: card })),
			...hand.map((card) => ({ discard: card })),
		];
	},
	check(state, decision, answer) {
		const ok = chooseMerfolkTurn
			.answers(state, decision)
			.some(
				(a) => a.play === answer.play && a.discard === answer.discard
			);
		if (!ok) {
			throw new PlayerError(
				'Play a When Played card, or discard a card.'
			);
		}
	},
	resolve(ctx, decision, answer) {
		const player = /** @type {number} */ (decision.player);
		const seat = playerSeat(ctx.state, player);
		if (answer.play) {
			seat.hand.splice(seat.hand.indexOf(answer.play), 1);
			emit(ctx.state, {
				type: 'merfolkPlayed',
				player,
				card: answer.play,
			});
			// Onto the era-4 stack: its left charm as usual, a reserved item at once (03 FF.3).
			playTapestry(ctx, player, answer.play, 4);
			return;
		}
		// At least one card for 5 VP; more may follow, each for 5 VP (DQ 16).
		seat.hand.splice(seat.hand.indexOf(answer.discard), 1);
		ctx.state.supply.tapestry.discard.push(answer.discard);
		emit(ctx.state, {
			type: 'cardsDiscarded',
			player,
			deck: 'tapestry',
			cards: [answer.discard],
		});
		ctx.push([
			{
				player,
				kind: 'effects',
				effects: [{ vp: 5 }, { discardTapestry: { vpEach: 5 } }],
				ordered: true,
				origin: 'civ',
			},
		]);
	},
};
