// Original modular terrain for 9×9 capital mats; source layout: research/01-base-core-rules.md §6.2.
// Pixel art uses the project's existing palette and painter, without SVG hand edits.
import { createCanvas, rect, set, seededRandom } from '../painter.js';
import { PALETTE as C } from '../palette.js';
/** @typedef {'mountain' | 'wetland' | 'tropical' | 'desert' | 'grassland' | 'forest'} Biome */
/** @typedef {import('../painter.js').Canvas} Canvas */
/** @typedef {import('../painter.js').Colour} Colour */
/** @typedef {() => number} Random */
/** @typedef {(x: number, y: number, colour: Colour) => void} DotPainter */
/** @typedef {(x: number, y: number, width: number, height: number, colour: Colour) => void} FillPainter */
/** @typedef {(points: number[][], colour: Colour, dx?: number, dy?: number) => void} PolygonPainter */

export const PLOT_SIZE = 32;
export const OPEN_VARIANTS = 8;
export const BLOCKED_VARIANTS = 6;

/** @type {Readonly<Record<Biome, readonly string[]>>} */
// Canonical base-mat masks: rows top-to-bottom, 1 = impassable, 0 = buildable.
export const CAPITAL_GRIDS = Object.freeze({
	mountain: [
		'000000000',
		'110001110',
		'000111000',
		'000111110',
		'000001100',
		'011100001',
		'001000000',
		'000000010',
		'001000000',
	],
	wetland: [
		'000000001',
		'110000111',
		'000000000',
		'011100110',
		'001100000',
		'111000010',
		'000001100',
		'011000000',
		'000001000',
	],
	tropical: [
		'000010011',
		'000100011',
		'001000001',
		'000000000',
		'010001000',
		'000000000',
		'101101010',
		'011110000',
		'001110000',
	],
	desert: [
		'000110000',
		'101000000',
		'100000110',
		'000000000',
		'010010011',
		'011000001',
		'011111000',
		'001100000',
		'000001000',
	],
	grassland: [
		'000000000',
		'111000010',
		'111100000',
		'000111100',
		'000000111',
		'111000001',
		'001000000',
		'000000100',
		'000001000',
	],
	forest: [
		'000000000',
		'001100100',
		'000100010',
		'011000001',
		'000100000',
		'001111100',
		'010000100',
		'001000111',
		'000000011',
	],
});

// Public API for a library tile and for an entire canonical 288×288 capital board.
/**
 * Draws one deterministic terrain tile onto a canvas.
 * @param {Canvas} canvas
 * @param {{ biome: Biome, variant?: number, blocked?: boolean, x?: number, y?: number }} options
 */
export function drawCapitalTile(canvas, options) {
	const { biome, variant = 0, blocked = false, x = 0, y = 0 } = options;
	if (!(biome in CAPITAL_GRIDS))
		throw new Error(`Unknown capital biome: ${biome}`);
	const n = blocked ? BLOCKED_VARIANTS : OPEN_VARIANTS;
	const tileVariant = ((variant % n) + n) % n;
	const seed =
		(2119 +
			[...biome].reduce((a, s) => a * 33 + s.charCodeAt(0), 0) +
			tileVariant * 73471 +
			(blocked ? 376031 : 0)) >>>
		0;
	const random = seededRandom(seed);
	/** @type {DotPainter} */
	const dot = (a, b, col) => set(canvas, x + a, y + b, col);
	/** @type {FillPainter} */
	const fill = (a, b, w, h, col) => rect(canvas, x + a, y + b, w, h, col);
	/** @type {PolygonPainter} */
	const poly = (points, col, dx = 0, dy = 0) =>
		polygon(
			canvas,
			points.map(([a, b]) => [x + a + dx, y + b + dy]),
			col
		);

	drawGround(biome, random, dot, fill, poly);
	if (blocked) drawObstacle(biome, tileVariant, random, dot, fill, poly);
	else drawScattered(biome, tileVariant, random, dot, fill, poly);
}

/** @param {Biome} biome @param {boolean} blocked @param {number} variant @returns {Canvas} */
export function drawTile(biome, blocked, variant) {
	const tile = createCanvas(PLOT_SIZE, PLOT_SIZE);
	drawCapitalTile(tile, { biome, blocked, variant });
	return tile;
}

/** @param {Biome} biome @returns {Canvas} */
export function drawCapitalMat(biome) {
	const rows = CAPITAL_GRIDS[biome];
	if (!rows) throw new Error(`Unknown capital mat: ${biome}`);
	const canvas = createCanvas(9 * PLOT_SIZE, 9 * PLOT_SIZE);
	for (let row = 0; row < 9; row++)
		for (let col = 0; col < 9; col++) {
			const blocked = rows[row][col] === '1';
			// Chosen deterministically; nearby plots don't all reuse the same motif.
			const hash =
				((row + 1) * 193 +
					(col + 1) * 389 +
					(row + 1) * (col + 3) * 71 +
					(row * row + col * col) * 43) >>>
				0;
			const variant = hash % (blocked ? BLOCKED_VARIANTS : OPEN_VARIANTS);
			drawCapitalTile(canvas, {
				biome,
				blocked,
				variant,
				x: col * PLOT_SIZE,
				y: row * PLOT_SIZE,
			});
		}
	return canvas;
}

/** Fill polygons with hard-edged pixel geometry, no gradients or antialiasing. */
/** @param {Canvas} c @param {number[][]} pts @param {Colour} col */
function polygon(c, pts, col) {
	const xx = pts.map((p) => p[0]);
	const yy = pts.map((p) => p[1]);
	for (
		let y = Math.floor(Math.min(...yy));
		y < Math.ceil(Math.max(...yy));
		y++
	) {
		for (
			let x = Math.floor(Math.min(...xx));
			x < Math.ceil(Math.max(...xx));
			x++
		) {
			const px = x + 0.5,
				py = y + 0.5;
			let inside = false;
			for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
				const a = pts[i],
					b = pts[j];
				if (
					a[1] > py !== b[1] > py &&
					px < ((b[0] - a[0]) * (py - a[1])) / (b[1] - a[1]) + a[0]
				)
					inside = !inside;
			}
			if (inside) set(c, x, y, col);
		}
	}
}
/** @template T @param {Random} r @param {T[]} a @returns {T} */
function choice(r, a) {
	return a[Math.floor(r() * a.length)];
}
/** @param {Random} r @param {number} a @param {number} b @returns {number} */
function rngInt(r, a, b) {
	return a + Math.floor(r() * (b - a + 1));
}

