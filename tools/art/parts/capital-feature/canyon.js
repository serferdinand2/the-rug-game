// The Canyon's printed cacti: one saguaro standing on each 'C' plot, with a soft shadow at its foot (#132).
import { PALETTE as C } from '../../palette.js';
import { PITCH } from '../../../../src/lib/art/relief.js';
import { put, shadow } from '../../../../src/lib/art/paint/relief/canvas.js';
import { dither } from '../capital-relief/rock.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */

/** The saguaro's trunk and arms as [x, y, width, height] within its 32×32 plot. */
const BODY = [
	[14, 6, 5, 21],
	[9, 13, 5, 3],
	[9, 8, 3, 6],
	[19, 16, 5, 3],
	[21, 11, 3, 6],
];

/**
 * Draws a saguaro on a plot: a green trunk with two arms, lit on the left, outlined in ink, with a flower on top.
 * @param {Canvas} canvas
 * @param {Uint8Array} ok - Where it may paint
 * @param {number} ox - The plot's left pixel
 * @param {number} oy - The plot's top pixel
 */
export function drawSaguaro(canvas, ok, ox, oy) {
	for (let x = 15; x <= 24; x++) {
		for (let y = 26; y <= 28; y++) {
			if (dither(ox + x, oy + y) < 0.2) {
				shadow(canvas, ox + x, oy + y, 0.25);
			}
		}
	}
	/** @type {Set<number>} */
	const own = new Set();
	for (const [x0, y0, w, h] of BODY) {
		for (let y = y0; y < y0 + h; y++) {
			for (let x = x0; x < x0 + w; x++) {
				own.add(y * PITCH + x);
			}
		}
	}
	const inside = (/** @type {number} */ x, /** @type {number} */ y) =>
		own.has(y * PITCH + x);
	for (const key of own) {
		const x = key % PITCH;
		const y = Math.floor(key / PITCH);
		let col =
			!inside(x - 1, y) || !inside(x, y - 1)
				? C.pineLight
				: !inside(x + 1, y)
					? C.pineShade
					: (x + y) % 5 === 0
						? C.pineShade
						: C.pine;
		put(canvas, ok, ox + x, oy + y, col);
		for (const [dx, dy] of [
			[1, 0],
			[-1, 0],
			[0, -1],
		]) {
			if (!inside(x + dx, y + dy)) {
				put(canvas, ok, ox + x + dx, oy + y + dy, C.ink);
			}
		}
	}
	put(canvas, ok, ox + 16, oy + 5, C.brickRedLight);
	put(canvas, ok, ox + 17, oy + 5, C.gold);
}

/**
 * Stands a saguaro on each of a mat's 'C' plots.
 * @param {Canvas} canvas - Empty, the mat's relief size
 * @param {readonly string[]} layout
 */
export function paintCanyonFeatures(canvas, layout) {
	const ok = new Uint8Array(canvas.w * canvas.h).fill(1);
	layout.forEach((row, r) => {
		[...row].forEach((mark, c) => {
			if (mark === 'C') {
				drawSaguaro(canvas, ok, c * PITCH, r * PITCH);
			}
		});
	});
}
