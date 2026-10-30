// The BoardSwitcher's icons as data: a band for every track, and the World Map's seven hexes (#120).
import { terrainColor, trackColor } from './ui.js';

/** @typedef {import('./ui.js').TrackId} TrackId */
/** @typedef {'tracks' | 'map'} BoardView */

/**
 * One filled shape of an icon.
 * @typedef {Object} BoardMark
 * @property {string} points - The polygon's points in the icon's viewBox
 * @property {string} color - Its colour when the board is chosen, such as 'var(--exploration)'
 */

/**
 * One board the switcher offers, with its icon.
 * @typedef {Object} BoardChoice
 * @property {BoardView} value - The board
 * @property {string} title - Its title, shown when chosen
 * @property {string} viewBox - The icon's viewBox
 * @property {BoardMark[]} marks - The icon's shapes
 */

/** Both icons are drawn in this box. */
export const ICON_VIEWBOX = '0 0 54 32';

// The bands fill the box from 2 to 31.5, half a unit apart, and point right from 44 to 53.
const BAND_TOP = 2;
const BAND_BOTTOM = 31.5;
const BAND_GAP = 0.5;
const BAND_LEFT = 1;
const BAND_BODY = 44;
const BAND_TIP = 53;

/** Seven point-up hexagons, 2 / 3 / 2, coloured like terrain when chosen. @type {readonly BoardMark[]} */
export const MAP_MARKS = Object.freeze(
	[
		['21,1 26.2,4 26.2,10 21,13 15.8,10 15.8,4', terrainColor('forest')],
		['33,1 38.2,4 38.2,10 33,13 27.8,10 27.8,4', terrainColor('grassland')],
		['15,10 20.2,13 20.2,19 15,22 9.8,19 9.8,13', terrainColor('desert')],
		[
			'27,10 32.2,13 32.2,19 27,22 21.8,19 21.8,13',
			terrainColor('mountain'),
		],
		['39,10 44.2,13 44.2,19 39,22 33.8,19 33.8,13', terrainColor('sea')],
		['21,19 26.2,22 26.2,28 21,31 15.8,28 15.8,22', terrainColor('forest')],
		['33,19 38.2,22 38.2,28 33,31 27.8,28 27.8,22', 'var(--bronze)'],
	].map(([points, color]) => ({ points, color }))
);

/**
 * One short right-pointing band for each track, top to bottom, coloured like the track when chosen.
 * However many tracks there are, the bands fill the same box, so four keep the switcher's original bands.
 * @param {readonly TrackId[]} tracks - The tracks on the board, in order
 * @returns {BoardMark[]}
 */
export function trackMarks(tracks) {
	const count = Math.max(1, tracks.length);
	const height = (BAND_BOTTOM - BAND_TOP - BAND_GAP * (count - 1)) / count;
	return tracks.map((track, index) => {
		const top = BAND_TOP + index * (height + BAND_GAP);
		const middle = round(top + height / 2);
		const bottom = round(top + height);
		return {
			points: [
				[BAND_LEFT, round(top)],
				[BAND_BODY, round(top)],
				[BAND_TIP, middle],
				[BAND_BODY, bottom],
				[BAND_LEFT, bottom],
			]
				.map((point) => point.join(','))
				.join(' '),
			color: trackColor(track),
		};
	});
}

/**
 * The boards the switcher offers, each with its icon.
 * @param {readonly TrackId[]} tracks - The tracks on the board, one band each
 * @returns {BoardChoice[]}
 */
export function boardChoices(tracks) {
	return [
		{
			value: 'tracks',
			title: 'Advancement Tracks',
			viewBox: ICON_VIEWBOX,
			marks: trackMarks(tracks),
		},
		{
			value: 'map',
			title: 'World Map',
			viewBox: ICON_VIEWBOX,
			marks: [...MAP_MARKS],
		},
	];
}

/**
 * A coordinate to two decimals, so no float noise reaches the points.
 * @param {number} value
 * @returns {number}
 */
function round(value) {
	return Math.round(value * 100) / 100;
}
