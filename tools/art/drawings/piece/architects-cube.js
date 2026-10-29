// The Architects' cube (#82): a neutral stone block seen from the front and above, as the relief is, with a shadow on the ground.
import { createCanvas, set } from '../../painter.js';
import { PALETTE } from '../../palette.js';
import { shadow } from '../../../../src/lib/art/paint/relief/canvas.js';

const LEFT = 7;
const WIDTH = 18;
const HEIGHT = 10;

/** Returns the cube on a 32 px transparent canvas. @returns {import('../../painter.js').Canvas} */
export function draw() {
	const canvas = createCanvas(32, 32);
	/** @type {Map<string, string>} */
	const body = new Map();
	for (let c = 0; c < WIDTH; c++) {
		const m = Math.min(c, WIDTH - 1 - c);
		const top = 6 + ((8 - m) >> 1);
		const rim = 14 - ((8 - m) >> 1);
		const left = c < WIDTH / 2;
		for (let y = top; y <= rim + HEIGHT; y++) {
			let colour;
			if (y <= rim) {
				colour =
					y - top < 2 && c < 12
						? PALETTE.snowShade
						: PALETTE.stoneLight;
			} else if (left) {
				colour = y === rim + HEIGHT ? PALETTE.stoneMid : PALETTE.stone;
			} else {
				colour =
					y >= rim + HEIGHT - 1
						? PALETTE.roofShade
						: PALETTE.stoneShade;
			}
			body.set(`${c},${y}`, colour);
		}
	}
	for (const [key, colour] of body) {
		const [c, y] = key.split(',').map(Number);
		const edge =
			!body.has(`${c - 1},${y}`) ||
			!body.has(`${c + 1},${y}`) ||
			!body.has(`${c},${y - 1}`) ||
			!body.has(`${c},${y + 1}`);
		set(canvas, LEFT + c, y + 3, edge ? PALETTE.ink : colour);
	}
	// Shadow to the right of the block, on the ground
	for (const [key] of body) {
		const [c, y] = key.split(',').map(Number);
		if (y > 14 - ((8 - Math.min(c, WIDTH - 1 - c)) >> 1)) {
			for (let dx = 1; dx <= 3; dx++) {
				shadow(canvas, LEFT + c + dx, y + 3 + (dx > 1 ? 1 : 0), 0.3);
			}
		}
	}
	return canvas;
}
