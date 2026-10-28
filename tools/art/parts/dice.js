// Die bodies for the dice tray (#61): a d6 face as a bevelled rounded square, and a d12 seen face-on.
import { createCanvas, outline, set } from '../painter.js';
import { PALETTE } from '../palette.js';

/** @typedef {import('../painter.js').Canvas} Canvas */
/** @typedef {import('../palette.js').Colour} Colour */

/**
 * A die's three tones: the lit edge, the body and the shaded edge.
 * @typedef {Object} DieTones
 * @property {Colour} light
 * @property {Colour} body
 * @property {Colour} shade
 */

/** The canvas: 32×32, as the other small pieces. */
const SIZE = 32;

/**
 * A d6 face: a rounded square from 4 to 27 with its corners cut, lit along the top and left, shaded along the bottom
 * and right, and outlined in ink.
 * @param {DieTones} tones
 * @returns {Canvas}
 */
export function d6(tones) {
	const canvas = createCanvas(SIZE, SIZE);
	const lo = 4;
	const hi = 27;
	for (let y = lo; y <= hi; y++) {
		for (let x = lo; x <= hi; x++) {
			const left = x - lo;
			const top = y - lo;
			const right = hi - x;
			const bottom = hi - y;
			if (Math.min(left, right) + Math.min(top, bottom) < 3) {
				continue;
			}
			const colour =
				bottom < 3 || right < 3
					? tones.shade
					: top < 2 || left < 2
						? tones.light
						: tones.body;
			set(canvas, x, y, colour);
		}
	}
	outline(canvas, PALETTE.ink);
	return canvas;
}

/**
 * The corners of a regular polygon, the first pointing straight up.
 * @param {number} sides
 * @param {number} radius
 * @param {number} cx
 * @param {number} cy
 * @returns {[number, number][]}
 */
function polygon(sides, radius, cx, cy) {
	return Array.from({ length: sides }, (_, k) => {
		const angle = -Math.PI / 2 + (2 * Math.PI * k) / sides;
		return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
	});
}

/**
 * Whether a point lies inside a polygon (ray casting).
 * @param {number} x
 * @param {number} y
 * @param {[number, number][]} points
 * @returns {boolean}
 */
function within(x, y, points) {
	let hit = false;
	for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
		const [xi, yi] = points[i];
		const [xj, yj] = points[j];
		if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
			hit = !hit;
		}
	}
	return hit;
}

/**
 * A d12 seen face-on: a pentagon face, point up, ringed by its neighbouring faces, lit on the upper left and shaded
 * on the lower right, with the ridges from the face's corners drawn shaded, and outlined in ink.
 * @param {DieTones & { face: Colour }} tones
 * @returns {Canvas}
 */
export function d12(tones) {
	const canvas = createCanvas(SIZE, SIZE);
	const cx = 16;
	const cy = 16.5;
	const face = polygon(5, 8.5, cx, cy);
	const ring = polygon(10, 13.5, cx, cy);
	for (let y = 0; y < SIZE; y++) {
		for (let x = 0; x < SIZE; x++) {
			const px = x + 0.5;
			const py = y + 0.5;
			if (within(px, py, face)) {
				set(canvas, x, y, tones.face);
			} else if (within(px, py, ring)) {
				const lit = px - cx + (py - cy) < 0;
				set(canvas, x, y, lit ? tones.light : tones.body);
			}
		}
	}
	// The ridges: from each corner of the face out to the ring's matching corner.
	face.forEach(([fx, fy], k) => {
		const [rx, ry] = ring[k * 2];
		const steps = 8;
		for (let s = 1; s < steps; s++) {
			const x = Math.floor(fx + ((rx - fx) * s) / steps);
			const y = Math.floor(fy + ((ry - fy) * s) / steps);
			set(canvas, x, y, tones.shade);
		}
	});
	outline(canvas, PALETTE.ink);
	return canvas;
}
