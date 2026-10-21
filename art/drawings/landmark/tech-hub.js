// The Tech Hub landmark at night: a glass tower with lit floors among lower glass buildings, a server glow at its foot.
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

/** The picture fills the hub's 3×2 plots at 32 pixels each. */
const W = 96;
const H = 64;

/**
 * Draws the Tech Hub scene.
 * @returns {Canvas} A 96×64 canvas, the shape of its 3×2 footprint.
 */
export function draw() {
	const scene = createCanvas(W, H);
	const layer = createCanvas(W, H);
	const random = seededRandom(79);

	drawSky(layer, { time: 'night', horizon: 48, random });
	drawSkyline(layer, { base: 48, time: 'night', random, height: 22 });
	drawPlaza(layer);

	drawGlass(scene, 6, 30, 24, 26, 0);
	drawGlass(scene, 66, 22, 26, 34, 2);
	drawTower(scene);
	outline(scene, C.ink);
	drawServerGlow(scene);
	set(scene, 47, 2, C.brickRedLight);
	underlay(scene, layer);
	return scene;
}

/**
 * A dark plaza with light strips set into it.
 * @param {Canvas} layer
 */
function drawPlaza(layer) {
	for (let y = 49; y < H; y++) {
		for (let x = 0; x < W; x++) {
			set(layer, x, y, y % 4 === 0 ? C.roof : C.roofShade);
		}
	}
	for (let x = 4; x < W; x += 12) {
		rect(layer, x, 60, 6, 1, C.daySky4);
	}
}

/**
 * A low glass building: dark blue panes on a grid, some floors lit.
 * @param {Canvas} scene
 * @param {number} x
 * @param {number} y - Its top row
 * @param {number} w
 * @param {number} h
 * @param {number} seed - Varies which windows are lit
 */
function drawGlass(scene, x, y, w, h, seed) {
	for (let row = y; row < y + h; row++) {
		for (let col = x; col < x + w; col++) {
			let colour = C.daySky1;
			if ((col - x) % 4 === 0 || (row - y) % 4 === 0) {
				colour = C.roofShade;
			} else if (
				(Math.floor((row - y) / 4) + Math.floor((col - x) / 4) + seed) %
					3 ===
				0
			) {
				colour = C.lampGlow;
			} else if ((col + row + seed) % 7 === 0) {
				colour = C.daySky3;
			}
			set(scene, col, row, colour);
		}
	}
	rect(scene, x, y, w, 1, C.stoneMid);
}

/**
 * The tower: a glass shaft with every floor lit in cool white, a crown and a beacon mast.
 * @param {Canvas} scene
 */
function drawTower(scene) {
	for (let y = 8; y <= 55; y++) {
		for (let x = 34; x <= 61; x++) {
			let colour = (y - 8) % 4 === 0 ? C.daySky5 : C.daySky2;
			if ((x - 34) % 4 === 0) {
				colour = C.roofShade;
			} else if (x <= 36) {
				colour = (y - 8) % 4 === 0 ? C.white : C.daySky3;
			} else if (x >= 58) {
				colour = (y - 8) % 4 === 0 ? C.daySky4 : C.daySky1;
			}
			set(scene, x, y, colour);
		}
	}
	// Angled crown.
	for (let r = 0; r < 5; r++) {
		rect(
			scene,
			34 + r * 2,
			7 - r,
			28 - r * 4,
			1,
			r === 0 ? C.stoneLight : C.stoneMid
		);
	}
	rect(scene, 47, 2, 1, 2, C.stoneMid);
	// The entrance.
	rect(scene, 42, 49, 12, 7, C.lampGlow);
	rect(scene, 47, 49, 2, 7, C.stoneMid);
}

/**
 * The cool glow of the server hall along the tower's foot; drawn after the outline so it reads as light.
 * @param {Canvas} scene
 */
function drawServerGlow(scene) {
	for (let x = 30; x <= 65; x++) {
		set(scene, x, 56, x % 2 ? C.daySky4 : C.daySky5);
	}
}
