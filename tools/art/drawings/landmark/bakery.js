// The Bakery landmark by day: a little bakery under a striped awning, its window full of bread and its oven glowing.
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
import { drawStreet } from '../../parts/street.js';
import { drawSmoke } from '../../parts/smoke.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */

/**
 * Draws the Bakery scene.
 * @returns {Canvas} A 64×64 canvas, the shape of its 2×2 footprint.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(43);

	drawSky(layer, { time: 'day', horizon: 50, random });
	drawStreet(layer, { top: 51 });
	drawSmoke(layer, { x: 47, y: 7, tone: 'smoke', puffs: 3, drift: -1 });

	drawRoof(scene);
	drawWalls(scene);
	drawWindow(scene);
	drawAwning(scene);
	drawDoor(scene);
	outline(scene, C.ink);
	underlay(scene, layer);
	return scene;
}

/**
 * A tiled roof and a brick chimney.
 * @param {Canvas} scene
 */
function drawRoof(scene) {
	rect(scene, 44, 8, 6, 12, C.brickRedShade);
	rect(scene, 44, 8, 1, 12, C.brickRed);
	rect(scene, 43, 7, 8, 2, C.stoneMid);
	for (let r = 0; r < 12; r++) {
		const from = 6 + r * 2;
		const to = 57 - r * 2;
		const y = 25 - r;
		for (let x = from; x <= to; x++) {
			let colour = C.brickRed;
			if (x <= from + 1) {
				colour = C.brickRedLight;
			} else if (x >= to - 1 || y % 2 === 0) {
				colour = C.brickRedShade;
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * Warm plastered walls with a sign showing a loaf.
 * @param {Canvas} scene
 */
function drawWalls(scene) {
	rect(scene, 8, 26, 48, 29, C.creamLight);
	rect(scene, 8, 26, 1, 29, C.white);
	rect(scene, 53, 26, 3, 29, C.cream);
	rect(scene, 8, 52, 48, 3, C.sandShade);
	// The sign: a gold loaf on a dark board.
	rect(scene, 22, 28, 20, 5, C.timberShade);
	rect(scene, 27, 29, 10, 3, C.gold);
	rect(scene, 28, 29, 8, 1, C.lampGlow);
	for (const x of [29, 32, 35]) {
		set(scene, x, 30, C.amber);
	}
}

/**
 * The shop window: bread on shelves in front of the oven's glow.
 * @param {Canvas} scene
 */
function drawWindow(scene) {
	rect(scene, 11, 37, 26, 14, C.amber);
	for (let y = 37; y <= 50; y++) {
		for (let x = 11; x <= 36; x++) {
			const d = Math.hypot(x - 31, y - 42);
			if (d < 6) {
				set(scene, x, y, d < 3 ? C.lampGlow : C.gold);
			}
		}
	}
	rect(scene, 11, 45, 26, 1, C.timberShade);
	rect(scene, 11, 50, 26, 1, C.timberShade);
	// Loaves and rolls on the shelves.
	for (const x of [12, 17, 22]) {
		rect(scene, x, 43, 4, 2, C.timber);
		rect(scene, x + 1, 43, 2, 1, C.timberLight);
	}
	for (const x of [13, 18, 23, 28, 33]) {
		rect(scene, x, 48, 3, 2, C.timberLight);
		set(scene, x + 1, 48, C.sandLight);
	}
	rect(scene, 10, 36, 28, 1, C.timberShade);
	rect(scene, 10, 51, 28, 1, C.timberShade);
}

/**
 * A red-and-white striped awning with a scalloped edge.
 * @param {Canvas} scene
 */
function drawAwning(scene) {
	for (let y = 33; y <= 36; y++) {
		for (let x = 9 + (36 - y); x <= 38 + (y - 33); x++) {
			const stripe = Math.floor((x - 9) / 3) % 2 === 0;
			set(scene, x, y, stripe ? C.brickRed : C.creamLight);
		}
	}
	for (let x = 9; x <= 41; x += 3) {
		set(
			scene,
			x + 1,
			37,
			Math.floor((x - 9) / 3) % 2 === 0 ? C.brickRed : C.creamLight
		);
	}
}

/**
 * A green door with a glazed top and a brass handle.
 * @param {Canvas} scene
 */
function drawDoor(scene) {
	rect(scene, 42, 38, 9, 16, C.pine);
	rect(scene, 42, 38, 1, 16, C.pineLight);
	rect(scene, 49, 38, 2, 16, C.pineShade);
	rect(scene, 44, 40, 5, 4, C.lampGlow);
	set(scene, 48, 47, C.brass);
	rect(scene, 41, 54, 11, 1, C.stoneLight);
}
