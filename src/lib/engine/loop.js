// The run loop: runs automatic operations until a decision needs a player.
import { push, pushGroup, isDecision } from './stack.js';
import { AUTOMATIC } from './kinds.js';

/** @typedef {import('./state.js').State} State */
/** @typedef {(import('./state.js').Operation | import('./state.js').Group)[]} Stack */

/**
 * What a handler may use when it runs in a stack.
 * @param {State} state
 * @param {import('./random.js').Random} random
 * @param {Stack} stack - The main stack or a lane's
 * @param {import('./state.js').Operation | null} [from=null] - The operation being run or answered: what it pushes
 *   inherits its VP source (#29)
 * @returns {import('./state.js').Context}
 */
export function contextFor(state, random, stack, from = null) {
	return {
		state,
		random,
		push: (ops) => push(state, stack, ops, from),
		pushGroup: (lanes) => {
			if (stack !== state.pending) {
				throw new Error('A group cannot be pushed from inside a lane.');
			}
			return pushGroup(state, lanes, from);
		},
	};
}

/**
 * Takes the top operation off a stack and runs it.
 * @param {State} state
 * @param {import('./random.js').Random} random
 * @param {Stack} stack
 */
function runTop(state, random, stack) {
	const top = /** @type {import('./state.js').Operation} */ (stack.shift());
	if (!Object.hasOwn(AUTOMATIC, top.kind)) {
		throw new Error(`There is no operation kind ${top.kind}.`);
	}
	const automatic = AUTOMATIC[top.kind];
	automatic(contextFor(state, random, stack, top), top);
}

/**
 * Runs one lane's automatic operations until its top is a decision.
 * @param {State} state
 * @param {import('./random.js').Random} random
 * @param {Stack} stack
 */
function settle(state, random, stack) {
	while (stack.length) {
		if (stack[0].kind === 'group') {
			throw new Error('A group cannot sit inside a lane.');
		}
		if (isDecision(stack[0])) {
			return;
		}
		runTop(state, random, stack);
	}
}

/**
 * Runs automatic operations until the top is a decision, or a group whose lanes all wait on decisions. Changes `state`.
 * @param {State} state
 * @param {import('./random.js').Random} random
 */
export function run(state, random) {
	while (state.pending.length) {
		const top = state.pending[0];
		if (top.kind === 'group') {
			const group = /** @type {import('./state.js').Group} */ (top);
			for (const lane of group.lanes) {
				settle(state, random, lane.stack);
			}
			if (group.lanes.some((lane) => lane.stack.length)) {
				return;
			}
			state.pending.shift();
			continue;
		}
		if (isDecision(top)) {
			return;
		}
		runTop(state, random, state.pending);
	}
}

/**
 * Resolves effects for a player on a copy of the state, and returns the copy.
 * @param {State} state
 * @param {number} player
 * @param {object[]} effects
 * @param {import('./random.js').Random} random
 * @returns {State}
 */
export function resolveEffects(state, player, effects, random) {
	const next = structuredClone(state);
	push(next, next.pending, [{ player, kind: 'effects', effects }]);
	run(next, random);
	return next;
}
