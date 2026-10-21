// Scene part: an industrial brick factory hall with a sawtooth roof, lit windows and smokestacks.
import { set, rect } from '../painter.js';
import { PALETTE } from '../palette.js';

/** @typedef {import('../painter.js').Canvas} Canvas */
/** @typedef {import('../painter.js').Box} Box */

/**
 * Options for drawFactory.
 * @typedef {Object} FactoryOptions
 * @property {number} x - The hall's leftmost column
 * @property {number} y - The hall's bottom row
 * @property {number} width - Width of the hall
 * @property {number} [height=18] - Height of the brick walls
 * @property {number} [stacks=2] - How many smokestacks rise behind the roof, from the right
 * @property {boolean} [lit=true] - Whether the windows glow from the work inside
 */

/** Height of the smokestacks above the walls. */
const STACK = 18;

/**
 * Draws a factory hall standing on its bottom-left pixel. Smoke is drawn separately (drawSmoke)
 * from the stack tops, which are at the returned box's top row.
 * @param {Canvas} canvas - The foreground, so the scene's outline pass outlines it
 * @param {FactoryOptions} options
 * @returns {Box} The box that holds every pixel drawn.
 */
export function drawFactory(
	canvas,
	{ x, y, width, height = 18, stacks = 2, lit = true }
) {
	const wallTop = y - height + 1;
	// Smokestacks first, so the roof sits in front of their feet.
	for (let k = 0; k < stacks; k++) {
		const sx = x + width - 8 - k * 9;
		for (let row = wallTop - STACK; row < wallTop; row++) {
			for (let cx = sx; cx < sx + 4; cx++) {
				let colour = PALETTE.brickRed;
				if (cx === sx) {
					colour = PALETTE.brickRedLight;
				} else if (cx === sx + 3 || row % 3 === 0) {
					colour = PALETTE.brickRedShade;
				}
				set(canvas, cx, row, colour);
			}
		}
		rect(canvas, sx - 1, wallTop - STACK, 6, 2, PALETTE.stoneMid);
		set(canvas, sx - 1, wallTop - STACK, PALETTE.stoneLight);
	}
	// Brick walls, lit on the left.
	for (let row = wallTop; row <= y; row++) {
		for (let cx = x; cx < x + width; cx++) {
			let colour = PALETTE.brickRed;
			if (cx === x) {
				colour = PALETTE.brickRedLight;
			} else if (cx >= x + width - 2) {
				colour = PALETTE.brickRedShade;
			} else if (
				(row - wallTop) % 3 === 2 ||
				(cx + (Math.floor((row - wallTop) / 3) % 2) * 2) % 4 === 0
			) {
				colour = PALETTE.brickRedShade;
			}
			set(canvas, cx, row, colour);
		}
	}
	// A row of tall windows.
	for (let cx = x + 3; cx + 3 < x + width - 2; cx += 6) {
		rect(
			canvas,
			cx,
			wallTop + 4,
			3,
			6,
			lit ? PALETTE.gold : PALETTE.roofShade
		);
		rect(
			canvas,
			cx,
			wallTop + 4,
			3,
			1,
			lit ? PALETTE.lampGlow : PALETTE.roof
		);
		set(canvas, cx + 1, wallTop + 7, PALETTE.brickRedShade);
	}
	// Sawtooth roof: each tooth a glazed face on the left and a slope down to the right.
	for (let tx = x; tx < x + width; tx += 8) {
		for (let i = 0; i < 8 && tx + i < x + width; i++) {
			const rise = 5 - Math.floor((i * 5) / 8);
			for (let row = wallTop - rise; row < wallTop; row++) {
				let colour =
					row === wallTop - rise ? PALETTE.stone : PALETTE.stoneShade;
				if (i === 0) {
					colour = lit ? PALETTE.lampGlow : PALETTE.roofLight;
				}
				set(canvas, tx + i, row, colour);
			}
		}
	}
	const top = stacks > 0 ? wallTop - STACK : wallTop - 5;
	return { x, y: top, w: width, h: y - top + 1 };
}
