# The decision prompts (#28): design

Written 2026-10-27. #28 replaces #26's plain prompt with a designed prompt for every decision family, in the style of Lazar's decision examples (`docs/ui/main-screen.html`, `docs/ui/assets/decision-showcase.js`). #26 built the decision panel, the footer turn and the map targets; #27 built the player tabs the prompts lean on.

The owner asked for #26–#28 to be built without stopping for approval ("build all", 2026-10-27). What the owner said is marked **(owner)**, every other decision **(my call)**. Collisions: Lazar's mockups decide the look, the owner's design decides what works **(owner)**.

## 1. What and why

A whole game can already be played, but every choice is a list of sentences. #28's done-when (design document): "a full base game can be played with the mouse alone". The prompts should show the things being chosen (resources, cards, plots, territories, dice, tracks) as the mockups do.

## 2. The prompt model

`src/lib/prompts.js` turns an open decision into what the panel draws. It is a plain, tested module **(my call)**:
- `promptFor(decision, view, seat) → Prompt`, where a Prompt is `{ title, instruction, layout, track?, income?, options, shelf?, target? }`.
- `layout` is one of:
  - `options`: boxes with art;
  - `cards`: a card shelf above the panel;
  - `map`: targets on the World Map, then options;
  - `capital`: a placement on the Capital tab;
  - `tracks`: options with track symbols.
- Each option carries the indexes of the decision's answers it stands for, its words (`describe.js`) and its art (resource, building, landmark, terrain, track, card id, die face).
- Every answer is reachable through exactly one option. A test plays random games and checks this for every decision that opens.

## 3. The families

| Family | Decisions | Prompt |
|---|---|---|
| Resources | `chooseResource`, `chooseConversion` | the resources as 48 px icons; a choice of several shows each combination's icons |
| Payments | `chooseBonus`, `chooseTrade`, the advance payment | the cost row (24 px icons), then each way to pay; the bottom tinted with the source track's colour |
| Tapestry cards | `chooseTapestry`, `chooseKeep`, `chooseDiscard`, `chooseResponse`, `chooseCopy` | the cards on a shelf above the panel, as full `TapestryCard`s; the panel confirms; "Play no card" / "Decline" as a panel option where the answers allow it |
| Tech cards | `chooseInvent`, `chooseUpgrade`, `chooseTechBenefit` | tech cards on the shelf; the deck as a card back; Refresh the display as a panel option |
| Civilizations and mats | `chooseCiv`, `chooseCapital`, `chooseCivAbility` | `chooseCiv`: full civilization cards on the shelf (the plain card for the four without a recipe). `chooseCapital`: the capital mats' art on the shelf. `chooseCivAbility`: the portraits as panel options **(my call:** it orders abilities the player already sees in the Civ tab) |
| Capital | `choosePlacement` (a plot) | on the Capital tab: a building's open plots are lit, and clicking one previews it there; a landmark is placed with the tray, dragged, turned and confirmed, snapping only to legal places; "Beside the mat" and the Craftsmen's columns as panel options. `chooseSwap` stays a panel choice with plot words **(my call:** it never opened in 200 simulated games) |
| Map | `chooseExplore`, `chooseConquer`, `chooseHex`, `choosePlacement` (a hex), `chooseGift` | the map's targets; once a hex is chosen, the explore options are the tile in each turn, drawn as turned `TerritoryTile`s with the VP each scores |
| Dice | `chooseDie`, `chooseRoll` | each die's face; a track result shows its track symbol |
| Tracks | `chooseTrack`, `chooseMove`, `chooseRepeat`, `chooseRestart`, `chooseSpace`, `choosePartner` (with a track) | options with track symbols and space names |
| Landmarks | `chooseLandmark` | the landmark pictures |
| Everything else | `chooseOption`, `chooseOrder`, `chooseSlot`, `chooseProphecy`, `chooseAlchemists`, `chooseDiscard` (stop), `chooseGift` (decline) | options with words, and art where an effect names a resource, building or track |

