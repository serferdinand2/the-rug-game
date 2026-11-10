// The Illuminati (F&F, #40; 03 FF.3, DQ 12–15): the dice on their mat, which pay them whenever an opponent rolls one.
import { emit } from '../events.js';
import { isPlayerSeat, playerSeat } from '../state.js';
import { BLACK_DIE, RED_DIE } from '../data/dice.js';

/** @typedef {'red' | 'black' | 'science'} DieName */
/** @typedef {{ onMat: DieName[] }} IlluminatiData - The dice on the mat; one an opponent took stays off until their next income turn */

/** The three dice. */
const DICE = /** @type {readonly DieName[]} */ (
	Object.freeze(['red', 'black', 'science'])
);

/**
 * What an opponent's roll pays the Illuminati, before the roller uses it (DQ 13): each die still on their mat comes
 * off and pays its own, from this first roll only; the conquer dice give their results (the black "?" the territory's
 * benefit, DQ 12), the science die an advance on its track without benefit, if they like. Their own rolls pay nothing.
 * @param {import('../state.js').Context} ctx
 * @param {number} roller
 * @param {{ red?: number, black?: number, science?: import('../data/ids.js').TrackId, hex?: string }} rolled
 * @returns {import('../state.js').NewOperation[]} To push after the roller's own operations, so they run first
 */
export function illuminatiTake(ctx, roller, rolled) {
	const { state } = ctx;
	/** @type {import('../state.js').NewOperation[]} */
	const ops = [];
	for (const seat of state.seats) {
		if (seat.seat === roller || !isPlayerSeat(state, seat.seat)) {
			continue;
		}
		/** @type {IlluminatiData | undefined} */
		const data = playerSeat(state, seat.seat).civData.illuminati;
		if (!data) {
			continue;
		}
		/** @type {import('../data/effects.js').Effect[]} */
		const effects = [];
		/** @type {DieName[]} */
		const taken = [];
		if (rolled.black !== undefined && data.onMat.includes('black')) {
			taken.push('black');
			effects.push(structuredClone(BLACK_DIE[rolled.black]));
		}
		if (rolled.red !== undefined && data.onMat.includes('red')) {
			taken.push('red');
			effects.push(structuredClone(RED_DIE[rolled.red]));
		}
		if (rolled.science !== undefined && data.onMat.includes('science')) {
			taken.push('science');
			effects.push({
				advance: {
					tracks: [rolled.science],
					noBenefit: true,
					optional: true,
				},
			});
		}
		if (taken.length === 0) {
			continue;
		}
		data.onMat = data.onMat.filter((die) => !taken.includes(die));
		emit(state, {
			type: 'illuminatiPaid',
			player: seat.seat,
			roller,
			dice: taken,
		});
		ops.push({
			player: seat.seat,
			kind: 'effects',
			effects,
			ordered: true,
			origin: 'civ',
			// A finished Illuminati still scores the VP (Mike Young's reading, DQ 14; R149).
			passive: true,
			...(rolled.hex !== undefined && { source: { hex: rolled.hex } }),
		});
	}
	return ops;
}

/** @type {import('./civ.js').Civ} */
export const illuminati = {
	id: 'illuminati',
	solo: false,
	incomeTurns: [2, 3, 4, 5],
	// Draw 3 tapestry cards and keep 1; the 3 dice go on the mat (03 FF.3).
	setup(ctx, player) {
		playerSeat(ctx.state, player).civData.illuminati =
			/** @type {IlluminatiData} */ ({
				onMat: [...DICE],
			});
		ctx.push([
			{
				player,
				kind: 'effects',
				effects: [{ gain: { tapestry: 3, keep: 1 } }],
				origin: 'civ',
			},
		]);
	},
	// 6 VP per die still on the mat, then all three back (03 FF.3).
	income(ctx, player) {
		/** @type {IlluminatiData} */
		const data = playerSeat(ctx.state, player).civData.illuminati;
		const vp = 6 * data.onMat.length;
		data.onMat = [...DICE];
		emit(ctx.state, { type: 'illuminatiScored', player, vp });
		if (vp > 0) {
			ctx.push([
				{ player, kind: 'effects', effects: [{ vp }], origin: 'civ' },
			]);
		}
	},
};
