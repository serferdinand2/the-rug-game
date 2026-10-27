// Capital terrain for the Canyon advanced mat (#6): red desert earth, rock and chasm plots, and the six printed cacti.
import { createCanvas, rect, set, seededRandom, mix } from '../../painter.js';
import { PALETTE as C } from '../../palette.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

const SIZE = 32;

/**
 * The mat's printed layout (research 03 "Canyon"), one string per row, top first: '.' an open plot, 'X' an impassable one,
 * and 'C' an open plot with a cactus. A cactus is a regular plot, but one completely surrounded by buildings and impassable plots counts as complete (the engine's job).
 * @type {readonly string[]}
 */
export const LAYOUT = [
	'..XX.....',
	'.CXXX..C.',
	'....XX...',
	'....XX...',
	'.C...XXC.',
	'.....X...',
	'....XX...',
	'.C.XXX.C.',
	'..XX.....',
];

/** The impassable variant names, for reference: 0 chasm, 1 boulders, 2 mesa, 3 sinkhole, 4 spires, 5 gorge. */
export const BLOCKED_KINDS = [
	'chasm',
	'boulders',
	'mesa',
	'sinkhole',
	'spires',
	'gorge',
];

// Red canyon earth, blended from the base desert and brick palettes so it sits beside the desert tiles.
const DIRT = {
	light: mix(C.sandLight, C.brickRedLight, 0.28),
	base: mix(C.sand, C.brickRed, 0.3),
	dark: mix(C.sandShade, C.brickRedShade, 0.35),
	grit: mix(C.sandLight, C.amber, 0.4),
};
const ROCK = {
	light: mix(C.brickRedLight, C.amber, 0.45),
	mid: mix(C.brickRed, C.amber, 0.25),
	dark: mix(C.brickRedShade, C.brickRed, 0.3),
	deep: mix(C.brickRedShade, C.night, 0.55),
	abyss: mix(C.night, C.brickRedShade, 0.25),
};

/** @param {() => number} r @param {number} a @param {number} b @returns {number} */
function rngInt(r, a, b) {
	return a + Math.floor(r() * (b - a + 1));
}

/**
 * Fills a hard-edged polygon.
 * @param {Canvas} c
 * @param {number[][]} pts
 * @param {Colour} col
 */
function polygon(c, pts, col) {
	const ys = pts.map((p) => p[1]);
	const xs = pts.map((p) => p[0]);
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
 * Fills an ellipse, lit from the top left.
 * @param {Canvas} c
 * @param {number} cx
 * @param {number} cy
 * @param {number} rx
 * @param {number} ry
 * @param {Colour} light
 * @param {Colour} mid
 * @param {Colour} dark
 */
function blob(c, cx, cy, rx, ry, light, mid, dark) {
	for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
		for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
			const dx = (x + 0.5 - cx) / rx;
			const dy = (y + 0.5 - cy) / ry;
			if (dx * dx + dy * dy <= 1) {
				const t = -dx * 0.6 - dy * 0.8;
				set(c, x, y, t > 0.4 ? light : t > -0.3 ? mid : dark);
			}
		}
	}
}

/**
 * Red desert earth with soft patches, grit and a few windblown ripples.
 * @param {Canvas} c
 * @param {() => number} r
 */
function drawGround(c, r) {
	rect(c, 0, 0, SIZE, SIZE, DIRT.base);
	for (let i = 0; i < 11; i++) {
		rect(
			c,
			rngInt(r, 1, 27),
			rngInt(r, 1, 28),
			rngInt(r, 2, 5),
			rngInt(r, 1, 3),
			i % 3 === 0 ? DIRT.dark : DIRT.light
		);
	}
	for (let i = 0; i < 32; i++) {
		set(
			c,
			rngInt(r, 0, 31),
			rngInt(r, 0, 31),
			i % 4 === 0 ? DIRT.dark : DIRT.grit
		);
	}
	for (let k = 0; k < 3; k++) {
		const yy = 5 + k * 10 + rngInt(r, -1, 1);
		const xx = rngInt(r, 1, 10);
		for (let j = 0; j < 12; j++) {
			if (j % 5 !== 4) {
				set(
					c,
					xx + j,
					yy + Math.round(1.2 * Math.sin(j * 0.45 + k)),
					k % 2 ? DIRT.light : DIRT.dark
				);
			}
		}
	}
}

/**
 * A random spot near the tile's rim, so the middle stays calm for a building icon.
 * @param {() => number} r
 * @returns {[number, number]}
 */
