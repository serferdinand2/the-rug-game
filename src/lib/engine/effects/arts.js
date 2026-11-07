// Arts & Architecture's masterpieces and inspiration tiles (03 §2.2–2.8): the effects the arts track's spaces name.
import { emit } from '../events.js';
import {
	canRefresh,
	createOptions,
	refreshFaceUp,
	takeMasterpiece,
} from '../masterpieces.js';

/**
 * An effect whose rules come in #35 part 2. No table plays the arts track before then: the branch merges whole.
 * @param {string} kind
 * @returns {import('../state.js').EffectHandler}
 */
function partTwo(kind) {
	return () => {
		throw new Error(`${kind} is built in #35 part 2.`);
	};
}

/**
 * Create: take a face-up masterpiece or the deck's top card (03 §2.7). With one option it is taken at once; with none
 * (R119, or no arts track) nothing happens.
 * @type {import('../state.js').EffectHandler}
 */
export function create(ctx, player) {
	const options = createOptions(ctx.state);
	if (options.length === 0) {
		emit(ctx.state, { type: 'noMasterpiece', player });
		return;
	}
	if (options.length === 1) {
		takeMasterpiece(ctx, player, options[0]);
		return;
	}
	ctx.push([{ player, kind: 'chooseCreate', options }]);
}

/** Inspire: place an inspiration tile on its income row (03 §2.8). */
export const inspire = partTwo('inspire');

/** Broadcast: gain the benefit of one of your masterpieces (03 §2.7). */
export const broadcast = partTwo('broadcast');

/**
 * Refresh the face-up masterpieces: discard them and turn 3 new ones up. Rock Opera's is `optional`, so it asks; with
 * nothing face up or to draw, nothing can change, and nobody is asked.
 * @type {import('../state.js').EffectHandler}
 */
export function refreshMasterpieces(ctx, player, value) {
	if (!canRefresh(ctx.state)) {
		return;
	}
	if (value?.optional) {
		ctx.push([{ player, kind: 'chooseRefresh' }]);
		return;
	}
	refreshFaceUp(ctx, player);
}

/** Streaming Implants: up to 3 different masterpieces, yours or your neighbours' (03 §2.3). */
export const streamingImplants = partTwo('streamingImplants');
