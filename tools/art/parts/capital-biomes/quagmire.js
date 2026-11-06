// The Quagmire advanced mat's printed layout, wisps and reeds, and the sprites of what it prints (#6). Its ground tiles,
// relief and features picture draw it (#133).
import { rect, set } from '../../painter.js';
import { PALETTE as P } from '../../palette.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/**
 * The mat's printed layout, one string per row, top first: '.' an open plot, 'X' an impassable one.
 * The 18 water plots and the 4 will-o'-the-wisps are all 'X' (wisps count as impassable terrain); `WISPS` says which.
 * Source: docs/research/03-expansions.md, FF.6 §2.4.
 * @type {readonly string[]}
 */
export const LAYOUT = [
	'.....XX..',
	'.....X...',
	'....X....',
	'...XX....',
	'...X.....',
	'...X.....',
	'..XX....X',
	'..XX...XX',
	'.XXXX.XXX',
];

/**
 * The four will-o'-the-wisps, as [row, column]. Each sits on an impassable plot.
 * @type {readonly (readonly [number, number])[]}
 */
export const WISPS = [
	[0, 6],
	[3, 4],
	[7, 2],
	[7, 7],
];

/**
 * The seven printed reed plots, as [row, column]: the open plots next to a wisp.
 * @type {readonly (readonly [number, number])[]}
 */
export const REEDS = [
	[0, 7],
	[1, 6],
	[3, 5],
	[4, 4],
	[6, 7],
	[7, 1],
	[7, 6],
];

/**
 * One reed with a seed head.
 * @param {Canvas} c
 * @param {number} x
 * @param {number} y - The foot
 * @param {number} h
 * @param {boolean} head
 * @param {number} lean
 */
export function reed(c, x, y, h, head, lean) {
	for (let i = 0; i < h; i++) {
		set(
			c,
			x + Math.round((lean * i) / h),
			y - i,
			i % 3 === 0 ? P.quagReedShade : P.quagReed
		);
	}
	const tx = x + lean;
	set(c, tx - 1, y - h + 3, P.quagReedLight);
	if (head) {
		rect(c, tx, y - h - 2, 1, 3, P.quagCattail);
		set(c, tx, y - h - 3, P.quagReedShade);
	}
}

/**
 * A wisp: a ghostly flame with a tail and a glow.
 * @param {Canvas} c
 * @param {number} cx
 * @param {number} cy
 */
export function wisp(c, cx, cy) {
	const glow = P.quagWispGlow;
	const halo = P.quagWispHalo;
	for (let y = -8; y <= 8; y++) {
		for (let x = -8; x <= 8; x++) {
			const d = Math.hypot(x, y * 1.1);
			if (d < 7.5 && (x + y) % 2 === 0) {
				set(c, cx + x, cy + y, d < 5 ? halo : glow);
			}
		}
	}
	// the flame body: a teardrop leaning right
	/** @type {[number, number, Colour][]} */
	const flame = [
		[0, -6, P.ghostShade],
		[0, -5, P.ghost],
		[1, -4, P.ghost],
		[0, -3, P.ghost],
		[-1, -2, P.ghost],
	];
	for (const [dx, dy, col] of flame) {
		set(c, cx + dx, cy + dy, col);
	}
	rect(c, cx - 2, cy - 2, 5, 5, P.ghost);
	rect(c, cx - 3, cy - 1, 7, 3, P.ghost);
	rect(c, cx - 1, cy - 1, 3, 3, P.ghostLight);
	rect(c, cx - 1, cy + 3, 3, 1, P.ghostShade);
	rect(c, cx, cy + 4, 1, 1, P.ghostShade);
	set(c, cx, cy, P.white);
	// two sparks
	set(c, cx + 6, cy - 5, P.ghostLight);
	set(c, cx - 6, cy + 4, P.ghostLight);
}

/**
 * What #40 composes this mat in the game from (#6, #133). `pools.open` holds the buildable ground variants, safe on any buildable plot; there are no impassable tiles, as `capital-relief/quagmire` draws the impassable plots. `matOnly` says which picture draws each printed feature.
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
			name: "will-o'-the-wisps",
			where: 'capital-relief/quagmire draws a wisp floating over the water of each WISPS plot',
		}),
		Object.freeze({
			name: 'reeds',
			where: 'capital-feature/quagmire draws a bed of reeds and cattails on each REEDS plot',
		}),
	]),
});
