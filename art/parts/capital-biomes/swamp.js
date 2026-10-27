// Capital terrain for the Swamp advanced mat (#6): murky mud and black water, with lily pads on their plots.
import { createCanvas, rect, set, line, seededRandom } from '../../painter.js';
import { PALETTE as C } from '../../palette.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/**
 * The mat's printed layout, one string per row, top first: '.' an open plot, 'X' an impassable one (18 of them),
 * and 'L' a lily pad (6 of them). A lily pad plot is open: it counts as completed, but may be built over.
 * Source: docs/research/03-expansions.md, Swamp (#12). The mat's rule text about losing 2 VP per visible lily pad
 * is text, so it isn't drawn.
 * @type {readonly string[]}
 */
export const LAYOUT = [
	'XXL......',
	'X...LXX..',
	'.......XL',
	'..X....XX',
	'...XX....',
	'...XX....',
	'.LXXXL...',
	'.....X.L.',
	'.....X...',
];

const SIZE = 32;

/** @param {() => number} r @param {number} min @param {number} max @returns {number} */
function int(r, min, max) {
	return min + Math.floor(r() * (max - min + 1));
}

/** @param {Canvas} c @param {number} cx @param {number} cy @param {number} rx @param {number} ry @param {Colour} col */
function ellipse(c, cx, cy, rx, ry, col) {
	for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
		for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
			const dx = (x + 0.5 - cx) / rx;
			const dy = (y + 0.5 - cy) / ry;
			if (dx * dx + dy * dy <= 1) {
				set(c, x, y, col);
			}
		}
	}
}

/**
 * Dark wet mud with soft patches and speckles.
 * @param {Canvas} c
 * @param {() => number} r
 */
function ground(c, r) {
	rect(c, 0, 0, SIZE, SIZE, C.swampMud);
	for (let i = 0; i < 11; i++) {
		rect(
			c,
			int(r, 1, 27),
			int(r, 1, 28),
			int(r, 3, 6),
			int(r, 1, 3),
			i % 3 === 0 ? C.swampMudShade : C.swampMudLight
		);
	}
	for (let i = 0; i < 38; i++) {
		set(
			c,
			int(r, 0, 31),
			int(r, 0, 31),
			i % 4 === 0
				? C.swampMudShade
				: i % 5 === 0
					? C.swampMoss
					: C.swampMudLight
		);
	}
}

/**
 * A pool of black water with a muddy bank.
 * @param {Canvas} c
 * @param {number} cx
 * @param {number} cy
 * @param {number} rx
 * @param {number} ry
 * @param {boolean} [edge] - A dark ink rim, for impassable pools
 */
function pool(c, cx, cy, rx, ry, edge = false) {
	if (edge) {
		ellipse(c, cx, cy, rx + 2, ry + 2, C.ink);
	}
	ellipse(c, cx, cy, rx + 1, ry + 1, C.swampMudShade);
	ellipse(c, cx, cy, rx, ry, C.swampWater);
	ellipse(c, cx, cy + ry / 3, rx * 0.8, ry * 0.55, C.swampWaterDeep);
	// A glint and a ripple
	rect(
		c,
		Math.round(cx - rx * 0.5),
		Math.round(cy - ry * 0.45),
		Math.max(2, Math.round(rx * 0.4)),
		1,
		C.swampWaterLight
	);
	set(
		c,
		Math.round(cx + rx * 0.3),
		Math.round(cy - ry * 0.1),
		C.swampWaterLight
	);
}

/** A reed or cattail stalk. @param {Canvas} c @param {number} x @param {number} y @param {number} h @param {boolean} [head] */
function reed(c, x, y, h, head = false) {
	rect(c, x, y - h, 1, h, C.swampReed);
	set(c, x + 1, y - h + 1, C.swampMoss);
	set(c, x - 1, y - h + 2, C.swampMoss);
	if (head) {
		rect(c, x, y - h - 2, 1, 3, C.timber);
		set(c, x, y - h - 2, C.timberLight);
	}
}

/**
 * A buildable plot's mud, with a few quiet details.
 * @param {Canvas} c
 * @param {number} v
 * @param {() => number} r
 */
