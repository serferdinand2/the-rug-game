// Capital terrain for the Cloud City advanced mat (#6): cloud surfaces in four tints, storm clouds and sky gaps.
import { createCanvas, rect, set, mix, seededRandom } from '../../painter.js';
import { PALETTE as C } from '../../palette.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/**
 * The mat's printed layout (research 03 §Cloud City, #10), one string per row, top first: '.' an open plot, 'X' an impassable one.
 * The cloud (district) each plot belongs to is in `CLOUDS`.
 * @type {readonly string[]}
 */
export const LAYOUT = [
	'......X..',
	'........X',
	'.X......X',
	'XX.....XX',
	'.........',
	'.....XX..',
	'XXX....XX',
	'X...X..X.',
	'X..XXX...',
];

/**
 * The cloud (district) of each plot, one digit 1-9 per plot, as reconstructed in the research from the mat's fill colours.
 * @type {readonly string[]}
 */
export const CLOUDS = [
	'111222233',
	'111222333',
	'114442335',
	'664445555',
	'664445555',
	'666667788',
	'666977788',
	'999977788',
	'999997888',
];

/**
 * Each cloud's tint: 0 white, 1 grey, 2 tan, 3 cream (research table; cloud 1 grey, 2 tan, 3 cream, 4 white, 5 grey, 6 cream, 7 tan, 8 white, 9 white).
 * @type {readonly number[]}
 */
export const CLOUD_TINTS = [0, 1, 2, 3, 0, 1, 3, 2, 0, 0];

const SIZE = 32;

/** Cloud surface colours per tint: base, lit, shaded and a line colour for the cloud's rim. */
const TINTS = [
	{
		base: mix(C.white, C.cloudShade, 0.35),
		light: C.white,
		dark: C.cloudShade,
		rim: mix(C.cloudShade, C.daySky3, 0.55),
	},
	{
		base: mix(C.cloudShade, C.stone, 0.4),
		light: mix(C.cloudShade, C.stone, 0.2),
		dark: mix(C.cloudShade, C.stone, 0.62),
		rim: mix(C.stone, C.stoneShade, 0.5),
	},
	{
		base: mix(C.sandLight, C.cloudShade, 0.25),
		light: C.creamLight,
		dark: mix(C.sandLight, C.sandShade, 0.5),
		rim: mix(C.sandShade, C.timber, 0.4),
	},
	{
		base: mix(C.cream, C.white, 0.35),
		light: C.creamLight,
		dark: C.creamShade,
		rim: mix(C.creamShade, C.plasterShade, 0.5),
	},
];

