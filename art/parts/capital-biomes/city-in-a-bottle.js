// Capital terrain for the City in a Bottle advanced mat (#6): a small glassy seabed under bottle glass.
import {
	createCanvas,
	rect,
	set,
	get,
	line,
	mix,
	seededRandom,
} from '../../painter.js';
import { PALETTE as P } from '../../palette.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */
/** @typedef {() => number} Random */

/** Plot size in pixels. */
const SIZE = 32;

/**
 * The mat's printed layout, one string per row, top first: '.' an open plot, 'X' an impassable one.
 * It is 6 rows by 6 columns with 17 impassable plots and six 3×2 districts (rows 0-2 and 3-5, column pairs 0-1, 2-3, 4-5).
 * No landmark may be placed in this city. Source: docs/research/03-expansions.md, FF.6 §2.1.
 * @type {readonly string[]}
 */
export const LAYOUT = [
	'.XX..X',
	'.X.X.X',
	'...XX.',
	'.XX.X.',
	'XX...X',
	'..XXX.',
];

/** Colours of the bottle's seabed; the pixel-art palette has none of these yet. */
const K = {
	sand: P.bottleSand,
	sandLight: P.bottleSandLight,
	sandShade: P.bottleSandShade,
	sandDark: P.bottleSandDark,
	pebble: P.bottlePebble,
	pebbleLight: P.bottlePebbleLight,
	glass: P.bottleGlass,
	glassLight: P.bottleGlassLight,
	glassDeep: P.bottleGlassDeep,
	moss: P.bottleMoss,
	mossDark: P.bottleMossDark,
	coral: P.bottleCoral,
	coralLight: P.bottleCoralLight,
	coralShade: P.bottleCoralShade,
	driftwood: P.bottleDriftwood,
	driftwoodLight: P.bottleDriftwoodLight,
	driftwoodShade: P.bottleDriftwoodShade,
	rockLight: P.bottleRockLight,
	rock: P.bottleRock,
	rockShade: P.bottleRockShade,
	outline: P.bottleOutline,
};

/** What each plot of the example mat uses, row by row: `blocked` and the tile `variant`. */
export const PLACEMENT = (() => {
	let blockedCount = 0;
	let openCount = 0;
	return LAYOUT.map((row) =>
		[...row].map((cell) =>
			cell === 'X'
				? { blocked: true, variant: (blockedCount++ * 5) % 6 }
				: { blocked: false, variant: (openCount++ * 3) % 8 }
		)
	);
})();

/** @param {Random} r @param {number} a @param {number} b @returns {number} */
function rngInt(r, a, b) {
	return a + Math.floor(r() * (b - a + 1));
}

/** @param {Random} r @param {readonly Colour[]} a @returns {Colour} */
function choice(r, a) {
	return a[Math.floor(r() * a.length)];
}

/**
 * Pale glassy sand with soft patches, flecks and a few ripple lines.
 * @param {Canvas} c
 * @param {Random} r
 */
function ground(c, r) {
	rect(c, 0, 0, SIZE, SIZE, K.sand);
	for (let i = 0; i < 12; i++) {
		rect(
			c,
			rngInt(r, 1, 27),
			rngInt(r, 1, 28),
			rngInt(r, 3, 7),
			rngInt(r, 1, 3),
			i % 3 === 0 ? K.sandShade : K.sandLight
		);
	}
	for (let i = 0; i < 4; i++) {
		const x = rngInt(r, 1, 18);
		const y = rngInt(r, 3, 28);
		for (let j = 0; j < 11; j++) {
			set(
				c,
				x + j,
				y + Math.round(1.2 * Math.sin(j * 0.55 + i)),
				i % 2 ? K.sandLight : K.sandShade
			);
		}
	}
	for (let i = 0; i < 34; i++) {
		set(
			c,
			rngInt(r, 1, 30),
			rngInt(r, 1, 30),
			i % 4 === 0 ? K.sandDark : choice(r, [K.sandLight, K.pebble])
		);
	}
	for (let i = 0; i < 12; i++) {
		let a = rngInt(r, 0, 31);
		let b = rngInt(r, 0, 31);
		if (r() > 0.5) {
			a = r() > 0.5 ? 0 : 31;
		} else {
			b = r() > 0.5 ? 0 : 31;
		}
		set(c, a, b, i % 2 ? K.sandLight : K.sand);
	}
}

/** A pebble. @param {Canvas} c @param {number} x @param {number} y */
function pebble(c, x, y) {
	rect(c, x, y, 3, 2, K.pebble);
	rect(c, x, y, 2, 1, K.pebbleLight);
	set(c, x + 2, y + 1, K.glassDeep);
}