/** @param {Biome} biome @param {Random} r @param {DotPainter} dot @param {FillPainter} fill @param {PolygonPainter} poly */
function drawGround(biome, r, dot, fill, poly) {
	const beds = {
		mountain: [C.stoneMid, C.stone, C.stoneShade, C.stoneLight],
		wetland: [
			C.forestFloorShade,
			C.forestFloor,
			C.pineShade,
			C.forestFloorLight,
		],
		tropical: [C.pineShade, C.forestFloor, C.pine, C.grass],
		desert: [C.sand, C.sandLight, C.sandShade, C.brass],
		grassland: [C.grass, C.grassLight, C.grassShade, C.forestFloorLight],
		forest: [C.forestFloor, C.forestFloorShade, C.pine, C.pineLight],
	};
	const [base, light, dark, detail] = beds[biome];
	fill(0, 0, 32, 32, base);
	// Larger coherent, low-contrast patches read as soil without repeating a texture tile.
	for (let i = 0; i < 11; i++) {
		const tx = rngInt(r, 1, 28),
			ty = rngInt(r, 1, 28);
		fill(
			tx,
			ty,
			rngInt(r, 2, 5),
			rngInt(r, 1, 4),
			i % 3 === 0 ? dark : light
		);
	}
	for (let i = 0; i < 38; i++) {
		dot(rngInt(r, 1, 30), rngInt(r, 1, 30), i % 4 === 0 ? dark : detail);
	}
	// Distinctive edge pixels soften the hard 32-pixel repeat when assembled.
	for (let i = 0; i < 13; i++) {
		let a = rngInt(r, 0, 31),
			b = rngInt(r, 0, 31);
		if (r() > 0.5) a = r() > 0.5 ? 0 : 31;
		else b = r() > 0.5 ? 0 : 31;
		dot(a, b, i % 2 ? light : base);
	}
	if (biome === 'desert')
		for (let k = 0; k < 4; k++) {
			const yy = 4 + k * 7 + rngInt(r, -1, 1),
				xx = rngInt(r, 1, 8);
			for (let j = 0; j < 14; j++)
				if (j % 6 !== 5)
					dot(
						xx + j,
						yy + Math.round(1.4 * Math.sin(j * 0.43 + k)),
						k % 2 ? C.sandLight : C.sandShade
					);
		}
	if (biome === 'wetland')
		for (let i = 0; i < 4; i++) {
			let xx = rngInt(r, 1, 24),
				yy = rngInt(r, 1, 25);
			fill(xx, yy, 6, 2, C.nightSea2);
			fill(xx + 1, yy, 3, 1, C.nightSea1);
		}
	if (biome === 'forest')
		for (let i = 0; i < 8; i++) {
			const xx = rngInt(r, 2, 28),
				yy = rngInt(r, 2, 28);
			dot(xx, yy, C.timberShade);
			dot(xx + 1, yy + 1, C.grassShade);
		}
	if (biome === 'mountain')
		for (let i = 0; i < 7; i++) {
			const xx = rngInt(r, 1, 28),
				yy = rngInt(r, 1, 28);
			fill(xx, yy, 3, 1, C.stoneShade);
			dot(xx, yy - 1, C.stoneLight);
		}
}
/** @param {Random} r @param {DotPainter} dot @param {FillPainter} fill @param {number} [num] @param {Colour[]} [palette] */
function drawGrass(
	r,
	dot,
	fill,
	num = 8,
	palette = [C.grassShade, C.grassLight]
) {
	for (let i = 0; i < num; i++) {
		const xx = rngInt(r, 3, 28),
			yy = rngInt(r, 4, 29);
		const col = choice(r, palette);
		dot(xx, yy, col);
		dot(xx - 1, yy - 1, col);
		dot(xx + 1, yy - 2, col);
		if (r() > 0.75) {
			dot(xx, yy - 2, C.gold);
			dot(xx + 1, yy - 1, C.creamLight);
		}
	}
}
/** @param {Biome} biome @param {number} v @param {Random} r @param {DotPainter} dot @param {FillPainter} fill @param {PolygonPainter} poly */
function drawScattered(biome, v, r, dot, fill, poly) {
	if (biome === 'grassland') {
		drawGrass(r, dot, fill, 11);
		if (v % 3 === 0) {
			poly(
				[
					[8, 10],
					[13, 8],
					[16, 11],
					[14, 14],
					[9, 14],
				],
				C.grassShade
			);
			fill(11, 9, 3, 2, C.grassLight);
		}
	} else if (biome === 'mountain') {
		for (let i = 0; i < 4; i++) {
			const a = rngInt(r, 3, 24),
				b = rngInt(r, 5, 25),
				s = rngInt(r, 3, 6);
			poly(
				[
					[a, b + 1],
					[a + 2, b - 1],
					[a + s, b + 1],
					[a + s + 1, b + 3],
					[a + 2, b + 4],
				],
				C.stoneShade
			);
			poly(
				[
					[a + 1, b + 1],
					[a + 2, b],
					[a + s - 1, b + 1],
					[a + s, b + 2],
					[a + 2, b + 3],
				],
				C.stoneLight
			);
			dot(a + 2, b, C.snowShade);
		}
		drawGrass(r, dot, fill, 3, [C.pineShade, C.grass]);
	} else if (biome === 'wetland') {
		for (let i = 0; i < 7; i++) {
			const a = rngInt(r, 3, 28),
				b = rngInt(r, 5, 26);
			fill(a, b - 3, 1, 5, C.pineShade);
			dot(a - 1, b - 3, C.grassLight);
			dot(a + 1, b - 2, C.forestFloorLight);
			if (i % 3 === 0) fill(a + 1, b, 2, 1, C.gold);
		}
	} else if (biome === 'tropical') {
		for (let i = 0; i < 6; i++) {
			const a = rngInt(r, 4, 27),
				b = rngInt(r, 5, 27);
			leaf(
				poly,
				a,
				b,
				rngInt(r, 3, 6),
				i % 2 === 0 ? C.pineLight : C.grassLight,
				C.pineShade
			);
		}
		if (v % 2 === 0) {
			dot(rngInt(r, 5, 24), rngInt(r, 6, 24), C.brickRedLight);
			dot(rngInt(r, 5, 24), rngInt(r, 6, 24), C.gold);
		}
	} else if (biome === 'desert') {
		if (v % 4 === 0) {
			const a = rngInt(r, 9, 19),
				b = rngInt(r, 8, 21);
			fill(a, b - 3, 2, 9, C.pineShade);
			fill(a - 2, b - 2, 2, 2, C.pine);
			fill(a + 2, b, 3, 2, C.pine);
			dot(a, b - 3, C.pineLight);
		}
		for (let i = 0; i < 5; i++) {
			const a = rngInt(r, 2, 28),
				b = rngInt(r, 3, 28);
			dot(a, b, C.sandShade);
			dot(a + 1, b, C.sandLight);
		}
	} else if (biome === 'forest') {
		drawGrass(r, dot, fill, 6, [C.pine, C.pineLight]);
		for (let i = 0; i < 4; i++) {
			const a = rngInt(r, 3, 27),
				b = rngInt(r, 4, 26);
			fill(a, b, 3, 1, C.timber);
			dot(a + 1, b, C.timberLight);
			if (i % 2 === 0) {
				fill(a + 3, b - 1, 2, 2, C.creamLight);
				dot(a + 4, b - 1, C.brickRedShade);
			}
		}
	}
}
/** @param {PolygonPainter} poly @param {number} x @param {number} y @param {number} s @param {Colour} bright @param {Colour} dark */
function leaf(poly, x, y, s, bright, dark) {
	poly(
		[
			[x, y - s],
			[x + s, y - 1],
			[x + s - 1, y + 2],
			[x, y + s - 1],
			[x - s, y + 1],
			[x - s + 1, y - 2],
		],
		dark
	);
	poly(
		[
			[x, y - s + 1],
			[x + s - 1, y - 1],
			[x + 1, y],
			[x, y + 1],
			[x - s + 2, y + 1],
		],
		bright
	);
}
/** @param {PolygonPainter} poly @param {DotPainter} dot @param {number} v @param {Random} r @param {boolean} [large] */
function rock(poly, dot, v, r, large = true) {
	const a = large ? rngInt(r, 3, 6) : rngInt(r, 9, 12),
		b = large ? rngInt(r, 3, 6) : rngInt(r, 10, 12);
	const pts = [
		[a + 5, b],
		[a + 15, b + 1],
		[a + 23, b + 8],
		[a + 25, b + 18],
		[a + 19, b + 25],
		[a + 5, b + 26],
		[a - 1, b + 19],
		[a, b + 9],
	];
	poly(pts, C.ink, 0, 1);
	poly(pts, C.stoneShade);
	poly(
		[
			[a + 5, b + 1],
			[a + 15, b + 2],
			[a + 21, b + 9],
			[a + 14, b + 14],
			[a + 3, b + 13],
			[a, b + 9],
		],
		C.stone
	);
	poly(
		[
			[a + 5, b + 2],
			[a + 13, b + 2],
			[a + 17, b + 6],
			[a + 9, b + 9],
			[a + 3, b + 8],
		],
		C.stoneLight
	);
	poly(
		[
			[a + 15, b + 14],
			[a + 22, b + 10],
			[a + 22, b + 18],
			[a + 18, b + 23],
			[a + 9, b + 23],
		],
		C.stoneMid
	);
	poly(
		[
			[a + 12, b + 8],
			[a + 11, b + 14],
			[a + 16, b + 16],
			[a + 14, b + 21],
		],
		C.stoneShade
	);
	if (v % 3 !== 1)
		poly(
			[
				[a + 5, b + 2],
				[a + 12, b + 2],
				[a + 14, b + 5],
				[a + 9, b + 6],
			],
			C.snowShade
		);
	if (v % 3 === 0)
		poly(
			[
				[a + 6, b + 2],
				[a + 10, b + 2],
				[a + 11, b + 4],
				[a + 8, b + 5],
			],
			C.snow
		);
}
/** @param {PolygonPainter} poly @param {DotPainter} dot @param {number} x @param {number} y @param {number} size @param {Colour} bright @param {Colour} mid @param {Colour} dark */
function crown(poly, dot, x, y, size, bright, mid, dark) {
	const p = [
		[x - 1, y - size],
		[x + size - 3, y - size + 2],
		[x + size, y - 3],
		[x + size - 1, y + size - 3],
		[x + 3, y + size],
		[x - size + 2, y + size - 1],
		[x - size, y + 2],
		[x - size + 1, y - size + 3],
	];
	poly(p, C.ink, 1, 2);
	poly(p, dark);
	poly(
		[
			[x - 2, y - size + 2],
			[x + size - 4, y - size + 3],
			[x + size - 2, y],
			[x + size - 5, y + size - 4],
			[x - 4, y + size - 5],
			[x - size + 2, y],
		],
		mid
	);
	poly(
		[
			[x - 3, y - size + 3],
			[x + 2, y - size + 3],
			[x + size - 5, y - 1],
			[x + 1, y + 1],
			[x - size + 4, y],
		],
		bright
	);
	dot(x + 2, y - 2, bright);
}
/** @param {Biome} biome @param {number} v @param {Random} r @param {DotPainter} dot @param {FillPainter} fill @param {PolygonPainter} poly */
/** @param {number} v @param {DotPainter} dot @param {FillPainter} fill @param {PolygonPainter} poly */
function drawForestBlockedVariant(v, dot, fill, poly) {
	if (v === 2) {
		poly(
			[
				[2, 18],
				[5, 12],
				[23, 11],
				[29, 16],
				[27, 23],
				[7, 25],
			],
			C.ink
		);
		poly(
			[
				[3, 17],
				[6, 13],
				[23, 12],
				[28, 16],
				[26, 22],
				[7, 24],
			],
			C.timber
		);
		poly(
			[
				[4, 16],
				[7, 14],
				[24, 13],
				[27, 16],
				[19, 18],
				[7, 19],
			],
			C.timberLight
		);
		poly(
			[
				[25, 16],
				[27, 17],
				[26, 20],
				[24, 19],
			],
			C.creamShade
		);
		for (let x = 8; x < 22; x += 5)
			fill(x, 20 + (x % 3), 1, 3, C.timberShade);
		dot(9, 12, C.grassLight);
		dot(10, 11, C.brickRedLight);
	} else if (v === 3) {
		poly(
			[
				[4, 23],
				[8, 19],
				[10, 9],
				[13, 6],
				[21, 7],
				[24, 11],
				[25, 20],
				[29, 24],
				[23, 27],
				[7, 27],
			],
			C.ink
		);
		poly(
			[
				[5, 22],
				[9, 19],
				[11, 10],
				[14, 7],
				[20, 8],
				[23, 12],
				[24, 21],
				[27, 23],
				[22, 26],
				[8, 26],
			],
			C.timber
		);
		poly(
			[
				[11, 10],
				[14, 7],
				[20, 8],
				[23, 12],
				[20, 15],
				[13, 14],
			],
			C.timberLight
		);
		poly(
			[
				[13, 10],
				[15, 9],
				[19, 10],
				[21, 12],
				[19, 13],
				[14, 12],
			],
			C.creamShade
		);
		for (let y = 15; y < 24; y += 4) fill(11, y, 2, 2, C.timberShade);
	} else if (v === 4) {
		poly(
			[
				[3, 17],
				[8, 12],
				[15, 10],
				[23, 13],
				[28, 20],
				[25, 26],
				[8, 25],
			],
			C.ink
		);
		poly(
			[
				[4, 17],
				[9, 13],
				[15, 11],
				[22, 14],
				[27, 20],
				[24, 25],
				[9, 24],
			],
			C.stoneShade
		);
		poly(
			[
				[7, 16],
				[12, 13],
				[18, 14],
				[21, 18],
				[15, 20],
				[9, 20],
			],
			C.pine
		);
		for (const [x, y] of [
			[3, 12],
			[8, 17],
			[13, 21],
			[18, 13],
			[23, 18],
			[27, 23],
		]) {
			fill(x, y, 3, 2, C.timber);
			fill(x + 1, y, 2, 1, C.timberLight);
		}
		for (const [x, y] of [
			[5, 10],
			[21, 11],
			[25, 14],
			[10, 24],
		])
			dot(x, y, C.grassLight);
	} else {
		poly(
			[
				[1, 11],
				[8, 5],
				[15, 8],
				[18, 5],
				[27, 8],
				[31, 15],
				[28, 24],
				[21, 28],
				[14, 25],
				[7, 28],
				[2, 22],
			],
			C.ink
		);
		poly(
			[
				[2, 11],
				[8, 6],
				[15, 9],
				[18, 6],
				[26, 9],
				[30, 15],
				[27, 23],
				[21, 27],
				[14, 24],
				[7, 27],
				[3, 22],
			],
			C.pineShade
		);
		poly(
			[
				[4, 12],
				[9, 8],
				[14, 11],
				[17, 9],
				[25, 11],
				[27, 16],
				[22, 18],
				[19, 15],
				[14, 17],
				[9, 15],
			],
			C.pineLight
		);
		poly(
			[
				[12, 17],
				[19, 15],
				[22, 19],
				[20, 25],
				[15, 26],
				[11, 22],
			],
			C.timber
		);
		poly(
			[
				[14, 18],
				[18, 17],
				[20, 20],
				[18, 24],
				[15, 24],
				[13, 21],
			],
			C.wood
		);
		fill(5, 18, 3, 8, C.timberShade);
		fill(24, 16, 3, 9, C.timberShade);
		for (const [x, y] of [
			[5, 10],
			[11, 7],
			[22, 8],
			[27, 12],
			[8, 21],
		])
			dot(x, y, C.grassLight);
	}
}