function openDetail(c, v, r) {
	if (v === 0) {
		for (let i = 0; i < 6; i++) {
			const x = int(r, 3, 27);
			const y = int(r, 3, 28);
			rect(c, x, y, 2, 1, C.swampMoss);
			set(c, x + 1, y - 1, C.swampMudLight);
		}
	} else if (v === 1) {
		pool(c, int(r, 11, 20), int(r, 12, 20), 5, 3);
	} else if (v === 2) {
		for (let i = 0; i < 3; i++) {
			const x = int(r, 4, 27);
			const y = int(r, 12, 28);
			reed(c, x - 2, y, 6);
			reed(c, x, y, 9);
			reed(c, x + 2, y, 5);
		}
	} else if (v === 3) {
		for (let i = 0; i < 4; i++) {
			const x = int(r, 3, 24);
			const y = int(r, 4, 26);
			rect(c, x, y, int(r, 4, 7), 2, C.swampMoss);
			rect(c, x + 1, y - 1, 3, 1, C.swampMoss);
			set(c, x + 1, y, C.grassLight);
		}
	} else if (v === 4) {
		for (let i = 0; i < 3; i++) {
			const x = int(r, 2, 18);
			const y = int(r, 5, 27);
			line(c, x, y, x + int(r, 6, 11), y + int(r, -3, 3), C.timberShade);
			line(c, x + 1, y - 1, x + 6, y - 2, C.timber);
		}
	} else if (v === 5) {
		for (let k = 0; k < 4; k++) {
			const y = 4 + k * 7 + int(r, -1, 1);
			const x = int(r, 1, 9);
			for (let j = 0; j < 14; j++) {
				if (j % 6 !== 5) {
					set(
						c,
						x + j,
						y + Math.round(1.2 * Math.sin(j * 0.5 + k)),
						k % 2 ? C.swampMudLight : C.swampMudShade
					);
				}
			}
		}
	} else if (v === 6) {
		pool(c, int(r, 6, 10), int(r, 8, 12), 3, 2);
		pool(c, int(r, 20, 25), int(r, 19, 24), 4, 2);
	} else {
		reed(c, int(r, 7, 12), 25, 12, true);
		reed(c, int(r, 14, 18), 27, 14, true);
		reed(c, int(r, 21, 26), 24, 10, true);
		for (let i = 0; i < 5; i++) {
			set(c, int(r, 2, 29), int(r, 2, 29), C.swampMoss);
		}
	}
}

/**
 * An impassable plot's bog, deadwood or reeds.
 * @param {Canvas} c
 * @param {number} v
 * @param {() => number} r
 */
