// Age of Wonders: a great pyramid with a gold capstone and a giant stone statue holding a staff, rising over the desert.
import {
	createCanvas,
	get,
	set,
	rect,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { drawSky } from '../../parts/sky.js';
import { drawTerrain } from '../../parts/terrain.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {[number, number]} Point */

/** The sky's last row, and the sand's first row. */
const HORIZON = 47;
const GROUND = 48;

/** The pyramid's apex, and its left, front and right base corners. */
const APEX = /** @type {Point} */ ([21, 7]);
const LEFT = /** @type {Point} */ ([-10, 51]);
const FRONT = /** @type {Point} */ ([25, 57]);
const RIGHT = /** @type {Point} */ ([52, 50]);

/** The statue's centre column. */
const SX = 51;

/**
 * Draws the Age of Wonders scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(1203);

	drawSky(layer, { time: 'day', horizon: HORIZON, random });
	drawHaze(layer);
	drawSun(layer);
	drawTerrain(layer, { kind: 'desert', top: GROUND, random });

	// The pyramid stands behind the statue, so each gets its own outline.
	const pyramid = createCanvas(64, 64);
	drawPyramid(pyramid, random);
	outline(pyramid, C.ink);

	drawStatue(scene);
	outline(scene, C.ink);
	underlay(scene, pyramid);
	underlay(scene, layer);
	drawCapstoneGlint(scene);
	drawCaravan(scene);
	return scene;
}

/**
 * A hot, pale haze over the horizon, blending the lowest sky into the colour of sand.
 * @param {Canvas} layer
 */
function drawHaze(layer) {
	for (let y = HORIZON - 14; y <= HORIZON; y++) {
		const t = (y - (HORIZON - 14)) / 14;
		for (let x = 0; x < 64; x++) {
			const behind = get(layer, x, y);
			if (behind) {
				set(layer, x, y, mix(behind, C.sandLight, t * 0.55));
			}
		}
	}
}

/**
 * A white-hot sun high in the right of the sky, with a pale ring around it.
 * @param {Canvas} layer
 */
function drawSun(layer) {
	const [cx, cy] = [40, 8];
	for (let y = cy - 6; y <= cy + 6; y++) {
		for (let x = cx - 6; x <= cx + 6; x++) {
			const d = (x - cx) ** 2 + (y - cy) ** 2;
			const behind = get(layer, x, y);
			if (d <= 8) {
				set(layer, x, y, C.white);
			} else if (d <= 13) {
				set(layer, x, y, C.lampGlow);
			} else if (d <= 30 && behind) {
				set(layer, x, y, mix(behind, C.lampGlow, 0.35));
			}
		}
	}
}

/**
 * Tells on which side of the line from a to b a point lies.
 * @param {Point} a
 * @param {Point} b
 * @param {number} x
 * @param {number} y
 * @returns {number} Positive on one side, negative on the other.
 */
function side(a, b, x, y) {
	return (b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0]);
}

/**
 * Tells whether a point lies inside a triangle.
 * @param {Point} a
 * @param {Point} b
 * @param {Point} c
 * @param {number} x
 * @param {number} y
 * @returns {boolean}
 */
function inTriangle(a, b, c, x, y) {
	const s1 = side(a, b, x, y);
	const s2 = side(b, c, x, y);
	const s3 = side(c, a, x, y);
	return (s1 >= 0 && s2 >= 0 && s3 >= 0) || (s1 <= 0 && s2 <= 0 && s3 <= 0);
}

/**
 * The great pyramid seen corner-on: a sunlit left face and a shaded right face of
 * stepped stone courses, a weathered ridge and a gold capstone.
 * @param {Canvas} canvas
 * @param {() => number} random
 */
