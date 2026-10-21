// The Game Store landmark at dusk: a brick shopfront with a lit dice sign and board games stacked in the window.
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
import { drawStreet } from '../../parts/street.js';
import { drawFigure } from '../../parts/figures.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */

/** The picture fills the store's 3×2 plots at 32 pixels each. */
const W = 96;
const H = 64;

/** The shop building's walls. */
const LEFT = 12;
const RIGHT = 83;
const GROUND = 54;

/**
 * Draws the Game Store scene.
 * @returns {Canvas} A 96×64 canvas, the shape of its 3×2 footprint.
 */
export function draw() {
	const scene = createCanvas(W, H);
	const layer = createCanvas(W, H);
	const random = seededRandom(107);

	drawSky(layer, { time: 'dusk', horizon: 52, random });
	drawSkyline(layer, { base: 52, time: 'dusk', random, height: 30 });
	drawStreet(layer, { top: 53 });

	drawBuilding(scene);
	drawShopWindow(scene);
	drawDoor(scene);
	drawSign(scene);
	drawFigure(scene, { x: 64, y: 58, facing: 'left', clothes: C.pine });
	drawFigure(scene, { x: 70, y: 58, facing: 'left', clothes: C.gold });
	outline(scene, C.ink);
	underlay(scene, layer);
	return scene;
}

/**
 * A two-storey brick building with lit upstairs windows and a cornice.
 * @param {Canvas} scene
 */
function drawBuilding(scene) {
	for (let y = 12; y <= GROUND; y++) {
		for (let x = LEFT; x <= RIGHT; x++) {
			let colour = C.brickRed;
			if (x === LEFT) {
				colour = C.brickRedLight;
			} else if (x >= RIGHT - 1 || y % 3 === 0) {
				colour = C.brickRedShade;
			} else if ((x + (Math.floor(y / 3) % 2) * 2) % 4 === 0) {
				colour = C.brickRedShade;
			}
			set(scene, x, y, colour);
		}
	}
	rect(scene, LEFT - 2, 9, RIGHT - LEFT + 5, 3, C.stone);
	rect(scene, LEFT - 2, 9, RIGHT - LEFT + 5, 1, C.stoneLight);
	for (let x = LEFT + 6; x < RIGHT - 4; x += 11) {
		rect(scene, x, 16, 6, 8, C.gold);
		rect(scene, x, 16, 6, 2, C.lampGlow);
		rect(scene, x + 2, 16, 1, 8, C.creamShade);
		rect(scene, x - 1, 24, 8, 1, C.stoneLight);
	}
}

/**
 * The shop window: stacked game boxes, meeples and a die in the warm light.
 * @param {Canvas} scene
 */
function drawShopWindow(scene) {
	rect(scene, 16, 33, 40, 18, C.lampGlow);
	rect(scene, 15, 32, 42, 1, C.timberShade);
	rect(scene, 15, 51, 42, 2, C.timberShade);
	rect(scene, 15, 32, 1, 21, C.timberShade);
	rect(scene, 56, 32, 1, 21, C.timberShade);
	// A pyramid of game boxes.
	/** @type {[number, number, string][]} */
	const boxes = [
		[18, 46, C.brickRed],
		[27, 46, C.daySky2],
		[36, 46, C.pine],
		[45, 46, C.roofLight],
		[22, 41, C.amber],
		[31, 41, C.brickRedShade],
		[40, 41, C.daySky3],
		[27, 36, C.pineLight],
		[36, 36, C.gold],
	];
	for (const [x, y, colour] of boxes) {
		rect(scene, x, y, 8, 5, colour);
		rect(scene, x, y, 8, 1, C.creamLight);
	}
	// Meeples and a die on the sill.
	/** @type {[number, string][]} */
	const meeples = [
		[48, C.brickRedLight],
		[51, C.daySky3],
	];
	for (const [x, colour] of meeples) {
		set(scene, x, 34, colour);
		rect(scene, x - 1, 35, 3, 2, colour);
	}
	rect(scene, 47, 38, 6, 6, C.white);
	set(scene, 48, 39, C.night);
	set(scene, 50, 41, C.night);
	set(scene, 51, 42, C.night);
}

/**
 * The shop door with a lit glass panel.
 * @param {Canvas} scene
 */
function drawDoor(scene) {
	rect(scene, 62, 34, 12, GROUND - 33, C.pineShade);
	rect(scene, 64, 36, 8, 8, C.lampGlow);
	set(scene, 72, 46, C.brass);
	rect(scene, 61, GROUND, 14, 1, C.stoneLight);
}

/**
 * A lit sign over the shop: a white die on a dark board, with gold trim.
 * @param {Canvas} scene
 */
function drawSign(scene) {
	rect(scene, 24, 26, 50, 5, C.night);
	rect(scene, 24, 26, 50, 1, C.gold);
	rect(scene, 24, 30, 50, 1, C.gold);
	for (let x = 28; x < 70; x += 4) {
		rect(scene, x, 28, 2, 1, x % 8 === 0 ? C.lampGlow : C.daySky5);
	}
}