function rimSpot(r) {
	const side = rngInt(r, 0, 3);
	const along = rngInt(r, 2, 29);
	const depth = rngInt(r, 2, 7);
	return side === 0
		? [along, depth]
		: side === 1
			? [along, 31 - depth]
			: side === 2
				? [depth, along]
				: [31 - depth, along];
}

/**
 * A buildable plot.
 * @param {number} v
 * @param {() => number} r
 * @returns {Canvas}
 */
function openTile(v, r) {
	const c = createCanvas(SIZE, SIZE);
	drawGround(c, r);
	if (v === 0) {
		// Dry cracked earth in the corners.
		for (let i = 0; i < 3; i++) {
			const [x, y] = rimSpot(r);
			for (let j = 0; j < 6; j++) {
				set(
					c,
					x + j,
					y + (j % 3 === 1 ? 1 : 0) - (j > 3 ? 1 : 0),
					DIRT.dark
				);
			}
			set(c, x + 2, y + 1, DIRT.dark);
			set(c, x + 3, y + 2, DIRT.dark);
		}
	} else if (v === 1) {
		// Pebbles.
		for (let i = 0; i < 6; i++) {
			const [x, y] = rimSpot(r);
			rect(c, x, y, 2, 1, ROCK.light);
			rect(c, x, y + 1, 2, 1, ROCK.dark);
		}
	} else if (v === 2) {
		// Dry scrub tufts.
		for (let i = 0; i < 5; i++) {
			const [x, y] = rimSpot(r);
			set(c, x, y, C.brass);
			set(c, x - 1, y - 1, C.brass);
			set(c, x + 1, y - 2, C.sandShade);
			set(c, x, y - 1, C.sandShade);
		}
	} else if (v === 3) {
		// Pale sandy drifts.
		for (let i = 0; i < 2; i++) {
			const [x, y] = rimSpot(r);
			blob(
				c,
				x,
				y,
				5,
				2,
				C.sandLight,
				mix(C.sand, DIRT.light, 0.5),
				DIRT.light
			);
		}
	} else if (v === 4) {
		// A small flat stone and chips.
		const [x, y] = [rngInt(r, 4, 8), rngInt(r, 22, 27)];
		blob(c, x, y, 4, 2.5, ROCK.light, ROCK.mid, ROCK.dark);
		for (let i = 0; i < 4; i++) {
			const [a, b] = rimSpot(r);
			set(c, a, b, ROCK.mid);
		}
	} else if (v === 5) {
		// A dry bone and a dark stain.
		const [x, y] = [rngInt(r, 21, 26), rngInt(r, 5, 9)];
		rect(c, x, y, 5, 1, C.creamLight);
		set(c, x - 1, y - 1, C.cream);
		set(c, x - 1, y + 1, C.cream);
		set(c, x + 5, y - 1, C.cream);
		set(c, x + 5, y + 1, C.cream);
		rect(c, x + 1, y + 1, 4, 1, DIRT.dark);
	} else if (v === 6) {
		// Wind lines of finer sand.
		for (let k = 0; k < 5; k++) {
			const [x, y] = rimSpot(r);
			for (let j = 0; j < 7; j++) {
				set(
					c,
					x + j,
					y + Math.round(Math.sin(j * 0.7)),
					k % 2 ? DIRT.light : DIRT.dark
				);
			}
		}
	} else {
		// A little cluster of small yellow desert flowers.
		for (let i = 0; i < 4; i++) {
			const [x, y] = rimSpot(r);
			set(c, x, y, C.gold);
			set(c, x, y + 1, C.pine);
			set(c, x - 1, y + 1, C.pine);
		}
	}
	return c;
}

/**
 * A jagged dark crack from one rim to another.
 * @param {Canvas} c
 * @param {() => number} r
 * @param {number} width
 */
function crack(c, r, width) {
	let x = 4;
	for (let y = 0; y < SIZE; y++) {
		x = Math.min(24, Math.max(7, x + rngInt(r, -1, 2) - (x > 18 ? 1 : 0)));
		const half = width + ((y * 7) % 3 === 0 ? 1 : 0);
		for (let i = -half; i <= half; i++) {
			set(
				c,
				x + i,
				y,
				Math.abs(i) >= half
					? ROCK.dark
					: y % 5 === 0
						? ROCK.deep
						: ROCK.abyss
			);
		}
		set(c, x - half - 1, y, DIRT.dark);
		set(c, x + half + 1, y, DIRT.light);
	}
}

/**
 * An impassable plot.
 * @param {number} v
 * @param {() => number} r
 * @returns {Canvas}
 */
