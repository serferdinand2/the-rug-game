// The Entertainers (02 §1.2): one token walks right along the links of a 4 by 4 grid, gaining each space (R28, R29).
import { playerSeat } from '../state.js';
import { emit } from '../events.js';
import { askSlot } from '../decisions/choose-slot.js';

/**
 * The Entertainers' own state.
 * @typedef {Object} EntertainersData
 * @property {string} at - 'start', or the space the token is on: 'c<column>r<row>', both 1 to 4, such as 'c2r3'
 */

const ROWS = [1, 2, 3, 4];

/**
 * What each column's rows give, top to bottom. The advances may pay the bonus (R29).
 * @type {import('../data/effects.js').Effect[][][]}
 */
export const ENTERTAINERS_GRID = [
	[
		[{ gain: { worker: 1 } }],
		[{ gain: { culture: 1 } }],
		[{ gain: { food: 1 } }],
		[{ gain: { coin: 1 } }],
	],
	[
		[{ building: 'farm' }],
		[{ building: 'market' }],
		[{ building: 'house' }],
		[{ building: 'armory' }],
	],
	[
		[{ conquer: {} }],
		[{ research: { noBenefit: true } }],
		[{ invent: {} }],
		[{ explore: {} }],
	],
	[
		[{ advance: { tracks: ['technology'] } }],
		[{ advance: { tracks: ['exploration'] } }],
		[{ advance: { tracks: ['military'] } }],
		[{ advance: { tracks: ['science'] } }],
	],
];

/**
 * The rows a space links to in the next column (R28), by its row.
 * @type {Record<number, Record<number, number[]>>}
 */
const LINKS = {
	1: { 1: [1, 2], 2: [2, 3], 3: [2, 3], 4: [3, 4] },
	2: { 1: [1, 2], 2: [1, 2], 3: [3, 4], 4: [3, 4] },
	3: { 1: [1, 2], 2: [2, 3], 3: [2, 3], 4: [3, 4] },
};

/**
 * The id of a grid space.
 * @param {number} column - 1 to 4
 * @param {number} row - 1 to 4
 * @returns {string}
 */
const spaceId = (column, row) => `c${column}r${row}`;

/**
 * The spaces the token can reach in one move from where it is.
 * @param {string} at
 * @returns {string[]} Empty on column 4
 */
export function entertainersMoves(at) {
	if (at === 'start') {
		return ROWS.map((row) => spaceId(1, row));
	}
	const column = Number(at[1]);
	const row = Number(at[3]);
	return (LINKS[column]?.[row] ?? []).map((next) =>
		spaceId(column + 1, next)
	);
}

/**
 * Puts the token on the picked space and gains it.
 * @type {import('../state.js').AutomaticKind}
 */
export function entertainersMove(ctx, op) {
	const player = /** @type {number} */ (op.player);
	/** @type {EntertainersData} */
	const data = playerSeat(ctx.state, player).civData.entertainers;
	const at = /** @type {string} */ (op.slot);
	data.at = at;
	emit(ctx.state, { type: 'entertainersMoved', player, space: at });
	ctx.push([
		{
			player,
			kind: 'effects',
			effects: structuredClone(
				ENTERTAINERS_GRID[Number(at[1]) - 1][Number(at[3]) - 1]
			),
		},
	]);
}

/** @type {import('./civ.js').Civ} */
export const entertainers = {
	id: 'entertainers',
	incomeTurns: [2, 3, 4, 5],
	// At setup the token waits on the start; gained later it goes on any space of the grid and gains it.
	setup(ctx, player, midGame) {
		const seat = playerSeat(ctx.state, player);
		seat.civData.entertainers = /** @type {EntertainersData} */ ({
			at: 'start',
		});
		if (midGame) {
			askSlot(ctx, player, {
				options: [1, 2, 3, 4].flatMap((column) =>
					ROWS.map((row) => spaceId(column, row))
				),
				purpose: 'entertainers',
				then: { kind: 'entertainersMove' },
			});
		}
	},
	// The move is required while a link leads on; on column 4 the token stays.
	income(ctx, player) {
		/** @type {EntertainersData} */
		const data = playerSeat(ctx.state, player).civData.entertainers;
		askSlot(ctx, player, {
			options: entertainersMoves(data.at),
			purpose: 'entertainers',
			then: { kind: 'entertainersMove' },
		});
	},
	adjustment: {
		setup(ctx, player) {
			ctx.push([
				{
					player,
					kind: 'effects',
					effects: [{ gain: { any: 1 } }, { vp: 10 }],
				},
			]);
		},
	},
};
