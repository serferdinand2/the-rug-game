// The advance turn's decision: which token to move one space, and how to pay its tier's price (01 §3.1).
import { PlayerError } from '../errors.js';
import { playerSeat } from '../state.js';
import { canPay, checkPayment, pay, payments } from '../payment.js';
import { moveToken, movableFroms, LAST_SPACE } from '../movement.js';
import { advanceCost } from '../data/tracks.js';
import { TRACK_IDS } from '../data/ids.js';

/** @typedef {import('../data/ids.js').TrackId} TrackId */

/**
 * Every advance a player could pay for now: each track, each token that isn't at the end, and its tier's price.
 * @param {import('../state.js').State} state
 * @param {number} player
 * @returns {{ track: TrackId, from: number, cost: import('../data/effects.js').Cost }[]}
 */
export function advances(state, player) {
	const seat = playerSeat(state, player);
	return TRACK_IDS.flatMap((track) =>
		movableFroms(seat, track, 'advance')
			.map((from) => ({
				track,
				from,
				cost: advanceCost(track, from + 1),
			}))
			.filter(({ cost }) => canPay(state, player, cost))
	);
}

/**
 * The space of the token an answer moves. `from` may be left out when every token on the track is on one space.
 * @param {import('../state.js').State} state
 * @param {number} player
 * @param {import('../state.js').Answer} answer
 * @returns {{ track: TrackId, from: number }}
 * @throws {PlayerError}
 */
function chosenToken(state, player, answer) {
	const track = answer.track;
	if (!TRACK_IDS.includes(track)) {
		throw new PlayerError('Choose a track to advance on.');
	}
	const tokens = playerSeat(state, player).tracks[
		/** @type {TrackId} */ (track)
	];
	let from = answer.from;
	if (from === undefined) {
		if (new Set(tokens).size > 1) {
			throw new PlayerError(
				'Choose which of your tokens on that track to move.'
			);
		}
		from = tokens[0];
	}
	if (!Number.isInteger(from) || !tokens.includes(from)) {
		throw new PlayerError("You don't have a token there.");
	}
	if (from >= LAST_SPACE) {
		throw new PlayerError('That token is at the end of its track.');
	}
	return { track, from };
}

/** @type {import('../state.js').DecisionKind} */
export const chooseAdvance = {
	hidden: [],
	answers(state, decision) {
		const player = /** @type {number} */ (decision.player);
		return advances(state, player).flatMap(({ track, from, cost }) =>
			payments(state, player, cost).map((payment) => ({
				track,
				from,
				pay: payment,
			}))
		);
	},
	check(state, decision, answer) {
		const player = /** @type {number} */ (decision.player);
		const { track, from } = chosenToken(state, player, answer);
		checkPayment(state, player, advanceCost(track, from + 1), answer.pay);
	},
	resolve(ctx, decision, answer) {
		const player = /** @type {number} */ (decision.player);
		const { track, from } = chosenToken(ctx.state, player, answer);
		pay(ctx, player, answer.pay);
		moveToken(ctx, player, { track, from, to: from + 1, benefit: true });
	},
};
