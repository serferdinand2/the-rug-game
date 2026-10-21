// The Laboratory landmark at night: a white research building with an open observatory dome, lit windows and an antenna.
import {
	createCanvas,
	set,
	rect,
	outline,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { drawSky } from '../../parts/sky.js';
import { drawSkyline } from '../../parts/skyline.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */

/** The picture fills the laboratory's 3×2 plots at 32 pixels each. */
const W = 96;
const H = 64;

/**
 * Draws the Laboratory scene.
 * @returns {Canvas} A 96×64 canvas, the shape of its 3×2 footprint.
 */
export function draw() {
	const scene = createCanvas(W, H);
	const layer = createCanvas(W, H);
	const random = seededRandom(73);

	drawSky(layer, {
		time: 'night',
		horizon: 46,
		random,
		sparkles: [[86, 8]],
	});
	drawSkyline(layer, { base: 46, time: 'night', random, height: 14 });
	drawGround(layer);

	drawDome(scene);
	drawBuilding(scene);
	drawAntenna(scene);
	outline(scene, C.ink);
	set(scene, 74, 4, C.brickRedLight);
	underlay(scene, layer);
	return scene;
}

/**
 * A dark lawn with a lit path leading to the door.
 * @param {Canvas} layer
 */
function drawGround(layer) {
	for (let y = 47; y < H; y++) {
		for (let x = 0; x < W; x++) {
			set(layer, x, y, (x + y) % 4 === 0 ? C.pineShade : C.night);
		}
	}
	for (let y = 56; y < H; y++) {
		const half = 3 + Math.floor((y - 56) / 2);
		for (let x = 54 - half; x <= 54 + half; x++) {
			set(layer, x, y, y % 2 ? C.stoneMid : C.stone);
		}
	}
}

/**
 * The observatory dome on the left of the roof, its slit open with the telescope inside.
 * @param {Canvas} scene
 */
function drawDome(scene) {
	for (let y = 14; y <= 27; y++) {
		for (let x = 16; x <= 45; x++) {
			const d = Math.hypot((x - 30.5) / 14, (y - 27.5) / 13);
			if (d > 1) {
				continue;
			}
			let colour = C.stone;
			if (x < 24) {
				colour = C.stoneLight;
			} else if (x > 38) {
				colour = C.stoneShade;
			}
			if (x >= 29 && x <= 32) {
				colour = C.night;
			}
			set(scene, x, y, colour);
		}
	}
	rect(scene, 30, 18, 2, 4, C.stoneMid);
	set(scene, 30, 17, C.gold);
}

/**
 * The research building: white walls with rows of cool-lit windows and a glowing glass door.
 * @param {Canvas} scene
 */
function drawBuilding(scene) {
	rect(scene, 12, 28, 72, 28, C.stone);
	rect(scene, 12, 28, 1, 28, C.stoneLight);
	rect(scene, 81, 28, 3, 28, C.stoneShade);
	rect(scene, 10, 27, 76, 2, C.stoneLight);
	for (const y of [32, 41]) {
		for (let x = 16; x <= 76; x += 6) {
			const lit = (x + y) % 4 !== 0;
			rect(scene, x, y, 4, 5, lit ? C.daySky5 : C.roofShade);
			if (lit) {
				rect(scene, x, y, 4, 1, C.white);
			}
		}
	}
	rect(scene, 48, 49, 13, 7, C.lampGlow);
	rect(scene, 54, 49, 1, 7, C.stoneMid);
	rect(scene, 47, 48, 15, 1, C.stoneShade);
}

/**
 * An antenna mast with a small dish on the right of the roof.
 * @param {Canvas} scene
 */
function drawAntenna(scene) {
	rect(scene, 74, 5, 1, 22, C.stoneMid);
	for (const y of [10, 16, 22]) {
		rect(scene, 72, y, 5, 1, C.stoneMid);
	}
	for (let i = 0; i < 6; i++) {
		set(scene, 62 + i, (15 + Math.abs(i - 2.5)) | 0, C.stoneLight);
	}
	rect(scene, 64, 16, 2, 4, C.stoneShade);
}