/** @param {number} v @param {DotPainter} dot @param {FillPainter} fill @param {PolygonPainter} poly */
function drawGrasslandBlockedVariant(v, dot, fill, poly) {
	if (v === 2) {
		poly(
			[
				[1, 21],
				[5, 15],
				[10, 14],
				[13, 8],
				[21, 9],
				[25, 15],
				[30, 19],
				[28, 27],
				[4, 27],
			],
			C.ink
		);
		poly(
			[
				[2, 20],
				[6, 16],
				[11, 15],
				[14, 9],
				[20, 10],
				[24, 16],
				[29, 20],
				[27, 26],
				[5, 26],
			],
			C.stoneShade
		);
		poly(
			[
				[4, 19],
				[8, 17],
				[12, 18],
				[15, 12],
				[20, 12],
				[23, 18],
				[27, 20],
				[24, 23],
				[6, 23],
			],
			C.stoneLight
		);
		poly(
			[
				[14, 12],
				[19, 12],
				[21, 16],
				[16, 17],
			],
			C.creamShade
		);
		fill(10, 21, 1, 3, C.stoneMid);
		fill(18, 18, 1, 4, C.stoneMid);
	} else if (v === 3) {
		poly(
			[
				[2, 25],
				[5, 19],
				[8, 20],
				[10, 13],
				[13, 18],
				[17, 8],
				[20, 16],
				[25, 12],
				[25, 19],
				[30, 17],
				[29, 25],
			],
			C.ink
		);
		poly(
			[
				[3, 24],
				[6, 19],
				[9, 20],
				[11, 14],
				[14, 18],
				[17, 9],
				[20, 17],
				[25, 13],
				[25, 20],
				[29, 18],
				[28, 24],
			],
			C.pineShade
		);
		poly(
			[
				[5, 22],
				[9, 19],
				[12, 20],
				[16, 13],
				[19, 19],
				[24, 16],
				[26, 22],
			],
			C.pine
		);
		for (const [x, y] of [
			[8, 17],
			[13, 15],
			[21, 16],
			[25, 19],
		])
			dot(x, y, C.brickRedLight);
		for (const [x, y] of [
			[4, 26],
			[10, 27],
			[18, 26],
			[25, 27],
		])
			fill(x, y, 2, 1, C.grassLight);
	} else if (v === 4) {
		poly(
			[
				[0, 12],
				[7, 8],
				[13, 12],
				[15, 29],
				[0, 29],
			],
			C.ink
		);
		poly(
			[
				[0, 13],
				[7, 9],
				[12, 13],
				[14, 28],
				[0, 28],
			],
			C.stoneShade
		);
		poly(
			[
				[18, 29],
				[20, 12],
				[26, 8],
				[31, 12],
				[31, 29],
			],
			C.ink
		);
		poly(
			[
				[19, 28],
				[21, 13],
				[26, 9],
				[30, 13],
				[30, 28],
			],
			C.stoneMid
		);
		fill(14, 15, 4, 14, C.forestFloorShade);
		fill(13, 20, 2, 2, C.ink);
		for (const [x, y] of [
			[3, 15],
			[6, 22],
			[23, 15],
			[27, 21],
		])
			fill(x, y, 4, 1, C.stoneLight);
	} else {
		poly(
			[
				[3, 26],
				[6, 17],
				[9, 14],
				[10, 8],
				[22, 8],
				[24, 14],
				[27, 17],
				[30, 26],
			],
			C.ink
		);
		poly(
			[
				[4, 25],
				[7, 17],
				[10, 15],
				[11, 9],
				[21, 9],
				[23, 15],
				[26, 17],
				[29, 25],
			],
			C.stoneShade
		);
		fill(10, 12, 13, 2, C.stoneLight);
		fill(8, 18, 16, 2, C.stone);
		fill(6, 23, 22, 1, C.creamShade);
		for (const [x, y] of [
			[5, 26],
			[27, 26],
			[8, 13],
			[24, 14],
		])
			dot(x, y, C.grassShade);
	}
}

