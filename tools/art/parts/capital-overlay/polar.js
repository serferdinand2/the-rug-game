// Polar's printed field lines and rings over its relief: each district's dashed teal line, running through the ice, and a ring on each ringed plot (#133).
import { PITCH, PLOT } from '../../../../src/lib/art/relief.js';
import { dashed, ring } from '../capital-biomes/polar.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../capital-relief/index.js').MatData} MatData */

/**
 * A plot's middle pixel along one axis.
 * @param {number} n - Its row or column
 */
const middle = (n) => n * PITCH + PLOT / 2;

/**
 * Paints each field line as dashes from plot to plot, left clear round each ring, then the ring on each plot that
 * the layout marks with its line's letter, as the example mat drew them.
 * @param {Canvas} canvas - Empty, the mat's relief size
 * @param {readonly string[]} layout - Its letters A–F mark the ringed plots
 * @param {MatData} mat - The mat's field lines
 */
export function paintPolarOverlay(canvas, layout, mat) {
	const ringed = (/** @type {number} */ r, /** @type {number} */ c) =>
		/[A-F]/.test(layout[r][c]);
	for (const plots of Object.values(mat.lines ?? {})) {
		for (let i = 1; i < plots.length; i++) {
			const [r0, c0] = plots[i - 1];
			const [r1, c1] = plots[i];
			dashed(
				canvas,
				middle(c0),
				middle(r0),
				middle(c1),
				middle(r1),
				ringed(r0, c0) ? 10 : 0,
				ringed(r1, c1) ? 10 : 0
			);
		}
	}
	layout.forEach((row, r) => {
		[...row].forEach((_, c) => {
			if (mat.lines && ringed(r, c)) {
				ring(canvas, middle(c), middle(r));
			}
		});
	});
}
