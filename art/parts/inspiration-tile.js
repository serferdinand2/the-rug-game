// The Arts & Architecture inspiration tiles: the shared strip of six framed spaces each tile's six innovations are drawn on.
import { createCanvas, get, mix, rect, set, underlay } from '../painter.js';
import { PALETTE as C } from '../palette.js';

/** @typedef {import('../painter.js').Canvas} Canvas */
/** @typedef {import('../painter.js').Colour} Colour */

/** Each space is 32×32 pixels, the size of an income building, which sits on it. */
export const SPACE = 32;

/** A tile repeats its income-mat row's six spaces, left to right. */
export const SPACES = 6;

/** The spaces the tile improves, numbered from 1 (research 03 §2, inspiration tiles). */
export const IMPROVED = Object.freeze([2, 4, 6]);

/** The drawable inside of a space, within its 1-pixel frame. */
export const INSIDE = SPACE - 2;

/** The arts track's violet ground, top row to bottom: deep on the plain spaces, lit on the improved ones. */
export const GROUND = Object.freeze({
	plain: Object.freeze([
		mix(C.arcaneShade, C.night, 0.25),
		mix(C.arcaneShade, C.night, 0.32),
		mix(C.arcaneShade, C.night, 0.39),
		mix(C.arcaneShade, C.night, 0.46),
	]),
	improved: Object.freeze([
		mix(C.arcaneShade, C.arcane, 0.45),
		mix(C.arcaneShade, C.arcane, 0.3),
		mix(C.arcaneShade, C.arcane, 0.15),
		C.arcaneShade,
	]),
});

/** The frame round each space: ink on the plain spaces, gold on the improved ones. */
export const FRAME = Object.freeze({ plain: C.ink, improved: C.gold });

/** The sparkle in an improved space's top right corner: its centre inside the space, and its arms. */
const SPARKLE = { x: INSIDE - 3, y: 2 };
const SPARKLE_ARMS = [
	[0, -1],
	[0, 1],
	[-1, 0],
	[1, 0],
];

/**
 * Paints the ground of one space, in bands from top to bottom.
 * @param {boolean} improved
 * @returns {Canvas} An INSIDE×INSIDE canvas.
 */
function ground(improved) {
	const bands = improved ? GROUND.improved : GROUND.plain;
	const canvas = createCanvas(INSIDE, INSIDE);
	const band = INSIDE / bands.length;
	for (let y = 0; y < INSIDE; y++) {
		rect(canvas, 0, y, INSIDE, 1, bands[Math.floor(y / band)]);
	}
	return canvas;
}

/**
 * Draws a whole inspiration tile: six framed spaces of the arts track's violet, each with its innovation on it.
 * Each drawer gets an empty INSIDE×INSIDE canvas, paints its innovation as one big subject, outlines it with
 * `outline(canvas, C.ink)` and adds any glow after that, leaving the ground empty. The ground, the frames
 * and the improved spaces' sparkles are painted here, so the four tiles match. On an improved space, keep
 * the top right 6×6 corner clear: the sparkle goes there.
 * @param {readonly ((canvas: Canvas) => void)[]} drawers - One per space, space 1 first
 * @returns {Canvas} A (SPACE × SPACES)×SPACE canvas, every pixel painted.
 * @throws {Error} When there aren't exactly six drawers.
 */
export function drawInspirationTile(drawers) {
	if (drawers.length !== SPACES) {
		throw new Error(
			`an inspiration tile has ${SPACES} spaces, not ${drawers.length}`
		);
	}
	const tile = createCanvas(SPACE * SPACES, SPACE);
	drawers.forEach((draw, index) => {
		const improved = IMPROVED.includes(index + 1);
		const left = index * SPACE;
		const inside = createCanvas(INSIDE, INSIDE);
		draw(inside);
		underlay(inside, ground(improved));
		for (let y = 0; y < INSIDE; y++) {
			for (let x = 0; x < INSIDE; x++) {
				set(tile, left + 1 + x, 1 + y, get(inside, x, y));
			}
		}
		const frame = improved ? FRAME.improved : FRAME.plain;
		rect(tile, left, 0, SPACE, 1, frame);
		rect(tile, left, SPACE - 1, SPACE, 1, frame);
		rect(tile, left, 0, 1, SPACE, frame);
		rect(tile, left + SPACE - 1, 0, 1, SPACE, frame);
		if (improved) {
			const x = left + 1 + SPARKLE.x;
			const y = 1 + SPARKLE.y;
			set(tile, x, y, C.lampGlow);
			for (const [dx, dy] of SPARKLE_ARMS) {
				set(tile, x + dx, y + dy, C.gold);
			}
		}
	});
	return tile;
}
