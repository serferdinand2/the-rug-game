// The operation stack: pushing operations and groups, and finding the decisions that are open.
import { DECISIONS } from './kinds.js';

/** @typedef {import('./state.js').State} State */
/** @typedef {import('./state.js').Operation} Operation */
/** @typedef {import('./state.js').Group} Group */

/**
 * Pushes operations onto a stack. They share one batch id (the first new id); ops[0] ends up on top.
 * @param {State} state
 * @param {(Operation | Group)[]} stack
 * @param {import('./state.js').NewOperation[]} ops
 * @returns {Operation[]}
 */
export function push(state, stack, ops) {
	if (!ops.length) {
		return [];
	}
	const batch = state.nextId;
	const made = ops.map((op) => ({ ...op, id: state.nextId++, batch }));
	stack.unshift(...made);
	return made;
}

/**
 * Pushes a group onto the main stack: one lane per player, so they decide at the same time.
 * @param {State} state
 * @param {import('./state.js').NewLane[]} lanes
 * @returns {Group}
 */
export function pushGroup(state, lanes) {
	const id = state.nextId++;
	/** @type {Group} */
	const group = { id, batch: id, player: null, kind: 'group', lanes: [] };
	for (const lane of lanes) {
		/** @type {Operation[]} */
		const stack = [];
		push(state, stack, lane.ops);
		group.lanes.push({ player: lane.player, stack });
	}
	state.pending.unshift(group);
	return group;
}

/**
 * Whether an operation is a decision a player answers.
 * @param {{ kind: string }} op
 * @returns {boolean}
 */
export function isDecision(op) {
	return op.kind in DECISIONS;
}

/**
 * The top batch of decisions of a stack: consecutive decisions from the top that share the top operation's batch.
 * @param {(Operation | Group)[]} stack
 * @returns {Operation[]}
 */
function topBatch(stack) {
	const top = stack[0];
	if (!top || top.kind === 'group') {
		return [];
	}
	const open = [];
	for (const op of /** @type {Operation[]} */ (stack)) {
		if (op.batch !== top.batch || !isDecision(op)) {
			break;
		}
		open.push(op);
	}
	return open;
}

/**
 * The top batch of decisions on the main stack, or of every lane when a group is on top.
 * @param {State} state
 * @returns {Operation[]}
 */
export function openDecisions(state) {
	const top = state.pending[0];
	if (top && top.kind === 'group') {
		return /** @type {Group} */ (top).lanes.flatMap((lane) =>
			topBatch(lane.stack)
		);
	}
	return topBatch(state.pending);
}

/**
 * Finds an operation by id on the main stack or in any lane.
 * @param {State} state
 * @param {number} id
 * @returns {{ op: Operation, stack: (Operation | Group)[], open: boolean } | null}
 */
export function locate(state, id) {
	const open = openDecisions(state);
	/** @type {(Operation | Group)[][]} */
	const stacks = [state.pending];
	for (const op of state.pending) {
		if (op.kind === 'group') {
			stacks.push(
				.../** @type {Group} */ (op).lanes.map((lane) => lane.stack)
			);
		}
	}
	for (const stack of stacks) {
		const op = /** @type {Operation | undefined} */ (
			stack.find((o) => o.id === id)
		);
		if (op) {
			return { op, stack, open: open.includes(op) };
		}
	}
	return null;
}
