// Arts & Architecture's masterpieces and inspiration tiles (03 §2.2–2.8): the effects the arts track's spaces name.
import { emit } from '../events.js';
import { playerSeat } from '../state.js';
import { BUILDING_IDS } from '../data/ids.js';
import {
	askMasterpiece,
	canRefresh,
	createOptions,
	refreshFaceUp,
	takeMasterpiece,
} from '../masterpieces.js';

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

/**
 * Inspire: place one of your unused inspiration tiles on its income row; the buildings stay where they are (03 §2.8).
 * The last tile is placed without asking; with none left, nothing happens.
 * @type {import('../state.js').EffectHandler}
 */
export function inspire(ctx, player) {
	const options = uninspired(ctx.state, player);
	if (options.length === 0) {
		emit(ctx.state, { type: 'noInspire', player });
		return;
	}
	if (options.length === 1) {
		placeInspiration(ctx, player, options[0]);
		return;
	}
	ctx.push([{ player, kind: 'chooseInspire', options }]);
}

/**
 * The income rows a player has no inspiration tile on yet, in income-mat order.
 * @param {import('../state.js').State} state
 * @param {number} player
 * @returns {import('../data/ids.js').BuildingId[]}
 */
export function uninspired(state, player) {
	const placed = playerSeat(state, player).inspired ?? [];
	return BUILDING_IDS.filter((row) => !placed.includes(row));
}

/**
 * Places a player's inspiration tile on a row.
 * @param {import('../state.js').Context} ctx
 * @param {number} player
 * @param {import('../data/ids.js').BuildingId} row
 */
export function placeInspiration(ctx, player, row) {
	(playerSeat(ctx.state, player).inspired ??= []).push(row);
	emit(ctx.state, { type: 'inspired', player, row });
}

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
