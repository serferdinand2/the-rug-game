// The Forge's board piece: the smithy seen from above, filling its 2×2 plots.
import { createCanvas, set, rect } from '../../painter.js';
import { PALETTE as C } from '../../palette.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */

/**
 * Draws the Forge from above: a shingled roof with its chimney, and a yard with the anvil and the hearth's glow.
 * @returns {Canvas} A 32×32 canvas (2×2 plots at 16 pixels each).
 */
export function draw() {
	const piece = createCanvas(32, 32);
	drawYard(piece);
	drawRoof(piece);
	drawChimney(piece);
	drawAnvil(piece);
	return piece;
}

/**
 * Grass all round, with a packed-earth yard in front of the smithy.
 * @param {Canvas} piece
 */
function drawYard(piece) {
	for (let y = 0; y < 32; y++) {
		for (let x = 0; x < 32; x++) {
			set(
				piece,
				x,
				y,
				(x * 7 + y * 3) % 11 === 0 ? C.grassLight : C.grass
			);
		}
	}
	for (let y = 23; y < 31; y++) {
		for (let x = 4; x < 30; x++) {
			set(piece, x, y, (x + y) % 5 === 0 ? C.sandShade : C.sand);
		}
	}
}

/**
 * The shed roof from above: lit on the high side, shaded on the low side, with shingle courses.
 * @param {Canvas} piece
 */
function drawRoof(piece) {
	rect(piece, 2, 1, 28, 22, C.ink);
	for (let y = 2; y <= 21; y++) {
		for (let x = 3; x <= 28; x++) {
			let colour = y < 12 ? C.timberLight : C.timber;
			if (y % 3 === 0 || (x + (Math.floor(y / 3) % 2) * 2) % 4 === 0) {
				colour = y < 12 ? C.timber : C.timberShade;
			}
			set(piece, x, y, colour);
		}
	}
	// The forge's open mouth, glowing onto the yard.
	rect(piece, 10, 21, 7, 2, C.roofShade);
	rect(piece, 12, 22, 3, 1, C.amber);
	rect(piece, 11, 23, 5, 1, C.gold);
	rect(piece, 12, 24, 3, 1, C.amber);
}

/**
 * The square chimney stack with its sooty mouth.
 * @param {Canvas} piece
 */
function drawChimney(piece) {
	rect(piece, 5, 4, 7, 7, C.ink);
	rect(piece, 6, 5, 5, 5, C.stone);
	rect(piece, 6, 5, 5, 1, C.stoneLight);
	rect(piece, 6, 5, 1, 5, C.stoneLight);
	rect(piece, 7, 6, 3, 3, C.night);
}

/**
 * The anvil on its block, seen from above.
 * @param {Canvas} piece
 */
function drawAnvil(piece) {
	rect(piece, 19, 25, 8, 4, C.ink);
	rect(piece, 20, 26, 6, 2, C.stoneMid);
	rect(piece, 20, 26, 6, 1, C.stoneLight);
	rect(piece, 17, 26, 2, 2, C.stoneMid);
}
