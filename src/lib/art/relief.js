// The geometry shared by the joined relief of a capital mat's impassable plots and its callers.

/** The mats that have relief art: the six base mats (#82), then the Arts & Architecture mats (#132). */
export const RELIEF_BIOMES = Object.freeze([
	'mountain',
	'forest',
	'wetland',
	'tropical',
	'desert',
	'grassland',
	'canyon',
	'cavern',
	'swamp',
	'mesa',
]);

/** A plot's side in pixels. */
export const PLOT = 32;
/** The gap between two plots in pixels. */
export const GAP = 1;
/** The distance from one plot to the next in pixels. */
export const PITCH = PLOT + GAP;

/**
 * The pixel size of a relief for a layout.
 * @param {number} rows
 * @param {number} cols
 * @returns {{ w: number, h: number }}
 * @example reliefSize(9, 9) // { w: 296, h: 296 }
 */
export function reliefSize(rows, cols) {
	return { w: cols * PITCH - GAP, h: rows * PITCH - GAP };
}
