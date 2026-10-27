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

/** The picture fills the pad's 3×2 plots at 32 pixels each. */
const W = 96;
const H = 64;

/** The rocket's leftmost column; it is 8 pixels wide. */
const ROCKET = 44;

/**
 * Draws the Launch Pad scene.
 * @returns {Canvas} A 96×64 canvas, the shape of its 3×2 footprint.
 */
export function draw() {
	const scene = createCanvas(W, H);
	const layer = createCanvas(W, H);
	const random = seededRandom(37);

	drawSky(layer, {
		time: 'night',
		horizon: 48,
		random,
		sparkles: [
			[10, 7],
			[84, 9],
		],
		moon: { x: 80, y: 24 },
	});
	drawConcrete(layer);
	drawFloodBeams(layer);

	drawBunker(scene);
	drawPad(scene);
	drawGantry(scene);
	drawRocket(scene);
	drawFloodlights(scene);
	outline(scene, C.ink);
	// Warning lights sit on top of the outline.
	set(scene, 33, 4, C.brickRedLight);
	set(scene, 6, 36, C.lampGlow);
	set(scene, 89, 36, C.lampGlow);
	underlay(scene, layer);
	return scene;
}

/**
 * The concrete apron, lit around the pad and fading into the dark, with the flame trench.
 * @param {Canvas} layer
 */
function drawConcrete(layer) {
	for (let y = 49; y < H; y++) {
		for (let x = 0; x < W; x++) {
			const lit = Math.abs(x - (ROCKET + 3.5)) < 30 - (y - 49) * 1.5;
			let colour = lit ? C.stoneMid : C.stoneShade;
			if (y === 49) {
				colour = C.stone;
			} else if (x % 8 === 0 || y === 56) {
				colour = C.roof;
			}
			set(layer, x, y, colour);
		}
	}
	rect(layer, ROCKET - 10, 58, 28, 4, C.night);
}

/**
 * Two floodlight beams sweeping up across the sky towards the rocket.
 * @param {Canvas} layer
 */
function drawFloodBeams(layer) {
	for (const [x0, step] of [
		[7, 1],
		[88, -1],
	]) {
		for (let i = 1; i <= 34; i++) {
			const cx = x0 + step * Math.round(i * 0.95);
			const cy = 36 - i;
			const spread = Math.floor(i * 0.25);
			for (let dx = -spread; dx <= spread; dx++) {
				const x = cx + dx;
				const behind = get(layer, x, cy);
				if (behind) {
					const t =
						0.35 *
						(1 - Math.abs(dx) / (spread + 1.5)) *
						(1 - i / 44);
					set(layer, x, cy, mix(behind, C.beamLight, t));
				}
			}
		}
	}
}

/**
 * The low control bunker to the right, its windows lit.
 * @param {Canvas} scene
 */
function drawBunker(scene) {
	for (let y = 38; y <= 50; y++) {
		const inset = Math.max(0, 40 - y);
		for (let x = 64 + inset; x <= 84 - inset; x++) {
			let colour = C.stone;
			if (y <= 39) {
				colour = C.stoneLight;
			} else if (x >= 82) {
				colour = C.stoneShade;
			}
			set(scene, x, y, colour);
		}
	}
	for (const x of [67, 72, 77]) {
		rect(scene, x, 43, 3, 2, C.lampGlow);
	}
	rect(scene, 73, 30, 1, 8, C.stoneShade);
	rect(scene, 70, 30, 7, 1, C.stoneMid);
}

/**
 * The raised launch platform under the rocket.
 * @param {Canvas} scene
 */
function drawPad(scene) {
	rect(scene, ROCKET - 10, 47, 28, 1, C.stoneLight);
	rect(scene, ROCKET - 10, 48, 28, 3, C.stone);
	rect(scene, ROCKET + 16, 48, 2, 3, C.stoneShade);
	for (const x of [ROCKET - 8, ROCKET + 2, ROCKET + 13]) {
		rect(scene, x, 51, 3, 4, C.stoneShade);
	}
}

/**
 * The service gantry: two rails with cross-bracing, and arms reaching the rocket.
 * @param {Canvas} scene
 */
function drawGantry(scene) {
	const left = ROCKET - 14;
	for (let y = 6; y <= 46; y++) {
		set(scene, left, y, C.stoneMid);
		set(scene, left + 5, y, C.stoneShade);
		const k = (y - 6) % 8;
		set(scene, left + 1 + (Math.min(k, 7 - k) % 4), y, C.stoneShade);
		set(scene, left + 4 - (Math.min(k, 7 - k) % 4), y, C.stoneShade);
	}
	for (const y of [6, 14, 22, 30, 38, 46]) {
		rect(scene, left, y, 6, 1, C.stoneMid);
	}
	rect(scene, left - 1, 5, 8, 1, C.stone);
	rect(scene, left + 3, 4, 1, 1, C.stone);
	for (const y of [16, 30]) {
		rect(scene, left + 6, y, ROCKET - left - 6, 2, C.stoneMid);
		rect(scene, left + 6, y + 1, ROCKET - left - 6, 1, C.stoneShade);
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
		const reach = 1 + Math.floor(i / 2);
		rect(scene, ROCKET - reach, 35 + i, reach, 1, C.brickRed);
		rect(scene, ROCKET + 8, 35 + i, reach, 1, C.brickRedShade);
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
	for (const x of [6, 89]) {
		rect(scene, x, 38, 1, 13, C.stoneShade);
		rect(scene, x - 1, 35, 3, 3, C.gold);
	}
}
