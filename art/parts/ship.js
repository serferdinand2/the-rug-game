// Scene part: a wooden sailing ship with square sails, for the harbours, voyages and pirates of the tapestry cards.
import { set } from '../painter.js';
import { PALETTE } from '../palette.js';

/** @typedef {import('../painter.js').Canvas} Canvas */
/** @typedef {import('../painter.js').Colour} Colour */
/** @typedef {import('../painter.js').Box} Box */

/**
 * Options for drawShip.
 * @typedef {Object} ShipOptions
 * @property {number} x - The ship's leftmost column (the stern, or the bowsprit's tip when facing left)
 * @property {number} y - The waterline: the hull's bottom row
 * @property {'left' | 'right'} [facing='right'] - Which way the bow points
 * @property {Colour} [sails] - A palette colour for the sails; cream by default
 * @property {Colour} [flag] - A palette colour for a pennant at the mainmast's top; none by default
 * @property {1 | 2 | 3} [masts=3] - How many masts
 * @property {boolean} [furled=false] - Sails rolled up under their yards, as in harbour; no jib
 */

/** The shade each sail colour takes on the side away from the light. Other colours stay flat. */
const SAIL_SHADES = new Map([
	[PALETTE.cream, PALETTE.creamShade],
	[PALETTE.creamLight, PALETTE.cream],
	[PALETTE.white, PALETTE.cream],
	[PALETTE.brickRed, PALETTE.brickRedShade],
	[PALETTE.brickRedLight, PALETTE.brickRed],
	[PALETTE.roof, PALETTE.roofShade],
	[PALETTE.roofLight, PALETTE.roof],
	[PALETTE.stone, PALETTE.stoneShade],
]);

/** Columns between masts, and how far the bowsprit reaches past the bow. */
const MAST_SPACING = 9;
const BOWSPRIT = 5;

/**
 * Draws a ship floating on its waterline.
 * @param {Canvas} canvas - The foreground, so the scene's outline pass outlines it
 * @param {ShipOptions} options
 * @returns {Box} The box that holds every pixel drawn.
 * @throws {Error} For an unknown facing, or a mast count other than 1, 2 or 3.
 */
export function drawShip(
	canvas,
	{
		x,
		y,
		facing = 'right',
		sails = PALETTE.cream,
		flag,
		masts = 3,
		furled = false,
	}
) {
	if (facing !== 'right' && facing !== 'left') {
		throw new Error(`drawShip: unknown facing "${facing}"`);
	}
	if (masts !== 1 && masts !== 2 && masts !== 3) {
		throw new Error(`drawShip: a ship has 1, 2 or 3 masts, not ${masts}`);
	}
	const length = 7 + masts * MAST_SPACING;
	const w = length + BOWSPRIT;
	const deck = y - 4;
	/**
	 * Paints one pixel, measured from the box's left edge as if the ship faced right.
	 * @param {number} dx
	 * @param {number} row
	 * @param {Colour} colour
	 */
	const put = (dx, row, colour) => {
		set(canvas, x + (facing === 'left' ? w - 1 - dx : dx), row, colour);
	};

	drawHull(put, length, y);
	const top = drawRig(put, { length, deck, sails, flag, masts, furled });
	return { x, y: top, w, h: y - top + 1 };
}

/**
 * The hull: a rail, a row of gunports, planking that narrows to the keel, a raised stern and bow, and the bowsprit.
 * @param {(dx: number, row: number, colour: Colour) => void} put
 * @param {number} length - The hull's length
 * @param {number} y - The waterline
 */