The turn choice and the advance stay in the footer (#26).

## 4. The income turn

During the viewer's own income turn, the panel takes the mockup's gold income style **(owner's mockup)**:
- the title and a step strip in gold with the turn's steps, in the mockup's words: Ability, Tapestry, Upgrade, Score, Income. Only the steps that this income turn runs are shown;
- the current step is marked;
- the footer says "Your income turn · Income turn n · step".

The current step comes from the engine's `incomeSteps` operation on the pending stack: it is the step before the first one still waiting **(my call)**. The first-of-neighbours bonus belongs to the Tapestry step, as in the engine.

## 5. Not in #28

- The log and the results (#29).
- The pass screen (#30).
- The Automa's prompts (#31).

Card texts for expansion cards come with their expansions.

## 6. Tests

- `tests/client-prompts.test.mjs`:
  - over random games, every open decision gets a prompt;
  - its options cover every answer exactly once, with no "undefined" in the words;
  - each family's layout is checked.
- The components' library sections show each layout.
- A browser walkthrough plays a game to the end with the mouse, through every family that comes up.

## 7. Calls made in the build

All **(my call)**, for the owner to revisit after playing:

- **Explore:** choosing a hex selects its best-scoring tile and turn and previews it on the map. Confirm still sends it, and every other tile and turn is listed by VP. The list names the tile and turn only ("Tile 19, turned 3 times"), since the hex is already chosen.
- **Placing on the capital:**
  - A building: a click on a lit plot previews it there; the panel's Place sends it.
  - A landmark: it starts in the tray. Choosing it puts it at the legal place nearest the middle. Moves, drops and turns snap only to the engine's places. The piece's own lock sends it, as does Place.
  - Returning it to the tray clears the choice. A plot click also moves a placed landmark.
- **Nothing is sent before Confirm**, even when there is a single answer.
- **The shelf:**
  - Cards are full size (tapestry 0.7, tech 0.65, civilizations 0.5), and the row scrolls when too wide.
  - Tapestry cards overlap, as in the mockup's fan, only past four.
  - Hovering a tapestry or tech card shows it in full beside the shelf; a civilization or a capital mat is already whole.
  - The capital mats show the example mat art.
- **Several places at once:** a Nomads placement offers capital plots and territories. The capital leads; the map's hexes stay lit, and the panel docks whenever the map is on show (final review).
- **The income strip** shows the turn's own steps; the first-of-neighbours bonus counts as the Tapestry step.
- **Known gap:** `CapitalGrid`'s own fit check doesn't know R106's overhangs or Terraforming. So R and the arrow keys stop short of those places; a plot click or a drop reaches them.

## 8. Follow-ups from the owner's first look (#56–#59)

Written 2026-10-27. The owner filed four problems after playing setup, and asked for them to be fixed with the current designs ("fix these and work on 28. Implement the current designs"). The current designs are Lazar's decision mockups (`docs/ui/main-screen.html`, `docs/ui/assets/decision-showcase.js`).

- **The capital mats (#56)** were 160 px example pictures, where the grid could hardly be seen. Each mat on the shelf is now its own 9×9 `CapitalGrid`, 380 px, composed from the terrain tiles from the mat's plot layout (`matPlots` in `src/lib/area/capital.js`) and the table's terrain seed (`terrainSeed`, now exported), so the mat looks as it will in the Capital tab. This follows the project rule that the example mats are examples only. It replaces the call in §7 that the mats show the example art.
- **The civilization cards (#57)** were scaled to 0.5. They are now whole, 425 px wide at their own height, as the mockup draws them. Their heights run from 451 px (Leaders) to 831 px (Mystics), and at 1920×1080 the shelf has about 760 px. So a row too tall for the shelf is scaled down just enough, and never below 0.75 **(my call)**; past that the shelf scrolls, as the mockup's does. At 1920×1080 every pair fits at 0.9 or more; at 1440×900 only the Mystics need the scroll.
- **The chosen civilization's outline (#58)** was a fixed 212×360 box, lifted 14 px, so tall cards spilled out of it and short ones left an empty box. A civilization or a mat now sizes its own button, so the outline always wraps it, and it is not lifted, as in the mockup. Tapestry and tech cards keep their lift.
- **The shelf's height:** the shelf now takes all the height above the panel, and the cards sit at its foot, next to the panel. A panel with no options of its own (cards, plots, hexes) drops its content area, and its status line gives the instruction instead, which leaves the shelf about 60 px more **(my call)**.
- **The track spaces (#59)** showed no benefits. Each space now shows its benefit and, in a small box, its bonus, as on the printed board: `src/lib/glyphs.js` turns the effects into symbols. Resources, buildings and track symbols use their art; tiles, cards, explore, conquer, invent, the science die and VP are short words, as #5 decided for game symbols without art; a benefit without its own benefit has a red X; "or" joins a choice; the same effect twice in a row is drawn once with a count. The bonus uses `bonusOf`, so the neoprene Nanotechnology variant shows its own price. The words (`describe.js`) are the space's tooltip and label.
- **The spaces' size:** the track board is a size container, and a space grows up to 1.25 times as tall as wide when the board has the height **(my call)**. At 1920×1080 and 1440×900 every space fits; on a 1366×768 screen the symbols shrink and about a dozen bonuses are cut off at the space's edge, with the full words still in the tooltip.

Tests: `tests/client-glyphs.test.mjs` checks every space's symbols; `client-board` the benefit, bonus and words, and the variant's price; `client-area-capital` the mat plots and seed; `tests/browser/setup-prompts.test.mjs` plays setup at 1920×1080 with the mouse and checks the grids, that each civilization's outline fits its card and its scale, and that all 48 spaces show their benefits with nothing cut off. The browser test closes its table afterwards, so local runs don't use up the address's table limit.
