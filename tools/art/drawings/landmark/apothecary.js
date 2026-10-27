// The Apothecary landmark by day: a timber-framed herbalist's shop with jars in the window and herbs drying under the eaves.
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
import { drawFigure } from '../../parts/figures.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */

/**
 * Draws the Apothecary scene.
 * @returns {Canvas} A 64×64 canvas, the shape of its 2×2 footprint.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(41);

	drawSky(layer, { time: 'day', horizon: 50, random });
	drawStreet(layer, { top: 51 });

	drawRoof(scene);
	drawUpperFloor(scene);
	drawShopFront(scene);
	drawSign(scene);
	drawFigure(scene, { x: 47, y: 56, facing: 'left', clothes: C.pine });
	outline(scene, C.ink);
	drawHerbs(scene);
	underlay(scene, layer);
	return scene;
}

/**
 * A steep tiled gable roof with a little chimney.
 * @param {Canvas} scene
 */
function drawRoof(scene) {
	rect(scene, 42, 4, 4, 10, C.brickRedShade);
	rect(scene, 41, 3, 6, 2, C.stoneMid);
	for (let r = 0; r < 18; r++) {
		const from = 9 + r;
		const to = 54 - r;
		const y = 21 - r;
		for (let x = from; x <= to; x++) {
			let colour = C.brickRed;
			if (x === from || x === from + 1) {
				colour = C.brickRedLight;
			} else if (x >= to - 1 || y % 3 === 0) {
				colour = C.brickRedShade;
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * The jettied upper floor: plaster between dark timbers, with a shuttered window.
 * @param {Canvas} scene
 */
function drawUpperFloor(scene) {
	rect(scene, 10, 22, 44, 15, C.cream);
	rect(scene, 10, 22, 1, 15, C.creamLight);
	rect(scene, 52, 22, 2, 15, C.creamShade);
	for (const x of [10, 21, 32, 43, 53]) {
		rect(scene, x, 22, 1, 15, C.timberShade);
	}
	rect(scene, 10, 22, 44, 1, C.timberShade);
	rect(scene, 10, 36, 44, 1, C.timberShade);
	// Diagonal braces.
	for (let i = 0; i < 10; i++) {
		set(scene, 12 + i, 35 - i, C.timber);
		set(scene, 42 - i, 35 - i, C.timber);
	}
	// A shuttered window in the middle bay.
	rect(scene, 24, 26, 6, 7, C.roofShade);
	rect(scene, 24, 29, 6, 1, C.timber);
	rect(scene, 22, 26, 2, 7, C.pine);
	rect(scene, 30, 26, 2, 7, C.pine);
}

/**
 * The ground floor: a window of coloured jars on shelves, and the door.
 * @param {Canvas} scene
 */
function drawShopFront(scene) {
	rect(scene, 12, 37, 40, 18, C.creamShade);
	rect(scene, 12, 37, 1, 18, C.cream);
	// The shop window.
	rect(scene, 15, 40, 19, 11, C.roofShade);
	rect(scene, 14, 39, 21, 1, C.timber);
	rect(scene, 14, 51, 21, 1, C.timber);
	rect(scene, 15, 45, 19, 1, C.timberLight);
	rect(scene, 15, 50, 19, 1, C.timberLight);
	const jars = [C.pineLight, C.brickRedLight, C.daySky3, C.gold, C.pine];
	for (let i = 0; i < 6; i++) {
		const colour = jars[i % jars.length];
		rect(scene, 16 + i * 3, 42, 2, 3, colour);
		set(scene, 16 + i * 3, 41, C.creamLight);
		rect(scene, 17 + i * 3, 47, 2, 3, jars[(i + 2) % jars.length]);
	}
	// The door, with a brass knob and a glazed top.
	rect(scene, 37, 41, 8, 14, C.timber);
	rect(scene, 37, 41, 1, 14, C.timberLight);
	rect(scene, 39, 43, 4, 3, C.daySky4);
	set(scene, 43, 48, C.brass);
	// The doorstep.
	rect(scene, 36, 54, 10, 1, C.stoneLight);
}

/**
 * A hanging sign with a mortar and pestle.
 * @param {Canvas} scene
 */
function drawSign(scene) {
	rect(scene, 52, 28, 8, 1, C.wood);
	rect(scene, 54, 29, 1, 2, C.wood);
	rect(scene, 58, 29, 1, 2, C.wood);
	rect(scene, 53, 31, 7, 7, C.timberLight);
	rect(scene, 53, 31, 7, 1, C.timber);
	rect(scene, 54, 34, 5, 2, C.stoneLight);
	rect(scene, 55, 36, 3, 1, C.stone);
	set(scene, 58, 32, C.stoneShade);
	set(scene, 57, 33, C.stoneShade);
}

/**
 * Bundles of herbs drying under the jetty; drawn after the outline so they stay delicate.
 * @param {Canvas} scene
 */
function drawHerbs(scene) {
	/** @type {[number, string][]} */
	const bundles = [
		[14, C.pineLight],
		[19, C.grass],
		[24, C.sandLight],
		[29, C.pineLight],
		[34, C.grassLight],
	];
	for (const [x, leaf] of bundles) {
		set(scene, x, 37, C.wood);
		rect(scene, x - 1, 38, 3, 1, leaf);
		set(scene, x, 39, leaf);
	}
}
