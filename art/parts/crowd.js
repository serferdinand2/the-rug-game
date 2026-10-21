// Scene part: a crowd of people in two staggered rows, in varied clothes, built from the figure part.
import { PALETTE } from '../palette.js';
import { drawFigure } from './figures.js';

/** @typedef {import('../painter.js').Canvas} Canvas */
/** @typedef {import('../painter.js').Box} Box */

/**
 * Options for drawCrowd.
 * @typedef {Object} CrowdOptions
 * @property {number} x - The crowd's leftmost column
 * @property {number} y - The front row's feet
 * @property {number} count - How many people, at least 1
 * @property {() => number} random - The scene's seeded random stream, which picks clothes and facings
 * @property {'left' | 'right'} [facing] - Everyone faces this way; by default each person faces at random
 */

/** The clothes a crowd wears. */
const CLOTHES = [
	PALETTE.brickRed,
	PALETTE.roofLight,
	PALETTE.pine,
	PALETTE.timberLight,
	PALETTE.amber,
	PALETTE.daySea2,
	PALETTE.stone,
	PALETTE.cream,
];

/** Columns between neighbours, and how much higher the back row stands. */
const SPACING = 4;
const BACK_ROW = 2;

/**
 * Draws a crowd: every other person stands a little further back and higher, so the front row overlaps them.
 * @param {Canvas} canvas - The foreground, so the scene's outline pass outlines them
 * @param {CrowdOptions} options
 * @returns {Box} The box that holds every pixel drawn.
 * @throws {Error} For a count below 1.
 */
export function drawCrowd(canvas, { x, y, count, random, facing }) {
	if (!Number.isInteger(count) || count < 1) {
		throw new Error(
			`drawCrowd: a crowd needs at least 1 person, not ${count}`
		);
	}
	const people = Array.from({ length: count }, (_, i) => ({
		x: x + i * SPACING,
		y: i % 2 ? y - BACK_ROW : y,
		clothes: CLOTHES[Math.floor(random() * CLOTHES.length)],
		facing: facing ?? (random() > 0.5 ? 'right' : 'left'),
	}));
	// The back row first, so the front row stands in front of it.
	for (const person of [
		...people.filter((_, i) => i % 2),
		...people.filter((_, i) => i % 2 === 0),
	]) {
		drawFigure(canvas, person);
	}
	const back = count > 1 ? BACK_ROW : 0;
	return { x, y: y - 9 - back, w: (count - 1) * SPACING + 5, h: 10 + back };
}
