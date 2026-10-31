// The advanced capital biomes (#6): each module holds its printed layout and features; the Fantasies & Futures ones
// still draw their 32×32 plots and example mats, while the Arts & Architecture mats have reliefs (#132).
import * as archipelago from './archipelago.js';
import * as canyon from './canyon.js';
import * as cavern from './cavern.js';
import * as cloudCity from './cloud-city.js';
import * as mesa from './mesa.js';
import * as swamp from './swamp.js';
import * as quagmire from './quagmire.js';
import * as cityInABottle from './city-in-a-bottle.js';
import * as veil from './veil.js';
import * as savanna from './savanna.js';
import * as polar from './polar.js';
import * as netherworld from './netherworld.js';

/**
 * A tile variant that carries printed meaning, so it may not be picked at random.
 * @typedef {Object} BiomeSpecialVariants
 * @property {boolean} blocked - Whether these are impassable variants (otherwise open ones)
 * @property {readonly number[]} variants - 0-based variant indexes, as `drawBiomeTile` takes them
 * @property {string} meaning - What they mean and where they belong
 */

/**
 * A feature only the example mat draws, not a plot's tile.
 * @typedef {Object} BiomeMatFeature
 * @property {string} name - What it is
 * @property {string} where - Where it sits and what it is drawn from
 */

/**
 * What a biome offers to compose advanced mats in the game (#36).
 * @typedef {Object} BiomeFeatures
 * @property {{ open: readonly number[], blocked: readonly number[] }} pools - The ordinary variants, safe to pick at random on any plot
 * @property {readonly BiomeSpecialVariants[]} special - The variants that carry printed meaning
 * @property {readonly BiomeMatFeature[]} matOnly - What only the example mat draws
 */

/**
 * One advanced biome's drawing module.
 * @typedef {Object} BiomeModule
 * @property {readonly string[]} LAYOUT - The printed layout, one string per row: '.' open, 'X' impassable
 * @property {(blocked: boolean, variant: number) => import('../../painter.js').Canvas} [drawBiomeTile] - One 32×32 plot;
 *   only the Fantasies & Futures biomes keep their own tiles, until #133 draws their reliefs
 * @property {() => import('../../painter.js').Canvas} [drawBiomeMat] - The example mat, likewise
 * @property {BiomeFeatures} FEATURES - Which variants are ordinary, which are special, and what only the mat draws
 */

/**
 * Every advanced biome, by its catalog slug.
 * @type {Readonly<Record<string, BiomeModule>>}
 */
export const BIOMES = Object.freeze({
	archipelago: archipelago,
	canyon: canyon,
	cavern: cavern,
	'cloud-city': cloudCity,
	mesa: mesa,
	swamp: swamp,
	quagmire: quagmire,
	'city-in-a-bottle': cityInABottle,
	veil: veil,
	savanna: savanna,
	polar: polar,
	netherworld: netherworld,
});
