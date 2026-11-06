// The geometry shared by the joined relief of a capital mat's impassable plots and its callers.

/** The mats that have relief art: the six base mats (#82), the Arts & Architecture mats (#132), then the Fantasies & Futures mats (#133). */
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
	'archipelago',
	'cloud-city',
	'quagmire',
	'city-in-a-bottle',
	'veil',
	'savanna',
	'polar',
	'netherworld',
]);

/**
 * The mats that print features on their buildable plots, each drawn as a picture of its own between the ground
 * and the relief: the Archipelago's beaches, the Canyon's cacti, Cloud City's rims and the Swamp's lily pads (#132),
 * and the Quagmire's reeds (#133).
 */
export const FEATURE_BIOMES = Object.freeze([
	'archipelago',
	'canyon',
	'cloud-city',
	'swamp',
	'quagmire',
]);

/**
 * Each Cloud City cloud's tint, by its digit in the mat's district map (1–9; 0 is unused): 0 white, 1 grey, 2 tan,
 * 3 cream (research table; cloud 1 grey, 2 tan, 3 cream, 4 white, 5 grey, 6 cream, 7 tan, 8 white, 9 white). A plot's
 * natural ground follows its cloud's tint (#132, #36).
 * @type {readonly number[]}
 */
export const CLOUD_TINTS = Object.freeze([0, 1, 2, 3, 0, 1, 3, 2, 0, 0]);

/** The names of the four cloud tints, by tint index (#132). */
export const CLOUD_TINT_NAMES = Object.freeze([
	'white',
	'grey',
	'tan',
	'cream',
]);

/**
 * The mats that print over their relief, each drawn as a picture of its own laid over it (#133): the bottle's
 * glass, the veil and its pocket icons, the Savanna's herds and district borders, Polar's rings and field lines,
 * and the Netherworld's imps and city centre.
 */
export const OVERLAY_BIOMES = Object.freeze([
	'city-in-a-bottle',
	'veil',
	'savanna',
	'polar',
	'netherworld',
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
