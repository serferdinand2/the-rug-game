// What the table needs from the engine: who is asked, default answers, decline-only responses, the timeout event and undo's restore.
import { DECISIONS } from './kinds.js';
import { openDecisions } from './stack.js';
import { emit } from './events.js';
import { HIDDEN_DECKS } from './view.js';

/** @typedef {import('./state.js').State} State */
/** @typedef {import('./state.js').Answer} Answer */

/**
 * The seats with an open decision, in ascending order.
 * @param {State} state
 * @returns {number[]}
 */
export function askedSeats(state) {
	const seats = new Set(
		openDecisions(state).flatMap((op) =>
			op.player === null ? [] : [op.player]
		)
	);
	return [...seats].sort((a, b) => a - b);
}

/**
 * The action that answers a seat's first open decision with its default answer.
 * @param {State} state
 * @param {number} seat
 * @returns {({ decision: number } & Answer) | null} Null when the seat has nothing open
 */
export function defaultAction(state, seat) {
	const decision = openDecisions(state).find((op) => op.player === seat);
	if (!decision) {
		return null;
	}
	const [first] = DECISIONS[decision.kind].answers(state, decision);
	if (first === undefined) {
		return null;
	}
	return { decision: decision.id, ...first };
}

/**
 * The open responses to a conquest whose only legal answer is to decline: the defender holds no card that can answer.
 * @param {State} state
 * @returns {{ decision: number, player: number }[]}
 */
export function declineOnly(state) {
	return openDecisions(state)
		.filter((op) => {
			if (op.kind !== 'chooseResponse') {
				return false;
			}
			const answers = DECISIONS.chooseResponse.answers(state, op);
			return answers.length === 1 && answers[0].card === null;
		})
		.map((op) => ({
			decision: op.id,
			player: /** @type {number} */ (op.player),
		}));
}

/**
 * Whether an action showed something view() hides: a deck, a hand, a pick, a face-down card or a secret event.
 * Undo is refused after such an action, because a reveal can't be taken back.
 * @param {State} before
 * @param {State} after
 * @returns {boolean}
 */
export function revealed(before, after) {
	const same = (/** @type {unknown} */ a, /** @type {unknown} */ b) =>
		JSON.stringify(a) === JSON.stringify(b);
	const at = (
		/** @type {State} */ state,
		/** @type {readonly string[]} */ path
	) => path.reduce((o, key) => o[key], /** @type {any} */ (state.supply));
	if (HIDDEN_DECKS.some((path) => !same(at(before, path), at(after, path)))) {
		return true;
	}
	for (const seat of before.seats) {
		if (seat.kind !== 'player') {
			continue;
		}
		const was = /** @type {any} */ (seat);
		const is = /** @type {any} */ (after.seats[seat.seat - 1]);
		if (
			!same(was.hand, is.hand) ||
			!same(was.picks, is.picks) ||
			!same(was.incomeMat.faceDown, is.incomeMat.faceDown)
		) {
			return true;
		}
	}
	return after.events.some(
		(event) => event.seq > before.seq && event.secret !== undefined
	);
}

/**
 * A copy of the state with a `timedOut` event: the seat's clock ran out and the server answered for it.
 * @param {State} state - Left unchanged
 * @param {number} seat
 * @returns {State}
 */
export function timedOut(state, seat) {
	const next = structuredClone(state);
	emit(next, { type: 'timedOut', player: seat });
	return next;
}

/**
 * Takes the game back to an earlier state, keeping `seq` and `nextId` rising so no number repeats.
 * The last event says who undid and from which event on the log was taken back.
 * @param {State} before - The state to return to; left unchanged
 * @param {State} current - The state being undone; left unchanged
 * @param {number} player - Who undid
 * @returns {State}
 */
export function restore(before, current, player) {
	const next = structuredClone(before);
	next.seq = current.seq;
	next.nextId = Math.max(before.nextId, current.nextId);
	emit(next, { type: 'undone', player, from: before.seq + 1 });
	return next;
}
