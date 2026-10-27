// Capital terrain for the Veil advanced mat (#6): 32×32 plots and the example mat on its printed layout.
import { createCanvas, rect, set, line, seededRandom } from '../../painter.js';
import { PALETTE as C } from '../../palette.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */
/** @typedef {() => number} Random */

const SIZE = 32;

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
 * The veil as a path of [x, y] corners in mat pixels, drawn over the mat.
 * @type {readonly (readonly [number, number])[]}
 */
export const VEIL_PATH = [
	[192, 0],
	[192, 192],
	[96, 192],
	[96, 288],
];

/** Colours for this biome only. */
const K = {
	meadow: C.veilMeadow,
	meadowLight: C.veilMeadowLight,
	meadowShade: C.veilMeadowShade,
	night: C.veilNight,
	nightLight: C.veilNightLight,
	nightShade: C.veilNightShade,
};

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

/** @param {Random} r @param {number} a @param {number} b @returns {number} */
function int(r, a, b) {
	return a + Math.floor(r() * (b - a + 1));
}

/**
 * Meadow or twilight ground texture.
 * @param {Canvas} c
 * @param {Random} r
 * @param {boolean} charmed
 */
function ground(c, r, charmed) {
	const [base, light, dark, detail] = charmed
		? [K.night, K.nightLight, K.nightShade, K.nightLight]
		: [K.meadow, K.meadowLight, K.meadowShade, C.grassLight];
	rect(c, 0, 0, SIZE, SIZE, base);
	for (let i = 0; i < 11; i++) {
		rect(
			c,
			int(r, 1, 28),
			int(r, 1, 28),
			int(r, 2, 5),
			int(r, 1, 4),
			i % 3 === 0 ? dark : light
		);
	}
	for (let i = 0; i < 38; i++) {
		set(c, int(r, 1, 30), int(r, 1, 30), i % 4 === 0 ? dark : detail);
	}
	for (let i = 0; i < 13; i++) {
		let a = int(r, 0, 31);
		let b = int(r, 0, 31);
		if (r() > 0.5) {
			a = r() > 0.5 ? 0 : 31;
		} else {
			b = r() > 0.5 ? 0 : 31;
		}
		set(c, a, b, i % 2 ? light : base);
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
function sparkle(c, x, y, core, glow) {
	set(c, x, y, core);
	set(c, x - 1, y, glow);
	set(c, x + 1, y, glow);
	set(c, x, y - 1, glow);
	set(c, x, y + 1, glow);
}

/**
 * Light scatter on a buildable plot.
 * @param {Canvas} c
 * @param {Random} r
 * @param {number} v
 */
function scatter(c, r, v) {
	if (v === 0) {
		for (let i = 0; i < 9; i++) {
			const x = int(r, 3, 28);
			const y = int(r, 5, 29);
			set(c, x, y, K.meadowShade);
			set(c, x - 1, y - 1, K.meadowShade);
			set(c, x + 1, y - 2, C.grassLight);
			set(c, x, y - 2, C.grassLight);
		}
	} else if (v === 1) {
		for (let i = 0; i < 6; i++) {
			const x = int(r, 3, 28);
			const y = int(r, 3, 28);
			set(c, x, y, i % 2 ? C.creamLight : C.gold);
			set(c, x + 1, y, i % 2 ? C.cream : C.amber);
			set(c, x, y + 1, K.meadowShade);
		}
		for (let i = 0; i < 4; i++) {
			set(c, int(r, 3, 28), int(r, 3, 28), C.arcaneLight);
		}
	} else if (v === 2) {
		for (let i = 0; i < 3; i++) {
			const x = int(r, 5, 25);
			const y = int(r, 5, 25);
			ellipse(c, x, y, 3, 2, K.meadowShade);
			ellipse(c, x - 1, y - 1, 2, 1, C.grass);
			set(c, x + 2, y, C.creamLight);
		}
	} else if (v === 3) {
		for (let i = 0; i < 5; i++) {
			const x = int(r, 3, 26);
			const y = int(r, 4, 26);
			rect(c, x, y, 3, 2, C.stoneShade);
			rect(c, x, y, 2, 1, C.stoneLight);
		}
		for (let i = 0; i < 8; i++) {
			rect(c, int(r, 3, 27), int(r, 3, 28), 2, 1, C.timberLight);
		}
	} else if (v === 4) {
		for (let i = 0; i < 6; i++) {
			sparkle(
				c,
				int(r, 3, 28),
				int(r, 3, 28),
				C.arcaneLight,
				C.arcaneShade
			);
		}
	} else if (v === 5) {
		for (let i = 0; i < 9; i++) {
			const x = int(r, 3, 28);
			const y = int(r, 3, 28);
			set(c, x, y, i % 2 ? C.ghost : C.tealLight);
			set(c, x + 1, y, C.ghostShade);
		}
	} else if (v === 6) {
		for (let k = 0; k < 3; k++) {
			const y0 = 7 + k * 8;
			for (let x = 2; x < 30; x++) {
				set(
					c,
					x,
					y0 + Math.round(1.6 * Math.sin(x * 0.4 + k * 2)),
					x % 5 ? K.nightLight : C.arcaneShade
				);
			}
		}
		sparkle(c, 24, 6, C.arcaneLight, C.arcane);
	} else {
		for (let i = 0; i < 6; i++) {
			const a = (i / 6) * Math.PI * 2;
			const x = Math.round(16 + Math.cos(a) * 8);
			const y = Math.round(16 + Math.sin(a) * 6);
			rect(c, x, y, 3, 1, C.arcane);
			rect(c, x + 1, y - 1, 1, 1, C.arcaneLight);
			set(c, x + 1, y + 1, C.creamShade);
		}
	}
}

/**
 * The obstacle on an impassable plot.
 * @param {Canvas} c
 * @param {number} v
 * @param {Random} r
 */
function obstacle(c, v, r) {
	if (v === 0) {
		const p = [
			[5, 21],
			[8, 11],
			[16, 6],
			[24, 9],
			[28, 18],
			[24, 26],
			[10, 27],
		];
		poly(
			c,
			p.map(([x, y]) => [x, y + 1]),
			C.ink
		);
		poly(c, p, C.stoneShade);
		poly(
			c,
			[
				[8, 12],
				[16, 7],
				[23, 10],
				[18, 15],
				[9, 17],
			],
			C.stone
		);
		poly(
			c,
			[
				[10, 12],
				[16, 8],
				[20, 10],
				[14, 13],
			],
			C.stoneLight
		);
		poly(
			c,
			[
				[6, 20],
				[12, 22],
				[14, 27],
				[9, 26],
			],
			C.forestFloorShade
		);
		rect(c, 8, 21, 4, 1, C.grass);
		rect(c, 22, 14, 3, 1, C.grass);
	} else if (v === 1) {
		ellipse(c, 16, 18, 12, 10, C.ink);
		ellipse(c, 16, 17, 11, 9, C.timberShade);
		ellipse(c, 16, 15, 10, 8, C.timber);
		ellipse(c, 16, 15, 7, 5, C.timberLight);
		ellipse(c, 16, 15, 4, 3, C.timber);
		ellipse(c, 16, 15, 2, 1, C.timberLight);
		for (const [x, y] of [
			[4, 20],
			[26, 21],
			[8, 25],
			[23, 26],
		]) {
			rect(c, x, y, 3, 1, C.grassShade);
		}
	} else if (v === 2) {
		ellipse(c, 16, 17, 13, 10, C.ink);
		for (const [x, y, rx, ry] of [
			[10, 14, 8, 6],
			[21, 15, 8, 7],
			[15, 21, 9, 5],
		]) {
			ellipse(c, x, y, rx, ry, C.pineShade);
			ellipse(c, x - 1, y - 1, rx - 2, ry - 2, C.pine);
		}
		for (let i = 0; i < 20; i++) {
			const x = int(r, 5, 27);
			const y = int(r, 8, 25);
			line(
				c,
				x,
				y,
				x + int(r, -2, 2),
				y - 2,
				i % 2 ? C.timberLight : C.timber
			);
		}
		for (const [x, y] of [
			[9, 11],
			[19, 11],
			[24, 18],
			[13, 22],
		]) {
			set(c, x, y, C.brickRedLight);
			set(c, x + 1, y, C.brickRed);
		}
	} else if (v === 3) {
		ellipse(c, 16, 26, 10, 3, K.nightShade);
		for (const [x, h, w] of [
			[9, 15, 4],
			[15, 21, 5],
			[21, 13, 4],
			[12, 10, 3],
		]) {
			poly(
				c,
				[
					[x - w, 26],
					[x - w + 1, 26 - h + 5],
					[x, 26 - h],
					[x + w - 1, 26 - h + 5],
					[x + w, 26],
				],
				C.ink
			);
			poly(
				c,
				[
					[x - w + 1, 25],
					[x - w + 2, 26 - h + 6],
					[x, 26 - h + 1],
					[x + w - 2, 26 - h + 6],
					[x + w - 1, 25],
				],
				C.arcane
			);
			poly(
				c,
				[
					[x - w + 1, 25],
					[x - w + 2, 26 - h + 6],
					[x, 26 - h + 1],
					[x - 1, 25],
				],
				C.arcaneLight
			);
			poly(
				c,
				[
					[x + 1, 25],
					[x + 1, 26 - h + 4],
					[x + w - 2, 26 - h + 6],
					[x + w - 1, 25],
				],
				C.arcaneShade
			);
		}
		sparkle(c, 6, 8, C.white, C.arcaneLight);
		sparkle(c, 26, 9, C.white, C.arcaneLight);
	} else if (v === 4) {
		ellipse(c, 16, 17, 13, 12, K.nightShade);
		ellipse(c, 16, 17, 11, 10, C.ghostShade);
		const p = [
			[8, 25],
			[7, 14],
			[12, 6],
			[20, 6],
			[25, 14],
			[24, 25],
		];
		poly(
			c,
			p.map(([x, y]) => [x, y + 1]),
			C.ink
		);
		poly(c, p, C.stoneShade);
		poly(
			c,
			[
				[9, 24],
				[8, 15],
				[13, 8],
				[19, 8],
				[23, 15],
				[22, 24],
			],
			C.stoneMid
		);
		poly(
			c,
			[
				[11, 12],
				[14, 9],
				[18, 9],
				[18, 13],
				[12, 14],
			],
			C.stone
		);
		// an eye-like glowing rune
		ellipse(c, 16, 17, 4, 3, C.tealShade);
		ellipse(c, 16, 17, 2, 2, C.teal);
		set(c, 16, 17, C.tealLight);
		rect(c, 12, 22, 8, 1, C.ghost);
		sparkle(c, 5, 10, C.ghostLight, C.ghost);
		sparkle(c, 27, 22, C.ghostLight, C.ghost);
	} else {
		for (const [x, y, w] of [
			[9, 17, 7],
			[21, 14, 6],
			[17, 24, 5],
		]) {
			rect(c, x - 1, y, 3, 8, C.ink);
			rect(c, x, y, 2, 8, C.creamShade);
			rect(c, x, y, 1, 8, C.cream);
			ellipse(c, x, y, w + 1, 5, C.ink);
			ellipse(c, x, y - 1, w, 4, C.arcaneShade);
			ellipse(c, x - 1, y - 2, w - 2, 3, C.arcane);
			set(c, x - 3, y - 3, C.arcaneLight);
			set(c, x + 1, y - 2, C.creamLight);
			set(c, x - 1, y, C.creamLight);
			set(c, x + 3, y - 1, C.creamLight);
		}
		sparkle(c, 5, 6, C.ghostLight, C.ghost);
		sparkle(c, 27, 6, C.ghostLight, C.ghost);
	}
}

/**
 * Draws a tile.
 * @param {boolean} blocked
 * @param {number} variant
 * @returns {Canvas}
 */
function tile(blocked, variant) {
	const c = createCanvas(SIZE, SIZE);
	const r = seededRandom(
		(8231 + variant * 73471 + (blocked ? 376031 : 0)) >>> 0
	);
	const charmed = blocked ? variant >= 3 : variant >= 4;
	ground(c, r, charmed);
	if (blocked) {
		obstacle(c, variant, r);
	} else {
		scatter(c, r, variant);
	}
	return c;
}

/**
 * One 32×32 plot of this biome. Buildable variants 0-3 and impassable 0-2 are the worldly meadow, the rest the charmed twilight.
 * @param {boolean} blocked - An impassable plot
 * @param {number} variant - 0-7 for a buildable plot, 0-5 for an impassable one
 * @returns {Canvas}
 */
export function drawBiomeTile(blocked, variant) {
	return tile(blocked, variant);
}

/**
 * Which tile each plot of the example mat uses, row by row.
 * @returns {{ blocked: boolean, variant: number }[][]}
 */
export function matPlacement() {
	return LAYOUT.map((row, y) =>
		[...row].map((ch, x) => {
			const blocked = ch === 'X';
			const hash =
				((y + 1) * 193 +
					(x + 1) * 389 +
					(y + 1) * (x + 3) * 71 +
					(y * y + x * x) * 43) >>>
				0;
			const base = isCharmed(y, x) ? (blocked ? 3 : 4) : 0;
			return { blocked, variant: base + (hash % (blocked ? 3 : 4)) };
		})
	);
}

/**
 * Draws the shimmering veil along its path.
 * @param {Canvas} mat
 */
function drawVeil(mat) {
	for (let i = 0; i + 1 < VEIL_PATH.length; i++) {
		const [x0, y0] = VEIL_PATH[i];
		const [x1, y1] = VEIL_PATH[i + 1];
		const length = Math.abs(x1 - x0) + Math.abs(y1 - y0);
		for (let t = 0; t < length; t++) {
			const x = x0 + Math.sign(x1 - x0) * t;
			const y = y0 + Math.sign(y1 - y0) * t;
			const vertical = x0 === x1;
			const pale = t % 6 < 3 ? C.ghostLight : C.arcaneLight;
			const edge = t % 6 < 3 ? C.arcane : C.ghost;
			if (vertical) {
				set(mat, x - 2, y, edge);
				set(mat, x - 1, y, pale);
				set(mat, x, y, pale);
				set(mat, x + 1, y, edge);
			} else {
				set(mat, x, y - 2, edge);
				set(mat, x, y - 1, pale);
				set(mat, x, y, pale);
				set(mat, x, y + 1, edge);
			}
		}
	}
	for (const [x, y] of [
		[192, 40],
		[192, 120],
		[150, 192],
		[96, 240],
	]) {
		sparkle(mat, x, y, C.white, C.arcaneLight);
	}
}

/**
 * Draws a small printed pocket-universe benefit icon, 14 pixels across, centred on a point.
 * @param {Canvas} mat
 * @param {'tech' | 'die' | 'building'} kind
 * @param {number} cx
 * @param {number} cy
 */
function drawIcon(mat, kind, cx, cy) {
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
 * The example mat, composed from this biome's tiles on its printed layout, with the veil and the three pocket icons drawn over it.
 * @returns {Canvas}
 */
export function drawBiomeMat() {
	const mat = createCanvas(LAYOUT[0].length * SIZE, LAYOUT.length * SIZE);
	matPlacement().forEach((row, y) =>
		row.forEach(({ blocked, variant }, x) => {
			tile(blocked, variant).p.forEach((col, i) => {
				set(
					mat,
					x * SIZE + (i % SIZE),
					y * SIZE + Math.floor(i / SIZE),
					col
				);
			});
		})
	);
	drawVeil(mat);
	drawIcon(mat, 'tech', 8 * SIZE + 16, 1 * SIZE + 16);
	drawIcon(mat, 'die', 8 * SIZE + 16, 5 * SIZE);
	drawIcon(mat, 'building', 5 * SIZE + 16, 8 * SIZE + 16);
	return mat;
}
