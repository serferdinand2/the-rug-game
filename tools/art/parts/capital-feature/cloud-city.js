// Cloud City's printed rims: a scalloped edge along every border between two clouds, in each cloud's own tint (#132).
import { PITCH, PLOT } from '../../../../src/lib/art/relief.js';
import { put } from '../../../../src/lib/art/paint/relief/canvas.js';
import { cloudRamp } from '../capital-relief/cloud-city.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../capital-relief/index.js').MatData} MatData */

/**
 * Draws a scalloped rim on both sides of every plot edge where two different clouds meet: a dark rim with a
 * lit edge on the near side, and the far cloud's rim on the other. It keeps within 3 pixels of the edge.
 * @param {Canvas} canvas - Empty, the mat's relief size
 * @param {readonly string[]} _layout
 * @param {MatData} mat - The clouds and their tints
 */
export function paintCloudCityFeatures(canvas, _layout, mat) {
	const { clouds, tints } = mat;
	if (!clouds || !tints) {
		return;
	}
	const ok = new Uint8Array(canvas.w * canvas.h).fill(1);
	const rows = clouds.length;
	const cols = clouds[0].length;
	const ramp = (/** @type {string} */ cloud) =>
		cloudRamp(tints[Number(cloud)]);
	for (let r = 0; r < rows; r++) {
		for (let c = 0; c < cols; c++) {
			const here = ramp(clouds[r][c]);
			if (c + 1 < cols && clouds[r][c + 1] !== clouds[r][c]) {
				const e = c * PITCH + PLOT - 1;
				const there = ramp(clouds[r][c + 1]);
				for (let k = 0; k < PLOT; k++) {
					const d = Math.round(
						1.2 * Math.sin((r * PITCH + k) * 0.55)
					);
					const y = r * PITCH + k;
					put(canvas, ok, e - 1 + Math.min(0, d), y, here[4]);
					put(canvas, ok, e - 2 + Math.min(0, d), y, here[1]);
					put(canvas, ok, e + 2 + Math.max(0, d), y, there[4]);
				}
			}
			if (r + 1 < rows && clouds[r + 1][c] !== clouds[r][c]) {
				const e = r * PITCH + PLOT - 1;
				const there = ramp(clouds[r + 1][c]);
				for (let k = 0; k < PLOT; k++) {
					const d = Math.round(
						1.2 * Math.sin((c * PITCH + k) * 0.55)
					);
					const x = c * PITCH + k;
					put(canvas, ok, x, e - 1 + Math.min(0, d), here[4]);
					put(canvas, ok, x, e - 2 + Math.min(0, d), here[1]);
					put(canvas, ok, x, e + 2 + Math.max(0, d), there[4]);
				}
			}
		}
	}
}
