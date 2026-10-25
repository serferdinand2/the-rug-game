// The effect handlers by kind, and the automatic operation that runs a list of effects.
import { seatOf } from '../state.js';
import { vp } from './vp.js';
import { gain } from './gain.js';
import { building } from './building.js';
import { choice } from './choice.js';
import { research } from './research.js';
import { advance, regress } from './move.js';
import { repeat } from './repeat.js';
import { restartToken } from './restart-token.js';
import { scoreCapital } from './score-capital.js';
import { explore, exploreSpace } from './explore.js';
import { conquer, tileBenefit } from './conquer.js';
import { invent, upgrade, techBenefit, landmark } from './tech.js';
import { tapestryOnTop } from './tapestry.js';

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
	scoreCapital,
	explore,
	exploreSpace,
	conquer,
	tileBenefit,
	invent,
	upgrade,
	techBenefit,
	landmark,
	tapestryOnTop,
};

/** @typedef {Record<string, any>} AnyEffect */

/**
 * The kind of an effect: its one key.
 * @param {object} effect
 * @returns {string}
 */
function kindOf(effect) {
	return Object.keys(effect)[0];
}

/**
 * A plain gain: resources, tiles, cards or a fixed number of VP. It only adds and reads nothing,
 * so running it before a benefit's other parts never costs the player anything.
 * @param {AnyEffect} effect
 * @returns {boolean}
 */
function isGain(effect) {
	return 'gain' in effect || typeof effect.vp === 'number';
}

/**
 * A VP counter, such as 1 VP per farm: what it gives depends on when it runs.
 * @param {AnyEffect} effect
 * @returns {boolean}
 */
function isCounter(effect) {
	return typeof effect.vp === 'object' && effect.vp !== null;
}

/**
 * Whether a part (not a gain) could change what a VP counter counts. A part that resolves further
 * benefits (an advance, a conquer, a tapestry card on top and the like) could change anything.
 * @param {AnyEffect} effect
 * @param {import('../data/effects.js').VpPer} counter
 * @returns {boolean}
 */
function changes(effect, counter) {
	const kind = kindOf(effect);
	if (
		isCounter(effect) ||
		kind === 'scoreCapital' ||
		kind === 'restartToken'
	) {
		return false;
	}
	if (kind === 'building') {
		return counter.per === effect.building;
	}
	if (kind === 'invent') {
		return counter.per === 'techCard';
	}
	if (kind === 'choice') {
		return effect.choice.some((/** @type {AnyEffect[]} */ option) =>
			option.some((part) => changes(part, counter))
		);
	}
	return true;
}

/**
 * Which effect of an operation runs now: the first in an ordered list (or a missing `ordered`, as in #13).
 * In an unordered one: a plain gain first, then a VP counter that no other part could change.
 * Otherwise -1: two or more parts remain whose order can matter, so the player chooses.
 * @param {import('../state.js').Operation} op
 * @returns {number}
 */
function nextIndex(op) {
	/** @type {AnyEffect[]} */
	const effects = op.effects;
	if (op.ordered !== false || effects.length < 2) {
		return 0;
	}
	const gain = effects.findIndex(isGain);
	if (gain !== -1) {
		return gain;
	}
	return effects.findIndex(
		(effect, i) =>
			isCounter(effect) &&
			effects.every((other, j) => j === i || !changes(other, effect.vp))
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
	// A finished player gains nothing but passive civilization VP (01 §4.3), which #20 marks `passive`.
	if (seatOf(ctx.state, op.player).finished && !op.passive) {
		return;
	}
	const index = nextIndex(op);
	if (index === -1) {
		ctx.push([
			{
				player: op.player,
				kind: 'chooseOrder',
				effects: op.effects,
				source: op.source,
				// A finished player's passive VP stays passive through the question (01 §4.3).
				...(op.passive && { passive: true }),
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
