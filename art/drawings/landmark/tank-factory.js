// The Tank Factory landmark at dusk: a great factory hall with its doors open and a tank rolling out.
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
import { drawSmoke } from '../../parts/smoke.js';
import { drawFactory } from '../../parts/factory.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */

/** The picture fills the factory's 3×3 plots at 32 pixels each. */
const SIZE = 96;

/** The row the hall stands on. */
const GROUND = 72;

/**
 * Draws the Tank Factory scene.
 * @returns {Canvas} A 96×96 canvas, the shape of its 3×3 footprint.
 */
export function draw() {
	const scene = createCanvas(SIZE, SIZE);
	const layer = createCanvas(SIZE, SIZE);
	const random = seededRandom(101);

	drawSky(layer, { time: 'dusk', horizon: 66, random });
	drawApron(layer);
	// Smoke from the two stacks drawFactory places at x + width - 8 and x + width - 17.
	drawSmoke(layer, { x: 85, y: 22, tone: 'smoke', puffs: 4, drift: -1 });
	drawSmoke(layer, { x: 76, y: 22, tone: 'smoke', puffs: 3, drift: -1 });

	drawFactory(scene, { x: 4, y: GROUND, width: 88, height: 30, stacks: 2 });
	drawDoorway(scene);
	drawTank(scene);
	outline(scene, C.ink);
	underlay(scene, layer);
	return scene;
}

/**
 * The concrete apron in front of the hall, with tread marks.
 * @param {Canvas} layer
 */
function drawApron(layer) {
	for (let y = 67; y < SIZE; y++) {
		for (let x = 0; x < SIZE; x++) {
			let colour = y < 80 ? C.stoneMid : C.stoneShade;
			if (x % 12 === 0 || y === 80) {
				colour = C.roof;
			}
			set(layer, x, y, colour);
		}
	}
	for (let x = 0; x < 30; x += 3) {
		set(layer, x, 88, C.roofShade);
		set(layer, x + 1, 92, C.roofShade);
	}
}

/**
 * The open doors of the assembly hall, warm light inside.
 * @param {Canvas} scene
 */
function drawDoorway(scene) {
	rect(scene, 26, 50, 40, GROUND - 49, C.amber);
	for (let y = 50; y <= GROUND; y++) {
		for (let x = 26; x <= 65; x++) {
			if ((x + y) % 5 === 0 || y < 53) {
				set(scene, x, y, y < 53 ? C.gold : C.timber);
			}
		}
	}
	rect(scene, 24, 48, 44, 2, C.stoneMid);
	rect(scene, 24, 50, 2, GROUND - 49, C.stoneShade);
	rect(scene, 66, 50, 2, GROUND - 49, C.stoneShade);
}

/**
 * An olive-green tank heading out to the left: tracks, hull, turret and a long gun.
 * @param {Canvas} scene
 */
function drawTank(scene) {
	// Tracks with road wheels.
	rect(scene, 18, 78, 46, 8, C.night);
	rect(scene, 16, 80, 2, 4, C.night);
	rect(scene, 64, 80, 2, 4, C.night);
	for (let x = 21; x <= 60; x += 8) {
		rect(scene, x, 80, 5, 5, C.stoneMid);
		set(scene, x + 2, 82, C.stoneLight);
	}
	for (let x = 18; x < 64; x += 2) {
		set(scene, x, 78, C.roof);
	}
	// Hull.
	rect(scene, 16, 71, 50, 7, C.pine);
	rect(scene, 16, 71, 50, 1, C.pineLight);
	rect(scene, 16, 76, 50, 2, C.pineShade);
	rect(scene, 12, 74, 4, 3, C.pineShade);
	// Turret and gun.
	rect(scene, 30, 63, 22, 8, C.pine);
	rect(scene, 30, 63, 22, 1, C.pineLight);
	rect(scene, 50, 63, 2, 8, C.pineShade);
	rect(scene, 4, 66, 26, 2, C.pineShade);
	rect(scene, 4, 66, 26, 1, C.pine);
	rect(scene, 2, 65, 3, 4, C.pineShade);
	rect(scene, 40, 60, 6, 3, C.pineShade);
	// A gold star on the turret.
	set(scene, 39, 66, C.gold);
	rect(scene, 38, 67, 3, 1, C.gold);
	set(scene, 39, 68, C.gold);
}
