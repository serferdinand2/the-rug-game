// The Skyscraper landmark at dusk: a stepped tower with a spire rising high above the city's lit windows.
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

/** @typedef {import('../../painter.js').Canvas} Canvas */

/** The picture fills the skyscraper's 3×3 plots at 32 pixels each. */
const SIZE = 96;

/** The tower's centre column and the row it stands on. */
const MID = 47.5;
const GROUND = 86;

/**
 * Draws the Skyscraper scene.
 * @returns {Canvas} A 96×96 canvas, the shape of its 3×3 footprint.
 */
export function draw() {
	const scene = createCanvas(SIZE, SIZE);
	const layer = createCanvas(SIZE, SIZE);
	const random = seededRandom(113);

	drawSky(layer, { time: 'dusk', horizon: 86, random });
	drawSkyline(layer, { base: 86, time: 'dusk', random, height: 40 });
	drawStreet(layer, { top: 87 });

	// Three setbacks, widest at the bottom, then the crown and spire.
	drawStage(scene, 26, 52, GROUND);
	drawStage(scene, 20, 28, 51);
	drawStage(scene, 14, 14, 27);
	drawCrown(scene);
	outline(scene, C.ink);
	set(scene, Math.floor(MID), 1, C.brickRedLight);
	underlay(scene, layer);
	return scene;
}

/**
 * One stage of the tower: stone piers between columns of lit and dark windows.
 * @param {Canvas} scene
 * @param {number} half - Half the stage's width
 * @param {number} top
 * @param {number} bottom
 */
function drawStage(scene, half, top, bottom) {
	const left = Math.round(MID - half);
	const right = Math.round(MID + half);
	for (let y = top; y <= bottom; y++) {
		for (let x = left; x <= right; x++) {
			let colour = C.creamShade;
			if (x === left) {
				colour = C.creamLight;
			} else if (x >= right - 1) {
				colour = C.stoneMid;
			} else if ((x - left) % 4 !== 0 && (y - top) % 4 !== 0) {
				// Whole windows are lit or dark, never single pixels.
				const column = Math.floor((x - left) / 4);
				const floor = Math.floor((y - top) / 4);
				const lit = (column * 7 + floor * 13 + top) % 5 < 2;
				colour = lit ? C.gold : C.roof;
			} else if ((x - left) % 4 === 0) {
				colour = C.cream;
			}
			set(scene, x, y, colour);
		}
	}
	rect(scene, left - 1, top, right - left + 3, 1, C.creamLight);
}

/**
 * The stepped crown and the needle spire.
 * @param {Canvas} scene
 */
function drawCrown(scene) {
	for (let r = 0; r < 5; r++) {
		const half = 12 - r * 2;
		rect(
			scene,
			Math.round(MID - half),
			13 - r,
			half * 2 + 1,
			1,
			r % 2 ? C.gold : C.creamLight
		);
	}
	rect(scene, Math.floor(MID), 2, 1, 7, C.stoneLight);
}
