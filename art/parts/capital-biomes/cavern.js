// Capital terrain for the Cavern advanced mat (#6): dark cave floor, crystals, stalagmites and pits.
import { createCanvas, rect, set, mix, seededRandom } from '../../painter.js';
import { PALETTE as C } from '../../palette.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/**
 * The mat's printed layout (research 03 §Cavern, #9), one string per row, top first: '.' an open plot, 'X' an impassable one.
 * The nine 3×3 districts, the unlocking rule and the row values (printed on the right edge, not legible in the photos) are not drawn.
 * @type {readonly string[]}
 */
export const LAYOUT = [
	'XX...XXX.',
	'...X..X..',
	'...X..X..',
	'...X.....',
	'..XX.....',
	'..XXX....',
	'.........',
	'....X....',
	'...XXXX..',
];

const SIZE = 32;

/** Cave colours, blended from the palette so the set stays one family. */
const K = {
	base: mix(C.stoneShade, C.night, 0.42),
	dark: mix(C.stoneShade, C.night, 0.68),
	light: mix(C.stoneShade, C.stone, 0.12),
	detail: mix(C.stone, C.stoneShade, 0.55),
	rockLight: C.stoneLight,
	rock: C.stone,
	rockMid: C.stoneMid,
	rockShade: C.stoneShade,
	rockDeep: mix(C.stoneShade, C.night, 0.5),
	outline: C.ink,
};

/**
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
 * Fills an ellipse.
 * @param {Canvas} c
 * @param {number} cx
 * @param {number} cy
 * @param {number} rx
 * @param {number} ry
 * @param {Colour} col
 */
function ellipse(c, cx, cy, rx, ry, col) {
	for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
		for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
			if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) {
				set(c, x, y, col);
			}
		}
	}
}

/**
 * @param {() => number} r
 * @param {number} a
 * @param {number} b
 */
function int(r, a, b) {
	return a + Math.floor(r() * (b - a + 1));
}

/**
 * Draws the cave floor: dark rock with coherent low-contrast patches and fine grit.
 * @param {Canvas} c
 * @param {() => number} r
 */
function ground(c, r) {
	rect(c, 0, 0, SIZE, SIZE, K.base);
	for (let i = 0; i < 11; i++) {
		rect(
			c,
			int(r, 1, 27),
			int(r, 1, 28),
			int(r, 2, 6),
			int(r, 1, 3),
			i % 3 === 0 ? K.dark : K.light
		);
	}
	for (let i = 0; i < 40; i++) {
		set(c, int(r, 0, 31), int(r, 0, 31), i % 4 === 0 ? K.dark : K.detail);
	}
	for (let i = 0; i < 6; i++) {
		const x = int(r, 2, 27);
		const y = int(r, 2, 29);
		rect(c, x, y, 3, 1, K.dark);
		set(c, x, y - 1, K.light);
	}
}

/**
 * A pointed cone, lit from the top left, with an ink outline.
 * @param {Canvas} c
 * @param {number} cx - Centre of the base
 * @param {number} by - Base row
 * @param {number} w - Base width
 * @param {number} h - Height
 * @param {Colour} light
 * @param {Colour} mid
 * @param {Colour} dark
 */
function cone(c, cx, by, w, h, light, mid, dark) {
	const top = by - h;
	for (let y = top; y <= by; y++) {
		const hw = Math.max(0, Math.round(((w / 2) * (y - top)) / h));
		for (let x = cx - hw; x <= cx + hw; x++) {
			let col = mid;
			if (x < cx - hw * 0.15) {
				col = light;
			} else if (x > cx + hw * 0.35) {
				col = dark;
			}
			set(c, x, y, col);
		}
		set(c, cx - hw - 1, y, K.outline);
		set(c, cx + hw + 1, y, K.outline);
	}
	set(c, cx, top - 1, K.outline);
	for (let x = cx - Math.round(w / 2); x <= cx + Math.round(w / 2); x++) {
		set(c, x, by + 1, K.outline);
	}
}

/**
 * A cluster of crystal shards.
 * @param {Canvas} c
 * @param {number} cx
 * @param {number} by
 * @param {number} h
 * @param {boolean} big
 */
function crystals(c, cx, by, h, big) {
	const shards = big
		? [
				[cx - 7, by, 5, h - 6],
				[cx + 6, by - 1, 5, h - 4],
				[cx, by + 1, 7, h],
				[cx - 3, by - 2, 4, h - 9],
			]
		: [
				[cx - 3, by, 3, h - 2],
				[cx + 3, by, 3, h],
				[cx, by + 1, 4, h + 2],
			];
	for (const [x, y, w, hh] of shards) {
		cone(c, x, y, w, hh, C.tealLight, C.teal, C.tealShade);
	}
}

