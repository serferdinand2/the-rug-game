// The TV Station landmark at night: a broadcast building with an ON AIR light, a dish and a tall antenna.
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

/** @typedef {import('../../painter.js').Canvas} Canvas */

/** The picture fills the station's footprint (3×3 minus its top-left plot) at 32 pixels each. */
const SIZE = 96;

/** The antenna's centre column. */
const MAST = 66;

/**
 * Draws the TV Station scene.
 * @returns {Canvas} A 96×96 canvas in the shape of its footprint (the top-left plot empty).
 */
export function draw() {
	const scene = createCanvas(SIZE, SIZE);
	const layer = createCanvas(SIZE, SIZE);
	const random = seededRandom(127);

	drawSky(layer, {
		time: 'night',
		horizon: 86,
		random,
		stars: 70,
		starRows: 70,
	});
	drawSkyline(layer, { base: 86, time: 'night', random, height: 34 });
	for (let y = 87; y < SIZE; y++) {
		rect(layer, 0, y, SIZE, 1, y % 3 === 0 ? C.roof : C.roofShade);
	}

	drawAntenna(scene);
	drawBuilding(scene);
	drawDish(scene);
	outline(scene, C.ink);
	set(scene, MAST, 3, C.brickRedLight);
	set(scene, MAST, 28, C.brickRedLight);
	underlay(scene, layer);
	clipToFootprint(scene, FOOTPRINTS['tv-station']);
	return scene;
}

/**
 * A tall lattice antenna rising from the roof.
 * @param {Canvas} scene
 */
function drawAntenna(scene) {
	for (let y = 4; y <= 52; y++) {
		const half = 1 + Math.round(((y - 4) / 48) * 4);
		set(scene, MAST - half, y, C.stoneLight);
		set(scene, MAST + half, y, C.stoneShade);
		if ((y - 4) % 5 === 0) {
			rect(scene, MAST - half, y, half * 2 + 1, 1, C.stoneMid);
		}
	}
	rect(scene, MAST - 6, 18, 13, 1, C.stoneMid);
	rect(scene, MAST - 4, 34, 9, 1, C.stoneMid);
}

/**
 * The broadcast building: studio windows lit by screens, and the red ON AIR light.
 * @param {Canvas} scene
 */
function drawBuilding(scene) {
	rect(scene, 6, 52, 84, 35, C.stoneMid);
	rect(scene, 6, 52, 1, 35, C.stone);
	rect(scene, 87, 52, 3, 35, C.stoneShade);
	rect(scene, 4, 50, 88, 2, C.stoneLight);
	for (let x = 11; x <= 80; x += 10) {
		for (const y of [57, 68]) {
			rect(scene, x, y, 7, 6, C.night);
			rect(
				scene,
				x + 1,
				y + 1,
				5,
				4,
				(x + y) % 3 ? C.daySky3 : C.daySky5
			);
		}
	}
	rect(scene, 38, 78, 20, 9, C.lampGlow);
	rect(scene, 47, 78, 2, 9, C.stoneMid);
	// ON AIR light over the door.
	rect(scene, 40, 74, 16, 3, C.brickRedLight);
	rect(scene, 42, 75, 12, 1, C.white);
}

/**
 * A satellite dish on the left of the roof.
 * @param {Canvas} scene
 */
function drawDish(scene) {
	rect(scene, 20, 42, 2, 8, C.stoneShade);
	for (let y = 32; y <= 43; y++) {
		for (let x = 10; x <= 32; x++) {
			const d = Math.hypot((x - 21) / 10, (y - 43) / 10);
			if (d <= 1 && d >= 0.7) {
				set(scene, x, y, x < 18 ? C.stoneLight : C.stone);
			}
		}
	}
	rect(scene, 21, 35, 1, 5, C.stoneMid);
}
