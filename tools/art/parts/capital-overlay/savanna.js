// The Savanna's printed herds and districts over its relief: a unicorn on each herd's plot and a brass border round each district (#133).
import { PALETTE as C } from '../../palette.js';
import { createCanvas, rect } from '../../painter.js';
import { PITCH, PLOT } from '../../../../src/lib/art/relief.js';
import { unicorn } from '../capital-biomes/savanna.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../capital-relief/index.js').MatData} MatData */

/**
 * Paints a unicorn on each herd's plot, standing in the clearing its relief leaves, then a one-pixel brass line on
 * each edge of a district plot that another district, or the grey ground, lies beyond.
 * @param {Canvas} canvas - Empty, the mat's relief size
 * @param {readonly string[]} _layout
 * @param {MatData} mat - The mat's herds and districts
 */
export function paintSavannaOverlay(canvas, _layout, mat) {
	for (const [r, c] of mat.herds ?? []) {
		const herd = createCanvas(PLOT, PLOT);
		unicorn(herd);
		herd.p.forEach((colour, i) => {
			if (colour) {
				const x = c * PITCH + (i % PLOT);
				const y = r * PITCH + ((i / PLOT) | 0);
				canvas.p[y * canvas.w + x] = colour;
			}
		});
	}
	const districts = mat.districts ?? [];
	for (let r = 0; r < districts.length; r++) {
		for (let c = 0; c < districts[r].length; c++) {
			const d = districts[r][c];
			if (d === '.') {
				continue;
			}
			const x = c * PITCH;
			const y = r * PITCH;
			if (districts[r][c + 1] !== d) {
				rect(canvas, x + PLOT - 1, y, 1, PLOT, C.brass);
			}
			if (districts[r][c - 1] !== d) {
				rect(canvas, x, y, 1, PLOT, C.brass);
			}
			if (districts[r + 1]?.[c] !== d) {
				rect(canvas, x, y + PLOT - 1, PLOT, 1, C.brass);
			}
			if (districts[r - 1]?.[c] !== d) {
				rect(canvas, x, y, PLOT, 1, C.brass);
			}
		}
	}
}