/** A starfish. @param {Canvas} c @param {number} x @param {number} y */
function starfish(c, x, y) {
	rect(c, x + 1, y + 1, 3, 3, K.coral);
	set(c, x + 2, y, K.coral);
	set(c, x + 2, y + 4, K.coral);
	set(c, x, y + 2, K.coral);
	set(c, x + 4, y + 2, K.coral);
	set(c, x + 2, y + 2, K.coralLight);
}

/** A sea-glass shard. @param {Canvas} c @param {number} x @param {number} y */
function shard(c, x, y) {
	rect(c, x, y + 1, 3, 2, K.glass);
	set(c, x + 1, y, K.glass);
	set(c, x, y + 1, K.glassLight);
	set(c, x + 2, y + 2, K.glassDeep);
}

/** A seaweed tuft. @param {Canvas} c @param {number} x @param {number} y */
function weed(c, x, y) {
	for (let i = 0; i < 5; i++) {
		set(c, x + (i % 2), y - i, i % 2 ? K.moss : K.mossDark);
	}
	set(c, x + 2, y - 3, K.moss);
	set(c, x + 3, y - 4, K.moss);
}

/** A small buildable plot, calm enough to build on. @param {Canvas} c @param {number} v @param {Random} r */
function openFeature(c, v, r) {
	const spot = (/** @type {number} */ n) => {
		const pts = [];
		for (let i = 0; i < n; i++) {
			pts.push([rngInt(r, 3, 25), rngInt(r, 5, 26)]);
		}
		return pts;
	};
	switch (v) {
		case 0:
			for (const [x, y] of spot(4)) {
				pebble(c, x, y);
			}
			break;
		case 1:
			for (const [x, y] of spot(3)) {
				shard(c, x, y);
			}
			break;
		case 2:
			for (const [x, y] of spot(2)) {
				weed(c, x, y);
			}
			break;
		case 3:
			starfish(c, rngInt(r, 6, 20), rngInt(r, 8, 22));
			pebble(c, 5, 25);
			break;
		case 4:
			// bubbles drifting up
			for (const [x, y] of spot(7)) {
				set(c, x, y, K.glassLight);
				set(c, x + 1, y, K.glass);
				set(c, x, y + 1, K.glass);
			}
			break;
		case 5:
			// a small spiral shell
			rect(c, 19, 17, 5, 4, P.cream);
			rect(c, 20, 16, 3, 1, P.cream);
			set(c, 21, 18, P.creamShade);
			set(c, 22, 18, P.creamShade);
			set(c, 20, 19, P.creamShade);
			rect(c, 19, 21, 5, 1, P.creamShade);
			pebble(c, 6, 8);
			break;
		case 6:
			// cork crumbs and a cord
			for (const [x, y] of spot(4)) {
				rect(c, x, y, 2, 2, P.timberLight);
				set(c, x + 1, y + 1, P.timber);
			}
			line(c, 4, 22, 20, 25, K.driftwoodLight);
			break;
		default:
			for (const [x, y] of spot(2)) {
				shard(c, x, y);
			}
			for (const [x, y] of spot(2)) {
				pebble(c, x, y);
			}
			break;
	}
}

/**
 * A rounded boulder with an outline.
 * @param {Canvas} c
 * @param {number} cx
 * @param {number} cy
 * @param {number} rx
 * @param {number} ry
 */
function boulder(c, cx, cy, rx, ry) {
	for (let y = cy - ry - 1; y <= cy + ry + 1; y++) {
		for (let x = cx - rx - 1; x <= cx + rx + 1; x++) {
			const d = Math.hypot((x - cx) / rx, (y - cy) / ry);
			if (d <= 1) {
				const lit = (x - cx) * -0.6 + (y - cy) * -0.8;
				set(
					c,
					x,
					y,
					lit > rx * 0.45
						? K.rockLight
						: lit < -rx * 0.35
							? K.rockShade
							: K.rock
				);
			} else if (d <= 1.22) {
				set(c, x, y, K.outline);
			}
		}
	}
	set(c, cx - 2, cy - 2, K.glassLight);
	rect(c, cx + 1, cy - ry + 1, 3, 1, K.moss);
	set(c, cx + 2, cy - ry + 2, K.mossDark);
}

