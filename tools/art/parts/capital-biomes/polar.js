// The Polar advanced mat's printed layout and field lines, and the sprites of its lines and rings (#6). Its ground tiles,
// relief and overlay draw it (#133).
import { rect, set } from '../../painter.js';
import { PALETTE as C } from '../../palette.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */

/**
 * The mat's printed layout, one string per row, top first. '.' is an open plot that lies on no field line,
 * 'X' an impassable plot, and 'A' to 'F' an open plot ringed on that field line (the six districts, 03-expansions FF.6 §2.3).
 * Every impassable plot is an 'X', including those the lines cross.
 * @type {readonly string[]}
 */
export const LAYOUT = [
	'.A.XB.X..',
	'..A.XX.CC',
	'D..X.BXXX',
	'.D.XA.BBX',
	'..X.XXXX.',
	'XX.DXXAAA',
	'.EEE.X...',
	'F...X.DD.',
	'.F.X.E..D',
];

/**
 * Each field line's plots in order along the line, ringed or impassable (the impassable ones count as filled).
 * @type {Readonly<Record<string, readonly (readonly [number, number])[]>>}
 */
export const LINES = {
	A: [
		[0, 1],
		[1, 2],
		[2, 3],
		[3, 4],
		[4, 5],
		[5, 6],
		[5, 7],
		[5, 8],
	],
	B: [
		[0, 4],
		[1, 4],
		[2, 5],
		[3, 6],
		[3, 7],
		[3, 8],
	],
	C: [
		[0, 6],
		[1, 7],
		[1, 8],
	],
	D: [
		[2, 0],
		[3, 1],
		[4, 2],
		[5, 3],
		[5, 4],
		[6, 5],
		[7, 6],
		[7, 7],
		[8, 8],
	],
	E: [
		[5, 0],
		[6, 1],
		[6, 2],
		[6, 3],
		[7, 4],
		[8, 5],
	],
	F: [
		[7, 0],
		[8, 1],
	],
};

/**
 * A dashed teal line between two plot centres, two pixels thick, that stops at the rim of a ring.
 * @param {Canvas} mat
 * @param {number} x0
 * @param {number} y0
 * @param {number} x1
 * @param {number} y1
 * @param {number} gapStart - Pixels to leave clear at the start
 * @param {number} gapEnd - Pixels to leave clear at the end
 */
export function dashed(mat, x0, y0, x1, y1, gapStart, gapEnd) {
	const length = Math.hypot(x1 - x0, y1 - y0);
	for (let t = gapStart; t < length - gapEnd; t += 1) {
		if (Math.floor(t / 4) % 2 === 0) {
			const x = Math.round(x0 + ((x1 - x0) * t) / length);
			const y = Math.round(y0 + ((y1 - y0) * t) / length);
			rect(mat, x, y + 1, 2, 2, C.tealShade);
			rect(mat, x, y, 2, 2, C.tealLight);
		}
	}
}

/** A teal ring that marks a ringed plot. @param {Canvas} mat @param {number} cx @param {number} cy */
export function ring(mat, cx, cy) {
	for (let y = -9; y <= 9; y++) {
		for (let x = -9; x <= 9; x++) {
			const d = Math.hypot(x + 0.5, y + 0.5);
			if (d <= 9 && d > 5.5) {
				set(
					mat,
					cx + x,
					cy + y,
					d > 8 || d < 6.5 ? C.tealShade : C.teal
				);
			}
		}
	}
}

/**
 * What #40 composes this mat in the game from (#6, #133). `pools.open` holds the buildable ground variants, safe on any buildable plot; there are no impassable tiles, as `capital-relief/polar` draws the impassable plots. `matOnly` says which picture draws each printed feature.
 * @type {import('./index.js').BiomeFeatures}
 */
export const FEATURES = Object.freeze({
	// The eight buildable ground variants are ordinary; the impassable plots have no tiles, as the relief draws them.
	pools: Object.freeze({
		open: Object.freeze([0, 1, 2, 3, 4, 5, 6, 7]),
		blocked: Object.freeze([]),
	}),
	special: Object.freeze([]),
	matOnly: Object.freeze([
		Object.freeze({
			name: 'rings',
			where: 'capital-overlay/polar draws a teal ring on each ringed plot: every letter A-F of LAYOUT (an open plot on a field line)',
		}),
		Object.freeze({
			name: 'field lines',
			where: 'capital-overlay/polar draws a dashed teal line through each field line, A to F, along LINES, running over the relief and left clear round each ring',
		}),
	]),
});
