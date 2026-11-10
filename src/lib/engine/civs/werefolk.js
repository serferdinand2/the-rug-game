// The Werefolk (F&F, #40; 03 FF.3): at the start of income turns 2–5, a space tile drawn and flipped like a coin.
import { emit } from '../events.js';
import { playerSeat } from '../state.js';
import { drawTileFor } from '../effects/tile-uses.js';
import { exploreSpaceTile } from '../effects/explore.js';
import { ARTS_TRACK, TRACK_IDS } from '../data/ids.js';

/** @typedef {{ tile: number | null }} WerefolkData - The space tile explored onto the mat, discarded next income turn */

/** Every track a game may play; one out of play is skipped (R118). */
const ANY_TRACK = [...TRACK_IDS, ARTS_TRACK];

/** @type {import('./civ.js').Civ} */
export const werefolk = {
	id: 'werefolk',
	incomeTurns: [2, 3, 4, 5],
	// No space tile at setup (the F&F FAQ, 03 FF.3).
	setup(ctx, player) {
		playerSeat(ctx.state, player).civData.werefolk =
			/** @type {WerefolkData} */ ({
				tile: null,
			});
	},
	// The mat's tile is discarded; a new one is drawn and flipped: face up, you may go back 1 space on a track without
	// benefit, then explore it onto the mat, or else 4 VP; face down, advance with benefit and a free bonus. A tile not
	// explored stays in the supply.
	income(ctx, player) {
		const { state } = ctx;
		/** @type {WerefolkData} */
		const data = playerSeat(state, player).civData.werefolk;
		if (data.tile !== null) {
			state.supply.spaceDiscard.push(data.tile);
			emit(state, { type: 'werefolkDiscarded', player, tile: data.tile });
			data.tile = null;
		}
		drawTileFor(ctx, player, 'space', 'werefolk');
	},
};

/**
 * After the Werefolk's chance to go back: a token moved back explores the tile onto the mat, with its benefit;
 * otherwise 4 VP, and the tile stays in the supply.
 * @type {import('../state.js').AutomaticKind}
 */
export function werefolkLanded(ctx, op) {
	const player = /** @type {number} */ (op.player);
	const seat = playerSeat(ctx.state, player);
	if (
		JSON.stringify(seat.tracks) !== op.before &&
		seat.spaceTiles.includes(op.tile)
	) {
		exploreSpaceTile(ctx, player, op.tile, 'werefolk');
		return;
	}
	ctx.push([
		{ player, kind: 'effects', effects: [{ vp: 4 }], origin: 'civ' },
	]);
}

/**
 * The Werefolk's new tile, drawn (or none left): it is flipped, face up for a regress then an exploration onto the mat,
 * face down for an advance.
 * @param {import('../state.js').Context} ctx
 * @param {number} player
 * @param {number | undefined} tile
 */
export function werefolkFlip(ctx, player, tile) {
	const { state } = ctx;
	if (tile === undefined) {
		return;
	}
	// R142: a coin flip, not a die roll (the Psionics' rolls don't apply).
	const up = ctx.random(2) === 0;
	emit(state, { type: 'tileFlipped', player, tile, up });
	if (!up) {
		ctx.push([
			{
				player,
				kind: 'effects',
				effects: [{ advance: { tracks: ANY_TRACK, freeBonus: true } }],
				origin: 'civ',
			},
		]);
		return;
	}
	ctx.push([
		{
			player,
			kind: 'effects',
			effects: [
				{
					regress: {
						tracks: ANY_TRACK,
						noBenefit: true,
						optional: true,
					},
				},
			],
			origin: 'civ',
		},
		{
			player,
			kind: 'werefolkLanded',
			tile,
			before: JSON.stringify(playerSeat(state, player).tracks),
		},
	]);
}
