// The Craftsmen (02 §1.2): income buildings may go on three columns instead of the capital, each space paying its benefit.
import { playerSeat } from '../state.js';

/**
 * The Craftsmen's own state: the income buildings on each column, bottom first.
 * @typedef {import('../data/ids.js').BuildingId[][]} CraftsmenData
 */

/**
 * The three columns, bottom to top: each space's benefit, gained when a building covers it.
 * @type {import('../data/effects.js').Effect[][][]}
 */
export const CRAFTSMEN_COLUMNS = [
	[[{ gain: { worker: 1 } }], [{ gain: { territory: 1 } }], [{ vp: 5 }]],
	[
		[{ gain: { coin: 1 } }],
		[{ invent: {} }],
		[{ upgrade: {} }],
		[{ vp: 10 }],
	],
	[
		[{ gain: { food: 1 } }],
		[{ gain: { tapestry: 1 } }],
		[{ gain: { culture: 1 } }],
		[{ research: {} }],
		[{ vp: 15 }],
	],
];

/**
 * The columns a seat may put an income building on: those with an open space, when it holds the Craftsmen.
 * @param {import('../state.js').PlayerSeat} seat
 * @returns {number[]}
 */
export function craftsmenColumns(seat) {
	/** @type {CraftsmenData | undefined} */
	const data = seat.civData.craftsmen;
	if (!seat.civs.includes('craftsmen') || !data) {
		return [];
	}
	return CRAFTSMEN_COLUMNS.flatMap((spaces, column) =>
		data[column].length < spaces.length ? [column] : []
	);
}

/** @type {import('./civ.js').Civ} */
export const craftsmen = {
	id: 'craftsmen',
	// The columns start empty, at setup or mid-game; placing.js offers them (#20 design §9).
	setup(ctx, player) {
		playerSeat(ctx.state, player).civData.craftsmen =
			/** @type {CraftsmenData} */ ([[], [], []]);
	},
};
