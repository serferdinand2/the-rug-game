// What each capital plot shows: its ground tile, whether a building cleared it, and whether it holds a cube.
import { artUrl, capitalTileUrl } from './ui.js';
import {
	CLOUD_TINTS,
	CLOUD_TINT_NAMES,
	FEATURE_BIOMES,
	RELIEF_BIOMES,
} from './art/relief.js';
import { ADVANCED_MATS, CAPITAL_MATS } from './engine/data/capitals.js';

/**
 * @typedef {object} PlotTerrain
 * @property {string} ground - The ground tile's URL
 * @property {boolean} cleared - A printed impassable plot that a building now covers, under a relief, or a printed lily
 *   pad or cactus that a piece now covers, under the features picture (#36): its ground draws over the picture
 * @property {boolean} cube - An Architects' cube sits on an open plot
 */

/**
 * The relief picture of a biome, if it has one.
 * @param {string} biome
 * @returns {string | null}
 * @example reliefUrl('forest') // '/art/capital-relief/forest.svg'
 */
export function reliefUrl(biome) {
	return RELIEF_BIOMES.includes(biome)
		? artUrl(`capital-relief/${biome}`)
		: null;
}

/**
 * The features picture of a biome, if it has one: what the mat prints on its buildable plots, between the ground and
 * the relief (#132).
 * @param {string} biome
 * @returns {string | null}
 * @example featureUrl('canyon') // '/art/capital-feature/canyon.svg'
 */
export function featureUrl(biome) {
	return FEATURE_BIOMES.includes(biome)
		? artUrl(`capital-feature/${biome}`)
		: null;
}

/** The plot kinds a piece leaves: a building or a landmark. */
const EMPTY_KINDS = new Set(['empty', 'lily', 'blocked']);

/**
 * What every plot of a capital shows.
 * @param {import('./capital.js').PlotKind[]} plots - All plots, row by row
 * @param {string} biome
 * @param {number} seed - This game's visual setup seed
 * @returns {PlotTerrain[]}
 */
export function plotTerrain(plots, biome, seed) {
	const mat = [...CAPITAL_MATS, ...ADVANCED_MATS].find((m) => m.id === biome);
	const grid = mat ? mat.grid.join('') : null;
	const districts = mat?.districts?.join('') ?? null;
	const hasRelief = reliefUrl(biome) !== null;
	return plots.map((kind, i) => {
		const symbol = grid?.[i];
		const printed = grid ? symbol === '1' : kind === 'blocked';
		const blocked = kind === 'blocked';
		const covered = !EMPTY_KINDS.has(kind);
		// Cloud City's ground follows each plot's cloud tint (#132).
		const ground =
			biome === 'cloud-city' && districts
				? `cloud-city-${CLOUD_TINT_NAMES[CLOUD_TINTS[Number(districts[i])]]}`
				: biome;
		return {
			ground: capitalTileUrl(
				ground,
				blocked && printed && !hasRelief,
				i,
				seed
			),
			cleared:
				(printed && !blocked && hasRelief) ||
				((symbol === 'L' || symbol === 'C') && covered),
			// A surrounded Canyon cactus is blocked but no cube (R122).
			cube: blocked && (grid ? symbol === '0' : !printed),
		};
	});
}
