// The 15 base space tiles and their benefits, gained when a tile is explored next to the income mat (R5; 01 §7.2).
import { deepFreeze } from './ids.js';

/** @typedef {import('./effects.js').Effect} Effect */

/**
 * A space tile. It never touches the map, so nothing aligns; exploring it gives its benefit.
 * @typedef {Object} SpaceTile
 * @property {number} id - 1–15, the catalog's tile number
 * @property {readonly Effect[]} benefit
 */

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
	]).map((benefit, index) => ({ id: index + 1, benefit }))
);
