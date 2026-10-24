// The vp effect: victory points gained now, either a number or so many per thing counted.
import { emit } from '../events.js';
import { playerSeat, seatOf } from '../state.js';
import { controlledTerritories } from '../control.js';
import { spacesAdvanced } from '../movement.js';
import { BUILDING_IDS } from '../data/ids.js';

/** How many income buildings of each type a player starts with on the income mat. */
const BUILDINGS_PER_ROW = 5;

/**
 * How many things a VP counter counts for a player (data/effects.js, VpCounter).
 * @param {import('../state.js').State} state
 * @param {number} player
 * @param {import('../data/effects.js').VpCounter} per
 * @param {import('../data/ids.js').TrackId} [track] - For 'trackSpace'
 * @returns {number}
 */
export function countVp(state, player, per, track) {
	if (per === 'territory') {
		return controlledTerritories(state, player).length;
	}
	if (per === 'trackSpace') {
		if (!track) {
			throw new Error('A trackSpace counter needs a track.');
		}
		return spacesAdvanced(seatOf(state, player), track);
	}
	const seat = playerSeat(state, player);
	if (per === 'territoryTile') {
		return seat.territoryTiles.length;
	}
	if (per === 'techCard') {
		const { bottom, middle, top } = seat.tech;
		return bottom.length + middle.length + top.length;
	}
	if (per === 'tapestryCard') {
		// Covered cards count too (01 §3.5, Anti-Aircraft Defense).
		return seat.incomeMat.tapestry.reduce(
			(sum, slot) => sum + slot.length,
			seat.hand.length
		);
	}
	if (BUILDING_IDS.includes(per)) {
		// R71: every building that has left the income mat counts, placed or not.
		return BUILDINGS_PER_ROW - seat.incomeMat.buildings[per];
	}
	throw new Error(`Unknown VP counter "${per}".`);
}

/**
 * Adds victory points to a seat (any kind, since bots gain them too).
 * @type {import('../state.js').EffectHandler}
 */
export function vp(ctx, player, value) {
	const amount =
		typeof value === 'number'
			? value
			: countVp(ctx.state, player, value.per, value.track) *
				(value.each ?? 1);
	const seat = seatOf(ctx.state, player);
	seat.vp += amount;
	emit(ctx.state, { type: 'vpGained', player, vp: amount, total: seat.vp });
}
