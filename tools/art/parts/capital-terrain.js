// The base and Arts & Architecture mats' terrain: each biome's 32px buildable plots; base layouts from
// research/01-base-core-rules.md §6.2. The impassable plots have no tiles of their own: each mat's relief draws
// them (#82, #132, tools/art/parts/capital-relief/).
import { createCanvas } from '../painter.js';
import { CAPITAL_MATS } from '../../../src/lib/engine/data/capitals.js';
import { drawNaturalGround } from '../../../src/lib/art/paint/relief/ground.js';
/** @typedef {'mountain' | 'wetland' | 'tropical' | 'desert' | 'grassland' | 'forest'} Biome */
/**
 * A natural ground a buildable tile is drawn in: a base biome's, an Arts & Architecture biome's, or one of
 * Cloud City's four tints (#132).
 * @typedef {Biome | 'archipelago' | 'canyon' | 'cavern' | 'mesa' | 'swamp' | 'cloud-city-white' | 'cloud-city-grey' | 'cloud-city-tan' | 'cloud-city-cream'} Ground
 */

/** The Arts & Architecture grounds (#132), Cloud City's one per cloud tint. */
const ADVANCED_GROUNDS = Object.freeze([
	'archipelago',
	'canyon',
	'cavern',
	'mesa',
	'swamp',
	'cloud-city-white',
	'cloud-city-grey',
	'cloud-city-tan',
	'cloud-city-cream',
]);
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
 * Throws unless a ground is a base mat's or an Arts & Architecture mat's.
 * @param {string} biome
 * @throws {Error} When no such mat has that ground.
 */
function checkBiome(biome) {
	if (
		!Object.hasOwn(CAPITAL_GRIDS, biome) &&
		!ADVANCED_GROUNDS.includes(biome)
	) {
		throw new Error(`Unknown capital biome: ${biome}`);
	}
}

/**
 * Draws one buildable plot: the biome's natural ground (#82, #132).
 * @param {Ground} biome
 * @param {number} variant - 0 to 7; any other number wraps round
 * @returns {Canvas} A 32×32 plot, the same in every build
 * @throws {Error} When no base or Arts & Architecture mat has that ground.
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
