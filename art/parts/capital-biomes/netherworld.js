// Capital terrain for the Netherworld advanced mat (#6): scorched rock, lava, bone and the mat's four imps.
import { createCanvas, rect, set, seededRandom } from '../../painter.js';
import { PALETTE as C } from '../../palette.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */
/** @typedef {() => number} Random */

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
	const xs = points.map((p) => p[0]);
	const ys = points.map((p) => p[1]);
	for (
		let y = Math.floor(Math.min(...ys));
		y < Math.ceil(Math.max(...ys));
		y++
	) {
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
	rect(canvas, 0, 0, SIZE, SIZE, C.hellRock);
	for (let i = 0; i < 11; i++) {
		rect(
			canvas,
			between(1, 28, r),
			between(1, 28, r),
			between(2, 6, r),
			between(1, 3, r),
			i % 3 === 0 ? C.hellRockShade : C.hellRockLight
		);
	}
	for (let i = 0; i < 38; i++) {
		set(
			canvas,
			between(1, 30, r),
			between(1, 30, r),
			i % 4 === 0 ? C.hellRockShade : C.hellRockLight
		);
	}
	for (let i = 0; i < 3; i++) {
		set(canvas, between(1, 30, r), between(1, 30, r), C.lavaDeep);
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
		set(canvas, x, y, i % 2 ? C.hellRockLight : C.hellRock);
	}
}

/** A jagged crack in the rock. @param {Canvas} canvas @param {Random} r @param {number} x @param {number} y @param {number} length @param {Colour} colour @param {Colour | null} [glow] */
function crack(canvas, r, x, y, length, colour, glow = null) {
	for (let i = 0; i < length; i++) {
		set(canvas, x, y, colour);
		if (glow && i % 5 === 2) {
			set(canvas, x, y, glow);
		}
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
		crack(canvas, r, 3, 10, 22, C.hellRockDeep);
		crack(canvas, r, 10, 22, 16, C.hellRockShade);
	} else if (v === 1) {
		// Embers drifting over the rock.
		for (const [x, y] of [
			[7, 8],
			[22, 12],
			[14, 21],
			[26, 25],
			[5, 26],
		]) {
			set(canvas, x, y, C.ember);
			set(canvas, x + 1, y, C.lava);
			set(canvas, x, y + 1, C.lavaDeep);
		}
	} else if (v === 2) {
		// Drifts of grey ash.
		for (const [x, y, w] of [
			[6, 9, 8],
			[17, 16, 9],
			[9, 23, 7],
		]) {
			rect(canvas, x, y, w, 2, C.stoneShade);
			rect(canvas, x + 1, y, w - 3, 1, C.stoneMid);
			set(canvas, x + 2, y - 1, C.stoneShade);
		}
	} else if (v === 3) {
		// A few loose stones.
		for (const [x, y] of [
			[6, 19],
			[18, 10],
			[22, 22],
			[11, 8],
		]) {
			polygon(
				canvas,
				[
					[x, y + 2],
					[x + 1, y],
					[x + 5, y],
					[x + 6, y + 2],
					[x + 4, y + 3],
				],
				C.hellRockShade
			);
			polygon(
				canvas,
				[
					[x + 1, y + 1],
					[x + 2, y],
					[x + 4, y],
					[x + 4, y + 1],
				],
				C.hellRockLight
			);
		}
	} else if (v === 4) {
		// A thin seam of dull glowing lava.
		crack(canvas, r, 2, 14, 27, C.lavaDeep, C.lava);
		crack(canvas, r, 6, 23, 12, C.hellRockDeep);
	} else if (v === 5) {
		// Bleached bones.
		polygon(
			canvas,
			[
				[6, 20],
				[9, 18],
				[20, 14],
				[22, 15],
				[20, 17],
				[9, 22],
			],
			C.creamShade
		);
		polygon(
			canvas,
			[
				[7, 20],
				[10, 18],
				[19, 15],
				[20, 16],
				[9, 21],
			],
			C.cream
		);
		rect(canvas, 5, 19, 2, 3, C.cream);
		rect(canvas, 21, 13, 2, 3, C.cream);
		rect(canvas, 5, 22, 2, 1, C.creamShade);
	} else if (v === 6) {
		// Yellow brimstone stains.
		for (const [x, y] of [
			[8, 9],
			[20, 20],
			[13, 24],
		]) {
			rect(canvas, x, y, 5, 2, C.sandShade);
			rect(canvas, x + 1, y, 3, 1, C.brass);
			set(canvas, x + 2, y - 1, C.sandShade);
			set(canvas, x + 5, y + 1, C.brass);
		}
	} else {
		// Scattered cinders: uneven flakes of burnt rock, a few still glowing, thrown in no pattern.
		for (const { x, y, w, glow } of [
			{ x: 4, y: 7, w: 3, glow: false },
			{ x: 11, y: 22, w: 2, glow: true },
			{ x: 15, y: 4, w: 1, glow: false },
			{ x: 19, y: 13, w: 3, glow: false },
			{ x: 25, y: 25, w: 2, glow: false },
			{ x: 27, y: 6, w: 2, glow: true },
			{ x: 7, y: 14, w: 1, glow: false },
			{ x: 22, y: 20, w: 1, glow: true },
		]) {
			rect(canvas, x, y, w, 1, C.hellRockDeep);
			if (w > 1) {
				set(canvas, x + 1, y - 1, C.hellRockDeep);
				set(canvas, x, y + 1, C.hellRockShade);
			}
			if (glow) {
				set(canvas, x, y, C.ember);
			}
		}
	}
}

