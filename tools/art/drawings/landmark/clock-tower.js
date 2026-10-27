// The Clock Tower landmark by day: a tall stone clock tower with a slate spire rising over red town roofs.
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
import { drawBuilding } from '../../parts/buildings.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */

/** The tower's left column, width and the clock's centre. */
const LEFT = 24;
const WIDTH = 16;
const CLOCK_X = 31.5;
const CLOCK_Y = 19.5;

/**
 * Draws the Clock Tower scene.
 * @returns {Canvas} A 64×64 canvas, the shape of its 2×2 footprint.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(139);

	drawSky(layer, { time: 'day', horizon: 63, random });

	drawTower(scene);
	drawSpire(scene);
	drawClock(scene);
	drawBuilding(scene, { kind: 'house', x: 1, y: 63, width: 22 });
	drawBuilding(scene, { kind: 'house', x: 42, y: 63, width: 21 });
	outline(scene, C.ink);
	underlay(scene, layer);
	return scene;
}

/**
 * The stone shaft of the tower with narrow windows.
 * @param {Canvas} scene
 */
function drawTower(scene) {
	for (let y = 12; y < 64; y++) {
		for (let x = LEFT; x < LEFT + WIDTH; x++) {
			let colour = C.stone;
			if (x === LEFT) {
				colour = C.stoneLight;
			} else if (x >= LEFT + WIDTH - 3) {
				colour = C.stoneShade;
			} else if (
				y % 4 === 3 ||
				(x + (Math.floor(y / 4) % 2) * 3) % 6 === 0
			) {
				colour = C.stoneMid;
			}
			set(scene, x, y, colour);
		}
	}
	for (const y of [34, 46]) {
		rect(scene, 30, y, 3, 6, C.roofShade);
		set(scene, 31, y - 1, C.roofShade);
	}
	rect(scene, LEFT - 1, 28, WIDTH + 2, 2, C.stoneLight);
}

/**
 * A steep slate spire with a gold finial.
 * @param {Canvas} scene
 */
function drawSpire(scene) {
	for (let r = 0; r < 9; r++) {
		const from = LEFT - 1 + r;
		const to = LEFT + WIDTH - r;
		for (let x = from; x <= to; x++) {
			set(
				scene,
				x,
				11 - r,
				x <= from + 1 ? C.roofLight : x >= to - 1 ? C.roofShade : C.roof
			);
		}
	}
	rect(scene, 31, 1, 2, 2, C.gold);
}

/**
 * The clock face with its hands at ten past ten.
 * @param {Canvas} scene
 */
function drawClock(scene) {
	for (let y = 13; y <= 26; y++) {
		for (let x = 25; x <= 38; x++) {
			const d = Math.hypot(x - CLOCK_X, y - CLOCK_Y);
			if (d <= 6.4) {
				set(scene, x, y, d > 5.3 ? C.gold : C.creamLight);
			}
		}
	}
	for (const [x, y] of [
		[31, 15],
		[31, 24],
		[27, 19],
		[36, 19],
	]) {
		set(scene, x, y, C.creamShade);
	}
	rect(scene, 31, 17, 1, 3, C.ink);
	set(scene, 30, 18, C.ink);
	set(scene, 32, 18, C.ink);
	set(scene, 33, 17, C.ink);
}
