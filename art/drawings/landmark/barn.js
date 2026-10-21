// The Barn landmark by day: a red gambrel barn with a silo, hay bales and a fenced field.
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
import { drawFigure } from '../../parts/figures.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */

/** The picture fills the barn's 3×3 plots at 32 pixels each. */
const SIZE = 96;

/** The barn's walls run from LEFT to RIGHT and stand on GROUND. */
const LEFT = 16;
const RIGHT = 63;
const GROUND = 80;

/**
 * Draws the Barn scene.
 * @returns {Canvas} A 96×96 canvas, the shape of its 3×3 footprint.
 */
export function draw() {
	const scene = createCanvas(SIZE, SIZE);
	const layer = createCanvas(SIZE, SIZE);
	const random = seededRandom(61);

	drawSky(layer, { time: 'day', horizon: 62, random });
	drawTerrain(layer, { kind: 'grassland', top: 63, random });

	drawSilo(scene);
	drawBarn(scene);
	drawHay(scene);
	drawFence(scene);
	drawFigure(scene, { x: 70, y: 90, facing: 'left', clothes: C.daySky1 });
	outline(scene, C.ink);
	underlay(scene, layer);
	return scene;
}

/**
 * A tall stone silo with a metal dome, standing behind the barn on the right.
 * @param {Canvas} scene
 */
function drawSilo(scene) {
	for (let y = 26; y <= GROUND; y++) {
		for (let x = 64; x <= 79; x++) {
			let colour = C.cream;
			if (x <= 65) {
				colour = C.creamLight;
			} else if (x >= 76) {
				colour = C.creamShade;
			} else if (y % 6 === 0) {
				colour = C.creamShade;
			}
			set(scene, x, y, colour);
		}
	}
	for (let y = 16; y <= 25; y++) {
		for (let x = 64; x <= 79; x++) {
			const d = Math.hypot((x - 71.5) / 8, (y - 26) / 10);
			if (d <= 1) {
				set(
					scene,
					x,
					y,
					x < 70 ? C.stoneLight : x > 75 ? C.stoneShade : C.stone
				);
			}
		}
	}
	set(scene, 71, 15, C.stoneMid);
}

/**
 * The red barn: a gambrel roof, white-trimmed walls, big X-braced doors and a hay loft.
 * @param {Canvas} scene
 */
function drawBarn(scene) {
	// Walls with vertical boards.
	for (let y = 46; y <= GROUND; y++) {
		for (let x = LEFT; x <= RIGHT; x++) {
			let colour = C.brickRed;
			if (x === LEFT) {
				colour = C.brickRedLight;
			} else if (x >= RIGHT - 2 || x % 4 === 0) {
				colour = C.brickRedShade;
			}
			set(scene, x, y, colour);
		}
	}
	// Gambrel roof: steep lower slopes and shallow upper ones.
	for (let r = 0; r < 24; r++) {
		const step = r < 12 ? 1 : 2;
		const inset = r < 12 ? r : 12 + (r - 12) * step;
		const from = LEFT - 2 + inset;
		const to = RIGHT + 2 - inset;
		if (to - from < 2) {
			break;
		}
		const y = 45 - r;
		for (let x = from; x <= to; x++) {
			let colour = C.brickRedShade;
			if (x <= from + 1) {
				colour = C.creamLight;
			} else if (x >= to - 1) {
				colour = C.creamShade;
			} else if (r === 0) {
				colour = C.creamLight;
			} else if (y % 3 === 0) {
				colour = C.brickRed;
			}
			set(scene, x, y, colour);
		}
	}
	// The hay loft.
	rect(scene, 34, 30, 12, 10, C.creamLight);
	rect(scene, 35, 31, 10, 8, C.wood);
	rect(scene, 36, 35, 8, 4, C.sand);
	rect(scene, 37, 34, 6, 1, C.sandLight);
	// Big doors with white trim and X braces.
	rect(scene, 28, 56, 24, 25, C.creamLight);
	for (const left of [29, 40]) {
		rect(scene, left, 57, 11, 24, C.brickRed);
		for (let i = 0; i < 11; i++) {
			const y1 = 57 + Math.round((i * 23) / 10);
			set(scene, left + i, y1, C.creamLight);
			set(scene, left + 10 - i, y1, C.creamLight);
		}
	}
	rect(scene, 39, 57, 2, 24, C.creamLight);
	// A small window on each side.
	for (const x of [20, 55]) {
		rect(scene, x, 60, 5, 5, C.creamLight);
		rect(scene, x + 1, 61, 3, 3, C.daySky3);
	}
}

/**
 * Round hay bales on the left.
 * @param {Canvas} scene
 */
function drawHay(scene) {
	for (const [cx, cy] of [
		[7, 78],
		[14, 82],
	]) {
		for (let y = cy - 5; y <= cy + 5; y++) {
			for (let x = cx - 5; x <= cx + 5; x++) {
				const d = Math.hypot(x - cx, y - cy);
				if (d <= 5) {
					set(
						scene,
						x,
						y,
						d < 2 ? C.sandShade : (x + y) % 3 ? C.sand : C.sandLight
					);
				}
			}
		}
	}
}

/**
 * A timber fence across the front of the field.
 * @param {Canvas} scene
 */
function drawFence(scene) {
	for (let x = 2; x < SIZE; x += 10) {
		rect(scene, x, 82, 2, 9, C.timber);
		set(scene, x, 82, C.timberLight);
	}
	rect(scene, 0, 84, SIZE, 1, C.timberLight);
	rect(scene, 0, 88, SIZE, 1, C.timber);
}
