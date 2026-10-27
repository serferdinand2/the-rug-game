// Capital terrain for the Mesa advanced mat (#6): red desert soil, with banded rock on the impassable plots.
import { createCanvas, rect, set, line, seededRandom } from '../../painter.js';
import { PALETTE as C } from '../../palette.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/**
 * The mat's printed layout, one string per row, top first: '.' an open plot, 'X' an impassable one (22 of them).
 * Source: docs/research/03-expansions.md, Mesa (#11). The mat's rule that landmarks may not extend outside the city
 * area is text, so it isn't drawn.
 * @type {readonly string[]}
 */
export const LAYOUT = [
	'.XXXXXXXX',
	'.......XX',
	'........X',
	'.........',
	'.........',
	'.........',
	'.........',
	'XXX......',
	'XXXXXXXX.',
];

const SIZE = 32;

/** @param {number} min @param {number} max @param {() => number} r @returns {number} */
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
 * Dry red soil with soft patches and speckles.
 * @param {Canvas} c
 * @param {() => number} r
 */
function ground(c, r) {
	rect(c, 0, 0, SIZE, SIZE, C.mesaSoil);
	for (let i = 0; i < 11; i++) {
		rect(
			c,
			int(r, 1, 27),
			int(r, 1, 28),
			int(r, 3, 6),
			int(r, 1, 3),
			i % 3 === 0 ? C.mesaSoilShade : C.mesaSoilLight
		);
	}
	for (let i = 0; i < 40; i++) {
		set(
			c,
			int(r, 0, 31),
			int(r, 0, 31),
			i % 4 === 0
				? C.mesaSoilDark
				: i % 2
					? C.mesaSoilShade
					: C.mesaSoilLight
		);
	}
}

/**
 * A rounded block of banded rock seen from above and slightly in front: a lit top and strata down the face.
 * @param {Canvas} c
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 * @param {number} ry - Half the height of the top face
 * @param {() => number} r
 * @param {Colour} [flat] - Paints the whole shape in one colour (outline and shadow)
 */
function block(c, x, y, w, h, ry, r, flat) {
	const rx = w / 2;
	const cx = x + rx;
	const top = y + ry;
	const bottom = y + h - ry;
	for (let py = y; py < y + h; py++) {
		for (let px = x; px < x + w; px++) {
			const dx = (px + 0.5 - cx) / rx;
			const inTop = dx * dx + ((py + 0.5 - top) / ry) ** 2 <= 1;
			const inBottom =
				py + 0.5 >= bottom &&
				dx * dx + ((py + 0.5 - bottom) / ry) ** 2 <= 1;
			const inMiddle =
				py + 0.5 >= top && py + 0.5 <= bottom && Math.abs(dx) <= 1;
			if (!(inTop || inBottom || inMiddle)) {
				continue;
			}
			if (flat) {
				set(c, px, py, flat);
				continue;
			}
			if (inTop) {
				const rim = dx * dx + ((py + 0.5 - top) / ry) ** 2;
				set(c, px, py, rim > 0.62 ? C.mesaStrata : C.mesaRockLight);
				continue;
			}
			const band = Math.floor((py - top) / 3) % 4;
			let colour = [
				C.mesaRock,
				C.mesaRockShade,
				C.mesaRock,
				C.mesaRockLight,
			][band];
			if (dx > 0.55) {
				colour =
					colour === C.mesaRockShade
						? C.mesaRockDark
						: C.mesaRockShade;
			} else if (dx < -0.7) {
				colour =
					colour === C.mesaRockLight ? C.mesaStrata : C.mesaRockLight;
			}
			if (r() < 0.05) {
				colour = C.mesaRockDark;
			}
			set(c, px, py, colour);
		}
	}
}

/** A block with its ink outline and a cast shadow. @param {Canvas} c @param {number} x @param {number} y @param {number} w @param {number} h @param {number} ry @param {() => number} r */
function butte(c, x, y, w, h, ry, r) {
	block(c, x + 2, y + 2, w, h, ry, r, C.mesaSoilDark);
	block(c, x - 1, y - 1, w + 2, h + 2, ry + 1, r, C.ink);
	block(c, x, y, w, h, ry, r);
}

/** A small round rock. @param {Canvas} c @param {number} cx @param {number} cy @param {number} rx @param {number} ry */
function boulder(c, cx, cy, rx, ry) {
	ellipse(c, cx + 1, cy + 2, rx, ry, C.mesaSoilDark);
	ellipse(c, cx, cy, rx + 1, ry + 1, C.ink);
	ellipse(c, cx, cy, rx, ry, C.mesaRockShade);
	ellipse(c, cx - 1, cy - 1, rx - 1, ry - 1, C.mesaRock);
	ellipse(
		c,
		cx - 2,
		cy - 2,
		Math.max(1, rx / 2 - 1),
		Math.max(1, ry / 2 - 1),
		C.mesaRockLight
	);
}

/**
 * A buildable plot's soil, with a few quiet details.
 * @param {Canvas} c
 * @param {number} v
 * @param {() => number} r
 */
function openDetail(c, v, r) {
	if (v === 0) {
		for (let i = 0; i < 6; i++) {
			const x = int(r, 3, 27);
			const y = int(r, 3, 28);
			rect(c, x, y, 2, 1, C.mesaSoilDark);
			set(c, x, y - 1, C.mesaSoilLight);
		}
	} else if (v === 1) {
		for (let k = 0; k < 2; k++) {
			let x = int(r, 3, 12);
			let y = 6 + k * 14 + int(r, 0, 3);
			for (let i = 0; i < 18; i++) {
				set(c, x, y, C.mesaSoilDark);
				x++;
				y += int(r, -1, 1);
				if (i % 5 === 4) {
					set(c, x, y + 1, C.mesaSoilDark);
					set(c, x, y + 2, C.mesaSoilShade);
				}
			}
		}
	} else if (v === 2) {
		for (let i = 0; i < 3; i++) {
			const x = int(r, 5, 26);
			const y = int(r, 10, 28);
			for (let b = -2; b <= 2; b += 2) {
				set(c, x + b, y, C.mesaSage);
				set(c, x + b + Math.sign(b), y - 1, C.mesaSage);
				set(c, x + b + 2 * Math.sign(b), y - 2, C.mesaSoilLight);
			}
			set(c, x, y - 1, C.mesaSage);
			set(c, x, y - 2, C.mesaSage);
			set(c, x, y - 3, C.mesaSoilLight);
		}
	} else if (v === 3) {
		for (let k = 0; k < 4; k++) {
			const y = 4 + k * 7 + int(r, -1, 1);
			const x = int(r, 1, 9);
			for (let j = 0; j < 14; j++) {
				if (j % 6 !== 5) {
					set(
						c,
						x + j,
						y + Math.round(1.3 * Math.sin(j * 0.45 + k)),
						k % 2 ? C.mesaSoilLight : C.mesaSoilShade
					);
				}
			}
		}
	} else if (v === 4) {
		const x = int(r, 6, 14);
		const y = int(r, 8, 18);
		ellipse(c, x + 6, y + 3, 7, 3.5, C.mesaSoilDark);
		ellipse(c, x + 5, y + 2, 7, 3.5, C.mesaRockShade);
		ellipse(c, x + 5, y + 1, 6, 2.5, C.mesaRockLight);
		rect(c, x + 3, y + 1, 5, 1, C.mesaStrata);
	} else if (v === 5) {
		const y = int(r, 10, 18);
		rect(c, 0, y, 32, 1, C.mesaSoilShade);
		rect(c, 0, y + 1, 32, 2, C.mesaSoilDark);
		rect(c, 0, y + 3, 32, 1, C.mesaSoilShade);
		for (let i = 0; i < 10; i++) {
			set(c, int(r, 0, 31), y - 1, C.mesaSoilLight);
		}
	} else if (v === 6) {
		for (let i = 0; i < 5; i++) {
			const x = int(r, 3, 28);
			const y = int(r, 6, 28);
			set(c, x, y, C.mesaSage);
			set(c, x - 1, y - 1, C.mesaSoilLight);
			set(c, x + 1, y - 2, C.mesaSoilLight);
			set(c, x, y - 1, C.mesaSage);
			set(c, x, y - 3, C.mesaSoilShade);
		}
	} else {
		for (let i = 0; i < 26; i++) {
			const x = int(r, 1, 30);
			const y = int(r, 1, 30);
			set(c, x, y, C.mesaSoilDark);
			set(c, x + 1, y, i % 3 ? C.mesaSoilShade : C.mesaSoilLight);
		}
	}
}

/**
 * An impassable plot's rock.
 * @param {Canvas} c
 * @param {number} v
 * @param {() => number} r
 */
function blockedDetail(c, v, r) {
	if (v === 0) {
		butte(c, 4, 5, 23, 21, 6, r);
	} else if (v === 1) {
		boulder(c, 10, 21, 8, 6);
		boulder(c, 22, 14, 7, 6);
		boulder(c, 12, 9, 5, 4);
		boulder(c, 25, 25, 3, 2);
	} else if (v === 2) {
		butte(c, 3, 19, 11, 9, 3, r);
		butte(c, 13, 2, 10, 26, 4, r);
	} else if (v === 3) {
		butte(c, 2, 12, 14, 15, 4, r);
		butte(c, 17, 4, 12, 18, 4, r);
	} else if (v === 4) {
		// A fissure running corner to corner, with a rim of broken rock
		for (let k = -3; k <= 3; k++) {
			line(
				c,
				0,
				8 + k,
				31,
				26 + k,
				Math.abs(k) === 3
					? C.mesaRockShade
					: Math.abs(k) === 2
						? C.ink
						: C.mesaRockDark
			);
		}
		for (let k = -1; k <= 1; k++) {
			line(c, 0, 8 + k, 31, 26 + k, C.ink);
		}
		line(c, 2, 10, 29, 27, C.mesaRockDark);
		for (let i = 0; i < 9; i++) {
			const x = int(r, 1, 30);
			const y = Math.round(8 + (x * 18) / 31) + (r() < 0.5 ? -5 : 5);
			rect(c, x, y, 2, 2, C.mesaRock);
			set(c, x, y, C.mesaRockLight);
		}
	} else {
		butte(c, 2, 16, 28, 12, 4, r);
		butte(c, 6, 9, 20, 10, 3, r);
		butte(c, 10, 3, 12, 8, 3, r);
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
	const r = seededRandom(0x3e5a000 + v * 7919 + (blocked ? 104729 : 0));
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
 * Which tile sits on each plot of the example mat, row by row: `{ blocked, variant }`.
 * @returns {{ blocked: boolean, variant: number }[][]}
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
			return { blocked, variant: hash % (blocked ? 6 : 8) };
		})
	);
}

/**
 * The example mat, composed from this biome's tiles on its printed layout.
 * @returns {Canvas}
 */
export function drawBiomeMat() {
	const mat = createCanvas(LAYOUT[0].length * SIZE, LAYOUT.length * SIZE);
	placements().forEach((row, r) =>
		row.forEach(({ blocked, variant }, c) => {
			const tile = drawBiomeTile(blocked, variant);
			for (let y = 0; y < SIZE; y++) {
				for (let x = 0; x < SIZE; x++) {
					set(mat, c * SIZE + x, r * SIZE + y, tile.p[y * SIZE + x]);
				}
			}
		})
	);
	return mat;
}
