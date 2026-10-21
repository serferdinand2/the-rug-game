// The Stadium landmark at dusk: an oval stadium full of fans, its pitch lit by floodlight towers.
import {
	createCanvas,
	get,
	set,
	rect,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { drawSky } from '../../parts/sky.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */

/** The picture fills the stadium's 4×2 plots at 32 pixels each. */
const W = 128;
const H = 64;

/** The bowl's centre and radii. */
const CX = 63.5;
const CY = 40;
const RX = 50;
const RY = 18;

/** Fans' shirts, picked by position so the crowd looks mixed. */
const FANS = [
	C.brickRedLight,
	C.gold,
	C.daySky3,
	C.creamLight,
	C.pineLight,
	C.roofLight,
];

/**
 * Draws the Stadium scene.
 * @returns {Canvas} A 128×64 canvas, the shape of its 4×2 footprint.
 */
export function draw() {
	const scene = createCanvas(W, H);
	const layer = createCanvas(W, H);
	const random = seededRandom(137);

	drawSky(layer, { time: 'dusk', horizon: 52, random });
	for (let y = 53; y < H; y++) {
		rect(layer, 0, y, W, 1, y % 3 === 0 ? C.stoneShade : C.stoneMid);
	}
	drawBeams(layer);

	drawBowl(scene);
	drawTower(scene, 8);
	drawTower(scene, 117);
	outline(scene, C.ink);
	drawFlags(scene);
	underlay(scene, layer);
	return scene;
}

/**
 * Floodlight beams falling from the towers onto the stadium.
 * @param {Canvas} layer
 */
function drawBeams(layer) {
	for (const [x0, step] of [
		[10, 1],
		[118, -1],
	]) {
		for (let i = 1; i <= 34; i++) {
			const cx = x0 + step * Math.round(i * 1.2);
			const cy = 6 + Math.round(i * 0.7);
			const spread = Math.floor(i * 0.3);
			for (let dy = -spread; dy <= spread; dy++) {
				const behind = get(layer, cx, cy + dy);
				if (behind) {
					const t =
						0.3 *
						(1 - Math.abs(dy) / (spread + 1.5)) *
						(1 - i / 42);
					set(layer, cx, cy + dy, mix(behind, C.beamLight, t));
				}
			}
		}
	}
}

/**
 * The bowl: the outer wall with arches, the crowd on the stands, and the striped pitch.
 * @param {Canvas} scene
 */
function drawBowl(scene) {
	for (let y = CY - RY; y <= 56; y++) {
		for (let x = Math.round(CX - RX); x <= Math.round(CX + RX); x++) {
			const outer = Math.hypot((x - CX) / RX, (y - CY) / RY);
			if (outer > 1 && y < CY) {
				continue;
			}
			const pitch = Math.hypot(
				(x - CX) / (RX - 16),
				(y - (CY - 3)) / (RY - 10)
			);
			let colour;
			if (y >= CY) {
				// The outer wall below the rim, with arches.
				colour =
					(x - 4) % 8 < 3 && y > CY + 4 && y < 54
						? C.roofShade
						: C.cream;
				if (y === CY) {
					colour = C.creamLight;
				}
			} else if (pitch <= 1) {
				colour = Math.floor((x - CX) / 6) % 2 ? C.grass : C.grassLight;
			} else if (outer > 0.94) {
				colour = C.creamLight;
			} else {
				colour = FANS[(x * 7 + y * 3) % FANS.length];
				if ((x + y) % 3 === 0) {
					colour = C.stoneMid;
				}
			}
			set(scene, x, y, colour);
		}
	}
	rect(scene, Math.round(CX - RX), 56, RX * 2 + 1, 1, C.creamShade);
}

/**
 * A floodlight tower with a bank of lamps on top.
 * @param {Canvas} scene
 * @param {number} x - Its centre column
 */
function drawTower(scene, x) {
	rect(scene, x - 1, 10, 3, 47, C.stoneMid);
	rect(scene, x - 1, 10, 1, 47, C.stoneLight);
	rect(scene, x - 5, 3, 11, 7, C.stoneShade);
	for (let ly = 4; ly <= 8; ly += 2) {
		for (let lx = x - 4; lx <= x + 4; lx += 2) {
			set(scene, lx, ly, C.lampGlow);
		}
	}
}

/**
 * Pennants flying around the rim; drawn after the outline so they stay small.
 * @param {Canvas} scene
 */
function drawFlags(scene) {
	for (const x of [26, 46, 82, 102]) {
		const top =
			CY - Math.round(RY * Math.sqrt(1 - ((x - CX) / RX) ** 2)) - 6;
		rect(scene, x, top, 1, 6, C.stoneLight);
		rect(scene, x + 1, top, 3, 2, x % 2 ? C.brickRedLight : C.gold);
	}
}
