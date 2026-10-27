// The advanced capital biomes (#6): each module draws its 32×32 plots and its example mat on its printed layout.
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
 * One advanced biome's drawing module.
 * @typedef {Object} BiomeModule
 * @property {readonly string[]} LAYOUT - The printed layout, one string per row: '.' open, 'X' impassable
 * @property {(blocked: boolean, variant: number) => import('../../painter.js').Canvas} drawBiomeTile - One 32×32 plot
 * @property {() => import('../../painter.js').Canvas} drawBiomeMat - The example mat
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
