// The map's desert (#134): rolling 2.5D dunes on the sand, lit on their windward slope and shaded on their slip face, and a few low rocks.
import { seededRandom } from './painter.js';
import { PALETTE as C } from './palette.js';
import { BAYER, hash } from './relief/ground.js';
import { insetMask } from './region.js';

/** @typedef {import('./painter.js').Canvas} Canvas */

/**
 * A dune standing on its base row.
 * @typedef {Object} Dune
 * @property {number} bx - The base's middle
 * @property {number} by - The base's row
 * @property {number} hw - The half-width at the base
 * @property {number} ph - The height
 * @property {number} crest - Where the crest stands between the middle and the right end, from 0 to 1
 */

/** The dunes' grid: one per step across and down at most, every other row shifted half a step. */
const STEP_X = 22;
const STEP_Y = 12;

/** One low rock per this many pixels of the region's picture. */
const ROCK_EVERY = 1400;

/**
 * Paints dunes and low rocks into a region whose sand is already laid. Each dune eases into the sand with no
 * outline at its foot; the slip face faces right, away from the light.
 * @param {Canvas} canvas
 * @param {Uint8Array} mask - The desert region, one byte per pixel
 * @param {number} seed
 */
export function paintDunes(canvas, mask, seed) {
	const { w, h } = canvas;
	const rand = seededRandom(hash(seed, 91));
	const ok = insetMask(w, h, mask, 1);
	/** @type {(x: number, y: number) => number} */
	const dither = (x, y) => BAYER[(y % 4) * 4 + (x % 4)];
	/** @type {(x: number, y: number, colour: string) => void} */
	const put = (x, y, colour) => {
		if (x >= 0 && y >= 0 && x < w && y < h && ok[y * w + x]) {
			canvas.p[y * w + x] = colour;
		}
	};
	/** @type {Dune[]} */
	const dunes = [];
	for (let gy = 4, row = 0; gy < h + 8; gy += STEP_Y, row++) {
		for (let gx = row % 2 ? STEP_X / 2 : 0; gx < w + 10; gx += STEP_X) {
			const hw = 9 + Math.floor(rand() * 6);
			dunes.push({
				bx: gx + Math.floor((rand() - 0.5) * 6),
				by: gy + Math.floor((rand() - 0.5) * 3),
				hw,
				ph: 4 + Math.floor(hw / 5),
				crest: 0.35 + rand() * 0.25,
			});
		}
	}
	dunes.sort((a, b) => a.by - b.by);
	for (const d of dunes) {
		if (
			d.bx < 0 ||
			d.by < 0 ||
			d.bx >= w ||
			d.by >= h ||
			!ok[d.by * w + d.bx]
		) {
			continue;
		}
		// A gentle windward slope up to the crest, then a steeper slip face down, both easing into the sand.
		const left = d.bx - d.hw;
		const right = d.bx + d.hw;
		const cx = left + Math.round(2 * d.hw * (0.55 + d.crest * 0.3));
		for (let x = left; x <= right; x++) {
			const rise =
				x <= cx
					? d.ph * ((x - left) / (cx - left)) ** 1.4
					: d.ph *
						Math.cos(((Math.PI / 2) * (x - cx)) / (right - cx));
			const top = d.by - Math.round(rise);
			for (let y = top; y <= d.by; y++) {
				const depth = (y - top + 1) / (d.by - top + 1);
				const fade = depth + dither(x, y) * 0.5;
				if (y === top) {
					put(x, y, C.sandLight);
				} else if (x <= cx) {
					if (fade < 0.8) {
						put(x, y, C.sandLight);
					}
				} else if (y - top === 1 && x - cx < 3) {
					put(x, y, C.mesaSoilShade);
				} else if (fade < 0.95) {
					put(x, y, C.sandShade);
				}
			}
		}
		// A soft shadow beyond the slip face.
		for (let x = cx + 1; x <= right + 2; x++) {
			if (dither(x, d.by + 1) < 0.1) {
				put(x, d.by + 1, C.sandShade);
			}
		}
	}
	// A few low rocks, lit from the upper left.
	for (let k = 0; k < (w * h) / ROCK_EVERY; k++) {
		const x = Math.floor(rand() * w);
		const y = Math.floor(rand() * h);
		if (!ok[y * w + x] || !ok[(y + 1) * w + x + 1]) {
			continue;
		}
		put(x, y, C.sandLight);
		put(x + 1, y, C.sandShade);
		put(x, y + 1, C.sandShade);
		put(x + 1, y + 1, C.mesaSoilShade);
	}
}