/** @param {number} v @param {DotPainter} dot @param {FillPainter} fill @param {PolygonPainter} poly */
function drawDesertBlockedVariant(v, dot, fill, poly) {
	if (v === 3) {
		poly(
			[
				[3, 28],
				[4, 16],
				[8, 9],
				[13, 6],
				[22, 6],
				[28, 13],
				[29, 28],
			],
			C.ink
		);
		poly(
			[
				[4, 27],
				[5, 16],
				[9, 10],
				[13, 7],
				[21, 7],
				[27, 14],
				[28, 27],
			],
			C.sandShade
		);
		poly(
			[
				[10, 27],
				[10, 18],
				[13, 13],
				[20, 13],
				[23, 18],
				[23, 27],
			],
			C.sand
		);
		fill(7, 11, 4, 2, C.sandLight);
		fill(21, 10, 4, 2, C.brass);
		fill(3, 28, 27, 2, C.sandShade);
	} else if (v === 4) {
		poly(
			[
				[2, 27],
				[6, 19],
				[9, 14],
				[10, 8],
				[23, 8],
				[24, 14],
				[28, 20],
				[30, 27],
			],
			C.ink
		);
		poly(
			[
				[3, 26],
				[7, 19],
				[10, 14],
				[11, 9],
				[22, 9],
				[23, 14],
				[27, 20],
				[29, 26],
			],
			C.sandShade
		);
		fill(11, 10, 10, 3, C.sandLight);
		fill(8, 16, 16, 2, C.brass);
		fill(6, 21, 20, 2, C.sand);
		fill(14, 13, 1, 6, C.sandShade);
		fill(20, 12, 1, 5, C.sandShade);
	} else {
		poly(
			[
				[1, 24],
				[5, 18],
				[11, 16],
				[15, 18],
				[20, 13],
				[27, 17],
				[31, 24],
				[29, 28],
				[2, 28],
			],
			C.ink
		);
		poly(
			[
				[2, 23],
				[6, 18],
				[11, 17],
				[15, 19],
				[20, 14],
				[26, 18],
				[30, 24],
				[28, 27],
				[3, 27],
			],
			C.brass
		);
		poly(
			[
				[3, 22],
				[7, 19],
				[12, 18],
				[16, 20],
				[20, 16],
				[25, 19],
				[28, 23],
				[20, 22],
				[14, 21],
				[8, 22],
			],
			C.sandLight
		);
		for (const [x, y] of [
			[7, 25],
			[12, 24],
			[17, 25],
			[22, 22],
			[25, 24],
		])
			dot(x, y, C.sandShade);
		fill(4, 27, 24, 2, C.sandShade);
	}
}

