// The Merfolk (F&F, #40; 03 FF.3, DQ 16, 17): cards submerged under their mat, and after income turn 5 a world of
// tapestry turns.
import { emit } from '../events.js';
import { playerSeat } from '../state.js';

/** @typedef {{ submerged: string[] }} MerfolkData - The cards under the mat, hidden from the others */

/** @type {import('./civ.js').Civ} */
export const merfolk = {
	id: 'merfolk',
	incomeTurns: [2, 3, 4, 5],
	setup(ctx, player) {
		playerSeat(ctx.state, player).civData.merfolk =
			/** @type {MerfolkData} */ ({ submerged: [] });
	},
	// Income turns 2–4: 1 tapestry card, then all but 2 cards of the hand go under the mat; 5: 1 card, and all come back.
	income(ctx, player, turn) {
		ctx.push([
			{
				player,
				kind: 'effects',
				effects: [{ gain: { tapestry: 1 } }],
				origin: 'civ',
			},
			{ player, kind: turn === 5 ? 'merfolkSurface' : 'merfolkSubmerge' },
		]);
	},
};

/**
 * Asks the Merfolk for the next card to put away until the hand holds `keep`: under the mat, or, at the end of income
 * turn 5, onto the discards.
 * @param {import('../state.js').Context} ctx
 * @param {number} player
 * @param {number} keep
 * @param {'submerge' | 'discard'} purpose
 */
export function askPutAway(ctx, player, keep, purpose) {
	if (playerSeat(ctx.state, player).hand.length > keep) {
		ctx.push([{ player, kind: 'choosePutAway', keep, purpose }]);
	}
}

/**
 * The Merfolk's submerging, all but 2 cards.
 * @type {import('../state.js').AutomaticKind}
 */
export function merfolkSubmerge(ctx, op) {
	askPutAway(ctx, /** @type {number} */ (op.player), 2, 'submerge');
}

/**
 * Income turn 5: every submerged card comes back to the hand.
 * @type {import('../state.js').AutomaticKind}
 */
export function merfolkSurface(ctx, op) {
	const player = /** @type {number} */ (op.player);
	const seat = playerSeat(ctx.state, player);
	/** @type {MerfolkData} */
	const data = seat.civData.merfolk;
	seat.hand.push(...data.submerged);
	emit(ctx.state, {
		type: 'merfolkSurfaced',
		player,
		count: data.submerged.length,
	});
	data.submerged = [];
}

/**
 * Puts one card away for the Merfolk, then asks for the next while the hand is still over `keep`.
 * @param {import('../state.js').Context} ctx
 * @param {number} player
 * @param {string} card
 * @param {number} keep
 * @param {'submerge' | 'discard'} purpose
 */
export function putAway(ctx, player, card, keep, purpose) {
	const seat = playerSeat(ctx.state, player);
	seat.hand.splice(seat.hand.indexOf(card), 1);
	if (purpose === 'submerge') {
		/** @type {MerfolkData} */ (seat.civData.merfolk).submerged.push(card);
		emit(ctx.state, { type: 'cardSubmerged', player });
	} else {
		ctx.state.supply.tapestry.discard.push(card);
		emit(ctx.state, {
			type: 'cardsDiscarded',
			player,
			deck: 'tapestry',
			cards: [card],
		});
	}
	askPutAway(ctx, player, keep, purpose);
}
