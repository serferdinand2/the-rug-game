// The question to a player's neighbour when the player completes a track: play Spymaster from the hand, or decline (A&A, #37; R127).
import { PlayerError } from '../errors.js';
import { emit } from '../events.js';
import { playerSeat } from '../state.js';

/** @type {import('../state.js').DecisionKind} */
export const chooseSpymaster = {
	hidden: [],
	answers(state, decision) {
		const { hand } = playerSeat(
			state,
			/** @type {number} */ (decision.player)
		);
		return [
			{ card: null },
			...(hand.includes('spymaster') ? [{ card: 'spymaster' }] : []),
		];
	},
	check(state, decision, answer) {
		if (
			!chooseSpymaster
				.answers(state, decision)
				.some((a) => a.card === answer.card)
		) {
			throw new PlayerError("You can't play that card now.");
		}
	},
	resolve(ctx, decision, answer) {
		const { state } = ctx;
		const player = /** @type {number} */ (decision.player);
		if (answer.card === null) {
			emit(state, { type: 'spymasterDeclined', player });
			return;
		}
		const seat = playerSeat(state, player);
		seat.hand.splice(seat.hand.indexOf('spymaster'), 1);
		state.supply.tapestry.discard.push('spymaster');
		emit(state, {
			type: 'spymasterPlayed',
			player,
			mover: decision.mover,
			track: decision.track,
		});
		(state.spymasters ??= []).push({ player, track: decision.track });
	},
};
