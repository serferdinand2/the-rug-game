// The floor under a relief's group: a soft tone of its ground, ragged at its edge so it fades into the plots around it (#132).
import { seededRandom } from '../../painter.js';
import { put } from '../../../../src/lib/art/paint/relief/canvas.js';
import { hash, noise } from '../../../../src/lib/art/paint/relief/ground.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */

/** The neighbours an edge pixel is counted from: four steps of one and four of two. */
const AROUND = [
	[1, 0],
	[-1, 0],
	[0, 1],
	[0, -1],
	[2, 0],
	[-2, 0],
	[0, 2],
	[0, -2],
];

/**
 * Paints a floor over an area, leaving out about half its edge pixels so it has no hard rim.
 * @param {Canvas} canvas
 * @param {Uint8Array} area - Where the floor lies, one byte per pixel
 * @param {number} seed
 * @param {(roll: number, x: number, y: number) => string} pick - A pixel's colour, from a random roll in [0, 1)
 */
export function drawFloor(canvas, area, seed, pick) {
	const { w, h } = canvas;
	const ragged = noise(seed + 3, 3);
	const rand = seededRandom(hash(seed, 77));
	for (let y = 1; y < h - 1; y++) {
		for (let x = 1; x < w - 1; x++) {
			const i = y * w + x;
			if (!area[i]) {
				continue;
			}
			let edge = 0;
			for (const [dx, dy] of AROUND) {
				if (!area[i + dy * w + dx]) {
					edge++;
				}
			}
			if (edge && ragged(x, y) < 0.5) {
				continue;
			}
			put(canvas, area, x, y, pick(rand(), x, y));
		}
	}
}
