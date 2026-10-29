// The base capital mats' terrain: each biome's 32px buildable plots; layouts from research/01-base-core-rules.md §6.2.
// The impassable plots have no tiles of their own: each mat's relief draws them (#82, tools/art/parts/capital-relief/).
import { createCanvas } from '../painter.js';
import { CAPITAL_MATS } from '../../../src/lib/engine/data/capitals.js';
import { drawNaturalGround } from '../../../src/lib/art/paint/relief/ground.js';
/** @typedef {'mountain' | 'wetland' | 'tropical' | 'desert' | 'grassland' | 'forest'} Biome */
/** @typedef {import('../painter.js').Canvas} Canvas */

export const PLOT_SIZE = 32;
export const OPEN_VARIANTS = 8;

/** @type {Readonly<Record<Biome, readonly string[]>>} */
// Canonical base-mat masks, read from the engine: rows top-to-bottom, 1 = impassable, 0 = buildable.
export const CAPITAL_GRIDS =
	/** @type {Readonly<Record<Biome, readonly string[]>>} */ (
		Object.freeze(
			Object.fromEntries(CAPITAL_MATS.map((mat) => [mat.id, mat.grid]))
		)
	);

/**
 * Throws unless a biome is one of the six base mats.
 * @param {string} biome
 * @throws {Error} When no base mat has that biome.
 */
function checkBiome(biome) {
	if (!Object.hasOwn(CAPITAL_GRIDS, biome)) {
		throw new Error(`Unknown capital biome: ${biome}`);
	}
}

/**
 * Draws one buildable plot: the biome's natural ground (#82).
 * @param {Biome} biome
 * @param {number} variant - 0 to 7; any other number wraps round
 * @returns {Canvas} A 32×32 plot, the same in every build
 * @throws {Error} When no base mat has that biome.
 */
export function drawTile(biome, variant) {
	checkBiome(biome);
	const tile = createCanvas(PLOT_SIZE, PLOT_SIZE);
	drawNaturalGround(tile, {
		biome,
		variant: ((variant % OPEN_VARIANTS) + OPEN_VARIANTS) % OPEN_VARIANTS,
	});
	return tile;
}
