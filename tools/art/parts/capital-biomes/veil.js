// The Veil advanced mat's printed layout and sides, and the sprites of what it prints (#6). Its ground tiles, relief and
// overlay draw it (#133).
import { rect, set } from '../../painter.js';
import { PALETTE as C } from '../../palette.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/**
 * The mat's printed layout, one string per row, top first: '.' an open plot, 'X' an impassable one.
 * @type {readonly string[]}
 */
export const LAYOUT = [
	'......XX.',
	'.....X...',
	'......X..',
	'......XXX',
	'.....X...',
	'....XX...',
	'...XXX...',
	'..XX..X.X',
	'XXX....XX',
];

/**
 * Whether a plot lies on the charmed (right) side of the veil. The veil runs down the column 5|6 line for rows 0-5,
 * along the row 5|6 line, then down the column 2|3 line for rows 6-8 (research FF.6 §2.6).
 * @param {number} row
 * @param {number} col
 * @returns {boolean}
 */
export function isCharmed(row, col) {
	return row <= 5 ? col >= 6 : col >= 3;
}

/**
 * Fills a polygon with hard edges.
 * @param {Canvas} c
 * @param {number[][]} pts
 * @param {Colour} col
 */
function poly(c, pts, col) {
	const ys = pts.map((p) => p[1]);
	for (
		let y = Math.floor(Math.min(...ys));
		y < Math.ceil(Math.max(...ys));
		y++
	) {
		for (let x = 0; x < c.w; x++) {
			const px = x + 0.5;
			const py = y + 0.5;
			let inside = false;
			for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
				const a = pts[i];
				const b = pts[j];
				if (
					a[1] > py !== b[1] > py &&
					px < ((b[0] - a[0]) * (py - a[1])) / (b[1] - a[1]) + a[0]
				) {
					inside = !inside;
				}
			}
			if (inside) {
				set(c, x, y, col);
			}
		}
	}
}

/**
 * Fills an ellipse.
 * @param {Canvas} c
 * @param {number} cx
 * @param {number} cy
 * @param {number} rx
 * @param {number} ry
 * @param {Colour} col
 */
function ellipse(c, cx, cy, rx, ry, col) {
	for (let y = Math.ceil(cy - ry); y <= Math.floor(cy + ry); y++) {
		for (let x = Math.ceil(cx - rx); x <= Math.floor(cx + rx); x++) {
			if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) {
				set(c, x, y, col);
			}
		}
	}
}

/**
 * A small four-point sparkle.
 * @param {Canvas} c
 * @param {number} x
 * @param {number} y
 * @param {Colour} core
 * @param {Colour} glow
 */
export function sparkle(c, x, y, core, glow) {
	set(c, x, y, core);
	set(c, x - 1, y, glow);
	set(c, x + 1, y, glow);
	set(c, x, y - 1, glow);
	set(c, x, y + 1, glow);
}

/**
 * Draws a small printed pocket-universe benefit icon, 14 pixels across, centred on a point.
 * @param {Canvas} mat
 * @param {'tech' | 'die' | 'building'} kind
 * @param {number} cx
 * @param {number} cy
 */
export function drawIcon(mat, kind, cx, cy) {
	ellipse(mat, cx, cy, 10, 10, C.ink);
	ellipse(mat, cx, cy, 9, 9, C.floorShade);
	if (kind === 'tech') {
		rect(mat, cx - 4, cy - 6, 9, 12, C.ink);
		rect(mat, cx - 3, cy - 5, 7, 10, C.gold);
		rect(mat, cx - 3, cy - 5, 7, 2, C.amber);
		ellipse(mat, cx, cy + 1, 2, 2, C.lampFrame);
		set(mat, cx, cy + 1, C.gold);
	} else if (kind === 'die') {
		poly(
			mat,
			[
				[cx, cy - 8],
				[cx + 7, cy - 4],
				[cx + 7, cy + 4],
				[cx, cy + 8],
				[cx - 7, cy + 4],
				[cx - 7, cy - 4],
			],
			C.ink
		);
		poly(
			mat,
			[
				[cx, cy - 7],
				[cx + 6, cy - 3],
				[cx + 6, cy + 3],
				[cx, cy + 7],
				[cx - 6, cy + 3],
				[cx - 6, cy - 3],
			],
			C.pine
		);
		poly(
			mat,
			[
				[cx, cy - 6],
				[cx + 4, cy + 2],
				[cx - 4, cy + 2],
			],
			C.pineLight
		);
		set(mat, cx, cy - 1, C.creamLight);
	} else {
		rect(mat, cx - 5, cy - 1, 11, 7, C.ink);
		rect(mat, cx - 4, cy, 9, 5, C.cream);
		rect(mat, cx - 4, cy, 3, 5, C.brickRedLight);
		rect(mat, cx + 2, cy, 3, 5, C.teal);
		poly(
			mat,
			[
				[cx - 6, cy],
				[cx, cy - 7],
				[cx + 7, cy],
			],
			C.ink
		);
		poly(
			mat,
			[
				[cx - 5, cy],
				[cx, cy - 6],
				[cx + 6, cy],
			],
			C.gold
		);
		rect(mat, cx - 1, cy + 2, 2, 3, C.timberShade);
	}
}

/**
 * What #40 composes this mat in the game from (#6, #133). `pools.open` holds the buildable ground variants, safe on any buildable plot; there are no impassable tiles, as `capital-relief/veil` draws the impassable plots. `matOnly` says which picture draws each printed feature.
 * @type {import('./index.js').BiomeFeatures}
 */
export const FEATURES = Object.freeze({
	// The eight buildable ground variants of each side are ordinary; the impassable plots have no tiles, as the relief draws them.
	pools: Object.freeze({
		open: Object.freeze([0, 1, 2, 3, 4, 5, 6, 7]),
		blocked: Object.freeze([]),
	}),
	special: Object.freeze([]),
	matOnly: Object.freeze([
		Object.freeze({
			name: 'worldly and charmed sides',
			where: 'The buildable ground tiles capital-terrain/veil-worldly-open-01 to -08 and capital-terrain/veil-charmed-open-01 to -08, picked for each plot by isCharmed(row, col); capital-relief/veil changes look at the veil the same way',
		}),
		Object.freeze({
			name: 'the veil',
			where: 'capital-overlay/veil draws a shimmering line along every edge between a worldly and a charmed plot, with a sparkle on every third stretch',
		}),
		Object.freeze({
			name: 'pocket icons',
			where: 'capital-overlay/veil draws a tech card icon at row 1, column 8; a science die icon on the edge between rows 4 and 5 at column 8; an income building icon at row 8, column 5',
		}),
	]),
});
