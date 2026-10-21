// The Monolith landmark at night: a dark alien slab on an empty plain under dense stars, a lone figure before it.
import {
	createCanvas,
	get,
	set,
	rect,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { drawSky } from '../../parts/sky.js';
import { drawFigure } from '../../parts/figures.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */

/** The slab's left column, top row and width. */
const SLAB_X = 26;
const SLAB_TOP = 9;
const SLAB_W = 12;

/**
 * Draws the Monolith scene.
 * @returns {Canvas} A 64×64 canvas, the shape of its 2×2 footprint.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(103);

	drawSky(layer, {
		time: 'night',
		horizon: 47,
		random,
		stars: 80,
		starRows: 44,
		sparkles: [
			[8, 9],
			[54, 6],
		],
		moon: { x: 52, y: 20 },
	});
	drawPlain(layer);
	drawAura(layer);

	drawSlab(scene);
	drawFigure(scene, { x: 46, y: 56, facing: 'left', clothes: C.stoneMid });
	outline(scene, C.ink);
	underlay(scene, layer);
	return scene;
}

/**
 * A flat, dark plain with a few pale stones.
 * @param {Canvas} layer
 */
function drawPlain(layer) {
	for (let y = 48; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			set(
				layer,
				x,
				y,
				y === 48
					? C.roof
					: (x * 5 + y * 3) % 11 === 0
						? C.roof
						: C.night
			);
		}
	}
	for (const [x, y] of [
		[6, 55],
		[17, 59],
		[54, 52],
		[60, 61],
	]) {
		rect(layer, x, y, 2, 1, C.stoneShade);
	}
}

/**
 * A faint glow ringing the slab's foot.
 * @param {Canvas} layer
 */
function drawAura(layer) {
	for (let y = 40; y < 64; y++) {
		for (let x = 4; x < 60; x++) {
			const d = Math.hypot((x - 31.5) / 2.2, y - 54);
			const behind = get(layer, x, y);
			if (behind && d < 10) {
				set(layer, x, y, mix(behind, C.daySky4, 0.35 * (1 - d / 10)));
			}
		}
	}
}

/**
 * The slab: utterly dark, its edges just catching the moonlight.
 * @param {Canvas} scene
 */
function drawSlab(scene) {
	rect(scene, SLAB_X, SLAB_TOP, SLAB_W, 46, C.night);
	rect(scene, SLAB_X, SLAB_TOP, 1, 46, C.roof);
	rect(scene, SLAB_X + SLAB_W - 1, SLAB_TOP, 1, 46, C.roofLight);
	rect(scene, SLAB_X, SLAB_TOP, SLAB_W, 1, C.roofLight);
	set(scene, SLAB_X + SLAB_W - 1, SLAB_TOP, C.starDim);
}
