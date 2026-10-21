// The Castle landmark by day: a keep, towers and curtain walls on a green hill, a road winding up to the gate.
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
import { drawFigure } from '../../parts/figures.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */

/** The castle's footprint is .XXX/XXXX/.XXX/.XX. at 32 pixels per plot. */
const SIZE = 128;

/** The row the walls stand on, at the top of the hill. */
const WALL_FOOT = 82;

/**
 * Draws the Castle scene.
 * @returns {Canvas} A 128×128 canvas in the shape of its footprint.
 */
export function draw() {
	const scene = createCanvas(SIZE, SIZE);
	const layer = createCanvas(SIZE, SIZE);
	const random = seededRandom(163);

	drawSky(layer, { time: 'day', horizon: 70, random });
	drawHills(layer);

	drawMasonry(scene, 40, 52, 72, WALL_FOOT - 51);
	drawBattlements(scene, 40, 51, 72);
	drawMasonry(scene, 34, 28, 14, WALL_FOOT - 27);
	drawBattlements(scene, 34, 27, 14);
	drawMasonry(scene, 104, 28, 14, WALL_FOOT - 27);
	drawBattlements(scene, 104, 27, 14);
	drawMasonry(scene, 64, 12, 24, 44);
	drawBattlements(scene, 64, 11, 24);
	drawGate(scene);
	drawWindows(scene);
	drawFigure(scene, { x: 72, y: 108, facing: 'left', clothes: C.daySky1 });
	outline(scene, C.ink);
	drawFlags(scene);
	underlay(scene, layer);
	clipToFootprint(scene, FOOTPRINTS.castle);
	return scene;
}

/**
 * The castle's hill, a distant wooded ridge on the left, and the road to the gate.
 * @param {Canvas} layer
 */
function drawHills(layer) {
	for (let x = 0; x < SIZE; x++) {
		const ridge = Math.round(54 + Math.sin(x * 0.09) * 3);
		for (let y = ridge; y < 71; y++) {
			set(layer, x, y, (x + y) % 3 ? C.pineShade : C.pine);
		}
		const hill = Math.round(68 + ((x - 76) / 40) ** 2 * 10);
		for (let y = Math.min(hill, 71); y < SIZE; y++) {
			let colour = (x * 3 + y) % 7 === 0 ? C.grassLight : C.grass;
			if (y > 100) {
				colour = (x + y) % 4 === 0 ? C.grass : C.grassShade;
			}
			set(layer, x, y, colour);
		}
	}
	// The road winds down from the gate.
	for (let y = WALL_FOOT; y < SIZE; y++) {
		const centre = 76 + Math.round(Math.sin((y - WALL_FOOT) * 0.12) * 8);
		const half = 3 + Math.floor((y - WALL_FOOT) / 12);
		for (let x = centre - half; x <= centre + half; x++) {
			set(layer, x, y, (x + y) % 5 === 0 ? C.sandShade : C.sand);
		}
	}
}

/**
 * Coursed grey stone, lit on the left.
 * @param {Canvas} scene
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 */
function drawMasonry(scene, x, y, w, h) {
	for (let row = y; row < y + h; row++) {
		const course = Math.floor((row - y) / 4);
		for (let col = x; col < x + w; col++) {
			let colour = C.stone;
			if (col === x) {
				colour = C.stoneLight;
			} else if (col >= x + w - 2) {
				colour = C.stoneShade;
			} else if (
				(row - y) % 4 === 3 ||
				(col + (course % 2) * 4) % 8 === 0
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
		if (i % 6 < 3) {
			rect(
				scene,
				x + i,
				y - 3,
				1,
				4,
				i % 6 === 0 ? C.stoneLight : C.stone
			);
		}
	}
}

/**
 * The gatehouse arch with its portcullis.
 * @param {Canvas} scene
 */
function drawGate(scene) {
	for (let y = 64; y <= WALL_FOOT; y++) {
		for (let x = 69; x <= 83; x++) {
			if (y >= 70 || Math.hypot(x - 76, y - 70) <= 7) {
				set(
					scene,
					x,
					y,
					(x - 69) % 3 === 0 || y % 3 === 0 ? C.stoneShade : C.night
				);
			}
		}
	}
}

/**
 * Arrow slits and a lit window in the keep.
 * @param {Canvas} scene
 */
function drawWindows(scene) {
	for (const [x, y] of [
		[40, 40],
		[110, 40],
		[73, 22],
		[79, 22],
		[54, 60],
		[96, 60],
	]) {
		rect(scene, x, y, 2, 6, C.roofShade);
	}
	rect(scene, 74, 34, 4, 6, C.gold);
}

/**
 * Banners flying from the keep and the towers.
 * @param {Canvas} scene
 */
function drawFlags(scene) {
	for (const [x, y, colour] of /** @type {[number, number, string][]} */ ([
		[76, 1, C.brickRed],
		[40, 17, C.daySky1],
		[110, 17, C.daySky1],
	])) {
		rect(scene, x, y, 1, 10, C.wood);
		rect(scene, x + 1, y, 7, 4, colour);
		rect(scene, x + 6, y + 4, 2, 1, colour);
	}
}