/**
 * Soft shadow under an object.
 * @param {Canvas} c
 * @param {number} cx
 * @param {number} cy
 * @param {number} rx
 */
function shade(c, cx, cy, rx) {
	ellipse(c, cx, cy, rx, 3, K.dark);
}

/**
 * Small decoration on an open plot, kept to the edges so a building icon reads on top.
 * @param {Canvas} c
 * @param {number} v
 * @param {() => number} r
 */
function scatter(c, v, r) {
	switch (v) {
		case 0:
			for (let i = 0; i < 6; i++) {
				const x = int(r, 2, 27);
				const y = int(r, 2, 27);
				rect(c, x, y, 2, 2, K.rockMid);
				set(c, x, y, K.rock);
				set(c, x + 1, y + 2, K.dark);
			}
			break;
		case 1: {
			let x = 3;
			let y = 22;
			for (let i = 0; i < 18; i++) {
				set(c, x, y, K.dark);
				x += 1;
				y += int(r, -1, 1) * (i % 2);
				if (i % 5 === 4) {
					set(c, x, y - 1, K.dark);
				}
			}
			break;
		}
		case 2:
			cone(c, 5, 8, 2, 4, C.tealLight, C.teal, C.tealShade);
			cone(c, 8, 9, 2, 3, C.tealLight, C.teal, C.tealShade);
			set(c, 6, 11, mix(K.base, C.teal, 0.4));
			set(c, 4, 10, mix(K.base, C.teal, 0.3));
			cone(c, 26, 28, 2, 4, C.tealLight, C.teal, C.tealShade);
			break;
		case 3:
			ellipse(c, 24, 25, 5, 2.5, C.nightSea3);
			ellipse(c, 24, 25, 4, 1.6, C.nightSea2);
			rect(c, 22, 24, 3, 1, C.nightSea1);
			set(c, 26, 25, C.nightWaveDeep);
			ellipse(c, 6, 6, 2, 1, C.nightSea3);
			break;
		case 4:
			for (let i = 0; i < 9; i++) {
				const x = int(r, 1, 29);
				const y = int(r, 1, 29);
				rect(c, x, y, 2, 1, K.rockMid);
				set(c, x, y - 1, K.rockLight);
				set(c, x + 1, y + 1, K.rockDeep);
			}
			break;
		case 5:
			for (const [x, y, s] of [
				[5, 24, 3],
				[9, 26, 2],
				[26, 6, 2],
			]) {
				rect(c, x, y - 1, 1, 2, K.detail);
				rect(c, x - s + 1, y - 2, s * 2 - 1, 1, C.arcane);
				set(c, x - s + 2, y - 2, C.arcaneLight);
				set(c, x - s + 1, y - 1, C.arcaneShade);
			}
			break;
		case 6:
			for (let i = 0; i < 3; i++) {
				const x = 4 + i * 11;
				ellipse(c, x + 3, 6 + (i % 2) * 18, 3, 2, K.dark);
				set(c, x + 3, 5 + (i % 2) * 18, K.light);
			}
			break;
		default:
			for (let i = 0; i < 5; i++) {
				const x = int(r, 2, 24);
				const y = int(r, 2, 28);
				rect(c, x, y, 3, 1, mix(C.forestFloorShade, K.base, 0.35));
				set(c, x + 1, y - 1, mix(C.forestFloor, K.base, 0.4));
			}
			break;
	}
}

/**
 * An impassable obstacle that fills most of the plot.
 * @param {Canvas} c
 * @param {number} v
 * @param {() => number} r
 */
