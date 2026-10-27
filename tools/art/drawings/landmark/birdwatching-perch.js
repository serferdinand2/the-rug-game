// The Birdwatching Perch landmark by day: a wooden hide on stilts at the edge of a reedy pond, birds wheeling overhead.
import {
	createCanvas,
	set,
	rect,
	outline,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import {
	FOOTPRINTS,
	clipToFootprint,
} from '../../../../src/lib/art/footprints.js';
import { drawSky } from '../../parts/sky.js';
import { drawSea } from '../../parts/sea.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */

/** The perch's footprint is .XXX/XXX.: the top-left and bottom-right plots are empty. */
const W = 128;
const H = 64;

/** The hide's left column and floor row. */
const HIDE_X = 44;
const FLOOR = 36;

/**
 * Draws the Birdwatching Perch scene.
 * @returns {Canvas} A 128×64 canvas in the shape of its footprint.
 */
export function draw() {
	const scene = createCanvas(W, H);
	const layer = createCanvas(W, H);
	const random = seededRandom(151);

	drawSky(layer, { time: 'day', horizon: 43, random });
	drawSea(layer, { time: 'day', top: 44, random, waves: 40 });
	drawBank(layer);

	drawStilts(scene);
	drawHide(scene);
	drawReeds(scene);
	outline(scene, C.ink);
	drawBirds(scene);
	underlay(scene, layer);
	clipToFootprint(scene, FOOTPRINTS['birdwatching-perch']);
	return scene;
}

/**
 * The grassy bank the hide's ladder starts from.
 * @param {Canvas} layer
 */
function drawBank(layer) {
	for (let y = 40; y < H; y++) {
		for (let x = 78; x < W; x++) {
			if (x - 78 > (y - 40) * -1 + 6 - (y - 40)) {
				set(
					layer,
					x,
					y,
					y === 40
						? C.grassLight
						: (x + y) % 4
							? C.grass
							: C.grassShade
				);
			}
		}
	}
}

/**
 * The wooden stilts standing in the water.
 * @param {Canvas} scene
 */
function drawStilts(scene) {
	for (const x of [HIDE_X + 2, HIDE_X + 14, HIDE_X + 26]) {
		rect(scene, x, FLOOR, 2, 22, C.timber);
		set(scene, x, FLOOR, C.timberLight);
	}
	for (let i = 0; i < 24; i++) {
		set(
			scene,
			HIDE_X + 3 + i,
			FLOOR + 6 + Math.round(i * 0.5),
			C.timberShade
		);
	}
}

/**
 * The hide: plank walls with a long viewing slot, a shingle roof, and a ladder to the bank.
 * @param {Canvas} scene
 */
function drawHide(scene) {
	rect(scene, HIDE_X, 18, 30, 18, C.timber);
	for (let x = HIDE_X; x < HIDE_X + 30; x += 3) {
		rect(scene, x, 18, 1, 18, C.timberShade);
	}
	rect(scene, HIDE_X, 18, 1, 18, C.timberLight);
	rect(scene, HIDE_X + 4, 24, 22, 4, C.night);
	rect(scene, HIDE_X - 2, FLOOR, 34, 2, C.timberShade);
	for (let r = 0; r < 6; r++) {
		rect(
			scene,
			HIDE_X - 3 + r,
			17 - r,
			36 - r * 2,
			1,
			r === 0 ? C.timberShade : C.timberLight
		);
	}
	// Ladder down to the bank.
	for (let i = 0; i < 14; i++) {
		set(scene, HIDE_X + 31 + i, FLOOR + i, C.timber);
		set(scene, HIDE_X + 34 + i, FLOOR + i, C.timber);
		if (i % 3 === 0) {
			rect(scene, HIDE_X + 31 + i, FLOOR + i, 4, 1, C.timberLight);
		}
	}
}

/**
 * Reeds along the near edge of the pond.
 * @param {Canvas} scene
 */
function drawReeds(scene) {
	for (let x = 2; x < 40; x += 3) {
		const top = 46 + ((x * 7) % 6);
		rect(scene, x, top, 1, H - top, C.pine);
		rect(scene, x, top, 1, 3, C.timber);
	}
}

/**
 * Birds in flight over the water; drawn after the outline so they stay small.
 * @param {Canvas} scene
 */
function drawBirds(scene) {
	for (const [x, y] of [
		[100, 8],
		[108, 14],
		[90, 18],
		[117, 6],
		[62, 6],
	]) {
		set(scene, x - 2, y, C.night);
		set(scene, x - 1, y - 1, C.night);
		set(scene, x, y, C.night);
		set(scene, x + 1, y - 1, C.night);
		set(scene, x + 2, y, C.night);
	}
}
