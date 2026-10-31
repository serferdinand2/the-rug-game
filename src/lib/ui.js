// Interface ids shared by the components, and helpers that turn them into references to the design tokens in tokens.css.
import { resourceName, trackName } from './game-names.js';
import { TRACK_IDS } from './engine/data/ids.js';

/** @typedef {import('./engine/data/ids.js').TrackId} TrackId */
/** @typedef {import('./engine/data/ids.js').ResourceId} ResourceId */
/** @typedef {ResourceId | 'any'} CostSymbol - A price symbol: one resource, or one resource of any type */
/** @typedef {'sea' | 'desert' | 'forest' | 'grassland' | 'mountain' | 'unexplored'} Terrain */
/** @typedef {1 | 2 | 3 | 4 | 5} Seat - A table seat, which sets the player's colour */
/** @typedef {'mountain' | 'wetland' | 'tropical' | 'desert' | 'grassland' | 'forest'} CapitalBiome */

/** The engine's tracks, in board order, named by game-names.js. @type {readonly { id: TrackId, name: string }[]} */
export const TRACKS = Object.freeze(
	TRACK_IDS.map((id) => ({ id, name: trackName(id) }))
);

/**
 * The engine's resources in the order every screen lists them: food comes before workers, unlike the engine's own
 * order (01 §1.2). tests/client-id-lists.test.mjs checks it holds exactly the engine's resources.
 * @type {readonly ResourceId[]}
 */
export const RESOURCE_ORDER = Object.freeze([
	'coin',
	'food',
	'worker',
	'culture',
]);

/** The resources in RESOURCE_ORDER, named by game-names.js. @type {readonly { id: ResourceId, name: string }[]} */
export const RESOURCES = Object.freeze(
	RESOURCE_ORDER.map((id) => ({ id, name: resourceName(id) }))
);

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
 * The resource's accent colour for controls and labels around the approved artwork.
 * @param {ResourceId} resource
 * @returns {string} A token reference, such as 'var(--coin)'.
 */
export function resourceColor(resource) {
	return `var(--${resource})`;
}

/** Each expansion's badge colour; the base game has the gold. */
const EXPANSION_COLORS = /** @type {Readonly<Record<string, string>>} */ ({
	pp: 'var(--plans-ploys)',
	aa: 'var(--arts-architecture)',
	ff: 'var(--fantasies-futures)',
});

/** Each edition's chip colour on card paper (owner, #109); the interface's own badge colours are EXPANSION_COLORS. */
const CARD_EDITION_COLORS = /** @type {Readonly<Record<string, string>>} */ ({
	base: 'var(--card-band-start)',
	pp: 'var(--card-plans-ploys)',
	aa: 'var(--card-expansion)',
	ff: 'var(--card-fantasies-futures)',
});

/**
 * The colour of an edition's chip on a card (#109): base brown, Plans & Ploys green, Arts & Architecture purple and
 * Fantasies & Futures teal.
 * @param {string} code - 'base', 'pp', 'aa' or 'ff'
 * @returns {string} A token reference, such as 'var(--card-plans-ploys)'; the base brown for an unknown code.
 */
export function cardEditionColor(code) {
	return CARD_EDITION_COLORS[code] ?? CARD_EDITION_COLORS.base;
}

/**
 * The colour of an expansion's badges and chips (#101).
 * @param {string} code - Such as 'pp', 'aa', 'ff' or 'base'
 * @returns {string} A token reference, such as 'var(--plans-ploys)'; 'var(--gold)' for the base game.
 */
export function expansionColor(code) {
	return EXPANSION_COLORS[code] ?? 'var(--gold)';
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

/** Player artwork suffixes in seat order, matching the player design tokens. */
export const PLAYER_ART_COLORS = Object.freeze([
	'blue',
	'red',
	'green',
	'yellow',
	'purple',
]);

/**
 * The approved colored SVG for a player piece.
 * @param {'token' | 'outpost' | 'outpost-toppled' | 'capital-fortress'} piece
 * @param {Seat} seat
 * @returns {string}
 */
export function playerPieceUrl(piece, seat) {
	return artUrl(`piece/${piece}-${PLAYER_ART_COLORS[seat - 1]}`);
}

/**
 * A repeatable terrain variant for one plot in a game's capital composition.
 * The screen supplies the setup seed and plot mask; this does not change the rules layout.
 * @param {CapitalBiome} biome
 * @param {boolean} blocked - An impassable plot's own tile: only a mat without a relief has them, since each base
 *   mat's relief draws its impassable plots (#82)
 * @param {number} index - Row-major plot index
 * @param {number} seed - This game's visual setup seed
 * @returns {string}
 */
export function capitalTileUrl(biome, blocked, index, seed) {
	const hash =
		(Math.imul(seed | 0, 1664525) ^ Math.imul(index + 1, 1013904223)) >>> 0;
	const variant = String((hash % (blocked ? 6 : 8)) + 1).padStart(2, '0');
	return artUrl(
		`capital-terrain/${biome}-${blocked ? 'blocked' : 'open'}-${variant}`
	);
}