function drawHull(put, length, y) {
	const insets = [
		[0, 0],
		[0, 0],
		[1, 1],
		[2, 2],
		[3, 4],
	];
	insets.forEach(([stern, bow], r) => {
		const row = y - 4 + r;
		for (let dx = stern; dx <= length - 1 - bow; dx++) {
			let colour = PALETTE.timber;
			if (r === 0) {
				colour = PALETTE.timberLight;
			} else if (r === 4 || dx >= length - 2 - bow) {
				colour = PALETTE.timberShade;
			} else if (r === 1 && dx % 3 === 1 && dx > 2 && dx < length - 3) {
				colour = PALETTE.wood;
			}
			put(dx, row, colour);
		}
	});
	// The stern castle with its lantern, and the raised forecastle.
	for (let dx = 0; dx <= 6; dx++) {
		put(dx, y - 6, PALETTE.timberLight);
		put(dx, y - 5, dx === 6 ? PALETTE.timberShade : PALETTE.timber);
	}
	put(0, y - 7, PALETTE.gold);
	for (let dx = length - 6; dx < length; dx++) {
		put(dx, y - 5, dx >= length - 2 ? PALETTE.timberShade : PALETTE.timber);
	}
	// The bowsprit, rising forward of the bow.
	[
		[0, 6],
		[1, 6],
		[2, 7],
		[3, 7],
		[4, 8],
	].forEach(([dx, up]) => put(length + dx, y - up, PALETTE.timber));
}

/**
 * The masts, their yards and square sails, a jib, and the pennant.
 * @param {(dx: number, row: number, colour: Colour) => void} put
 * @param {{ length: number, deck: number, sails: Colour, flag?: Colour, masts: number, furled: boolean }} rig
 * @returns {number} The topmost row drawn.
 */
function drawRig(put, { length, deck, sails, flag, masts, furled }) {
	const shade = SAIL_SHADES.get(sails) ?? sails;
	const main = masts === 3 ? 1 : masts - 1;
	let top = deck;
	for (let i = 0; i < masts; i++) {
		const mx = 8 + i * MAST_SPACING;
		const height = i === main ? 24 : masts === 3 && i === 0 ? 18 : 20;
		const mastTop = deck - 1 - height;
		top = Math.min(top, mastTop);
		for (let row = mastTop; row < deck; row++) {
			put(mx, row, PALETTE.wood);
		}
		// Square sails stacked up the mast, each narrower than the one below, hung from a yard.
		let bottom = deck - 3;
		for (const [half, rows] of [
			[3, 6],
			[3, 5],
			[2, 4],
		]) {
			const yard = bottom - rows;
			if (yard <= mastTop + 1) {
				break;
			}
			for (let dx = -half; dx <= half; dx++) {
				put(mx + dx, yard, PALETTE.wood);
			}
			if (furled) {
				// The sail rolled tight along the underside of its yard.
				for (let dx = -half; dx <= half; dx++) {
					put(mx + dx, yard + 1, sails);
				}
				for (let dx = -half + 1; dx <= half - 1; dx++) {
					put(mx + dx, yard + 2, shade);
				}
				bottom = yard - 1;
				continue;
			}
			for (let row = yard + 1; row <= bottom; row++) {
				const inset = row === bottom ? 1 : 0;
				for (let dx = -half + inset; dx <= half - inset; dx++) {
					const shaded = dx >= half - 1 || row === bottom;
					put(mx + dx, row, shaded ? shade : sails);
				}
			}
			bottom = yard - 1;
		}
		if (i === main && flag) {
			for (let dx = 1; dx <= 4; dx++) {
				put(mx + dx, mastTop, flag);
			}
			put(mx + 1, mastTop + 1, flag);
			put(mx + 2, mastTop + 1, flag);
		}
	}
	if (furled) {
		return top;
	}
	// A jib from the foremast's head down to the bowsprit.
	const fore = 8 + (masts - 1) * MAST_SPACING;
	for (let k = 0; k < 7; k++) {
		const row = deck - 12 + k;
		for (let dx = fore + 6; dx <= fore + 6 + Math.floor(k * 0.6); dx++) {
			if (dx < length + 3) {
				put(dx, row, k === 6 ? shade : sails);
			}
		}
	}
	return top;
}
