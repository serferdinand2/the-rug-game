// Spymaster's response (A&A, #37; 03 §2.5, R127): who is asked when a player completes a track, and the advance a played Spymaster gives at the end of the turn.
import { isPlayerSeat, neighbours, playerSeat } from './state.js';
import { mayRespond } from './civs/elder-ones.js';

/**
 * The questions a player's completing a track asks: each neighbour of theirs who holds any tapestry card, so nobody
 * learns who holds Spymaster (R127, as #17's defender); R108: in the current version a finished player isn't asked.
 * Only with Arts & Architecture, the only box with Spymaster, so other games ask nothing.
 * @param {import('./state.js').State} state
 * @param {number} mover - The player whose token reached the end
 * @param {import('./data/ids.js').TrackId} track
 * @returns {import('./state.js').NewOperation[]}
 */
export function spymasterQuestions(state, mover, track) {
	if (!state.expansions.includes('aa')) {
		return [];
	}
	const count = state.seats.length;
	return (
		neighbours(state, mover)
			// Clockwise from the mover: the next seat first.
			.sort(
				(a, b) =>
					((a - mover + count) % count) -
					((b - mover + count) % count)
			)
			.filter((seat) => {
				if (!isPlayerSeat(state, seat)) {
					return false;
				}
				const { hand, finished } = playerSeat(state, seat);
				return (
					hand.length > 0 &&
					(!finished || state.version === 'original') &&
					mayRespond(playerSeat(state, seat))
				);
			})
			.map((seat) => ({
				player: seat,
				kind: 'chooseSpymaster',
				mover,
				track,
			}))
	);
}

/**
 * The advances played Spymasters give at the end of the turn: one on the completed track each, with its benefit, and
 * the bonus may be paid (03 §2.5). They are taken off the record.
 * @param {import('./state.js').State} state - Changed: the record is emptied
 * @returns {import('./state.js').NewOperation[]}
 */
export function spymasterAdvances(state) {
	const due = state.spymasters ?? [];
	if (due.length === 0) {
		return [];
	}
	state.spymasters = [];
	return due.map(({ player, track }) => ({
		player,
		kind: 'effects',
		effects: [{ advance: { tracks: [track] } }],
		source: { tapestry: 'spymaster' },
	}));
}
