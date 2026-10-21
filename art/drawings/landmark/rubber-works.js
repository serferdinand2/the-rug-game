// The Rubber Works landmark at dusk: a brick factory with a tall chimney, stacked tyres and a tapped rubber tree.
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
import { drawSmoke } from '../../parts/smoke.js';
import { drawFactory } from '../../parts/factory.js';
import { drawFigure } from '../../parts/figures.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */

/** The picture fills the works' L-shaped footprint (4×4 minus the top-left 2×2) at 32 pixels each. */
const SIZE = 128;

/** The row everything stands on. */
const GROUND = 110;

/** The tall chimney's left column and top row, in the top-right quarter. */
const CHIMNEY_X = 98;
const CHIMNEY_TOP = 18;

/**
 * Draws the Rubber Works scene.
 * @returns {Canvas} A 128×128 canvas in the shape of its footprint (the top-left quarter empty).
 */
export function draw() {
	const scene = createCanvas(SIZE, SIZE);
	const layer = createCanvas(SIZE, SIZE);
	const random = seededRandom(97);

	drawSky(layer, { time: 'dusk', horizon: 96, random, stars: 0 });
	drawYard(layer);
	drawSmoke(layer, {
		x: CHIMNEY_X + 4,
		y: CHIMNEY_TOP - 2,
		tone: 'smoke',
		puffs: 4,
		drift: -1,
	});

	drawChimney(scene);
	drawFactory(scene, {
		x: 40,
		y: GROUND,
		width: 84,
		height: 28,
		stacks: 2,
	});
	drawTree(scene);
	drawTyres(scene);
	drawFigure(scene, {
		x: 33,
		y: GROUND + 4,
		facing: 'left',
		clothes: C.timber,
	});
	outline(scene, C.ink);
	drawLatex(scene);
	underlay(scene, layer);
	clipToFootprint(scene, FOOTPRINTS['rubber-works']);
	return scene;
}

/**
 * A packed-earth yard with a cart track.
 * @param {Canvas} layer
 */
function drawYard(layer) {
	for (let y = 97; y < SIZE; y++) {
		for (let x = 0; x < SIZE; x++) {
			let colour = (x + y) % 5 === 0 ? C.sandShade : C.timberShade;
			if (x < 36) {
				colour = (x * 3 + y) % 7 === 0 ? C.pine : C.pineShade;
			}
			set(layer, x, y, colour);
		}
	}
	rect(layer, 0, 116, SIZE, 1, C.wood);
	rect(layer, 0, 121, SIZE, 1, C.wood);
}

/**
 * The tall works chimney rising into the dusk on the right.
 * @param {Canvas} scene
 */
function drawChimney(scene) {
	for (let y = CHIMNEY_TOP; y < GROUND - 27; y++) {
		const flare = Math.floor((y - CHIMNEY_TOP) / 22);
		const left = CHIMNEY_X - flare;
		const width = 9 + flare * 2;
		for (let x = left; x < left + width; x++) {
			let colour = C.brickRed;
			if (x === left) {
				colour = C.brickRedLight;
			} else if (x >= left + width - 2 || y % 3 === 0) {
				colour = C.brickRedShade;
			}
			set(scene, x, y, colour);
		}
	}
	rect(scene, CHIMNEY_X - 1, CHIMNEY_TOP - 3, 11, 3, C.stoneMid);
	rect(scene, CHIMNEY_X - 1, CHIMNEY_TOP - 3, 11, 1, C.stoneLight);
	for (const y of [40, 62]) {
		rect(scene, CHIMNEY_X - 1, y, 11, 2, C.stoneMid);
	}
}

/**
 * A rubber tree on the left, its trunk scored and a cup catching latex.
 * @param {Canvas} scene
 */
function drawTree(scene) {
	rect(scene, 14, 82, 6, GROUND - 81, C.timber);
	rect(scene, 14, 82, 1, GROUND - 81, C.timberLight);
	rect(scene, 19, 82, 1, GROUND - 81, C.timberShade);
	for (let i = 0; i < 4; i++) {
		set(scene, 15 + i, 93 + i, C.timberShade);
	}
	rect(scene, 20, 98, 3, 3, C.stoneLight);
	for (let y = 66; y <= 88; y++) {
		for (let x = 0; x <= 36; x++) {
			const d = Math.min(
				Math.hypot(x - 17, (y - 76) * 1.2),
				Math.hypot(x - 8, (y - 82) * 1.3),
				Math.hypot(x - 27, (y - 81) * 1.3)
			);
			if (d <= 10) {
				const lit = x - 17 + (y - 76) < -6;
				set(
					scene,
					x,
					y,
					lit ? C.pineLight : d > 8 ? C.pineShade : C.pine
				);
			}
		}
	}
}

/**
 * Stacks of finished tyres by the works door.
 * @param {Canvas} scene
 */
function drawTyres(scene) {
	for (const [cx, base, count] of [
		[46, GROUND, 4],
		[56, GROUND, 3],
	]) {
		for (let i = 0; i < count; i++) {
			const y = base - i * 4;
			rect(scene, cx - 4, y - 3, 9, 4, C.night);
			rect(scene, cx - 4, y - 3, 9, 1, C.roof);
			rect(scene, cx - 1, y - 2, 3, 1, C.roofShade);
		}
	}
}

/**
 * White latex dripping into the cup; drawn after the outline so it stays fine.
 * @param {Canvas} scene
 */
function drawLatex(scene) {
	set(scene, 21, 97, C.creamLight);
	rect(scene, 21, 99, 1, 1, C.white);
}
