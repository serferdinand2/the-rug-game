// The Train Station's board piece: the glass train shed seen from above, filling its 3×3 plots.
import { createCanvas, set, rect } from '../../painter.js';
import { PALETTE as C } from '../../palette.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */

/**
 * Draws the Train Station from above: a long glass roof on iron ribs, with two tracks running out of it.
 * @returns {Canvas} A 48×48 canvas (3×3 plots at 16 pixels each).
 */
export function draw() {
	const piece = createCanvas(48, 48);
	drawGround(piece);
	drawShed(piece);
	drawTracks(piece);
	return piece;
}

/**
 * Gravel ballast over the whole site.
 * @param {Canvas} piece
 */
function drawGround(piece) {
	for (let y = 0; y < 48; y++) {
		for (let x = 0; x < 48; x++) {
			set(piece, x, y, (x + y) % 3 === 0 ? C.stoneMid : C.stoneShade);
		}
	}
}

/**
 * The shed roof: bays of lit glass between iron ribs, with a dark ridge down the middle.
 * @param {Canvas} piece
 */
function drawShed(piece) {
	rect(piece, 2, 2, 44, 34, C.ink);
	for (let y = 3; y <= 34; y++) {
		for (let x = 3; x <= 44; x++) {
			let colour;
			if (x === 23 || x === 24) {
				colour = x === 23 ? C.roofLight : C.roof;
			} else if (y % 4 === 3 || x === 3 || x === 44) {
				colour = C.roofShade;
			} else {
				colour =
					(Math.floor(y / 4) + (x < 23 ? 0 : 1)) % 2
						? C.gold
						: C.lampGlow;
			}
			set(piece, x, y, colour);
		}
	}
	// The platform ends where the trains leave the shed.
	rect(piece, 2, 36, 44, 2, C.stoneLight);
}

/**
 * Two tracks running from the shed to the edge of the plot.
 * @param {Canvas} piece
 */
function drawTracks(piece) {
	for (const left of [12, 29]) {
		for (let y = 38; y < 48; y += 2) {
			rect(piece, left, y, 7, 1, C.timberShade);
		}
		rect(piece, left + 1, 38, 1, 10, C.stoneLight);
		rect(piece, left + 5, 38, 1, 10, C.stoneLight);
	}
}
