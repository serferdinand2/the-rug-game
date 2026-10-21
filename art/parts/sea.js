// Scene part: the sea from its horizon line to the bottom of the scene, with waves.
import { set, rect } from '../painter.js';
import { PALETTE } from '../palette.js';

/** @typedef {import('../painter.js').Canvas} Canvas */

/**
 * Options for drawSea.
 * @typedef {Object} SeaOptions
 * @property {'night' | 'day'} time - Time of day
 * @property {number} top - The bright horizon line; rows top to the bottom are filled
 * @property {() => number} random - The scene's seeded random stream
 * @property {number} [waves=60] - How many wave strokes
 */

/**
 * Draws the sea from its top row to the bottom of the canvas.
 * @param {Canvas} canvas - The background layer
 * @param {SeaOptions} options
 * @throws {Error} For an unknown time of day.
 */
export function drawSea(canvas, options) {
	if (options.time === 'night') {
		drawNightSea(canvas, options);
		return;
	}
	throw new Error(`drawSea: unknown time "${options.time}"`);
}

/**
 * The approved prototype's night sea. The order of random() calls is part of the
 * picture: each wave takes its row, then its column, then its length.
 * @param {Canvas} canvas
 * @param {SeaOptions} options
 */
function drawNightSea(canvas, { top, random, waves = 60 }) {
	for (let y = top; y < canvas.h; y++) {
		const colour =
			y === top
				? PALETTE.nightSeaLine
				: y < top + 6
					? PALETTE.nightSea1
					: y < top + 14
						? PALETTE.nightSea2
						: PALETTE.nightSea3;
		for (let x = 0; x < canvas.w; x++) {
			set(canvas, x, y, colour);
		}
	}
	for (let i = 0; i < waves; i++) {
		const y = top + 1 + Math.floor(random() * (canvas.h - top - 1));
		const x = Math.floor(random() * (canvas.w - 4));
		const n = 2 + Math.floor(random() * 4);
		rect(
			canvas,
			x,
			y,
			n,
			1,
			y < top + 8 ? PALETTE.nightWave : PALETTE.nightWaveDeep
		);
	}
}
