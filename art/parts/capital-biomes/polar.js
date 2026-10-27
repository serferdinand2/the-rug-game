// Capital terrain for the Polar advanced mat (#6): icy ground, icebergs, and the aurora's field lines.
import { createCanvas, rect, set, seededRandom } from '../../painter.js';
import { PALETTE as C } from '../../palette.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */
/** @typedef {() => number} Random */

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
const LINES = {
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

const SIZE = 32;

/**
 * The tile placed on each plot of the example mat, row by row.
 * @type {readonly { blocked: boolean, variant: number }[][]}
 */
export const PLACEMENT = LAYOUT.map((text, row) =>
	[...text].map((ch, col) => {
		const blocked = ch === 'X';
		const hash =
			((row + 1) * 193 +
				(col + 1) * 389 +
				(row + 1) * (col + 3) * 71 +
				(row * row + col * col) * 43) >>>
			0;
		return { blocked, variant: hash % (blocked ? 6 : 8) };
	})
);

/** @param {number} a @param {number} b @param {Random} r @returns {number} */
function between(a, b, r) {
	return a + Math.floor(r() * (b - a + 1));
}

/**
 * Fills a polygon with hard pixel edges.
 * @param {Canvas} canvas
 * @param {number[][]} points
 * @param {Colour} colour
 * @param {number} [dy] - Vertical shift
 */
function polygon(canvas, points, colour, dy = 0) {
	const ys = points.map((p) => p[1]);
	for (
		let y = Math.floor(Math.min(...ys));
		y < Math.ceil(Math.max(...ys));
		y++
	) {
		const xs = points.map((p) => p[0]);
		for (
			let x = Math.floor(Math.min(...xs));
			x < Math.ceil(Math.max(...xs));
			x++
		) {
			const px = x + 0.5;
			const py = y + 0.5;
			let hit = false;
			for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
				const a = points[i];
				const b = points[j];
				if (
					a[1] > py !== b[1] > py &&
					px < ((b[0] - a[0]) * (py - a[1])) / (b[1] - a[1]) + a[0]
				) {
					hit = !hit;
				}
			}
			if (hit) {
				set(canvas, x, y + dy, colour);
			}
		}
	}
}

/** A solid shape with the ink shadow one pixel below, as the base biomes draw their obstacles. @param {Canvas} canvas @param {number[][]} points @param {Colour} colour */
function solid(canvas, points, colour) {
	polygon(canvas, points, C.ink, 1);
	polygon(canvas, points, colour);
}

/** @param {Canvas} canvas @param {Random} r */
function drawGround(canvas, r) {
	rect(canvas, 0, 0, SIZE, SIZE, C.ice);
	for (let i = 0; i < 11; i++) {
		rect(
			canvas,
			between(1, 28, r),
			between(1, 28, r),
			between(2, 6, r),
			between(1, 3, r),
			i % 3 === 0 ? C.iceMid : C.iceLight
		);
	}
	for (let i = 0; i < 36; i++) {
		set(
			canvas,
			between(1, 30, r),
			between(1, 30, r),
			i % 4 === 0 ? C.iceMid : C.iceLight
		);
	}
	for (let i = 0; i < 6; i++) {
		set(canvas, between(1, 30, r), between(1, 30, r), C.white);
	}
	// Edge pixels break up the repeat when plots sit side by side.
	for (let i = 0; i < 12; i++) {
		let x = between(0, 31, r);
		let y = between(0, 31, r);
		if (r() > 0.5) {
			x = r() > 0.5 ? 0 : 31;
		} else {
			y = r() > 0.5 ? 0 : 31;
		}
		set(canvas, x, y, i % 2 ? C.iceLight : C.ice);
	}
}

/** A thin jagged crack in the ice. @param {Canvas} canvas @param {Random} r @param {number} x @param {number} y @param {number} length @param {Colour} colour */
function crack(canvas, r, x, y, length, colour) {
	for (let i = 0; i < length; i++) {
		set(canvas, x, y, colour);
		x += 1;
		if (r() > 0.55) {
			y += r() > 0.5 ? 1 : -1;
			set(canvas, x, y, colour);
		}
	}
}

