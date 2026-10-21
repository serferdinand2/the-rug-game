// Scene part: the sea from its horizon line to the bottom of the scene, with waves.
import { set, rect } from '../painter.js';
import { PALETTE } from '../palette.js';

/** @typedef {import('../painter.js').Canvas} Canvas */
/** @typedef {import('../painter.js').Colour} Colour */

/**
 * Options for drawSea.
 * @typedef {Object} SeaOptions
 * @property {'night' | 'day'} time - Time of day
 * @property {number} top - The bright horizon line; rows top to the bottom are filled
 * @property {() => number} random - The scene's seeded random stream
 * @property {number} [waves=60] - How many wave strokes
 */

/**
 * The sea's colours at one time of day.
 * @typedef {Object} SeaColours
 * @property {Colour} line - The horizon line
 * @property {[Colour, Colour, Colour]} bands - Near the horizon, middle, nearest the viewer
 * @property {Colour} wave - Waves near the horizon
 * @property {Colour} waveDeep - Waves further down
 */

/** @type {Record<string, SeaColours>} */
const SEAS = {
	night: {
		line: PALETTE.nightSeaLine,
		bands: [PALETTE.nightSea1, PALETTE.nightSea2, PALETTE.nightSea3],
		wave: PALETTE.nightWave,
		waveDeep: PALETTE.nightWaveDeep,
	},
	day: {
		line: PALETTE.daySeaLine,
		bands: [PALETTE.daySea1, PALETTE.daySea2, PALETTE.daySea3],
		wave: PALETTE.dayWave,
		waveDeep: PALETTE.dayWaveDeep,
	},
};

/**
 * Draws the sea from its top row to the bottom of the canvas. This is the approved
 * prototype's sea; the order of random() calls is part of the picture: each wave
 * takes its row, then its column, then its length.
 * @param {Canvas} canvas - The background layer
 * @param {SeaOptions} options
 * @throws {Error} For an unknown time of day.
 */
export function drawSea(canvas, { time, top, random, waves = 60 }) {
	const colours = SEAS[time];
	if (!colours) {
		throw new Error(`drawSea: unknown time "${time}"`);
	}
	const [near, middle, far] = colours.bands;
	for (let y = top; y < canvas.h; y++) {
		const colour =
			y === top
				? colours.line
				: y < top + 6
					? near
					: y < top + 14
						? middle
						: far;
		for (let x = 0; x < canvas.w; x++) {
			set(canvas, x, y, colour);
		}
	}
	for (let i = 0; i < waves; i++) {
		const y = top + 1 + Math.floor(random() * (canvas.h - top - 1));
		const x = Math.floor(random() * (canvas.w - 4));
		const n = 2 + Math.floor(random() * 4);
		rect(canvas, x, y, n, 1, y < top + 8 ? colours.wave : colours.waveDeep);
	}
}
