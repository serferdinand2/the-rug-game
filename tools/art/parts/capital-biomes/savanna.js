// The Savanna advanced mat's printed layout, herds and districts, and the sprite of a herd (#6). Its ground tiles, relief
// and overlay draw it (#133).
import { rect, set } from '../../painter.js';
import { PALETTE as C } from '../../palette.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/**
 * The mat's printed layout, one string per row, top first: '.' an open plot, 'X' an impassable one.
 * The six unicorn herds are impassable too, so they are 'X' here; see UNICORNS.
 * @type {readonly string[]}
 */
export const LAYOUT = [
	'....XXXXX',
	'...XX....',
	'.........',
	'...X.....',
	'XXXX..XX.',
	'XX...XX..',
	'.....XX..',
	'.........',
	'XX.......',
];

/**
 * The impassable plots that hold a unicorn herd, as [row, column]. They count as impassable terrain (research FF.6 §2.5).
 * @type {readonly (readonly [number, number])[]}
 */
export const UNICORNS = [
	[0, 7],
	[1, 4],
	[4, 0],
	[4, 3],
	[5, 6],
	[8, 1],
];

/**
 * The six districts: '1'-'6' a district plot, '.' a grey plot that may be built on without belonging to a district.
 * Each district is the 3×3 block round its unicorn, clipped at the mat's edge.
 * @type {readonly string[]}
 */
export const DISTRICTS = [
	'...111222',
	'...111222',
	'...111...',
	'33444....',
	'33444555.',
	'33444555.',
	'.....555.',
	'666......',
	'666......',
];

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
 * Draws a unicorn herd's unicorn over a plot: cream, with a gold horn and an arcane mane.
 * @param {Canvas} c
 */
export function unicorn(c) {
	ellipse(c, 16, 26, 11, 3, C.savannaGoldShade);
	for (const x of [10, 12, 20, 22]) {
		rect(c, x, 20, 2, 6, C.cream);
		rect(c, x, 25, 2, 1, C.creamShade);
	}
	ellipse(c, 16, 18, 8, 5, C.creamLight);
	ellipse(c, 16, 20, 8, 3, C.cream);
	poly(
		c,
		[
			[21, 15],
			[24, 8],
			[28, 8],
			[29, 12],
			[25, 16],
		],
		C.creamLight
	);
	ellipse(c, 27, 11, 3, 2, C.cream);
	set(c, 27, 10, C.ink);
	poly(
		c,
		[
			[26, 8],
			[29, 1],
			[28, 8],
		],
		C.gold
	);
	set(c, 28, 3, C.amber);
	set(c, 28, 5, C.amber);
	for (let i = 0; i < 7; i++) {
		set(c, 22 - Math.floor(i / 2), 9 + i, i % 2 ? C.arcane : C.arcaneLight);
		set(c, 23 - Math.floor(i / 2), 9 + i, C.arcaneShade);
	}
	for (let i = 0; i < 6; i++) {
		set(c, 8 - (i % 3), 15 + i, i % 2 ? C.arcane : C.arcaneLight);
	}
	for (const [x, y] of [
		[5, 6],
		[14, 5],
		[3, 20],
		[29, 22],
	]) {
		set(c, x, y, C.gold);
		set(c, x + 1, y, C.beamLight);
		set(c, x, y + 1, C.beamLight);
	}
}

/**
 * What #40 composes this mat in the game from (#6, #133). `pools.open` holds the buildable ground variants, safe on any buildable plot; there are no impassable tiles, as `capital-relief/savanna` draws the impassable plots. `matOnly` says which picture draws each printed feature.
 * @type {import('./index.js').BiomeFeatures}
 */
export const FEATURES = Object.freeze({
	// The eight buildable ground variants of each ground are ordinary; the impassable plots have no tiles, as the relief draws them.
	pools: Object.freeze({
		open: Object.freeze([0, 1, 2, 3, 4, 5, 6, 7]),
		blocked: Object.freeze([]),
	}),
	special: Object.freeze([]),
	matOnly: Object.freeze([
		Object.freeze({
			name: 'grey and district ground',
			where: "The buildable ground tiles capital-terrain/savanna-grey-open-01 to -08 on a plot DISTRICTS marks '.', and capital-terrain/savanna-district-open-01 to -08 on a district plot",
		}),
		Object.freeze({
			name: 'unicorns',
			where: 'capital-overlay/savanna draws a unicorn on each UNICORNS plot (impassable), standing in the clearing capital-relief/savanna leaves there',
		}),
		Object.freeze({
			name: 'district borders',
			where: 'capital-overlay/savanna draws a one-pixel brass line round each district of DISTRICTS, on the outer edge of its plots',
		}),
	]),
});
