// The choice effect: exactly one of several options, each a list of effects (Wagons, Glass and the like).
import { emit } from '../events.js';
import { buildingsOut } from './building.js';

/**
 * Asks the player for one option. An option that would only gain buildings none of which is left can't be picked
 * (R117); when that is every option, nothing is asked and the log names the buildings missing.
 * @type {import('../state.js').EffectHandler}
 */
export function choice(ctx, player, value, op) {
	const options = /** @type {object[][]} */ (value);
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
			options: value,
			source: op.source,
			// A finished player's passive VP stays passive through the question (01 §4.3).
			...(op.passive && { passive: true }),
		},
	]);
}
