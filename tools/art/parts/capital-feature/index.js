// What a mat prints on its buildable plots, as one transparent picture per mat that the game lays between the ground and the relief (#132).
import { createCanvas } from '../../painter.js';
import { reliefSize } from '../../../../src/lib/art/relief.js';
import { paintArchipelagoFeatures } from './archipelago.js';
import { paintCanyonFeatures } from './canyon.js';
import { paintCloudCityFeatures } from './cloud-city.js';
import { paintSwampFeatures } from './swamp.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../capital-relief/index.js').MatData} MatData */

/**
 * Paints a mat's printed features on its buildable plots, on a transparent canvas of the mat's relief size.
 * @typedef {(canvas: Canvas, layout: readonly string[], mat: MatData) => void} FeaturePainter
 */

/**
 * The painter of each mat that prints features, in the order of FEATURE_BIOMES.
 * @type {Readonly<Record<string, FeaturePainter>>}
 */
export const FEATURE_PAINTERS = Object.freeze({
	archipelago: paintArchipelagoFeatures,
	canyon: paintCanyonFeatures,
	'cloud-city': paintCloudCityFeatures,
	swamp: paintSwampFeatures,
});

/**
 * Draws a mat's printed features: transparent everywhere but its feature plots.
 * @param {readonly string[]} layout - The mat's printed layout
 * @param {string} biome - Such as 'canyon'
 * @param {MatData} [mat] - The mat's volcanoes or clouds
 * @returns {Canvas} The picture, `reliefSize` of the layout
 * @throws {Error} When the mat prints no features.
 */
export function drawFeatures(layout, biome, mat = {}) {
	if (!Object.hasOwn(FEATURE_PAINTERS, biome)) {
		throw new Error(`No features for ${biome}`);
	}
	const { w, h } = reliefSize(layout.length, layout[0].length);
	const canvas = createCanvas(w, h);
	FEATURE_PAINTERS[biome](canvas, layout, mat);
	return canvas;
}
