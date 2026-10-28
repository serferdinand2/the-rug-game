// What each capital plot shows: its ground tile, whether a building cleared it, and whether it holds a cube.
import { artUrl, capitalTileUrl } from './ui.js';
import { RELIEF_BIOMES } from './art/relief.js';
import { CAPITAL_MATS } from './engine/data/capitals.js';

/**
 * @typedef {object} PlotTerrain
 * @property {string} ground - The ground tile's URL
 * @property {boolean} cleared - A printed impassable plot that a building now covers, under a relief
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
 * What every plot of a capital shows.
 * @param {import('./capital.js').PlotKind[]} plots - All plots, row by row
 * @param {string} biome
 * @param {number} seed - This game's visual setup seed
 * @returns {PlotTerrain[]}
 */
export function plotTerrain(plots, biome, seed) {
	const mat = CAPITAL_MATS.find((m) => m.id === biome);
	const grid = mat ? mat.grid.join('') : null;
	const hasRelief = reliefUrl(biome) !== null;
	const tileBiome = /** @type {import('./ui.js').CapitalBiome} */ (biome);
	return plots.map((kind, i) => {
		const printed = grid ? grid[i] === '1' : kind === 'blocked';
		const blocked = kind === 'blocked';
		return {
			ground: capitalTileUrl(
				tileBiome,
				blocked && printed && !hasRelief,
				i,
				seed
			),
			cleared: printed && !blocked && hasRelief,
			cube: blocked && !printed,
		};
	});
}
