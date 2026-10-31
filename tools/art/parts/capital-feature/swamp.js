// The Swamp's printed lily pads: a pond with a muddy rim and three lily pads on each 'L' plot (#132).
import { PALETTE as C } from '../../palette.js';
import { PITCH } from '../../../../src/lib/art/relief.js';
import { put } from '../../../../src/lib/art/paint/relief/canvas.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */

/**
 * Fills an ellipse.
 * @param {Canvas} canvas
 * @param {Uint8Array} ok
 * @param {number} cx
 * @param {number} cy
 * @param {number} rx
 * @param {number} ry
 * @param {string} col
 */
function ellipse(canvas, ok, cx, cy, rx, ry, col) {
	for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
		for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
			if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) {
				put(canvas, ok, x, y, col);
			}
		}
	}
}

/**
 * Draws a lily pad: its dark underside, its leaf lit on the upper left, the notch cut to its rim, and a flower if it has one.
 * @param {Canvas} canvas
 * @param {Uint8Array} ok
 * @param {number} px
 * @param {number} py
 * @param {number} rx
 * @param {number} ry
 * @param {boolean} flower
 */
function drawPad(canvas, ok, px, py, rx, ry, flower) {
	ellipse(canvas, ok, px, py + 1, rx + 0.6, ry + 0.6, C.swampWaterDeep);
	ellipse(canvas, ok, px, py, rx, ry, C.lilyPadShade);
	ellipse(canvas, ok, px - 0.5, py - 0.5, rx - 1, ry - 1, C.lilyPad);
	for (let k = 0; k <= rx; k++) {
		put(canvas, ok, px + k, py - (k > rx / 2 ? 1 : 0), C.swampWater);
	}
	if (flower) {
		put(canvas, ok, px - 1, py - 1, C.lilyFlower);
		put(canvas, ok, px, py - 2, C.lilyFlower);
		put(canvas, ok, px + 1, py - 1, C.lilyFlower);
		put(canvas, ok, px, py - 1, C.creamLight);
	}
}

/**
 * Draws a pond on a plot: a muddy rim, a peaty far bank seen from the front, dark water and three lily pads.
 * @param {Canvas} canvas
 * @param {Uint8Array} ok
 * @param {number} ox - The plot's left pixel
 * @param {number} oy - The plot's top pixel
 */
export function drawLilyPond(canvas, ok, ox, oy) {
	const cx = ox + 16;
	const cy = oy + 17;
	ellipse(canvas, ok, cx, cy, 13.5, 9.5, C.swampMudShade);
	ellipse(canvas, ok, cx, cy, 12.5, 8.5, C.swampWater);
	ellipse(canvas, ok, cx + 0.5, cy + 1, 10, 6, C.swampWaterDeep);
	// The far bank's face: the water's top row.
	for (let x = cx - 12; x <= cx + 12; x++) {
		for (let y = cy - 9; y <= cy; y++) {
			const inWater = ((x - cx) / 12.5) ** 2 + ((y - cy) / 8.5) ** 2 <= 1;
			const above =
				((x - cx) / 12.5) ** 2 + ((y - 1 - cy) / 8.5) ** 2 <= 1;
			if (inWater && !above) {
				put(canvas, ok, x, y, C.quagPeat);
			}
		}
	}
	drawPad(canvas, ok, cx - 5, cy - 1, 4, 3, false);
	drawPad(canvas, ok, cx + 5, cy - 3, 3.5, 2.5, true);
	drawPad(canvas, ok, cx + 3, cy + 4, 4, 2.5, false);
	put(canvas, ok, cx - 9, cy + 2, C.swampWaterLight);
	put(canvas, ok, cx - 8, cy + 2, C.swampWaterLight);
}

/**
 * Lays a lily pond on each of a mat's 'L' plots.
 * @param {Canvas} canvas - Empty, the mat's relief size
 * @param {readonly string[]} layout
 */
export function paintSwampFeatures(canvas, layout) {
	const ok = new Uint8Array(canvas.w * canvas.h).fill(1);
	layout.forEach((row, r) => {
		[...row].forEach((mark, c) => {
			if (mark === 'L') {
				drawLilyPond(canvas, ok, c * PITCH, r * PITCH);
			}
		});
	});
}
