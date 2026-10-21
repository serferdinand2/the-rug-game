// Scene part: a banner on a pole, either a flag flying in the wind or a long cloth hanging from a crossbar.
import { set } from '../painter.js';
import { PALETTE } from '../palette.js';

/** @typedef {import('../painter.js').Canvas} Canvas */
/** @typedef {import('../painter.js').Colour} Colour */
/** @typedef {import('../painter.js').Box} Box */

/**
 * Options for drawBanner.
 * @typedef {Object} BannerOptions
 * @property {'flag' | 'hanging'} kind - A flag flying from the pole's top, or a cloth hanging from a crossbar
 * @property {number} x - The box's leftmost column (the pole, when the banner flies right)
 * @property {number} y - The pole's foot
 * @property {Colour} cloth - A palette colour for the cloth
 * @property {Colour} [device] - A palette colour for a small diamond device on the cloth; plain by default
 * @property {'left' | 'right'} [facing='right'] - Which side of the pole the cloth flies or hangs
 * @property {number} [height=22] - The pole's height, finial included
 */

/** The shade each cloth colour takes in its folds. Other colours stay flat. */
const CLOTH_SHADES = new Map([
	[PALETTE.brickRed, PALETTE.brickRedShade],
	[PALETTE.brickRedLight, PALETTE.brickRed],
	[PALETTE.roof, PALETTE.roofShade],
	[PALETTE.roofLight, PALETTE.roof],
	[PALETTE.pine, PALETTE.pineShade],
	[PALETTE.pineLight, PALETTE.pine],
	[PALETTE.cream, PALETTE.creamShade],
	[PALETTE.white, PALETTE.cream],
	[PALETTE.gold, PALETTE.amber],
	[PALETTE.daySea1, PALETTE.daySea3],
	[PALETTE.nightSea1, PALETTE.nightSea3],
	[PALETTE.night, PALETTE.ink],
]);

/** Each kind's cloth size: how far it reaches from the pole, and how long it is. */
const KINDS = {
	flag: { reach: 12, length: 8 },
	hanging: { reach: 8, length: 15 },
};

/**
 * Draws a banner standing on its pole's foot.
 * @param {Canvas} canvas - The foreground, so the scene's outline pass outlines it
 * @param {BannerOptions} options
 * @returns {Box} The box that holds every pixel drawn.
 * @throws {Error} For an unknown kind or facing.
 */
export function drawBanner(
	canvas,
	{ kind, x, y, cloth, device, facing = 'right', height = 22 }
) {
	const size = KINDS[kind];
	if (!size) {
		throw new Error(`drawBanner: unknown kind "${kind}"`);
	}
	if (facing !== 'right' && facing !== 'left') {
		throw new Error(`drawBanner: unknown facing "${facing}"`);
	}
	const w = 1 + size.reach + (kind === 'hanging' ? 1 : 0);
	const top = y - height + 1;
	/**
	 * Paints one pixel, measured from the box's left edge as if the banner flew right.
	 * @param {number} dx
	 * @param {number} row
	 * @param {Colour} colour
	 */
	const put = (dx, row, colour) => {
		set(canvas, x + (facing === 'left' ? w - 1 - dx : dx), row, colour);
	};
	const shade = CLOTH_SHADES.get(cloth) ?? cloth;

	for (let row = top + 1; row <= y; row++) {
		put(0, row, PALETTE.timber);
	}
	put(0, top, PALETTE.gold);

	if (kind === 'flag') {
		// The cloth ripples: each column dips by its wave, and the folds facing away are shaded.
		for (let i = 1; i <= size.reach; i++) {
			const wave = Math.round(Math.sin(i * 0.7) * 0.9);
			for (let j = 0; j < size.length; j++) {
				const folded = Math.sin(i * 0.7) < -0.3;
				put(i, top + 1 + j + wave + 1, folded ? shade : cloth);
			}
		}
		if (device) {
			diamond(put, 6, top + 2 + size.length / 2, device);
		}
	} else {
		for (let i = 0; i <= size.reach + 1; i++) {
			put(i, top + 1, PALETTE.gold);
		}
		// The cloth hangs from the crossbar and ends in a swallowtail.
		for (let i = 2; i <= size.reach + 1; i++) {
			for (let j = 0; j < size.length; j++) {
				const middle = (size.reach + 3) / 2;
				const tail =
					j > size.length - 4 &&
					Math.abs(i - middle) < j - (size.length - 4);
				if (!tail) {
					put(i, top + 2 + j, i >= size.reach ? shade : cloth);
				}
			}
		}
		if (device) {
			diamond(put, Math.floor((size.reach + 3) / 2), top + 7, device);
		}
	}
	return { x, y: top, w, h: height };
}

/**
 * A small diamond device: a plus with a filled centre.
 * @param {(dx: number, row: number, colour: Colour) => void} put
 * @param {number} cx - The centre, from the box's left edge
 * @param {number} cy - The centre row
 * @param {Colour} colour
 */
function diamond(put, cx, cy, colour) {
	const row = Math.round(cy);
	for (const [dx, dy] of [
		[0, -2],
		[-1, -1],
		[0, -1],
		[1, -1],
		[-2, 0],
		[-1, 0],
		[0, 0],
		[1, 0],
		[2, 0],
		[-1, 1],
		[0, 1],
		[1, 1],
		[0, 2],
	]) {
		put(cx + dx, row + dy, colour);
	}
}
