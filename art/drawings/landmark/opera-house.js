// The Opera House landmark at dusk: a grand facade with lit arches and a golden muse, steps leading down to the plaza.
import {
	createCanvas,
	set,
	rect,
	outline,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { FOOTPRINTS, clipToFootprint } from '../../footprints.js';
import { drawSky } from '../../parts/sky.js';
import { drawStreet } from '../../parts/street.js';
import { drawFigure } from '../../parts/figures.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */

/** The opera's footprint is XX/XX/.X at 32 pixels per plot. */
const W = 64;
const H = 96;

/** The facade's foot. */
const FOOT = 62;

/**
 * Draws the Opera House scene.
 * @returns {Canvas} A 64×96 canvas in the shape of its footprint (the bottom-left plot empty).
 */
export function draw() {
	const scene = createCanvas(W, H);
	const layer = createCanvas(W, H);
	const random = seededRandom(173);

	drawSky(layer, { time: 'dusk', horizon: 62, random });
	drawStreet(layer, { top: 63 });

	drawFacade(scene);
	drawSteps(scene);
	drawLamp(scene, 54);
	drawFigure(scene, { x: 38, y: 90, clothes: C.night });
	drawFigure(scene, {
		x: 44,
		y: 90,
		facing: 'left',
		clothes: C.brickRedShade,
	});
	outline(scene, C.ink);
	underlay(scene, layer);
	clipToFootprint(scene, FOOTPRINTS['opera-house']);
	return scene;
}

/**
 * The facade: an attic with a golden muse, paired columns, and three tall lit arches.
 * @param {Canvas} scene
 */
function drawFacade(scene) {
	rect(scene, 3, 18, 58, FOOT - 17, C.cream);
	rect(scene, 3, 18, 1, FOOT - 17, C.creamLight);
	rect(scene, 58, 18, 3, FOOT - 17, C.creamShade);
	// The attic band and a green copper roof.
	rect(scene, 1, 16, 62, 2, C.creamLight);
	rect(scene, 4, 19, 56, 4, C.night);
	for (let x = 7; x < 58; x += 4) {
		rect(scene, x, 20, 2, 2, C.gold);
	}
	for (let r = 0; r < 6; r++) {
		rect(
			scene,
			4 + r * 3,
			15 - r,
			56 - r * 6,
			1,
			r % 2 ? C.pine : C.pineLight
		);
	}
	// A golden muse on the roof, arms raised.
	rect(scene, 31, 3, 2, 7, C.gold);
	set(scene, 30, 2, C.gold);
	set(scene, 33, 2, C.gold);
	rect(scene, 30, 4, 4, 2, C.gold);
	set(scene, 31, 1, C.lampGlow);
	// Columns between the arches.
	for (const x of [6, 22, 38, 54]) {
		rect(scene, x, 26, 4, FOOT - 25, C.creamLight);
		rect(scene, x + 3, 26, 1, FOOT - 25, C.creamShade);
	}
	// Three tall arches glowing from the foyer.
	for (const x of [11, 27, 43]) {
		for (let y = 30; y < FOOT; y++) {
			for (let i = 0; i < 10; i++) {
				if (y >= 35 || Math.hypot(i - 4.5, y - 35) <= 5) {
					set(scene, x + i, y, y < 40 ? C.lampGlow : C.gold);
				}
			}
		}
		rect(scene, x + 4, 30, 2, FOOT - 30, C.amber);
	}
}

/**
 * Broad steps down from the doors to the plaza.
 * @param {Canvas} scene
 */
function drawSteps(scene) {
	for (let i = 0; i < 4; i++) {
		rect(scene, 0, FOOT + i * 2, W, 2, i % 2 ? C.stone : C.stoneLight);
	}
}

/**
 * A lit lamp on the plaza.
 * @param {Canvas} scene
 * @param {number} x
 */
function drawLamp(scene, x) {
	rect(scene, x, 74, 1, 18, C.night);
	rect(scene, x - 2, 70, 5, 4, C.gold);
	rect(scene, x - 1, 71, 3, 2, C.lampGlow);
}
