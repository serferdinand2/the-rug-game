// The effect handlers by kind, and the automatic operation that runs a list of effects.
import { vp } from './vp.js';
import { gain } from './gain.js';

/** @type {Record<string, import('../state.js').EffectHandler>} */
export const EFFECTS = { vp, gain };

/**
 * Runs the first effect of an `effects` operation; the rest wait under whatever it pushes.
 * @type {import('../state.js').AutomaticKind}
 */
export function runEffects(ctx, op) {
	const [effect, ...rest] = op.effects;
	if (!effect) {
		return;
	}
	if (rest.length) {
		// The continuation keeps every other field (a source, `ordered`); `push` gives it a new id and batch.
		const { id: _id, batch: _batch, ...kept } = op;
		ctx.push([{ ...kept, effects: rest }]);
	}
	const [kind] = Object.keys(effect);
	const handler = EFFECTS[kind];
	if (!handler) {
		throw new Error(`The ${kind} effect isn't built yet.`);
	}
	if (op.player === null) {
		throw new Error('Effects need a player to run for.');
	}
	handler(ctx, op.player, effect[kind]);
}
