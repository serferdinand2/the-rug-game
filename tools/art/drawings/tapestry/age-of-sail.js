// Age of Sail: a tall ship under full sail leaving harbour at sunrise.
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
import { drawSea } from '../../parts/sea.js';
import { drawBuilding } from '../../parts/buildings.js';
import { drawShip } from '../../parts/ship.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */

/** The horizon row, and the sun's column (seed 28 sets the dusk sky's sun there). */
const HORIZON = 40;
const SUN_X = 55;

/**
 * Draws the Age of Sail scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(28);

	drawSky(layer, { time: 'dusk', horizon: HORIZON, random });
	drawShore(layer);
	drawSea(layer, { time: 'night', top: HORIZON + 1, random });
	drawSunPath(layer, random);

	// The harbour stands behind the ship, so each gets its own outline.
	const harbour = createCanvas(64, 64);
	drawHarbour(harbour);
	outline(harbour, C.ink);
	drawShip(scene, { x: 15, y: 53, flag: C.brickRed });
	outline(scene, C.ink);
	underlay(scene, harbour);
	underlay(scene, layer);
	drawWake(scene);
	drawGulls(scene);
	return scene;
}

/**
 * The far shore behind the harbour: low hills in shadow against the dawn.
 * @param {Canvas} layer
 */
function drawShore(layer) {
	for (let x = 0; x < 34; x++) {
		const top = Math.round(33 + x * 0.18 + Math.sin(x * 0.45) * 1.2);
		for (let y = top; y <= HORIZON; y++) {
			set(layer, x, y, y === top ? C.headlandRidge : C.headland);
		}
	}
}

/**
 * The rising sun's glitter on the water, narrowing towards the viewer.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawSunPath(layer, random) {
	for (let x = SUN_X - 6; x <= SUN_X + 6; x++) {
		set(layer, x, HORIZON + 1, C.gold);
	}
	for (let y = HORIZON + 2; y < 64; y += 2) {
		const half = Math.max(1, 5 - Math.floor((y - HORIZON) / 5));
		const jitter = Math.floor(random() * 3) - 1;
		rect(
			layer,
			SUN_X - half + jitter,
			y,
			half * 2,
			1,
			y < 50 ? C.gold : mix(C.amber, C.nightSea2, 0.3)
		);
	}
}

/**
 * The harbour on the left: a stone pier, a harbour light at its end and houses on the quay.
 * @param {Canvas} scene
 */
function drawHarbour(scene) {
	drawBuilding(scene, { kind: 'house', x: 0, y: 43, width: 9 });
	// The harbour light at the end of the pier: a short tower with a lit lamp.
	const tower = drawBuilding(scene, { kind: 'tower', x: 9, y: 46, width: 5 });
	rect(scene, tower.x + 1, tower.y + 1, 3, 2, C.lampGlow);
	for (let x = 0; x <= 14; x++) {
		for (let y = 44; y <= 48; y++) {
			const colour =
				y === 44
					? C.stoneLight
					: x >= 13 || (x + y) % 5 === 0
						? C.stoneShade
						: C.stone;
			set(scene, x, y, colour);
		}
	}
}

/**
 * White water at the bow and a trail of foam behind the stern.
 * @param {Canvas} scene
 */
function drawWake(scene) {
	for (const [x, y] of [
		[47, 54],
		[48, 54],
		[49, 53],
		[50, 54],
		[14, 54],
		[12, 54],
		[11, 55],
		[9, 55],
		[7, 56],
		[5, 56],
		[13, 55],
		[10, 56],
	]) {
		set(scene, x, y, C.foam);
	}
}

/**
 * Two gulls over the harbour.
 * @param {Canvas} scene
 */
function drawGulls(scene) {
	for (const [gx, gy] of [
		[8, 14],
		[14, 19],
	]) {
		for (const [dx, dy] of [
			[-2, 0],
			[-1, -1],
			[0, 0],
			[1, -1],
			[2, 0],
		]) {
			set(scene, gx + dx, gy + dy, C.gull);
		}
	}
}