function blockedTile(v, r) {
	const c = createCanvas(SIZE, SIZE);
	drawGround(c, r);
	if (v === 0) {
		// A chasm splitting the earth.
		crack(c, r, 4);
		polygon(
			c,
			[
				[6, 8],
				[12, 6],
				[14, 14],
				[10, 18],
			],
			ROCK.deep
		);
		polygon(
			c,
			[
				[20, 20],
				[27, 17],
				[26, 26],
				[21, 27],
			],
			ROCK.deep
		);
		set(c, 8, 9, ROCK.dark);
	} else if (v === 1) {
		// Boulders fallen from the cliffs.
		blob(c, 22, 24, 11, 3, DIRT.dark, DIRT.dark, DIRT.dark);
		blob(c, 11, 21, 8, 7, ROCK.light, ROCK.mid, ROCK.dark);
		blob(c, 22, 13, 7, 6, ROCK.light, ROCK.mid, ROCK.dark);
		blob(c, 22, 24, 6, 4, ROCK.light, ROCK.mid, ROCK.dark);
		blob(c, 7, 9, 4, 3, ROCK.light, ROCK.mid, ROCK.dark);
		set(c, 9, 18, DIRT.grit);
		set(c, 20, 10, DIRT.grit);
	} else if (v === 2) {
		// A flat-topped mesa block, banded rock down its face.
		polygon(
			c,
			[
				[2, 27],
				[4, 11],
				[28, 11],
				[30, 27],
			],
			ROCK.mid
		);
		const bands = [ROCK.light, ROCK.mid, ROCK.dark, ROCK.mid, ROCK.dark];
		for (let i = 0; i < 5; i++) {
			const y = 14 + i * 3;
			const inset = Math.round((y - 11) / 8);
			rect(c, 3 + inset, y, 26 - inset * 2, 2, bands[i]);
			set(c, 4 + inset + ((i * 7) % 11), y, DIRT.light);
		}
		polygon(
			c,
			[
				[3, 11],
				[6, 4],
				[26, 4],
				[29, 11],
			],
			ROCK.light
		);
		rect(c, 6, 5, 20, 1, DIRT.light);
		rect(c, 5, 10, 22, 1, ROCK.mid);
		rect(c, 2, 28, 28, 2, DIRT.dark);
	} else if (v === 3) {
		// A sinkhole: rings of rock darkening down into the pit.
		blob(c, 16, 16, 14, 12, ROCK.light, ROCK.mid, ROCK.dark);
		blob(c, 17, 17, 11, 9, ROCK.dark, ROCK.dark, ROCK.deep);
		blob(c, 17, 18, 8, 6, ROCK.deep, ROCK.deep, ROCK.abyss);
		blob(c, 17, 19, 5, 3, ROCK.abyss, ROCK.abyss, C.night);
		set(c, 6, 9, DIRT.light);
		set(c, 25, 24, ROCK.dark);
	} else if (v === 4) {
		// Hoodoos: tall pointed spires casting shadow.
		polygon(
			c,
			[
				[0, 29],
				[8, 25],
				[30, 27],
				[26, 31],
				[4, 31],
			],
			DIRT.dark
		);
		const spire = (
			/** @type {number} */ x,
			/** @type {number} */ top,
			/** @type {number} */ w
		) => {
			polygon(
				c,
				[
					[x - w, 27],
					[x - 2, top + 4],
					[x, top],
					[x + 2, top + 4],
					[x + w, 27],
				],
				ROCK.mid
			);
			polygon(
				c,
				[
					[x - w, 27],
					[x - 2, top + 4],
					[x, top],
					[x, 27],
				],
				ROCK.light
			);
			polygon(
				c,
				[
					[x + 2, top + 4],
					[x + w, 27],
					[x + 1, 27],
				],
				ROCK.dark
			);
			rect(c, x - w + 1, top + 12, w * 2 - 2, 1, ROCK.dark);
			rect(c, x - w, top + 18, w * 2 - 1, 1, ROCK.dark);
		};
		spire(9, 9, 6);
		spire(22, 5, 6);
		spire(15, 14, 4);
	} else {
		// A deep gorge running down the plot, with striped walls.
		polygon(
			c,
			[
				[3, 0],
				[29, 0],
				[26, 32],
				[6, 32],
			],
			ROCK.mid
		);
		for (let y = 0; y < SIZE; y += 5) {
			rect(
				c,
				4 + (y % 3),
				y,
				24 - (y % 3) * 2,
				2,
				y % 10 === 0 ? ROCK.light : ROCK.dark
			);
		}
		polygon(
			c,
			[
				[10, 0],
				[22, 0],
				[20, 32],
				[12, 32],
			],
			ROCK.deep
		);
		polygon(
			c,
			[
				[13, 0],
				[19, 0],
				[18, 32],
				[14, 32],
			],
			ROCK.abyss
		);
		for (let y = 0; y < SIZE; y += 6) {
			set(c, 11 + (y % 4), y + 2, ROCK.dark);
			set(c, 20 - (y % 3), y + 3, ROCK.dark);
		}
	}
	return c;
}

