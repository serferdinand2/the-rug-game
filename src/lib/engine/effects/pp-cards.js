// Plans & Ploys' tapestry cards whose rules are their own effect kind (#33; 03 §1.4): Astronomy, Cartography, Manifest Destiny, Status Quo and World's Fair.
import { emit } from '../events.js';
import { playerSeat } from '../state.js';
import { controlledTerritories } from '../control.js';
import {
	cityPlots,
	completeDistricts,
	completeLines,
	seatShape,
} from '../city.js';
import { spacesAdvanced } from '../movement.js';
import { askHex } from '../decisions/choose-hex.js';
import { hexNeighbours } from '../data/maps.js';
import { TERRITORY_TILES } from '../data/territory-tiles.js';
import { TRACK_IDS } from '../data/ids.js';
import { TRACKS, tierOf } from '../data/tracks.js';
import { gainTiles } from './gain.js';

/** Cartography's conquest needs at least this many VP from the exploration's matching sides (03 §1.4). */
const CARTOGRAPHY_VP = 3;

/** The tiers a Status Quo bonus can come from, in the order they are taken. */
const TIERS = [1, 2, 3, 4];

/**
 * Astronomy: gain 1 territory tile and explore with it, then gain 2 space tiles, kept unexplored.
 * @type {import('../state.js').EffectHandler}
 */
export function astronomy(ctx, player, value, op) {
	const [tile] = gainTiles(ctx, player, 'territory', 1);
	ctx.push([
		{
			player,
			kind: 'effects',
			effects: [
				...(tile === undefined ? [] : [{ explore: { tile } }]),
				{ gain: { space: 2 } },
			],
			ordered: true,
			source: op.source,
		},
	]);
}

/**
 * Cartography: gain 1 territory tile and explore with it; `cartographyCheck` then offers its conquest.
 * @type {import('../state.js').EffectHandler}
 */
export function cartography(ctx, player, value, op) {
	const [tile] = gainTiles(ctx, player, 'territory', 1);
	if (tile === undefined) {
		return;
	}
	ctx.push([
		{
			player,
			kind: 'effects',
			effects: [{ explore: { tile } }],
			source: op.source,
		},
		{ player, kind: 'cartographyCheck', tile, source: op.source },
	]);
}

/**
 * After Cartography's exploration: if it scored at least 3 VP, the player may conquer that territory. A tile that
 * could not be placed offers nothing.
 * @type {import('../state.js').AutomaticKind}
 */
export function cartographyCheck(ctx, op) {
	const player = /** @type {number} */ (op.player);
	const explored = ctx.state.events.findLast(
		(e) =>
			e.type === 'explored' && e.player === player && e.tile === op.tile
	);
	if (!explored || explored.vp < CARTOGRAPHY_VP) {
		return;
	}
	ctx.push([
		{
			player,
			kind: 'chooseOption',
			options: [
				[],
				[{ conquer: { only: [explored.hex], anywhere: true } }],
			],
			purpose: 'cartography',
			source: op.source,
		},
	]);
}

/**
 * Manifest Destiny: conquer a territory next to the player's capital-city territory, then they may gain the benefit
 * of a territory tile they control (a printed territory has none, R27).
 * @type {import('../state.js').EffectHandler}
 */
export function manifestDestiny(ctx, player, value, op) {
	const start = playerSeat(ctx.state, player).start;
	ctx.push([
		{
			player,
			kind: 'effects',
			effects: [
				{
					conquer: {
						only: start === null ? [] : hexNeighbours(start),
						anywhere: true,
					},
				},
			],
			source: op.source,
		},
		{ player, kind: 'manifestDestinyBenefit', source: op.source },
	]);
}

/**
 * Manifest Destiny's second part, once the conquest is over: the tile to gain the benefit of, if any.
 * @type {import('../state.js').AutomaticKind}
 */
export function manifestDestinyBenefit(ctx, op) {
	const { state } = ctx;
	const player = /** @type {number} */ (op.player);
	const options = controlledTerritories(state, player).filter((hex) => {
		const tile = state.hexes[hex].tile;
		return tile !== null && tile <= TERRITORY_TILES.length;
	});
	askHex(ctx, player, options, true, 'manifestDestiny', {
		kind: 'territoryBenefit',
	});
}

/**
 * The benefit printed on the territory tile of a chosen hex.
 * @type {import('../state.js').AutomaticKind}
 */
export function territoryBenefit(ctx, op) {
	ctx.push([
		{
			player: op.player,
			kind: 'effects',
			effects: [{ tileBenefit: {} }],
			source: { hex: op.hex },
		},
	]);
}

/**
 * Status Quo: one free bonus from each tier I to IV where the player has a token on a space with a bonus. A tier
 * with several such tracks asks which; every tier is taken, since a free bonus never hurts (design §5).
 * @type {import('../state.js').EffectHandler}
 */
export function statusQuo(ctx, player) {
	const seat = playerSeat(ctx.state, player);
	/** @type {import('../state.js').NewOperation[]} */
	const ops = [];
	for (const tier of TIERS) {
		const tracks = TRACK_IDS.filter((track) => {
			const space = spacesAdvanced(seat, track);
			return (
				space > 0 &&
				tierOf(space) === tier &&
				TRACKS[track][space].bonus !== null
			);
		});
		if (tracks.length === 1) {
			ops.push({ player, kind: 'statusQuoBonus', track: tracks[0] });
		} else if (tracks.length > 1) {
			ops.push({
				player,
				kind: 'chooseTrack',
				options: tracks,
				purpose: 'statusQuo',
				then: { kind: 'statusQuoBonus' },
			});
		}
	}
	if (ops.length === 0) {
		emit(ctx.state, { type: 'noStatusQuo', player });
		return;
	}
	ctx.push(ops);
}

/**
 * The bonus of a player's current space on a track, gained without paying.
 * @type {import('../state.js').AutomaticKind}
 */
export function statusQuoBonus(ctx, op) {
	const player = /** @type {number} */ (op.player);
	const track = /** @type {import('../data/ids.js').TrackId} */ (op.track);
	const space = spacesAdvanced(playerSeat(ctx.state, player), track);
	const bonus = TRACKS[track][space].bonus;
	emit(ctx.state, { type: 'freeBonus', player, track, space });
	ctx.push([
		{
			player,
			kind: 'effects',
			effects: structuredClone(bonus?.gain ?? []),
			ordered: true,
		},
	]);
}

/**
 * World's Fair, after its culture: any 1 resource with at least one complete row or column, then 1 VP per complete
 * district. Impassable plots count as filled, as the capital's scoring counts them.
 * @type {import('../state.js').EffectHandler}
 */
export function worldsFair(ctx, player) {
	const seat = playerSeat(ctx.state, player);
	if (seat.capital.mat === null) {
		return;
	}
	const plots = cityPlots(seat);
	const shape = seatShape(seat);
	const { rows, columns } = completeLines(plots, shape);
	const districts = completeDistricts(plots, shape).length;
	ctx.push([
		{
			player,
			kind: 'effects',
			effects: [
				...(rows + columns > 0 ? [{ gain: { any: 1 } }] : []),
				...(districts > 0 ? [{ vp: districts }] : []),
			],
			ordered: true,
		},
	]);
}
