// The 15 base space tiles and Plans & Ploys' 4, and their benefits, gained when a tile is explored next to the income mat (R5; 01 §7.2; 03 §1.5).
import { deepFreeze } from './ids.js';

/** @typedef {import('./effects.js').Effect} Effect */

/**
 * A space tile. It never touches the map, so nothing aligns; exploring it gives its benefit.
 * @typedef {Object} SpaceTile
 * @property {number} id - 1–15, the catalog's tile number
 * @property {readonly Effect[]} benefit
 * @property {boolean} ordered - The parts are taken in the order listed, because the tile says "then"
 * @property {string} [expansion] - Its expansion's code; left out for the base game's
 * @property {string} [art] - Its catalog slug, when not its number
 * @property {{ track: import('./ids.js').TrackId, vp: number }} [ongoing] - Once explored: whenever its player advances on `track`, they gain `vp` (#32)
 */

// R5: the erratum reads "conquer, then 1 VP per territory you control".
const ORDERED = new Set([11]);

/**
 * The 15 tiles in id order. The advances gain the space's benefit and may pay its bonus.
 * @type {readonly SpaceTile[]}
 */
export const SPACE_TILES = deepFreeze(
	/** @type {Effect[][]} */ ([
		[
			{ advance: { tracks: ['science'] } },
			{ vp: { per: 'trackSpace', track: 'science' } },
		],
		[{ building: 'armory' }, { vp: { per: 'armory' } }],
		[{ building: 'house' }, { vp: { per: 'house' } }],
		[
			{ gain: { tapestry: 1 } },
			{ tapestryOnTop: {} },
			{ vp: { per: 'tapestryCard' } },
		],
		[{ gain: { coin: 1, worker: 1 } }, { vp: 8 }],
		[{ research: {} }, { vp: 6 }],
		[{ gain: { food: 1, culture: 1 } }, { vp: 8 }],
		[{ gain: { culture: 1 } }, { scoreCapital: {} }],
		[
			{ advance: { tracks: ['technology'] } },
			{ vp: { per: 'trackSpace', track: 'technology' } },
		],
		[{ invent: {} }, { upgrade: {} }, { vp: { per: 'techCard' } }],
		// R5: the printed tile lacks the conquer icon; the official erratum adds it, in both versions.
		[{ conquer: {} }, { vp: { per: 'territory' } }],
		[
			{ advance: { tracks: ['military'] } },
			{ vp: { per: 'trackSpace', track: 'military' } },
		],
		[{ vp: 13 }],
		[{ building: 'farm' }, { vp: { per: 'farm' } }],
		[{ building: 'market' }, { vp: { per: 'market' } }],
	]).map((benefit, index) => ({
		id: index + 1,
		benefit,
		ordered: ORDERED.has(index + 1),
	}))
);

/**
 * Plans & Ploys' 4 space tiles, numbered on from the base game's in the catalog's order: three that gain 5 VP whenever
 * their player advances on a track, and the Monolith (03 §1.5, #32).
 * @type {readonly SpaceTile[]}
 */
export const EXPANSION_SPACE_TILES = deepFreeze(
	/** @type {SpaceTile[]} */ ([
		...['technology', 'science', 'military'].map((track, index) => ({
			id: 16 + index,
			benefit: [],
			ordered: false,
			expansion: 'pp',
			art: `${track}-5-vp`,
			ongoing: { track, vp: 5 },
		})),
		{
			id: 19,
			benefit: [{ landmark: 'monolith' }],
			ordered: false,
			expansion: 'pp',
			art: 'monolith',
		},
	])
);

/** Every space tile the engine knows, by id. */
const BY_ID = new Map(
	[...SPACE_TILES, ...EXPANSION_SPACE_TILES].map((tile) => [tile.id, tile])
);

/**
 * The space tiles of a game: the base game's, then its expansions'.
 * @param {readonly string[]} expansions
 * @returns {SpaceTile[]}
 */
export function spaceTilesFor(expansions) {
	return [
		...SPACE_TILES,
		...EXPANSION_SPACE_TILES.filter((tile) =>
			expansions.includes(/** @type {string} */ (tile.expansion))
		),
	];
}

/**
 * A space tile by id.
 * @param {number} id
 * @returns {SpaceTile}
 */
export function spaceTile(id) {
	const tile = BY_ID.get(id);
	if (!tile) {
		throw new RangeError(`There is no space tile ${id}.`);
	}
	return tile;
}
