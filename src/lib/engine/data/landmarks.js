// The 18 base landmarks, where each one comes from, and the height ranking the current rules' tiebreak uses (01 §6.3; R11–R13).
// Footprints come from src/lib/art/footprints.js, the one copy the art, the interface and the engine share.
import { FOOTPRINTS } from '../../art/footprints.js';
import { deepFreeze } from './ids.js';

/** @typedef {import('./ids.js').TrackId} TrackId */

/**
 * Where a landmark comes from: the first player into a track's tier II, III or IV, or upgrading the tech card of the same name to the top row.
 * @typedef {{ track: TrackId, tier: 2 | 3 | 4, space: 4 | 7 | 10 } | { tech: string }} LandmarkSource
 */

/**
 * A landmark. There is exactly one of each.
 * @typedef {Object} Landmark
 * @property {string} id - The catalog slug, such as 'lighthouse'
 * @property {string} name
 * @property {readonly string[]} footprint - Rows top first, X for a covered plot; any of the 4 rotations, never a mirror (R15)
 * @property {LandmarkSource} source
 */

/**
 * A landmark with its shared footprint.
 * @param {string} id
 * @param {string} name
 * @param {LandmarkSource} source
 * @returns {Landmark}
 */
function landmark(id, name, source) {
	const footprint = FOOTPRINTS[id];
	if (!footprint) {
		throw new RangeError(`landmark ${id} has no footprint`);
	}
	return { id, name, footprint, source };
}

/**
 * The 18 base landmarks: the 12 track landmarks in track order, then the 6 tech-card landmarks.
 * @type {readonly Landmark[]}
 */
export const LANDMARKS = deepFreeze([
	landmark('lighthouse', 'Lighthouse', {
		track: 'exploration',
		tier: 2,
		space: 4,
	}),
	landmark('train-station', 'Train Station', {
		track: 'exploration',
		tier: 3,
		space: 7,
	}),
	landmark('launch-pad', 'Launch Pad', {
		track: 'exploration',
		tier: 4,
		space: 10,
	}),
	landmark('apothecary', 'Apothecary', {
		track: 'science',
		tier: 2,
		space: 4,
	}),
	landmark('academy', 'Academy', { track: 'science', tier: 3, space: 7 }),
	landmark('laboratory', 'Laboratory', {
		track: 'science',
		tier: 4,
		space: 10,
	}),
	landmark('forge', 'Forge', { track: 'technology', tier: 2, space: 4 }),
	landmark('rubber-works', 'Rubber Works', {
		track: 'technology',
		tier: 3,
		space: 7,
	}),
	landmark('tech-hub', 'Tech Hub', {
		track: 'technology',
		tier: 4,
		space: 10,
	}),
	landmark('barracks', 'Barracks', { track: 'military', tier: 2, space: 4 }),
	landmark('tank-factory', 'Tank Factory', {
		track: 'military',
		tier: 3,
		space: 7,
	}),
	landmark('fusion-reactor', 'Fusion Reactor', {
		track: 'military',
		tier: 4,
		space: 10,
	}),
	// The tech card's square (top-row) benefit places these (01 §6.3).
	landmark('bakery', 'Bakery', { tech: 'bakery' }),
	landmark('barn', 'Barn', { tech: 'barn' }),
	landmark('com-tower', 'Com Tower', { tech: 'com-tower' }),
	landmark('library', 'Library', { tech: 'library' }),
	landmark('stock-market', 'Stock Market', { tech: 'stock-market' }),
	landmark('treasury', 'Treasury', { tech: 'treasury' }),
]);

/**
 * R12: every landmark of the game and its expansions, tallest first, for the current rules' tiebreak (R11).
 * The original 2019 printing breaks ties by resources only (R10), so it never reads this list.
 * It is one decided list, so the expansion landmarks are here too. The 18 base slots
 * (1, 4–14, 16, 18, 25, 29, 32 and 33) are owner-check until the miniatures are measured (#45).
 * @type {readonly string[]}
 */
export const HEIGHT_RANKING = deepFreeze([
	'fusion-reactor',
	'skyscraper',
	'holocenter',
	'launch-pad',
	'laboratory',
	'tech-hub',
	'lighthouse',
	'forge',
	'train-station',
	'academy',
	'rubber-works',
	'tank-factory',
	'apothecary',
	'barracks',
	'castle',
	'barn',
	'bridge',
	'library',
	'stadium',
	'digital-studio',
	'tv-station',
	'urban-farm',
	'villa',
	'birdwatching-perch',
	'com-tower',
	'game-store',
	'windmill',
	'opera-house',
	'bakery',
	'clock-tower',
	'monolith',
	'stock-market',
	'treasury',
]);
