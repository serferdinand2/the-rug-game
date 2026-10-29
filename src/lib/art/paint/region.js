// A free-form region of a picture for the map's painters (#134): #82's footprint without plots, and natural ground laid over it.
import { createCanvas } from './painter.js';
import { drawNaturalGround, hash } from './relief/ground.js';
import { PLOT } from '../relief.js';

/** @typedef {import('./painter.js').Canvas} Canvas */
/** @typedef {import('./relief/footprint.js').Footprint} Footprint */

/** The four neighbours a pixel touches along its edges. */
export const SIDES = Object.freeze([
	[1, 0],
	[-1, 0],
	[0, 1],
	[0, -1],
]);

/** How many natural-ground variants a biome has. */
const GROUND_VARIANTS = 8;

/**
 * Shrinks a region by `by` pixels from every edge: a pixel stays when every pixel within `by` of it, across and
 * down, is in the region and on the picture.
 * @param {number} w
 * @param {number} h
 * @param {Uint8Array} mask - One byte per pixel, 1 inside
 * @param {number} by
 * @returns {Uint8Array}
 */
export function insetMask(w, h, mask, by) {
	const out = new Uint8Array(w * h);
	/** @type {(x: number, y: number) => boolean} */
	const inside = (x, y) =>
		x >= 0 && y >= 0 && x < w && y < h && mask[y * w + x] === 1;
	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			let ok = inside(x, y);
			for (let d = -by; ok && d <= by; d++) {
				ok = inside(x + d, y) && inside(x, y + d);
			}
			if (ok) {
				out[y * w + x] = 1;
			}
		}
	}
	return out;
}

/**
 * Turns a region into #82's footprint, so its relief painters can fill it: the floor inset 2 pixels, art reaching
 * the whole region, and no plots or corner joins.
 * @param {number} w
 * @param {number} h
 * @param {Uint8Array} mask
 * @returns {Footprint}
 */
export function regionFootprint(w, h, mask) {
	return {
		rows: 0,
		cols: 0,
		w,
		h,
		mask: insetMask(w, h, mask, 2),
		plots: mask,
		reach: mask,
		corners: [],
	};
}

/**
 * Lays #82's natural ground of a biome over a region, one 32-pixel plot of it at a time, each plot's variant
 * picked from the seed and its place.
 * @param {Canvas} canvas
 * @param {string} biome - A biome with natural ground, such as 'mountain'
 * @param {Uint8Array} mask
 * @param {number} seed
 * @throws {Error} When the biome has no natural ground.
 */
export function groundOver(canvas, biome, mask, seed) {
	const ground = createCanvas(
		Math.ceil(canvas.w / PLOT) * PLOT,
		Math.ceil(canvas.h / PLOT) * PLOT
	);
	for (let y = 0; y < ground.h; y += PLOT) {
		for (let x = 0; x < ground.w; x += PLOT) {
			drawNaturalGround(ground, {
				biome,
				variant: hash(x, y, seed) % GROUND_VARIANTS,
				x,
				y,
			});
		}
	}
	for (let y = 0; y < canvas.h; y++) {
		for (let x = 0; x < canvas.w; x++) {
			if (mask[y * canvas.w + x]) {
				canvas.p[y * canvas.w + x] = ground.p[y * ground.w + x];
			}
		}
	}
}
