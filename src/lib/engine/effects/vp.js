// The vp effect: victory points gained now, either a number or so many per thing counted.
import { emit } from '../events.js';
import { botSeat, playerSeat, seatOf } from '../state.js';
import { sourceOrigin } from '../stack.js';
import { controlledTerritories } from '../control.js';
import { terrainsOf } from '../terrain.js';
import { spacesAdvanced } from '../movement.js';
import { tapestryCard } from '../data/tapestry-cards.js';
import { BUILDING_IDS } from '../data/ids.js';
import { tracksOf } from '../tracks-in-play.js';
import { ALL_LANDMARKS } from '../data/landmarks.js';
import { MAPS } from '../data/maps.js';
import { capitalScore } from '../city.js';

/** How many income buildings of each type a player starts with on the income mat. */
const BUILDINGS_PER_ROW = 5;

/**
 * The landmarks a player owns: those in the capital, then those beside the mat, then those on the map as Nomads
 * pieces, toppled or not, in map order (R71), then those on A&A's landmark tech cards (03 §2, #37), then those the
 * Urban Planners keep on their mat, then those on A&A's tapestry cards (#37).
 * A bot instead owns the contents of its landmark box, including solo Shadow's acquisitions stored by Automa.
 * @param {import('../state.js').State} state
 * @param {number} player
 * @returns {string[]}
 */
export function landmarksOwned(state, player) {
	if (seatOf(state, player).kind !== 'player') {
		return [...botSeat(state, player).landmarks];
	}
	const seat = playerSeat(state, player);
	const ids = new Set(ALL_LANDMARKS.map((landmark) => landmark.id));
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
		...Object.values(seat.techLandmarks ?? {}),
		...(seat.civData['urban-planners']?.stored ?? []),
		...(seat.civData.collectors?.items.landmark !== undefined
			? [seat.civData.collectors.items.landmark]
			: []),
		...Object.values(seat.onCards ?? {}).flatMap((pieces) =>
			pieces.flatMap((piece) =>
				'landmark' in piece ? [piece.landmark] : []
			)
		),
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
	if (per === 'cloudTerritory') {
		// Cloud Colonies: a territory tile's or a printed hex's own picture decides (R77, #49).
		return controlledTerritories(state, player).filter(
			(hex) => terrainsOf(state, hex)?.clouds === true
		).length;
	}
	if (per === 'trackSpace') {
		if (!track) {
			throw new Error('A trackSpace counter needs a track.');
		}
		return spacesAdvanced(seatOf(state, player), track);
	}
	if (per === 'trackLead') {
		const me = seatOf(state, player);
		// R118: the arts track counts too.
		return tracksOf(state).filter((id) =>
			state.seats.every(
				(other) => spacesAdvanced(other, id) <= spacesAdvanced(me, id)
			)
		).length;
	}
	if (per === 'opponent') {
		return state.seats.length - 1;
	}
	if (per === 'landmark') {
		return landmarksOwned(state, player).length;
	}
	const seat = playerSeat(state, player);
	// The Collectors' items still count as theirs (#37).
	const items = seat.civData.collectors?.items ?? {};
	if (per === 'territoryTile') {
		// F&F: tiles reserved on the overlay count too (Quest Culture, #39).
		const reserved = (seat.reserved ?? []).reduce(
			(sum, item) =>
				sum + ('territory' in item ? item.territory.length : 0),
			0
		);
		return (
			seat.territoryTiles.length +
			(items.territory !== undefined ? 1 : 0) +
			reserved
		);
	}
	if (per === 'techCard') {
		const { bottom, middle, top } = seat.tech;
		return (
			bottom.length +
			middle.length +
			top.length +
			(items.tech !== undefined ? 1 : 0)
		);
	}
	if (per === 'tapestryCard') {
		// Covered cards count too (01 §3.5, Anti-Aircraft Defense).
		return seat.incomeMat.tapestry.reduce(
			(sum, slot) => sum + slot.length,
			seat.hand.length + (items.tapestry !== undefined ? 1 : 0)
		);
	}
	if (per === 'incomeBuilding') {
		// R71, every type (the Holocenter, #35); a building reserved on F&F's overlay is never in the capital (#39).
		const reserved = (seat.reserved ?? []).filter(
			(item) => 'building' in item
		).length;
		return (
			BUILDING_IDS.reduce(
				(sum, id) =>
					sum + BUILDINGS_PER_ROW - seat.incomeMat.buildings[id],
				0
			) - reserved
		);
	}
	if (per === 'marketRow') {
		// Hive Mind: each capital row, filled or not, with at least 1 market (03 FF.4.3 #18, #40).
		return new Set(
			seat.capital.buildings
				.filter((b) => b.building === 'market')
				.map((b) => b.row)
		).size;
	}
	if (per === 'charm') {
		// Wizards' Guild: each charm tag on the face-up top card of an era slot, its own included (03 FF.2.1, #40).
		const { tapestry, faceDown } = seat.incomeMat;
		return tapestry.reduce((sum, slot) => {
			const top = slot.at(-1);
			if (top === undefined || faceDown.includes(top)) {
				return sum;
			}
			const charms = tapestryCard(top).charms ?? {};
			return sum + (charms.left ? 1 : 0) + (charms.right ? 1 : 0);
		}, 0);
	}
	if (per === 'buildingLeft') {
		// The income buildings still on the income mat (Ghost Towns, #39).
		return BUILDING_IDS.reduce(
			(sum, id) => sum + seat.incomeMat.buildings[id],
			0
		);
	}
	if (per === 'capitalRow' || per === 'capitalColumn') {
		// Ballet and Modern Dance: not scoring the capital, so no capital-scoring trigger fires (03 §2.12).
		const { rows, columns } = capitalScore(seat);
		return per === 'capitalRow' ? rows : columns;
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
