// The Windmill landmark by day: a white tower windmill with great sails turning over striped fields.
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

/** @typedef {import('../../painter.js').Canvas} Canvas */

/** The windmill's footprint is XXXX/.XX.: the bottom-left and bottom-right plots are empty. */
const W = 128;
const H = 64;

/** The hub the sails turn on. */
const HUB_X = 64;
const HUB_Y = 22;

/**
 * Draws the Windmill scene.
 * @returns {Canvas} A 128×64 canvas in the shape of its footprint.
 */
export function draw() {
	const scene = createCanvas(W, H);
	const layer = createCanvas(W, H);
	const random = seededRandom(157);

	drawSky(layer, { time: 'day', horizon: 50, random });
	drawFields(layer);

	drawTower(scene);
	drawSails(scene);
	outline(scene, C.ink);
	rect(scene, HUB_X - 1, HUB_Y - 1, 3, 3, C.timberShade);
	underlay(scene, layer);
	clipToFootprint(scene, FOOTPRINTS.windmill);
	return scene;
}

/**
 * Striped fields of wheat and green crops.
 * @param {Canvas} layer
 */
function drawFields(layer) {
	for (let y = 51; y < H; y++) {
		for (let x = 0; x < W; x++) {
			const band = Math.floor((x + (y - 51) * 2) / 6) % 3;
			const colour =
				band === 0 ? C.sand : band === 1 ? C.sandLight : C.grass;
			set(layer, x, y, y === 51 ? C.grassLight : colour);
		}
	}
}

/**
 * The tapering white tower with a door and a window, under a timber cap.
 * @param {Canvas} scene
 */
function drawTower(scene) {
	for (let y = 26; y < H; y++) {
		const half = 7 + Math.round((y - 26) * 0.2);
		for (let x = HUB_X - half; x <= HUB_X + half; x++) {
			let colour = C.creamLight;
			if (x === HUB_X - half) {
				colour = C.white;
			} else if (x >= HUB_X + half - 2) {
				colour = C.cream;
			}
			set(scene, x, y, colour);
		}
	}
	rect(scene, HUB_X - 3, 52, 6, 12, C.timber);
	rect(scene, HUB_X - 2, 38, 4, 5, C.roofShade);
	for (let r = 0; r < 8; r++) {
		rect(
			scene,
			HUB_X - 9 + r,
			25 - r,
			19 - r * 2,
			1,
			r % 2 ? C.timber : C.timberShade
		);
	}
}

/** How far each sail reaches from the hub, and how wide its cloth is. */
const SAIL_LENGTH = 30;
const SAIL_WIDTH = 6;

/**
 * Four sails in an X around the hub. Each pixel is placed by its distance along the arm (s)
 * and across it (t), so the cloth is solid, framed, and crossed by bars every few pixels.
 * @param {Canvas} scene
 */
function drawSails(scene) {
	for (const angle of [-45, 45, 135, 225]) {
		const a = (angle * Math.PI) / 180;
		const ux = Math.cos(a);
		const uy = Math.sin(a);
		for (let y = 0; y < H; y++) {
			for (let x = 0; x < W; x++) {
				const s = (x - HUB_X) * ux + (y - HUB_Y) * uy;
				const t = -(x - HUB_X) * uy + (y - HUB_Y) * ux;
				if (s < 2 || s > SAIL_LENGTH) {
					continue;
				}
				if (Math.abs(t) < 0.8) {
					set(scene, x, y, C.timberShade);
				} else if (s >= 7 && t > 0 && t <= SAIL_WIDTH) {
					let colour = C.creamLight;
					if (t > SAIL_WIDTH - 1 || s > SAIL_LENGTH - 1) {
						colour = C.timberShade;
					} else if (Math.floor(s) % 4 === 0) {
						colour = C.timber;
					}
					set(scene, x, y, colour);
				}
			}
		}
	}
}
