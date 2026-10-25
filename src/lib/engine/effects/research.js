// The research effect: roll the science die, and the player may advance on the rolled track (01 §3.3). Age of Discovery rolls it too.
import { emit } from '../events.js';
import { seatOf } from '../state.js';
import { movableFroms } from '../movement.js';
import { advanceBlocked, hasEra } from '../abilities.js';
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
 * Rolls the science die for a player (R6), then pushes `next` with the rolled `track`. With Empiricism the die
 * rolls twice; when the faces differ, the player chooses one of them (design §8).
 * @param {import('../state.js').Context} ctx
 * @param {number} player
 * @param {{ kind: string } & Record<string, any>} next - The operation the rolled track goes on to, such as `researchRolled`, without its player
 */
export function rollScience(ctx, player, next) {
	const { state } = ctx;
	const roll = () => {
		const track = SCIENCE_DIE[ctx.random(SCIENCE_DIE.length)];
		emit(state, { type: 'scienceDieRolled', player, track });
		return track;
	};
	const track = roll();
	if (hasEra(state, player, 'empiricism')) {
		const other = roll();
		if (other !== track) {
			ctx.push([
				{
					player,
					kind: 'chooseRoll',
					options: [track, other],
					then: next,
				},
			]);
			return;
		}
	}
	ctx.push([{ ...next, player, track }]);
}

/**
 * One roll of research; the remaining rolls wait below it.
 * @type {import('../state.js').AutomaticKind}
 */
export function rollResearch(ctx, op) {
	if (op.rolls > 1) {
		const { id: _id, batch: _batch, ...kept } = op;
		ctx.push([{ ...kept, rolls: op.rolls - 1 }]);
	}
	rollScience(ctx, /** @type {number} */ (op.player), {
		kind: 'researchRolled',
		noBenefit: op.noBenefit,
		offTrackVp: op.offTrackVp,
	});
}

/**
 * What a research roll gives. The player may advance 1 space on the rolled track, with its benefit and bonus,
 * or with neither for the X. When no token there can move, the roll gives `offTrackVp` VP (Alien Biology), or nothing.
 * A track the player is blocked on gives nothing at all (design §5, §10).
 * @type {import('../state.js').AutomaticKind}
 */
export function researchRolled(ctx, op) {
	const { state } = ctx;
	const player = /** @type {number} */ (op.player);
	const track = op.track;
	if (advanceBlocked(state, player, track)) {
		return;
	}
	const froms = movableFroms(seatOf(state, player), track, 'advance');
	if (froms.length > 0) {
		ctx.push([
			{
				player,
				kind: 'chooseMove',
				direction: 'advance',
				options: froms.map((from) => ({ track, from })),
				benefit: !op.noBenefit,
				optional: true,
			},
		]);
	} else if (op.offTrackVp > 0) {
		ctx.push([
			{ player, kind: 'effects', effects: [{ vp: op.offTrackVp }] },
		]);
	}
}
