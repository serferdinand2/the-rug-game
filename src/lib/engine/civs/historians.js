// The Historians (02 §1.2): a territory tile discarded each income turn gives an opponent a token, and whenever an opponent holding one gains a landmark, every square the tokens uncovered pays.
import { emit } from '../events.js';
import { playerSeat } from '../state.js';
import { opponents } from '../abilities.js';
import { askSlot } from '../decisions/choose-slot.js';
import { pay } from '../payment.js';

/**
 * The Historians' own state.
 * @typedef {Object} HistoriansData
 * @property {boolean[]} squares - Whether a token still covers each square, in `SQUARES` order
 * @property {Record<number, number>} given - The tokens each opponent holds, by seat
 */

/**
 * What each square pays once uncovered: 3 VP and 1 food on top, 1 worker and 3 VP below.
 * @type {import('../data/effects.js').Effect[]}
 */
const SQUARES = [
	{ vp: 3 },
	{ gain: { food: 1 } },
	{ gain: { worker: 1 } },
	{ vp: 3 },
];

/**
 * The Historians' state of a player.
 * @param {import('../state.js').State} state
 * @param {number} player
 * @returns {HistoriansData}
 */
function dataOf(state, player) {
	return playerSeat(state, player).civData.historians;
}

/**
 * Asks which opponent gets the next token of a mid-game gain; it uncovers the first square still covered.
 * @param {import('../state.js').Context} ctx
 * @param {number} player
 * @param {number} left - Tokens still to give
 */
function askGift(ctx, player, left) {
	if (left <= 0) {
		return;
	}
	const square = dataOf(ctx.state, player).squares.indexOf(true);
	askSlot(ctx, player, {
		options: opponents(ctx.state, player).map((to) => ({ to, square })),
		purpose: 'historians',
		then: { kind: 'historiansToken', left: left - 1 },
	});
}

/**
 * Gives a token to the opponent picked, uncovering the square picked (`slot`, `{ to, square }`). In step 1 (`discard`)
 * the territory tile comes next, the player choosing which; in a mid-game gain the next token (`left`).
 * @type {import('../state.js').AutomaticKind}
 */
export function historiansToken(ctx, op) {
	const { state } = ctx;
	const player = /** @type {number} */ (op.player);
	const { to, square } = op.slot;
	const data = dataOf(state, player);
	data.squares[square] = false;
	data.given[to] = (data.given[to] ?? 0) + 1;
	emit(state, { type: 'historiansGave', player, to, square });
	if (op.discard) {
		askSlot(ctx, player, {
			options: [...playerSeat(state, player).territoryTiles],
			purpose: 'historiansTile',
			then: { kind: 'historiansDiscard' },
		});
	}
	askGift(ctx, player, op.left ?? 0);
}

/**
 * Discards the territory tile picked (`slot`). It leaves the game, as every discarded tile does (FAQ #20).
 * @type {import('../state.js').AutomaticKind}
 */
export function historiansDiscard(ctx, op) {
	pay(ctx, /** @type {number} */ (op.player), { territory: [op.slot] });
}

/** @type {import('./civ.js').Civ} */
export const historians = {
	id: 'historians',
	incomeTurns: [2, 3, 4, 5],
	// Every token covers its square. Gained mid-game, all 4 go to opponents at once, an opponent chosen for each
	// (my call: BGA deals them round the table).
	setup(ctx, player, midGame) {
		playerSeat(ctx.state, player).civData.historians =
			/** @type {HistoriansData} */ ({
				squares: [true, true, true, true],
				given: {},
			});
		if (midGame) {
			askGift(ctx, player, SQUARES.length);
		}
	},
	// You may discard a territory tile to give a token to any opponent, who may hold one already. You choose the square
	// it uncovers (R30).
	income(ctx, player) {
		const { state } = ctx;
		if (playerSeat(state, player).territoryTiles.length === 0) {
			return;
		}
		const covered = dataOf(state, player).squares.flatMap((on, square) =>
			on ? [square] : []
		);
		askSlot(ctx, player, {
			options: opponents(state, player).flatMap((to) =>
				covered.map((square) => ({ to, square }))
			),
			optional: true,
			purpose: 'historians',
			then: { kind: 'historiansToken', discard: true },
		});
	},
	hooks: {
		// An opponent holding a token gained a landmark: every uncovered square pays, once per landmark (BGA). A finished
		// owner gets only the VP of it.
		landmarkGained(state, owner, { player }) {
			/** @type {HistoriansData | undefined} */
			const data = dataOf(state, owner);
			if (!data?.given[player]) {
				return [];
			}
			const effects = SQUARES.filter(
				(_, square) => !data.squares[square]
			);
			return [
				{
					player: owner,
					kind: 'effects',
					effects: structuredClone(effects),
				},
			];
		},
	},
};
