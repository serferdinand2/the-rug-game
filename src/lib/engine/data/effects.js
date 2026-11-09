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
 * @property {number} [keep] - Of the tapestry cards drawn, how many the player keeps; the rest are discarded (#53)
 */

/**
 * What a player pays: resources, or tiles and cards they discard.
 * @typedef {Object} Cost
 * @property {number} [coin]
 * @property {number} [worker]
 * @property {number} [food]
 * @property {number} [culture]
 * @property {number} [any] - Resources of the player's choice
 * @property {number} [different] - Resources of the player's choice, each of a different type; never with other resources (the arts track, #35)
 * @property {number} [same] - Resources of the player's choice, all of one type; never with other resources (the arts track, #35)
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
 * - an income building: the buildings of that type you own, beside the mat too (01 §6.1);
 * - `incomeBuilding`: every income building you own, of every type (R71; the Holocenter, #35);
 * - `capitalRow`, `capitalColumn`: the complete rows or columns of your capital city, which is not scoring it (Ballet,
 *   Modern Dance, 03 §2.12).
 * @typedef {'territory' | 'territoryTile' | 'techCard' | 'tapestryCard' | 'trackSpace' | 'trackLead' | 'landmark' | 'opponent' | BuildingId | 'incomeBuilding' | 'capitalRow' | 'capitalColumn'} VpCounter
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
 * - `pay`: pay `any` resources of your choice, all of them: whatever offers it checks that you hold enough (the Aliens, #33).
 * - `building`: take the leftmost income building of that type from the income mat and place it in the capital city.
 * - `landmark`: place that landmark (a tech card's square) in the capital city.
 * - `vp`: gain that many VP, or VP per thing counted.
 * - `explore`: explore with a territory tile from the supply; `anywhere` drops the adjacency rule; `tile` allows only that tile; `sailed` marks an explore Age of Sail has already drawn for; `mat` allows only the Islanders' mat hexes and `free` only places the tile there, with no VP or benefit (R113); `migration` allows only hexes next to no controlled territory and then places 2 outposts there (#37).
 * - `exploreSpace`: explore a space tile from the supply; `fromGained` limits it to the tiles this benefit just gained (R105); `civ` puts it on that civilization's mat instead of beside the income mat (the Aliens, #33).
 * - `conquer`: conquer; `anywhere` drops adjacency; `bothDice` gives both dice always, or only if an opponent controlled the territory (R17); `only` limits the targets to those hexes (#33); `empty` to territories with no item (Topiary, R53).
 * - `research`: roll the science die and you may advance on that track; `noBenefit` is the X.
 * - `advance`: advance 1 space on one of the listed tracks, with its benefit and optional bonus; `noBenefit` is the X; `optional` lets the player decline; `freeBonus` lets them take the bonus of the space reached without paying; `noBonus` gives the benefit without the bonus; `offTrackVp` gives that many VP instead when every token on the listed tracks is on space 12.
 * - `regress`: go back 1 space on one of the listed tracks, then gain that space's benefit and optional bonus; `noBenefit` is the X; `noBonus` gives the benefit without the bonus (Government Grants, #37).
 * - `repeat`: gain the benefit of your current space on any track, and you may pay its bonus; `oncePerTurn` limits it to once a turn (FAQ #6); `track` to that track and `noBonus` leaves out the bonus (#37).
 * - `invent`: gain tech cards one at a time; `refresh` lets you first replace the 3 face-up cards; `faceUpOnly` and `deckOnly` limit where the card comes from, which is otherwise also the tech discard pile for the Recyclers; `thenUpgrade` upgrades a card after.
 * - `upgrade`: upgrade 1 tech card; `optional` lets you decline (an income turn's, the Recyclers' own); `lock` keeps that card from being upgraded again this turn (Ceramics, #35); `ignorePrerequisite` lets a middle-row card go up with its prerequisite unmet and `count` upgrades that many times, one after another (Duct Tape, #37). The Recyclers may recycle a top-row card instead.
 * - `techBenefit`: gain the circle benefit of a card in your middle row, or the square benefit of one in your top row, without moving it; `anyRow` offers every card's (Information Age, #37).
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
 * - `trade`: pay one offer's cost for its gain; `host` is the seat hosting it (Olympic Host), `purpose` what offers it (the Utilitarians' 'lighthouse'), `then` an operation following a trade made and `otherwise` the effects of one not made (Moon Landing, #37).
 * - `discardTapestry`: discard any number of hand cards for `vpEach` VP each.
 * - `advanceEach`: advance once on each track in play, in any order (Renaissance; R118 adds the arts track).
 * - `anyBuilding`: gain one income building of your choice.
 * - `trackLandmark`: gain and place any track landmark nobody owns.
 * - `landmarkRank`: compare landmarks owned with every opponent and run `fewest`, `most` or `otherwise`.
 * - `placeOutpost`: put an outpost from the supply on a hex, without a conquest; `card` names the card that does it, Militarism's otherwise.
 * - `placeToken`: put one of a civilization's tokens from its mat on a hex, as an item that gives no control (R33).
 * - `discardCiv`: discard a civilization you hold, face up (the Riverfolk gained mid-game, #33).
 * - `darkAges`, `socialism`, `dictatorship`, `revolution`, `colonialism`, `pleaForAid`, `technocracy`, `tradeEconomy`, `coalBaron`, `olympicHost`: the rules of the card of that name.
 * - `astronomy`, `cartography`, `manifestDestiny`, `statusQuo`, `worldsFair`: the rules of the Plans & Ploys card of that name (#33).
 * - `create`, `inspire`, `broadcast`, `refreshMasterpieces`, `streamingImplants`: Arts & Architecture's masterpieces and
 *   inspiration tiles (03 §2.2–2.8); `flipMasterpiece` turns the masterpiece firing face down (a single-use card's).
 * - `collectOutpost`: put an outpost from the supply on the Collectors' mat, instead of conquering (R129, #37).
 * - `charm`: one F&F card's left or right charm bonus; `ability`: a placed card's own ability, which may come before or
 *   after its charms (03 FF.2.1, #39).
 * - `politicalPosturing`, `spymaster`, `ageOfEnlightenment`, `silkRoad`, `infrastructureUpgrade`, `plague`, `granges`: the rules of the Arts & Architecture card of that name (#37).
 * @typedef {{ gain: Gain }
 *   | { lose: { culture?: number, any?: number } }
 *   | { pay: { any: number } }
 *   | { building: BuildingId }
 *   | { landmark: string }
 *   | { vp: number | VpPer }
 *   | { explore: { anywhere?: boolean, tile?: number, sailed?: boolean, mat?: boolean, free?: boolean, migration?: boolean } }
 *   | { exploreSpace: { fromGained?: boolean, civ?: string } }
 *   | { conquer: { anywhere?: boolean, bothDice?: 'always' | 'ifOpponent', only?: string[], empty?: boolean, collectorsAsked?: boolean } }
 *   | { research: { noBenefit?: boolean, rolls?: number, offTrackVp?: number } }
 *   | { advance: { tracks: TrackId[], noBenefit?: boolean, optional?: boolean, freeBonus?: boolean, noBonus?: boolean, offTrackVp?: number } }
 *   | { advanceEach: { noBenefit?: boolean, freeBonus?: boolean } }
 *   | { regress: { tracks: TrackId[], noBenefit?: boolean, noBonus?: boolean } }
 *   | { repeat: { oncePerTurn?: boolean, track?: TrackId, noBonus?: boolean } }
 *   | { invent: { count?: number, refresh?: boolean, faceUpOnly?: boolean, deckOnly?: boolean, thenUpgrade?: boolean } }
 *   | { upgrade: { optional?: boolean, lock?: boolean, ignorePrerequisite?: boolean, count?: number } }
 *   | { techBenefit: { icon: 'circle' | 'square', anyRow?: boolean } }
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
 *   | { trade: { offers: { pay: Cost, gain: Effect[] }[], optional?: boolean, host?: number, purpose?: string, then?: { kind: string } & Record<string, any>, otherwise?: Effect[] } }
 *   | { discardTapestry: { vpEach: number } }
 *   | { anyBuilding: {} }
 *   | { trackLandmark: {} }
 *   | { landmarkRank: { fewest: Effect[], most: Effect[], otherwise: Effect[] } }
 *   | { placeOutpost: { hex: string, card?: string } }
 *   | { placeToken: { hex: string, civ: string } }
 *   | { discardCiv: { civ: string } }
 *   | { darkAges: {} }
 *   | { socialism: {} }
 *   | { dictatorship: {} }
 *   | { revolution: {} }
 *   | { colonialism: {} }
 *   | { pleaForAid: {} }
 *   | { technocracy: {} }
 *   | { tradeEconomy: {} }
 *   | { coalBaron: {} }
 *   | { olympicHost: {} }
 *   | { astronomy: {} }
 *   | { cartography: {} }
 *   | { manifestDestiny: {} }
 *   | { statusQuo: {} }
 *   | { worldsFair: {} }
 *   | { create: {} }
 *   | { inspire: {} }
 *   | { broadcast: {} }
 *   | { refreshMasterpieces: { optional?: boolean } }
 *   | { streamingImplants: {} }
 *   | { flipMasterpiece: {} }
 *   | { politicalPosturing: {} }
 *   | { spymaster: {} }
 *   | { ageOfEnlightenment: {} }
 *   | { silkRoad: {} }
 *   | { infrastructureUpgrade: {} }
 *   | { plague: {} }
 *   | { granges: {} }
 *   | { collectOutpost: {} }
 *   | { charm: { card: string, side: 'left' | 'right' } }
 *   | { ability: { card: string, era: number } }} Effect
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
	'pay',
	'building',
	'landmark',
	'vp',
	'explore',
	'exploreSpace',
	'conquer',
	'research',
	'advance',
	'advanceEach',
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
	'placeToken',
	'discardCiv',
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
	'astronomy',
	'cartography',
	'manifestDestiny',
	'statusQuo',
	'worldsFair',
	'create',
	'inspire',
	'broadcast',
	'refreshMasterpieces',
	'streamingImplants',
	'flipMasterpiece',
	'politicalPosturing',
	'spymaster',
	'ageOfEnlightenment',
	'silkRoad',
	'infrastructureUpgrade',
	'plague',
	'granges',
	'collectOutpost',
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
	'incomeBuilding',
	'capitalRow',
	'capitalColumn',
]);
