// The advance turn's decision: which token to move one space, and how to pay its tier's price (01 §3.1).
import { PlayerError } from '../errors.js';
import { playerSeat } from '../state.js';
import { canPay, checkPayment, pay, payments } from '../payment.js';
import { moveToken, movableFroms, LAST_SPACE } from '../movement.js';
import { advanceBlocked, hasEra } from '../abilities.js';
import { advanceCost } from '../data/tracks.js';
import { tracksOf } from '../tracks-in-play.js';
import { ARTS_TRACK, RESOURCE_IDS } from '../data/ids.js';

/** @typedef {import('../data/ids.js').TrackId} TrackId */

/**
 * The prices a player may pay to advance onto a space: its tier's, and with Found Art on the arts track the same
 * with 2 territory tiles standing in for one of its resources, once (#37, 03 §2.5).
 * @param {import('../state.js').State} state
 * @param {number} player
 * @param {TrackId} track
 * @param {number} space
 * @returns {import('../data/effects.js').Cost[]}
 */
export function advanceCosts(state, player, track, space) {
	const cost = advanceCost(track, space);
	if (track !== ARTS_TRACK || !hasEra(state, player, 'found-art')) {
		return [cost];
	}
	const resources =
		(cost.any ?? 0) +
		(cost.different ?? 0) +
		(cost.same ?? 0) +
		RESOURCE_IDS.reduce((sum, id) => sum + (cost[id] ?? 0), 0);
	// One resource fewer is still "different" or "of one type", so what is left is of the player's choice.
	return [
		cost,
		{ ...(resources > 1 && { any: resources - 1 }), territory: 2 },
	];
}

/**
 * Every advance a player could pay for now: each track in play they aren't blocked on (design §5), the arts track
 * included (#35), each token that isn't at the end, and each price they can pay for it.
 * @param {import('../state.js').State} state
 * @param {number} player
 * @returns {{ track: TrackId, from: number, cost: import('../data/effects.js').Cost }[]}
 */
export function advances(state, player) {
	const seat = playerSeat(state, player);
	return tracksOf(state)
		.filter((track) => !advanceBlocked(state, player, track))
		.flatMap((track) =>
			movableFroms(seat, track, 'advance').flatMap((from) =>
				advanceCosts(state, player, track, from + 1)
					.filter((cost) => canPay(state, player, cost))
					.map((cost) => ({ track, from, cost }))
			)
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
	if (!tracksOf(state).includes(track)) {
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
		if (advanceBlocked(state, player, track)) {
			throw new PlayerError("You can't advance on that track now.");
		}
		// Any price on offer will do; the first one's message when none does.
		const costs = advanceCosts(state, player, track, from + 1);
		const errors = [];
		for (const cost of costs) {
			try {
				checkPayment(state, player, cost, answer.pay);
				return;
			} catch (error) {
				errors.push(error);
			}
		}
		throw errors[0];
	},
	resolve(ctx, decision, answer) {
		const player = /** @type {number} */ (decision.player);
		const { track, from } = chosenToken(ctx.state, player, answer);
		pay(ctx, player, answer.pay);
		moveToken(ctx, player, { track, from, to: from + 1, benefit: true });
	},
};
