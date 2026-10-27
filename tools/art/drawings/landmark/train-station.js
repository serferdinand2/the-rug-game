// The Train Station landmark at dusk: a steam locomotive pulling out from under a lit iron-and-glass station arch.
import {
	createCanvas,
	set,
	rect,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { drawSky } from '../../parts/sky.js';
import { drawSmoke } from '../../parts/smoke.js';
import { drawFigure } from '../../parts/figures.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */

/** The picture fills the station's 3×3 plots at 32 pixels each. */
const SIZE = 96;

/** The arch's centre column, half-width, rise and the row its feet stand on. */
const ARCH_X = 47.5;
const ARCH_HALF = 34;
const ARCH_RISE = 28;
const ARCH_FOOT = 52;

/** The row the rail runs along. */
const RAIL = 81;

/**
 * Draws the Train Station scene.
 * @returns {Canvas} A 96×96 canvas, the shape of its 3×3 footprint.
 */
export function draw() {
	const scene = createCanvas(SIZE, SIZE);
	const layer = createCanvas(SIZE, SIZE);
	const random = seededRandom(23);

	drawSky(layer, { time: 'dusk', horizon: 60, random });
	drawTrackBed(layer);

	drawPillars(scene);
	drawArch(scene);
	drawClock(scene);
	drawLocomotive(scene);
	drawLamp(scene, 76);
	drawFigure(scene, {
		x: 80,
		y: RAIL - 1,
		facing: 'left',
		clothes: C.roofLight,
	});
	drawFigure(scene, {
		x: 86,
		y: RAIL - 1,
		facing: 'left',
		clothes: C.brickRed,
	});
	outline(scene, C.ink);
	drawSmoke(scene, { x: 25, y: 49, tone: 'steam', puffs: 4, drift: 1 });
	set(scene, 76, 50, C.white);
	underlay(scene, layer);
	return scene;
}

/**
 * Gravel ground with the rail and its sleepers running across the picture.
 * @param {Canvas} layer
 */
function drawTrackBed(layer) {
	for (let y = 61; y < SIZE; y++) {
		for (let x = 0; x < SIZE; x++) {
			const colour =
				y === 61
					? C.stoneMid
					: (x + y) % 3 === 0
						? C.stoneMid
						: C.stoneShade;
			set(layer, x, y, colour);
		}
	}
	for (let x = 1; x < SIZE; x += 5) {
		rect(layer, x, RAIL + 1, 4, 2, C.timberShade);
	}
	rect(layer, 0, RAIL, SIZE, 1, C.stoneLight);
}

/**
 * The two brick pillars that carry the arch, lit on their left faces, with stone caps.
 * @param {Canvas} scene
 */
function drawPillars(scene) {
	for (const left of [4, 83]) {
		for (let y = 27; y <= RAIL - 1; y++) {
			for (let x = left; x < left + 9; x++) {
				let colour = C.brickRed;
				if (x === left) {
					colour = C.brickRedLight;
				} else if (x >= left + 7 || y % 3 === 0) {
					colour = C.brickRedShade;
				} else if ((x + (Math.floor(y / 3) % 2) * 2) % 4 === 0) {
					colour = C.brickRedShade;
				}
				set(scene, x, y, colour);
			}
		}
		rect(scene, left - 1, 24, 11, 3, C.stone);
		rect(scene, left - 1, 24, 11, 1, C.stoneLight);
		rect(scene, left + 8, 25, 2, 2, C.stoneShade);
	}
}

/**
 * The top row of the arch at a column, or Infinity outside it.
 * @param {number} x
 * @returns {number}
 */
function archTop(x) {
	const t = (x - ARCH_X) / ARCH_HALF;
	if (Math.abs(t) > 1) {
		return Infinity;
	}
	return ARCH_FOOT - Math.round(ARCH_RISE * Math.sqrt(1 - t * t));
}

/**
 * The arched gable: iron ribs framing panes lit warm from inside, over the dark mouth of the shed.
 * @param {Canvas} scene
 */
function drawArch(scene) {
	for (let x = 13; x <= 82; x++) {
		const top = archTop(x);
		for (let y = top; y <= ARCH_FOOT; y++) {
			let colour;
			if (y <= top + 2) {
				colour = y === top ? C.roofLight : C.roof;
			} else if (x % 6 === 1 || y % 5 === 0) {
				colour = C.roofShade;
			} else {
				colour =
					(Math.floor(x / 6) + Math.floor(y / 5)) % 3 === 0
						? C.gold
						: C.lampGlow;
			}
			set(scene, x, y, colour);
		}
		for (let y = ARCH_FOOT + 1; y <= RAIL - 1; y++) {
			set(scene, x, y, C.night);
		}
	}
	// Lamps hanging inside the shed, each throwing a little light.
	for (const x of [24, 47, 71]) {
		rect(scene, x, 53, 1, 3, C.roofShade);
		rect(scene, x - 1, 56, 3, 2, C.gold);
		rect(scene, x - 2, 58, 5, 1, mix(C.night, C.gold, 0.35));
	}
}

/**
 * The station clock at the top of the arch.
 * @param {Canvas} scene
 */
function drawClock(scene) {
	for (let y = 28; y <= 44; y++) {
		for (let x = 39; x <= 56; x++) {
			const d = Math.hypot(x - ARCH_X, y - 36);
			if (d <= 7) {
				set(scene, x, y, d > 5.6 ? C.brass : C.creamLight);
			}
		}
	}
	for (const [x, y] of [
		[47, 31],
		[47, 41],
		[42, 36],
		[52, 36],
	]) {
		set(scene, x, y, C.creamShade);
	}
	rect(scene, 47, 32, 1, 5, C.ink);
	rect(scene, 48, 36, 3, 1, C.ink);
}

/**
 * A green steam locomotive heading left, headlamp lit, with red wheels and a brass-banded boiler.
 * @param {Canvas} scene
 */
function drawLocomotive(scene) {
	// Boiler: a cylinder lit along its top, with brass bands.
	for (let y = 62; y <= 71; y++) {
		const colour = y <= 63 ? C.pineLight : y >= 70 ? C.pineShade : C.pine;
		rect(scene, 20, y, 29, 1, colour);
	}
	for (const x of [29, 39]) {
		rect(scene, x, 62, 2, 10, C.brass);
	}
	// Rounded smokebox front with the headlamp above it.
	rect(scene, 15, 63, 5, 9, C.night);
	rect(scene, 16, 62, 4, 1, C.night);
	rect(scene, 17, 61, 3, 1, C.night);
	rect(scene, 15, 56, 5, 5, C.gold);
	rect(scene, 16, 57, 3, 3, C.lampGlow);
	// Tall chimney with a brass rim, and the steam dome.
	rect(scene, 23, 51, 5, 11, C.night);
	rect(scene, 22, 50, 7, 2, C.brass);
	rect(scene, 35, 57, 6, 5, C.brass);
	rect(scene, 36, 56, 4, 1, C.brass);
	// Cab with a lit window and an overhanging roof.
	rect(scene, 49, 53, 14, 21, C.pine);
	rect(scene, 49, 53, 2, 21, C.pineLight);
	rect(scene, 60, 53, 3, 21, C.pineShade);
	rect(scene, 47, 50, 18, 3, C.night);
	rect(scene, 52, 56, 7, 7, C.lampGlow);
	rect(scene, 52, 62, 7, 1, C.gold);
	rect(scene, 55, 56, 1, 7, C.pine);
	// Running board, buffer beam and cowcatcher.
	rect(scene, 15, 72, 48, 2, C.night);
	rect(scene, 12, 69, 3, 5, C.brickRed);
	for (let i = 0; i < 6; i++) {
		rect(scene, 9 + i, 74 + i, 6 - i, 1, C.night);
	}
	// Driving wheels and the connecting rod.
	for (const cx of [28, 38, 48]) {
		for (let y = 71; y <= RAIL; y++) {
			for (let x = cx - 5; x <= cx + 5; x++) {
				const d = Math.hypot(x - cx, y - 76.5);
				if (d <= 4.6) {
					set(scene, x, y, d > 3.4 ? C.night : C.brickRed);
				}
			}
		}
		rect(scene, cx, 76, 2, 2, C.brass);
	}
	rect(scene, 28, 77, 22, 1, C.stoneLight);
}

/**
 * A gas lamp on the platform, already lit.
 * @param {Canvas} scene
 * @param {number} x - The post's column
 */
function drawLamp(scene, x) {
	rect(scene, x, 54, 1, RAIL - 54, C.night);
	rect(scene, x - 2, 49, 5, 5, C.gold);
	rect(scene, x - 1, 50, 3, 3, C.lampGlow);
	rect(scene, x - 2, 48, 5, 1, C.night);
}
