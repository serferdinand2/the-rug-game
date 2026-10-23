// play(): a player answers one open decision, and the game runs on to the next one.
import { PlayerError } from './errors.js';
import { locate } from './stack.js';
import { contextFor, run } from './loop.js';
import { DECISIONS } from './kinds.js';

/**
 * Answers a decision. Returns a new state; the given one is never changed, even when this throws.
 * @param {import('./state.js').State} state
 * @param {number} seat - The answering seat, 1 to n
 * @param {{ decision: number } & Record<string, any>} action - The decision id and the answer's fields
 * @param {import('./random.js').Random} random
 * @returns {import('./state.js').State}
 * @throws {PlayerError} When the action is not allowed
 */
export function play(state, seat, action, random) {
	if (state.phase === 'over') {
		throw new PlayerError('This game is finished.');
	}
	if (
		!action ||
		typeof action !== 'object' ||
		!Number.isInteger(action.decision)
	) {
		throw new PlayerError('Choose one of the open choices.');
	}
	const found = locate(state, action.decision);
	if (!found) {
		throw new PlayerError('That choice is no longer open.');
	}
	if (!found.open) {
		throw new PlayerError("That choice isn't open yet.");
	}
	if (found.op.player !== seat) {
		throw new PlayerError('That choice belongs to another player.');
	}

	const clone = structuredClone(state);
	const here = /** @type {NonNullable<ReturnType<typeof locate>>} */ (
		locate(clone, action.decision)
	);
	const { decision: _id, ...answer } = action;
	const kind = DECISIONS[here.op.kind];
	kind.check(clone, here.op, answer);
	here.stack.splice(here.stack.indexOf(here.op), 1);
	kind.resolve(contextFor(clone, random, here.stack), here.op, answer);
	run(clone, random);
	return clone;
}