/** Storm colours, for the impassable clouds. */
const STORM = {
	light: mix(C.stone, C.cloudShade, 0.2),
	mid: C.stoneMid,
	dark: C.stoneShade,
	deep: mix(C.stoneShade, C.night, 0.45),
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
 * A round puff with an outline, a lit top left and a shaded underside.
 * @param {Canvas} c
 * @param {number} cx
 * @param {number} cy
 * @param {number} r
 * @param {{ light: Colour, mid: Colour, dark: Colour, outline: Colour }} p
 */
function puff(c, cx, cy, r, p) {
	ellipse(c, cx, cy, r + 1, r + 1, p.outline);
	ellipse(c, cx, cy, r, r, p.dark);
	ellipse(c, cx - 0.5, cy - 0.8, r - 1, r - 1.5, p.mid);
	ellipse(c, cx - r * 0.3, cy - r * 0.35, r * 0.55, r * 0.5, p.light);
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
 * Draws the cloud surface: a soft base with lighter and shaded swells and curled arcs.
 * @param {Canvas} c
 * @param {() => number} r
 * @param {number} tint
 */
function ground(c, r, tint) {
	const t = TINTS[tint];
	rect(c, 0, 0, SIZE, SIZE, t.base);
	for (let i = 0; i < 9; i++) {
		ellipse(
			c,
			int(r, 2, 29),
			int(r, 2, 29),
			int(r, 3, 7),
			int(r, 2, 3),
			i % 3 === 0 ? t.dark : t.light
		);
	}
	// Re-soften: base-coloured pixels break up the patch edges.
	for (let i = 0; i < 40; i++) {
		set(c, int(r, 0, 31), int(r, 0, 31), t.base);
	}
	for (let i = 0; i < 5; i++) {
		const cx = int(r, 4, 27);
		const cy = int(r, 4, 27);
		const rad = int(r, 3, 5);
		for (let a = 0.2; a < 2.6; a += 0.2) {
			set(
				c,
				Math.round(cx + Math.cos(a + 3.3) * rad),
				Math.round(cy + Math.sin(a + 3.3) * rad),
				t.dark
			);
		}
		set(c, cx - rad + 1, cy - 1, t.light);
	}
	for (let i = 0; i < 8; i++) {
		set(c, int(r, 1, 30), int(r, 1, 30), t.light);
	}
}

/**
 * Small decoration on an open plot, kept to the edges so a building icon reads on top.
 * @param {Canvas} c
 * @param {number} v
 * @param {() => number} r
 * @param {number} tint
 */
function scatter(c, v, r, tint) {
	const t = TINTS[tint];
	switch (v) {
		case 0:
			break;
		case 1:
			for (let k = 0; k < 3; k++) {
				const y = 5 + k * 11;
				for (let x = 3; x < 17; x++) {
					set(
						c,
						x + k * 6,
						y + Math.round(1.3 * Math.sin(x * 0.5 + k)),
						k % 2 ? t.light : t.dark
					);
				}
			}
			break;
		case 2:
			for (const [x, y] of [
				[5, 6],
				[26, 12],
				[9, 27],
			]) {
				set(c, x, y, C.gold);
				set(c, x - 1, y, C.lampGlow);
				set(c, x + 1, y, C.lampGlow);
				set(c, x, y - 1, C.lampGlow);
				set(c, x, y + 1, C.lampGlow);
			}
			break;
		case 3:
			for (const [x, y, rad] of [
				[3, 3, 3],
				[8, 2, 2],
				[28, 29, 3],
				[23, 30, 2],
			]) {
				ellipse(c, x, y, rad, rad, t.light);
				ellipse(c, x + 0.5, y + 1, rad - 1, rad - 1, t.base);
			}
			break;
		case 4:
			for (let i = 0; i < 7; i++) {
				const x = int(r, 2, 29);
				const y = int(r, 2, 29);
				set(c, x, y, C.daySky5);
				set(c, x + 1, y, C.daySky6);
			}
			break;
		case 5:
			for (const [x, y] of [
				[4, 24],
				[22, 5],
			]) {
				for (let i = 0; i < 6; i++) {
					set(c, x + i, y + (i % 2), t.light);
					set(c, x + i + 1, y + 2 - (i % 2), t.dark);
				}
			}
			break;
		case 6:
			for (const [x, y] of [
				[25, 24],
				[5, 8],
			]) {
				ellipse(c, x, y, 3, 2, mix(t.base, C.daySky5, 0.55));
				ellipse(c, x, y, 2, 1, mix(t.base, C.daySky4, 0.45));
			}
			break;
		default:
			for (let i = 0; i < 4; i++) {
				const x = int(r, 3, 27);
				const y = int(r, 3, 27);
				rect(c, x, y, 2, 1, C.white);
				set(c, x + 1, y + 1, t.dark);
			}
			break;
	}
}

/**
 * Soft shadow under an obstacle, cast on the cloud.
 * @param {Canvas} c
 * @param {number} cy
 * @param {number} rx
 * @param {number} tint
 */
function shade(c, cy, rx, tint) {
	ellipse(c, 16, cy, rx, 3, TINTS[tint].dark);
}

/**
 * An impassable obstacle that fills most of the plot.
 * @param {Canvas} c
 * @param {number} v
 * @param {() => number} r
 * @param {number} tint
 */
function obstacle(c, v, r, tint) {
	switch (v) {
		case 0:
			shade(c, 28, 13, tint);
			puff(c, 9, 20, 7, STORM);
			puff(c, 23, 20, 7, STORM);
			puff(c, 16, 14, 9, STORM);
			puff(c, 16, 22, 7, STORM);
			polygon(
				c,
				[
					[17, 18],
					[12, 25],
					[16, 25],
					[13, 31],
					[21, 22],
					[17, 22],
					[20, 18],
				],
				C.ink
			);
			polygon(
				c,
				[
					[17, 19],
					[13, 24],
					[17, 24],
					[14, 29],
					[20, 22],
					[16, 21],
					[19, 19],
				],
				C.gold
			);
			break;
		case 1:
			shade(c, 29, 12, tint);
			polygon(
				c,
				[
					[6, 29],
					[10, 14],
					[14, 17],
					[17, 4],
					[21, 14],
					[25, 11],
					[27, 29],
				],
				C.ink
			);
			polygon(
				c,
				[
					[8, 29],
					[11, 16],
					[14, 19],
					[17, 6],
					[20, 15],
					[25, 13],
					[26, 29],
				],
				C.stone
			);
			polygon(
				c,
				[
					[8, 29],
					[11, 16],
					[14, 19],
					[17, 6],
					[16, 15],
					[14, 24],
					[15, 29],
				],
				C.stoneLight
			);
			polygon(
				c,
				[
					[26, 29],
					[25, 13],
					[20, 15],
					[17, 6],
					[18, 17],
					[19, 24],
					[18, 29],
				],
				C.stoneShade
			);
			puff(c, 8, 28, 4, {
				light: C.white,
				mid: TINTS[0].base,
				dark: C.cloudShade,
				outline: TINTS[0].rim,
			});
			puff(c, 25, 28, 4, {
				light: C.white,
				mid: TINTS[0].base,
				dark: C.cloudShade,
				outline: TINTS[0].rim,
			});
			break;
		case 2:
			ellipse(c, 16, 16, 14, 11, TINTS[tint].rim);
			ellipse(c, 16, 16, 13, 10, C.daySky4);
			ellipse(c, 16, 15, 11, 8, C.daySky3);
			ellipse(c, 16, 14, 8, 5, C.daySky2);
			rect(c, 8, 16, 3, 1, C.daySky5);
			rect(c, 20, 13, 3, 1, C.daySky5);
			puff(c, 5, 22, 3, {
				light: C.white,
				mid: TINTS[0].base,
				dark: C.cloudShade,
				outline: TINTS[0].rim,
			});
			puff(c, 27, 21, 3, {
				light: C.white,
				mid: TINTS[0].base,
				dark: C.cloudShade,
				outline: TINTS[0].rim,
			});
			break;
		case 3:
			shade(c, 28, 14, tint);
			puff(c, 8, 22, 6, STORM);
			puff(c, 22, 21, 7, STORM);
			puff(c, 14, 14, 8, STORM);
			puff(c, 25, 13, 5, STORM);
			for (const x of [10, 16, 22]) {
				for (let k = 0; k < 4; k++) {
					set(c, x - k, 26 + k, C.nightWaveDeep);
				}
			}
			break;
		case 4:
			ellipse(c, 16, 16, 14, 14, STORM.dark);
			ellipse(c, 16, 16, 13, 13, STORM.mid);
			for (let a = 0; a < 15; a += 0.15) {
				const rad = 1 + a * 0.82;
				set(
					c,
					Math.round(16 + Math.cos(a) * rad),
					Math.round(16 + Math.sin(a) * rad),
					a % 2 > 1 ? STORM.light : C.cloudShade
				);
				set(
					c,
					Math.round(16 + Math.cos(a) * (rad + 1)),
					Math.round(16 + Math.sin(a) * (rad + 1)),
					STORM.dark
				);
			}
			ellipse(c, 16, 16, 2, 2, STORM.deep);
			break;
		default:
			// An anvil cumulonimbus: a broad base, a body wider than it is tall, and a flat spread-out top.
			shade(c, 29, 13, tint);
			puff(c, 6, 25, 4, STORM);
			puff(c, 26, 25, 4, STORM);
			puff(c, 11, 25, 5, STORM);
			puff(c, 21, 25, 5, STORM);
			puff(c, 9, 19, 5, STORM);
			puff(c, 23, 19, 5, STORM);
			puff(c, 16, 21, 7, STORM);
			puff(c, 12, 14, 5, STORM);
			puff(c, 20, 14, 5, STORM);
			puff(c, 16, 12, 5, STORM);
			// The anvil: a flat-topped, flat-bottomed cap spreading wider than the body.
			polygon(
				c,
				[
					[0, 11],
					[3, 5],
					[29, 5],
					[32, 11],
					[27, 12],
					[5, 12],
				],
				STORM.outline
			);
			polygon(
				c,
				[
					[1, 11],
					[4, 6],
					[28, 6],
					[31, 11],
					[27, 11],
					[5, 11],
				],
				STORM.mid
			);
			rect(c, 6, 6, 18, 1, STORM.light);
			rect(c, 5, 7, 12, 1, STORM.light);
			rect(c, 5, 11, 22, 1, STORM.dark);
			rect(c, 22, 8, 6, 1, STORM.dark);
			rect(c, 8, 17, 4, 1, STORM.light);
			rect(c, 14, 20, 5, 1, STORM.light);
			for (const x of [8, 15, 23]) {
				for (let k = 0; k < 3; k++) {
					set(c, x - k, 30 + (k % 2) - 1, C.nightWaveDeep);
				}
			}
			break;
	}
	void r;
}

/**
 * One 32×32 plot of this biome. `tint` (0 white, 1 grey, 2 tan, 3 cream) picks the cloud's colour on the mat; the default is white.
 * @param {boolean} blocked - An impassable plot
 * @param {number} variant - 0-7 for a buildable plot, 0-5 for an impassable one
 * @param {number} [tint] - The cloud tint, 0-3
 * @returns {Canvas}
 */
export function drawBiomeTile(blocked, variant, tint = 0) {
	const count = blocked ? 6 : 8;
	const v = ((variant % count) + count) % count;
	const r = seededRandom(
		7331 + v * 6007 + (blocked ? 30011 : 0) + tint * 101
	);
	const c = createCanvas(SIZE, SIZE);
	ground(c, r, tint);
	if (blocked) {
		obstacle(c, v, r, tint);
	} else {
		scatter(c, v, r, tint);
	}
	return c;
}

/**
 * Which tile each plot of the example mat uses, so tests and the drawing agree.
 * @returns {{ row: number, col: number, blocked: boolean, variant: number, tint: number }[]}
 */
export function matPlan() {
	const plan = [];
	for (let row = 0; row < LAYOUT.length; row++) {
		for (let col = 0; col < LAYOUT[row].length; col++) {
			const blocked = LAYOUT[row][col] === 'X';
			const hash =
				Math.imul((row * 9 + col + 1) * 2654435761, 40503) >>> 13;
			plan.push({
				row,
				col,
				blocked,
				variant: hash % (blocked ? 6 : 8),
				tint: CLOUD_TINTS[Number(CLOUDS[row][col])],
			});
		}
	}
	return plan;
}

/**
 * The example mat: the tiles on the printed layout, with each cloud's rim drawn between districts.
 * @returns {Canvas}
 */
export function drawBiomeMat() {
	const mat = createCanvas(LAYOUT[0].length * SIZE, LAYOUT.length * SIZE);
	for (const { row, col, blocked, variant, tint } of matPlan()) {
		const tile = drawBiomeTile(blocked, variant, tint);
		for (let y = 0; y < SIZE; y++) {
			for (let x = 0; x < SIZE; x++) {
				mat.p[(row * SIZE + y) * mat.w + col * SIZE + x] =
					tile.p[y * SIZE + x];
			}
		}
	}
	// Rims: a scalloped dark line with a light edge where two clouds meet, kept within 3 pixels of the plot edge.
	const rows = CLOUDS.length;
	const cols = CLOUDS[0].length;
	for (let row = 0; row < rows; row++) {
		for (let col = 0; col < cols; col++) {
			const here = CLOUDS[row][col];
			const tint = TINTS[CLOUD_TINTS[Number(here)]];
			if (col + 1 < cols && CLOUDS[row][col + 1] !== here) {
				const e = (col + 1) * SIZE;
				for (let k = 0; k < SIZE; k++) {
					const d = Math.round(
						1.2 * Math.sin((row * SIZE + k) * 0.55)
					);
					set(mat, e - 1 + d, row * SIZE + k, tint.rim);
					set(mat, e + d, row * SIZE + k, tint.rim);
					set(mat, e - 2 + d, row * SIZE + k, tint.light);
				}
			}
			if (row + 1 < rows && CLOUDS[row + 1][col] !== here) {
				const e = (row + 1) * SIZE;
				for (let k = 0; k < SIZE; k++) {
					const d = Math.round(
						1.2 * Math.sin((col * SIZE + k) * 0.55)
					);
					set(mat, col * SIZE + k, e - 1 + d, tint.rim);
					set(mat, col * SIZE + k, e + d, tint.rim);
					set(mat, col * SIZE + k, e - 2 + d, tint.light);
				}
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
	matOnly: Object.freeze([
		Object.freeze({
			name: 'cloud tints',
			where: 'The tint argument of drawBiomeTile: CLOUD_TINTS[CLOUDS[row][col]] gives each plot its cloud colour (white, grey, tan or cream)',
		}),
		Object.freeze({
			name: 'cloud rims',
			where: 'A scalloped rim drawn along every edge between two different clouds in CLOUDS',
		}),
	]),
});