/**
 * One 32×32 plot of this biome.
 * @param {boolean} blocked - An impassable plot
 * @param {number} variant - 0-7 for a buildable plot, 0-5 for an impassable one
 * @returns {Canvas}
 */
export function drawBiomeTile(blocked, variant) {
	const random = seededRandom(8801 + variant * 7919 + (blocked ? 50021 : 0));
	return blocked ? blockedTile(variant, random) : openTile(variant, random);
}

/**
 * Which tile the example mat uses at each plot: `{ blocked, variant }`, rows top first. The mat is composed from exactly these tiles.
 * @returns {{ blocked: boolean, variant: number }[][]}
 */
export function placement() {
	return LAYOUT.map((line, row) =>
		[...line].map((ch, col) => {
			const blocked = ch === 'X';
			const hash =
				(row + 1) * 193 +
				(col + 1) * 389 +
				(row + 1) * (col + 3) * 71 +
				(row * row + col * col) * 43;
			return { blocked, variant: hash % (blocked ? 6 : 8) };
		})
	);
}

/**
 * Draws a saguaro cactus, a green trunk with two arms, standing in the middle of a plot.
 * @param {Canvas} c
 * @param {number} x0 - The plot's left pixel
 * @param {number} y0 - The plot's top pixel
 */
function drawCactus(c, x0, y0) {
	/** @type {(x: number, y: number, w: number, h: number, col: Colour) => void} */
	const f = (x, y, w, h, col) => rect(c, x0 + x, y0 + y, w, h, col);
	// Shadow on the ground.
	f(9, 26, 15, 3, DIRT.dark);
	f(11, 25, 11, 1, DIRT.dark);
	// Trunk.
	f(14, 6, 5, 20, C.pine);
	f(14, 7, 2, 18, C.pineLight);
	f(18, 7, 1, 18, C.pineShade);
	f(15, 5, 3, 1, C.pine);
	// Left arm.
	f(9, 12, 5, 3, C.pine);
	f(9, 8, 3, 5, C.pine);
	f(9, 8, 1, 5, C.pineLight);
	f(11, 9, 1, 5, C.pineShade);
	// Right arm.
	f(19, 15, 5, 3, C.pine);
	f(21, 11, 3, 5, C.pine);
	f(21, 11, 1, 5, C.pineLight);
	f(23, 12, 1, 6, C.pineShade);
	// Ribs and spines.
	for (const [x, y] of [
		[16, 10],
		[16, 15],
		[16, 20],
		[10, 10],
		[22, 13],
	]) {
		set(c, x0 + x, y0 + y, C.pineShade);
	}
	for (const [x, y] of [
		[13, 9],
		[19, 12],
		[13, 20],
		[19, 22],
		[8, 9],
		[24, 12],
		[17, 5],
	]) {
		set(c, x0 + x, y0 + y, C.creamLight);
	}
	// A flower on top.
	set(c, x0 + 16, y0 + 4, C.brickRedLight);
	set(c, x0 + 17, y0 + 4, C.gold);
}

/**
 * The example mat, composed from this biome's tiles on its printed layout, with a cactus on each printed 'C' plot.
 * @returns {Canvas}
 */
export function drawBiomeMat() {
	const rows = LAYOUT.length;
	const cols = LAYOUT[0].length;
	const mat = createCanvas(cols * SIZE, rows * SIZE);
	const plan = placement();
	for (let row = 0; row < rows; row++) {
		for (let col = 0; col < cols; col++) {
			const { blocked, variant } = plan[row][col];
			const tile = drawBiomeTile(blocked, variant);
			for (let y = 0; y < SIZE; y++) {
				for (let x = 0; x < SIZE; x++) {
					set(
						mat,
						col * SIZE + x,
						row * SIZE + y,
						tile.p[y * SIZE + x]
					);
				}
			}
			if (LAYOUT[row][col] === 'C') {
				drawCactus(mat, col * SIZE, row * SIZE);
			}
		}
	}
	return mat;
}