function drawPyramid(canvas, random) {
	const shade = mix(C.sandShade, C.timber, 0.45);
	const shadeLine = mix(C.timber, C.sandShade, 0.15);
	for (let y = APEX[1]; y <= FRONT[1]; y++) {
		const course = (y - APEX[1]) % 3 === 2;
		const block = Math.floor((y - APEX[1]) / 3);
		for (let x = 0; x < 64; x++) {
			const lit = inTriangle(APEX, LEFT, FRONT, x, y);
			const dark = inTriangle(APEX, FRONT, RIGHT, x, y);
			if (!lit && !dark) {
				continue;
			}
			const cap = y < APEX[1] + 6;
			let colour;
			if (cap) {
				colour = lit
					? x < APEX[0] - 1
						? C.lampGlow
						: C.gold
					: C.amber;
			} else if (lit) {
				const joint = (x + block * 3) % 6 === 0;
				colour = course ? C.sandShade : joint ? C.sand : C.sandLight;
				if (!course && (x + block * 3) % 6 > 3) {
					colour = C.sand;
				}
			} else {
				const joint = (x + block * 2) % 5 === 0;
				colour = course || joint ? shadeLine : shade;
			}
			set(canvas, x, y, colour);
		}
	}
	// Weathered blocks: a few dark gaps on the faces.
	for (let i = 0; i < 26; i++) {
		const x = Math.floor(random() * 52);
		const y = APEX[1] + 8 + Math.floor(random() * 40);
		const behind = get(canvas, x, y);
		if (behind === C.sandLight || behind === C.sand) {
			set(canvas, x, y, C.sandShade);
		} else if (behind === shade) {
			set(canvas, x, y, shadeLine);
		}
	}
}

/**
 * Paints a small sprite from a key of colours; dots are left alone.
 * @param {Canvas} canvas
 * @param {number} x - Left column
 * @param {number} y - Top row
 * @param {string[]} rows
 * @param {Record<string, string>} colours
 */
function sprite(canvas, x, y, rows, colours) {
	rows.forEach((line, j) => {
		[...line].forEach((key, i) => {
			if (colours[key]) {
				set(canvas, x + i, y + j, colours[key]);
			}
		});
	});
}

/**
 * Paints one stone pixel of the statue, lit on the left and shaded on the right of its span.
 * @param {Canvas} canvas
 * @param {number} x
 * @param {number} y
 * @param {number} left - The span's first column
 * @param {number} right - The span's last column
 */
function stone(canvas, x, y, left, right) {
	const colour =
		x === left ? C.stoneLight : x >= right - 1 ? C.stoneShade : C.stone;
	set(canvas, x, y, colour);
}

/**
 * The colossus: a bearded stone giant in a gold crown, one hand on a staff topped
 * with a gold sun disc, standing on a high plinth.
 * @param {Canvas} canvas
 */
