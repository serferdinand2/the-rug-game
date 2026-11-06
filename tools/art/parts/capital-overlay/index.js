// What a mat prints over its relief, as one transparent picture per mat that the game lays over the relief (#133).
import { createCanvas } from '../../painter.js';
import { reliefSize } from '../../../../src/lib/art/relief.js';
import { paintBottleGlass } from './city-in-a-bottle.js';
import { paintVeilOverlay } from './veil.js';
import { paintSavannaOverlay } from './savanna.js';
import { paintPolarOverlay } from './polar.js';
import { paintNetherworldOverlay } from './netherworld.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../capital-relief/index.js').MatData} MatData */

/**
 * Paints what a mat prints over its relief, on a transparent canvas of the mat's relief size.
 * @typedef {(canvas: Canvas, layout: readonly string[], mat: MatData) => void} OverlayPainter
 */

/**
 * The painter of each mat that prints over its relief, in the order of OVERLAY_BIOMES.
 * @type {Readonly<Record<string, OverlayPainter>>}
 */
export const OVERLAY_PAINTERS = Object.freeze({
	'city-in-a-bottle': paintBottleGlass,
	veil: paintVeilOverlay,
	savanna: paintSavannaOverlay,
	polar: paintPolarOverlay,
	netherworld: paintNetherworldOverlay,
});

/**
 * Draws what a mat prints over its relief: transparent everywhere else.
 * @param {readonly string[]} layout - The mat's printed layout
 * @param {string} biome - Such as 'polar'
 * @param {MatData} [mat] - The mat's printed data: its sides and pockets, herds and districts, or field lines
 * @returns {Canvas} The picture, `reliefSize` of the layout
 * @throws {Error} When the mat prints nothing over its relief.
 */
export function drawOverlay(layout, biome, mat = {}) {
	if (!Object.hasOwn(OVERLAY_PAINTERS, biome)) {
		throw new Error(`No overlay for ${biome}`);
	}
	const { w, h } = reliefSize(layout.length, layout[0].length);
	const canvas = createCanvas(w, h);
	OVERLAY_PAINTERS[biome](canvas, layout, mat);
	return canvas;
}
