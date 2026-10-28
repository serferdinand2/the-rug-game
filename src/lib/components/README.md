# Components

The interface components, built from the phase-one mockups in `docs/ui/`. Every one of them is shown in all its states on the component library page, `/components.html` (#48). Run `npm run dev` and open <http://127.0.0.1:5173/components.html>.

The same page has an **Art** area: every scene part and every asset in the catalog, drawn or still to draw, drawn live from the art toolkit.

Add a row here, and a section in `src/library/sections/<area>/<Name>.svelte`, in the same change that adds a component. `tests/library.test.mjs` checks the section and the structure rules in [docs/conventions.md](../../../docs/conventions.md).

## Boundaries

- Components are presentational. They render the props they get and report what the player did through `on{Component}{Action}` callbacks, which receive a `ComponentEvent`. They never hold game state, call the server, decide a rule or roll anything random. The screen that owns the game state does that.
- Geometry worth testing lives in plain modules beside this folder: `../ui.js` (ids and token helpers), `../capital.js` (the capital grid), `../placement.js` (placing landmarks), `../track-shape.js` (track spaces and progress lanes) and `../hexmap.js` (the World Map's hexes, terrain wedges, pieces and fit).
- Styles live in the component, use only the tokens in `src/styles/tokens.css`, and style only the component's own `rg-{name}` classes.

## Approved issue #5 artwork

`ResourceIcon` now uses all five resource SVGs, which also updates `ResourceChip`, `CostBox` and `TierPrice`. `CapitalGrid` composes terrain tile SVGs from its supplied biome, visual seed and plot mask, and overlays the four income-building SVGs. `ProgressLanes` uses each seat's token SVG, and track headings use their track symbol. The Art area includes the full approved set, all player colors, 84 terrain variants and six explicitly labeled example mats. Dice faces, terrain hex markers and game symbols show the owner-approved text/later explanation.

## Remaining placeholders

These components are updated as the art issues deliver their assets. Each will show its asset by its stable catalog id (`artUrl(id)` in `../ui.js`), and its library section shows the result.

| Placeholder now | Component(s) | Asset ids | Art issue |
|---|---|---|---|
| Flat terrain colours | The World Map icon in `BoardSwitcher` | `terrain/*` | #5 |
| Civilization names only | `PlayerChip`, `PlayerCard`, `SeatCard`, `CivChooser` | `civ/*` | #8 |
| Expansion capital terrain | `CapitalGrid` | `capital-terrain/<advanced biome>-*` are drawn (#6); `CapitalGrid` draws the base biomes only until #36 adds the advanced mats | #36 |

`LandmarkPiece` already shows the drawn landmarks (`landmark/*`, #7). `WorldMap` and `TerritoryTile` compose their hexes from the terrain pictures (`hex/*`, #6).

## ui/

| Component | Purpose |
|---|---|
| `Badge` | Expansion tags tinted with their colour, and the YOU, HOST and READY capitals. |
| `Button` | Every button: `primary`, `secondary`, `gold`, `confirm` (a decision panel's solid gold Confirm, #65), `success` or `danger`, in three sizes, with a `selected` toggle state. |
| `Divider` | A thin rule, optionally paused by a short italic label such as "or join friends". |
| `IconButton` | The 36px header controls (sound, history, log, menu, close), with the red mute slash. |
| `Menu` | The header popover: entries as links or buttons, arrow keys and Escape. |
| `Panel` | A chrome panel with a thin border and an optional heading. |
| `PassScreen` | The hot-seat pass screen (#30): the next player's token, name and reason, their clock when the table has a timer, and I'm …, which answers after a short wait. |
| `ResourceIcon` | The five resource symbols at 16px, native 24px or native 48px, shared by prices, chips and footer costs. The native assets are 24×24 and 48×48; 16px display scales the 24px SVG. The 32px source is deprecated and archived. |
| `Segmented` | A row of pressed/unpressed choices, single or multiple, tinted or filled, and disabled for a player who can't change them. |
| `Tabs` | The right panel's tabs, with a count, roving focus and arrow keys; `--rg-tabs-padding` and `--rg-tabs-gap` tighten the row, and a row wider than its place scrolls, fades at a cut edge and keeps the selected tab in view (#64). |
| `TextInput` | Labelled text fields with a hint and a validation message, and the small gold read-only code. |
| `Toast` | A short status message at the bottom of the screen. |
| `TopBar` | The 58px header: brand, centre content and controls. Player chips go straight into the centre, so they shrink to fit a narrow header. |
| `TurnClock` | The header's turn clock: a player colour mark and the time left, paused muted, red with the seconds in words when low. |

## board/

| Component | Purpose |
|---|---|
| `AchievementStrip` | The three achievements on one line: claimants' colour squares in order and the next VP. |
| `BoardSwitcher` | Advancement Tracks / World Map selector with its icons. |
| `ProgressLanes` | One progress line per player under a track, with the dashed preview to the next space; a line grows to its new space (#29). |
| `TierPrice` | A tier's numeral and price over its three spaces; gold while one of them is hovered. |
| `Track` | One track: name, four tier prices, twelve spaces (each with its benefit and bonus) and the lanes. |
| `TrackBoard` | The four tracks stacked, with one selected space across them; a size container, so the spaces grow up to 1.25 times as tall as wide when the board has the height (#59). |
| `TrackSpace` | One pointed space: name, its `benefit` and `bonus` as symbols from `src/lib/glyphs.js` (resources, buildings and tracks as art, the other game symbols as short words, the X as a red cross), its `words` as tooltip and label, landmark, number, first/last shapes, selected and focus outlines; a short space draws its symbols smaller (#59). |
| `WorldMap` | The real board's hex grid from `mapHexes(view)`: corner terrains as wedges, islands, unexplored hexes dashed, outposts (toppled ones lying), Nomads pieces and tokens; `targets` become buttons and the rest dim, `selected` is outlined in gold; a `fresh` hex pulses gold twice (#29); `scores` puts a gold "+N VP" tag on target hexes (#74). |
| `Die` | One die as the dice tray rolls it (#61): its style C body (a cream d12, a red or a black d6) with the rolled face on top: the track's symbol, VP in words, a resource icon or ? for the tile's benefit; it tumbles while `rolling`, not with reduced motion. |
| `DiceTray` | A roll over the middle of the screen for the whole table (#61): a new `batch` plays its rolls one after another (a tumble of about a second, the faces held, then a fade) under each roll's caption; a click or Escape ends it, it takes no focus, and a live region reads each result once. Its `panel` says what the game has open (#79): over a decision panel it rolls at the top of the board, over a stack of cards over the player area. |

## player/

| Component | Purpose |
|---|---|
| `CapitalGrid` | The 9×9 capital: each plot's ground tile, the mat's relief drawn over its impassable plots where the biome has one, with a building on a printed impassable plot clearing it, and Architects' cubes (#82); districts, completion overlays, placed landmarks (a locked one may hang over the edge, R106, and `room` keeps space for it) and their drag, keyboard and drop handling, and a decision's lit `targets` (green-outlined plot buttons) with a faint `preview` of the chosen building; a `fresh` plot glows once (#29). |
| `CompletionCounters` | Completed rows, columns and districts; hover or focus previews, a press keeps them shown. |
| `LandmarkPiece` | A landmark's picture in its footprint's shape, in the tray or on the grid, with rotate, confirm and return. |
| `PlacementTray` | The To be placed tray: select, drag or arrow a landmark onto the grid, or drop one back. |
| `EraSlots` | The four era slots: printed Maker of Fire, then each top tapestry card, "Face-down card" or "Not yet chosen"; the active era is outlined and a card can be chosen (#27). |
| `IncomeMat` | The income mat: four building rows of six spaces, covered ones showing the building, exposed ones their name and reward in words (#27). |
| `PlayerCard` | A player's overview card, with the selectable Civilization, Capital and Tech rows. |
| `PlayerChip` | A header chip: colour, name, civilization, VP, the current player's glow and the overview's filled state. 210px wide, shrinking to 120px; below 190px it drops the civilization name. `bump` pops the VP once when it rises (#29). |
| `ResourceChip` | A resource symbol and its count. |
| `SelfSummary` | Your overview at the foot of the player area: name, era, VP, hand, tech, territory and capital-line counts, and the four resources (#26). `changed` draws gold the counts a prompt's choices so far change (#75). |

## prompts/

| Component | Purpose |
|---|---|
| `CostBox` | The footer's price: a Cost label and the symbols joined by plus signs, read out in words. |
| `CardShelf` | The cards a decision offers (tapestry, tech with the deck, civilizations, capital mats) as pressable buttons in a row that scrolls when too wide; more than four tapestry cards fan out; the chosen one is outlined in gold (tapestry and tech cards also lift), hover and focus report it for a full view (#28). Civilization cards are whole, 425 px wide at their own height, scaled down only as far as the shelf's height needs and never below 0.75; capital mats are their 9×9 `CapitalGrid`, 380 px, with the table's `terrainSeed`; each sizes its own button, so the outline fits it (#56–#58). Several can be chosen at once, with `disabled` cards waiting, for a payment of cards (#75). Civilization cards fit the `room` the decision panel leaves the shelf (#79). |
| `DecisionOption` | One choice in a decision prompt: words, optional resource symbols, `art` pictures above the words, a gold `+n VP` badge, gold while chosen (#26, #28). |
| `DecisionPanel` | The decision prompt over the shared area: scrim, and at the tracks' centre one column of an optional card shelf and the panel, with its question, content, status and Confirm (a `Button`, solid gold as the play mockup draws it, #65; #79). The shelf snippet gets the room left above the panel, which its cards fit (#57). Without content the status line carries the instruction; a `track` tint, the gold `income` tone with a `steps` snippet, and `docked` beside the map with no scrim, its content scrolling so Confirm stays in sight; a `pinned` snippet stays in sight between the content and the actions, and a docked panel leaves out an empty status line (#26, #28, #74). `narrow` makes it 440 px, for a pick of several resources, cards or tiles (#75). |
| `IncomeNotice` | The one-time notice after income turn 1: the gold, narrow income panel at the tracks' centre, saying the game took the turn, what the player starts with (resource chips and words) and what every later turn offers; Got it or Escape closes it (#77). |
| `IncomeSteps` | The strip of an income turn's steps, the running one marked `aria-current="step"` (#28). |
| `PromptArt` | One picture a prompt shows: a resource with its count, track, building, landmark, terrain, civilization, space tile, turned territory, capital mat, card art, VP badge or the tech deck (#28). |
| `TilePicker` | The territory tiles in hand as a wrapping row of pressable hexes (about 88×80 px); the picked one is outlined in gold, and a corner tag shows the VP each scores on the chosen hex (#74). Several can be picked at once, with `disabled` tiles waiting, for a payment of tiles (#75). |
| `ResourceRows` | One row per resource to choose, as Board Game Arena's boxes, stacked (#75): the row's number, the four resources at 48 px with the count the player would hold, and the name picked; a cost's own resource is a fixed row; a resource no legal answer allows is off, with the reason as its title. |
| `TurnControl` | The ↺ and ↻ buttons that turn the picked tile, with a gold `+n VP` tag between them (`No hex yet` and disabled until a hex is chosen) and the hint that . and , turn it (#74, #83). |
| `OverviewCloseBar` | The footer while the players overview is open. |
| `TurnBar` | The footer: neutral, selected, optional-action, waiting and gold income states, with the income reveal; a turn with only income to take puts a gold Take income in its actions (#77). |

## lobby/

| Component | Purpose |
|---|---|
| `CivChooser` | Civilization tiles and Random, bordered in the edited player's colour. |
| `OpenTableRow` | One open table on the launch page: Join, code, seat boxes, rules and expansion. |
| `SeatCard` | A lobby seat: empty (Open seat), open (Take the seat!), add (a name field for a hot-seat player) or a joined player, with or without the civilization line. Add bot is shelved. |
| `SettingRow` | A setting's title, a thin rule and its choices on one line. |
| `TableCode` | The read-only table code with COPY. |

## log/

| Component | Purpose |
|---|---|
| `TableLog` | The table's log (#29): oldest first with the newest kept in view, a rule in the player's colour between turns, each entry marked with its player's colour; income turns gold, notices italic. |
| `ScoreBoard` | The scores during play (#29): the players by VP, the viewer marked, each with VP by source and the tiebreak values of the table's rules. |

## results/

| Component | Purpose |
|---|---|
| `StandingRow` | One player in the final standings, as Lazar's end screen (#29): place, token, name, civilization and VP; winners gold, the viewer's bar in their colour; the name opens where the VP came from. |
| `TieSteps` | How a tie was decided (#29, owner #15): who tied, each step of the rules' chain with every value (landmarks in gold), whether it separated them, and the outcome. |

## Reviewed card system (Refs #47)

The owner decisions are in [card-design-rules.md](../../../docs/ui/card-design-rules.md). All components below have library sections under **Player**. The single-page review uses these same components.

| Component | Responsibility |
|---|---|
| `player/CardFrame` | 425 px frame, title, full portrait, main effect and footer metadata |
| `player/CivilizationCard` | Eighteen recipes, every base civilization among them (the Futurists, Heralds, Nomads and The Chosen await review), with empty/in-play example states; any other civilization shows its frame, portrait and name only |
| `player/TechnologyCard` | Horizontal 425 px technology frame with full artwork, square/circle effects, conditions and edition badge; a reviewed fixture by `id`, or a real card by `data` from `techCardData()` (`src/lib/cards/game-cards.js`) |
| `player/TapestryCard` | 319 px tapestry frame with timing beside the portrait, including the red Trap variant; a reviewed fixture by `id`, or a real card by `data` from `tapestryCardData()` |
| `player/ScaledTapestryCard` | A whole `TapestryCard` shown smaller, keeping its measured height: 0.7 on the choice shelf, 0.6 for the current era, 0.42 in the hand |
| `player/LandmarkCard` | 319 px landmark frame with the capital footprint beside the art, the end-of-turn condition (Rules text pending until game data supplies it) and the edition footer |
| `player/MasterpieceCard` | 319 px Arts & Architecture masterpiece frame: a centered beige effect box (the caller's `effects` snippet) beside the 144 px artwork |
| `player/TerritoryTile` | One small flat-topped territory tile in hand, drawn like the World Map's, with its number |
| `player/CardFan` | Overlapping cards; hover or focus raises one and reports it for a full view |
| `player/CardResource` | Native 24 px inline icon without changing row spacing |
| `player/PlayerToken` | Five supplied shaded 32 px colour variants |
| `player/CardSlot` | Compact, large or prediction square, never larger than 75 px |
| `player/CardEffectBox` | Beige trigger/scoring row |
| `player/CardClarity` | Supporting rules beneath the relevant layout |
| `player/CardPlacementRows` | Collection, covered rewards, track and history rows |
| `player/CardRewardColumns` | Bottom-aligned square/benefit pairs or upward tracks |
| `player/CardPathGrid` | Connected reward-path composition |
| `player/CardPredictionTracks` | Number-target categories and separators |
| `player/CardTerrainRewards` | Actual terrain marker, label and benefit rows |
| `player/CardTokenReserve` | Compact starting-token squares with used counts |
| `player/CardScoreLadder` | Horizontal Atkinson `X VP` rewards and collection counts |
| `player/CardTechnologyTransfer` | Explicit owner/row transition schematic |
