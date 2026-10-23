// The effect vocabulary: how track spaces, the income mat, tiles and dice write what they do, for one resolver to interpret.
// docs/superpowers/specs/2026-10-24-base-game-data-design.md explains each kind in plain words.
import { deepFreeze } from './ids.js';

/** @typedef {import('./ids.js').TrackId} TrackId */
/** @typedef {import('./ids.js').BuildingId} BuildingId */

/**
 * Things a player gains. `any` is one resource of the player's choice per point.
 * @typedef {Object} Gain
 * @property {number} [coin]
 * @property {number} [worker]
 * @property {number} [food]
 * @property {number} [culture]
 * @property {number} [any] - Resources of the player's choice, each chosen on its own
 * @property {number} [territory] - Territory tiles into the supply
 * @property {number} [space] - Space tiles into the supply
 * @property {number} [tapestry] - Tapestry cards into the hand
 */

/**
 * What a player pays: resources, or tiles and cards they discard.
 * @typedef {Object} Cost
 * @property {number} [coin]
 * @property {number} [worker]
 * @property {number} [food]
 * @property {number} [culture]
 * @property {number} [any] - Resources of the player's choice
 * @property {number} [territory] - Territory tiles discarded from the supply
 * @property {number} [tapestry] - Tapestry cards discarded from the hand
 * @property {number} [tech] - Tech cards discarded
 */

/**
 * What a `vp: { per }` effect counts:
 * - `territory`: territories you control on the map;
 * - `territoryTile`: territory tiles in your supply;
 * - `techCard`: your tech cards, in every row;
 * - `tapestryCard`: tapestry cards in your hand and on your income mat, covered ones included;
 * - `trackSpace`: spaces you have advanced on the effect's `track`;
 * - an income building: the buildings of that type you own, beside the mat too (01 §6.1).
 * @typedef {'territory' | 'territoryTile' | 'techCard' | 'tapestryCard' | 'trackSpace' | BuildingId} VpCounter
 */

/**
 * VP for each thing counted.
 * @typedef {Object} VpPer
 * @property {VpCounter} per
 * @property {TrackId} [track] - The track whose spaces count, for 'trackSpace'
 * @property {number} [each=1] - VP per thing counted
 */

/**
 * One effect: an object with exactly one key, its kind.
 * - `gain`: gain resources, tiles or cards.
 * - `building`: take the leftmost income building of that type from the income mat and place it in the capital city.
 * - `vp`: gain that many VP, or VP per thing counted.
 * - `explore`: explore with a territory tile from the supply; `anywhere` drops the adjacency rule.
 * - `exploreSpace`: explore a space tile from the supply.
 * - `conquer`: conquer; `anywhere` drops adjacency; `bothDice` gives both dice always, or only if an opponent controlled the territory (R17).
 * - `research`: roll the science die and you may advance on that track; `noBenefit` is the X.
 * - `advance`: advance 1 space on one of the listed tracks, with its benefit and optional bonus.
 * - `regress`: go back 1 space on one of the listed tracks, then gain that space's benefit and optional bonus.
 * - `repeat`: gain the benefit of your current space on any track, and you may pay its bonus.
 * - `invent`: gain tech cards one at a time; `refresh` lets you first replace the 3 face-up cards.
 * - `upgrade`: upgrade 1 tech card.
 * - `techBenefit`: gain the circle benefit of a card in your middle row, or the square benefit of one in your top row, without moving it.
 * - `tapestryOnTop`: play a tapestry card from your hand on top of your current tapestry.
 * - `scoreCapital`: score the capital city, 1 VP per complete row and column on a basic mat.
 * - `tileBenefit`: gain the benefit printed on the territory tile just conquered; a printed territory gives nothing (R8).
 * - `gainCiv`: gain a random additional civilization.
 * - `restartToken`: take your token off this track and put it on the start of any track; this track still counts as complete.
 * - `choice`: choose exactly one of the options, each a list of effects.
 * @typedef {{ gain: Gain }
 *   | { building: BuildingId }
 *   | { vp: number | VpPer }
 *   | { explore: { anywhere?: boolean } }
 *   | { exploreSpace: {} }
 *   | { conquer: { anywhere?: boolean, bothDice?: 'always' | 'ifOpponent' } }
 *   | { research: { noBenefit?: boolean, rolls?: number, offTrackVp?: number } }
 *   | { advance: { tracks: TrackId[] } }
 *   | { regress: { tracks: TrackId[] } }
 *   | { repeat: {} }
 *   | { invent: { count?: number, refresh?: boolean } }
 *   | { upgrade: {} }
 *   | { techBenefit: { icon: 'circle' | 'square' } }
 *   | { tapestryOnTop: {} }
 *   | { scoreCapital: {} }
 *   | { tileBenefit: {} }
 *   | { gainCiv: {} }
 *   | { restartToken: {} }
 *   | { choice: Effect[][] }} Effect
 */

/**
 * An optional extra: pay `pay` once to get the effects in `gain`. Bonuses are always optional.
 * @typedef {Object} Bonus
 * @property {Cost} pay
 * @property {Effect[]} gain
 */

/**
 * Every effect kind, in the order of the Effect typedef.
 * @type {readonly string[]}
 */
export const EFFECT_KINDS = deepFreeze([
	'gain',
	'building',
	'vp',
	'explore',
	'exploreSpace',
	'conquer',
	'research',
	'advance',
	'regress',
	'repeat',
	'invent',
	'upgrade',
	'techBenefit',
	'tapestryOnTop',
	'scoreCapital',
	'tileBenefit',
	'gainCiv',
	'restartToken',
	'choice',
]);

/**
 * Every VP counter.
 * @type {readonly VpCounter[]}
 */
export const VP_COUNTERS = deepFreeze([
	'territory',
	'territoryTile',
	'techCard',
	'tapestryCard',
	'trackSpace',
	'market',
	'house',
	'farm',
	'armory',
]);
