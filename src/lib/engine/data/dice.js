// The dice: the science dice (the base d12 and A&A's d20) and the red and black conquer dice (d6), face by face (R6–R8; 01 §1.1; 03 §2.1).
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
 * Arts & Architecture's science die, rolled whenever the arts track is in play: 20 faces, the four board tracks and
 * the arts track on 4 each (03 §2.1).
 * @type {readonly TrackId[]}
 */
export const SCIENCE_D20 = deepFreeze(
	/** @type {TrackId[]} */ (
		Array.from({ length: 4 }, () => [
			'exploration',
			'science',
			'technology',
			'military',
			'arts',
		]).flat()
	)
);

/**
 * A science die's faces.
 * @param {'d12' | 'd20'} die
 * @returns {readonly TrackId[]}
 */
export function scienceFaces(die) {
	return die === 'd20' ? SCIENCE_D20 : SCIENCE_DIE;
}

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