/** An impassable plot. @param {Canvas} c @param {number} v @param {Random} r */
function blockedFeature(c, v, r) {
	switch (v) {
		case 0:
			boulder(c, 16, 17, 11, 9);
			break;
		case 1:
			boulder(c, 10, 21, 7, 6);
			boulder(c, 21, 12, 8, 7);
			break;
		case 2: {
			// a branching coral
			const stem = [
				[16, 28, 16, 12],
				[16, 20, 8, 12],
				[16, 17, 24, 9],
				[8, 12, 6, 6],
				[24, 9, 26, 4],
				[16, 12, 14, 5],
			];
			for (const [x0, y0, x1, y1] of stem) {
				for (let o = -1; o <= 2; o++) {
					line(
						c,
						x0 + o,
						y0,
						x1 + o,
						y1,
						o === -1
							? K.coralShade
							: o === 2
								? K.coralShade
								: K.coral
					);
				}
				line(c, x0, y0, x1, y1, K.coralLight);
			}
			for (const [x, y] of [
				[6, 5],
				[26, 3],
				[14, 4],
				[10, 11],
				[22, 8],
			]) {
				rect(c, x - 1, y - 1, 3, 3, K.coralLight);
				set(c, x, y, P.white);
			}
			rect(c, 10, 27, 12, 3, K.sandShade);
			break;
		}
		case 3: {
			// a driftwood log, bleached and knotted
			for (let i = 0; i < 26; i++) {
				const y = 22 - Math.round(i * 0.4);
				rect(
					c,
					3 + i,
					y,
					1,
					7,
					i % 5 === 0 ? K.driftwoodShade : K.driftwood
				);
				set(c, 3 + i, y, K.driftwoodLight);
				set(c, 3 + i, y + 6, K.driftwoodShade);
			}
			rect(c, 3, 22, 2, 7, K.driftwoodShade);
			rect(c, 4, 23, 1, 5, K.driftwoodLight);
			rect(c, 27, 11, 2, 5, K.driftwoodShade);
			rect(c, 11, 14, 2, 4, K.driftwood);
			rect(c, 12, 11, 2, 4, K.driftwoodLight);
			rect(c, 12, 14, 3, 1, K.outline);
			weed(c, 18, 21);
			break;
		}
		case 4: {
			// a cluster of glass crystals
			const spikes = [
				[8, 28, 6, 8, 5],
				[14, 28, 14, 3, 6],
				[21, 28, 22, 9, 5],
				[26, 28, 27, 15, 3],
				[4, 28, 3, 17, 3],
			];
			for (const [x0, y0, x1, y1, w] of spikes) {
				for (let y = y1; y <= y0; y++) {
					const t = (y - y1) / (y0 - y1);
					const x = Math.round(x1 + (x0 - x1) * t);
					const half = Math.max(
						0,
						Math.round((w / 2) * Math.min(1, t * 1.6))
					);
					rect(c, x - half, y, half * 2 + 1, 1, K.glass);
					set(c, x - half, y, K.glassLight);
					set(c, x + half, y, K.glassDeep);
				}
				set(c, x1, y1, P.white);
			}
			rect(c, 6, 28, 22, 2, K.glassDeep);
			break;
		}
		default: {
			// a big spiral seashell: a coiled whorl whose bands wind in to the apex, with the flared pink mouth at the lower right
			const cx = 15;
			const cy = 16;
			const mouth = Math.PI * 0.25;
			/** Distance from the apex to the shell's edge at an angle: it grows each turn, as a coil does. */
			const edge = (/** @type {number} */ a) => {
				const turn =
					(((a - mouth) % (Math.PI * 2)) + Math.PI * 2) %
					(Math.PI * 2);
				return 9.5 + 5.5 * (turn / (Math.PI * 2));
			};
			for (let y = 0; y < SIZE; y++) {
				for (let x = 0; x < SIZE; x++) {
					const dx = x + 0.5 - cx;
					const dy = y + 0.5 - cy;
					const d = Math.hypot(dx, dy);
					const a = Math.atan2(dy, dx);
					const e = edge(a);
					if (d > e + 1.2) {
						continue;
					}
					if (d > e) {
						set(c, x, y, K.outline);
						continue;
					}
					// Bands wind outwards: the phase falls with the angle and rises with the radius.
					const phase = (d / e) * 2.2 - a / (Math.PI * 2);
					const f = phase - Math.floor(phase);
					let col =
						f < 0.2
							? P.sandShade
							: f < 0.6
								? P.cream
								: P.creamLight;
					if (d > e - 1.5) {
						col = P.creamShade;
					}
					if (dx + dy > 6) {
						col = col === P.creamLight ? P.cream : P.creamShade;
					}
					set(c, x, y, col);
				}
			}
			// the apex and its dark seam
			rect(c, cx - 1, cy - 1, 2, 2, P.brickRedLight);
			set(c, cx - 1, cy - 1, P.white);
			// the pink mouth where the coil opens
			rect(c, 20, 22, 9, 6, K.outline);
			rect(c, 19, 23, 11, 4, K.outline);
			rect(c, 21, 23, 7, 4, P.brickRedLight);
			rect(c, 22, 22, 5, 1, P.brickRedLight);
			rect(c, 23, 25, 5, 2, P.brickRed);
			rect(c, 22, 27, 5, 1, P.brickRedLight);
			set(c, 12, 7, P.white);
			set(c, 13, 7, P.creamLight);
			void r;
			break;
		}
	}
}

