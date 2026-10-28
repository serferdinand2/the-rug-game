// The natural ground of a buildable plot on the joined-terrain mats, ported from the approved #82 spike.
import { seededRandom } from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { PLOT } from '../../../../src/lib/art/relief.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(
	(v) => v / 16 - 0.5
);
const BIOME_SEEDS = { mountain: 1301, forest: 2707 };

const GROUNDS = {
	mountain: {
		base: C.alpineMeadow,
		light: C.alpineMeadowLight,
		dark: C.alpineMeadowShade,
	},
	forest: { base: C.grass, light: C.grassLight, dark: C.grassShade },
};

/**
 * Hashes small integers into one 32-bit number.
 * @param {...number} n
 * @returns {number}
 */
function hash(...n) {
	return n.reduce(
		(h, k) => Math.imul(h ^ (k + 0x9e37), 0x01000193) >>> 0,
		0x811c9dc5
	);
}

/**
 * Smooth value noise in [0, 1) with features about `scale` pixels wide.
 * @param {number} seed
 * @param {number} scale
 * @returns {(x: number, y: number) => number}
 */
function noise(seed, scale) {
	const cell = (/** @type {number} */ i, /** @type {number} */ j) =>
		(hash(i, j, seed) % 1000) / 1000;
	return (x, y) => {
		const fx = x / scale;
		const fy = y / scale;
		const i = Math.floor(fx);
		const j = Math.floor(fy);
		const tx = fx - i;
		const ty = fy - j;
		const sx = tx * tx * (3 - 2 * tx);
		const sy = ty * ty * (3 - 2 * ty);
		const a = cell(i, j) + (cell(i + 1, j) - cell(i, j)) * sx;
		const b = cell(i, j + 1) + (cell(i + 1, j + 1) - cell(i, j + 1)) * sx;
		return a + (b - a) * sy;
	};
}

/**
 * Draws the natural ground of one 32×32 buildable plot: mostly one tone, sparse dithered patches
 * of a lighter and a darker tone, and a few small things lying on it.
 * @param {Canvas} canvas
 * @param {Object} options
 * @param {'mountain' | 'forest'} options.biome
 * @param {number} options.variant - 0 to 7; each is a different plot
 * @param {number} [options.x] - The plot's left edge
 * @param {number} [options.y] - The plot's top edge
 */
export function drawNaturalGround(canvas, { biome, variant, x = 0, y = 0 }) {
	const g = GROUNDS[biome];
	const seed = hash(BIOME_SEEDS[biome], variant);
	const broad = noise(seed + 7, 6);
	const fine = noise(seed + 8, 3);
	const rand = seededRandom(hash(seed, 41));
	/** @type {(px: number, py: number, col: string) => void} */
	const put = (px, py, col) => {
		if (px >= 0 && py >= 0 && px < PLOT && py < PLOT) {
			canvas.p[(y + py) * canvas.w + x + px] = col;
		}
	};
	for (let py = 0; py < PLOT; py++) {
		for (let px = 0; px < PLOT; px++) {
			const n =
				broad(px, py) * 0.6 +
				fine(px, py) * 0.4 +
				BAYER[(py % 4) * 4 + (px % 4)] * 0.1;
			put(px, py, n > 0.74 ? g.light : n < 0.24 ? g.dark : g.base);
		}
	}
	for (let i = 0; i < 14; i++) {
		const px = Math.floor(rand() * PLOT);
		const py = Math.floor(rand() * PLOT);
		const roll = rand();
		if (biome === 'mountain') {
			if (roll < 0.55) {
				// A pebble, lit from the upper left.
				put(px, py, C.stoneLight);
				put(px + 1, py, C.stone);
				put(px, py + 1, C.stone);
				put(px + 1, py + 1, C.stoneShade);
				put(px + 2, py + 1, C.alpineMeadowShade);
			} else if (roll < 0.8) {
				put(px, py, C.alpineMeadowDeep);
				put(px + 1, py - 1, C.alpineMoss);
				put(px + 2, py, C.alpineMeadowDeep);
			} else {
				put(px, py, rand() < 0.5 ? C.cream : C.alpineMeadowDark);
			}
		} else if (roll < 0.5) {
			// A grass tuft.
			put(px, py, C.grassShade);
			put(px - 1, py - 1, C.grassShade);
			put(px + 1, py - 1, C.forestFloorLight);
			put(px, py - 2, C.grassLight);
		} else if (roll < 0.72) {
			put(px, py, rand() < 0.5 ? C.cream : C.gold);
			put(px, py + 1, C.grassShade);
		} else if (roll < 0.8) {
			put(px, py, C.forestFloor);
			put(px + 1, py, C.forestFloor);
		}
	}
}
