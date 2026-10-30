// The player area's terrain (#27 design §2.7): a seat's territory tiles in hand and its space tiles, held and explored.
import { TERRITORY_TILES } from '../engine/data/territory-tiles.js';
import { describeEffects } from '../describe.js';
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
 * A space tile, held or explored beside the income mat.
 * @typedef {Object} SpaceEntry
 * @property {number} id - The tile's number (the art is `space-tile/<id>`)
 * @property {boolean} explored
 */

/**
 * What a seat holds of terrain: its territory tiles, and its space tiles held first, then explored.
 * @param {{ territoryTiles: number[], spaceTiles: number[], exploredSpace: number[] }} seat
 * @returns {{ territories: HeldTerritory[], space: SpaceEntry[] }}
 */
export function terrainView(seat) {
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
			...seat.spaceTiles.map((id) => ({ id, explored: false })),
			...seat.exploredSpace.map((id) => ({ id, explored: true })),
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