function drawStatue(canvas) {
	// The plinth.
	for (let y = 48; y <= 58; y++) {
		const wide = y < 50 ? 10 : 9;
		for (let x = SX - wide; x <= SX + wide; x++) {
			let colour = C.stone;
			if (y === 48) {
				colour = C.stoneLight;
			} else if (y === 49 || x >= SX + wide - 1) {
				colour = C.stoneShade;
			} else if (x === SX - wide) {
				colour = C.stoneLight;
			}
			set(canvas, x, y, colour);
		}
	}
	// A recessed panel in the plinth's face.
	for (let y = 52; y <= 56; y++) {
		for (let x = SX - 6; x <= SX + 5; x++) {
			const colour =
				y === 52 || x === SX - 6
					? C.stoneShade
					: y === 56 || x === SX + 5
						? C.stoneLight
						: C.stoneMid;
			set(canvas, x, y, colour);
		}
	}
	// The robe, widening to the hem, with folds and a gold belt.
	for (let y = 21; y <= 46; y++) {
		const half = 5 + Math.floor((y - 21) / 7);
		for (let x = SX - half; x <= SX + half; x++) {
			stone(canvas, x, y, SX - half, SX + half);
		}
		if (y > 33) {
			for (const fold of [SX - 2, SX + 1, SX + 3]) {
				set(canvas, fold, y, C.stoneMid);
			}
		}
	}
	rect(canvas, SX - 5, 31, 11, 2, C.gold);
	rect(canvas, SX + 4, 31, 2, 2, C.amber);
	// Feet on the base slab.
	rect(canvas, SX - 9, 47, 19, 1, C.stoneMid);
	// Shoulders and a gold collar.
	for (let y = 18; y <= 21; y++) {
		const half = y === 18 ? 6 : 8;
		for (let x = SX - half; x <= SX + half; x++) {
			stone(canvas, x, y, SX - half, SX + half);
		}
	}
	rect(canvas, SX - 3, 18, 7, 2, C.gold);
	rect(canvas, SX - 2, 20, 5, 1, C.gold);
	rect(canvas, SX + 2, 18, 2, 2, C.amber);
	// The left arm hangs at the side, with a gold bracelet.
	for (let y = 22; y <= 35; y++) {
		stone(canvas, SX - 8, y, SX - 8, SX - 6);
		stone(canvas, SX - 7, y, SX - 8, SX - 6);
	}
	rect(canvas, SX - 8, 31, 2, 1, C.gold);
	// The right arm bends to grip the staff.
	for (let y = 22; y <= 27; y++) {
		stone(canvas, SX + 7, y, SX + 7, SX + 8);
		stone(canvas, SX + 8, y, SX + 7, SX + 8);
	}
	// The staff rises above the head, crowned with a gold sun disc.
	rect(canvas, SX + 10, 4, 1, 44, C.timber);
	rect(canvas, SX + 8, 26, 4, 3, C.stone);
	rect(canvas, SX + 8, 26, 4, 1, C.stoneLight);
	rect(canvas, SX + 11, 27, 1, 2, C.stoneShade);
	for (let y = -3; y <= 3; y++) {
		for (let x = -3; x <= 3; x++) {
			const d = x * x + y * y;
			if (d <= 10) {
				set(
					canvas,
					SX + 10 + x,
					4 + y,
					d <= 2 ? C.lampGlow : x > 0 && y > 0 ? C.amber : C.gold
				);
			}
		}
	}
	// The neck, the head and a long, braided beard.
	rect(canvas, SX - 1, 16, 3, 2, C.stoneMid);
	for (let y = 9; y <= 15; y++) {
		for (let x = SX - 3; x <= SX + 3; x++) {
			stone(canvas, x, y, SX - 3, SX + 3);
		}
	}
	rect(canvas, SX - 2, 10, 2, 1, C.stoneMid);
	rect(canvas, SX + 1, 10, 2, 1, C.stoneMid);
	set(canvas, SX - 1, 11, C.ink);
	set(canvas, SX + 1, 11, C.ink);
	set(canvas, SX, 12, C.stoneShade);
	for (let y = 14; y <= 20; y++) {
		const half = y < 18 ? 2 : y < 20 ? 1 : 0;
		for (let x = SX - half; x <= SX + half; x++) {
			set(canvas, x, y, (x - SX) % 2 ? C.stoneShade : C.stoneMid);
		}
	}
	rect(canvas, SX - 1, 13, 3, 1, C.stoneShade);
	// The crown: a gold band with three points.
	rect(canvas, SX - 3, 8, 7, 2, C.gold);
	rect(canvas, SX + 2, 8, 2, 2, C.amber);
	for (const x of [SX - 3, SX, SX + 3]) {
		set(canvas, x, 7, C.gold);
		set(canvas, x, 6, C.gold);
	}
}

/**
 * A white glint on the capstone's tip, drawn over the outline.
 * @param {Canvas} canvas
 */
function drawCapstoneGlint(canvas) {
	set(canvas, APEX[0], APEX[1] - 1, C.white);
	set(canvas, APEX[0], APEX[1] - 2, C.lampGlow);
	set(canvas, APEX[0] - 1, APEX[1], C.white);
	set(canvas, APEX[0] - 2, APEX[1] + 1, C.lampGlow);
}

/**
 * A tiny caravan crossing the sand at the pyramid's foot, to show its size.
 * @param {Canvas} canvas
 */
function drawCaravan(canvas) {
	const camel = [
		'.kk......',
		'kkk..kk..',
		'..k.kkkk.',
		'..kkkkkkk',
		'...kkkkk.',
		'...k.k.k.',
		'...k.k.k.',
	];
	const person = ['.k.', 'kkk', 'kkk', '.k.', 'k.k'];
	sprite(canvas, 2, 55, camel, { k: C.wood });
	sprite(canvas, 12, 57, person, { k: C.wood });
	sprite(canvas, 16, 55, camel, { k: C.wood });
}