function blockedDetail(c, v, r) {
	if (v === 0) {
		pool(c, 16, 16, 12, 9, true);
		ellipse(c, 16, 17, 7, 4, C.swampWaterDeep);
		rect(c, 9, 12, 5, 1, C.swampWaterLight);
		rect(c, 21, 18, 3, 1, C.swampWaterLight);
		rect(c, 12, 20, 8, 1, C.swampWater);
	} else if (v === 1) {
		// A dead stump with its roots in the mud
		ellipse(c, 17, 27, 10, 3, C.swampMudShade);
		for (const [x0, x1] of [
			[6, 12],
			[26, 20],
			[8, 14],
			[25, 19],
		]) {
			line(c, x0, 27, x1, 20, C.ink);
			line(c, x0, 26, x1, 19, C.timberShade);
		}
		rect(c, 10, 8, 14, 15, C.ink);
		rect(c, 11, 8, 12, 15, C.timberShade);
		rect(c, 11, 8, 4, 15, C.timber);
		rect(c, 21, 8, 2, 15, C.wood);
		ellipse(c, 17, 8, 7, 3, C.ink);
		ellipse(c, 17, 8, 6, 2.4, C.timberLight);
		ellipse(c, 17, 8, 3.5, 1.2, C.timber);
		rect(c, 12, 14, 1, 5, C.wood);
		set(c, 14, 12, C.swampMoss);
		set(c, 15, 13, C.swampMoss);
		rect(c, 10, 21, 4, 2, C.swampMoss);
	} else if (v === 2) {
		// Mangrove roots arching out of dark water
		ellipse(c, 16, 25, 14, 5, C.ink);
		ellipse(c, 16, 25, 13, 4, C.swampWaterDeep);
		rect(c, 6, 25, 5, 1, C.swampWaterLight);
		for (const x of [5, 12, 20, 27]) {
			for (const dx of [-1, 0, 1]) {
				line(
					c,
					16 + dx,
					6,
					x + dx,
					26,
					dx === 0 ? C.timberLight : C.ink
				);
			}
			line(c, 16, 7, x, 25, C.timber);
		}
		ellipse(c, 16, 7, 8, 4, C.ink);
		ellipse(c, 16, 7, 7, 3, C.pineShade);
		ellipse(c, 15, 6, 4, 2, C.pine);
		rect(c, 12, 5, 3, 1, C.pineLight);
	} else if (v === 3) {
		// A thick bed of tall reeds
		ellipse(c, 16, 26, 14, 4, C.swampMudShade);
		const heights = Array.from({ length: 20 }, () => int(r, 12, 21));
		heights.forEach((h, i) =>
			rect(c, Math.round(3 + i * 1.4) - 1, 27 - h, 3, h, C.ink)
		);
		heights.forEach((h, i) => {
			const x = Math.round(3 + i * 1.4);
			const top = 27 - h;
			rect(c, x, top, 1, h, i % 3 === 0 ? C.swampMoss : C.swampReed);
			if (i % 3 === 1) {
				rect(c, x, top - 2, 1, 3, C.timber);
			}
			set(c, x + 1, top + 4, C.swampMoss);
		});
	} else if (v === 4) {
		// A bog pond with mossy banks and bubbles
		ellipse(c, 16, 16, 14, 11, C.ink);
		ellipse(c, 16, 16, 13, 10, C.swampMoss);
		ellipse(c, 16, 16, 11, 8, C.swampWater);
		ellipse(c, 17, 17, 8, 5, C.swampWaterDeep);
		for (const [x, y] of [
			[10, 14],
			[20, 12],
			[23, 19],
			[14, 20],
		]) {
			ellipse(c, x, y, 2, 1.5, C.swampWaterLight);
			set(c, x, y, C.swampWater);
		}
		for (let i = 0; i < 6; i++) {
			set(c, int(r, 3, 28), int(r, 6, 26), C.grassLight);
		}
	} else {
		// A half-sunk log across black water
		ellipse(c, 16, 17, 14, 9, C.ink);
		ellipse(c, 16, 17, 13, 8, C.swampWater);
		ellipse(c, 17, 20, 9, 4, C.swampWaterDeep);
		for (let k = -3; k <= 3; k++) {
			line(
				c,
				3,
				22 + k,
				28,
				11 + k,
				Math.abs(k) === 3
					? C.ink
					: k < 0
						? C.timberLight
						: k > 1
							? C.wood
							: C.timber
			);
		}
		ellipse(c, 28, 11, 2, 3, C.timberLight);
		set(c, 28, 11, C.timber);
		rect(c, 11, 18, 5, 2, C.swampMoss);
		rect(c, 7, 24, 5, 1, C.swampWaterLight);
		rect(c, 20, 20, 4, 1, C.swampWaterLight);
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
	const r = seededRandom(0x5a3b000 + v * 6247 + (blocked ? 130363 : 0));
	const c = createCanvas(SIZE, SIZE);
	ground(c, r);
	if (blocked) {
		blockedDetail(c, v, r);
	} else {
		openDetail(c, v, r);
	}
	return c;
}

/**
 * One lily pad: a round leaf with a notch, and a flower on some.
 * @param {Canvas} c
 * @param {number} cx
 * @param {number} cy
 * @param {number} rx
 * @param {number} ry
 * @param {boolean} flower
 */
function lilyPad(c, cx, cy, rx, ry, flower) {
	ellipse(c, cx, cy + 1, rx + 1, ry + 1, C.swampWaterDeep);
	ellipse(c, cx, cy, rx, ry, C.lilyPadShade);
	ellipse(c, cx - 0.5, cy - 0.5, rx - 1, ry - 1, C.lilyPad);
	// The notch, cut from the middle to the rim
	line(c, cx, cy, cx + rx, cy - 1, C.swampWater);
	line(c, cx, cy, cx + rx, cy, C.swampWater);
	if (flower) {
		set(c, cx - 1, cy - 1, C.lilyFlower);
		set(c, cx, cy - 2, C.lilyFlower);
		set(c, cx + 1, cy - 1, C.lilyFlower);
		set(c, cx, cy - 1, C.creamLight);
	}
}

/**
 * Draws a pond with lily pads over a plot of the mat.
 * @param {Canvas} c
 * @param {number} ox - The plot's left edge
 * @param {number} oy - The plot's top edge
 */
function lilyPond(c, ox, oy) {
	const pond = createCanvas(SIZE, SIZE);
	ellipse(pond, 16, 16, 14, 11, C.swampMudShade);
	ellipse(pond, 16, 16, 13, 10, C.swampWater);
	ellipse(pond, 17, 18, 10, 6, C.swampWaterDeep);
	rect(pond, 6, 11, 4, 1, C.swampWaterLight);
	rect(pond, 22, 22, 4, 1, C.swampWaterLight);
	lilyPad(pond, 11, 15, 5, 4, false);
	lilyPad(pond, 21, 12, 4, 3, true);
	lilyPad(pond, 19, 21, 5, 3, false);
	for (let y = 0; y < SIZE; y++) {
		for (let x = 0; x < SIZE; x++) {
			set(c, ox + x, oy + y, pond.p[y * SIZE + x]);
		}
	}
}

/**
 * Which tile sits on each plot of the example mat, row by row. A lily pad plot is an open tile with a pond drawn over it.
 * @returns {{ blocked: boolean, variant: number, lily: boolean }[][]}
 */
export function placements() {
	return LAYOUT.map((row, r) =>
		[...row].map((ch, c) => {
			const blocked = ch === 'X';
			const hash =
				((r + 1) * 193 +
					(c + 1) * 389 +
					(r + 1) * (c + 3) * 71 +
					(r * r + c * c) * 43) >>>
				0;
			return {
				blocked,
				variant: hash % (blocked ? 6 : 8),
				lily: ch === 'L',
			};
		})
	);
}

/**
 * The example mat, composed from this biome's tiles on its printed layout, with the lily pads drawn over their plots.
 * @returns {Canvas}
 */
export function drawBiomeMat() {
	const mat = createCanvas(LAYOUT[0].length * SIZE, LAYOUT.length * SIZE);
	placements().forEach((row, r) =>
		row.forEach(({ blocked, variant, lily }, c) => {
			const tile = drawBiomeTile(blocked, variant);
			for (let y = 0; y < SIZE; y++) {
				for (let x = 0; x < SIZE; x++) {
					set(mat, c * SIZE + x, r * SIZE + y, tile.p[y * SIZE + x]);
				}
			}
			if (lily) {
				lilyPond(mat, c * SIZE, r * SIZE);
			}
		})
	);
	return mat;
}
