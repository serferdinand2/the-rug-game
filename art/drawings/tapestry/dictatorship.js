// Dictatorship: a giant stern statue with folded arms towering over a grey square hung with red banners, ranks of tiny people below.
import {
	createCanvas,
	set,
	rect,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { drawSky } from '../../parts/sky.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The statue's centre column, the horizon behind the square, and the square's first row. */
const CX = 32;
const HORIZON = 44;
const SQUARE = 52;

/** The statue's stone: lit by the low sun on its left, cold in shadow on its right. */
const LIT = mix(C.stoneLight, C.duskSky6, 0.35);
const MAIN = C.stone;
const MID = C.stoneMid;
const SHADE = C.stoneShade;
const DEEP = mix(C.stoneShade, C.roofShade, 0.5);

/**
 * Draws the Dictatorship scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(97);

	drawSky(layer, { time: 'dusk', horizon: HORIZON, random });
	drawFarWall(layer);
	drawSquare(layer);

	// The ministries flank the square behind the statue, so they get their own outline.
	const ministries = createCanvas(64, 64);
	drawMinistry(ministries, 0, 15);
	drawMinistry(ministries, 49, 15);
	outline(ministries, C.ink);

	drawPlinth(scene);
	drawStatue(scene);
	outline(scene, C.ink);
	underlay(scene, ministries);
	underlay(scene, layer);
	drawRanks(scene);
	return scene;
}

/**
 * A long, low colonnaded wall closing the far side of the square.
 * @param {Canvas} layer
 */
function drawFarWall(layer) {
	for (let y = 38; y < SQUARE; y++) {
		for (let x = 0; x < 64; x++) {
			let colour = y === 38 ? C.roofLight : C.roof;
			if (y > 40 && y < SQUARE - 2 && x % 4 === 1) {
				colour = C.roofShade;
			}
			set(layer, x, y, colour);
		}
	}
}

/**
 * The grey square: paving lines running towards the statue, cold and empty.
 * @param {Canvas} layer
 */
function drawSquare(layer) {
	for (let y = SQUARE; y < 64; y++) {
		const depth = y - SQUARE + 4;
		for (let x = 0; x < 64; x++) {
			const joint =
				Math.floor(((x - CX) * 3) / depth) !==
				Math.floor(((x + 1 - CX) * 3) / depth);
			let colour = y % 4 === 0 || joint ? C.stoneShade : C.stoneMid;
			if (y === SQUARE) {
				colour = C.stone;
			}
			set(layer, x, y, colour);
		}
	}
}

/**
 * A grey ministry block at the edge of the square, rows of windows, a long red banner down its face.
 * @param {Canvas} canvas
 * @param {number} x - Left column
 * @param {number} w - Width
 */
function drawMinistry(canvas, x, w) {
	const top = 6;
	for (let y = top; y < SQUARE + 1; y++) {
		for (let i = 0; i < w; i++) {
			let colour = MID;
			if (y <= top + 1) {
				colour = y === top ? C.stoneLight : C.stone;
			} else if (i === 0) {
				colour = C.stone;
			} else if (i >= w - 2) {
				colour = SHADE;
			}
			set(canvas, x + i, y, colour);
		}
	}
	// Narrow windows in strict rows, a few lit.
	for (let y = top + 4; y < SQUARE - 3; y += 5) {
		for (let i = 2; i < w - 2; i += 3) {
			const lit = (i * 7 + y) % 11 === 0;
			rect(canvas, x + i, y, 1, 3, lit ? C.amber : C.roofShade);
		}
	}
	// The banner: a gold rod, long red cloth hanging in folds, pointed at the foot with a gold tassel.
	const bx = x + Math.floor(w / 2) - 4;
	rect(canvas, bx - 1, top + 3, 10, 1, C.gold);
	for (let y = top + 4; y <= 44; y++) {
		for (let i = 0; i < 8; i++) {
			const point = y > 40 && Math.abs(i - 3.5) > 44 - y;
			if (point) {
				continue;
			}
			let colour = C.brickRed;
			if (i === 0) {
				colour = C.brickRedLight;
			} else if (i === 3 || i >= 6) {
				colour = C.brickRedShade;
			}
			set(canvas, bx + i, y, colour);
		}
	}
	rect(canvas, bx, top + 6, 8, 2, C.gold);
	rect(canvas, bx + 3, 45, 2, 2, C.gold);
}

/**
 * The plinth: a tall block of pale stone with a heavy cornice and a stepped base.
 * @param {Canvas} scene
 */
function drawPlinth(scene) {
	for (const [top, bottom, half] of [
		[46, 47, 13],
		[48, 54, 11],
		[55, 56, 14],
		[57, 57, 16],
	]) {
		for (let y = top; y <= bottom; y++) {
			for (let x = CX - half; x < CX + half; x++) {
				let colour = C.stone;
				if (y === top) {
					colour = C.stoneLight;
				} else if (x <= CX - half + 1) {
					colour = LIT;
				} else if (x >= CX + half - 3) {
					colour = SHADE;
				}
				set(scene, x, y, colour);
			}
		}
	}
}

/**
 * Paints one row of the statue between two columns, lit on the left and shaded on the right.
 * @param {Canvas} scene
 * @param {number} y
 * @param {number} left - The first column
 * @param {number} right - The last column
 */
function span(scene, y, left, right) {
	for (let x = left; x <= right; x++) {
		let colour = MAIN;
		if (x <= left + 1) {
			colour = LIT;
		} else if (x >= right - 1) {
			colour = DEEP;
		} else if (x >= right - 4) {
			colour = SHADE;
		}
		set(scene, x, y, colour);
	}
}

/**
 * The statue: a cropped head with a heavy brow, a high-collared greatcoat and arms folded across the chest.
 * @param {Canvas} scene
 */
function drawStatue(scene) {
	// The head.
	const head = [
		[4, 2],
		[5, 4],
		[6, 4],
		[7, 4],
		[8, 4],
		[9, 4],
		[10, 4],
		[11, 4],
		[12, 4],
		[13, 3],
	];
	for (const [y, half] of head) {
		span(scene, y, CX - half, CX + half - 1);
	}
	rect(scene, CX - 4, 5, 8, 1, MID);
	rect(scene, CX - 3, 4, 6, 1, MID);
	set(scene, CX - 5, 8, LIT);
	set(scene, CX - 5, 9, LIT);
	set(scene, CX + 4, 8, DEEP);
	set(scene, CX + 4, 9, DEEP);
	// The heavy brow, the narrowed eyes, the nose and the hard-set mouth.
	rect(scene, CX - 3, 7, 6, 1, SHADE);
	rect(scene, CX - 3, 8, 2, 1, C.ink);
	rect(scene, CX + 1, 8, 2, 1, C.ink);
	set(scene, CX, 9, C.stoneLight);
	set(scene, CX, 10, SHADE);
	rect(scene, CX - 2, 11, 4, 1, DEEP);
	// The neck and the high collar.
	span(scene, 14, CX - 2, CX + 1);
	span(scene, 15, CX - 5, CX + 4);
	span(scene, 16, CX - 9, CX + 8);
	// Broad shoulders, the coat's body and the upper arms hanging beside it.
	for (let y = 17; y <= 32; y++) {
		const half = y === 17 ? 11 : 12;
		if (y < 23) {
			span(scene, y, CX - half, CX + half - 1);
			set(scene, CX - 9, y, y > 18 ? SHADE : MAIN);
			set(scene, CX + 8, y, y > 18 ? DEEP : SHADE);
		} else {
			span(scene, y, CX - 9, CX + 8);
		}
	}
	// Lapels running down from the collar.
	for (let y = 17; y <= 21; y++) {
		set(scene, CX - 5 + (y - 17), y, SHADE);
		set(scene, CX + 4 - (y - 17), y, DEEP);
	}
	// The folded arms: one forearm laid over the other, elbows jutting past the body.
	for (let y = 23; y <= 28; y++) {
		for (let x = CX - 13; x <= CX + 12; x++) {
			const over = y <= 25;
			const end = over ? x >= CX + 9 : x <= CX - 10;
			let colour = over ? MAIN : SHADE;
			if (y === 23 || (y === 26 && !over)) {
				colour = over ? C.stoneLight : MID;
			}
			if (x <= CX - 12) {
				colour = LIT;
			} else if (x >= CX + 11) {
				colour = DEEP;
			}
			if (end) {
				colour = over ? MID : LIT;
			}
			if (y === 28) {
				colour = x >= CX + 6 ? DEEP : SHADE;
			}
			set(scene, x, y, colour);
		}
	}
	// The fists, tucked against the sleeves.
	rect(scene, CX + 7, 23, 2, 3, C.stoneLight);
	set(scene, CX + 8, 25, MAIN);
	rect(scene, CX - 9, 26, 2, 2, C.stoneLight);
	// The belt, then the coat's skirt falling to the boots, split at the front.
	rect(scene, CX - 9, 31, 18, 1, DEEP);
	for (let y = 33; y <= 44; y++) {
		const half = 9 + Math.floor((y - 33) / 4);
		span(scene, y, CX - half, CX + half - 1);
		set(scene, CX, y, DEEP);
		set(scene, CX - 6, y, y > 37 ? SHADE : MAIN);
		set(scene, CX + 5, y, y > 37 ? DEEP : SHADE);
	}
	rect(scene, CX - 6, 45, 5, 1, DEEP);
	rect(scene, CX + 1, 45, 5, 1, DEEP);
}

/**
 * Ranks of tiny, identical people standing to attention before the plinth. Drawn last, without an outline.
 * @param {Canvas} scene
 */
function drawRanks(scene) {
	for (const [feet, from] of [
		[59, 1],
		[63, 3],
	]) {
		for (let x = from; x < 62; x += 5) {
			set(scene, x + 1, feet - 5, C.skin);
			rect(scene, x, feet - 4, 3, 3, C.roofShade);
			set(scene, x + 1, feet - 4, C.roof);
			set(scene, x, feet - 1, C.wood);
			set(scene, x + 2, feet - 1, C.wood);
			set(scene, x, feet, C.wood);
			set(scene, x + 2, feet, C.wood);
		}
	}
}
