// The Barracks landmark by day: a stone fort with two towers, a gate and a red banner, guarded by a sentry.
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

/**
 * Draws the Barracks scene.
 * @returns {Canvas} A 64×64 canvas, the shape of its 2×2 footprint.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(59);

	drawSky(layer, { time: 'day', horizon: 48, random });
	drawTerrain(layer, { kind: 'grassland', top: 49, random });

	drawMasonry(scene, 14, 31, 36, 24, 3);
	drawMasonry(scene, 4, 17, 12, 38, 1);
	drawMasonry(scene, 48, 17, 12, 38, 1);
	drawBattlements(scene, 14, 30, 36);
	drawBattlements(scene, 4, 16, 12);
	drawBattlements(scene, 48, 16, 12);
	drawGate(scene);
	drawFlag(scene);
	drawBanner(scene);
	drawFigure(scene, { x: 41, y: 56, facing: 'left', clothes: C.brickRed });
	rect(scene, 40, 42, 1, 14, C.timberLight);
	set(scene, 40, 41, C.stoneLight);
	outline(scene, C.ink);
	underlay(scene, layer);
	return scene;
}

/**
 * A block of coursed stone, lit on its left edge and shaded on its right.
 * @param {Canvas} scene
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 * @param {number} offset - Shifts the joints so neighbouring blocks don't line up
 */
function drawMasonry(scene, x, y, w, h, offset) {
	for (let row = y; row < y + h; row++) {
		const course = Math.floor((row - y) / 3);
		for (let col = x; col < x + w; col++) {
			let colour = C.stone;
			if (col === x) {
				colour = C.stoneLight;
			} else if (col >= x + w - 2) {
				colour = C.stoneShade;
			} else if (
				(row - y) % 3 === 2 ||
				(col + offset + (course % 2) * 3) % 6 === 0
			) {
				colour = C.stoneMid;
			}
			set(scene, col, row, colour);
		}
	}
}

/**
 * Merlons along the top of a wall or tower.
 * @param {Canvas} scene
 * @param {number} x
 * @param {number} y - The row just above the masonry
 * @param {number} w
 */
function drawBattlements(scene, x, y, w) {
	for (let i = 0; i < w; i++) {
		if (i % 4 < 2) {
			rect(
				scene,
				x + i,
				y - 2,
				1,
				3,
				i % 4 === 0 ? C.stoneLight : C.stone
			);
		}
	}
}

/**
 * The arched gate with a heavy timber door standing half open.
 * @param {Canvas} scene
 */
function drawGate(scene) {
	for (let y = 39; y <= 54; y++) {
		const inset = y === 39 ? 3 : y === 40 ? 1 : 0;
		rect(scene, 25 + inset, y, 14 - inset * 2, 1, C.night);
	}
	for (let x = 25; x <= 31; x++) {
		rect(scene, x, 41, 1, 14, x % 2 ? C.timber : C.timberShade);
	}
	rect(scene, 25, 45, 7, 1, C.wood);
	rect(scene, 25, 50, 7, 1, C.wood);
	set(scene, 30, 48, C.brass);
}

/**
 * A red flag flying from the left tower.
 * @param {Canvas} scene
 */
function drawFlag(scene) {
	rect(scene, 9, 2, 1, 12, C.wood);
	for (let i = 0; i < 9; i++) {
		const wave = i % 4 < 2 ? 0 : 1;
		rect(
			scene,
			10 + i,
			3 + wave,
			1,
			5,
			i % 3 === 0 ? C.brickRedShade : C.brickRed
		);
	}
	set(scene, 9, 1, C.gold);
}

/**
 * A banner with a gold emblem hanging on the wall.
 * @param {Canvas} scene
 */
function drawBanner(scene) {
	rect(scene, 19, 33, 4, 9, C.brickRed);
	rect(scene, 20, 35, 2, 3, C.gold);
	set(scene, 19, 42, C.brickRed);
	set(scene, 22, 42, C.brickRed);
	rect(scene, 42, 33, 4, 9, C.brickRed);
	rect(scene, 43, 35, 2, 3, C.gold);
	set(scene, 42, 42, C.brickRed);
	set(scene, 45, 42, C.brickRed);
}