/** @param {Canvas} canvas @param {Random} r @param {number} v */
function drawScattered(canvas, r, v) {
	if (v === 0) {
		// A low snow drift.
		polygon(
			canvas,
			[
				[7, 20],
				[11, 16],
				[20, 15],
				[25, 19],
				[23, 22],
				[9, 23],
			],
			C.iceMid
		);
		polygon(
			canvas,
			[
				[8, 19],
				[12, 16],
				[20, 16],
				[24, 19],
				[12, 20],
			],
			C.iceLight
		);
		rect(canvas, 13, 17, 4, 1, C.snow);
	} else if (v === 1) {
		crack(canvas, r, 3, 11, 20, C.iceShade);
		crack(canvas, r, 12, 22, 14, C.iceMid);
		crack(canvas, r, 14, 12, 6, C.iceMid);
	} else if (v === 2) {
		// Frost glints.
		for (const [x, y] of [
			[8, 9],
			[21, 14],
			[13, 23],
		]) {
			set(canvas, x, y, C.white);
			set(canvas, x - 1, y, C.iceLight);
			set(canvas, x + 1, y, C.iceLight);
			set(canvas, x, y - 1, C.iceLight);
			set(canvas, x, y + 1, C.iceLight);
		}
	} else if (v === 3) {
		// A few chunks of broken ice.
		for (const [x, y] of [
			[6, 20],
			[17, 11],
			[23, 23],
			[11, 8],
		]) {
			polygon(
				canvas,
				[
					[x, y + 1],
					[x + 2, y - 1],
					[x + 5, y],
					[x + 4, y + 2],
				],
				C.iceShade
			);
			polygon(
				canvas,
				[
					[x + 1, y],
					[x + 2, y - 1],
					[x + 4, y],
					[x + 2, y + 1],
				],
				C.iceLight
			);
		}
	} else if (v === 4) {
		// The aurora's faint reflection.
		for (let k = 0; k < 3; k++) {
			for (let x = 2; x < 30; x++) {
				const y =
					8 + k * 7 + Math.round(2 * Math.sin(x * 0.28 + k * 1.7));
				set(canvas, x, y, k === 1 ? C.tealLight : C.iceLight);
				if (x % 3 === 0) {
					set(canvas, x, y + 1, C.ghost);
				}
			}
		}
	} else if (v === 5) {
		// Wind-swept ridges.
		for (let k = 0; k < 4; k++) {
			const y = 5 + k * 7;
			const x = between(2, 8, r);
			for (let j = 0; j < 15; j++) {
				set(
					canvas,
					x + j,
					y + Math.round(Math.sin(j * 0.5)),
					C.iceLight
				);
				set(
					canvas,
					x + j,
					y + 1 + Math.round(Math.sin(j * 0.5)),
					C.iceMid
				);
			}
		}
	} else if (v === 6) {
		// A tuft of rime on a small hummock.
		polygon(
			canvas,
			[
				[10, 22],
				[13, 14],
				[18, 12],
				[23, 16],
				[22, 22],
			],
			C.iceShade
		);
		polygon(
			canvas,
			[
				[11, 21],
				[14, 15],
				[18, 13],
				[21, 16],
				[15, 19],
			],
			C.iceLight
		);
		for (const [x, y] of [
			[15, 13],
			[17, 12],
			[19, 14],
		]) {
			set(canvas, x, y, C.white);
		}
	} else {
		// Pitted snow.
		for (let i = 0; i < 10; i++) {
			const x = between(3, 27, r);
			const y = between(3, 27, r);
			set(canvas, x, y, C.iceShade);
			set(canvas, x + 1, y, C.iceMid);
		}
	}
}

