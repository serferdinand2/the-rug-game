// The effect handlers by kind, and the automatic operation that runs a list of effects.
import { vp } from './vp.js';
import { gain } from './gain.js';
import { building } from './building.js';
import { choice } from './choice.js';
import { research } from './research.js';
import { advance, regress } from './move.js';
import { repeat } from './repeat.js';
import { restartToken } from './restart-token.js';

/** @type {Record<string, import('../state.js').EffectHandler>} */
export const EFFECTS = {
	vp,
	gain,
	building,
	choice,
	research,
	advance,
	regress,
	repeat,
	restartToken,
};

/**
 * Effect kinds that ask nothing depending on a benefit's other parts, and that no other part of the same
 * benefit changes in the base data, so an unordered benefit runs them first without a question.
 */
const INDEPENDENT_KINDS = ['gain', 'vp'];

/**
 * The kind of an effect: its one key.
 * @param {object} effect
 * @returns {string}
 */
function kindOf(effect) {
	return Object.keys(effect)[0];
}

/**
 * Which effect of an operation runs now: the first in an ordered list (or a missing `ordered`, as in #13);
 * in an unordered one, the first independent part, or -1 when the player must choose the order.
 * @param {import('../state.js').Operation} op
 * @returns {number}
 */
function nextIndex(op) {
	if (op.ordered !== false || op.effects.length < 2) {
		return 0;
	}
	return op.effects.findIndex((/** @type {object} */ effect) =>
		INDEPENDENT_KINDS.includes(kindOf(effect))
	);
}

/**
 * Runs one effect of an `effects` operation; the rest wait under whatever it pushes.
 * @type {import('../state.js').AutomaticKind}
 */
export function runEffects(ctx, op) {
	if (op.effects.length === 0) {
		return;
	}
	if (op.player === null) {
		throw new Error('Effects need a player to run for.');
	}
	const index = nextIndex(op);
	if (index === -1) {
		ctx.push([
			{
				player: op.player,
				kind: 'chooseOrder',
				effects: op.effects,
				source: op.source,
			},
		]);
		return;
	}
	const effect = op.effects[index];
	const rest = op.effects.filter(
		(/** @type {object} */ _, /** @type {number} */ i) => i !== index
	);
	if (rest.length) {
		// The continuation keeps every other field (a source, `ordered`); `push` gives it a new id and batch.
		const { id: _id, batch: _batch, ...kept } = op;
		ctx.push([{ ...kept, effects: rest }]);
	}
	const kind = kindOf(effect);
	const handler = EFFECTS[kind];
	if (!handler) {
		throw new Error(`The ${kind} effect isn't built yet.`);
	}
	handler(
		ctx,
		op.player,
		effect[/** @type {keyof typeof effect} */ (kind)],
		op
	);
}
