// The Archipelago's printed beaches: a strip of sand on every island side, and round every island corner, that faces water (#132).
import { PALETTE as C } from '../../palette.js';
import { PITCH, PLOT } from '../../../../src/lib/art/relief.js';
import { put } from '../../../../src/lib/art/paint/relief/canvas.js';
import { isImpassable } from '../../../../src/lib/art/paint/relief/footprint.js';
import { noise } from '../../../../src/lib/art/paint/relief/ground.js';
import { dither } from '../capital-relief/rock.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../capital-relief/index.js').MatData} MatData */

/** Each corner of a plot: the diagonal neighbour's row and column steps, and the corner pixel. */
const CORNERS = [
	[-1, -1, 0, 0],
	[-1, 1, PLOT - 1, 0],
	[1, -1, 0, PLOT - 1],
	[1, 1, PLOT - 1, PLOT - 1],
];

/**
 * Lays a beach on each island plot of a mat, along every side that faces a water plot and round each corner
 * whose diagonal plot is water while its two side plots are land. A volcano is land, not water.
 * The beach is about 3.5 pixels wide, its inner edge wobbling, with wet sand along the water.
 * @param {Canvas} canvas - Empty, the mat's relief size
 * @param {readonly string[]} layout
 * @param {MatData} mat - The volcano plots
 */
export function paintArchipelagoFeatures(canvas, layout, mat) {
	const volcanoes = mat.volcanoes ?? [];
	const rows = layout.length;
	const cols = layout[0].length;
	const ok = new Uint8Array(canvas.w * canvas.h).fill(1);
	const water = (/** @type {number} */ r, /** @type {number} */ c) =>
		r >= 0 &&
		c >= 0 &&
		r < rows &&
		c < cols &&
		isImpassable(layout, r, c) &&
		!volcanoes.some(([vr, vc]) => vr === r && vc === c);
	const edge = noise(911, 3);
	for (let r = 0; r < rows; r++) {
		for (let c = 0; c < cols; c++) {
			if (isImpassable(layout, r, c)) {
				continue;
			}
			const ox = c * PITCH;
			const oy = r * PITCH;
			for (let y = 0; y < PLOT; y++) {
				for (let x = 0; x < PLOT; x++) {
					let d = Infinity;
					if (water(r - 1, c)) {
						d = Math.min(d, y);
					}
					if (water(r + 1, c)) {
						d = Math.min(d, PLOT - 1 - y);
					}
					if (water(r, c - 1)) {
						d = Math.min(d, x);
					}
					if (water(r, c + 1)) {
						d = Math.min(d, PLOT - 1 - x);
					}
					for (const [dr, dc, cx, cy] of CORNERS) {
						if (
							water(r + dr, c + dc) &&
							!water(r + dr, c) &&
							!water(r, c + dc)
						) {
							d = Math.min(d, Math.hypot(x - cx, y - cy) - 1);
						}
					}
					const lim = 3.5 + (edge(ox + x, oy + y) - 0.5) * 2.5;
					if (d > lim) {
						continue;
					}
					const shade = dither(ox + x, oy + y);
					put(
						canvas,
						ok,
						ox + x,
						oy + y,
						d < 1
							? C.sandShade
							: d > lim - 1 && shade > 0
								? C.grassShade
								: shade > 0.25
									? C.sandLight
									: C.sand
					);
				}
			}
		}
	}
}
