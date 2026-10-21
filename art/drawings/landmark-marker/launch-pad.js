// The Launch Pad's board piece: the pad seen from above, filling its 3×2 plots.
import { createCanvas, set, rect } from '../../painter.js';
import { PALETTE as C } from '../../palette.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */

/** The rocket's centre, seen from above. */
const RX = 31;
const RY = 15.5;

/**
 * Draws the Launch Pad from above: concrete slabs inside a hazard border, the gantry, the flame trench and the rocket.
 * @returns {Canvas} A 48×32 canvas (3×2 plots at 16 pixels each).
 */
export function draw() {
	const piece = createCanvas(48, 32);
	drawConcrete(piece);
	drawHazardBorder(piece);
	drawTrench(piece);
	drawGantry(piece);
	drawRocket(piece);
	return piece;
}

/**
 * Concrete slabs with dark joints.
 * @param {Canvas} piece
 */
function drawConcrete(piece) {
	for (let y = 0; y < 32; y++) {
		for (let x = 0; x < 48; x++) {
			set(
				piece,
				x,
				y,
				x % 8 === 0 || y % 8 === 0 ? C.stoneShade : C.stoneMid
			);
		}
	}
}

/**
 * Yellow and black hazard stripes around the edge, with a floodlight at each corner.
 * @param {Canvas} piece
 */
function drawHazardBorder(piece) {
	for (let y = 0; y < 32; y++) {
		for (let x = 0; x < 48; x++) {
			if (x < 2 || y < 2 || x > 45 || y > 29) {
				set(piece, x, y, (x + y) % 4 < 2 ? C.gold : C.night);
			}
		}
	}
	for (const [x, y] of [
		[3, 3],
		[43, 3],
		[3, 27],
		[43, 27],
	]) {
		rect(piece, x, y, 2, 2, C.lampGlow);
	}
}

/**
 * The flame trench under the rocket.
 * @param {Canvas} piece
 */
function drawTrench(piece) {
	rect(piece, 20, 12, 22, 8, C.ink);
	rect(piece, 21, 13, 20, 6, C.night);
}

/**
 * The gantry's square lattice tower and its arm reaching the rocket.
 * @param {Canvas} piece
 */
function drawGantry(piece) {
	rect(piece, 6, 8, 10, 16, C.ink);
	for (let y = 9; y <= 22; y++) {
		for (let x = 7; x <= 14; x++) {
			const brace = x - 7 === (y - 9) % 8 || 14 - x === (y - 9) % 8;
			set(piece, x, y, brace ? C.stoneShade : C.stone);
		}
	}
	rect(piece, 16, 15, 10, 2, C.stone);
	rect(piece, 16, 16, 10, 1, C.stoneShade);
}

/**
 * The rocket from above: a white hull lit from the left, a red nose and four red fins.
 * @param {Canvas} piece
 */
function drawRocket(piece) {
	for (let y = 8; y <= 23; y++) {
		for (let x = 23; x <= 39; x++) {
			const d = Math.hypot(x - RX, y - RY);
			if (d <= 5.6) {
				let colour =
					x - RX < -2
						? C.white
						: x - RX < 2
							? C.creamLight
							: C.creamShade;
				if (d > 4.8) {
					colour = C.ink;
				} else if (d <= 1.6) {
					colour = C.brickRed;
				}
				set(piece, x, y, colour);
			}
		}
	}
	for (const [x, y, w, h] of [
		[RX - 1, 8, 2, 2],
		[RX - 1, 22, 2, 2],
		[RX - 8, 15, 2, 2],
		[RX + 6, 15, 2, 2],
	]) {
		rect(piece, x, y, w, h, C.brickRed);
	}
}
