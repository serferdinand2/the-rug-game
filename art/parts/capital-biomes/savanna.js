// Capital terrain for the Savanna advanced mat (#6): 32×32 plots and the example mat on its printed layout.
import { createCanvas, rect, set, line, seededRandom } from '../../painter.js';
import { PALETTE as C } from '../../palette.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */
/** @typedef {() => number} Random */

const SIZE = 32;

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

/** Colours for this biome only. */
const K = {
	dust: C.savannaDust,
	dustLight: C.savannaDustLight,
	dustShade: C.savannaDustShade,
	gold: C.savannaGold,
	goldLight: C.savannaGoldLight,
	goldShade: C.savannaGoldShade,
	dryBlade: C.savannaDryBlade,
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
 * Grey dust or golden grass: the ground texture.
 * @param {Canvas} c
 * @param {Random} r
 * @param {boolean} grey
 */
function ground(c, r, grey) {
	const [base, light, dark] = grey
		? [K.dust, K.dustLight, K.dustShade]
		: [K.gold, K.goldLight, K.goldShade];
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
		set(
			c,
			int(r, 1, 30),
			int(r, 1, 30),
			i % 4 === 0 ? dark : grey ? K.dustLight : K.dryBlade
		);
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
 * A tuft of grass blades.
 * @param {Canvas} c
 * @param {number} x
 * @param {number} y
 * @param {Colour} a
 * @param {Colour} b
 */
function tuft(c, x, y, a, b) {
	set(c, x, y, a);
	set(c, x - 1, y - 1, a);
	set(c, x + 1, y - 1, b);
	set(c, x, y - 2, b);
	set(c, x - 1, y - 3, b);
	set(c, x + 1, y - 3, a);
}

/**
 * Light scatter on a buildable plot; calm enough for a building to read on top.
 * @param {Canvas} c
 * @param {Random} r
 * @param {number} v
 */
function scatter(c, r, v) {
	if (v === 0) {
		for (let i = 0; i < 7; i++) {
			const x = int(r, 3, 27);
			const y = int(r, 3, 27);
			rect(c, x, y, 2, 1, K.dustShade);
			set(c, x, y - 1, K.dustLight);
		}
	} else if (v === 1) {
		for (let k = 0; k < 2; k++) {
			let x = int(r, 3, 12) + k * 12;
			let y = int(r, 4, 10) + k * 12;
			for (let j = 0; j < 9; j++) {
				set(c, x, y, K.dustShade);
				x += r() > 0.4 ? 1 : 0;
				y += 1;
				if (r() > 0.6) {
					set(c, x + 1, y, K.dustShade);
				}
			}
		}
	} else if (v === 2) {
		for (let i = 0; i < 5; i++) {
			tuft(c, int(r, 3, 28), int(r, 5, 29), K.goldShade, K.dryBlade);
		}
	} else if (v === 3) {
		for (let i = 0; i < 4; i++) {
			const x = int(r, 3, 26);
			const y = int(r, 4, 26);
			rect(c, x, y, 3, 2, C.stoneShade);
			rect(c, x, y, 2, 1, C.stoneLight);
		}
		line(c, 6, 24, 12, 22, C.timber);
		line(c, 9, 23, 10, 20, C.timberShade);
	} else if (v === 4) {
		for (let i = 0; i < 9; i++) {
			tuft(
				c,
				int(r, 3, 28),
				int(r, 5, 29),
				i % 2 ? C.grassShade : K.goldShade,
				i % 3 ? K.dryBlade : C.grass
			);
		}
	} else if (v === 5) {
		for (let i = 0; i < 5; i++) {
			tuft(c, int(r, 3, 28), int(r, 5, 29), K.goldShade, C.grass);
		}
		for (let i = 0; i < 5; i++) {
			const x = int(r, 3, 28);
			const y = int(r, 3, 28);
			set(c, x, y, i % 2 ? C.brickRedLight : C.creamLight);
			set(c, x + 1, y, i % 2 ? C.brickRed : C.gold);
		}
	} else if (v === 6) {
		for (let i = 0; i < 5; i++) {
			const x = int(r, 4, 27);
			const y = int(r, 8, 29);
			for (let k = -2; k <= 2; k++) {
				line(
					c,
					x,
					y,
					x + k,
					y - 5 + Math.abs(k),
					k % 2 ? K.goldShade : K.dryBlade
				);
			}
			set(c, x, y - 6, C.amber);
		}
	} else {
		const x = int(r, 8, 20);
		const y = int(r, 10, 20);
		ellipse(c, x, y + 2, 5, 3, K.goldShade);
		ellipse(c, x, y, 5, 3, C.grassShade);
		ellipse(c, x - 1, y - 1, 3, 2, C.grass);
		set(c, x - 2, y - 2, C.grassLight);
		for (let i = 0; i < 4; i++) {
			tuft(c, int(r, 3, 28), int(r, 5, 29), K.goldShade, K.dryBlade);
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
			[6, 21],
			[8, 12],
			[15, 7],
			[23, 10],
			[27, 18],
			[24, 25],
			[11, 26],
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
				[8, 13],
				[15, 8],
				[22, 11],
				[18, 15],
				[10, 17],
			],
			C.stone
		);
		poly(
			c,
			[
				[10, 13],
				[15, 9],
				[19, 11],
				[14, 14],
			],
			C.stoneLight
		);
		poly(
			c,
			[
				[19, 16],
				[25, 18],
				[23, 24],
				[17, 23],
			],
			C.stoneMid
		);
	} else if (v === 1) {
		poly(
			c,
			[
				[5, 27],
				[10, 14],
				[13, 8],
				[19, 8],
				[22, 14],
				[27, 27],
			],
			C.ink
		);
		poly(
			c,
			[
				[6, 26],
				[11, 15],
				[14, 9],
				[18, 9],
				[21, 15],
				[26, 26],
			],
			C.timber
		);
		poly(
			c,
			[
				[11, 15],
				[14, 9],
				[17, 9],
				[15, 16],
				[12, 23],
			],
			C.timberLight
		);
		poly(
			c,
			[
				[19, 12],
				[21, 15],
				[26, 26],
				[20, 26],
			],
			C.timberShade
		);
		for (const [x, y] of [
			[13, 20],
			[17, 17],
			[20, 22],
			[10, 24],
		]) {
			rect(c, x, y, 3, 1, C.timberShade);
		}
		rect(c, 15, 9, 2, 1, C.timberShade);
	} else if (v === 2) {
		ellipse(c, 16, 17, 12, 9, C.ink);
		ellipse(c, 16, 16, 11, 8, C.pineShade);
		ellipse(c, 14, 14, 8, 5, C.pine);
		ellipse(c, 12, 12, 4, 2, C.pineLight);
		for (let i = 0; i < 16; i++) {
			const a = (i / 16) * Math.PI * 2;
			set(
				c,
				Math.round(16 + Math.cos(a) * 12),
				Math.round(16 + Math.sin(a) * 9),
				C.creamShade
			);
			set(
				c,
				Math.round(16 + Math.cos(a) * 10),
				Math.round(16 + Math.sin(a) * 7),
				C.creamLight
			);
		}
		for (let i = 0; i < 4; i++) {
			set(c, int(r, 9, 22), int(r, 11, 20), C.brickRedLight);
		}
	} else if (v === 3) {
		poly(
			c,
			[
				[2, 17],
				[5, 12],
				[24, 11],
				[29, 15],
				[27, 22],
				[6, 23],
			],
			C.ink
		);
		poly(
			c,
			[
				[3, 17],
				[6, 13],
				[24, 12],
				[28, 15],
				[26, 21],
				[7, 22],
			],
			C.timber
		);
		poly(
			c,
			[
				[5, 16],
				[8, 14],
				[24, 13],
				[27, 15],
				[18, 17],
				[7, 18],
			],
			C.timberLight
		);
		ellipse(c, 27, 17, 2, 3, C.creamShade);
		set(c, 27, 17, C.timberShade);
		for (let x = 9; x < 23; x += 4) {
			rect(c, x, 19, 1, 2, C.timberShade);
		}
		line(c, 10, 25, 20, 27, C.timberShade);
	} else if (v === 4) {
		ellipse(c, 17, 18, 13, 12, C.ink);
		ellipse(c, 16, 16, 12, 11, C.pineShade);
		ellipse(c, 14, 14, 9, 8, C.pine);
		ellipse(c, 12, 12, 6, 5, C.pineLight);
		ellipse(c, 16, 17, 3, 3, C.timber);
		set(c, 15, 16, C.timberLight);
		for (const [x, y] of [
			[8, 9],
			[20, 8],
			[24, 16],
			[12, 22],
			[19, 23],
			[6, 17],
		]) {
			rect(c, x, y, 3, 1, C.grassLight);
		}
	} else {
		for (const [x, y, s] of [
			[5, 15, 9],
			[15, 9, 11],
			[14, 19, 10],
			[21, 15, 7],
		]) {
			poly(
				c,
				[
					[x, y + s - 3],
					[x + 2, y + 1],
					[x + s - 2, y],
					[x + s + 1, y + s - 4],
					[x + s - 3, y + s],
				],
				C.ink
			);
			poly(
				c,
				[
					[x + 1, y + s - 3],
					[x + 3, y + 2],
					[x + s - 3, y + 1],
					[x + s, y + s - 4],
					[x + s - 3, y + s - 1],
				],
				C.stoneShade
			);
			poly(
				c,
				[
					[x + 3, y + 3],
					[x + s - 3, y + 2],
					[x + s - 4, y + 5],
					[x + 3, y + 6],
				],
				C.stoneLight
			);
		}
	}
}

/**
 * Draws a unicorn herd's unicorn over a plot: cream, with a gold horn and an arcane mane.
 * @param {Canvas} c
 */
function unicorn(c) {
	ellipse(c, 16, 26, 11, 3, K.goldShade);
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
 * Draws a tile; variant -1 with `herd` is the unicorn's plot.
 * @param {boolean} blocked
 * @param {number} variant
 * @param {boolean} herd
 * @returns {Canvas}
 */
function tile(blocked, variant, herd) {
	const c = createCanvas(SIZE, SIZE);
	const r = seededRandom(
		(7717 + (herd ? 99 : variant) * 73471 + (blocked ? 376031 : 0)) >>> 0
	);
	ground(c, r, !blocked && variant < 4);
	if (herd) {
		unicorn(c);
	} else if (blocked) {
		obstacle(c, variant, r);
	} else {
		scatter(c, r, variant);
	}
	return c;
}

/**
 * One 32×32 plot of this biome. Buildable variants 0-3 are the grey plots between the districts, 4-7 district plots.
 * @param {boolean} blocked - An impassable plot
 * @param {number} variant - 0-7 for a buildable plot, 0-5 for an impassable one
 * @returns {Canvas}
 */
export function drawBiomeTile(blocked, variant) {
	return tile(blocked, variant, false);
}

/**
 * Which tile each plot of the example mat uses, row by row. A `herd` plot is a unicorn drawn over district ground.
 * @returns {{ blocked: boolean, variant: number, herd: boolean }[][]}
 */
export function matPlacement() {
	return LAYOUT.map((row, y) =>
		[...row].map((ch, x) => {
			const blocked = ch === 'X';
			const herd = UNICORNS.some(([ur, uc]) => ur === y && uc === x);
			const hash =
				((y + 1) * 193 +
					(x + 1) * 389 +
					(y + 1) * (x + 3) * 71 +
					(y * y + x * x) * 43) >>>
				0;
			if (blocked) {
				return { blocked, variant: hash % 6, herd };
			}
			return {
				blocked,
				variant: (DISTRICTS[y][x] === '.' ? 0 : 4) + (hash % 4),
				herd,
			};
		})
	);
}

/**
 * The example mat, composed from this biome's tiles on its printed layout, with the unicorn herds on their plots.
 * @returns {Canvas}
 */
export function drawBiomeMat() {
	const mat = createCanvas(LAYOUT[0].length * SIZE, LAYOUT.length * SIZE);
	matPlacement().forEach((row, y) =>
		row.forEach(({ blocked, variant, herd }, x) => {
			tile(blocked, variant, herd).p.forEach((col, i) => {
				set(
					mat,
					x * SIZE + (i % SIZE),
					y * SIZE + Math.floor(i / SIZE),
					col
				);
			});
		})
	);
	// District borders: a thin brass line where a district meets a plot outside it.
	for (let y = 0; y < DISTRICTS.length; y++) {
		for (let x = 0; x < DISTRICTS[0].length; x++) {
			const d = DISTRICTS[y][x];
			if (d === '.') {
				continue;
			}
			if (DISTRICTS[y][x + 1] !== d) {
				rect(mat, x * SIZE + 31, y * SIZE, 1, SIZE, C.brass);
			}
			if (DISTRICTS[y][x - 1] !== d) {
				rect(mat, x * SIZE, y * SIZE, 1, SIZE, C.brass);
			}
			if (DISTRICTS[y + 1]?.[x] !== d) {
				rect(mat, x * SIZE, y * SIZE + 31, SIZE, 1, C.brass);
			}
			if (DISTRICTS[y - 1]?.[x] !== d) {
				rect(mat, x * SIZE, y * SIZE, SIZE, 1, C.brass);
			}
		}
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
		open: Object.freeze([]),
		blocked: Object.freeze([0, 1, 2, 3, 4, 5]),
	}),
	special: Object.freeze([
		Object.freeze({
			blocked: false,
			variants: Object.freeze([0, 1, 2, 3]),
			meaning:
				"Grey ground: open plots outside every district (DISTRICTS is '.')",
		}),
		Object.freeze({
			blocked: false,
			variants: Object.freeze([4, 5, 6, 7]),
			meaning:
				'District ground: open plots inside a district (DISTRICTS is 1-6)',
		}),
	]),
	matOnly: Object.freeze([
		Object.freeze({
			name: 'unicorns',
			where: 'A unicorn herd drawn over district ground on each UNICORNS plot (an impassable plot, so its blocked tile is replaced by the herd)',
		}),
		Object.freeze({
			name: 'district borders',
			where: 'A one-pixel brass line round each district of DISTRICTS, on the outer edge of its plots',
		}),
	]),
});
