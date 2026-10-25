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
 * @property {number} [vp] - Victory points paid
 */

/**
 * What a `vp: { per }` effect counts:
 * - `territory`: territories you control on the map;
 * - `territoryTile`: territory tiles in your supply;
 * - `techCard`: your tech cards, in every row;
 * - `tapestryCard`: tapestry cards in your hand and on your income mat, covered ones included;
 * - `trackSpace`: spaces you have advanced on the effect's `track`;
 * - `trackLead`: tracks where no other seat is further ahead than you, ties included;
 * - `landmark`: landmarks you own, in the capital, beside the mat or on the map (R71);
 * - `opponent`: the other seats;
 * - an income building: the buildings of that type you own, beside the mat too (01 §6.1).
 * @typedef {'territory' | 'territoryTile' | 'techCard' | 'tapestryCard' | 'trackSpace' | 'trackLead' | 'landmark' | 'opponent' | BuildingId} VpCounter
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
 * - `lose`: lose up to `culture` culture, as much as is held, then `any` resources of your choice among those you hold.
 * - `building`: take the leftmost income building of that type from the income mat and place it in the capital city.
 * - `landmark`: place that landmark (a tech card's square) in the capital city.
 * - `vp`: gain that many VP, or VP per thing counted.
 * - `explore`: explore with a territory tile from the supply; `anywhere` drops the adjacency rule; `tile` allows only that tile; `sailed` marks an explore Age of Sail has already drawn for.
 * - `exploreSpace`: explore a space tile from the supply; `fromGained` limits it to the tiles this benefit just gained (R105).
 * - `conquer`: conquer; `anywhere` drops adjacency; `bothDice` gives both dice always, or only if an opponent controlled the territory (R17).
 * - `research`: roll the science die and you may advance on that track; `noBenefit` is the X.
 * - `advance`: advance 1 space on one of the listed tracks, with its benefit and optional bonus; `noBenefit` is the X; `optional` lets the player decline; `freeBonus` lets them take the bonus of the space reached without paying; `noBonus` gives the benefit without the bonus; `offTrackVp` gives that many VP instead when every token on the listed tracks is on space 12.
 * - `regress`: go back 1 space on one of the listed tracks, then gain that space's benefit and optional bonus; `noBenefit` is the X.
 * - `repeat`: gain the benefit of your current space on any track, and you may pay its bonus; `oncePerTurn` limits it to once a turn (FAQ #6).
 * - `invent`: gain tech cards one at a time; `refresh` lets you first replace the 3 face-up cards; `faceUpOnly` and `deckOnly` limit where the card comes from; `thenUpgrade` upgrades a card after.
 * - `upgrade`: upgrade 1 tech card.
 * - `techBenefit`: gain the circle benefit of a card in your middle row, or the square benefit of one in your top row, without moving it.
 * - `tapestryOnTop`: play a tapestry card from your hand on top of your current tapestry.
 * - `scoreCapital`: score the capital city, 1 VP per complete row and column on a basic mat.
 * - `tileBenefit`: gain the benefit printed on the territory tile just conquered; a printed territory gives nothing (R8).
 * - `gainCiv`: gain a random additional civilization.
 * - `restartToken`: take your token off this track and put it on the start of any track; this track still counts as complete.
 * - `choice`: choose exactly one of the options, each a list of effects.
 * - `eraPartner`: choose the opponent (and track, with `track`) that the active THIS ERA ability names.
 * - `copyTapestry`: copy the ability of a visible tapestry card.
 * - `sharedAdvance`: advance with the benefit on a rolled or chosen track, and the others advance on it without the benefit.
 * - `others`: each listed player runs `effects` as their own operation, neighbours or everyone.
 * - `trade`: pay one offer's cost for its gain; `host` is the seat hosting it (Olympic Host).
 * - `discardTapestry`: discard any number of hand cards for `vpEach` VP each.
 * - `anyBuilding`: gain one income building of your choice.
 * - `trackLandmark`: gain and place any track landmark nobody owns.
 * - `landmarkRank`: compare landmarks owned with every opponent and run `fewest`, `most` or `otherwise`.
 * - `placeOutpost`: put an outpost from the supply on a hex, without a conquest.
 * - `darkAges`, `socialism`, `dictatorship`, `revolution`, `colonialism`, `pleaForAid`, `technocracy`, `tradeEconomy`, `coalBaron`, `olympicHost`: the rules of the card of that name.
 * @typedef {{ gain: Gain }
 *   | { lose: { culture?: number, any?: number } }
 *   | { building: BuildingId }
 *   | { landmark: string }
 *   | { vp: number | VpPer }
 *   | { explore: { anywhere?: boolean, tile?: number, sailed?: boolean } }
 *   | { exploreSpace: { fromGained?: boolean } }
 *   | { conquer: { anywhere?: boolean, bothDice?: 'always' | 'ifOpponent' } }
 *   | { research: { noBenefit?: boolean, rolls?: number, offTrackVp?: number } }
 *   | { advance: { tracks: TrackId[], noBenefit?: boolean, optional?: boolean, freeBonus?: boolean, noBonus?: boolean, offTrackVp?: number } }
 *   | { regress: { tracks: TrackId[], noBenefit?: boolean } }
 *   | { repeat: { oncePerTurn?: boolean } }
 *   | { invent: { count?: number, refresh?: boolean, faceUpOnly?: boolean, deckOnly?: boolean, thenUpgrade?: boolean } }
 *   | { upgrade: {} }
 *   | { techBenefit: { icon: 'circle' | 'square' } }
 *   | { tapestryOnTop: {} }
 *   | { scoreCapital: {} }
 *   | { tileBenefit: {} }
 *   | { gainCiv: {} }
 *   | { restartToken: {} }
 *   | { choice: Effect[][] }
 *   | { eraPartner: { track?: boolean } }
 *   | { copyTapestry: {} }
 *   | { sharedAdvance: { track: 'roll' | 'choose', others: 'opponents' | 'neighbours', optional?: boolean } }
 *   | { others: { who: 'neighbours' | 'all', effects: Effect[] } }
 *   | { trade: { offers: { pay: Cost, gain: Effect[] }[], optional?: boolean, host?: number } }
 *   | { discardTapestry: { vpEach: number } }
 *   | { anyBuilding: {} }
 *   | { trackLandmark: {} }
 *   | { landmarkRank: { fewest: Effect[], most: Effect[], otherwise: Effect[] } }
 *   | { placeOutpost: { hex: string } }
 *   | { darkAges: {} }
 *   | { socialism: {} }
 *   | { dictatorship: {} }
 *   | { revolution: {} }
 *   | { colonialism: {} }
 *   | { pleaForAid: {} }
 *   | { technocracy: {} }
 *   | { tradeEconomy: {} }
 *   | { coalBaron: {} }
 *   | { olympicHost: {} }} Effect
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
	'lose',
	'building',
	'landmark',
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
	'eraPartner',
	'copyTapestry',
	'sharedAdvance',
	'others',
	'trade',
	'discardTapestry',
	'anyBuilding',
	'trackLandmark',
	'landmarkRank',
	'placeOutpost',
	'darkAges',
	'socialism',
	'dictatorship',
	'revolution',
	'colonialism',
	'pleaForAid',
	'technocracy',
	'tradeEconomy',
	'coalBaron',
	'olympicHost',
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
	'trackLead',
	'landmark',
	'opponent',
	'market',
	'house',
	'farm',
	'armory',
]);