/** @param {Canvas} canvas @param {Random} r @param {number} v */
function drawObstacle(canvas, r, v) {
	if (v === 0) {
		// A tall iceberg.
		const body = [
			[3, 27],
			[7, 19],
			[11, 20],
			[16, 4],
			[20, 13],
			[24, 10],
			[29, 27],
		];
		solid(canvas, body, C.iceMid);
		polygon(
			canvas,
			[
				[16, 4],
				[12, 19],
				[7, 19],
				[3, 27],
				[15, 27],
				[16, 16],
			],
			C.iceLight
		);
		polygon(
			canvas,
			[
				[16, 4],
				[20, 13],
				[24, 10],
				[29, 27],
				[17, 27],
				[16, 16],
			],
			C.iceShade
		);
		polygon(
			canvas,
			[
				[16, 5],
				[14, 11],
				[16, 12],
				[18, 10],
			],
			C.white
		);
		rect(canvas, 17, 18, 1, 5, C.iceDeep);
		rect(canvas, 8, 22, 6, 1, C.iceMid);
		rect(canvas, 3, 27, 26, 1, C.iceDeep);
	} else if (v === 1) {
		// Twin icebergs.
		solid(
			canvas,
			[
				[2, 26],
				[6, 14],
				[11, 8],
				[14, 16],
				[17, 26],
			],
			C.iceMid
		);
		polygon(
			canvas,
			[
				[11, 8],
				[6, 14],
				[2, 26],
				[9, 26],
				[11, 15],
			],
			C.iceLight
		);
		polygon(
			canvas,
			[
				[11, 8],
				[14, 16],
				[17, 26],
				[10, 26],
				[11, 15],
			],
			C.iceShade
		);
		solid(
			canvas,
			[
				[15, 27],
				[18, 17],
				[23, 11],
				[28, 19],
				[30, 27],
			],
			C.iceMid
		);
		polygon(
			canvas,
			[
				[23, 11],
				[18, 17],
				[15, 27],
				[22, 27],
				[23, 18],
			],
			C.iceLight
		);
		polygon(
			canvas,
			[
				[23, 11],
				[28, 19],
				[30, 27],
				[22, 27],
				[23, 18],
			],
			C.iceShade
		);
		rect(canvas, 10, 9, 2, 2, C.white);
		rect(canvas, 22, 12, 2, 2, C.white);
	} else if (v === 2) {
		// A cluster of teal-lit ice shards.
		const shards = [
			[5, 27, 9, 12, 14, 27],
			[11, 27, 16, 4, 21, 27],
			[18, 27, 23, 9, 28, 27],
			[2, 22, 5, 15, 8, 24],
		];
		for (const [x0, y0, x1, y1, x2, y2] of shards) {
			solid(
				canvas,
				[
					[x0, y0],
					[x1, y1],
					[x2, y2],
				],
				C.iceShade
			);
			polygon(
				canvas,
				[
					[x1, y1],
					[x0, y0],
					[Math.round((x0 + x2) / 2), y0],
				],
				C.tealLight
			);
			polygon(
				canvas,
				[
					[x1, y1],
					[Math.round((x0 + x2) / 2), y0],
					[x2, y2],
				],
				C.teal
			);
			set(canvas, x1, y1, C.white);
		}
		rect(canvas, 3, 27, 26, 1, C.iceDeep);
	} else if (v === 3) {
		// Open black water between floes.
		const pool = [
			[2, 14],
			[8, 8],
			[19, 7],
			[28, 12],
			[29, 22],
			[21, 27],
			[9, 26],
			[3, 21],
		];
		polygon(canvas, pool, C.iceShade);
		const water = [
			[4, 15],
			[9, 10],
			[19, 9],
			[26, 13],
			[27, 21],
			[20, 25],
			[10, 24],
			[5, 20],
		];
		polygon(canvas, water, C.nightSea3);
		polygon(
			canvas,
			[
				[7, 14],
				[12, 11],
				[18, 11],
				[14, 15],
			],
			C.nightSea2
		);
		polygon(
			canvas,
			[
				[14, 19],
				[20, 16],
				[25, 19],
				[20, 23],
			],
			C.nightSea2
		);
		for (let x = 8; x < 24; x += 5) {
			set(canvas, x, 17 + (x % 3), C.nightSeaLine);
			set(canvas, x + 1, 17 + (x % 3), C.nightSeaLine);
		}
		polygon(
			canvas,
			[
				[10, 15],
				[14, 14],
				[16, 17],
				[12, 19],
				[9, 18],
			],
			C.ink,
			1
		);
		polygon(
			canvas,
			[
				[10, 15],
				[14, 14],
				[16, 17],
				[12, 19],
				[9, 18],
			],
			C.iceLight
		);
		set(canvas, 12, 15, C.white);
	} else if (v === 4) {
		// A glacier wall, split by crevasses.
		solid(
			canvas,
			[
				[2, 12],
				[6, 8],
				[26, 8],
				[30, 13],
				[29, 26],
				[3, 26],
			],
			C.iceMid
		);
		polygon(
			canvas,
			[
				[6, 8],
				[26, 8],
				[30, 13],
				[2, 12],
			],
			C.iceLight
		);
		polygon(
			canvas,
			[
				[2, 12],
				[30, 13],
				[29, 26],
				[3, 26],
			],
			C.iceMid
		);
		for (const x of [8, 14, 21, 26]) {
			polygon(
				canvas,
				[
					[x, 13],
					[x + 2, 13],
					[x + 1, 25],
					[x - 1, 25],
				],
				C.iceShade
			);
			rect(canvas, x, 15, 1, 6, C.iceDeep);
		}
		rect(canvas, 3, 25, 26, 1, C.iceDeep);
		for (const [x, y] of [
			[9, 10],
			[17, 9],
			[24, 11],
		]) {
			rect(canvas, x, y, 3, 1, C.white);
		}
	} else {
		// A snow-capped boulder frozen into the ice.
		solid(
			canvas,
			[
				[4, 24],
				[5, 15],
				[11, 8],
				[21, 7],
				[27, 14],
				[28, 24],
				[21, 28],
				[9, 28],
			],
			C.stoneShade
		);
		polygon(
			canvas,
			[
				[5, 16],
				[11, 9],
				[21, 8],
				[26, 14],
				[18, 17],
				[9, 17],
			],
			C.stone
		);
		polygon(
			canvas,
			[
				[5, 17],
				[11, 9],
				[17, 9],
				[14, 15],
				[9, 19],
			],
			C.stoneLight
		);
		polygon(
			canvas,
			[
				[11, 9],
				[21, 8],
				[25, 13],
				[20, 12],
				[15, 14],
				[10, 12],
			],
			C.snow
		);
		polygon(
			canvas,
			[
				[14, 13],
				[19, 12],
				[18, 15],
				[15, 16],
			],
			C.snowShade
		);
		for (const [x, y] of [
			[8, 24],
			[13, 26],
			[22, 25],
			[26, 20],
		]) {
			set(canvas, x, y, C.iceLight);
			set(canvas, x + 1, y, C.iceMid);
		}
		rect(canvas, 12, 20, 1, 5, C.ink);
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
	const canvas = createCanvas(SIZE, SIZE);
	const r = seededRandom((8731 + v * 73471 + (blocked ? 376031 : 0)) >>> 0);
	drawGround(canvas, r);
	if (blocked) {
		drawObstacle(canvas, r, v);
	} else {
		drawScattered(canvas, r, v);
	}
	return canvas;
}

/**
 * Copies a tile onto the mat.
 * @param {Canvas} mat
 * @param {Canvas} tile
 * @param {number} ox
 * @param {number} oy
 */
function blit(mat, tile, ox, oy) {
	for (let y = 0; y < tile.h; y++) {
		for (let x = 0; x < tile.w; x++) {
			set(mat, ox + x, oy + y, tile.p[y * tile.w + x]);
		}
	}
}

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
function dashed(mat, x0, y0, x1, y1, gapStart, gapEnd) {
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
function ring(mat, cx, cy) {
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
 * The example mat, composed from this biome's tiles on its printed layout, with each district's field line
 * and the rings on its plots drawn over them. The resource icons the mat prints at each line's end are left out.
 * @returns {Canvas}
 */
export function drawBiomeMat() {
	const mat = createCanvas(LAYOUT[0].length * SIZE, LAYOUT.length * SIZE);
	PLACEMENT.forEach((rowPlots, row) => {
		rowPlots.forEach(({ blocked, variant }, col) => {
			blit(mat, drawBiomeTile(blocked, variant), col * SIZE, row * SIZE);
		});
	});
	const centre = (/** @type {number} */ n) => n * SIZE + SIZE / 2;
	for (const plots of Object.values(LINES)) {
		for (let i = 1; i < plots.length; i++) {
			const [r0, c0] = plots[i - 1];
			const [r1, c1] = plots[i];
			const ringed = (/** @type {number} */ r, /** @type {number} */ c) =>
				LAYOUT[r][c] !== 'X';
			dashed(
				mat,
				centre(c0),
				centre(r0),
				centre(c1),
				centre(r1),
				ringed(r0, c0) ? 10 : 0,
				ringed(r1, c1) ? 10 : 0
			);
		}
	}
	LAYOUT.forEach((text, row) => {
		[...text].forEach((ch, col) => {
			if (ch >= 'A' && ch <= 'F') {
				ring(mat, centre(col), centre(row));
			}
		});
	});
	return mat;
}
