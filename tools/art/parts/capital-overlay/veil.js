// The Veil's printed line between its worldly and charmed sides, with its sparkles, and the mat's three pocket icons (#133).
import { PALETTE as C } from '../../palette.js';
import { set } from '../../painter.js';
import { PITCH } from '../../../../src/lib/art/relief.js';
import { drawIcon, sparkle } from '../capital-biomes/veil.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../capital-relief/index.js').MatData} MatData */

/**
 * Paints one stretch of the veil across a gap between two plots: a pale shimmering core three pixels wide between
 * two edge lines, their colours swapping every three pixels, and a little past each end so its bends close up.
 * @param {Canvas} canvas
 * @param {number} at - The gap's column, for an upright stretch, or its row
 * @param {number} from - Where the stretch starts along the gap
 * @param {boolean} upright
 */
function stretch(canvas, at, from, upright) {
	for (let t = from - 2; t <= from + PITCH + 1; t++) {
		const pale = t % 6 < 3 ? C.ghostLight : C.arcaneLight;
		const edge = t % 6 < 3 ? C.arcane : C.ghost;
		for (let d = -2; d <= 2; d++) {
			const colour = Math.abs(d) === 2 ? edge : pale;
			if (upright) {
				set(canvas, at + d, t, colour);
			} else {
				set(canvas, t, at + d, colour);
			}
		}
	}
}

/**
 * Paints the veil along every edge between a worldly and a charmed plot, a sparkle on every third stretch, and the
 * pocket icons over it all.
 * @param {Canvas} canvas - Empty, the mat's relief size
 * @param {readonly string[]} _layout
 * @param {MatData} mat - The mat's sides and pocket icons
 */
export function paintVeilOverlay(canvas, _layout, mat) {
	const sides = mat.sides ?? [];
	/** @type {number[][]} */
	const sparkles = [];
	for (let r = 0; r < sides.length; r++) {
		for (let c = 0; c < sides[r].length; c++) {
			const side = sides[r][c];
			const right = sides[r][c + 1];
			const below = sides[r + 1]?.[c];
			const gapX = c * PITCH + PITCH - 1;
			const gapY = r * PITCH + PITCH - 1;
			if (right !== undefined && right !== side) {
				stretch(canvas, gapX, r * PITCH, true);
				if ((r + c) % 3 === 0) {
					sparkles.push([gapX, r * PITCH + 16]);
				}
			}
			if (below !== undefined && below !== side) {
				stretch(canvas, gapY, c * PITCH, false);
				if ((r + c) % 3 === 0) {
					sparkles.push([c * PITCH + 16, gapY]);
				}
			}
		}
	}
	for (const [x, y] of sparkles) {
		sparkle(canvas, x, y, C.white, C.arcaneLight);
	}
	for (const { kind, x, y } of mat.pockets ?? []) {
		drawIcon(canvas, kind, x, y);
	}
}