/** @param {Canvas} canvas @param {Random} r @param {number} v */
function drawObstacle(canvas, r, v) {
	if (v === 0) {
		// A pool of lava in a rim of rock.
		const rim = [
			[2, 15],
			[7, 8],
			[20, 6],
			[28, 11],
			[29, 22],
			[22, 27],
			[8, 27],
			[3, 22],
		];
		solid(canvas, rim, C.hellRockShade);
		polygon(
			canvas,
			[
				[3, 15],
				[8, 9],
				[20, 7],
				[27, 11],
				[27, 16],
				[5, 17],
			],
			C.hellRockLight
		);
		polygon(
			canvas,
			[
				[5, 16],
				[9, 11],
				[19, 10],
				[25, 13],
				[26, 21],
				[21, 25],
				[9, 25],
				[5, 21],
			],
			C.lavaDeep
		);
		polygon(
			canvas,
			[
				[8, 16],
				[11, 13],
				[19, 13],
				[23, 16],
				[22, 21],
				[18, 23],
				[11, 23],
				[8, 20],
			],
			C.lava
		);
		polygon(
			canvas,
			[
				[11, 17],
				[14, 15],
				[19, 16],
				[20, 19],
				[15, 21],
				[12, 20],
			],
			C.ember
		);
		rect(canvas, 14, 17, 3, 2, C.gold);
		for (const [x, y] of [
			[10, 15],
			[20, 15],
			[17, 22],
		]) {
			set(canvas, x, y, C.gold);
		}
	} else if (v === 1) {
		// Obsidian spikes.
		const spikes = [
			[4, 27, 8, 10, 13, 27],
			[10, 27, 15, 3, 20, 27],
			[17, 27, 22, 8, 27, 27],
			[23, 27, 27, 14, 30, 27],
		];
		for (const [x0, y0, x1, y1, x2, y2] of spikes) {
			solid(
				canvas,
				[
					[x0, y0],
					[x1, y1],
					[x2, y2],
				],
				C.hellRockDeep
			);
			polygon(
				canvas,
				[
					[x1, y1],
					[x0, y0],
					[x0 + 3, y0],
				],
				C.arcaneShade
			);
			set(canvas, x1, y1 + 1, C.arcane);
			set(canvas, x1, y1 + 2, C.arcaneShade);
		}
		rect(canvas, 3, 27, 27, 1, C.hellRockDeep);
		rect(canvas, 5, 26, 2, 1, C.lavaDeep);
		rect(canvas, 24, 26, 3, 1, C.lavaDeep);
	} else if (v === 2) {
		// Basalt columns.
		const columns = [
			[3, 12, 10],
			[11, 7, 10],
			[19, 10, 10],
			[10, 17, 12],
		];
		for (const [x, top, w] of columns.sort((a, b) => a[1] - b[1])) {
			const bottom = top + 14;
			solid(
				canvas,
				[
					[x, top + 3],
					[x + w / 2, top],
					[x + w, top + 3],
					[x + w, bottom],
					[x, bottom],
				],
				C.hellRockDeep
			);
			polygon(
				canvas,
				[
					[x, top + 3],
					[x + w / 2, top],
					[x + w, top + 3],
					[x + w / 2, top + 6],
				],
				C.stoneMid
			);
			polygon(
				canvas,
				[
					[x + 1, top + 3],
					[x + w / 2, top + 1],
					[x + w / 2, top + 4],
				],
				C.stoneLight
			);
			polygon(
				canvas,
				[
					[x, top + 3],
					[x + w / 2, top + 6],
					[x + w / 2, bottom],
					[x, bottom],
				],
				C.hellRockLight
			);
			rect(
				canvas,
				x + w / 2 + 1,
				top + 6,
				w / 2 - 2,
				bottom - top - 6,
				C.hellRockShade
			);
			rect(canvas, x, top + 8, 1, 4, C.hellRock);
		}
		rect(canvas, 6, 27, 18, 1, C.lavaDeep);
	} else if (v === 3) {
		// A heap of skulls and bones.
		solid(
			canvas,
			[
				[3, 26],
				[5, 18],
				[11, 12],
				[20, 12],
				[27, 18],
				[29, 26],
			],
			C.creamShade
		);
		for (const [x, y] of [
			[6, 17],
			[15, 10],
			[20, 18],
		]) {
			solid(
				canvas,
				[
					[x, y + 3],
					[x + 1, y],
					[x + 7, y],
					[x + 8, y + 3],
					[x + 7, y + 6],
					[x + 2, y + 6],
				],
				C.cream
			);
			rect(canvas, x + 1, y + 1, 5, 1, C.creamLight);
			rect(canvas, x + 1, y + 3, 2, 2, C.ink);
			rect(canvas, x + 5, y + 3, 2, 2, C.ink);
			set(canvas, x + 4, y + 5, C.ink);
			set(canvas, x + 1, y + 4, C.lava);
			set(canvas, x + 5, y + 4, C.lava);
		}
		for (const [x, y, w] of [
			[4, 24, 9],
			[16, 25, 10],
			[10, 21, 8],
		]) {
			rect(canvas, x, y, w, 2, C.cream);
			rect(canvas, x - 1, y - 1, 2, 4, C.creamLight);
			rect(canvas, x + w - 1, y - 1, 2, 4, C.creamLight);
		}
	} else if (v === 4) {
		// A brimstone vent breathing fire.
		solid(
			canvas,
			[
				[3, 27],
				[8, 18],
				[12, 16],
				[20, 16],
				[24, 18],
				[29, 27],
			],
			C.hellRockShade
		);
		polygon(
			canvas,
			[
				[8, 18],
				[12, 16],
				[20, 16],
				[24, 18],
				[16, 20],
			],
			C.hellRockLight
		);
		polygon(
			canvas,
			[
				[3, 27],
				[8, 18],
				[16, 20],
				[14, 27],
			],
			C.hellRock
		);
		polygon(
			canvas,
			[
				[12, 17],
				[20, 17],
				[18, 19],
				[14, 19],
			],
			C.lavaDeep
		);
		polygon(
			canvas,
			[
				[11, 17],
				[13, 9],
				[15, 11],
				[16, 3],
				[19, 10],
				[21, 8],
				[21, 17],
			],
			C.lava
		);
		polygon(
			canvas,
			[
				[13, 17],
				[15, 12],
				[16, 7],
				[18, 12],
				[19, 17],
			],
			C.ember
		);
		polygon(
			canvas,
			[
				[15, 17],
				[16, 11],
				[17, 17],
			],
			C.gold
		);
		for (const [x, y] of [
			[9, 12],
			[24, 11],
			[7, 8],
		]) {
			set(canvas, x, y, C.ember);
		}
		rect(canvas, 6, 24, 3, 1, C.sandShade);
		rect(canvas, 22, 23, 3, 1, C.sandShade);
	} else {
		// A black crag split by veins of lava.
		solid(
			canvas,
			[
				[3, 26],
				[4, 16],
				[10, 7],
				[16, 10],
				[22, 5],
				[28, 15],
				[29, 26],
			],
			C.hellRockDeep
		);
		polygon(
			canvas,
			[
				[4, 17],
				[10, 8],
				[15, 11],
				[13, 16],
				[8, 20],
			],
			C.hellRockShade
		);
		polygon(
			canvas,
			[
				[22, 6],
				[28, 15],
				[23, 14],
				[19, 10],
			],
			C.hellRock
		);
		for (const [x, y] of [
			[8, 14],
			[16, 12],
			[24, 11],
		]) {
			set(canvas, x, y, C.hellRockLight);
			set(canvas, x + 1, y, C.hellRockLight);
		}
		crack(canvas, r, 9, 19, 6, C.lava);
		crack(canvas, r, 14, 21, 8, C.lava, C.gold);
		crack(canvas, r, 18, 14, 4, C.lavaDeep);
		crack(canvas, r, 7, 24, 5, C.lavaDeep);
		set(canvas, 12, 20, C.ember);
		set(canvas, 20, 22, C.ember);
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
	const r = seededRandom((5167 + v * 73471 + (blocked ? 376031 : 0)) >>> 0);
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

/** One imp, about 12×15 pixels, standing on a plot. @param {Canvas} mat @param {number} cx @param {number} cy */
function drawImp(mat, cx, cy) {
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
function drawCentre(mat, cx, cy) {
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
 * The example mat, composed from this biome's tiles on its printed layout, with the four imps and the city
 * centre's marker drawn over them.
 * @returns {Canvas}
 */
export function drawBiomeMat() {
	const mat = createCanvas(LAYOUT[0].length * SIZE, LAYOUT.length * SIZE);
	PLACEMENT.forEach((rowPlots, row) => {
		rowPlots.forEach(({ blocked, variant }, col) => {
			blit(mat, drawBiomeTile(blocked, variant), col * SIZE, row * SIZE);
		});
	});
	LAYOUT.forEach((text, row) => {
		[...text].forEach((ch, col) => {
			const cx = col * SIZE + SIZE / 2;
			const cy = row * SIZE + SIZE / 2;
			if (ch === 'I') {
				drawImp(mat, cx, cy);
			} else if (ch === 'C') {
				drawCentre(mat, cx, cy);
			}
		});
	});
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
			name: 'imps',
			where: "An imp standing on each 'I' plot of LAYOUT (an open plot): (1,1), (1,7), (7,1) and (7,7), as [row, column]",
		}),
		Object.freeze({
			name: 'city centre',
			where: "A gold ring round a small tower on the 'C' plot of LAYOUT (an open plot): (4,4), as [row, column]",
		}),
	]),
});