/** @param {number} v @param {DotPainter} dot @param {FillPainter} fill @param {PolygonPainter} poly */
function drawTropicalBlockedVariant(v, dot, fill, poly) {
	if (v === 2) {
		poly(
			[
				[5, 4],
				[13, 2],
				[20, 5],
				[21, 17],
				[30, 28],
				[20, 27],
				[16, 20],
				[11, 29],
				[2, 28],
				[10, 17],
			],
			C.ink
		);
		poly(
			[
				[6, 5],
				[13, 3],
				[19, 6],
				[20, 17],
				[27, 27],
				[21, 26],
				[16, 18],
				[11, 27],
				[4, 27],
				[11, 16],
			],
			C.timber
		);
		fill(12, 6, 3, 11, C.timberLight);
		poly(
			[
				[2, 27],
				[10, 19],
				[12, 22],
				[8, 28],
			],
			C.pineLight
		);
		poly(
			[
				[19, 27],
				[22, 19],
				[25, 23],
				[29, 28],
			],
			C.pine
		);
	} else if (v === 3) {
		for (const [x, y] of [
			[8, 16],
			[15, 12],
			[22, 16],
			[12, 21],
			[20, 22],
		]) {
			poly(
				[
					[x, y - 5],
					[x + 3, y - 1],
					[x + 5, y + 2],
					[x + 2, y + 4],
					[x - 2, y + 2],
				],
				C.pine
			);
		}
		for (const [x, y] of [
			[8, 8],
			[13, 7],
			[18, 8],
			[23, 10],
			[11, 14],
			[17, 12],
			[22, 16],
		])
			dot(x, y, C.brickRedLight);
		dot(16, 17, C.gold);
		dot(17, 16, C.creamLight);
		fill(15, 19, 2, 9, C.grassShade);
	} else if (v === 4) {
		poly(
			[
				[1, 23],
				[5, 18],
				[13, 14],
				[22, 13],
				[29, 18],
				[28, 23],
				[21, 19],
				[13, 18],
				[6, 23],
			],
			C.ink
		);
		poly(
			[
				[2, 22],
				[6, 18],
				[14, 15],
				[22, 14],
				[28, 18],
				[27, 21],
				[20, 18],
				[13, 17],
				[7, 22],
			],
			C.timber
		);
		fill(8, 18, 13, 1, C.timberLight);
		for (const [x, y, dx] of [
			[7, 15, -4],
			[13, 13, 0],
			[20, 15, 5],
			[25, 18, 4],
		]) {
			poly(
				[
					[x, y],
					[x + dx, y - 8],
					[x + dx + 2, y - 6],
					[x + 2, y + 1],
				],
				C.pineLight
			);
		}
		for (const x of [5, 12, 21, 27]) dot(x, 25, C.grassLight);
	} else {
		poly(
			[
				[1, 11],
				[8, 5],
				[13, 8],
				[17, 4],
				[25, 7],
				[31, 14],
				[27, 28],
				[20, 26],
				[16, 20],
				[11, 28],
				[4, 25],
			],
			C.ink
		);
		poly(
			[
				[2, 11],
				[8, 6],
				[13, 9],
				[17, 5],
				[24, 8],
				[30, 14],
				[26, 27],
				[21, 25],
				[16, 18],
				[11, 27],
				[5, 24],
			],
			C.pineShade
		);
		poly(
			[
				[4, 11],
				[9, 8],
				[13, 11],
				[17, 8],
				[24, 10],
				[27, 15],
				[22, 16],
				[18, 13],
				[14, 16],
				[9, 14],
			],
			C.pineLight
		);
		poly(
			[
				[12, 16],
				[20, 14],
				[23, 18],
				[21, 24],
				[15, 25],
				[11, 21],
			],
			C.timber
		);
		poly(
			[
				[14, 17],
				[19, 16],
				[21, 19],
				[19, 23],
				[15, 23],
				[13, 20],
			],
			C.nightSea3
		);
		fill(6, 18, 2, 7, C.timber);
		fill(25, 17, 2, 8, C.timber);
	}
}
/** @param {Biome} biome @param {number} v @param {Random} r @param {DotPainter} dot @param {FillPainter} fill @param {PolygonPainter} poly */
function drawObstacle(biome, v, r, dot, fill, poly) {
	if (biome === 'forest' && v >= 2) {
		drawForestBlockedVariant(v, dot, fill, poly);
		return;
	}
	if (biome === 'grassland' && v >= 2) {
		drawGrasslandBlockedVariant(v, dot, fill, poly);
		return;
	}
	if (biome === 'desert' && v >= 3) {
		drawDesertBlockedVariant(v, dot, fill, poly);
		return;
	}
	if (biome === 'tropical' && v >= 2) {
		drawTropicalBlockedVariant(v, dot, fill, poly);
		return;
	}
	if (biome === 'mountain') {
		if (v === 0) rock(poly, dot, v, r);
		else if (v === 1) {
			poly(
				[
					[1, 18],
					[5, 12],
					[13, 8],
					[18, 13],
					[15, 23],
					[5, 26],
				],
				C.ink,
				0,
				2
			);
			poly(
				[
					[1, 18],
					[5, 12],
					[13, 8],
					[18, 13],
					[15, 23],
					[5, 26],
				],
				C.stoneShade
			);
			poly(
				[
					[3, 16],
					[7, 12],
					[13, 10],
					[16, 14],
					[12, 18],
				],
				C.stoneLight
			);
			poly(
				[
					[17, 10],
					[22, 6],
					[29, 12],
					[31, 21],
					[26, 26],
					[19, 23],
				],
				C.ink,
				0,
				1
			);
			poly(
				[
					[17, 10],
					[22, 6],
					[29, 12],
					[31, 21],
					[26, 26],
					[19, 23],
				],
				C.stoneMid
			);
			poly(
				[
					[20, 10],
					[22, 7],
					[28, 12],
					[26, 16],
				],
				C.snowShade
			);
			poly(
				[
					[21, 9],
					[23, 8],
					[26, 11],
				],
				C.snow
			);
		} else if (v === 2) {
			poly(
				[
					[0, 10],
					[8, 4],
					[17, 7],
					[24, 3],
					[32, 9],
					[32, 24],
					[25, 28],
					[18, 22],
					[10, 26],
					[0, 21],
				],
				C.ink,
				0,
				1
			);
			poly(
				[
					[0, 10],
					[8, 4],
					[17, 7],
					[24, 3],
					[32, 9],
					[32, 24],
					[25, 28],
					[18, 22],
					[10, 26],
					[0, 21],
				],
				C.stoneShade
			);
			poly(
				[
					[1, 10],
					[9, 5],
					[17, 8],
					[24, 4],
					[31, 9],
					[22, 15],
					[11, 14],
				],
				C.stoneLight
			);
			poly(
				[
					[7, 6],
					[10, 6],
					[13, 8],
					[11, 10],
					[8, 9],
				],
				C.snowShade
			);
			poly(
				[
					[23, 5],
					[26, 5],
					[28, 8],
					[25, 9],
				],
				C.snow
			);
			poly(
				[
					[11, 14],
					[16, 18],
					[19, 16],
					[18, 21],
					[23, 25],
				],
				C.stoneMid
			);
		} else if (v === 3) {
			// A narrow, snow-cut spire rises from a broken scree slope.
			poly(
				[
					[2, 26],
					[7, 21],
					[11, 22],
					[16, 5],
					[20, 2],
					[25, 18],
					[30, 24],
					[28, 29],
					[5, 29],
				],
				C.ink,
				0,
				1
			);
			poly(
				[
					[2, 26],
					[7, 21],
					[11, 22],
					[16, 5],
					[20, 2],
					[25, 18],
					[30, 24],
					[28, 29],
					[5, 29],
				],
				C.stoneShade
			);
			poly(
				[
					[11, 22],
					[16, 5],
					[20, 2],
					[22, 12],
					[18, 16],
					[16, 13],
				],
				C.stoneLight
			);
			poly(
				[
					[16, 5],
					[20, 2],
					[23, 13],
					[19, 11],
				],
				C.snow
			);
			poly(
				[
					[18, 17],
					[25, 18],
					[30, 24],
					[28, 27],
					[21, 24],
				],
				C.stoneMid
			);
		} else if (v === 4) {
			// A stepped twin summit with an exposed dark ravine between the faces.
			poly(
				[
					[0, 15],
					[7, 7],
					[13, 13],
					[18, 3],
					[24, 8],
					[31, 18],
					[28, 28],
					[4, 28],
				],
				C.ink,
				0,
				1
			);
			poly(
				[
					[0, 15],
					[7, 7],
					[13, 13],
					[18, 3],
					[24, 8],
					[31, 18],
					[28, 28],
					[4, 28],
				],
				C.stoneMid
			);
			poly(
				[
					[1, 15],
					[7, 8],
					[12, 14],
					[8, 17],
					[3, 18],
				],
				C.snow
			);
			poly(
				[
					[13, 13],
					[18, 3],
					[24, 8],
					[21, 12],
					[18, 9],
					[16, 17],
				],
				C.stoneLight
			);
			poly(
				[
					[18, 3],
					[21, 5],
					[24, 8],
					[22, 10],
					[19, 8],
				],
				C.snowShade
			);
			poly(
				[
					[14, 15],
					[18, 13],
					[20, 21],
					[17, 27],
					[13, 25],
				],
				C.stoneShade
			);
		} else {
			// A broad, layered escarpment with a broken glacier shelf.
			poly(
				[
					[0, 9],
					[8, 5],
					[15, 9],
					[21, 4],
					[29, 10],
					[32, 17],
					[32, 27],
					[23, 30],
					[15, 25],
					[8, 29],
					[0, 23],
				],
				C.ink,
				0,
				1
			);
			poly(
				[
					[0, 9],
					[8, 5],
					[15, 9],
					[21, 4],
					[29, 10],
					[32, 17],
					[32, 27],
					[23, 30],
					[15, 25],
					[8, 29],
					[0, 23],
				],
				C.stoneShade
			);
			poly(
				[
					[1, 9],
					[8, 6],
					[15, 10],
					[21, 5],
					[29, 11],
					[25, 15],
					[16, 14],
					[9, 17],
					[2, 15],
				],
				C.snowShade
			);
			poly(
				[
					[6, 7],
					[9, 7],
					[13, 10],
					[10, 12],
					[5, 11],
				],
				C.snow
			);
			poly(
				[
					[3, 18],
					[12, 17],
					[17, 21],
					[25, 17],
					[31, 20],
					[31, 26],
					[23, 28],
					[15, 23],
					[8, 27],
					[1, 22],
				],
				C.stoneMid
			);
			poly(
				[
					[15, 16],
					[19, 15],
					[21, 20],
					[18, 23],
				],
				C.stone
			);
		}
		if (v % 2) {
			fill(2, 27, 5, 1, C.stoneShade);
			fill(23, 26, 4, 1, C.stoneLight);
		}
	} else if (biome === 'wetland') {
		// Six distinct impassable water forms: pools, channels and marsh islands.
		if (v === 0) {
			poly(
				[
					[3, 8],
					[11, 3],
					[21, 4],
					[28, 10],
					[29, 21],
					[22, 29],
					[9, 28],
					[3, 22],
				],
				C.pineShade,
				0,
				1
			);
			poly(
				[
					[5, 9],
					[12, 5],
					[22, 6],
					[27, 11],
					[26, 21],
					[21, 27],
					[8, 26],
					[5, 21],
				],
				C.nightSea3
			);
			poly(
				[
					[7, 10],
					[13, 7],
					[20, 8],
					[25, 12],
					[23, 20],
					[18, 24],
					[9, 22],
					[6, 18],
				],
				C.nightSea2
			);
			poly(
				[
					[10, 10],
					[14, 8],
					[20, 9],
					[23, 12],
				],
				C.nightSea1
			);
		} else if (v === 1) {
			// Two linked basins separated by a narrow reed bank.
			poly(
				[
					[1, 5],
					[10, 3],
					[15, 9],
					[14, 17],
					[9, 21],
					[2, 18],
				],
				C.pineShade,
				0,
				1
			);
			poly(
				[
					[17, 12],
					[23, 5],
					[30, 8],
					[31, 21],
					[25, 28],
					[17, 24],
				],
				C.pineShade,
				0,
				1
			);
			poly(
				[
					[3, 6],
					[10, 5],
					[13, 10],
					[12, 16],
					[8, 19],
					[3, 16],
				],
				C.nightSea3
			);
			poly(
				[
					[18, 13],
					[24, 7],
					[28, 10],
					[29, 20],
					[24, 26],
					[18, 22],
				],
				C.nightSea3
			);
			poly(
				[
					[5, 8],
					[10, 7],
					[11, 12],
					[8, 15],
				],
				C.nightSea1
			);
			fill(14, 8, 2, 15, C.forestFloorLight);
		} else if (v === 2) {
			// A winding stream cuts diagonally through the marsh.
			poly(
				[
					[2, 2],
					[10, 4],
					[15, 10],
					[13, 15],
					[21, 18],
					[29, 26],
					[26, 31],
					[17, 24],
					[9, 21],
					[10, 15],
					[5, 11],
				],
				C.pineShade,
				0,
				1
			);
			poly(
				[
					[3, 2],
					[9, 5],
					[13, 10],
					[11, 15],
					[19, 19],
					[27, 27],
					[25, 29],
					[17, 23],
					[8, 20],
					[9, 14],
					[4, 10],
				],
				C.nightSea3
			);
			poly(
				[
					[5, 3],
					[9, 6],
					[11, 10],
					[9, 14],
					[16, 19],
					[22, 24],
					[20, 25],
					[14, 21],
					[7, 18],
					[8, 13],
					[3, 9],
				],
				C.nightSea2
			);
			fill(5, 6, 3, 1, C.nightSea1);
			fill(17, 20, 4, 1, C.nightSea1);
		} else if (v === 3) {
			// An open marsh pool with a broad central sedge island.
			poly(
				[
					[2, 7],
					[8, 3],
					[23, 4],
					[30, 11],
					[28, 24],
					[20, 29],
					[6, 27],
					[1, 18],
				],
				C.pineShade,
				0,
				1
			);
			poly(
				[
					[4, 8],
					[10, 5],
					[22, 6],
					[27, 12],
					[25, 22],
					[19, 26],
					[7, 24],
					[4, 17],
				],
				C.nightSea3
			);
			poly(
				[
					[6, 10],
					[11, 7],
					[21, 8],
					[25, 13],
					[23, 20],
					[18, 23],
					[8, 21],
					[6, 16],
				],
				C.nightSea2
			);
			poly(
				[
					[10, 12],
					[14, 10],
					[20, 12],
					[21, 17],
					[17, 20],
					[11, 18],
				],
				C.forestFloorLight
			);
			fill(13, 13, 4, 2, C.grass);
			fill(15, 11, 1, 3, C.pineShade);
		} else if (v === 4) {
			// Three smaller pools sit among reeds and muddy banks.
			for (const [a, b, w, h] of [
				[2, 5, 9, 8],
				[19, 3, 10, 10],
				[9, 19, 13, 10],
			]) {
				fill(a - 1, b - 1, w + 2, h + 2, C.pineShade);
				fill(a, b, w, h, C.nightSea3);
				fill(
					a + 2,
					b + 2,
					Math.max(2, w - 4),
					Math.max(2, h - 4),
					C.nightSea2
				);
			}
			fill(5, 7, 3, 1, C.nightSea1);
			fill(22, 6, 4, 1, C.nightSea1);
			fill(13, 23, 5, 1, C.nightSea1);
		} else {
			// A long, crescent-shaped oxbow framed by a marsh island.
			poly(
				[
					[2, 9],
					[8, 3],
					[23, 3],
					[30, 9],
					[30, 23],
					[23, 29],
					[8, 28],
					[2, 22],
				],
				C.pineShade,
				0,
				1
			);
			poly(
				[
					[4, 10],
					[10, 5],
					[22, 5],
					[27, 10],
					[27, 21],
					[22, 26],
					[10, 25],
					[4, 21],
				],
				C.nightSea3
			);
			poly(
				[
					[6, 11],
					[11, 7],
					[21, 7],
					[25, 11],
					[25, 19],
					[21, 23],
					[11, 22],
					[6, 19],
				],
				C.nightSea2
			);
			poly(
				[
					[10, 11],
					[14, 9],
					[19, 10],
					[22, 13],
					[21, 17],
					[18, 20],
					[13, 19],
					[10, 16],
				],
				C.forestFloorLight
			);
			fill(8, 12, 3, 1, C.nightSea1);
			fill(20, 18, 3, 1, C.nightSea1);
		}
		for (let i = 0; i < 9; i++) {
			const a = i % 2 === 0 ? rngInt(r, 0, 6) : rngInt(r, 24, 31),
				b = rngInt(r, 5, 27);
			fill(a, b - 2, 1, 5, C.pineShade);
			dot(a + 1, b - 2, C.grassLight);
		}
		if (v % 3 !== 1) {
			poly(
				[
					[16, 19],
					[19, 17],
					[22, 18],
					[22, 21],
					[20, 23],
					[17, 22],
				],
				C.pine
			);
			dot(18, 18, C.grassLight);
			dot(22, 22, C.forestFloorLight);
		}
		if (v % 3 === 1) {
			// split water across two basins
			poly(
				[
					[8, 12],
					[14, 10],
					[19, 11],
					[23, 15],
					[17, 19],
					[10, 17],
				],
				C.nightSea1
			);
			fill(9, 13, 4, 1, C.nightWaveDeep);
		}
	} else if (biome === 'tropical') {
		for (let i = 0; i < 6; i++) {
			const a = rngInt(r, 4, 27),
				b = rngInt(r, 5, 27);
			leaf(
				poly,
				a,
				b,
				rngInt(r, 3, 6),
				i % 2 === 0 ? C.pineLight : C.grassLight,
				C.pineShade
			);
		}
		if (v % 2 === 0) {
			dot(rngInt(r, 5, 24), rngInt(r, 6, 24), C.brickRedLight);
			dot(rngInt(r, 5, 24), rngInt(r, 6, 24), C.gold);
		}
	} else if (biome === 'desert') {
		poly(
			[
				[3, 18],
				[6, 12],
				[10, 11],
				[11, 7],
				[21, 6],
				[26, 11],
				[28, 20],
				[25, 27],
				[8, 27],
			],
			C.ink,
			0,
			1
		);
		poly(
			[
				[3, 18],
				[6, 12],
				[10, 11],
				[11, 7],
				[21, 6],
				[26, 11],
				[28, 20],
				[25, 27],
				[8, 27],
			],
			C.sandShade
		);
		poly(
			[
				[4, 17],
				[8, 12],
				[13, 10],
				[14, 8],
				[20, 7],
				[24, 12],
				[21, 17],
				[9, 21],
			],
			C.sandLight
		);
		poly(
			[
				[9, 21],
				[20, 17],
				[26, 13],
				[27, 20],
				[24, 26],
				[9, 26],
			],
			C.brass
		);
		poly(
			[
				[11, 16],
				[15, 15],
				[18, 18],
				[15, 23],
			],
			C.sandShade
		);
		if (v % 3 === 1) {
			poly(
				[
					[2, 8],
					[10, 5],
					[17, 12],
					[29, 13],
					[30, 18],
					[23, 20],
					[14, 18],
					[7, 15],
				],
				C.sandShade
			);
			poly(
				[
					[2, 8],
					[10, 5],
					[18, 12],
					[21, 13],
					[15, 14],
					[9, 11],
				],
				C.sandLight
			);
			fill(8, 7, 5, 1, C.cream);
		}
		if (v % 3 === 2) {
			poly(
				[
					[4, 21],
					[10, 19],
					[13, 20],
					[17, 18],
					[24, 19],
					[29, 22],
					[25, 28],
					[6, 28],
				],
				C.sandLight
			);
			fill(9, 23, 8, 1, C.sandShade);
			fill(20, 24, 5, 1, C.brass);
		}
		if (v % 2) {
			fill(7, 11, 8, 1, C.cream);
			fill(23, 22, 2, 3, C.sandShade);
		}
	} else if (biome === 'grassland') {
		// A stony thicket and layered bedrock, unlike the lighter meadow squares.
		poly(
			[
				[4, 14],
				[9, 10],
				[13, 13],
				[17, 8],
				[24, 12],
				[27, 20],
				[22, 26],
				[9, 27],
				[4, 22],
			],
			C.ink,
			0,
			1
		);
		poly(
			[
				[4, 14],
				[9, 10],
				[13, 13],
				[17, 8],
				[24, 12],
				[27, 20],
				[22, 26],
				[9, 27],
				[4, 22],
			],
			C.stoneShade
		);
		poly(
			[
				[5, 15],
				[10, 11],
				[14, 14],
				[17, 10],
				[22, 13],
				[22, 18],
				[12, 20],
			],
			C.stone
		);
		poly(
			[
				[9, 13],
				[11, 11],
				[14, 14],
				[12, 17],
				[7, 17],
			],
			C.stoneLight
		);
		for (let i = 0; i < 6; i++) {
			const a = rngInt(r, 3, 26),
				b = rngInt(r, 4, 25);
			dot(a, b, C.pineShade);
			dot(a - 1, b - 1, C.pine);
		}
		if (v % 3 === 1) {
			// bramble growing out of the bedrock
			for (const [a, b] of [
				[7, 17],
				[12, 13],
				[21, 13],
				[24, 21],
				[12, 25],
			]) {
				dot(a, b, C.pineShade);
				dot(a - 1, b - 1, C.pine);
				dot(a + 1, b - 2, C.pineShade);
			}
		}
	} else if (biome === 'forest') {
		// Dark pine boughs enclose the entire space; crisp cream highlights mark the upper edge.
		crown(
			poly,
			dot,
			12,
			10 + rngInt(r, -1, 2),
			10,
			C.pineLight,
			C.pine,
			C.pineShade
		);
		crown(
			poly,
			dot,
			23,
			21,
			10,
			C.forestFloorLight,
			C.pine,
			C.forestFloorShade
		);
		crown(
			poly,
			dot,
			8 + rngInt(r, -2, 1),
			25,
			7,
			C.pineLight,
			C.pine,
			C.pineShade
		);
		if (v % 3 === 1) {
			// fallen timber under a different canopy shape
			poly(
				[
					[1, 18],
					[6, 15],
					[27, 24],
					[27, 28],
					[22, 28],
				],
				C.ink
			);
			poly(
				[
					[2, 18],
					[6, 16],
					[26, 24],
					[25, 27],
				],
				C.timber
			);
			poly(
				[
					[3, 18],
					[7, 17],
					[20, 23],
					[18, 24],
				],
				C.timberLight
			);
		}
		for (let i = 0; i < 4; i++) {
			const a = rngInt(r, 5, 27),
				b = rngInt(r, 5, 28);
			dot(a, b, C.forestFloorLight);
		}
	}
}
