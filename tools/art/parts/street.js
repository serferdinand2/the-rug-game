// Scene part: a cobbled town street with a kerb, from its top row to the bottom of the scene.
import { set } from '../painter.js';
import { PALETTE } from '../palette.js';

/** @typedef {import('../painter.js').Canvas} Canvas */

/**
 * Options for drawStreet.
 * @typedef {Object} StreetOptions
 * @property {number} top - The kerb's row; rows top to the bottom are filled
 */

/**
 * Draws a kerb and cobbles in staggered courses, darker towards the viewer.
 * Draw it on the background layer.
 * @param {Canvas} canvas
 * @param {StreetOptions} options
 */
export function drawStreet(canvas, { top }) {
	for (let y = top; y < canvas.h; y++) {
		const course = Math.floor((y - top - 2) / 3);
		for (let x = 0; x < canvas.w; x++) {
			let colour;
			if (y === top) {
				colour = PALETTE.stoneLight;
			} else if (y === top + 1) {
				colour = PALETTE.stoneShade;
			} else if (
				(y - top - 2) % 3 === 2 ||
				(x + (course % 2) * 2) % 4 === 0
			) {
				colour = PALETTE.stoneShade;
			} else {
				colour =
					y - top > (canvas.h - top) / 2
						? PALETTE.stoneMid
						: PALETTE.stone;
			}
			set(canvas, x, y, colour);
		}
	}
}
