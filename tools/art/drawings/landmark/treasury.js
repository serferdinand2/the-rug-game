// The Treasury landmark by day: a white stone vault house with a great round vault door and gold stacked before it.
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
import { drawStreet } from '../../parts/street.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */

/** The vault door's centre and radius. */
const DOOR_X = 31.5;
const DOOR_Y = 37.5;
const DOOR_R = 11;

/**
 * Draws the Treasury scene.
 * @returns {Canvas} A 64×64 canvas, the shape of its 2×2 footprint.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(47);

	drawSky(layer, { time: 'day', horizon: 50, random });
	drawStreet(layer, { top: 51 });

	drawBuilding(scene);
	drawVaultDoor(scene);
	drawGold(scene);
	outline(scene, C.ink);
	underlay(scene, layer);
	return scene;
}

/**
 * A massive block of rusticated white stone under a heavy cornice, on three steps.
 * @param {Canvas} scene
 */
function drawBuilding(scene) {
	for (let y = 20; y <= 50; y++) {
		const course = Math.floor((y - 20) / 4);
		for (let x = 7; x <= 56; x++) {
			let colour = C.cream;
			if (x === 7) {
				colour = C.creamLight;
			} else if (x >= 55) {
				colour = C.creamShade;
			} else if (
				(y - 20) % 4 === 3 ||
				(x + (course % 2) * 5) % 10 === 0
			) {
				colour = C.creamShade;
			}
			set(scene, x, y, colour);
		}
	}
	// Cornice and the band where an inscription would be.
	rect(scene, 5, 15, 54, 2, C.creamLight);
	rect(scene, 6, 17, 52, 1, C.cream);
	rect(scene, 6, 18, 52, 2, C.creamShade);
	for (let x = 12; x <= 50; x += 3) {
		rect(scene, x, 18, 2, 1, C.stone);
	}
	// Steps.
	rect(scene, 4, 51, 56, 1, C.stoneLight);
	rect(scene, 3, 52, 58, 1, C.stone);
	rect(scene, 2, 53, 60, 2, C.stoneShade);
}

/**
 * The round steel vault door in a brass ring, with bolts and a spoked wheel.
 * @param {Canvas} scene
 */
function drawVaultDoor(scene) {
	for (let y = 25; y <= 50; y++) {
		for (let x = 19; x <= 44; x++) {
			const d = Math.hypot(x - DOOR_X, y - DOOR_Y);
			if (d > DOOR_R + 1.5) {
				continue;
			}
			let colour;
			if (d > DOOR_R) {
				colour = C.brass;
			} else if (d > DOOR_R - 1.5) {
				colour = x + y < DOOR_X + DOOR_Y ? C.stoneLight : C.stoneShade;
			} else {
				colour = x < DOOR_X ? C.stoneMid : C.stone;
			}
			set(scene, x, y, colour);
		}
	}
	// Bolts around the rim.
	for (let i = 0; i < 12; i++) {
		const a = (i / 12) * Math.PI * 2;
		set(
			scene,
			Math.round(DOOR_X + Math.cos(a) * (DOOR_R - 2.5)),
			Math.round(DOOR_Y + Math.sin(a) * (DOOR_R - 2.5)),
			C.brass
		);
	}
	// The spoked wheel at the centre.
	for (let i = -4; i <= 4; i++) {
		set(scene, Math.round(DOOR_X + i), Math.round(DOOR_Y), C.gold);
		set(scene, Math.round(DOOR_X), Math.round(DOOR_Y + i), C.gold);
	}
	rect(scene, 30, 36, 3, 3, C.amber);
}

/**
 * Gold bars stacked on the left and a heap of coins on the right.
 * @param {Canvas} scene
 */
function drawGold(scene) {
	for (const [x, y] of [
		[8, 48],
		[13, 48],
		[10, 45],
	]) {
		rect(scene, x, y, 5, 3, C.gold);
		rect(scene, x, y, 5, 1, C.lampGlow);
		rect(scene, x + 4, y + 1, 1, 2, C.amber);
	}
	for (let y = 0; y < 5; y++) {
		for (let x = -y; x <= y; x++) {
			set(scene, 50 + x, 46 + y, (x + y) % 2 ? C.gold : C.amber);
		}
	}
	set(scene, 50, 45, C.lampGlow);
}
