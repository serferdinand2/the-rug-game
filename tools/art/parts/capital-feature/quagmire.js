// The Quagmire's printed reeds: a bed of reeds and cattails on each open plot beside a will-o'-the-wisp (#133).
import { createCanvas, seededRandom } from '../../painter.js';
import { hash } from '../../../../src/lib/art/paint/relief/ground.js';
import { PITCH, PLOT } from '../../../../src/lib/art/relief.js';
import { reed } from '../capital-biomes/quagmire.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../capital-relief/index.js').MatData} MatData */

/**
 * Paints a bed of nine reeds, a third of them with a cattail head, on each of the mat's reed plots. Each bed is
 * drawn on a plot of its own, so it never reaches past its plot.
 * @param {Canvas} canvas - Empty, the mat's relief size
 * @param {readonly string[]} _layout - The mat's layout; the reed plots come with its printed data
 * @param {MatData} mat - The mat's reed plots
 */
export function paintQuagmireFeatures(canvas, _layout, mat) {
	for (const [r, c] of mat.reeds ?? []) {
		const bed = createCanvas(PLOT, PLOT);
		const rand = seededRandom(hash(r, c, 61));
		for (let i = 0; i < 9; i++) {
			reed(
				bed,
				4 + Math.floor(rand() * 22),
				20 + Math.floor(rand() * 10),
				7 + Math.floor(rand() * 6),
				i % 3 === 0,
				Math.floor(rand() * 5) - 2
			);
		}
		bed.p.forEach((colour, i) => {
			if (colour) {
				const x = c * PITCH + (i % PLOT);
				const y = r * PITCH + ((i / PLOT) | 0);
				canvas.p[y * canvas.w + x] = colour;
			}
		});
	}
}
