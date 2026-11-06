// The advanced capital biomes (#6): each module holds its printed layout, data and features, and the sprites of what
// it prints; every advanced mat has a relief (#132, #133).
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
 * @property {readonly number[]} variants - 0-based variant indexes
 * @property {string} meaning - What they mean and where they belong
 */

/**
 * A printed feature that a picture of its own draws, not a plot's tile.
 * @typedef {Object} BiomeMatFeature
 * @property {string} name - What it is
 * @property {string} where - Where it sits and what it is drawn from
 */

/**
 * What a biome offers to compose advanced mats in the game (#36).
 * @typedef {Object} BiomeFeatures
 * @property {{ open: readonly number[], blocked: readonly number[] }} pools - The ordinary variants, safe to pick at random on any plot
 * @property {readonly BiomeSpecialVariants[]} special - The variants that carry printed meaning
 * @property {readonly BiomeMatFeature[]} matOnly - Each printed feature and the picture that draws it
 */

/**
 * One advanced biome's drawing module.
 * @typedef {Object} BiomeModule
 * @property {readonly string[]} LAYOUT - The printed layout, one string per row: '.' open, 'X' impassable
 * @property {BiomeFeatures} FEATURES - Which variants are ordinary, which are special, and which picture draws each printed feature
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
