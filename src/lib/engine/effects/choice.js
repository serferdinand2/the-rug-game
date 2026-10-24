// The choice effect: exactly one of several options, each a list of effects (Wagons, Glass and the like).
/**
 * Asks the player for one option. Every option may be chosen, even one that would do nothing.
 * @type {import('../state.js').EffectHandler}
 */
export function choice(ctx, player, value, op) {
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
