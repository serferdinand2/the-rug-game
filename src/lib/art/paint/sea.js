// The map's sea (#134): long bands of depth seen from the front and above, short wave crests lit on top, and paler shallows by the shore.
import { seededRandom } from './painter.js';
import { PALETTE as C } from './palette.js';
import { BAYER, hash, noise } from './relief/ground.js';
import { SIDES } from './region.js';

/** @typedef {import('./painter.js').Canvas} Canvas */

/** How far from the shore the shallows reach, in pixels. */
const SHALLOWS = 3;

/** The crests' grid: one per step across and down at most, every other row shifted. */
const STEP_X = 9;
const STEP_Y = 5;

/** The share of the crests' grid points left empty. */
const CALM = 0.55;

/**
 * Paints the sea over a region: the water's bands, the shallows along the land and the wave crests, which keep
 * clear of the shallows.
 * @param {Canvas} canvas
 * @param {Uint8Array} mask - The sea region, one byte per pixel
 * @param {Uint8Array} land - The land beside it, one byte per pixel, for the shallows
 * @param {number} seed
 */
export function paintSea(canvas, mask, land, seed) {
	const { w, h } = canvas;
	const bands = noise(seed + 3, 9);
	const fine = noise(seed + 4, 3);
	const rand = seededRandom(hash(seed, 13));
	/** @type {(x: number, y: number) => number} */
	const dither = (x, y) => BAYER[(y % 4) * 4 + (x % 4)];
	/** @type {(x: number, y: number) => boolean} */
	const isLand = (x, y) =>
		x >= 0 && y >= 0 && x < w && y < h && land[y * w + x] === 1;
	const shore = new Uint8Array(w * h);
	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			const i = y * w + x;
			if (!mask[i]) {
				continue;
			}
			for (let r = 1; r <= SHALLOWS + 1 && !shore[i]; r++) {
				if (SIDES.some(([dx, dy]) => isLand(x + dx * r, y + dy * r))) {
					shore[i] = r;
				}
			}
			// Bands stretched across, as the sea is seen from the front and above.
			const n =
				bands(x / 2.2, y) * 0.75 +
				fine(x / 2, y) * 0.25 +
				dither(x, y) * 0.06;
			let colour =
				n > 0.66 ? C.daySea1 : n < 0.34 ? C.daySea3 : C.daySea2;
			if (
				shore[i] &&
				shore[i] <= SHALLOWS &&
				dither(x, y) + 0.5 > shore[i] / 4
			) {
				colour = shore[i] <= 1 ? C.dayWaveDeep : C.daySea1;
			}
			canvas.p[i] = colour;
		}
	}
	/** @type {(x: number, y: number, colour: string) => void} */
	const put = (x, y, colour) => {
		const i = y * w + x;
		if (
			x >= 0 &&
			y >= 0 &&
			x < w &&
			y < h &&
			mask[i] &&
			(!shore[i] || shore[i] > 2)
		) {
			canvas.p[i] = colour;
		}
	};
	for (let gy = 2, row = 0; gy < h; gy += STEP_Y, row++) {
		for (let gx = row % 2 ? 4 : 0; gx < w; gx += STEP_X) {
			if (rand() < CALM) {
				continue;
			}
			const x = gx + Math.floor((rand() - 0.5) * 4);
			const y = gy + Math.floor((rand() - 0.5) * 2);
			const length = 2 + Math.floor(rand() * 3);
			// A crest rising in the middle, lit on its second pixel, with its trough below and to the right.
			for (let i = 0; i < length; i++) {
				const lift = i === 0 || i === length - 1 ? 0 : 1;
				put(x + i, y - lift, i === 1 ? C.dayWave : C.dayWaveDeep);
				put(x + i + 1, y + 1, C.daySea3);
			}
		}
	}
}
