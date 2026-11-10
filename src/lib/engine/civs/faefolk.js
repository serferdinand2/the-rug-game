// The Faefolk (F&F, #40; 03 FF.3, R73): a token round a 7-spot ellipse, moved by the cards in sight each income turn.
import { emit } from '../events.js';
import { playerSeat } from '../state.js';
import { offer } from './civ.js';

/** @typedef {{ spot: number }} FaefolkData - The token's spot, 1 (the top) to 7, clockwise */

/** Each spot's gains, clockwise from the top (03 FF.3; spot 6 scores landmarks, the tower in laurel). */
export const FAEFOLK_SPOTS = Object.freeze(
	/** @type {Record<number, import('../data/effects.js').Effect[]>} */ ({
		1: [{ vp: { per: 'tapestryCard' } }],
		2: [
			{ gain: { tapestry: 1, territory: 1 } },
			{ invent: {} },
			{ vp: { per: 'incomeBuilding' } },
		],
		3: [{ gain: { food: 1 } }, { vp: { per: 'territoryTile' } }],
		4: [{ gain: { coin: 1 } }, { vp: { per: 'techCard' } }],
		5: [{ gain: { culture: 1 } }, { vp: { per: 'territory' } }],
		6: [{ gain: { worker: 1 } }, { vp: { per: 'landmark' } }],
		7: [{ gain: { space: 1 } }, { exploreSpace: {} }],
	})
);

/** @type {import('./civ.js').Civ} */
export const faefolk = {
	id: 'faefolk',
	// Income turns 2–5: the r4 print; the first printing's missing "2–5" is its one misprint (03 FF.3).
	incomeTurns: [2, 3, 4, 5],
	setup(ctx, player) {
		playerSeat(ctx.state, player).civData.faefolk =
			/** @type {FaefolkData} */ ({ spot: 1 });
	},
	income(ctx, player, turn) {
		ctx.push([
			offer(ctx.state, player, [{ gain: { tapestry: 1 } }], 'civOffer', {
				civ: 'faefolk',
			}),
			{ player, kind: 'faefolkMove', turn },
		]);
	},
};

/**
 * The Faefolk's move: clockwise by the tapestry cards in sight, the hand and each era slot's top card, covered ones
 * not counted (the card just gained included, R73, R145); then the spot's gains, twice on income turn 5.
 * @type {import('../state.js').AutomaticKind}
 */
export function faefolkMove(ctx, op) {
	const player = /** @type {number} */ (op.player);
	const seat = playerSeat(ctx.state, player);
	/** @type {FaefolkData} */
	const data = seat.civData.faefolk;
	const seen =
		seat.hand.length +
		seat.incomeMat.tapestry.filter((slot) => slot.length > 0).length;
	data.spot = ((data.spot - 1 + seen) % 7) + 1;
	emit(ctx.state, {
		type: 'faefolkMoved',
		player,
		spot: data.spot,
		by: seen,
	});
	const gains = FAEFOLK_SPOTS[data.spot];
	ctx.push([
		{
			player,
			kind: 'effects',
			effects: structuredClone(
				op.turn === 5 ? [...gains, ...gains] : gains
			),
			ordered: true,
			origin: 'civ',
		},
	]);
}
