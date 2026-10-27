// The operation stack: pushing operations and groups, and finding the decisions that are open.
import { DECISIONS } from './kinds.js';

/** @typedef {import('./state.js').State} State */
/** @typedef {import('./state.js').Operation} Operation */
/** @typedef {import('./state.js').Group} Group */

/**
 * Where VP from an operation counts (#29 design §2): the scoreboard's sources.
 * @typedef {'tracks' | 'tapestry' | 'tech' | 'map' | 'civ' | 'income' | 'capital' | 'achievements' | 'paid' | 'other'} VpSource
 */

/**
 * The VP source an operation's `source` names: a track space, a tapestry ability, a tech card, or a hex or space
 * tile on the map; null for none.
 * @param {unknown} source
 * @returns {VpSource | null}
 */
export function sourceOrigin(source) {
	if (typeof source !== 'object' || source === null) {
		return null;
	}
	const s = /** @type {Record<string, any>} */ (source);
	if (typeof s.track === 'string' && Number.isInteger(s.space)) {
		return 'tracks';
	}
	if (typeof s.tapestry === 'string') {
		return 'tapestry';
	}
	if (typeof s.tech === 'string') {
		return 'tech';
	}
	if (typeof s.hex === 'string' || s.spaceTile !== undefined) {
		return 'map';
	}
	return null;
}

/**
 * An operation's VP source: its own `origin`; else what its `source` names, unless it only copies the source of the
 * operation that pushed it; else that operation's origin; else civ for a passive (civilization) operation.
 * @param {import('./state.js').NewOperation} op
 * @param {Operation | null} from - The operation being run or answered when it was pushed
 * @returns {VpSource | null}
 */
function originFor(op, from) {
	if (typeof op.origin === 'string') {
		return /** @type {VpSource} */ (op.origin);
	}
	const own = sourceOrigin(op.source);
	const copied =
		from !== null &&
		JSON.stringify(op.source) === JSON.stringify(from.source);
	if (own !== null && !copied) {
		return own;
	}
	if (typeof from?.origin === 'string') {
		return /** @type {VpSource} */ (from.origin);
	}
	return own ?? (op.passive ? 'civ' : null);
}

/**
 * Pushes operations onto a stack. They share one batch id (the first new id); ops[0] ends up on top. Each takes its
 * VP source from `from` unless it has its own (originFor).
 * @param {State} state
 * @param {(Operation | Group)[]} stack
 * @param {import('./state.js').NewOperation[]} ops
 * @param {Operation | null} [from=null] - The operation being run or answered, whose VP source the new ones inherit
 * @returns {Operation[]}
 */
export function push(state, stack, ops, from = null) {
	if (!ops.length) {
		return [];
	}
	const batch = state.nextId;
	const made = ops.map((op) => {
		const origin = originFor(op, from);
		return {
			...op,
			...(origin !== null && { origin }),
			id: state.nextId++,
			batch,
		};
	});
	stack.unshift(...made);
	return made;
}

/**
 * Pushes a group onto the main stack: one lane per player, so they decide at the same time.
 * @param {State} state
 * @param {import('./state.js').NewLane[]} lanes
 * @param {Operation | null} [from=null] - The operation being run, whose VP source the lanes' operations inherit
 * @returns {Group}
 */
export function pushGroup(state, lanes, from = null) {
	const id = state.nextId++;
	/** @type {Group} */
	const group = { id, batch: id, player: null, kind: 'group', lanes: [] };
	for (const lane of lanes) {
		/** @type {Operation[]} */
		const stack = [];
		push(state, stack, lane.ops, from);
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
	return Object.hasOwn(DECISIONS, op.kind);
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
