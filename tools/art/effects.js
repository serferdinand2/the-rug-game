// Effects: light passes over an already painted canvas. They blend colours with mix(), so they live
// outside art/parts/, whose parts paint only palette colours.
import { mix } from './painter.js';

/** @typedef {import('./painter.js').Canvas} Canvas */
/** @typedef {import('./painter.js').Colour} Colour */

/**
 * Options for glow.
 * @typedef {Object} GlowOptions
 * @property {number} x - The light's column
 * @property {number} y - The light's row
 * @property {number} radius - How far the glow reaches, in pixels
 * @property {Colour} colour - The light's colour
 * @property {number} [strength=0.5] - How far the brightest band moves towards the light's colour, from 0 to 1
 * @property {number} [steps=3] - How many bands the glow fades in; each band adds one colour per colour it covers
 * @property {readonly Colour[]} [skip] - Colours left untouched, such as the lamp itself or the subject
 */

/**
 * Brightens the painted pixels around a light in round bands, strongest at the centre. Empty pixels stay empty.
 * The bands keep the number of new colours low, so the SVG stays small.
 * @param {Canvas} canvas
 * @param {GlowOptions} options
 * @throws {Error} For a radius or a number of steps below 1.
 */
export function glow(
	canvas,
	{ x, y, radius, colour, strength = 0.5, steps = 3, skip = [] }
) {
	if (!(radius >= 1)) {
		throw new Error(`glow: radius must be at least 1, not ${radius}`);
	}
	if (!Number.isInteger(steps) || steps < 1) {
		throw new Error(
			`glow: steps must be a whole number of at least 1, not ${steps}`
		);
	}
	const reach = Math.ceil(radius);
	for (let py = y - reach; py <= y + reach; py++) {
		for (let px = x - reach; px <= x + reach; px++) {
			if (px < 0 || py < 0 || px >= canvas.w || py >= canvas.h) {
				continue;
			}
			const distance = Math.hypot(px - x, py - y);
			const behind = canvas.p[py * canvas.w + px];
			if (distance >= radius || !behind || skip.includes(behind)) {
				continue;
			}
			const band = Math.ceil((1 - distance / radius) * steps);
			canvas.p[py * canvas.w + px] = mix(
				behind,
				colour,
				(strength * band) / steps
			);
		}
	}
}