/**
 * One 32×32 plot of this biome.
 * @param {boolean} blocked - An impassable plot
 * @param {number} variant - 0-7 for a buildable plot, 0-5 for an impassable one
 * @returns {Canvas}
 */
export function drawBiomeTile(blocked, variant) {
	const count = blocked ? 6 : 8;
	const v = ((variant % count) + count) % count;
	const c = createCanvas(SIZE, SIZE);
	const random = seededRandom(14041 + v * 6151 + (blocked ? 30011 : 0));
	ground(c, random);
	if (blocked) {
		blockedFeature(c, v, random);
	} else {
		openFeature(c, v, random);
	}
	return c;
}

/**
 * Lightens a pixel toward glass.
 * @param {Canvas} c
 * @param {number} x
 * @param {number} y
 * @param {Colour} tint
 * @param {number} amount
 */
function glassPixel(c, x, y, tint, amount) {
	const here = get(c, x, y);
	if (here) {
		set(c, x, y, mix(here, tint, amount));
	}
}

/**
 * The example mat, composed from this biome's tiles on its printed layout, with the bottle's glass over it:
 * a faint teal rim and reflections, drawn only in the outer 4 pixels so every plot stays readable.
 * @returns {Canvas}
 */
export function drawBiomeMat() {
	const mat = createCanvas(LAYOUT[0].length * SIZE, LAYOUT.length * SIZE);
	PLACEMENT.forEach((row, r) =>
		row.forEach(({ blocked, variant }, col) => {
			const tile = drawBiomeTile(blocked, variant);
			for (let y = 0; y < SIZE; y++) {
				for (let x = 0; x < SIZE; x++) {
					set(
						mat,
						col * SIZE + x,
						r * SIZE + y,
						tile.p[y * SIZE + x]
					);
				}
			}
		})
	);
	const w = mat.w;
	const h = mat.h;
	for (let i = 0; i < w; i++) {
		glassPixel(mat, i, 0, K.glassDeep, 0.55);
		glassPixel(mat, i, h - 1, K.glassDeep, 0.55);
		glassPixel(mat, i, 1, K.glass, 0.25);
		glassPixel(mat, i, h - 2, K.glass, 0.25);
	}
	for (let j = 0; j < h; j++) {
		glassPixel(mat, 0, j, K.glassDeep, 0.55);
		glassPixel(mat, w - 1, j, K.glassDeep, 0.55);
		glassPixel(mat, 1, j, K.glass, 0.25);
		glassPixel(mat, w - 2, j, K.glass, 0.25);
	}
	// reflections: a long streak down the left, a curve at the top, glints at the bottom right
	for (let j = 14; j < 74; j++) {
		if (j % 11 < 8) {
			glassPixel(mat, 2, j, P.white, 0.55);
			glassPixel(mat, 3, j, P.white, 0.25);
		}
	}
	for (let j = 84; j < 98; j++) {
		glassPixel(mat, 2, j, P.white, 0.55);
	}
	for (let i = 8; i < 30; i++) {
		glassPixel(mat, i, 2, P.white, 0.4);
	}
	for (let i = 0; i < 5; i++) {
		glassPixel(mat, w - 3, h - 14 - i, P.white, 0.45);
		glassPixel(mat, w - 4 - i, h - 3, P.white, 0.45);
	}
	return mat;
}

/**
 * What #36 needs to compose this mat: which variants are ordinary, which carry a printed meaning, and what only the example mat draws.
 * `pools` holds the variants that are safe to pick at random on any plot (0-based, as `drawBiomeTile` takes them).
 * @type {import('./index.js').BiomeFeatures}
 */
export const FEATURES = Object.freeze({
	pools: Object.freeze({
		open: Object.freeze([0, 1, 2, 3, 4, 5, 6, 7]),
		blocked: Object.freeze([0, 1, 2, 3, 4, 5]),
	}),
	special: Object.freeze([]),
	matOnly: Object.freeze([
		Object.freeze({
			name: 'bottle glass',
			where: 'A teal rim in the outer 4 pixels of the mat, with a long reflection down the left and glints at the bottom right',
		}),
	]),
});
