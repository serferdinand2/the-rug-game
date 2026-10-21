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

/** The arch's centre column, half-width and the row its feet stand on. */
const ARCH_X = 31.5;
const ARCH_HALF = 23;
const ARCH_FOOT = 34;

/** The row the rail runs along. */
const RAIL = 53;

/**
 * Draws the Train Station scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(23);

	drawSky(layer, { time: 'dusk', horizon: 40, random });
	drawTrackBed(layer);

	drawPillars(scene);
	drawArch(scene);
	drawClock(scene);
	drawLocomotive(scene);
	drawLamp(scene);
	drawFigure(scene, { x: 52, y: 52, facing: 'left', clothes: C.roofLight });
	outline(scene, C.ink);
	drawSmoke(scene, { x: 16, y: 33, tone: 'steam', puffs: 3, drift: 1 });
	set(scene, 50, 33, C.white);
	underlay(scene, layer);
	return scene;
}

/**
 * Gravel ground with the rail and its sleepers running across the picture.
 * @param {Canvas} layer
 */
function drawTrackBed(layer) {
	for (let y = 41; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const colour =
				y === 41
					? C.stoneMid
					: (x + y) % 3 === 0
						? C.stoneMid
						: C.stoneShade;
			set(layer, x, y, colour);
		}
	}
	for (let x = 1; x < 64; x += 4) {
		rect(layer, x, RAIL + 1, 3, 2, C.timberShade);
	}
	rect(layer, 0, RAIL, 64, 1, C.stoneLight);
}

/**
 * The two brick pillars that carry the arch, lit on their left faces, with stone caps.
 * @param {Canvas} scene
 */
function drawPillars(scene) {
	for (const left of [3, 55]) {
		for (let y = 18; y <= 52; y++) {
			for (let x = left; x < left + 6; x++) {
				let colour = C.brickRed;
				if (x === left) {
					colour = C.brickRedLight;
				} else if (x === left + 5 || y % 3 === 0) {
					colour = C.brickRedShade;
				}
				set(scene, x, y, colour);
			}
		}
		rect(scene, left - 1, 16, 8, 2, C.stone);
		rect(scene, left - 1, 16, 8, 1, C.stoneLight);
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
	return ARCH_FOOT - Math.round(18 * Math.sqrt(1 - t * t));
}

/**
 * The arched gable: iron ribs framing panes lit warm from inside, over the dark mouth of the shed.
 * @param {Canvas} scene
 */
function drawArch(scene) {
	for (let x = 9; x <= 54; x++) {
		const top = archTop(x);
		for (let y = top; y <= ARCH_FOOT; y++) {
			let colour;
			if (y <= top + 1) {
				colour = y === top ? C.roofLight : C.roof;
			} else if (x % 5 === 1 || y % 4 === 0) {
				colour = C.roofShade;
			} else {
				colour =
					(Math.floor(x / 5) + Math.floor(y / 4)) % 3 === 0
						? C.gold
						: C.lampGlow;
			}
			set(scene, x, y, colour);
		}
		for (let y = ARCH_FOOT + 1; y <= 52; y++) {
			set(scene, x, y, C.night);
		}
	}
	// Lamps hanging inside the shed.
	for (const x of [16, 31, 46]) {
		set(scene, x, 36, C.roofShade);
		set(scene, x, 37, C.gold);
		set(scene, x, 38, mix(C.night, C.gold, 0.4));
	}
}

/**
 * The station clock at the top of the arch.
 * @param {Canvas} scene
 */
function drawClock(scene) {
	for (let y = 20; y <= 28; y++) {
		for (let x = 27; x <= 36; x++) {
			const d = Math.hypot(x - 31.5, y - 24);
			if (d <= 4.6) {
				set(scene, x, y, d > 3.6 ? C.brass : C.creamLight);
			}
		}
	}
	rect(scene, 31, 21, 1, 4, C.ink);
	rect(scene, 32, 24, 2, 1, C.ink);
}

/**
 * A green steam locomotive heading left, headlamp lit, with red wheels and a brass-banded boiler.
 * @param {Canvas} scene
 */
function drawLocomotive(scene) {
	// Boiler: a cylinder lit along its top, with brass bands.
	for (let y = 41; y <= 47; y++) {
		const colour = y === 41 ? C.pineLight : y >= 46 ? C.pineShade : C.pine;
		rect(scene, 13, y, 19, 1, colour);
	}
	for (const x of [19, 26]) {
		rect(scene, x, 41, 1, 7, C.brass);
	}
	// Rounded smokebox front with the headlamp above it.
	rect(scene, 10, 42, 3, 6, C.night);
	rect(scene, 11, 41, 2, 1, C.night);
	rect(scene, 10, 38, 3, 3, C.gold);
	set(scene, 11, 39, C.lampGlow);
	// Tall chimney and steam dome.
	rect(scene, 15, 35, 3, 6, C.night);
	rect(scene, 14, 34, 5, 1, C.brass);
	rect(scene, 23, 38, 3, 3, C.brass);
	// Cab with a lit window.
	rect(scene, 32, 35, 9, 14, C.pine);
	rect(scene, 32, 35, 1, 14, C.pineLight);
	rect(scene, 39, 35, 2, 14, C.pineShade);
	rect(scene, 31, 33, 11, 2, C.night);
	rect(scene, 34, 37, 4, 4, C.lampGlow);
	rect(scene, 34, 40, 4, 1, C.gold);
	// Running board, buffer beam and cowcatcher.
	rect(scene, 10, 48, 31, 1, C.night);
	rect(scene, 8, 46, 2, 3, C.brickRed);
	for (let i = 0; i < 4; i++) {
		rect(scene, 6 + i, 49 + i, 4 - i, 1, C.night);
	}
	// Driving wheels and the connecting rod.
	for (const cx of [18, 25, 32]) {
		for (let y = 48; y <= 53; y++) {
			for (let x = cx - 3; x <= cx + 3; x++) {
				const d = Math.hypot(x - cx, y - 50.5);
				if (d <= 3) {
					set(scene, x, y, d > 2.1 ? C.night : C.brickRed);
				}
			}
		}
		set(scene, cx, 50, C.brass);
	}
	rect(scene, 18, 51, 15, 1, C.stoneLight);
}

/**
 * A gas lamp on the platform, already lit.
 * @param {Canvas} scene
 */
function drawLamp(scene) {
	rect(scene, 50, 36, 1, 17, C.night);
	rect(scene, 49, 33, 3, 3, C.gold);
	rect(scene, 49, 32, 3, 1, C.night);
}
