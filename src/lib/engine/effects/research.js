// The research effect: roll the science die, and the player may advance on the rolled track (01 §3.3).
import { emit } from '../events.js';
import { seatOf } from '../state.js';
import { movableFroms } from '../movement.js';
import { SCIENCE_DIE } from '../data/dice.js';

/**
 * Starts research: each roll is its own operation, so the next roll waits for the player's answer to this one.
 * @type {import('../state.js').EffectHandler}
 */
export function research(ctx, player, value) {
	ctx.push([
		{
			player,
			kind: 'research',
			rolls: value.rolls ?? 1,
			noBenefit: value.noBenefit ?? false,
			offTrackVp: value.offTrackVp ?? 0,
		},
	]);
}

/**
 * One roll of the science die (R6). The player may then advance 1 space on the rolled track, with its benefit and bonus,
 * or with neither for the X. When no token there can move, the roll gives `offTrackVp` VP (Alien Biology), or nothing.
 * @type {import('../state.js').AutomaticKind}
 */
export function rollResearch(ctx, op) {
	const { state } = ctx;
	const player = /** @type {number} */ (op.player);
	const track = SCIENCE_DIE[ctx.random(SCIENCE_DIE.length)];
	emit(state, { type: 'scienceDieRolled', player, track });
	/** @type {import('../state.js').NewOperation[]} */
	const ops = [];
	const froms = movableFroms(seatOf(state, player), track, 'advance');
	if (froms.length > 0) {
		ops.push({
			player,
			kind: 'chooseMove',
			direction: 'advance',
			options: froms.map((from) => ({ track, from })),
			benefit: !op.noBenefit,
			optional: true,
		});
	} else if (op.offTrackVp > 0) {
		ops.push({ player, kind: 'effects', effects: [{ vp: op.offTrackVp }] });
	}
	if (op.rolls > 1) {
		const { id: _id, batch: _batch, ...kept } = op;
		ops.push({ ...kept, rolls: op.rolls - 1 });
	}
	ctx.push(ops);
}
