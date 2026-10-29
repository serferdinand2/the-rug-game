// Painting helpers for the joined-terrain relief: opaque pixels limited to an area, and translucent shadows.
import { PALETTE } from '../../palette.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */

/**
 * Paints one opaque pixel, only where `allowed` is set and the pixel is on the canvas.
 * @param {Canvas} canvas
 * @param {Uint8Array} allowed - One byte per pixel
 * @param {number} x
 * @param {number} y
 * @param {string} colour
 */
export function put(canvas, allowed, x, y, colour) {
	if (x < 0 || y < 0 || x >= canvas.w || y >= canvas.h) {
		return;
	}
	const i = y * canvas.w + x;
	if (!allowed[i]) {
		return;
	}
	canvas.p[i] = colour;
	if (canvas.alpha) {
		canvas.alpha[i] = 1;
	}
}

/**
 * Paints a shadow pixel (ink at the given opacity) on an empty pixel. The first shadow gives the
 * canvas an alpha layer filled with 1.
 * @param {Canvas} canvas
 * @param {number} x
 * @param {number} y
 * @param {number} alpha
 */
export function shadow(canvas, x, y, alpha) {
	if (x < 0 || y < 0 || x >= canvas.w || y >= canvas.h) {
		return;
	}
	const i = y * canvas.w + x;
	if (canvas.p[i] !== null) {
		return;
	}
	if (!canvas.alpha) {
		canvas.alpha = new Array(canvas.w * canvas.h).fill(1);
	}
	canvas.p[i] = PALETTE.ink;
	canvas.alpha[i] = alpha;
}

/**
 * Casts a shadow on one pixel: translucent ink on an empty pixel, or the next tone down on an opaque one.
 * A painted tone missing from `darker`, and a shadow already cast, stay as they are.
 * @param {Canvas} canvas
 * @param {number} x
 * @param {number} y
 * @param {number} alpha - The ink's opacity on an empty pixel
 * @param {Readonly<Record<string, string>>} darker - Each painted tone's next tone down
 */
export function cast(canvas, x, y, alpha, darker) {
	if (x < 0 || y < 0 || x >= canvas.w || y >= canvas.h) {
		return;
	}
	const i = y * canvas.w + x;
	const under = canvas.p[i];
	if (under === null) {
		shadow(canvas, x, y, alpha);
	} else if (!canvas.alpha || canvas.alpha[i] === 1) {
		const next = darker[under];
		if (next) {
			canvas.p[i] = next;
		}
	}
}
