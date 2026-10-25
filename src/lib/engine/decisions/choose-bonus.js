// The optional bonus of a track space: offered after its benefit, when the player can pay, and paid at most once.
import { PlayerError } from '../errors.js';
import { emit } from '../events.js';
import { canPay, checkPayment, pay, payments } from '../payment.js';
import { seatOf } from '../state.js';
import { TRACKS } from '../data/tracks.js';

/**
 * Offers a space's bonus, but only when the player can pay for it: a bonus nobody can take asks nothing.
 * A `free` bonus costs nothing (Renaissance, Trade Economy's owner). A finished player is offered nothing (01 §4.3).
 * @type {import('../state.js').AutomaticKind}
 */
export function offerBonus(ctx, op) {
	const player = /** @type {number} */ (op.player);
	const bonus =
		TRACKS[/** @type {import('../data/ids.js').TrackId} */ (op.track)][
			op.space
		].bonus;
	if (!bonus || seatOf(ctx.state, player).finished) {
		return;
	}
	const cost = op.free ? {} : bonus.pay;
	if (!canPay(ctx.state, player, cost)) {
		return;
	}
	ctx.push([
		{
			player,
			kind: 'chooseBonus',
			track: op.track,
			space: op.space,
			cost: structuredClone(cost),
			gain: structuredClone(bonus.gain),
		},
	]);
}

/** @type {import('../state.js').DecisionKind} */
export const chooseBonus = {
	hidden: [],
	answers(state, decision) {
		return [
			{ pay: null },
			...payments(
				state,
				/** @type {number} */ (decision.player),
				decision.cost
			).map((payment) => ({ pay: payment })),
		];
	},
	check(state, decision, answer) {
		if (answer.pay === null) {
			return;
		}
		if (answer.pay === undefined) {
			throw new PlayerError('Pay for the bonus, or decline it.');
		}
		checkPayment(
			state,
			/** @type {number} */ (decision.player),
			decision.cost,
			answer.pay
		);
	},
	resolve(ctx, decision, answer) {
		if (answer.pay === null) {
			return;
		}
		const player = /** @type {number} */ (decision.player);
		pay(ctx, player, answer.pay);
		emit(ctx.state, {
			type: 'bonusPaid',
			player,
			track: decision.track,
			space: decision.space,
		});
		ctx.push([
			{
				player,
				kind: 'effects',
				effects: decision.gain,
				ordered: true,
				source: { track: decision.track, space: decision.space },
			},
		]);
	},
};
