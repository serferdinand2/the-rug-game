// The bottle's glass over City in a Bottle: a teal rim round the mat, a long reflection down its left and glints at its bottom right (#133).
import { PALETTE as C } from '../../palette.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */

/**
 * Paints one pixel of glass at an opacity, so it tints whatever lies under it.
 * @param {Canvas} canvas
 * @param {number} x
 * @param {number} y
 * @param {string} colour
 * @param {number} alpha
 */
function glass(canvas, x, y, colour, alpha) {
	const i = y * canvas.w + x;
	if (!canvas.alpha) {
		canvas.alpha = new Array(canvas.w * canvas.h).fill(1);
	}
	canvas.p[i] = colour;
	canvas.alpha[i] = alpha;
}

/**
 * Paints the bottle's glass in the outer 4 pixels of the mat, as its example mat drew it, so every plot stays readable.
 * @param {Canvas} canvas - Empty, the mat's relief size
 */
export function paintBottleGlass(canvas) {
	const { w, h } = canvas;
	for (let i = 0; i < w; i++) {
		glass(canvas, i, 1, C.bottleGlass, 0.25);
		glass(canvas, i, h - 2, C.bottleGlass, 0.25);
		glass(canvas, i, 0, C.bottleGlassDeep, 0.55);
		glass(canvas, i, h - 1, C.bottleGlassDeep, 0.55);
	}
	for (let j = 0; j < h; j++) {
		glass(canvas, 1, j, C.bottleGlass, 0.25);
		glass(canvas, w - 2, j, C.bottleGlass, 0.25);
		glass(canvas, 0, j, C.bottleGlassDeep, 0.55);
		glass(canvas, w - 1, j, C.bottleGlassDeep, 0.55);
	}
	for (let j = 14; j < 74; j++) {
		if (j % 11 < 8) {
			glass(canvas, 2, j, C.white, 0.55);
			glass(canvas, 3, j, C.white, 0.25);
		}
	}
	for (let i = 8; i < 30; i++) {
		glass(canvas, i, 2, C.white, 0.4);
	}
	for (let i = 0; i < 5; i++) {
		glass(canvas, w - 3, h - 14 - i, C.white, 0.45);
		glass(canvas, w - 4 - i, h - 3, C.white, 0.45);
	}
}
