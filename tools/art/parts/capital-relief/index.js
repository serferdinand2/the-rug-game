// The joined relief of a capital mat's impassable plots (#82): one transparent picture per mat, and a preview of it on its ground.
import { createCanvas, overlay } from '../../painter.js';
import { PALETTE } from '../../palette.js';
import { PLOT, PITCH } from '../../../../src/lib/art/relief.js';
import {
	footprint,
	isImpassable,
} from '../../../../src/lib/art/paint/relief/footprint.js';
import {
	drawNaturalGround,
	hash,
} from '../../../../src/lib/art/paint/relief/ground.js';
import { paintMountains } from '../../../../src/lib/art/paint/relief/mountain.js';
import { paintForest } from '../../../../src/lib/art/paint/relief/forest.js';
import { paintWetland } from './wetland.js';
import { paintTropical } from './tropical.js';
import { paintDesert } from './desert.js';
import { paintGrassland } from './grassland.js';
import { paintCanyon } from './canyon.js';
import { CAPITAL_GRIDS } from '../capital-terrain.js';
import { BIOMES } from '../capital-biomes/index.js';
import { VOLCANOES } from '../capital-biomes/archipelago.js';
import {
	CLOUDS,
	CLOUD_TINTS,
	CLOUD_TINT_NAMES,
} from '../capital-biomes/cloud-city.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../../../src/lib/art/paint/relief/footprint.js').Footprint} Footprint */

/**
 * What a mat prints beyond its plots, which some reliefs draw (#132): the Archipelago's volcano plots as
 * [row, column], and Cloud City's clouds (one digit per plot, row by row) with each cloud's tint index.
 * @typedef {Object} MatData
 * @property {readonly (readonly [number, number])[]} [volcanoes]
 * @property {readonly string[]} [clouds]
 * @property {readonly number[]} [tints]
 */

/**
 * Paints a biome's relief into a footprint, on a transparent canvas of the footprint's size.
 * @typedef {(canvas: Canvas, fp: Footprint, seed: number, mat?: MatData) => void} ReliefPainter
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
	tropical: paintTropical,
	desert: paintDesert,
	grassland: paintGrassland,
	canyon: paintCanyon,
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
 * A mat's printed layout, by its slug: a base mat's from the engine, an advanced mat's from its biome module.
 * @param {string} slug - Such as 'desert' or 'cloud-city'
 * @returns {readonly string[] | undefined}
 * @example matLayout('archipelago').length // 11
 */
export function matLayout(slug) {
	if (Object.hasOwn(CAPITAL_GRIDS, slug)) {
		return CAPITAL_GRIDS[/** @type {keyof typeof CAPITAL_GRIDS} */ (slug)];
	}
	return Object.hasOwn(BIOMES, slug) ? BIOMES[slug].LAYOUT : undefined;
}

/**
 * What a mat prints beyond its plots, by its slug.
 * @param {string} slug
 * @returns {MatData}
 * @example matData('archipelago') // { volcanoes: [[4, 3], [5, 3], [9, 2]] }
 */
export function matData(slug) {
	if (slug === 'archipelago') {
		return { volcanoes: VOLCANOES };
	}
	if (slug === 'cloud-city') {
		return { clouds: CLOUDS, tints: CLOUD_TINTS };
	}
	return {};
}

/**
 * The printed data each specimen sheet is drawn with: a volcano on the Archipelago's lone plot, and Cloud City's real clouds.
 * @type {Readonly<Record<string, MatData>>}
 */
export const SPECIMEN_DATA = Object.freeze({
	archipelago: Object.freeze({
		volcanoes: /** @type {readonly (readonly [number, number])[]} */ (
			Object.freeze([Object.freeze([1, 1])])
		),
	}),
	'cloud-city': Object.freeze({ clouds: CLOUDS, tints: CLOUD_TINTS }),
});

/**
 * The natural ground a plot of a mat shows: its biome's, or for Cloud City, the ground in its cloud's tint.
 * Without clouds, a Cloud City plot is white.
 * @param {string} biome
 * @param {number} row
 * @param {number} col
 * @param {MatData} mat
 * @returns {string} A natural ground's name, such as 'canyon' or 'cloud-city-grey'
 */
export function groundKey(biome, row, col, mat) {
	if (biome !== 'cloud-city') {
		return biome;
	}
	const tint =
		mat.clouds && mat.tints ? mat.tints[Number(mat.clouds[row][col])] : 0;
	return `cloud-city-${CLOUD_TINT_NAMES[tint]}`;
}

/**
 * Draws a layout's impassable plots as one relief: transparent everywhere it doesn't reach.
 * @param {readonly string[]} layout - One string per row: '1' or 'X' impassable
 * @param {string} biome - Such as 'mountain'
 * @param {MatData} [mat] - What the mat prints beyond its plots, for the painters that draw it
 * @returns {Canvas} The relief, `reliefSize` of the layout
 * @throws {Error} When the biome has no relief painter.
 */
export function drawRelief(layout, biome, mat = {}) {
	if (!Object.hasOwn(RELIEF_PAINTERS, biome)) {
		throw new Error(`No relief for ${biome}`);
	}
	const fp = footprint(layout);
	const canvas = createCanvas(fp.w, fp.h);
	RELIEF_PAINTERS[biome](canvas, fp, RELIEF_SEED, mat);
	return canvas;
}

/**
 * Draws a layout's relief on its ground, as the game shows it: natural ground on every plot, ink in the
 * gaps between plots except inside a group, where the ground runs on, and the relief over it all.
 * @param {readonly string[]} layout - One string per row: '1' or 'X' impassable
 * @param {string} biome - Such as 'mountain'
 * @param {number} [seed=0] - Picks each plot's ground variant
 * @param {MatData} [mat] - What the mat prints beyond its plots
 * @returns {Canvas} An opaque picture, `reliefSize` of the layout
 * @throws {Error} When the biome has no relief painter.
 */
export function drawReliefPreview(layout, biome, seed = 0, mat = {}) {
	const relief = drawRelief(layout, biome, mat);
	const canvas = createCanvas(relief.w, relief.h);
	canvas.p.fill(PALETTE.ink);
	const rows = layout.length;
	const cols = layout[0].length;
	for (let row = 0; row < rows; row++) {
		for (let col = 0; col < cols; col++) {
			drawNaturalGround(canvas, {
				biome: groundKey(biome, row, col, mat),
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
