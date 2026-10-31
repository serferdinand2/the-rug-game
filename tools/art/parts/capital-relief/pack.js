// Helpers for placing pieces in a relief's footprint: which plots are impassable, whether a shape fits, and where to try first (#132).
import { PITCH } from '../../../../src/lib/art/relief.js';
import { rowPixels } from './rock.js';

/** @typedef {import('../../../../src/lib/art/paint/relief/footprint.js').Footprint} Footprint */

/** The eight neighbours of a pixel. */
export const EIGHT = Object.freeze([
	[1, 0],
	[-1, 0],
	[0, 1],
	[0, -1],
	[1, 1],
	[-1, 1],
	[1, -1],
	[-1, -1],
]);

/**
 * Clamps a number into a range.
 * @param {number} v
 * @param {number} lo
 * @param {number} hi
 * @returns {number}
 */
export function clamp(v, lo, hi) {
	return Math.max(lo, Math.min(hi, v));
}

/**
 * Whether each plot of a footprint is impassable, read from its plots mask; false off the mat.
 * @param {Footprint} fp
 * @returns {(row: number, col: number) => boolean}
 */
export function blockedOf(fp) {
	return (r, c) =>
		r >= 0 &&
		c >= 0 &&
		r < fp.rows &&
		c < fp.cols &&
		fp.plots[(r * PITCH + 16) * fp.w + c * PITCH + 16] === 1;
}

/**
 * Whether every pixel of a shape lies inside an area.
 * @param {readonly (readonly number[])[]} rows - The shape, each row as [y, left, right]
 * @param {Uint8Array} area
 * @param {number} w
 * @param {number} h
 * @returns {boolean}
 */
export function fitsIn(rows, area, w, h) {
	for (const [x, y] of rowPixels(rows)) {
		if (x < 0 || y < 0 || x >= w || y >= h || !area[y * w + x]) {
			return false;
		}
	}
	return true;
}

/**
 * Base spots every other pixel, from the front row back, each row shuffled, so the biggest pieces stand in front.
 * @param {number} w
 * @param {number} h
 * @param {() => number} rand
 * @returns {number[][]} Each spot as [x, y]
 */
export function frontToBack(w, h, rand) {
	/** @type {number[][]} */
	const spots = [];
	for (let by = h - 1; by >= 4; by -= 2) {
		/** @type {number[][]} */
		const row = [];
		for (let bx = 0; bx < w; bx += 2) {
			row.push([bx, by]);
		}
		for (let i = row.length - 1; i > 0; i--) {
			const j = Math.floor(rand() * (i + 1));
			[row[i], row[j]] = [row[j], row[i]];
		}
		spots.push(...row);
	}
	return spots;
}
