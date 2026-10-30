# Components

The interface components, built from the phase-one mockups in `docs/ui/`. Every one of them is shown in all its states on the component library page, `/components.html` (#48). Run `npm run dev` and open <http://127.0.0.1:5173/components.html>.

The same page has an **Art** area: every scene part and every asset in the catalog, drawn or still to draw, drawn live from the art toolkit as each tile comes into view.

Add a row here, and a section in `src/library/sections/<area>/<Name>.svelte`, in the same change that adds a component. `tests/library.test.mjs` checks the section and the structure rules in [docs/conventions.md](../../../docs/conventions.md).

## Boundaries

- Components are presentational. They render the props they get and report what the player did through `on{Component}{Action}` callbacks, which receive a `ComponentEvent`. They never hold game state, call the server, decide a rule or roll anything random. The screen that owns the game state does that.
- Geometry worth testing lives in plain modules beside this folder: `../ui.js` (ids and token helpers), `../capital.js` (the capital grid), `../placement.js` (placing landmarks), `../track-shape.js` (track spaces and progress lanes), `../board-icons.js` (the board switcher's icons) and `../hexmap.js` (the World Map's hexes, terrain wedges, pieces and fit, and `mapView`, what it draws on each hex, #114).
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

`LandmarkPiece` already shows the drawn landmarks (`landmark/*`, #7). `WorldMap` and `TerritoryTile` paint their territories at runtime with `src/lib/art/paint/` (#134, an owner exception to referencing art by id); the unexplored hexes keep `hex/unexplored`.

## ui/

| Component | Purpose |
|---|---|
| `Badge` | Expansion tags tinted with their colour, and the YOU, HOST and READY capitals. |
| `Button` | Every button: `primary`, `secondary`, `gold`, `confirm` (a decision panel's solid gold Confirm, #65), `success` or `danger`, in three sizes, with a `selected` toggle state; `aria-disabled` dims it as `disabled` does but keeps it clickable (#97). |
| `Dialog` | A dialog over a scrim, `narrow` or `wide`: a title, the content and Close or its own `actions`. Escape, Close and the backdrop close it; it takes the focus and gives it back. Modal, it covers the screen and keeps Tab inside; with `modal={false}`, it covers its positioned parent only, as Table settings over the board (#87). |
| `Divider` | A thin rule, optionally paused by a short italic label such as "or join friends". |
| `IconButton` | The 36px header controls (sound, history, log, menu, close), with the red mute slash. |
| `Menu` | The header popover: entries as links or buttons, arrow keys and Escape. |
| `Panel` | A chrome panel with a thin border and an optional heading, in the body font or, with `titleFont="title"`, Cinzel (#97). |
| `PlayLayout` | The play screen's frame, shared by the game and results screens (#105): the `header` and `footer` bars and, between them, the 3/4 `shared` area and the 1/4 `player` area on the pixel texture, with `overlays` positioned over the middle; `sharedLabel`, `playerLabel` and `areasInert` (the HTML `inert`) go on the two areas. |
| `PassScreen` | The hot-seat pass screen (#30): the next player's token, name and reason, their clock when the table has a timer, and I'm …, which answers after a short wait. |
| `ResourceIcon` | The five resource symbols at 16px, native 24px or native 48px, shared by prices, chips and footer costs. The native assets are 24×24 and 48×48; 16px display scales the 24px SVG. The 32px source is deprecated and archived. |
| `CardSymbol` | The approved 24px technology, tapestry and civilization card pictograms, traced from the owner's PNGs. Used by advancement spaces and shown separately in the library. |
| `Segmented` | A row of pressed/unpressed choices, single or multiple, tinted or filled, and disabled for a player who can't change them. |
| `Tabs` | The right panel's tabs, with a count, roving focus and arrow keys; `--rg-tabs-padding` and `--rg-tabs-gap` tighten the row, and a row wider than its place scrolls, fades at a cut edge and keeps the selected tab in view (#64). It draws the selected tab's panel from its children, laid out through `panelClass`, starts every id with its own prefix (`idPrefix`, by default `$props.id()`), and with `autofocus` gives the selected tab the focus as it is drawn (#91). |
| `TextInput` | Labelled text fields with a hint and a validation message, the small gold read-only code that `TableCode` draws (`onTextInputFocus` lets it select itself), and `SeatCard`'s small name field, which fills its frame with `block`. |
| `Toast` | A short status message at the bottom of the screen. |
| `Tooltip` | Every title on the page in one large chrome box with an arrow, instead of the browser's small tooltip: mounted once at the root, it shows on hover or keyboard focus after 250 ms, sits above its element or below near the top, and stays in the window. `placement="inline"` shows a given `text` in place, as on the library page. |
| `TopBar` | The 58px header: brand, centre content and controls. Player chips go straight into the centre, so they shrink to fit a narrow header. |
| `TurnClock` | The header's turn clock: a player colour mark and the time left, paused muted, red with the seconds in words when low; titled with its player's `name`, as "Vera: 1:42" (#89). |

## board/

| Component | Purpose |
|---|---|
| `AchievementStrip` | The three achievements on one line: claimants' colour squares in order and the next VP. |
| `BoardSwitcher` | Advancement Tracks / World Map selector with its icons; the tracks icon has a band for every track it is given (#120). |
| `ProgressLanes` | One progress line per player under a track, with the dashed preview to the next space; a line grows to its new space (#29). |
| `TierPrice` | A tier's numeral and price over its three spaces; gold while one of them is hovered. |
| `Track` | One track: name, four tier prices, twelve spaces (each with its benefit and bonus) and the lanes. |
| `TrackBoard` | The tracks stacked, four or five (#120), with one selected space across them; each takes an equal share of the height less its chrome (the `--track-heading` and `--track-prices` rows, gaps and lanes); a size container, so the spaces grow up to 1.25 times as tall as wide when the board has the height (#59). |
| `TrackSpace` | One pointed space with the #85 layout: name and number on top, centered symbolic benefit, optional track-coloured translucent band below, and landmark icon and name at the bottom. The component handles first/last geometry (`Track` sets `last`, #120; one `--rg-track-space-shape` for the shell and fill), track-specific benefit groups, selected and focus states, and a full words tooltip and label; `SpaceGlyphs` draws the symbols. |
| `SpaceGlyphs` | A track space's symbols in a row (#115): resources, buildings and tracks as their art, the game symbols as their shapes or short words, the red X, VP and the joints. Its root is `display: contents`, so the glyphs lay out in the place they are drawn; `variant` draws a dense benefit's or a bonus rule's smaller pictures, and its container steps answer to the `TrackSpace` around it. Text size comes from `--rg-space-glyphs-text`, the VP cup from `--rg-vp-cup-size`. |
| `ExplorationFace` | The approved twelve Exploration face layouts. It composes the hex, exploration, resource, score and operator symbols; keeps the optional band and landmark in their shared vertical positions. `TrackSpace` uses it for Exploration, and its gallery section shows representative states. |
| `TerritoryArt` | A territory's face round the origin (#113): a terrain picture per corner wedge, the coasts, the island's parts outlined, and the cloud and volcano (R77), from `territoryShapes()`. Since #134 no game screen draws with it: `WorldMap` and `TerritoryTile` paint their territories. |
| `TerritoryClips` | The clip outlines `TerritoryArt` is cut with (#113), from `territoryClips()`: one set per svg and size, ids starting with its `prefix`. |
| `WorldMap` | The real board's hex grid from `mapHexes(view)`: the explored territories painted as one 2.5D picture (#134), each run of one terrain across hexes one mass, under faint hex edges; a preview tile painted on its own; unexplored hexes dashed, outposts (toppled ones lying), Nomads pieces and tokens; `targets` become buttons and the rest dim, `selected` is outlined in gold; a `fresh` hex pulses gold twice (#29); `scores` puts a gold "+N VP" tag on target hexes (#74). What each hex shows comes from `mapView()` in `hexmap.js` (#114). |
| `Die` | One die as the dice tray rolls it (#61): its style C body (a cream d12, a red or a black d6) with the rolled face on top: the track's symbol, VP in words, a resource icon or ? for the tile's benefit; it tumbles while `rolling`, not with reduced motion. |
| `DiceTray` | A roll over the middle of the screen for the whole table (#61): a new `batch` plays its rolls one after another (a tumble of about a second, the faces held, then a fade) under each roll's caption; a click or Escape ends it, it takes no focus, and a live region reads each result once. Its `panel` says what the game has open (#79): over a decision panel it rolls at the top of the board, over a stack of cards over the player area. |

## player/

| Component | Purpose |
|---|---|
| `CapitalGrid` | The 9×9 capital: each plot's ground tile, the mat's relief drawn over its impassable plots where the biome has one, with a building on a printed impassable plot clearing it, and Architects' cubes (#82); districts, completion overlays, placed landmarks (a locked one may hang over the edge, R106, and `room` keeps space for it) and their drag, keyboard and drop handling, and a decision's lit `targets` (green-outlined plot buttons) with a faint `preview` of the chosen building; a `fresh` plot glows once (#29). |
| `CompletionCounters` | Completed rows, columns and districts; hover or focus previews, a press keeps them shown. |
| `LandmarkPiece` | A landmark's picture in its footprint's shape, in the tray or on the grid, with rotate, confirm and return. It sets its own drag data and drag image and reports `{ id, grab }` (`grabAt`, `writeGrab` and `readGrab` in `placement.js`), answers its keys from `src/lib/landmark-keys.js`, whose keys How to play lists, and exports `focus()` (#111). |
| `PlacementTray` | The To be placed tray: select, drag or arrow a landmark onto the grid, or drop one back. |
| `EraSlots` | The four era slots: printed Maker of Fire, then each top tapestry card, "Face-down card" or "Not yet chosen"; the active era is outlined and a card can be chosen (#27). |
| `IncomeMat` | The income mat: four building rows of six spaces, covered ones showing the building, exposed ones their name and reward in words (#27). |
| `PlayerCard` | A player's overview card, with the selectable Civilization, Capital and Tech rows; with `autofocus`, its first row takes the focus as it is drawn (#91). |
| `PlayerChip` | A header chip: colour, name, civilization, VP, the current player's glow and the overview's filled state. 210px wide, shrinking to 120px; below 190px it drops the civilization name. `bump` pops the VP once when it rises (#29). |
| `ResourceChip` | A resource symbol and its count; `size="medium"` draws the native 24px symbol and `changed` draws the count gold (#125). |
| `SelfSummary` | Your overview at the foot of the player area: name, era, VP, hand, tech, territory and capital-line counts, and the four resources as medium `ResourceChip`s (#26, #125). `changed` draws gold the counts a prompt's choices so far change (#75). |

## prompts/

| Component | Purpose |
|---|---|
| `CostBox` | The footer's price: a Cost label and the symbols joined by plus signs, read out in words. |
| `CardShelf` | The cards a decision offers (tapestry, tech with the deck, civilizations, capital mats) as pressable buttons in a row that scrolls when too wide, laid out by a `CardFan` in its shelf look, its cards in `ScaledCard` (#92); more than four tapestry cards fan out; the chosen one is outlined in gold (tapestry and tech cards also lift), hover and focus report it for a full view (#28). Civilization cards are whole, 425 px wide at their own height, scaled down only as far as the shelf's height needs and never below 0.75; capital mats are their 9×9 `CapitalGrid`, 380 px, with the table's `terrainSeed`; each sizes its own button, so the outline fits it (#56–#58). Several can be chosen at once, with `disabled` cards waiting, for a payment of cards (#75). Civilization cards fit the `room` the decision panel leaves the shelf (#79). |
| `DecisionOption` | One choice in a decision prompt: words, optional resource symbols, `art` pictures above the words, a gold `+n VP` badge, gold with a thick gold ring while chosen, dimmed and without hover while disabled (#26, #28, #116). |
| `DecisionPanel` | The decision prompt over the shared area: scrim, and at the tracks' centre one column of an optional card shelf and the panel, with its question, content, status and Confirm (a `Button`, solid gold as the play mockup draws it, #65; #79). The shelf snippet gets the room left above the panel, which its cards fit (#57). Without content the status line carries the instruction; a `track` tint, the gold `income` tone with a `steps` snippet, and `docked` beside the map with no scrim, its content scrolling so Confirm stays in sight; a `pinned` snippet stays in sight between the content and the actions, and a docked panel leaves out an empty status line (#26, #28, #74). `narrow` makes it 440 px, for a pick of several resources, cards or tiles (#75). |
| `IncomeReveal` | The footer's Take income beside the turn label, with what taking income does; `folded` closes it to nothing until its parent (TurnBar's label group) is hovered or holds the focus, and `disabled` keeps it closed and inert (#122). |
| `IncomeNotice` | The one-time notice after income turn 1: the gold, narrow income panel at the tracks' centre, saying the game took the turn, what the player starts with (resource chips and words) and what every later turn offers; Got it or Escape closes it (#77). |
| `IncomeSteps` | The strip of an income turn's steps, the running one marked `aria-current="step"` (#28). |
| `PromptArt` | One picture a prompt shows: a resource with its count, track, building, landmark, terrain, civilization, space tile, turned territory, capital mat (its relief), card art, a `+N VP` badge (`VpTag`) or the tech deck (#28, #116). |
| `TilePicker` | The territory tiles in hand as a wrapping row of pressable hexes (about 88×80 px); the picked one is outlined in gold, and a corner `+N VP` badge (`VpTag`) shows the VP each scores on the chosen hex (#74). Several can be picked at once, with `disabled` tiles waiting, for a payment of tiles (#75). `size="large"` draws the Terrain tab's tiles at their own size, only the `pickable` ones pressable, and `dataIdPrefix` keeps their hooks apart (#93). |
| `ResourceRows` | One row per resource to choose, as Board Game Arena's boxes, stacked (#75): the row's number, the four resources at 48 px with the count the player would hold, and the name picked; a cost's own resource is a fixed row; a resource no legal answer allows is off, with the reason as its title. |
| `TurnControl` | The ↺ and ↻ buttons that turn the picked tile, with a gold `+N VP` badge (`VpTag`) between them (`No hex yet` and disabled until a hex is chosen) and the hint that . and , turn it (#74, #83). |
| `VpTag` | The "+N VP" a choice scores, the one gold badge (owner, 2026-10-30): over its parent's top-right corner (`corner`, muted for a tile that scores nothing) or in its row (`inline`). `DecisionOption`, `TilePicker`, `TurnControl` and `PromptArt` draw it (#116). |
| `OverviewCloseBar` | The footer while the players overview is open. |
| `TurnBar` | The footer: neutral, selected, optional-action, waiting, gold income and finished-game (`complete`, on the results and the board review; #105) states; a `reveal` snippet, such as the `IncomeReveal`, sits before the turn label (#122); a turn with only income to take puts a gold Take income in its actions (#77). |

## lobby/

| Component | Purpose |
|---|---|
| `CivChooser` | Civilization tiles and Random, bordered in the edited player's colour. |
| `OpenTableRow` | One open table on the launch page: Join, code, seat boxes, rules and expansion. |
| `PlaySettings` | The turn timer and undo rows, the same in the lobby and in Table settings; its rows join the parent's layout, and a guest sees them disabled (#98). |
| `SeatCard` | A lobby seat: empty (Open seat), closed (an empty seat the viewer can't open, #98), add (a small `TextInput` and a small gold `Button` to name a hot-seat player) or a joined player, with or without the civilization line, which stays with `CivChooser` for a lobby civilization choice (owner, 2026-10-30); its label and badges come from `lobby.js` (#102). Add bot is shelved. |
| `SettingRow` | A setting's title, a thin rule and its choices on one line; `divided` draws a soft rule under it (#98). |
| `TableCode` | The read-only table code, a small `TextInput` that selects itself on focus, with COPY. |

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
| `player/CardFrame` | 425 px frame: a `CardBand` title, full portrait, main effect, and footer metadata with a `CardEdition` per edition; `bodyMinHeight` and `textLeading` for a short card's proportions, and `plain` for only the paper and its palette, as the library shows each card pattern (#106) |
| `player/CardBand` | The title band every card family shares (#109): the brown gradient over the paper noise, a gold Cinzel title at 28, 22 or 21 px, and the trap's red band |
| `player/CardEdition` | The edition chip at every card's foot (#109): the edition's name in its own card colour, base brown, Plans & Ploys green, Arts & Architecture purple or Fantasies & Futures teal |
| `player/CivilizationCard` | Eighteen recipes, every base civilization among them (the Futurists, Heralds, Nomads and The Chosen await review), with empty/in-play example states; any other civilization shows its frame, portrait and name only. The six card civilizations (Entertainers, Merrymakers, Leaders, Militants, Historians, Mystics) draw a seat's `live` state from `civCardView()` (`src/lib/civ-card.js`) in the play look, their tokens in the `seat`'s colour, and turn the spots its decision offers into buttons with the green available outline, the `selected` one gold, reporting `onCivilizationCardPick` with the spot id (#78) |
| `player/TechnologyCard` | Horizontal 425 px technology frame with full artwork, square/circle effects, conditions and edition badge; Svelte markup from the engine's data: `data` from `techCardData()` (`src/lib/cards/game-cards.js`), or an `id` (#108) |
| `player/TapestryCard` | 319 px tapestry frame with timing beside the portrait, including the red Trap variant; Svelte markup from the engine's data: `data` from `tapestryCardData()`, or an `id` (#108) |
| `player/ScaledCard` | Any card shown smaller, scaled as a whole at full layout, its box the scaled size; `width` and `height` come from `CARD_SIZES` (`src/lib/cards/card-sizes.js`), and a card without a `height` (tapestry, civilization) is measured, its height bindable as `measuredHeight`: tapestry cards at 0.7 on the shelf, 0.6 for the current era and 0.42 in the hand, tech cards at 0.65 on the shelf, 0.42 in the Tech tab and 0.4 in the players overview (#92) |
| `player/LandmarkCard` | 319 px landmark frame with the capital footprint beside the art, the end-of-turn condition (Rules text pending until game data supplies it) and the edition footer |
| `player/MasterpieceCard` | 319 px Arts & Architecture masterpiece frame: a centered beige effect box (the caller's `effects` snippet) beside the 144 px artwork |
| `player/TerritoryTile` | One small flat-topped territory tile in hand, painted at its turn as the World Map paints it (#134), with its number |
| `player/CardFan` | Overlapping cards; hover or focus raises one and reports it for a full view. `selected` takes one index or several, `disabled` cards wait, `labels` name them, `key` keeps a card's button when the items change; the `shelf` look is `CardShelf`'s, with gold outlines and the chosen card lifted unless `lift` is false (#92) |
| `player/CardResource` | Native 24 px inline icon without changing row spacing; `fine` for 11 px supporting text, and a container centres it with `--card-resource-center` and `--card-resource-height` instead of styling it (#106) |
| `player/PlayerToken` | A player's token, from its seat (#103) or one of the five supplied shaded 32 px colour variants |
| `player/CardSlot` | Compact, large or prediction square, never larger than 75 px, `filled` with the 2 px border in the player's colour (#106); `pickable`, a button with the green available outline that reports `onCardSlotPick` with its `value`, gold when `picked` (#78) |
| `player/CardEffectBox` | Beige trigger/scoring row: its `title`, a `gain` resource or a `label` word as its symbol (or a `symbol` snippet for a pictogram) at `symbolText` 12–15 px, and the rules as children (#106) |
| `player/CardEffectList` | A card's column of `CardEffectBox` rows inside the 12 px inset, with `above` for extra space (#106) |
| `player/CardClarity` | Supporting rules beneath the relevant layout as its own 11 px paragraph, with an optional fainter `setup` line, and `above` and `minHeight` for a card's spacing (#106) |
| `player/CardPlacementRows` | A card's placement squares from `items`, in five `kind`s: the Collectors' `collection` (greyed until `collected`, cards and tiles then face down, a name and gain beneath), the Militants' `covered` rewards (an outpost lifted when `exposed`, a rule between rows of `perRow`), the Alchemists' `tracks` (a token when `rolled`), the Leaders' once-only `leaders` tracks (in the player's colour when `used`) and the Historians' `history` squares under the `seat`'s tokens; the `choices` a decision offers are buttons, the `picked` one gold, reported by `onCardPlacementRowsPick` (#106) |
| `player/CardRewardColumns` | `columns` of reward squares: filled from the bottom with each benefit (`vp`, `gain` or `text`) beside its 62 px square and a `filled` square's building in the player's colour (the Craftsmen), or `kind="inside"`, climbed by the `seat`'s token from a start square, the rewards inside 75 px squares and the `current` one in the player's colour (the Merrymakers); the `choices` a decision offers are buttons, the `picked` one gold, reported by `onCardRewardColumnsPick` (#106) |
| `player/CardPathGrid` | 75 px reward `spaces` (a `gain`, a `picture` with its name, or `text`) under column `heads`, joined only by the legal `links` a token may follow, with the `seat`'s start token and its `start` words beneath; the `current` square takes the player's colour and the start token fades; the `choices` a decision offers are buttons, the `picked` one gold, reported by `onCardPathGridPick` (#106) |
| `player/CardPredictionTracks` | `categories` (`{ id, label, note, most, selected }`) of 39 px number targets with separators, the `selected` number in the player's colour; the `choices` a decision offers are buttons, the `picked` one gold, reported by `onCardPredictionTracksPick` (#106) |
| `player/CardTerrainRewards` | `rows` of a terrain hex marker, the terrain's `name` and its reward (`gain` resource, then `effect`); a `used` row fades and its name is struck through (#106) |
| `player/CardTokenReserve` | Compact starting-token squares: `count`, the `used` ones emptied from the left, and the token `color` (#106) |
| `player/CardScoreLadder` | A card's score by count from `steps` (`{ count, points }`): the Collectors' rising gold steps with the counts beneath and the `current` one in the player's colour, or the Isolationists' `kind="flat"` boxes with a worked `example`; `label` says when it scores, `noun` what it counts (#106) |
| `player/CardTechnologyTransfer` | A technology card moving from the `from` owner's top row into the `to` owner's bottom row, a token marking both when `active` (#106) |
