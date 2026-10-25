// The Merrymakers (02 §1.2): three columns of spaces; each income turn one token climbs a space and gains it.
import { playerSeat } from '../state.js';
import { emit } from '../events.js';
import { askSlot } from '../decisions/choose-slot.js';

/**
 * The Merrymakers' own state.
 * @typedef {Object} MerrymakersData
 * @property {number[]} levels - Each column's token: 0 below the bottom space (the start), 3 on the top one
 */

/**
 * The three columns, bottom to top; a space with two parts gives both, in any order.
 * @type {import('../data/effects.js').Effect[][][]}
 */
export const MERRYMAKERS_COLUMNS = [
	[
		[{ gain: { coin: 1 } }],
		[{ gain: { worker: 1, food: 1 } }],
		[{ gain: { culture: 1 } }, { building: 'armory' }],
	],
	[
		[{ gain: { territory: 1 } }],
		[{ invent: {} }, { gain: { tapestry: 1 } }],
		[{ explore: {} }, { research: {} }],
	],
	[[{ vp: 5 }], [{ vp: 10 }], [{ vp: 15 }]],
];

/**
 * Moves the token of the picked column up one space and gains that space.
 * @type {import('../state.js').AutomaticKind}
 */
export function merrymakersMove(ctx, op) {
	const player = /** @type {number} */ (op.player);
	/** @type {MerrymakersData} */
	const data = playerSeat(ctx.state, player).civData.merrymakers;
	const column = /** @type {number} */ (op.slot);
	data.levels[column] += 1;
	emit(ctx.state, {
		type: 'merrymakersMoved',
		player,
		column,
		level: data.levels[column],
	});
	ctx.push([
		{
			player,
			kind: 'effects',
			effects: structuredClone(
				MERRYMAKERS_COLUMNS[column][data.levels[column] - 1]
			),
		},
	]);
}

/** @type {import('./civ.js').Civ} */
export const merrymakers = {
	id: 'merrymakers',
	incomeTurns: [2, 3, 4, 5],
	setup(ctx, player) {
		const seat = playerSeat(ctx.state, player);
		seat.civData.merrymakers = /** @type {MerrymakersData} */ ({
			levels: [0, 0, 0],
		});
	},
	// One token moves; the move is required while a column has room, so a single column is made without asking.
	income(ctx, player) {
		/** @type {MerrymakersData} */
		const data = playerSeat(ctx.state, player).civData.merrymakers;
		askSlot(ctx, player, {
			options: data.levels.flatMap((level, column) =>
				level < MERRYMAKERS_COLUMNS[column].length ? [column] : []
			),
			purpose: 'merrymakers',
			then: { kind: 'merrymakersMove' },
		});
	},
	adjustment: {
		setup(ctx, player) {
			ctx.push([
				{ player, kind: 'effects', effects: [{ gain: { any: 1 } }] },
			]);
		},
	},
};
