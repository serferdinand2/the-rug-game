// The joined relief of a capital mat's impassable plots (#82): one transparent picture per mat, and a preview of it on its ground.
import { createCanvas, overlay } from '../../painter.js';
import { PALETTE } from '../../palette.js';
import { PLOT, PITCH } from '../../../../src/lib/art/relief.js';
import { footprint, isImpassable } from './footprint.js';
import { drawNaturalGround, hash } from './ground.js';
import { paintMountains } from './mountain.js';
import { paintForest } from './forest.js';
import { paintWetland } from './wetland.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('./footprint.js').Footprint} Footprint */

/**
 * Paints a biome's relief into a footprint, on a transparent canvas of the footprint's size.
 * @typedef {(canvas: Canvas, fp: Footprint, seed: number) => void} ReliefPainter
 */

/** Every relief is painted from this seed, so a mat's relief is the same in every build. */
const RELIEF_SEED = 5;

/** How many natural-ground variants a biome has. */
const GROUND_VARIANTS = 8;

/**
 * The painter of each biome that has a relief, in the order of RELIEF_BIOMES.
 * @type {Readonly<Record<string, ReliefPainter>>}
 */
export const RELIEF_PAINTERS = Object.freeze({
	mountain: paintMountains,
	forest: paintForest,
	wetland: paintWetland,
});

/**
 * A layout with every kind of join, for reviewing a relief: a lone plot, a side pair, a corner join on
 * each diagonal, an L of three and a 2×2.
 * @type {readonly string[]}
 */
export const SPECIMEN_LAYOUT = Object.freeze([
	'000000000',
	'010011000',
	'000000000',
	'010000100',
	'001001000',
	'000000000',
	'011000110',
	'010000110',
	'000000000',
]);

/**
 * Draws a layout's impassable plots as one relief: transparent everywhere it doesn't reach.
 * @param {readonly string[]} layout - One string per row: '1' or 'X' impassable
 * @param {string} biome - Such as 'mountain'
 * @returns {Canvas} The relief, `reliefSize` of the layout
 * @throws {Error} When the biome has no relief painter.
 */
export function drawRelief(layout, biome) {
	if (!Object.hasOwn(RELIEF_PAINTERS, biome)) {
		throw new Error(`No relief for ${biome}`);
	}
	const fp = footprint(layout);
	const canvas = createCanvas(fp.w, fp.h);
	RELIEF_PAINTERS[biome](canvas, fp, RELIEF_SEED);
	return canvas;
}

/**
 * Draws a layout's relief on its ground, as the game shows it: natural ground on every plot, ink in the
 * gaps between plots except inside a group, where the ground runs on, and the relief over it all.
 * @param {readonly string[]} layout - One string per row: '1' or 'X' impassable
 * @param {string} biome - Such as 'mountain'
 * @param {number} [seed=0] - Picks each plot's ground variant
 * @returns {Canvas} An opaque picture, `reliefSize` of the layout
 * @throws {Error} When the biome has no relief painter.
 */
export function drawReliefPreview(layout, biome, seed = 0) {
	const relief = drawRelief(layout, biome);
	const canvas = createCanvas(relief.w, relief.h);
	canvas.p.fill(PALETTE.ink);
	const rows = layout.length;
	const cols = layout[0].length;
	for (let row = 0; row < rows; row++) {
		for (let col = 0; col < cols; col++) {
			drawNaturalGround(canvas, {
				biome,
				variant: hash(row, col, seed) % GROUND_VARIANTS,
				x: col * PITCH,
				y: row * PITCH,
			});
		}
	}
	/** @type {(x: number, y: number, fromX: number, fromY: number) => void} */
	const copy = (x, y, fromX, fromY) => {
		canvas.p[y * canvas.w + x] = canvas.p[fromY * canvas.w + fromX];
	};
	const blocked = (/** @type {number} */ r, /** @type {number} */ c) =>
		isImpassable(layout, r, c);
	for (let row = 0; row < rows; row++) {
		for (let col = 0; col < cols; col++) {
			if (!blocked(row, col)) {
				continue;
			}
			const right = col * PITCH + PLOT;
			const below = row * PITCH + PLOT;
			for (let i = 0; i < PLOT; i++) {
				if (blocked(row, col + 1)) {
					copy(right, row * PITCH + i, right - 1, row * PITCH + i);
				}
				if (blocked(row + 1, col)) {
					copy(col * PITCH + i, below, col * PITCH + i, below - 1);
				}
			}
			if (
				blocked(row, col + 1) &&
				blocked(row + 1, col) &&
				blocked(row + 1, col + 1)
			) {
				copy(right, below, right - 1, below - 1);
			}
		}
	}
	overlay(canvas, relief);
	return canvas;
}
