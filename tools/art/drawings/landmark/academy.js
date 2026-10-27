// The Academy landmark at dusk: a columned hall under a green copper dome, with lit wings and lamps along the steps.
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
import { drawTerrain } from '../../parts/terrain.js';
import { drawClassical } from '../../parts/classical.js';
import { drawFigure } from '../../parts/figures.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */

/** The picture fills the academy's 4×2 plots at 32 pixels each. */
const W = 128;
const H = 64;

/** The dome's centre column. */
const DOME_X = 63.5;

/**
 * Draws the Academy scene.
 * @returns {Canvas} A 128×64 canvas, the shape of its 4×2 footprint.
 */
export function draw() {
	const scene = createCanvas(W, H);
	const layer = createCanvas(W, H);
	const random = seededRandom(71);

	drawSky(layer, { time: 'dusk', horizon: 52, random });
	drawTerrain(layer, { kind: 'grassland', top: 53, random });

	drawDome(scene);
	drawWing(scene, 4);
	drawWing(scene, 104);
	drawClassical(scene, {
		x: 22,
		y: 57,
		width: 84,
		columns: 8,
		roof: 'pediment',
		height: 18,
	});
	drawLamp(scene, 18);
	drawLamp(scene, 109);
	drawFigure(scene, { x: 46, y: 54, clothes: C.night });
	drawFigure(scene, {
		x: 77,
		y: 54,
		facing: 'left',
		clothes: C.brickRedShade,
	});
	outline(scene, C.ink);
	underlay(scene, layer);
	return scene;
}

/**
 * A drum with small windows under a ribbed copper-green dome, topped by a gold lantern.
 * @param {Canvas} scene
 */
function drawDome(scene) {
	rect(scene, 49, 13, 30, 9, C.cream);
	rect(scene, 49, 13, 1, 9, C.creamLight);
	rect(scene, 76, 13, 3, 9, C.creamShade);
	for (let x = 52; x <= 74; x += 5) {
		rect(scene, x, 15, 2, 4, C.gold);
	}
	for (let y = 0; y <= 12; y++) {
		for (let x = 48; x <= 79; x++) {
			const d = Math.hypot((x - DOME_X) / 15, (y - 12.5) / 10);
			if (d > 1) {
				continue;
			}
			let colour = C.pine;
			if (x - DOME_X < -8) {
				colour = C.pineLight;
			} else if (x - DOME_X > 7) {
				colour = C.pineShade;
			}
			if (Math.round(x - DOME_X) % 6 === 0) {
				colour = C.pineShade;
			}
			set(scene, x, y, colour);
		}
	}
	rect(scene, 62, 1, 4, 2, C.gold);
	set(scene, 63, 1, C.lampGlow);
}

/**
 * A lower side wing with two lit windows.
 * @param {Canvas} scene
 * @param {number} x - The wing's leftmost column
 */
function drawWing(scene, x) {
	rect(scene, x, 33, 20, 22, C.cream);
	rect(scene, x, 33, 1, 22, C.creamLight);
	rect(scene, x + 18, 33, 2, 22, C.creamShade);
	rect(scene, x - 1, 31, 22, 2, C.creamLight);
	for (const wx of [x + 4, x + 12]) {
		rect(scene, wx, 38, 4, 9, C.gold);
		rect(scene, wx, 38, 4, 2, C.lampGlow);
		rect(scene, wx, 42, 4, 1, C.creamShade);
	}
}

/**
 * A lit lamp post beside the steps.
 * @param {Canvas} scene
 * @param {number} x
 */
function drawLamp(scene, x) {
	rect(scene, x, 44, 1, 13, C.night);
	rect(scene, x - 1, 41, 3, 3, C.gold);
	set(scene, x, 42, C.lampGlow);
}
