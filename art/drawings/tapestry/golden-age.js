// Golden Age: a city of golden domes and spires glowing in the sunset, mirrored in the river before its walls.
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
import { drawSkyline } from '../../parts/skyline.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */

/** The river's first row, and the great dome's centre column. */
const WATER = 51;
const CX = 31;

/** Sunset-tinted walls: lit, plain and shaded. */
const WALL_LIGHT = mix(C.creamLight, C.duskSky6, 0.3);
const WALL = mix(C.cream, C.duskSky5, 0.35);
const WALL_SHADE = mix(C.creamShade, C.duskSky3, 0.45);

/**
 * Draws the Golden Age scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(2483);

	drawSky(layer, { time: 'dusk', horizon: WATER - 1, random });
	drawGlow(layer);
	drawSkyline(layer, { base: WATER - 1, time: 'dusk', random, height: 18 });
	drawDistantDomes(layer);

	drawWalls(scene);
	drawHall(scene, 3, 13, 36, 6);
	drawHall(scene, 47, 60, 34, 5);
	drawSpire(scene, 18, 17);
	drawSpire(scene, 44, 17);
	drawGreatHall(scene);
	outline(scene, C.ink);
	underlay(scene, layer);
	drawFinials(scene);
	drawRiver(scene, random);
	return scene;
}

/**
 * The sunset's glow: the sky behind the great dome warmed towards gold.
 * @param {Canvas} layer
 */
function drawGlow(layer) {
	for (let y = 0; y < WATER; y++) {
		for (let x = 0; x < 64; x++) {
			const d = Math.sqrt((x - CX) ** 2 + ((y - 30) * 1.2) ** 2);
			const behind = get(layer, x, y);
			if (behind && d < 30) {
				const t = (1 - d / 30) * 0.55;
				set(layer, x, y, mix(behind, C.gold, Math.round(t * 8) / 8));
			}
		}
	}
}

/**
 * Far-off domes and towers of the rest of the city, rising above the skyline, soft and unoutlined.
 * @param {Canvas} layer
 */
function drawDistantDomes(layer) {
	for (const [cx, top, r] of [
		[1, 31, 3],
		[16, 33, 2],
		[42, 31, 2],
		[62, 28, 3],
	]) {
		rect(layer, cx - r, top + 1, r * 2 + 1, WATER - top - 1, C.roof);
		rect(layer, cx + r, top + 1, 1, WATER - top - 1, C.roofLight);
		for (let j = 0; j <= r + 1; j++) {
			const half = j === 0 ? 0 : Math.min(r, j);
			for (let x = cx - half; x <= cx + half; x++) {
				set(layer, x, top - r - 1 + j, x > cx ? C.gold : C.amber);
			}
		}
		set(layer, cx, top - r - 2, C.amber);
	}
}

/**
 * Paints one wall pixel, lit on the right (towards the sun) and shaded on the left of its span.
 * @param {Canvas} canvas
 * @param {number} x
 * @param {number} y
 * @param {number} left - The span's first column
 * @param {number} right - The span's last column
 */
function wall(canvas, x, y, left, right) {
	const colour = x === right ? WALL_LIGHT : x <= left + 1 ? WALL_SHADE : WALL;
	set(canvas, x, y, colour);
}

/**
 * A lit arched window two pixels wide.
 * @param {Canvas} canvas
 * @param {number} x - Left column
 * @param {number} y - The arch's top row
 * @param {number} h - Height
 */
function archWindow(canvas, x, y, h) {
	set(canvas, x, y, C.amber);
	set(canvas, x + 1, y, C.gold);
	rect(canvas, x, y + 1, 2, h - 1, C.gold);
	set(canvas, x + 1, y + 1, C.lampGlow);
}

/**
 * A dome: a gold bulb lit on the right, with ribs, sitting on its base row.
 * @param {Canvas} canvas
 * @param {number} cx - Centre column
 * @param {number} base - The bottom row
 * @param {number[]} profile - Half-widths from the top row down
 */
function dome(canvas, cx, base, profile) {
	const top = base - profile.length + 1;
	profile.forEach((half, j) => {
		const y = top + j;
		for (let x = cx - half; x <= cx + half; x++) {
			const u = half === 0 ? 0 : (x - cx) / half;
			let colour = C.gold;
			if (u > 0.25 && u < 0.75 && j < profile.length * 0.6) {
				colour = C.lampGlow;
			} else if (u <= -0.55) {
				colour = u <= -0.85 ? C.brass : C.amber;
			} else if (Math.abs(u + 0.15) < 0.12 && half > 3) {
				colour = C.amber;
			}
			set(canvas, x, y, colour);
		}
	});
}

/**
 * The great hall: a tall drum of arched windows carrying the great dome, on an arcaded base.
 * @param {Canvas} canvas
 */
function drawGreatHall(canvas) {
	// The arcaded base.
	for (let y = 33; y <= WATER - 5; y++) {
		for (let x = CX - 12; x <= CX + 12; x++) {
			wall(canvas, x, y, CX - 12, CX + 12);
		}
	}
	rect(canvas, CX - 13, 33, 27, 1, WALL_LIGHT);
	for (let x = CX - 10; x <= CX + 8; x += 4) {
		archWindow(canvas, x, 37, 5);
	}
	// The drum.
	for (let y = 25; y <= 32; y++) {
		for (let x = CX - 9; x <= CX + 9; x++) {
			wall(canvas, x, y, CX - 9, CX + 9);
		}
	}
	rect(canvas, CX - 10, 25, 21, 1, WALL_LIGHT);
	for (let x = CX - 7; x <= CX + 5; x += 3) {
		archWindow(canvas, x, 27, 4);
	}
	// The great dome.
	dome(canvas, CX, 24, [1, 3, 5, 6, 7, 8, 8, 9, 9, 10, 10, 10]);
}

