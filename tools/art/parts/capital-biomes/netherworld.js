// The Netherworld advanced mat's printed layout, and the sprites of its imps and city centre (#6). Its ground tiles,
// relief and overlay draw it (#133).
import { rect, set } from '../../painter.js';
import { PALETTE as C } from '../../palette.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */

/**
 * The mat's printed layout, one string per row, top first (03-expansions FF.6 §2.2). '.' is an open plot,
 * 'X' an impassable one, 'I' an open plot holding an imp (the four districts) and 'C' the open city-centre plot.
 * The paths the mat's text describes are built by the player's pieces and are not printed, so none are drawn.
 * @type {readonly string[]}
 */
export const LAYOUT = [
	'X...XX...',
	'XI..X..I.',
	'X.XXX....',
	'X.....XXX',
	'X...C....',
	'.XX......',
	'....XXX..',
	'.I.XX..I.',
	'...X.....',
];

/** One imp, about 12×15 pixels, standing on a plot. @param {Canvas} mat @param {number} cx @param {number} cy */
export function drawImp(mat, cx, cy) {
	const x = cx - 6;
	const y = cy - 8;
	// Tail and shadow.
	rect(mat, x + 1, y + 15, 11, 1, C.ink);
	rect(mat, x + 10, y + 10, 1, 4, C.brickRedShade);
	rect(mat, x + 11, y + 8, 1, 3, C.brickRedShade);
	rect(mat, x + 11, y + 7, 2, 1, C.brickRed);
	// Legs and body.
	rect(mat, x + 3, y + 12, 2, 3, C.brickRedShade);
	rect(mat, x + 7, y + 12, 2, 3, C.brickRedShade);
	rect(mat, x + 2, y + 7, 8, 6, C.brickRed);
	rect(mat, x + 3, y + 8, 3, 3, C.brickRedLight);
	rect(mat, x + 8, y + 8, 2, 4, C.brickRedShade);
	// Arms.
	rect(mat, x + 1, y + 8, 1, 4, C.brickRed);
	rect(mat, x + 10, y + 8, 1, 3, C.brickRed);
	// Head, horns, eyes and grin.
	rect(mat, x + 3, y + 2, 6, 5, C.brickRed);
	rect(mat, x + 4, y + 2, 2, 1, C.brickRedLight);
	rect(mat, x + 2, y, 1, 3, C.creamLight);
	rect(mat, x + 9, y, 1, 3, C.creamLight);
	rect(mat, x + 3, y - 1, 1, 2, C.creamShade);
	rect(mat, x + 8, y - 1, 1, 2, C.creamShade);
	rect(mat, x + 4, y + 4, 1, 1, C.gold);
	rect(mat, x + 7, y + 4, 1, 1, C.gold);
	rect(mat, x + 5, y + 6, 2, 1, C.ink);
	// Outline the head and body.
	rect(mat, x + 2, y + 3, 1, 4, C.ink);
	rect(mat, x + 9, y + 3, 1, 4, C.ink);
}

/** The city-centre marker: a gold ring around a small tower. @param {Canvas} mat @param {number} cx @param {number} cy */
export function drawCentre(mat, cx, cy) {
	for (let y = -12; y <= 12; y++) {
		for (let x = -12; x <= 12; x++) {
			const d = Math.hypot(x + 0.5, y + 0.5);
			if (d <= 12 && d > 9) {
				set(
					mat,
					cx + x,
					cy + y,
					d > 11 || d < 10 ? C.lampFrame : C.gold
				);
			}
		}
	}
	rect(mat, cx - 5, cy - 3, 10, 9, C.ink);
	rect(mat, cx - 4, cy - 2, 8, 8, C.gold);
	rect(mat, cx - 4, cy - 2, 8, 2, C.lampGlow);
	for (const x of [-5, -2, 1, 4]) {
		rect(mat, cx + x, cy - 5, 2, 3, C.ink);
		rect(mat, cx + x + (x < 0 ? 1 : 0), cy - 4, 1, 2, C.gold);
	}
	rect(mat, cx - 1, cy + 2, 3, 4, C.lampFrame);
	rect(mat, cx + 2, cy, 2, 2, C.amber);
	rect(mat, cx - 4, cy, 2, 2, C.amber);
}

/**
 * What #40 composes this mat in the game from (#6, #133). `pools.open` holds the buildable ground variants, safe on any buildable plot; there are no impassable tiles, as `capital-relief/netherworld` draws the impassable plots. `matOnly` says which picture draws each printed feature.
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
			name: 'imps',
			where: "capital-overlay/netherworld draws an imp standing on each 'I' plot of LAYOUT (an open plot): (1,1), (1,7), (7,1) and (7,7), as [row, column]",
		}),
		Object.freeze({
			name: 'city centre',
			where: "capital-overlay/netherworld draws a gold ring round a small tower on the 'C' plot of LAYOUT (an open plot): (4,4), as [row, column]",
		}),
	]),
});
