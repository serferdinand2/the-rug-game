// Arts & Architecture's masterpieces and inspiration tiles (03 §2.2–2.8): the effects the arts track's spaces name.
import { emit } from '../events.js';
import { playerSeat } from '../state.js';
import {
	askMasterpiece,
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

/**
 * Broadcast: gain the benefit of one of your unused masterpieces (03 §2.7).
 * @type {import('../state.js').EffectHandler}
 */
export function broadcast(ctx, player) {
	askMasterpiece(ctx, player, 'broadcast', []);
}

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

/**
 * Streaming Implants: the benefits of up to 3 different masterpieces, chosen one at a time from yours and your
 * neighbours'; never a used one, nor another player's single-use one (03 §2.3, §2.12).
 * @type {import('../state.js').EffectHandler}
 */
export function streamingImplants(ctx, player) {
	askMasterpiece(ctx, player, 'implants', [], 3);
}

/**
 * Turns the masterpiece firing face down: a single-use card's (Art Deco, Mime), which fires no more.
 * @type {import('../state.js').EffectHandler}
 */
export function flipMasterpiece(ctx, player, value, op) {
	const card = op.source?.masterpiece;
	const held = (playerSeat(ctx.state, player).masterpieces ?? []).find(
		(m) => m.card === card && !m.used
	);
	if (!held) {
		throw new Error(`Seat ${player} holds no unused masterpiece ${card}.`);
	}
	held.used = true;
	emit(ctx.state, { type: 'masterpieceFlipped', player, card });
}
