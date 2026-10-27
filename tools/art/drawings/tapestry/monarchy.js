// Monarchy: a throne room, the crown resting on a red throne between royal banners.
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
import { drawInterior } from '../../parts/interior.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */

/** The room's centre column, and the floor's first row. */
const CX = 32;
const FLOOR = 42;

/**
 * Draws the Monarchy scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(41);

	drawInterior(layer, {
		floor: FLOOR,
		random,
		wall: 'stone',
		window: { x: 25, y: 2, w: 14, h: 11, time: 'day' },
	});
	drawLight(layer);

	drawCarpet(scene);
	drawDais(scene);
	drawThrone(scene);
	drawBanner(scene, 6);
	drawBanner(scene, 49);
	outline(scene, C.ink);
	underlay(scene, layer);
	drawCrown(scene);
	return scene;
}

/**
 * Daylight falling from the window onto the wall behind the throne.
 * @param {Canvas} layer
 */
function drawLight(layer) {
	for (let y = 14; y < FLOOR; y++) {
		const spread = Math.floor((y - 14) * 0.35);
		for (let x = 26 - spread; x <= 37 + spread; x++) {
			const behind = layer.p[y * 64 + x];
			if (behind) {
				set(layer, x, y, mix(behind, C.lampGlow, 0.18));
			}
		}
	}
}

/**
 * A red carpet running from the dais towards the viewer, widening with nearness, with gold edges.
 * @param {Canvas} scene
 */
function drawCarpet(scene) {
	for (let y = 48; y < 64; y++) {
		const half = 7 + Math.floor((y - 48) / 3);
		for (let x = CX - half; x < CX + half; x++) {
			const edge = x === CX - half || x === CX + half - 1;
			const colour = edge
				? C.gold
				: x >= CX + half - 3
					? C.brickRedShade
					: C.brickRed;
			set(scene, x, y, colour);
		}
	}
}

/**
 * Two broad stone steps up to the throne.
 * @param {Canvas} scene
 */
function drawDais(scene) {
	for (const [top, left, right] of [
		[40, 14, 49],
		[44, 10, 53],
	]) {
		for (let y = top; y < top + 4; y++) {
			for (let x = left; x <= right; x++) {
				const colour =
					y === top
						? C.stoneLight
						: x >= right - 2
							? C.stoneShade
							: C.stone;
				set(scene, x, y, colour);
			}
		}
	}
}

/**
 * The throne: a tall gilded frame with a red back, armrests and a red seat, gold finials on top.
 * @param {Canvas} scene
 */
function drawThrone(scene) {
	const left = CX - 8;
	const right = CX + 7;
	// The tall back, rounded at the top.
	for (let y = 14; y <= 32; y++) {
		const inset = y === 14 ? 3 : y === 15 ? 1 : 0;
		for (let x = left + 2 + inset; x <= right - 2 - inset; x++) {
			const frame =
				x === left + 2 + inset || x === right - 2 - inset || y <= 15;
			const colour = frame
				? x >= right - 3
					? C.amber
					: C.gold
				: x >= right - 5
					? C.brickRedShade
					: C.brickRed;
			set(scene, x, y, colour);
		}
	}
	// Finials on the top corners and a jewel in the crest.
	for (const x of [left + 2, right - 2]) {
		set(scene, x, 13, C.gold);
		set(scene, x, 12, C.lampGlow);
	}
	set(scene, CX, 13, C.gold);
	set(scene, CX, 12, C.brickRedLight);
	// Armrests, the seat and the legs.
	for (const x0 of [left, right - 2]) {
		rect(scene, x0, 27, 3, 2, C.gold);
		rect(scene, x0, 29, 3, 10, x0 > CX ? C.amber : C.gold);
	}
	rect(scene, left + 3, 33, right - left - 5, 3, C.brickRed);
	rect(scene, left + 3, 33, right - left - 5, 1, C.brickRedLight);
	rect(scene, left + 3, 36, right - left - 5, 1, C.amber);
	rect(scene, left + 3, 37, 2, 3, C.gold);
	rect(scene, right - 4, 37, 2, 3, C.amber);
}

/**
 * A long purple banner hanging from a gold rod, with a gold star device and a swallowtail.
 * @param {Canvas} scene
 * @param {number} x - The banner's leftmost column
 */
function drawBanner(scene, x) {
	const w = 9;
	rect(scene, x - 1, 4, w + 2, 1, C.gold);
	for (let y = 5; y <= 34; y++) {
		for (let i = 0; i < w; i++) {
			const tail = y > 30 && Math.abs(i - 4) < y - 30;
			if (tail) {
				continue;
			}
			const colour =
				i === 0 ? C.roofLight : i >= w - 2 ? C.roofShade : C.roof;
			set(scene, x + i, y, colour);
		}
	}
	// Gold bands and an eight-point star device.
	rect(scene, x, 8, w, 1, C.gold);
	rect(scene, x, 27, w, 1, C.gold);
	const cy = 17;
	for (const [dx, dy] of [
		[0, -3],
		[0, -2],
		[0, -1],
		[0, 0],
		[0, 1],
		[0, 2],
		[0, 3],
		[-3, 0],
		[-2, 0],
		[-1, 0],
		[1, 0],
		[2, 0],
		[3, 0],
		[-1, -1],
		[1, -1],
		[-1, 1],
		[1, 1],
		[-2, -2],
		[2, -2],
		[-2, 2],
		[2, 2],
	]) {
		set(scene, x + 4 + dx, cy + dy, C.gold);
	}
}

/**
 * The crown resting on the seat: a gold band with five points and red and blue jewels.
 * Drawn after the outline, with its own ink edge, so it sits clearly in front of the red seat.
 * @param {Canvas} scene
 */
function drawCrown(scene) {
	const rows = [
		'k.k.k.k.k',
		'kGkGkGkGk',
		'kGGGGGGGk',
		'kGrGbGrGk',
		'kAAAAAAAk',
		'kkkkkkkkk',
	];
	/** @type {Record<string, string>} */
	const colours = {
		k: C.ink,
		G: C.gold,
		A: C.amber,
		r: C.brickRedLight,
		b: C.nightWave,
	};
	rows.forEach((line, j) => {
		[...line].forEach((key, i) => {
			if (key !== '.') {
				set(scene, CX - 4 + i, 27 + j, colours[key]);
			}
		});
	});
	// The points' tips.
	for (const i of [0, 2, 4, 6, 8]) {
		set(scene, CX - 4 + i, 26, C.ink);
		set(scene, CX - 4 + i, 27, C.lampGlow);
	}
}