/**
 * A side hall: a block with lit windows, carrying an onion dome.
 * @param {Canvas} canvas
 * @param {number} left - First column
 * @param {number} right - Last column
 * @param {number} top - The roof row
 * @param {number} r - The dome's half-width
 */
function drawHall(canvas, left, right, top, r) {
	for (let y = top; y <= WATER - 5; y++) {
		for (let x = left; x <= right; x++) {
			wall(canvas, x, y, left, right);
		}
	}
	rect(canvas, left - 1, top, right - left + 3, 1, WALL_LIGHT);
	for (let x = left + 2; x <= right - 2; x += 4) {
		archWindow(canvas, x, top + 3, 4);
	}
	const cx = Math.floor((left + right) / 2);
	// A short drum, then an onion dome.
	for (let y = top - 3; y < top; y++) {
		for (let x = cx - r + 2; x <= cx + r - 2; x++) {
			wall(canvas, x, y, cx - r + 2, cx + r - 2);
		}
	}
	const profile = [0, 1, 1, 2, 3, 4, 5, 5, 6, 6, 5, 4].map((h) =>
		Math.round((h * r) / 6)
	);
	dome(canvas, cx, top - 4, profile);
}

/**
 * A slender spire with a balcony and a pointed gold cap.
 * @param {Canvas} canvas
 * @param {number} x - Left column
 * @param {number} top - The cap's tip
 */
function drawSpire(canvas, x, top) {
	for (let y = top + 6; y <= WATER - 5; y++) {
		set(canvas, x, y, WALL_SHADE);
		set(canvas, x + 1, y, WALL);
		set(canvas, x + 2, y, WALL_LIGHT);
	}
	rect(canvas, x - 1, top + 12, 5, 1, WALL_LIGHT);
	set(canvas, x + 1, top + 9, C.gold);
	for (let j = 0; j < 6; j++) {
		const half = Math.min(2, Math.floor(j / 2));
		for (let i = -half; i <= half; i++) {
			set(
				canvas,
				x + 1 + i,
				top + j,
				i > 0 ? C.lampGlow : i < 0 ? C.amber : C.gold
			);
		}
	}
}

/**
 * The river walls along the bank: a crenellated wall with a water gate.
 * @param {Canvas} canvas
 */
function drawWalls(canvas) {
	for (let y = WATER - 5; y < WATER; y++) {
		for (let x = 0; x < 64; x++) {
			const colour =
				y === WATER - 5
					? WALL_LIGHT
					: (x + (y % 2) * 2) % 4 === 0
						? WALL_SHADE
						: WALL;
			set(canvas, x, y, colour);
		}
	}
	for (let x = 0; x < 64; x += 4) {
		rect(canvas, x, WATER - 7, 2, 2, WALL);
		set(canvas, x + 1, WATER - 7, WALL_LIGHT);
	}
}

/**
 * Gold balls and spikes on the domes, drawn over the outline so they stay fine.
 * @param {Canvas} canvas
 */
function drawFinials(canvas) {
	for (const [x, y, h] of [
		[CX, 12, 4],
		[8, 20, 3],
		[53, 18, 3],
	]) {
		for (let j = 0; j < h; j++) {
			set(canvas, x, y - j, C.gold);
		}
		set(canvas, x, y - h, C.lampGlow);
	}
}

/**
 * The river: the city's reflection broken into ripples, the gold domes and windows
 * shining through the dark water and the plain walls fading into it.
 * @param {Canvas} canvas
 * @param {() => number} random
 */
function drawRiver(canvas, random) {
	const bright = new Set([C.gold, C.lampGlow, C.amber, C.brass]);
	for (let y = WATER; y < 64; y++) {
		const depth = depthOf(y);
		const base = mix(C.duskSky2, C.nightSea3, depth);
		const shift = (y - WATER) % 2 === 1 ? 1 : 0;
		for (let x = 0; x < 64; x++) {
			const sx = Math.min(63, x + shift);
			const src = get(canvas, sx, 2 * WATER - 1 - y) ?? C.duskSky1;
			const t = bright.has(src) ? 0.3 + depth * 0.3 : 0.62 + depth * 0.2;
			set(canvas, x, y, mix(src, base, t));
		}
	}
	rect(canvas, 0, WATER, 64, 1, mix(C.duskSky6, C.duskSky4, 0.4));
	for (let i = 0; i < 14; i++) {
		const y = WATER + 2 + Math.floor(random() * (62 - WATER));
		const x = Math.floor(random() * 60);
		const n = 2 + Math.floor(random() * 4);
		rect(canvas, x, y, n, 1, mix(C.duskSky6, C.duskSky4, depthOf(y)));
	}
}

/**
 * How far down the river a row lies, from 0 at the bank to 1 at the bottom.
 * @param {number} y
 * @returns {number}
 */
function depthOf(y) {
	return (y - WATER) / (64 - WATER);
}
