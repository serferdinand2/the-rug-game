// The player area's terrain (#27 design §2.7): a seat's territory tiles in hand and its space tiles, held and explored.
import { TERRITORY_TILES } from '../engine/data/territory-tiles.js';
import { spaceTile } from '../engine/data/space-tiles.js';
import { describeEffects, effectsPhrase } from '../describe.js';
import { civilizationName, trackName } from '../game-names.js';
import { RESOURCES } from '../ui.js';

/** @typedef {import('../ui.js').Terrain} Terrain */

/**
 * A territory tile in hand, ready to draw.
 * @typedef {Object} HeldTerritory
 * @property {number} id - The tile's number, 1–48
 * @property {Terrain[]} corners - Six corner terrains, clockwise from the top-left
 * @property {Terrain[]} island - The island's terrains; empty when there is none
 * @property {boolean} clouds - Its picture shows clouds (R77)
 * @property {boolean} volcano - Its picture shows a volcano (R77)
 */

/**
 * A space tile, held, explored beside the income mat, or explored onto a civilization's mat.
 * @typedef {Object} SpaceEntry
 * @property {number} id - The tile's number
 * @property {boolean} explored
 * @property {string} art - Its art's catalog id, from spaceTileArt()
 * @property {string} [civ] - The civilization whose mat it is on (the Aliens', #33); left out beside the income mat
 */

/**
 * A space tile's art catalog id: `space-tile/<id>`, or its slug for an expansion's tile, such as
 * `space-tile/technology-5-vp` (#32).
 * @param {number} id
 * @returns {string}
 */
export function spaceTileArt(id) {
	return `space-tile/${spaceTile(id).art ?? id}`;
}

/**
 * What a space tile does once explored, as a phrase: its benefit, or what it does whenever its player advances (#32).
 * @param {number} id
 * @param {any} [table] - The view, to name seats
 * @returns {string}
 */
export function spaceTileWords(id, table) {
	const tile = spaceTile(id);
	if (tile.ongoing) {
		return `whenever you advance on the ${trackName(tile.ongoing.track).toLowerCase()} track, gain ${tile.ongoing.vp} VP`;
	}
	return effectsPhrase(tile.benefit, table, tile.ordered);
}

/**
 * Where a space tile is, in words for its caption: "In hand", "Explored", or "On the Aliens’ mat".
 * @param {SpaceEntry} entry
 * @returns {string}
 */
export function spacePlace(entry) {
	if (typeof entry.civ === 'string') {
		const name = civilizationName(entry.civ);
		return `On the ${name}${name.endsWith('s') ? '’' : '’s'} mat`;
	}
	return entry.explored ? 'Explored' : 'In hand';
}

/**
 * What a seat holds of terrain: its territory tiles, and its space tiles held first, then explored, then the one on
 * the Aliens' mat (#33), which was explored there and works until it is discarded.
 * @param {{ territoryTiles: number[], spaceTiles: number[], exploredSpace: number[], civData?: Record<string, any> }} seat
 * @returns {{ territories: HeldTerritory[], space: SpaceEntry[] }}
 */
export function terrainView(seat) {
	/** @type {unknown} */
	const onMat = seat.civData?.aliens?.tile;
	return {
		territories: seat.territoryTiles.map((id) => {
			const tile = TERRITORY_TILES[id - 1];
			return {
				id,
				corners: /** @type {Terrain[]} */ ([...tile.corners]),
				island: /** @type {Terrain[]} */ ([...tile.island]),
				clouds: tile.clouds,
				volcano: tile.volcano,
			};
		}),
		space: [
			...seat.spaceTiles.map((id) => ({
				id,
				explored: false,
				art: spaceTileArt(id),
			})),
			...seat.exploredSpace.map((id) => ({
				id,
				explored: true,
				art: spaceTileArt(id),
			})),
			...(typeof onMat === 'number'
				? [
						{
							id: onMat,
							explored: true,
							art: spaceTileArt(onMat),
							civ: 'aliens',
						},
					]
				: []),
		],
	};
}

/**
 * The existing icon and words for a territory tile's reward.
 * @typedef {Object} TerritoryBenefit
 * @property {string} icon - An art catalog id
 * @property {number} count - How many icons the reward represents
 * @property {boolean} crossed - The science die has no benefit
 * @property {boolean} upgrade - Draw an upgrade arrow over the tech-card icon
 * @property {string} words - The benefit in words, for the tile's hover title
 */

/**
 * The reward badge and matching hover text for a territory tile.
 * @param {number} id - The tile's number, 1–48
 * @returns {TerritoryBenefit}
 */
export function territoryBenefit(id) {
	const tile = TERRITORY_TILES[id - 1];
	if (!tile || tile.id !== id) {
		throw new RangeError(`unknown territory tile ${id}`);
	}

	const effect = tile.benefit[0];
	const [kind, value] = Object.entries(effect)[0] ?? [];
	/** @type {string | undefined} */
	let icon;
	let count = 1;
	let crossed = false;
	let upgrade = false;

	if (kind === 'gain' && typeof value === 'object' && value !== null) {
		const [gain, amount] = Object.entries(value)[0] ?? [];
		if (gain === 'territory') {
			icon = 'symbol/territory-tile';
		} else if (gain === 'tapestry') {
			icon = 'symbol/tapestry-card';
		} else if (RESOURCES.some((resource) => resource.id === gain)) {
			icon = `resource-24/${gain}`;
		} else if (['farm', 'house', 'market', 'armory'].includes(gain)) {
			icon = `building/${gain}`;
		}
		if (
			typeof amount === 'number' &&
			Number.isInteger(amount) &&
			amount > 0
		) {
			count = amount;
		}
	} else if (kind === 'building' && typeof value === 'string') {
		icon = `building/${value}`;
	} else if (kind === 'invent') {
		icon = 'symbol/invent';
	} else if (kind === 'research') {
		icon = 'symbol/science-die';
		crossed =
			typeof value === 'object' &&
			value !== null &&
			'noBenefit' in value &&
			Boolean(value.noBenefit);
	} else if (kind === 'upgrade') {
		icon = 'symbol/tech-card';
		upgrade = true;
	}

	if (!icon) {
		throw new RangeError(`territory tile ${id} has no reward icon`);
	}

	return {
		icon,
		count,
		crossed,
		upgrade,
		words: describeEffects(tile.benefit),
	};
}
