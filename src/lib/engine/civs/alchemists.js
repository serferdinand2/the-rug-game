// The Alchemists (02 §1.2): push-your-luck rolls of the science die, then an advance on each marked track.
import { playerSeat } from '../state.js';
import { emit } from '../events.js';
import { scienceFaces } from '../data/dice.js';
import { defaultDie, withDie } from '../science-die.js';

/**
 * The Alchemists' own state.
 * @typedef {Object} AlchemistsData
 * @property {import('../data/ids.js').TrackId[]} marked - The tracks rolled in this activation, in roll order
 */

/** The VP a marked track whose tokens are all at its end gives instead of the advance. */
export const ALCHEMISTS_OFF_TRACK_VP = 5;

/**
 * Stops:an optional advance without benefit on each marked track in roll order, 5 VP instead on a track whose
 * tokens are all on space 12. The marks clear.
 * @param {import('../state.js').Context} ctx
 * @param {number} player
 * @param {import('../data/ids.js').TrackId[]} marked
 */
export function stopAlchemists(ctx, player, marked) {
	/** @type {AlchemistsData} */
	const data = playerSeat(ctx.state, player).civData.alchemists;
	data.marked = [];
	ctx.push(
		marked.map((track) => ({
			player,
			kind: 'effects',
			effects: [
				{
					advance: {
						tracks: [track],
						noBenefit: true,
						optional: true,
						offTrackVp: ALCHEMISTS_OFF_TRACK_VP,
					},
				},
			],
		}))
	);
}

/**
 * The operations for one of the Alchemists' rolls, with the game's science die or the one the player picks (#35).
 * @param {import('../state.js').State} state
 * @param {number} player
 * @returns {import('../state.js').NewOperation[]}
 */
export function alchemistsRollOps(state, player) {
	return withDie(state, player, { kind: 'alchemistsRoll' });
}

/**
 * Rolls the science die and marks the track, then asks whether to roll again. A track already marked is a bust: the
 * marks clear and the player gains 1 resource of their choice. Empiricism doesn't apply (design §7, BGA).
 * R118: the mat has boxes for the four board tracks only, so a d20's arts face marks nothing and never busts; the
 * player may roll again or stop (03 §2.2).
 * @type {import('../state.js').AutomaticKind}
 */
export function alchemistsRoll(ctx, op) {
	const player = /** @type {number} */ (op.player);
	/** @type {AlchemistsData} */
	const data = playerSeat(ctx.state, player).civData.alchemists;
	const die = op.scienceDie ?? defaultDie(ctx.state);
	const faces = scienceFaces(die);
	const track = faces[ctx.random(faces.length)];
	// The events name the d20, as scienceDieRolled does, so the dice tray rolls it (#35).
	const d20 = die === 'd20' ? { scienceDie: die } : {};
	if (track === 'arts') {
		emit(ctx.state, {
			type: 'alchemistsRolled',
			player,
			track,
			marked: [...data.marked],
			...d20,
		});
		ctx.push([
			{ player, kind: 'chooseAlchemists', marked: [...data.marked] },
		]);
		return;
	}
	if (data.marked.includes(track)) {
		data.marked = [];
		emit(ctx.state, { type: 'alchemistsBust', player, track, ...d20 });
		ctx.push([
			{ player, kind: 'effects', effects: [{ gain: { any: 1 } }] },
		]);
		return;
	}
	data.marked.push(track);
	emit(ctx.state, {
		type: 'alchemistsRolled',
		player,
		track,
		marked: [...data.marked],
		...d20,
	});
	ctx.push([{ player, kind: 'chooseAlchemists', marked: [...data.marked] }]);
}

/** @type {import('./civ.js').Civ} */
export const alchemists = {
	id: 'alchemists',
	incomeTurns: [2, 3, 4, 5],
	setup(ctx, player) {
		const seat = playerSeat(ctx.state, player);
		seat.civData.alchemists = /** @type {AlchemistsData} */ ({
			marked: [],
		});
	},
	income(ctx, player) {
		ctx.push(alchemistsRollOps(ctx.state, player));
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
