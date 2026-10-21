// The Launch Pad landmark at night: a white rocket on its pad beside a lattice gantry, lit by floodlights.
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

/** The rocket's leftmost column; it is 8 pixels wide. */
const ROCKET = 28;

/**
 * Draws the Launch Pad scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(37);

	drawSky(layer, {
		time: 'night',
		horizon: 48,
		random,
		sparkles: [
			[8, 7],
			[55, 12],
		],
		moon: { x: 50, y: 30 },
	});
	drawConcrete(layer);
	drawFloodBeams(layer);

	drawPad(scene);
	drawGantry(scene);
	drawRocket(scene);
	drawFloodlights(scene);
	outline(scene, C.ink);
	// Warning lights sit on top of the outline.
	set(scene, 17, 4, C.brickRedLight);
	set(scene, 3, 36, C.lampGlow);
	set(scene, 60, 36, C.lampGlow);
	underlay(scene, layer);
	return scene;
}

/**
 * The concrete apron, lit near the pad and fading into the dark, with the flame trench.
 * @param {Canvas} layer
 */
function drawConcrete(layer) {
	for (let y = 49; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const lit = Math.abs(x - 31.5) < 22 - (y - 49);
			let colour = lit ? C.stoneMid : C.stoneShade;
			if (y === 49) {
				colour = C.stone;
			} else if (x % 8 === 0 || y === 56) {
				colour = C.roof;
			}
			set(layer, x, y, colour);
		}
	}
	rect(layer, 22, 58, 20, 4, C.night);
}

/**
 * Two floodlight beams sweeping up across the sky towards the rocket.
 * @param {Canvas} layer
 */
function drawFloodBeams(layer) {
	for (const [x0, step] of [
		[4, 1],
		[59, -1],
	]) {
		for (let i = 1; i <= 30; i++) {
			const cx = x0 + step * Math.round(i * 0.75);
			const cy = 36 - i;
			const spread = Math.floor(i * 0.25);
			for (let dx = -spread; dx <= spread; dx++) {
				const x = cx + dx;
				const behind = get(layer, x, cy);
				if (behind) {
					const t =
						0.35 *
						(1 - Math.abs(dx) / (spread + 1.5)) *
						(1 - i / 40);
					set(layer, x, cy, mix(behind, C.beamLight, t));
				}
			}
		}
	}
}

/**
 * The raised launch platform under the rocket.
 * @param {Canvas} scene
 */
function drawPad(scene) {
	rect(scene, 18, 47, 28, 1, C.stoneLight);
	rect(scene, 18, 48, 28, 3, C.stone);
	rect(scene, 44, 48, 2, 3, C.stoneShade);
	for (const x of [20, 30, 41]) {
		rect(scene, x, 51, 3, 4, C.stoneShade);
	}
}

/**
 * The service gantry: two rails with cross-bracing, and arms reaching the rocket.
 * @param {Canvas} scene
 */
function drawGantry(scene) {
	for (let y = 6; y <= 46; y++) {
		set(scene, 14, y, C.stoneMid);
		set(scene, 19, y, C.stoneShade);
		const k = (y - 6) % 8;
		set(scene, 15 + (Math.min(k, 7 - k) % 4), y, C.stoneShade);
		set(scene, 18 - (Math.min(k, 7 - k) % 4), y, C.stoneShade);
	}
	for (const y of [6, 14, 22, 30, 38, 46]) {
		rect(scene, 14, y, 6, 1, C.stoneMid);
	}
	rect(scene, 13, 5, 8, 1, C.stone);
	rect(scene, 17, 4, 1, 1, C.stone);
	for (const y of [16, 30]) {
		rect(scene, 20, y, ROCKET - 20, 2, C.stoneMid);
		rect(scene, 20, y + 1, ROCKET - 20, 1, C.stoneShade);
	}
}

/**
 * A white rocket with a red nose and fins, lit from the left by the floodlights.
 * @param {Canvas} scene
 */
function drawRocket(scene) {
	// Nose cone, red at the tip.
	for (let y = 4; y <= 12; y++) {
		const half = Math.min(4, Math.round((y - 3) / 2));
		for (let x = ROCKET + 4 - half; x < ROCKET + 4 + half; x++) {
			set(scene, x, y, y <= 7 ? C.brickRed : hullColour(x));
		}
	}
	// Body, with a red band and a dark interstage.
	for (let y = 13; y <= 40; y++) {
		for (let x = ROCKET; x < ROCKET + 8; x++) {
			let colour = hullColour(x);
			if (y === 18 || y === 19) {
				colour = x === ROCKET ? C.brickRedLight : C.brickRed;
			} else if (y === 30) {
				colour = C.night;
			}
			set(scene, x, y, colour);
		}
	}
	// A small window.
	rect(scene, ROCKET + 3, 23, 2, 2, C.daySky2);
	// Fins.
	for (let i = 0; i < 6; i++) {
		rect(
			scene,
			ROCKET - 1 - Math.floor(i / 2),
			35 + i,
			1 + Math.floor(i / 2),
			1,
			C.brickRed
		);
		rect(
			scene,
			ROCKET + 8,
			35 + i,
			1 + Math.floor(i / 2),
			1,
			C.brickRedShade
		);
	}
	// Engine bell.
	rect(scene, ROCKET + 1, 41, 6, 2, C.stoneShade);
	rect(scene, ROCKET, 43, 8, 3, C.stoneMid);
	rect(scene, ROCKET, 43, 1, 3, C.stoneLight);
}

/**
 * The rocket's hull colour across its width: lit on the left, shaded on the right.
 * @param {number} x
 * @returns {string}
 */
function hullColour(x) {
	const i = x - ROCKET;
	return i <= 0
		? C.white
		: i <= 3
			? C.creamLight
			: i <= 5
				? C.cream
				: C.creamShade;
}

/**
 * Two floodlight masts at the edges of the apron.
 * @param {Canvas} scene
 */
function drawFloodlights(scene) {
	for (const x of [3, 60]) {
		rect(scene, x, 38, 1, 13, C.stoneShade);
		rect(scene, x - 1, 35, 3, 3, C.gold);
	}
}
