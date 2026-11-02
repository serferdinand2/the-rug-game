// The Aliens (03 §1.3): 4 space tiles when they come in, and on income turns 2-5 the tile on their mat discarded for a new one explored onto it, or a resource.
import { emit } from '../events.js';
import { playerSeat } from '../state.js';
import { canPay } from '../payment.js';

/**
 * The Aliens' own state.
 * @typedef {Object} AliensData
 * @property {number | null} tile - The space tile explored onto their mat: it gave its benefit, and an ongoing one works
 * until their next income turn discards it (03 §1.5)
 */

/** The space tiles the Aliens gain when they come in. */
export const ALIENS_TILES = 4;

/** @type {import('./civ.js').Civ} */
export const aliens = {
	id: 'aliens',
	incomeTurns: [2, 3, 4, 5],
	// At setup or when gained mid-game (R113, Joe Aubrey): 4 space tiles face up in the supply, the mat empty.
	setup(ctx, player) {
		/** @type {AliensData} */
		const data = { tile: null };
		playerSeat(ctx.state, player).civData.aliens = data;
		ctx.push([
			{
				player,
				kind: 'effects',
				effects: [{ gain: { space: ALIENS_TILES } }],
			},
		]);
	},
	// The tile on the mat leaves the game first. Then a space tile from the supply onto the mat, paying any 1 resource
	// first if one was just discarded, or any 1 resource. Without a tile to explore, or a resource to pay for it, only
	// the resource is left, so it is gained without asking.
	income(ctx, player) {
		const { state } = ctx;
		const seat = playerSeat(state, player);
		/** @type {AliensData} */
		const data = seat.civData.aliens;
		const { tile } = data;
		if (tile !== null) {
			state.supply.spaceDiscard.push(tile);
			emit(state, {
				type: 'tilesDiscarded',
				player,
				stack: 'space',
				tiles: [tile],
				civ: 'aliens',
			});
			data.tile = null;
		}
		const cost = { any: 1 };
		const discarded = tile !== null;
		/** @type {import('../data/effects.js').Effect[]} */
		const resource = [{ gain: { any: 1 } }];
		if (
			seat.spaceTiles.length === 0 ||
			(discarded && !canPay(state, player, cost))
		) {
			ctx.push([{ player, kind: 'effects', effects: resource }]);
			return;
		}
		ctx.push([
			{
				player,
				kind: 'chooseOption',
				options: [
					[
						...(discarded ? [{ pay: cost }] : []),
						{ exploreSpace: { civ: 'aliens' } },
					],
					resource,
				],
				purpose: 'aliens',
			},
		]);
	},
};
