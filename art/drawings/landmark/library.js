// The Library landmark by day: a long sandstone library with tall arched windows and a grand doorway.
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

/** The picture fills the library's 4×2 plots at 32 pixels each. */
const W = 128;
const H = 64;

/** The building's walls run from LEFT to RIGHT and stand on GROUND. */
const LEFT = 6;
const RIGHT = 121;
const GROUND = 55;

/**
 * Draws the Library scene.
 * @returns {Canvas} A 128×64 canvas, the shape of its 4×2 footprint.
 */
export function draw() {
	const scene = createCanvas(W, H);
	const layer = createCanvas(W, H);
	const random = seededRandom(67);

	drawSky(layer, { time: 'day', horizon: 52, random });
	drawTerrain(layer, { kind: 'grassland', top: 53, random });

	drawWalls(scene);
	drawWindows(scene);
	drawDoorway(scene);
	drawBushes(scene);
	drawFigure(scene, { x: 76, y: 58, facing: 'left', clothes: C.roofLight });
	rect(scene, 75, 52, 2, 2, C.brickRed);
	outline(scene, C.ink);
	underlay(scene, layer);
	return scene;
}

/**
 * Sandstone walls in courses, with a heavy cornice, a parapet and a plinth.
 * @param {Canvas} scene
 */
function drawWalls(scene) {
	for (let y = 20; y <= GROUND; y++) {
		const course = Math.floor((y - 20) / 3);
		for (let x = LEFT; x <= RIGHT; x++) {
			let colour = C.sand;
			if (x === LEFT) {
				colour = C.sandLight;
			} else if (x >= RIGHT - 1) {
				colour = C.sandShade;
			} else if ((y - 20) % 3 === 2 || (x + (course % 2) * 4) % 8 === 0) {
				colour = C.sandShade;
			}
			set(scene, x, y, colour);
		}
	}
	rect(scene, LEFT - 2, 16, RIGHT - LEFT + 5, 2, C.creamLight);
	rect(scene, LEFT - 1, 18, RIGHT - LEFT + 3, 2, C.creamShade);
	for (let x = LEFT; x <= RIGHT; x += 6) {
		rect(scene, x, 12, 4, 4, C.cream);
		set(scene, x, 12, C.creamLight);
	}
	rect(scene, LEFT, 15, RIGHT - LEFT + 1, 1, C.cream);
	rect(scene, LEFT - 1, 51, RIGHT - LEFT + 3, 5, C.stone);
	rect(scene, LEFT - 1, 51, RIGHT - LEFT + 3, 1, C.stoneLight);
}

/**
 * Tall round-arched windows with sky reflected in their panes.
 * @param {Canvas} scene
 */
function drawWindows(scene) {
	for (const x of [12, 25, 38, 81, 94, 107]) {
		for (let y = 25; y <= 46; y++) {
			for (let i = 0; i < 9; i++) {
				const arch = y < 29 ? Math.hypot(i - 4, y - 29) <= 4.5 : true;
				if (!arch) {
					continue;
				}
				let colour = y < 34 ? C.daySky5 : C.daySky3;
				if (i === 0 || i === 8 || y === 46) {
					colour = C.creamLight;
				} else if (i === 4 || y === 36) {
					colour = C.cream;
				}
				set(scene, x + i, y, colour);
			}
		}
	}
}

/**
 * The grand arched doorway with its double doors and steps.
 * @param {Canvas} scene
 */
function drawDoorway(scene) {
	for (let y = 26; y <= 50; y++) {
		for (let x = 55; x <= 72; x++) {
			const outer = y < 34 ? Math.hypot(x - 63.5, y - 34) <= 8.6 : true;
			if (!outer) {
				continue;
			}
			const inner =
				y < 34
					? Math.hypot(x - 63.5, y - 34) <= 6.5
					: x >= 57 && x <= 70;
			set(scene, x, y, inner ? C.timber : C.creamLight);
		}
	}
	rect(scene, 63, 30, 1, 21, C.timberShade);
	set(scene, 61, 42, C.brass);
	set(scene, 66, 42, C.brass);
	rect(scene, 53, 51, 22, 2, C.stoneLight);
	rect(scene, 51, 53, 26, 2, C.stone);
}

/**
 * Round clipped bushes along the front.
 * @param {Canvas} scene
 */
function drawBushes(scene) {
	for (const cx of [10, 30, 46, 82, 98, 117]) {
		for (let y = 49; y <= 57; y++) {
			for (let x = cx - 4; x <= cx + 4; x++) {
				const d = Math.hypot(x - cx, (y - 53) * 1.1);
				if (d <= 4.4) {
					set(
						scene,
						x,
						y,
						x - cx + (y - 53) < -2
							? C.pineLight
							: d > 3
								? C.pineShade
								: C.pine
					);
				}
			}
		}
	}
}
