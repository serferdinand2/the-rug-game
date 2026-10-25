// The others effect: each listed player runs a list of effects as their own operation (design §4, Coal Baron, Diplomacy, Steam Tycoon).
import { opponents } from '../abilities.js';
import { neighbours } from '../income.js';

/**
 * Pushes one `effects` operation per target, so a finished player is skipped by `runEffects`.
 * Neighbours go right, then left; `all` goes from the player clockwise, the player first.
 * @type {import('../state.js').EffectHandler}
 */
export function others(ctx, player, value, op) {
	const targets =
		value.who === 'neighbours'
			? neighbours(ctx.state, player)
			: [player, ...opponents(ctx.state, player)];
	ctx.push(
		targets.map((target) => ({
			player: target,
			kind: 'effects',
			effects: structuredClone(value.effects),
			ordered: true,
			source: op.source,
		}))
	);
}
