// The defender's response question after a conquest: play a response card, or decline (01 §7.4; R21, R108; #33).
import { PlayerError } from '../errors.js';
import { emit } from '../events.js';
import { playerSeat } from '../state.js';
import { diceOp, playResponse, responseCards } from '../responses.js';

/** @type {import('../state.js').DecisionKind} */
export const chooseResponse = {
	hidden: [],
	answers(state, decision) {
		const defender = playerSeat(
			state,
			/** @type {number} */ (decision.player)
		);
		return [
			{ card: null },
			...responseCards(
				state,
				defender.seat,
				/** @type {number} */ (decision.attacker),
				/** @type {string} */ (decision.hex)
			).map((card) => ({ card })),
		];
	},
	check(state, decision, answer) {
		if (
			!chooseResponse
				.answers(state, decision)
				.some((a) => a.card === answer.card)
		) {
			throw new PlayerError("You can't play that card as a response.");
		}
	},
	resolve(ctx, decision, answer) {
		const state = ctx.state;
		const player = /** @type {number} */ (decision.player);
		const attacker = /** @type {number} */ (decision.attacker);
		const hex = /** @type {string} */ (decision.hex);
		const both = decision.both === true;
		if (answer.card === null) {
			emit(state, { type: 'responseDeclined', player, hex });
			ctx.push([diceOp(attacker, hex, both)]);
			return;
		}
		const seat = playerSeat(state, player);
		seat.hand.splice(seat.hand.indexOf(answer.card), 1);
		state.supply.tapestry.discard.push(answer.card);
		emit(state, {
			type: 'responsePlayed',
			player,
			hex,
			card: answer.card,
			attacker,
		});
		playResponse(ctx, {
			defender: player,
			attacker,
			hex,
			card: answer.card,
			both,
		});
	},
};
