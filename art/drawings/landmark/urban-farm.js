// The Urban Farm landmark by day: a glass greenhouse and vegetable beds on the roof of a city building.
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
import { drawSkyline } from '../../parts/skyline.js';
import { drawFigure } from '../../parts/figures.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */

/** The picture fills the farm's footprint (3×3 minus its top-left plot) at 32 pixels each. */
const SIZE = 96;

/** The roof the farm stands on. */
const ROOF = 52;

/**
 * Draws the Urban Farm scene.
 * @returns {Canvas} A 96×96 canvas in the shape of its footprint (the top-left plot empty).
 */
export function draw() {
	const scene = createCanvas(SIZE, SIZE);
	const layer = createCanvas(SIZE, SIZE);
	const random = seededRandom(131);

	drawSky(layer, { time: 'day', horizon: 95, random });
	drawSkyline(layer, { base: 95, time: 'day', random, height: 52 });

	drawBuilding(scene);
	drawGreenhouse(scene);
	drawBeds(scene);
	drawFigure(scene, { x: 24, y: ROOF - 1, clothes: C.timber });
	outline(scene, C.ink);
	underlay(scene, layer);
	clipToFootprint(scene, FOOTPRINTS['urban-farm']);
	return scene;
}

/**
 * The brick building under the farm, with rows of windows.
 * @param {Canvas} scene
 */
function drawBuilding(scene) {
	for (let y = ROOF; y < SIZE; y++) {
		for (let x = 2; x <= 93; x++) {
			let colour = C.brickRed;
			if (x === 2) {
				colour = C.brickRedLight;
			} else if (x >= 92 || y % 3 === 0) {
				colour = C.brickRedShade;
			}
			set(scene, x, y, colour);
		}
	}
	rect(scene, 0, ROOF - 1, SIZE, 2, C.stoneLight);
	for (let y = ROOF + 6; y < SIZE - 4; y += 12) {
		for (let x = 8; x < 90; x += 10) {
			rect(scene, x, y, 5, 7, C.daySky3);
			rect(scene, x, y, 5, 2, C.daySky5);
			rect(scene, x - 1, y + 7, 7, 1, C.stoneLight);
		}
	}
}

/**
 * A glass greenhouse with a pitched roof, full of green plants.
 * @param {Canvas} scene
 */
function drawGreenhouse(scene) {
	const left = 40;
	const right = 90;
	const eaves = 38;
	for (let y = 26; y < ROOF - 1; y++) {
		const inset = y < eaves ? Math.round((eaves - y) * 2) : 0;
		for (let x = left + inset; x <= right - inset; x++) {
			let colour = y < eaves ? C.daySky6 : C.daySky5;
			if ((x - left) % 6 === 0 || y === eaves) {
				colour = C.stoneLight;
			} else if (y > 42) {
				colour =
					(x + y) % 4 === 0
						? C.pineLight
						: (x * 3 + y) % 5 === 0
							? C.brickRedLight
							: C.grass;
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * Raised vegetable beds and a beehive on the open part of the roof.
 * @param {Canvas} scene
 */
function drawBeds(scene) {
	for (const x of [4, 15, 28]) {
		rect(scene, x, 44, 9, 7, C.timber);
		rect(scene, x, 44, 9, 1, C.timberLight);
		for (let i = 0; i < 4; i++) {
			rect(scene, x + 1 + i * 2, 41, 1, 3, C.pine);
			set(
				scene,
				x + 1 + i * 2,
				40,
				i % 2 ? C.grassLight : C.brickRedLight
			);
		}
	}
	rect(scene, 34, 42, 4, 8, C.gold);
	rect(scene, 33, 41, 6, 1, C.timber);
	rect(scene, 34, 45, 4, 1, C.amber);
}
