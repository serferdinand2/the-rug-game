# Base game data (#12): design

Written 2026-10-24. This is the first rules-engine issue. It turns the base-game research into data modules that the engine, the server and the browser all share.

## 1. What and why

The engine (#13–#21) needs every printed thing in the base game as plain data: the tracks, the income mat, the capital mats, the map, the tiles, the landmarks, the achievements and the dice. With the data in one place, one effect resolver can run the whole game (CONVENTIONS, "Effects as data"), and the interface can read the same names and numbers.

The sources are `docs/research/01-base-core-rules.md` §1–§12 and appendices A–B, `02-base-content.md` §5–§8, and the README's rules conventions (R1–R24). Where the research left a value out, the Board Game Arena source (`elaskavaia/bga-tapestry`, `material.inc.php` and `modules/PGameXBody.php`) fills it, as R2 and R3 allow.

## 2. Goals

1. **Every base-game count is right**, and tests prove it: 48 track spaces, 24 income spaces, 6 capital mats with 22 impassable plots each, 61 and 34 map hexes with 25 and 13 printed territories, 48 territory tiles, 15 space tiles, 18 landmarks and 3 achievements.
2. **One small vocabulary of effects** that every later issue reads the same way.
3. **Plain, frozen, shared data.** Nothing imports the DOM, Svelte or Node, so the server and the browser both load it.

## 3. Non-goals

- Tech cards (#18), tapestry cards (#19), civilizations (#20) and anything from the expansions.
- Rules: what an effect does to the game state is #13–#17. This issue only names the effects.
- The optional variants, such as the neoprene board's Nanotechnology bonus (discard 2 tech cards instead of 3).

## 4. Where it lives

`src/lib/engine/data/`, one module per area:

| Module | Holds |
|---|---|
| `ids.js` | The version, track, resource, income-building and terrain ids, the versions' tiebreak chains, `deepFreeze` and the terrain-letter reader |
| `effects.js` | The effect typedefs and the list of effect kinds |
| `tracks.js` | The 4 tracks of 13 spaces each (start plus 12), the tier costs, each track's resource and income building, and `advanceCost()` |
| `income-mat.js` | The 4 income rows of 6 spaces each, and the 4 tapestry slots |
| `capitals.js` | The 6 capital mats, their start hexes, the small-map pairs and `impassablePlots()` |
| `maps.js` | Both map sides, the 29 printed territories, the hex sides and `hexNeighbours()` |
| `territory-tiles.js` | The 48 territory tiles |
| `space-tiles.js` | The 15 space tiles |
| `landmarks.js` | The 18 base landmarks and the height ranking of all 33 |
| `achievements.js` | The 3 achievements |
| `dice.js` | The science die and the two conquer dice |

The ids match the strings in `src/lib/ui.js` and `src/lib/art/catalog.js`, so the interface and the art can look things up by the same id. The engine never imports `ui.js`. Landmark footprints come from `src/lib/art/footprints.js` and are never copied. The capital grid size and plot numbering come from `src/lib/capital.js`.

## 5. Effects

An **effect** is an object with exactly one key, its kind. A **benefit** is a list of effects.

- The player takes a benefit's parts **in any order** (01 §3.1, step 4), unless the holder says `ordered: true`. Ordered means the reference prints "then", as in Navigation: "gain 1 territory tile, then explore".
- A **bonus** is `{ pay, gain }`: the player may pay `pay` once to get the effects in `gain`. Bonuses are always optional.
- A **cost** names resources to pay (`coin`, `worker`, `food`, `culture`, `any`), VP to pay (`vp`, which a player can't pay without having them: Guilds) or things to discard (`territory` tiles from the supply, `tapestry` cards from the hand, `tech` cards).

| Kind | Example | Meaning |
|---|---|---|
| `gain` | `{ gain: { food: 1, any: 2, territory: 1 } }` | Gain resources (`any` is one resource of the player's choice per point), territory tiles, space tiles (`space`) or tapestry cards (`tapestry`). With `keep`, the player keeps that many of the tapestry cards drawn and discards the rest (`chooseKeep`, the tapestry-draft variant, #53) |
| `lose` | `{ lose: { culture: 1, any: 1 } }` | Lose up to `culture` culture, as much as is held, then `any` resources of the player's choice, one at a time, among those held; nothing more when nothing is held (the Futurists' adjustment, #20 design §5) |
| `building` | `{ building: 'farm' }` | Take the leftmost income building of that type from the income mat and place it in the capital city |
| `landmark` | `{ landmark: 'bakery' }` | Place that landmark in the capital city (the square of a landmark tech card) |
| `vp` | `{ vp: 5 }` | Gain that many VP |
| `vp` (per) | `{ vp: { per: 'territory' } }` | Gain 1 VP (or `each`) per thing counted. The counters are listed below |
| `explore` | `{ explore: { anywhere: true } }` | Explore with a territory tile from the supply; `anywhere` drops the adjacency rule (Airplanes). `tile` allows only that tile (Coal Baron). `sailed` marks an explore that Age of Sail has already drawn its 3 tiles for |
| `exploreSpace` | `{ exploreSpace: { fromGained: true } }` | Explore a space tile from the supply. `fromGained` limits it to the tiles this benefit just gained (Interstellar Travel, R105) |
| `conquer` | `{ conquer: { bothDice: 'ifOpponent' } }` | Conquer. `anywhere` drops adjacency (Warplanes). `bothDice` gives both dice `'always'` (Mechs) or `'ifOpponent'` controlled the territory (Tanks, R17) |
| `research` | `{ research: { noBenefit: true } }` | Roll the science die and you may advance on that track. `noBenefit` is the X: no benefit or bonus. Alien Biology adds `rolls: 4` and `offTrackVp: 5` |
| `advance` | `{ advance: { tracks: ['science'] } }` | Advance 1 space on one of the listed tracks, with its benefit and optional bonus; `noBenefit` is the X (Clocks). `optional` lets the player decline (Oil Magnate). `freeBonus` offers the bonus of the space reached without paying, unless that space was already activated this turn (Renaissance, R19). `noBonus` gives the benefit without the bonus (Leaders). `offTrackVp` gives that many VP instead when every token on the listed tracks is on space 12 (Alchemists) |
| `regress` | `{ regress: { tracks: ['technology', 'military'] } }` | Go back 1 space on one of the listed tracks, then gain that space's benefit and optional bonus; `noBenefit` is the X (Time Travel) |
| `repeat` | `{ repeat: {} }` | Gain the benefit of your current space on any track, and you may pay its bonus (Academic Research); `oncePerTurn` limits it to once a turn (Lithium-Ion Battery, FAQ #6) |
| `invent` | `{ invent: { count: 2, refresh: true } }` | Gain tech cards, one at a time. `refresh`: you may first replace the 3 face-up cards. `faceUpOnly` and `deckOnly` limit where the card comes from (Steam Tycoon and its neighbours). `thenUpgrade` upgrades the card just invented (Steam Tycoon, Technocracy) |
| `upgrade` | `{ upgrade: {} }` | Upgrade 1 tech card |
| `techBenefit` | `{ techBenefit: { icon: 'circle' } }` | Gain the circle benefit of a tech card in your middle row, or the square benefit of one in your top row, without moving it |
| `tapestryOnTop` | `{ tapestryOnTop: {} }` | Play a tapestry card from your hand on top of your current tapestry; only the new card is active. With an empty hand or no current era, nothing is played (FAQ #10, R25) |
| `scoreCapital` | `{ scoreCapital: {} }` | Score the capital city: 1 VP per complete row and per complete column on a basic mat. It is its own kind because the expansion mats score differently (R51) |
| `tileBenefit` | `{ tileBenefit: {} }` | Gain the benefit printed on the territory tile just conquered; a printed territory gives nothing (R8) |
| `gainCiv` | `{ gainCiv: {} }` | Gain a random additional civilization: the top of the deck, which is rebuilt from the discards when empty, except the civilization discarded last. It joins the player's others and its mid-game setup runs. With nothing to draw, nothing is gained (Mechs, Radio; #20 design §5) |
| `restartToken` | `{ restartToken: {} }` | Take your token off this track and put it on the start of any track; this track still counts as complete (AI Singularity) |
| `choice` | `{ choice: [[{ explore: {} }], [{ building: 'farm' }]] }` | Choose exactly one of the options. Each option is a list of effects |
| `eraPartner` | `{ eraPartner: { track: true } }` | Choose the opponent the active THIS ERA ability names, and with `track` a track too (Alliance, Marriage of State) |
| `copyTapestry` | `{ copyTapestry: {} }` | Copy the ability of a tapestry card anyone can see: the top card of any slot, not face down and not Espionage (Espionage) |
| `sharedAdvance` | `{ sharedAdvance: { track: 'roll', others: 'opponents' } }` | Advance on a track rolled on the science die (`'roll'`) or chosen among those where you have a token (`'choose'`), with its benefit and optional bonus. Then the `'opponents'` (clockwise) or the `'neighbours'` (right, then left) advance on it without either. `optional` lets each player decline (Age of Discovery, Oil Magnate) |
| `others` | `{ others: { who: 'all', effects: [{ gain: { any: 1 } }] } }` | Each listed player runs `effects` as their own operation, so a finished player is skipped: `'neighbours'` right then left, or `'all'` from you clockwise, you first (Coal Baron, Diplomacy, Steam Tycoon) |
| `trade` | `{ trade: { offers: [{ pay: { vp: 5 }, gain: [{ gain: { any: 1 } }] }] } }` | Pay one offer's cost for its gain. With nothing affordable, nothing. `optional` lets the player decline; `host` is the seat hosting the trade (Guilds, Olympic Host) |
| `discardTapestry` | `{ discardTapestry: { vpEach: 2 } }` | Discard any number of tapestry cards from your hand, one at a time, for `vpEach` VP each (Democracy) |
| `anyBuilding` | `{ anyBuilding: {} }` | Gain one income building of your choice, among the types still on your income mat (Diplomacy, Olympic Host) |
| `trackLandmark` | `{ trackLandmark: {} }` | Gain any track landmark nobody owns, and place it (Dystopia) |
| `landmarkRank` | `{ landmarkRank: { fewest, most, otherwise } }` | Compare the landmarks you own with every opponent's: fewer than all runs `fewest`, more than all runs `most`, anything else runs `otherwise` (Age of Wonders) |
| `placeOutpost` | `{ placeOutpost: { hex: '0_1' } }` | Put an outpost from your supply on that hex, upright. Not a conquest (Militarism) |
| `placeToken` | `{ placeToken: { hex: '0_1', civ: 'isolationists' } }` | Put one of that civilization's tokens from its mat on that hex. It is an item, so a second item stops conquests, but it gives no control (R33; Isolationists, Traders) |
| `darkAges`, `socialism`, `dictatorship`, `revolution`, `colonialism`, `pleaForAid`, `technocracy`, `tradeEconomy`, `coalBaron`, `olympicHost` | `{ socialism: {} }` | The rules of the tapestry card of that name, which are too particular to share (design 2026-10-25, §8) |

**VP counters** (`vp: { per }`):

| Counter | Counts |
|---|---|
| `territory` | Territories you control on the map |
| `territoryTile` | Territory tiles in your supply |
| `techCard` | Your tech cards, in every row |
| `tapestryCard` | Tapestry cards in your hand and on your income mat, covered ones included (BGA counts both, for Anti-Aircraft Defense and space tile 4) |
| `trackSpace` | Spaces you have advanced on `track` |
| `trackLead` | Tracks where no other seat's token is further ahead than your best one, ties included (Boast of Superiority) |
| `landmark` | Landmarks you own, in the capital city, beside the mat or on the map (R71: Feudalism, the Nomads) |
| `opponent` | The other seats (Technocracy) |
| `market`, `house`, `farm`, `armory` | Income buildings of that type you own, beside the mat too (01 §6.1) |

## 6. The data

- **Tracks.** `TRACKS.exploration[4]` is Navigation: index 0 is the start and indexes 1–12 are the spaces. Each space has `id`, `space`, `name`, `tier`, `benefit`, `ordered`, `bonus` (or `null`) and `landmark` (a slug or `null`). The landmark sits on spaces 4, 7 and 10. `TIER_COSTS` uses `track` for the track's own resource. `advanceCost(track, space)` turns it into real resources, so Ships costs `{ food: 1, any: 1 }`.
- **Income mat.** `INCOME_MAT.market[1]` is Currency, the row's space 2. Each space keeps its income icons (`income`, step 4 of income turns 1–4) apart from its VP icons (`score`, step 3 of income turns 2–5). The six R18 spaces (Currency, Banking, Farming, Breeding, Writing and Telephone) have `prerequisite: true`. `TAPESTRY_SLOTS` holds Maker of Fire in era 1 and the first-of-your-neighbours bonus of 1, 2 or 3 any resources in eras 2–4.
- **Capital mats.** The 6 grids as printed in 01 §6.2, rows top first, `1` impassable and `0` open, with the R1 names and the catalog slugs. Each mat names its start hex on both maps (01 §2.3). `SMALL_MAP_PAIRS` is {1, 6}, {2, 4} and {3, 5}.
- **Maps.** Hexes use the BGA axial keys `a_b` (R2, R3). Each side lists every hex and its printed territories. A printed territory has its BGA tile id (49–77), its turn `orient` (clockwise, in 60° steps), its 6 corner terrains clockwise from the top-left before turning, and the terrains of an island in its middle. `0_0` is the middle island. The small map reuses tile ids from the large map, and a tile id always has the same corners. The orientations are BGA's: every small-map hex is turned 0 except `0_3`, which is turned 2.
- **Hex sides.** `HEX_SIDES[i]` is the neighbour that side *i* faces, where side *i* runs from corner *i* to corner *i + 1*. The research has no side-to-neighbour mapping, so it is read from BGA's `getMatchingEdgeCount`. A tile turned by `orient` shows its printed corner *k* at position *k + orient*. #17 uses this for explore scoring.
- **Territory tiles.** The 48 tiles of 01 Appendix B, with corners, island and benefit. The benefit counts match R4.
- **Space tiles.** The 15 tiles of 01 §7.2. Each has `id`, `benefit` and `ordered`. Tile 11 is "conquer, then 1 VP per territory you control" in both versions (R5), so it is the only ordered one.
- **Landmarks.** The 18 base landmarks, each with its source: a track tier and space, or the tech card of the same name. `HEIGHT_RANKING` is R12's list of all 33 landmarks, tallest first. It is one decided list, so it isn't split by expansion.
- **Achievements.** The 3 achievements, with their VP boxes, highest first, on each map side (R24). The VP are gained as the token goes down (R23).
- **Dice.** The science die has each track on 3 of its 12 faces (R6). The red die is 4, 5, 6 and 7 VP and twice 1 VP per territory (R7). The black die is coin, worker, food, culture and twice the tile benefit (R8).

## 7. Versions

The two versions are `'original'` (the 2019 printing) and `'current'` (the current official rules). R1 and R5 make the base board data the same in both, so nothing here is split by version. What does differ is the tiebreak: `VERSIONS` holds each version's chain (R10, R11), and only the current chain uses the height ranking. A test says so.

## 8. Calls left to the engine

- How an "any order" benefit asks the player for the order. The data only says which benefits are ordered.
- The re-activation limit (one activation of a track space per turn), the repeat-icon limit and the track end (R19, 01 §3.1).
