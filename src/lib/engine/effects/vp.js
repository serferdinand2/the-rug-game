// The vp effect: victory points gained now, either a number or so many per thing counted.
import { emit } from '../events.js';
import { playerSeat, seatOf } from '../state.js';
import { sourceOrigin } from '../stack.js';
import { controlledTerritories } from '../control.js';
import { spacesAdvanced } from '../movement.js';
import { BUILDING_IDS, TRACK_IDS } from '../data/ids.js';
import { LANDMARKS } from '../data/landmarks.js';
import { MAPS } from '../data/maps.js';

/** How many income buildings of each type a player starts with on the income mat. */
const BUILDINGS_PER_ROW = 5;

/**
 * The landmarks a player owns: those in the capital, then those beside the mat, then those on the map as Nomads
 * pieces, toppled or not, in map order (R71).
 * @param {import('../state.js').State} state
 * @param {number} player
 * @returns {string[]}
 */
export function landmarksOwned(state, player) {
	const seat = playerSeat(state, player);
	const ids = new Set(LANDMARKS.map((landmark) => landmark.id));
	const onMap = MAPS[state.map].hexes.flatMap((hex) =>
		state.hexes[hex].outposts.flatMap(({ seat: owner, piece }) =>
			owner === player && piece && 'landmark' in piece
				? [piece.landmark]
				: []
		)
	);
	return [
		...seat.capital.landmarks.map((piece) => piece.landmark),
		...seat.besideMat.filter((id) => ids.has(id)),
		...onMap,
	];
}

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
	if (per === 'trackLead') {
		const me = seatOf(state, player);
		return TRACK_IDS.filter((id) =>
			state.seats.every(
				(other) => spacesAdvanced(other, id) <= spacesAdvanced(me, id)
			)
		).length;
	}
	if (per === 'opponent') {
		return state.seats.length - 1;
	}
	const seat = playerSeat(state, player);
	if (per === 'landmark') {
		return landmarksOwned(state, player).length;
	}
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
 * Adds victory points to a seat (any kind, since bots gain them too), credited in `vpSources` to the operation's
 * VP source (#29 design §2): its `origin`, else what its `source` names, else other.
 * @type {import('../state.js').EffectHandler}
 */
export function vp(ctx, player, value, op) {
	const amount =
		typeof value === 'number'
			? value
			: countVp(ctx.state, player, value.per, value.track) *
				(value.each ?? 1);
	const seat = seatOf(ctx.state, player);
	/** @type {import('../stack.js').VpSource} */
	const source = op?.origin ?? sourceOrigin(op?.source) ?? 'other';
	seat.vp += amount;
	if (amount !== 0) {
		// A seat made without sources (a bot's, #31) starts them here.
		seat.vpSources ??= {};
		seat.vpSources[source] = (seat.vpSources[source] ?? 0) + amount;
	}
	emit(ctx.state, {
		type: 'vpGained',
		player,
		vp: amount,
		total: seat.vp,
		source,
	});
}
