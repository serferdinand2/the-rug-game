// Interface ids shared by the components, and helpers that turn them into references to the design tokens in tokens.css.

/** @typedef {'exploration' | 'science' | 'technology' | 'military'} TrackId */
/** @typedef {'coin' | 'food' | 'worker' | 'culture'} ResourceId */
/** @typedef {ResourceId | 'any'} CostSymbol - A price symbol: one resource, or one resource of any type */
/** @typedef {'sea' | 'desert' | 'forest' | 'grassland' | 'mountain' | 'unexplored'} Terrain */
/** @typedef {1 | 2 | 3 | 4 | 5} Seat - A table seat, which sets the player's colour */

/** The four tracks, in board order. @type {readonly { id: TrackId, name: string }[]} */
export const TRACKS = Object.freeze([
	{ id: 'exploration', name: 'Exploration' },
	{ id: 'science', name: 'Science' },
	{ id: 'technology', name: 'Technology' },
	{ id: 'military', name: 'Military' },
]);

/** The four resources, in the order the player overview lists them. @type {readonly { id: ResourceId, name: string }[]} */
export const RESOURCES = Object.freeze([
	{ id: 'coin', name: 'Coin' },
	{ id: 'food', name: 'Food' },
	{ id: 'worker', name: 'Worker' },
	{ id: 'culture', name: 'Culture' },
]);

/** The map's terrain types. @type {readonly { id: Terrain, name: string }[]} */
export const TERRAINS = Object.freeze([
	{ id: 'sea', name: 'Sea' },
	{ id: 'desert', name: 'Desert' },
	{ id: 'forest', name: 'Forest' },
	{ id: 'grassland', name: 'Grassland' },
	{ id: 'mountain', name: 'Mountain' },
	{ id: 'unexplored', name: 'Unexplored' },
]);

/** The five seats of a table. @type {readonly Seat[]} */
export const SEATS = Object.freeze([1, 2, 3, 4, 5]);

/**
 * The colour of a track.
 * @param {TrackId} track
 * @returns {string} A token reference, such as 'var(--exploration)'.
 */
export function trackColor(track) {
	return `var(--${track})`;
}

/**
 * The colour of a seat's player.
 * @param {Seat} seat
 * @returns {string} A token reference, such as 'var(--player-1)'.
 */
export function playerColor(seat) {
	return `var(--player-${seat})`;
}

/**
 * The placeholder colour of a resource, until the resource icons land.
 * @param {ResourceId} resource
 * @returns {string} A token reference, such as 'var(--coin)'.
 */
export function resourceColor(resource) {
	return `var(--${resource})`;
}

/**
 * The colour of a terrain type on the map.
 * @param {Terrain} terrain
 * @returns {string} A token reference, such as 'var(--forest)'.
 */
export function terrainColor(terrain) {
	return `var(--${terrain})`;
}

/**
 * The URL of a drawn asset, by its stable catalog id.
 * @param {string} id - An asset id, such as 'landmark/lighthouse'.
 * @returns {string} Its URL, such as '/art/landmark/lighthouse.svg'.
 */
export function artUrl(id) {
	return `/art/${id}.svg`;
}

const NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

/**
 * An era or tier number as a Roman numeral.
 * @param {number} number - 1 to 10.
 * @returns {string} The numeral, such as 'IV'.
 */
export function roman(number) {
	const numeral = NUMERALS[number - 1];
	if (!Number.isInteger(number) || !numeral) {
		throw new RangeError(
			`Roman numerals here run from 1 to 10, not ${number}`
		);
	}
	return numeral;
}
