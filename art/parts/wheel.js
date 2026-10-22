// Scene part: a spoked wheel, for carts, wagons, gun carriages, locomotives and big wheels.
import { set, line } from '../painter.js';
import { PALETTE } from '../palette.js';

/** @typedef {import('../painter.js').Canvas} Canvas */
/** @typedef {import('../painter.js').Colour} Colour */
/** @typedef {import('../painter.js').Box} Box */

/**
 * Options for drawWheel.
 * @typedef {Object} WheelOptions
 * @property {number} x - The hub's column
 * @property {number} y - The hub's row
 * @property {number} r - The radius to the outside of the tyre, at least 2
 * @property {number} [spokes=8] - How many spokes, evenly spaced from the hub
 * @property {Colour} [tyre] - The tyre's colour; dark wood by default
 * @property {Colour} [spoke] - The spokes' colour; timber by default
 * @property {Colour} [hub] - The hub's colour; brass by default
 */

/**
 * Draws a wheel around its hub. The tyre is two pixels thick from a radius of 5 up.
 * The outline pass inks the gaps between spokes, so a small wheel (radius under about 8) reads better drawn after it.
 * @param {Canvas} canvas - The foreground, so the scene's outline pass outlines it
 * @param {WheelOptions} options
 * @returns {Box} The box that holds every pixel drawn.
 * @throws {Error} For a radius below 2.
 */
export function drawWheel(
	canvas,
	{
		x,
		y,
		r,
		spokes = 8,
		tyre = PALETTE.wood,
		spoke = PALETTE.timber,
		hub = PALETTE.brass,
	}
) {
	if (!(r >= 2)) {
		throw new Error(`drawWheel: radius must be at least 2, not ${r}`);
	}
	const thickness = r >= 5 ? 1.5 : 0.5;
	for (let i = 0; i < spokes; i++) {
		const angle = (i / spokes) * Math.PI * 2;
		line(
			canvas,
			x,
			y,
			x + Math.round(Math.cos(angle) * (r - thickness)),
			y + Math.round(Math.sin(angle) * (r - thickness)),
			spoke
		);
	}
	for (let dy = -r; dy <= r; dy++) {
		for (let dx = -r; dx <= r; dx++) {
			const distance = Math.hypot(dx, dy);
			if (distance <= r + 0.5 && distance > r - thickness) {
				set(canvas, x + dx, y + dy, tyre);
			}
		}
	}
	set(canvas, x, y, hub);
	if (r >= 4) {
		for (const [dx, dy] of [
			[1, 0],
			[-1, 0],
			[0, 1],
			[0, -1],
		]) {
			set(canvas, x + dx, y + dy, hub);
		}
	}
	return { x: x - r, y: y - r, w: r * 2 + 1, h: r * 2 + 1 };
}
