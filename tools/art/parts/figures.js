// Scene part: a small standing person, to give a scene its scale.
import { set } from '../painter.js';
import { PALETTE } from '../palette.js';

/** @typedef {import('../painter.js').Canvas} Canvas */
/** @typedef {import('../painter.js').Colour} Colour */
/** @typedef {import('../painter.js').Box} Box */

/**
 * Options for drawFigure.
 * @typedef {Object} FigureOptions
 * @property {number} x - The figure's leftmost column
 * @property {number} y - The figure's bottom row (its feet)
 * @property {'left' | 'right'} [facing='right'] - Which way the figure looks
 * @property {Colour} [clothes] - A palette colour for the tunic; brick red by default
 */

/** The figure facing right, top row first. H hair, S skin, s skin shade, C clothes, c belt, L legs. */
const SPRITE = [
	'.HHH.',
	'HHSSS',
	'.SSs.',
	'..s..',
	'.CCC.',
	'SCCCS',
	'.CCC.',
	'.ccc.',
	'.L.L.',
	'.L.L.',
];

/**
 * Draws a person standing on their bottom-left pixel.
 * @param {Canvas} canvas - The foreground, so the scene's outline pass outlines them
 * @param {FigureOptions} options
 * @returns {Box} The box that holds every pixel drawn.
 */
export function drawFigure(
	canvas,
	{ x, y, facing = 'right', clothes = PALETTE.brickRed }
) {
	/** @type {Record<string, Colour>} */
	const colours = {
		H: PALETTE.wood,
		S: PALETTE.skin,
		s: PALETTE.skinShade,
		C: clothes,
		c: PALETTE.wood,
		L: PALETTE.roofShade,
	};
	const w = SPRITE[0].length;
	const h = SPRITE.length;
	const top = y - h + 1;
	SPRITE.forEach((line, row) => {
		[...line].forEach((key, i) => {
			const col = facing === 'left' ? w - 1 - i : i;
			set(canvas, x + col, top + row, colours[key]);
		});
	});
	return { x, y: top, w, h };
}
