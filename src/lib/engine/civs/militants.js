// The Militants (02 §1.2): the outposts in the supply cover the 8 spaces of the mat; each one taken uncovers a space, and every uncovered space pays on income turns 2–5.
import { emit } from '../events.js';
import { playerSeat } from '../state.js';
import { askSlot } from '../decisions/choose-slot.js';

/** @typedef {'top' | 'bottom'} MilitantsRow */

/**
 * The Militants' own state: whether an outpost covers each space of each row, left to right. How many outposts are
 * left is still `seat.outposts`.
 * @typedef {Record<MilitantsRow, boolean[]>} MilitantsData
 */

/** @type {MilitantsRow[]} */
const ROWS = ['top', 'bottom'];

/**
 * What each space of the mat pays while uncovered, left to right.
 * @type {Record<MilitantsRow, import('../data/effects.js').Effect[]>}
 */
export const MILITANTS_SPACES = {
	top: [{ gain: { coin: 1 } }, { vp: 2 }, { gain: { food: 1 } }, { vp: 4 }],
	bottom: [
		{ vp: 1 },
		{ gain: { worker: 1 } },
		{ vp: 3 },
		{ gain: { culture: 1 } },
	],
};

/**
 * The Militants' state of a player.
 * @param {import('../state.js').State} state
 * @param {number} player
 * @returns {MilitantsData}
 */
function dataOf(state, player) {
	return playerSeat(state, player).civData.militants;
}

/**
 * Asks the row an outpost leaving the supply comes from: one with a covered space.
 * @type {import('../state.js').AutomaticKind}
 */
export function militantsTake(ctx, op) {
	const player = /** @type {number} */ (op.player);
	const data = dataOf(ctx.state, player);
	askSlot(ctx, player, {
		options: ROWS.filter((row) => data[row].includes(true)),
		purpose: 'militantsRow',
		then: { kind: 'militantsUncover' },
	});
}

/**
 * Uncovers the far left covered space of the row picked (`slot`).
 * @type {import('../state.js').AutomaticKind}
 */
export function militantsUncover(ctx, op) {
	const player = /** @type {number} */ (op.player);
	/** @type {MilitantsRow} */
	const row = op.slot;
	const spaces = dataOf(ctx.state, player)[row];
	const space = spaces.indexOf(true);
	spaces[space] = false;
	emit(ctx.state, { type: 'militantsUncovered', player, row, space });
}

/**
 * Asks the row the next outpost of the supply goes on, when gained mid-game: one with an open space.
 * @param {import('../state.js').Context} ctx
 * @param {number} player
 * @param {number} left - Outposts still to place
 */
function askCover(ctx, player, left) {
	if (left <= 0) {
		return;
	}
	const data = dataOf(ctx.state, player);
	askSlot(ctx, player, {
		options: ROWS.filter((row) => data[row].includes(false)),
		purpose: 'militantsPlace',
		then: { kind: 'militantsCover', left: left - 1 },
	});
}

/**
 * Covers the far right open space of the row picked (`slot`), then asks for the next outpost.
 * @type {import('../state.js').AutomaticKind}
 */
export function militantsCover(ctx, op) {
	const player = /** @type {number} */ (op.player);
	/** @type {MilitantsRow} */
	const row = op.slot;
	const spaces = dataOf(ctx.state, player)[row];
	const space = spaces.lastIndexOf(false);
	spaces[space] = true;
	emit(ctx.state, { type: 'militantsCovered', player, row, space });
	askCover(ctx, player, op.left);
}

/** @type {import('./civ.js').Civ} */
export const militants = {
	id: 'militants',
	incomeTurns: [2, 3, 4, 5],
	// At setup the 8 outposts of the supply cover the mat. Gained mid-game, the outposts left go on from right to left,
	// the player choosing the row for each.
	setup(ctx, player, midGame) {
		const seat = playerSeat(ctx.state, player);
		seat.civData.militants = /** @type {MilitantsData} */ ({
			top: Array(4).fill(!midGame),
			bottom: Array(4).fill(!midGame),
		});
		if (midGame) {
			askCover(ctx, player, seat.outposts);
		}
	},
	// Every uncovered space, at once.
	income(ctx, player) {
		const data = dataOf(ctx.state, player);
		const effects = ROWS.flatMap((row) =>
			MILITANTS_SPACES[row].filter((_, space) => !data[row][space])
		);
		if (effects.length > 0) {
			ctx.push([
				{ player, kind: 'effects', effects: structuredClone(effects) },
			]);
		}
	},
	hooks: {
		// Each outpost leaving the owner's supply comes off the mat.
		outpostTaken: (_state, owner, { player }) =>
			owner === player ? [{ player: owner, kind: 'militantsTake' }] : [],
	},
};
