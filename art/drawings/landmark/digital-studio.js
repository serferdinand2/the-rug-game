// The Digital Studio landmark at night: a modern studio with a wall of glowing screens and a satellite dish on the roof.
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

/** The picture fills the studio's 3×2 plots at 32 pixels each. */
const W = 96;
const H = 64;

/** The colours the screens cycle through. */
const SCREENS = [
	C.daySky3,
	C.brickRedLight,
	C.pineLight,
	C.gold,
	C.roofLight,
	C.daySky5,
];

/**
 * Draws the Digital Studio scene.
 * @returns {Canvas} A 96×64 canvas, the shape of its 3×2 footprint.
 */
export function draw() {
	const scene = createCanvas(W, H);
	const layer = createCanvas(W, H);
	const random = seededRandom(109);

	drawSky(layer, { time: 'night', horizon: 50, random });
	drawSkyline(layer, { base: 50, time: 'night', random, height: 20 });
	for (let y = 51; y < H; y++) {
		rect(layer, 0, y, W, 1, y % 3 === 0 ? C.roof : C.roofShade);
	}

	drawBuilding(scene);
	drawScreens(scene);
	drawDish(scene);
	outline(scene, C.ink);
	set(scene, 77, 9, C.brickRedLight);
	underlay(scene, layer);
	return scene;
}

/**
 * A long, low modern building with a dark band of glass and a lit entrance.
 * @param {Canvas} scene
 */
function drawBuilding(scene) {
	rect(scene, 8, 22, 80, 34, C.stoneMid);
	rect(scene, 8, 22, 1, 34, C.stone);
	rect(scene, 85, 22, 3, 34, C.stoneShade);
	rect(scene, 6, 20, 84, 2, C.stoneLight);
	rect(scene, 12, 46, 72, 9, C.roofShade);
	rect(scene, 40, 46, 16, 9, C.lampGlow);
	rect(scene, 47, 46, 2, 9, C.stoneMid);
	rect(scene, 7, 55, 82, 1, C.stoneLight);
}

/**
 * A grid of screens on the facade, each glowing a different colour with a bright top line.
 * @param {Canvas} scene
 */
function drawScreens(scene) {
	let i = 0;
	for (let y = 25; y <= 37; y += 8) {
		for (let x = 12; x <= 76; x += 10) {
			const colour = SCREENS[i % SCREENS.length];
			rect(scene, x, y, 8, 6, C.night);
			rect(scene, x + 1, y + 1, 6, 4, colour);
			rect(scene, x + 1, y + 1, 6, 1, C.white);
			i += 1;
		}
	}
}

/**
 * A satellite dish on a short mast on the roof.
 * @param {Canvas} scene
 */
function drawDish(scene) {
	rect(scene, 70, 12, 2, 8, C.stoneShade);
	for (let y = 4; y <= 13; y++) {
		for (let x = 62; x <= 80; x++) {
			const d = Math.hypot((x - 71) / 9, (y - 13) / 9);
			if (d <= 1 && d >= 0.72 && y <= 12) {
				set(scene, x, y, x < 68 ? C.stoneLight : C.stone);
			}
		}
	}
	rect(scene, 71, 6, 1, 4, C.stoneMid);
	set(scene, 77, 9, C.stoneMid);
}
