// The choice effect: exactly one of several options, each a list of effects (Wagons, Glass and the like).
import { emit } from '../events.js';
import { buildingsOut } from './building.js';
import { tracksOf } from '../tracks-in-play.js';

/**
 * Whether every effect of an option advances or regresses only on tracks not in play.
 * @param {object[]} effects
 * @param {string[]} inPlay
 * @returns {boolean}
 */
function offTracks(effects, inPlay) {
	return (
		effects.length > 0 &&
		effects.every((effect) => {
			const move =
				/** @type {any} */ (effect).advance ??
				/** @type {any} */ (effect).regress;
			return (
				move !== undefined &&
				Array.isArray(move.tracks) &&
				move.tracks.every(
					(/** @type {string} */ t) => !inPlay.includes(t)
				)
			);
		})
	);
}

/**
 * Asks the player for one option. An option that would only gain buildings none of which is left can't be picked
 * (R117); when that is every option, nothing is asked and the log names the buildings missing.
 * @type {import('../state.js').EffectHandler}
 */
export function choice(ctx, player, value, op) {
	// R118: an option that only moves on tracks out of play does nothing, so it isn't offered (#39); a lone option left
	// runs at once.
	const inPlay = tracksOf(ctx.state);
	const options = /** @type {object[][]} */ (value).filter(
		(effects) => !offTracks(effects, inPlay)
	);
	if (options.length === 1 && options.length < value.length) {
		ctx.push([
			{
				player,
				kind: 'effects',
				effects: structuredClone(options[0]),
				ordered: true,
				source: op.source,
				...(op.passive && { passive: true }),
			},
		]);
		return;
	}
	const out = options.map((effects) =>
		buildingsOut(ctx.state, player, effects)
	);
	if (out.every((ids) => ids !== null)) {
		emit(ctx.state, {
			type: 'noBuildingLeft',
			player,
			building: null,
			buildings: [...new Set(out.flat())],
		});
		return;
	}
	ctx.push([
		{
			player,
			kind: 'chooseOption',
			options,
			source: op.source,
			// A finished player's passive VP stays passive through the question (01 §4.3).
			...(op.passive && { passive: true }),
		},
	]);
}