function obstacle(c, v, r) {
	switch (v) {
		case 0:
			shade(c, 16, 28, 13);
			cone(c, 9, 28, 10, 18, K.rockLight, K.rock, K.rockShade);
			cone(c, 21, 27, 8, 13, K.rockLight, K.rock, K.rockShade);
			cone(c, 15, 29, 12, 24, K.rockLight, K.rockMid, K.rockShade);
			break;
		case 1:
			// An irregular boulder with flat facets and chips off it.
			shade(c, 16, 28, 13);
			polygon(
				c,
				[
					[3, 27],
					[2, 20],
					[6, 14],
					[5, 10],
					[11, 6],
					[16, 8],
					[22, 4],
					[27, 10],
					[26, 15],
					[30, 21],
					[28, 28],
					[17, 30],
				],
				K.outline
			);
			polygon(
				c,
				[
					[4, 27],
					[3, 20],
					[7, 14],
					[6, 10],
					[11, 7],
					[16, 9],
					[22, 5],
					[26, 10],
					[25, 15],
					[29, 21],
					[27, 27],
					[17, 29],
				],
				K.rock
			);
			polygon(
				c,
				[
					[3, 20],
					[7, 14],
					[6, 10],
					[11, 7],
					[16, 9],
					[13, 15],
					[9, 19],
					[8, 26],
					[4, 27],
				],
				K.rockLight
			);
			polygon(
				c,
				[
					[16, 9],
					[22, 5],
					[26, 10],
					[20, 13],
					[13, 15],
				],
				K.rockMid
			);
			polygon(
				c,
				[
					[25, 15],
					[29, 21],
					[27, 27],
					[19, 29],
					[18, 22],
					[22, 18],
				],
				K.rockShade
			);
			polygon(
				c,
				[
					[8, 26],
					[9, 19],
					[13, 15],
					[18, 22],
					[19, 29],
					[17, 29],
				],
				K.rockMid
			);
			rect(c, 1, 29, 3, 2, K.outline);
			rect(c, 1, 29, 2, 1, K.rockLight);
			rect(c, 28, 29, 2, 2, K.outline);
			set(c, 28, 29, K.rock);
			break;
		case 2:
			shade(c, 16, 28, 12);
			crystals(c, 16, 28, 22, true);
			break;
		case 3:
			ellipse(c, 16, 17, 14, 11, K.outline);
			ellipse(c, 16, 17, 13, 10, K.rockLight);
			ellipse(c, 16, 18, 11, 8, K.rockShade);
			ellipse(c, 16, 19, 9, 6, C.night);
			ellipse(c, 16, 20, 6, 3, C.ink);
			for (let i = 0; i < 6; i++) {
				rect(c, int(r, 6, 24), int(r, 8, 24), 2, 1, K.rockMid);
			}
			break;
		case 4:
			shade(c, 16, 29, 11);
			cone(c, 16, 29, 14, 28, K.rockLight, K.rock, K.rockShade);
			polygon(
				c,
				[
					[14, 0],
					[18, 0],
					[17, 8],
					[16, 11],
					[15, 8],
				],
				K.outline
			);
			polygon(
				c,
				[
					[15, 0],
					[17, 0],
					[16.5, 8],
					[16, 9],
				],
				K.rock
			);
			rect(c, 15, 12, 3, 2, K.rockLight);
			break;
		default:
			shade(c, 16, 28, 13);
			for (const [x, y, w, h] of [
				[7, 28, 10, 11],
				[19, 29, 11, 15],
				[13, 26, 8, 10],
				[25, 28, 6, 8],
			]) {
				cone(c, x, y, w, h, K.rockLight, K.rock, K.rockShade);
			}
			for (const [x, y] of [
				[6, 20],
				[24, 14],
			]) {
				rect(c, x, y - 1, 1, 2, K.detail);
				rect(c, x - 1, y - 2, 3, 1, C.arcane);
				set(c, x - 1, y - 2, C.arcaneLight);
			}
			break;
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
	const r = seededRandom(9001 + v * 7919 + (blocked ? 40009 : 0));
	const c = createCanvas(SIZE, SIZE);
	ground(c, r);
	if (blocked) {
		obstacle(c, v, r);
	} else {
		scatter(c, v, r);
	}
	return c;
}

/**
 * Which tile each plot of the example mat uses, so tests and the drawing agree.
 * @returns {{ row: number, col: number, blocked: boolean, variant: number }[]}
 */
export function matPlan() {
	const plan = [];
	for (let row = 0; row < LAYOUT.length; row++) {
		for (let col = 0; col < LAYOUT[row].length; col++) {
			const blocked = LAYOUT[row][col] === 'X';
			const hash =
				Math.imul((row * 9 + col + 1) * 2654435761, 40503) >>> 13;
			plan.push({ row, col, blocked, variant: hash % (blocked ? 6 : 8) });
		}
	}
	return plan;
}

/**
 * The example mat, composed from this biome's tiles on its printed layout.
 * @returns {Canvas}
 */
export function drawBiomeMat() {
	const mat = createCanvas(LAYOUT[0].length * SIZE, LAYOUT.length * SIZE);
	for (const { row, col, blocked, variant } of matPlan()) {
		const tile = drawBiomeTile(blocked, variant);
		for (let y = 0; y < SIZE; y++) {
			for (let x = 0; x < SIZE; x++) {
				mat.p[(row * SIZE + y) * mat.w + col * SIZE + x] =
					tile.p[y * SIZE + x];
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
		open: Object.freeze([0, 1, 2, 3, 4, 5, 6, 7]),
		blocked: Object.freeze([0, 1, 2, 3, 4, 5]),
	}),
	special: Object.freeze([]),
	matOnly: Object.freeze([]),
});
