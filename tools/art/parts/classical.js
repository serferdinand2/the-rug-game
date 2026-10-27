// Scene part: a classical stone front — steps, a colonnade, an entablature and a pediment or flat cornice.
import { set, rect } from '../painter.js';
import { PALETTE } from '../palette.js';

/** @typedef {import('../painter.js').Canvas} Canvas */
/** @typedef {import('../painter.js').Box} Box */

/**
 * Options for drawClassical.
 * @typedef {Object} ClassicalOptions
 * @property {number} x - The front's leftmost column (the bottom step)
 * @property {number} y - The front's bottom row
 * @property {number} width - Width of the bottom step
 * @property {number} [columns=4] - How many columns stand across the front
 * @property {'pediment' | 'flat'} [roof='pediment'] - A triangular pediment or a flat cornice
 * @property {number} [height=14] - Height of the columns
 */

const ROOFS = ['pediment', 'flat'];

/**
 * Draws a classical front standing on its bottom-left pixel: three steps, columns lit on
 * their left against a shaded portico, an entablature, and a pediment or a flat cornice.
 * @param {Canvas} canvas - The foreground, so the scene's outline pass outlines it
 * @param {ClassicalOptions} options
 * @returns {Box} The box that holds every pixel drawn.
 * @throws {Error} For an unknown roof.
 */
export function drawClassical(
	canvas,
	{ x, y, width, columns = 4, roof = 'pediment', height = 14 }
) {
	if (!ROOFS.includes(roof)) {
		throw new Error(`drawClassical: unknown roof "${roof}"`);
	}
	const right = x + width - 1;
	// Steps.
	rect(canvas, x, y, width, 1, PALETTE.stoneShade);
	rect(canvas, x + 1, y - 1, width - 2, 1, PALETTE.stone);
	rect(canvas, x + 2, y - 2, width - 4, 1, PALETTE.stoneLight);
	// The shaded portico behind the columns.
	const bottom = y - 3;
	const top = bottom - height + 1;
	rect(canvas, x + 3, top, width - 6, height, PALETTE.roofShade);
	// Columns, evenly spaced and lit on the left.
	const inner = width - 6;
	const spacing = columns > 1 ? (inner - 3) / (columns - 1) : 0;
	for (let i = 0; i < columns; i++) {
		const cx =
			columns > 1
				? x + 3 + Math.round(i * spacing)
				: x + 3 + Math.floor((inner - 3) / 2);
		rect(canvas, cx, top, 1, height, PALETTE.creamLight);
		rect(canvas, cx + 1, top, 1, height, PALETTE.cream);
		rect(canvas, cx + 2, top, 1, height, PALETTE.creamShade);
	}
	// Capitals and the entablature.
	rect(canvas, x + 2, top - 1, width - 4, 1, PALETTE.creamLight);
	rect(canvas, x + 1, top - 2, width - 2, 1, PALETTE.creamShade);
	rect(canvas, x + 1, top - 3, width - 2, 1, PALETTE.cream);
	rect(canvas, x + 1, top - 4, width - 2, 1, PALETTE.creamLight);
	let highest = top - 4;
	if (roof === 'flat') {
		rect(canvas, x, top - 5, width, 1, PALETTE.creamLight);
		rect(canvas, x + 1, top - 6, width - 2, 1, PALETTE.cream);
		highest = top - 6;
	} else {
		for (let r = 0; ; r++) {
			const from = x + 1 + 2 * r;
			const to = right - 1 - 2 * r;
			if (to - from < 1) {
				break;
			}
			const row = top - 5 - r;
			for (let cx = from; cx <= to; cx++) {
				let colour = PALETTE.cream;
				if (cx <= from + 1) {
					colour = PALETTE.creamLight;
				} else if (cx >= to - 1 || r === 0) {
					colour = PALETTE.creamShade;
				}
				set(canvas, cx, row, colour);
			}
			highest = row;
		}
	}
	return { x, y: highest, w: width, h: y - highest + 1 };
}
