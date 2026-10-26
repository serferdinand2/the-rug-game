// The optional bonus of a track space: offered after its benefit, when the player can pay, and paid at most once.
import { PlayerError } from '../errors.js';
import { emit } from '../events.js';
import { canPay, checkPayment, pay, payments } from '../payment.js';
import { seatOf } from '../state.js';
import { hasEra } from '../abilities.js';
import { TRACKS } from '../data/tracks.js';

/**
 * A track space's bonus in this game. The neoprene-nanotechnology variant makes Nanotechnology's cost 2 tech cards
 * instead of 3 (#53 design §4.3).
 * @param {import('../state.js').State} state
 * @param {import('../data/ids.js').TrackId} track
 * @param {number} space
 * @returns {import('../data/effects.js').Bonus | null}
 */
function bonusOf(state, track, space) {
	const { id, bonus } = TRACKS[track][space];
	if (
		bonus &&
		id === 'nanotechnology' &&
		state.variants.includes('neoprene-nanotechnology')
	) {
		return { ...bonus, pay: { tech: 2 } };
	}
	return bonus;
}

/**
 * Offers a space's bonus, but only when the player can pay for it: a bonus nobody can take asks nothing.
 * A `free` bonus costs nothing (Renaissance, Trade Economy's owner), and so does one whose cost is only
 * "any resource" under Wartime Economy; either stays optional (FAQ #4). A finished player is offered nothing (01 §4.3).
 * @type {import('../state.js').AutomaticKind}
 */
export function offerBonus(ctx, op) {
	const player = /** @type {number} */ (op.player);
	const bonus = bonusOf(
		ctx.state,
		/** @type {import('../data/ids.js').TrackId} */ (op.track),
		op.space
	);
	if (!bonus || seatOf(ctx.state, player).finished) {
		return;
	}
	const wartime =
		hasEra(ctx.state, player, 'wartime-economy') &&
		Object.keys(bonus.pay).join() === 'any';
	const cost = op.free || wartime ? {} : bonus.pay;
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
