// The Forge landmark by day: a stone smithy with a glowing hearth, an anvil and a chimney trailing smoke.
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
import { drawTerrain } from '../../parts/terrain.js';
import { drawSmoke } from '../../parts/smoke.js';
import { drawFigure } from '../../parts/figures.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */

/** The smithy's walls run from column LEFT to RIGHT and stand on row BASE. */
const LEFT = 10;
const RIGHT = 41;
const BASE = 55;

/**
 * Draws the Forge scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(11);

	drawSky(layer, { time: 'day', horizon: 49, random });
	drawTerrain(layer, { kind: 'grassland', top: 50, random });
	drawSmoke(layer, { x: 16, y: 10, tone: 'smoke', puffs: 3, drift: 1 });

	drawWalls(scene);
	drawRoof(scene);
	drawChimney(scene);
	drawHearth(scene);
	drawWindow(scene);
	drawAnvil(scene);
	drawFigure(scene, { x: 57, y: 56, facing: 'left', clothes: C.timber });
	outline(scene, C.ink);
	drawSparks(scene);
	underlay(scene, layer);
	return scene;
}

/**
 * Coursed stone walls, lit on the left, with the dark arched mouth of the forge.
 * @param {Canvas} scene
 */
function drawWalls(scene) {
	for (let y = 32; y <= BASE; y++) {
		const course = Math.floor((y - 32) / 4);
		for (let x = LEFT; x <= RIGHT; x++) {
			let colour = C.stone;
			if (x === LEFT) {
				colour = C.stoneLight;
			} else if (x >= RIGHT - 1) {
				colour = C.stoneShade;
			} else if ((y - 32) % 4 === 3 || (x + (course % 2) * 3) % 6 === 0) {
				colour = C.stoneMid;
			}
			set(scene, x, y, colour);
		}
	}
	// The arched opening, dark inside.
	for (let y = 36; y <= BASE; y++) {
		const from = y === 36 ? 22 : y === 37 ? 20 : 19;
		const to = y === 36 ? 29 : y === 37 ? 31 : 32;
		for (let x = from; x <= to; x++) {
			set(scene, x, y, C.roofShade);
		}
	}
}

/**
 * A shingled shed roof, high on the chimney side and sloping down to the right.
 * @param {Canvas} scene
 */
function drawRoof(scene) {
	for (let x = 8; x <= 44; x++) {
		const top = 22 + Math.floor(((x - 8) * 7) / 36);
		for (let y = top; y <= 31; y++) {
			let colour = C.timber;
			if (y === top) {
				colour = C.timberLight;
			} else if (y === 31 || y % 3 === 0) {
				colour = C.timberShade;
			} else if ((x + (Math.floor(y / 3) % 2) * 2) % 4 === 0) {
				colour = C.timberShade;
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * A stone chimney rising through the roof, with a capped top.
 * @param {Canvas} scene
 */
function drawChimney(scene) {
	for (let y = 12; y <= 30; y++) {
		for (let x = 13; x <= 18; x++) {
			let colour = C.stone;
			if (x === 13) {
				colour = C.stoneLight;
			} else if (x >= 17) {
				colour = C.stoneShade;
			} else if (y % 3 === 0) {
				colour = C.stoneMid;
			}
			set(scene, x, y, colour);
		}
	}
	rect(scene, 12, 11, 8, 1, C.stoneMid);
	set(scene, 12, 11, C.stoneLight);
}

/**
 * The brick hearth inside the opening, its fire throwing a warm glow on the dark interior.
 * @param {Canvas} scene
 */
function drawHearth(scene) {
	for (let y = 38; y <= BASE; y++) {
		for (let x = 19; x <= 32; x++) {
			const d = Math.hypot(x - 25.5, y - 50);
			if (d < 9) {
				set(
					scene,
					x,
					y,
					mix(C.roofShade, C.amber, 0.35 * (1 - d / 9) + 0.1)
				);
			}
		}
	}
	rect(scene, 21, 46, 10, 10, C.brickRedShade);
	for (let y = 47; y <= 53; y++) {
		for (let x = 23; x <= 28; x++) {
			const d = Math.hypot(x - 25.5, y - 51);
			const colour =
				d <= 1.2
					? C.white
					: d <= 2.2
						? C.lampGlow
						: d <= 3.2
							? C.gold
							: C.amber;
			set(scene, x, y, colour);
		}
	}
	for (const [x, y] of [
		[24, 46],
		[27, 45],
		[25, 44],
	]) {
		set(scene, x, y, C.gold);
	}
	rect(scene, 21, 54, 10, 2, C.brickRed);
}

/**
 * A small shuttered window lit faintly by the fire inside.
 * @param {Canvas} scene
 */
function drawWindow(scene) {
	rect(scene, 34, 39, 6, 6, C.timberShade);
	rect(scene, 35, 40, 4, 4, mix(C.roofShade, C.gold, 0.3));
	rect(scene, 36, 40, 1, 4, C.timberShade);
	rect(scene, 35, 41, 4, 1, C.timberShade);
}

/**
 * An iron anvil on a block, its horn pointing at the smithy.
 * @param {Canvas} scene
 */
function drawAnvil(scene) {
	rect(scene, 44, 49, 11, 1, C.stoneLight);
	rect(scene, 42, 49, 2, 1, C.stoneLight);
	rect(scene, 45, 50, 10, 1, C.stoneMid);
	rect(scene, 43, 50, 2, 1, C.stoneMid);
	rect(scene, 47, 51, 6, 1, C.stoneShade);
	rect(scene, 48, 52, 4, 2, C.stoneShade);
	rect(scene, 46, 54, 8, 2, C.timberShade);
	set(scene, 46, 54, C.timber);
}

/**
 * Sparks flying from the anvil; drawn after the outline so they stay bright.
 * @param {Canvas} scene
 */
function drawSparks(scene) {
	for (const [x, y] of [
		[48, 46],
		[51, 44],
		[53, 46],
	]) {
		set(scene, x, y, C.lampGlow);
	}
	for (const [x, y] of [
		[46, 45],
		[50, 42],
		[45, 43],
	]) {
		set(scene, x, y, C.gold);
	}
}
