// The 3 dice: the science die (d12) and the red and black conquer dice (d6), face by face (R6–R8; 01 §1.1).
import { deepFreeze } from './ids.js';

/** @typedef {import('./ids.js').TrackId} TrackId */
/** @typedef {import('./effects.js').Effect} Effect */

/**
 * R6: the science die's 12 faces. Each track is on 3 of them, so each has a 1 in 4 chance.
 * @type {readonly TrackId[]}
 */
export const SCIENCE_DIE = deepFreeze(
	/** @type {TrackId[]} */ ([
		'exploration',
		'science',
		'technology',
		'military',
		'exploration',
		'science',
		'technology',
		'military',
		'exploration',
		'science',
		'technology',
		'military',
	])
);

/**
 * R7: the red conquer die's 6 faces. "1 VP per territory you control" is on 2 of them.
 * @type {readonly Effect[]}
 */
export const RED_DIE = deepFreeze([
	{ vp: 4 },
	{ vp: 5 },
	{ vp: 6 },
	{ vp: 7 },
	{ vp: { per: 'territory' } },
	{ vp: { per: 'territory' } },
]);

/**
 * R8: the black conquer die's 6 faces. "?" is on 2 of them: it gives the benefit printed on the
 * conquered territory tile, and nothing on a printed territory.
 * @type {readonly Effect[]}
 */
export const BLACK_DIE = deepFreeze([
	{ gain: { coin: 1 } },
	{ gain: { worker: 1 } },
	{ gain: { food: 1 } },
	{ gain: { culture: 1 } },
	{ tileBenefit: {} },
	{ tileBenefit: {} },
]);
