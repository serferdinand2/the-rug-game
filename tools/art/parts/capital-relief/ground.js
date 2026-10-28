// The natural ground of a buildable plot on the joined-terrain mats, ported from the approved #82 spike.
import { seededRandom } from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { PLOT } from '../../../../src/lib/art/relief.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */

/** A 4×4 ordered-dither table, row by row, centred on 0: from -0.5 to 0.4375. */
export const BAYER = Object.freeze(
	[0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(
		(v) => v / 16 - 0.5
	)
);

/**
 * Paints one pixel of the plot being drawn; off the plot it does nothing.
 * @typedef {(px: number, py: number, colour: string) => void} PlotPainter
 */

/**
 * Lays one small thing on the ground at (px, py).
 * @typedef {(put: PlotPainter, px: number, py: number, roll: number, rand: () => number) => void} Scatter
 */

/** Pebbles, moss and the odd flower on the alpine meadow. @type {Scatter} */
function scatterAlpine(put, px, py, roll, rand) {
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
}

/** Grass tufts and flowers on the forest's meadow. @type {Scatter} */
function scatterMeadow(put, px, py, roll, rand) {
	if (roll < 0.5) {
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

/** Puddles, sedge, flowers and mud on the wet meadow. @type {Scatter} */
function scatterMarsh(put, px, py, roll, rand) {
	if (roll < 0.1) {
		// A small puddle, kept whole inside the plot: dark under its far edge, a glint, a muddy lip.
		const w = 4 + Math.floor(rand() * 3);
		const x = Math.min(Math.max(px, 1), PLOT - 1 - w);
		const y = Math.min(Math.max(py, 1), PLOT - 4);
		for (let i = 1; i < w - 1; i++) {
			put(x + i, y, C.swampWaterDeep);
			put(x + i, y + 2, C.swampMudLight);
		}
		for (let i = 0; i < w; i++) {
			put(x + i, y + 1, i === 1 ? C.swampWaterLight : C.swampWater);
		}
	} else if (roll < 0.5) {
		// A sedge tuft.
		put(px, py, C.forestFloorShade);
		put(px - 1, py - 1, C.forestFloorLight);
		put(px + 1, py - 1, C.pineShade);
		put(px, py - 2, rand() < 0.3 ? C.swampReed : C.forestFloorLight);
	} else if (roll < 0.62) {
		put(px, py, rand() < 0.5 ? C.cream : C.lilyFlower);
		put(px, py + 1, C.forestFloorShade);
	} else if (roll < 0.75) {
		put(px, py, C.swampMudShade);
		put(px + 1, py, C.forestFloorShade);
	}
}

/** Ferns, broad leaves and the odd red flower on the jungle's lush green. @type {Scatter} */
function scatterJungle(put, px, py, roll, rand) {
	if (roll < 0.45) {
		// A fern: three arching fronds from a shaded heart, lit on the left.
		put(px, py, C.pineShade);
		put(px - 1, py - 1, C.grassLight);
		put(px - 2, py - 1, C.grass);
		put(px - 3, py, C.grass);
		put(px, py - 1, C.grass);
		put(px, py - 2, C.grassLight);
		put(px + 1, py - 1, C.grass);
		put(px + 2, py - 1, C.pine);
		put(px + 3, py, C.pine);
		put(px + 1, py, C.pineShade);
	} else if (roll < 0.6) {
		// A broad leaf lying flat.
		put(px, py, C.grassLight);
		put(px + 1, py, C.grass);
		put(px, py + 1, C.grass);
		put(px + 1, py + 1, C.pine);
	} else if (roll < 0.65) {
		put(px, py, rand() < 0.7 ? C.brickRedLight : C.gold);
		put(px + 1, py, C.brickRed);
		put(px, py + 1, C.pine);
	} else if (roll < 0.8) {
		put(px, py, C.pine);
		put(px + 1, py, C.pine);
	}
}

/** Ripples, pebbles and the odd dry tuft on the desert's sand. @type {Scatter} */
function scatterDesert(put, px, py, roll, rand) {
	if (roll < 0.6) {
		// A ripple: a shaded trough under a lit crest, gently waving.
		const long = 5 + Math.floor(rand() * 5);
		const phase = rand() * 6;
		for (let i = 0; i < long; i++) {
			const y = py + Math.round(Math.sin(i * 0.55 + phase) * 0.7);
			put(px + i, y, C.sandShade);
			if (i > 0 && i < long - 1) {
				put(px + i, y - 1, C.sandLight);
			}
		}
	} else if (roll < 0.78) {
		// A pebble, lit from the upper left.
		put(px, py, C.sandLight);
		put(px + 1, py, C.sandShade);
		put(px, py + 1, C.sandShade);
		put(px + 1, py + 1, C.timberLight);
	} else if (roll < 0.86) {
		// A dry tuft.
		put(px, py, C.savannaGoldShade);
		put(px - 1, py - 1, C.savannaGold);
		put(px + 1, py - 1, C.savannaGoldShade);
		put(px, py - 2, rand() < 0.5 ? C.savannaGoldLight : C.savannaGold);
	}
}

/** Golden grass, green tufts and the odd buttercup on the grassland's warm meadow. @type {Scatter} */
function scatterGrassland(put, px, py, roll, rand) {
	if (roll < 0.55) {
		// A golden tuft: blades fanning up from a shaded root, lit on the left.
		put(px, py, C.savannaGoldShade);
		put(px - 1, py - 1, C.savannaGoldLight);
		put(px, py - 1, C.savannaGold);
		put(px + 1, py - 1, C.savannaGoldShade);
		put(px - 1, py - 2, C.savannaDryBlade);
		put(px + 1, py - 2, C.savannaGold);
		if (rand() < 0.5) {
			put(px, py - 3, C.savannaGoldLight);
		}
	} else if (roll < 0.8) {
		// A green tuft.
		put(px, py, C.grassShade);
		put(px - 1, py - 1, C.grass);
		put(px + 1, py - 1, C.grassShade);
		put(px, py - 2, C.grass);
	} else if (roll < 0.88) {
		put(px, py, C.gold);
		put(px, py + 1, C.grass);
	}
}

/**
 * Each biome's natural ground: its seed, its three tones and the small things lying on it.
 * @type {Record<string, { seed: number, base: string, light: string, dark: string, scatter: Scatter }>}
 */
const GROUNDS = {
	mountain: {
		seed: 1301,
		base: C.alpineMeadow,
		light: C.alpineMeadowLight,
		dark: C.alpineMeadowShade,
		scatter: scatterAlpine,
	},
	forest: {
		seed: 2707,
		base: C.grass,
		light: C.grassLight,
		dark: C.grassShade,
		scatter: scatterMeadow,
	},
	// A wet meadow in dark greens, with a few small puddles.
	wetland: {
		seed: 3917,
		base: C.forestFloor,
		light: C.forestFloorLight,
		dark: C.forestFloorShade,
		scatter: scatterMarsh,
	},
	// Lush green between the Forest's light meadow and the Wetland's dark one, with ferns.
	tropical: {
		seed: 4523,
		base: C.pineLight,
		light: C.grass,
		dark: C.pine,
		scatter: scatterJungle,
	},
	// Pale sand with ripples: warm, not the Mesa's red soil.
	desert: {
		seed: 5309,
		base: C.sand,
		light: C.sandLight,
		dark: C.sandShade,
		scatter: scatterDesert,
	},
	// A warm, golden meadow: lighter and yellower than the Forest's, with golden grass and no white flowers.
	grassland: {
		seed: 6151,
		base: C.grassLight,
		light: C.savannaGoldLight,
		dark: C.grass,
		scatter: scatterGrassland,
	},
};

/**
 * Hashes small integers into one 32-bit number.
 * @param {...number} n
 * @returns {number}
 */
export function hash(...n) {
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
export function noise(seed, scale) {
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
 * @param {string} options.biome - A biome with a relief, such as 'mountain'
 * @param {number} options.variant - 0 to 7; each is a different plot
 * @param {number} [options.x] - The plot's left edge
 * @param {number} [options.y] - The plot's top edge
 * @throws {Error} When the biome has no natural ground.
 */
export function drawNaturalGround(canvas, { biome, variant, x = 0, y = 0 }) {
	if (!Object.hasOwn(GROUNDS, biome)) {
		throw new Error(`No natural ground for ${biome}`);
	}
	const g = GROUNDS[biome];
	const seed = hash(g.seed, variant);
	const broad = noise(seed + 7, 6);
	const fine = noise(seed + 8, 3);
	const rand = seededRandom(hash(seed, 41));
	/** @type {PlotPainter} */
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
		g.scatter(put, px, py, rand(), rand);
	}
}
