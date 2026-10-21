// Scene part: a distant city skyline across the scene, with windows lit by time of day.
import { rect, set } from '../painter.js';
import { PALETTE } from '../palette.js';

/** @typedef {import('../painter.js').Canvas} Canvas */

/**
 * Options for drawSkyline.
 * @typedef {Object} SkylineOptions
 * @property {number} base - The row the buildings stand on; the skyline fills it edge to edge
 * @property {'night' | 'dusk' | 'day'} time - Time of day, which sets the colours and lit windows
 * @property {() => number} random - The scene's seeded random stream
 * @property {number} [height=24] - The tallest a building may be, in rows up to and including the base
 */

/** @type {Record<string, { body: string, edge: string, window: string, glow: string, lit: number }>} */
const TIMES = {
	night: {
		body: PALETTE.roofShade,
		edge: PALETTE.roof,
		window: PALETTE.gold,
		glow: PALETTE.lampGlow,
		lit: 0.35,
	},
	dusk: {
		body: PALETTE.roof,
		edge: PALETTE.roofLight,
		window: PALETTE.gold,
		glow: PALETTE.amber,
		lit: 0.2,
	},
	day: {
		body: PALETTE.stoneMid,
		edge: PALETTE.stoneLight,
		window: PALETTE.stoneShade,
		glow: PALETTE.daySky5,
		lit: 0.5,
	},
};

/**
 * Draws a row of distant buildings of random widths and heights across the whole canvas.
 * Draw it on the background layer, behind the subject.
 * @param {Canvas} canvas
 * @param {SkylineOptions} options
 * @throws {Error} For an unknown time of day.
 */
export function drawSkyline(canvas, { base, time, random, height = 24 }) {
	const colours = Object.hasOwn(TIMES, time) ? TIMES[time] : undefined;
	if (!colours) {
		throw new Error(`drawSkyline: unknown time "${time}"`);
	}
	for (let x = 0; x < canvas.w;) {
		const w = 4 + Math.floor(random() * 7);
		const h = Math.min(
			height,
			6 + Math.floor(random() * Math.max(1, height - 5))
		);
		const top = base - h + 1;
		rect(canvas, x, top, w, h, colours.body);
		rect(canvas, x, top, 1, h, colours.edge);
		for (let row = top + 2; row < base - 1; row += 3) {
			for (let cx = x + 2; cx < x + w - 1; cx += 2) {
				const roll = random();
				if (roll < colours.lit) {
					set(
						canvas,
						cx,
						row,
						roll < colours.lit / 3 ? colours.glow : colours.window
					);
				}
			}
		}
		x += w;
	}
}
