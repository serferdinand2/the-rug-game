# The decision prompts (#28) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every open decision shows a designed prompt (resources, cards, plots, territories, dice, tracks) instead of #26's list of sentences, so a whole base game can be played with the mouse.

**Architecture:** A plain, tested module `src/lib/prompts.js` turns an open decision of the viewer's view into a `Prompt`: its title, instruction, layout, art and one option per answer, each placed in the panel, on a card shelf, on the map or on the capital. New prompt components draw it (`PromptArt`, `CardShelf`, `IncomeSteps`, and additions to `DecisionOption`, `DecisionPanel` and `TurnBar`). The capital's placement (`src/lib/area/placement-targets.js`, `CapitalGrid` targets) and the map's explore choices (`src/lib/area/explore.js`, a `WorldMap` preview) are their own tasks. `Game.svelte` puts them together.

**Tech Stack:** Svelte 5 (runes), Vite 8, Node 22 ES modules with JSDoc, `node:test`.

**Spec:** `docs/superpowers/specs/2026-10-27-decision-prompts-design.md`

## Global Constraints

- CONVENTIONS.md: JSDoc, braces on every `if`, Prettier on touched files only (never `npm run format`), `npm run check` 0 errors 0 warnings, colours only from tokens, BEM `rg-{name}--{part}` classes, `on{Component}{Action}` callbacks with `ComponentEvent`, `{...attr}` on the root with `class` merged, a library section and a README row for every new or changed component.
- No rules text is invented. Every word comes from `src/lib/describe.js` (`decisionTitle`, `describeAnswer`, `describeEffects`) or from short interface sentences in `prompts.js`.
- The engine is imported only through `src/lib/engine/game.js` or the `data/` modules. Never import a civilization module first.
- Art comes only through `artUrl()` in `src/lib/ui.js`. The drawn groups are `resource-24`, `resource-48`, `track`, `building`, `landmark`, `terrain`, `civ`, `tapestry`, `tech`, `space-tile` and `capital-mat`. Dice faces and VP have no art (docs/art/issue-5.md), so they are words.
- Lazar's mockup decides the look: `docs/ui/main-screen.html` (its decision overlay CSS) and `docs/ui/assets/decision-showcase.js`.
- Each commit is titled `Refs #28: …`, the last one `Fix #28: …`, and ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

- **A decision with a single answer** (a lone landmark place, a lone tapestry card): the prompt still shows it and Confirm works; nothing auto-sends.
- **A hidden-option decision for another seat** (`chooseCiv`, `chooseKeep`, `chooseTapestry` lose `options` for non-owners): `promptFor` is only ever called with the viewer's own decision, which has `answers`. It must not throw on a decision without `answers`. It returns null.
- **An explore with many tiles:** up to 6 tiles × 6 turns on one hex. The choices are sorted by VP, then tile, then turn, and the list scrolls.
- **A landmark with no legal place on the grid** (only `besideMat`): the capital layout falls back to the panel option, and no piece is offered.
- **The viewer's income turn while another seat answers** (a neighbour's pick): the gold income style only shows on the viewer's own decisions.

---

### Task 1: The prompt model

**Files:**
- Create `src/lib/prompts.js` and `tests/client-prompts.test.mjs`.
- Modify `src/lib/engine/game.js`: export `matchingSides` from `./map.js` and `turned` from `./terrain.js`.

**Interfaces (Produces):**

```js
/** @typedef {import('./ui.js').TrackId} TrackId */
/** @typedef {import('./ui.js').CostSymbol} CostSymbol */
/**
 * @typedef {{ kind: 'resource', id: CostSymbol, count: number }
 *   | { kind: 'track', id: TrackId }
 *   | { kind: 'building', id: 'market' | 'house' | 'farm' | 'armory' }
 *   | { kind: 'landmark', id: string }
 *   | { kind: 'terrain', id: string }
 *   | { kind: 'civ', id: string }
 *   | { kind: 'tapestry', id: string }
 *   | { kind: 'tech', id: string }
 *   | { kind: 'deck', id: 'tech', count: number }
 *   | { kind: 'space-tile', id: number }
 *   | { kind: 'territory', id: number, orient: number }
 *   | { kind: 'mat', id: number }
 *   | { kind: 'vp', count: number }} Art
 */
/**
 * @typedef {Object} PromptOption
 * @property {number} index - The answer's index in decision.answers
 * @property {'panel' | 'shelf' | 'map' | 'capital'} place - Where it is chosen
 * @property {string} label - describeAnswer(decision, answer, game)
 * @property {Art[]} art - Drawn before or above the label; may be empty
 * @property {string} [hex] - For place 'map': the hex it is chosen on
 * @property {{ row: number, col: number, rotation: number | null }} [plot] - For place 'capital'; rotation null for a building
 */
/**
 * @typedef {Object} IncomeView
 * @property {number} turn - 1–5
 * @property {{ id: string, label: string }[]} steps - The turn's visible steps in order
 * @property {string | null} current - The id of the step running now
 */
/**
 * @typedef {Object} Prompt
 * @property {string} kind - The decision kind
 * @property {string} title - decisionTitle(decision, game)
 * @property {string} instruction - One sentence on how to answer
 * @property {'options' | 'cards' | 'map' | 'capital'} layout
 * @property {'tapestry' | 'tech' | 'civ' | 'mat' | null} shelf - What the shelf holds, for layout 'cards'
 * @property {TrackId | null} track - The track that tints the panel
 * @property {CostSymbol[] | null} cost - A price shown above the options
 * @property {IncomeView | null} income - Set during the viewer's own income turn
 * @property {string} confirmLabel
 * @property {PromptOption[]} options - One per answer, in answer order
 */
export function promptFor(decision, game, seat) // → Prompt | null (null when the decision has no answers)
export function incomeView(game, seat)          // → IncomeView | null
export function effectArt(effects)              // → Art[] for a list of one-key effects
```

**The rules:**

- **`place`:**
  - An answer with a string `hex` is `'map'`.
  - A `choosePlacement` answer with a numeric `row` is `'capital'`.
  - A card answer is `'shelf'`:
    - `chooseTapestry`, `chooseKeep`, `chooseDiscard`, `chooseResponse` and `chooseCopy` with a string `card`;
    - `chooseInvent` with a string `card`, `'deck'` included;
    - `chooseUpgrade` and `chooseTechBenefit` with a string `card`;
    - `chooseCiv` with a string `civ`;
    - `chooseCapital`.
  - Everything else is `'panel'`: declines, `besideMat`, `craftsmen`, `refresh`, and `chooseSwap`. **Ruling:** `chooseSwap` stays a panel choice with plot words. It never opened in 200 simulated games, and a two-plot pick on the grid costs more than it gives.
- **`layout`:** `'map'` if any option is on the map, otherwise `'capital'` if any is on the capital, otherwise `'cards'` if any is on the shelf, otherwise `'options'`.
- **`shelf`:**
  - `'tapestry'` for the tapestry kinds;
  - `'tech'` for the tech kinds;
  - `'civ'` for `chooseCiv`;
  - `'mat'` for `chooseCapital`;
  - otherwise null.
- **`art`:**
  - `chooseResource` and `chooseConversion`: the answer's `resources`, as resources with counts.
  - `chooseBonus` and `chooseTrade`: the payment's resources. A payment in cards, tiles or VP gets no art, only its label.
  - `chooseTrack`, `chooseRoll`, `chooseRestart`, `chooseMove`, `chooseRepeat`, `chooseSpace` and `choosePartner`: the answer's track, when it has one.
  - `chooseDie`: `effectArt([face])` of the die's face, from `RED_DIE`/`BLACK_DIE` in `data/dice.js`.
  - `chooseLandmark`: the landmark.
  - `chooseSpaceTile`: the space tile.
  - `chooseGift`: the territory, turned 0.
  - `chooseExplore`: the territory in its turn.
  - The shelf kinds: their card, civilization, mat or the tech deck. The deck's count is `game.supply.tech.deck`.
  - `chooseCivAbility`: the civilization.
  - `choosePlacement` on the panel: the building or landmark.
  - `chooseOption` and `chooseOrder`: `effectArt` of the option or effect.
  - `chooseSlot`: a track or resource slot as its art.
  - Otherwise none.
  - **`effectArt`:**
    - `gain` of resources: resources;
    - `gain` of buildings: buildings;
    - `advance`, `regress` and `track` effects with a track id: a track;
    - `vp` with a number: `{ kind: 'vp', count }`;
    - anything else: nothing.
- **`track`:**
  - `chooseBonus`: `decision.track`;
  - `chooseMove`: the track all its options share, when they share one;
  - otherwise null.
- **`cost`:**
  - `chooseBonus`: the cost as symbols, one per unit. `any` maps to `'any'`, and `{ track: n }` to the track's resource (`TRACK_RESOURCE`);
  - otherwise null.
- **`income`:**
  - `incomeView(game, seat)` is set only when the decision is the viewer's and the viewer is in an income turn. That means the latest `incomeTurnStarted` event for `seat` is newer than the latest `turnStarted` event.
  - **Steps:** the turn's steps are `INCOME_STEPS` filtered by turn (`INCOME_STEP_KINDS[id].turns`). Only those with a label are kept: `civAbilities` 'Ability', `tapestry` 'Tapestry', `upgrade` 'Upgrade', `score` 'Score', `income` 'Income'.
  - **The current step** is the step before the `incomeSteps` operation's `steps[0]` in the full list, where that operation (for `seat`) is in `game.pending`. With no such operation it is the last labelled step.
- **`confirmLabel`:**
  - `chooseTapestry`: 'Play card';
  - `chooseKeep`: 'Keep card';
  - `chooseCiv`: 'Keep civilization';
  - `chooseCapital`: 'Take this capital';
  - `chooseInvent`: 'Invent';
  - `chooseUpgrade`: 'Upgrade';
  - `chooseExplore`: 'Explore';
  - `chooseConquer`: 'Conquer';
  - `choosePlacement`: 'Place';
  - otherwise 'Confirm choice'.
- **`instruction`:**
  - layout `'map'`: 'Choose a lit territory on the map.';
  - `'capital'`: 'Choose a lit plot in your capital.' for a building, and 'Place the landmark in your capital: drag it, turn it with R, then confirm.' for a landmark;
  - `'cards'`: 'Choose a card above, then confirm it here.';
  - otherwise: 'Choose one.'

**Steps:**
- [ ] **Write the tests:**
  - (a) Over 30 random games (the loop in `tests/client-turn.test.mjs`: seeds 1–30, 2–5 players, both versions), for every open decision whose view has `answers`, `promptFor(mine, view(state, seat), seat)`:
    - gives one option per answer, with `index` 0…n−1 in order;
    - gives no label that contains "undefined", "[object" or "Choose this option";
    - places every `hex` answer on `'map'` and every `row` answer on `'capital'`;
    - gives a layout consistent with the places;
    - gives an `income` only when an `incomeSteps` operation or the turn's `incomeTurnStarted` is the viewer's.
  - (b) `chooseResource` with `from: 'any'`, `count: 1` gives 4 options, each with one resource art of count 1.
  - (c) `chooseBonus` on a space with a bonus has `track`, a `cost`, and a decline option on the panel.
  - (d) A started 2-player game on income turn 2 at `chooseTapestry` has `income.current === 'tapestry'` and steps `['civAbilities','tapestry','upgrade','score','income']`.
  - (e) `promptFor` of a decision without `answers` is null.
  - (f) `effectArt([{ gain: { coin: 2 } }, { advance: { track: 'science' } }])` is `[{kind:'resource',id:'coin',count:2},{kind:'track',id:'science'}]`.

  Build (b)–(e) from `tests/helpers/engine.mjs` (`startedGame`, `push`/`run` as in `client-turn.test.mjs`).
- [ ] **Run them:** `node --test tests/client-prompts.test.mjs`. They fail: there is no module yet.
- [ ] **Implement** `prompts.js` and the two `game.js` exports.
- [ ] **Check:**
  - `node --test tests/client-prompts.test.mjs tests/engine-data.test.mjs` passes;
  - `npm run check` is 0/0;
  - Prettier on the touched files.
- [ ] **Commit:** `Refs #28: the prompt model`.

### Task 2: The prompt components

**Files:**
- Create `src/lib/components/prompts/PromptArt.svelte`, `CardShelf.svelte` and `IncomeSteps.svelte`, each with a section in `src/library/sections/prompts/`.
- Modify `DecisionOption.svelte`, `DecisionPanel.svelte` and `TurnBar.svelte`, and their sections.
- Modify `src/lib/components/README.md`.

**Consumes:** the `Art` typedef of Task 1. Copy it into `PromptArt`'s `<script module>` as `PromptArtItem`, so this task needs nothing from Task 1. Task 5 passes Task 1's `Art` objects straight in.

**Produces:**
- **`PromptArt`** draws one `item` at `size` (`'medium'` 24 px or `'large'` 48 px; default `'large'`):
  - `resource`: `ResourceIcon`, with a ×count badge when the count is above 1;
  - `track`, `building`, `landmark`, `terrain`, `civ` and `space-tile`: `<img src={artUrl(`${group}/${id}`)}>`, pixelated;
  - `territory`: `TerritoryTile` with turned corners. It takes `corners` and `island` from `TERRITORY_TILES[id-1]`, turned with `turned()` from `src/lib/engine/game.js` (Task 1 exports it; until that lands, import `turned` from `../../engine/terrain.js`);
  - `mat`: `capital-mat/<biome>` from `CAPITAL_MATS[id-1].name` in lower case;
  - `vp`: the text "n VP" in a gold badge;
  - `deck`: a card-back box reading "Deck · n";
  - `tapestry` and `tech`: their card art image (`tapestry/<id>`, `tech/<id>`).

  It is decorative: the option's label names it.
- **`DecisionOption`:**
  - gains `art` (`PromptArtItem[]`, default `[]`), drawn above the label at 48 px as the mockup's `decision-option` with `resource-48`;
  - keeps `symbols` (24 px, before the label) for the advance payments;
  - gains `vp` (`number | null`), a small gold "+n VP" badge in the corner.
- **`DecisionPanel`:**
  - gains `track` (`TrackId | null`): the bottom bar and border take `trackColor(track)` as the mockup's `--track` tint;
  - gains `tone` (`'default' | 'income'`): the title, border and step strip in gold, as the mockup's `[data-income]`;
  - gains `steps` (a snippet rendered between the title and the content).
- **`CardShelf`:**
  - takes `kind` (`'tapestry' | 'tech' | 'civ' | 'mat'`), `cards` (`{ index: number, id: string, label: string, deck?: number }[]`) and `selected` (`number | null`), and fires `onCardShelfSelect` with `event.value = index`;
  - each card is a pressable button with `aria-pressed`;
  - **What each card shows:**
    - `tapestry`: `TapestryCard data={tapestryCardData(id)}` scaled 0.7 (319×560);
    - `tech`: `TechnologyCard data={techCardData(id)}` scaled 0.65 (425×286), and for `id === 'deck'` a card back with "Deck · n";
    - `civ`: `CivilizationCard id` for the reviewed civilizations (`REVIEWED_CIVILIZATIONS`), otherwise the plain portrait card used in `PlayersOverview.svelte`;
    - `mat`: the `capital-mat/<biome>` art with the mat's name.
  - **Selection:** the selected card has a gold outline and lifts. Hovering or focusing a card fires `onCardShelfInspect` with its index, for the full view.
- **`IncomeSteps`:** takes `steps` (`{ id, label }[]`) and `current` (`string | null`), and draws the mockup's `.income-progress` strip, with the current step marked `aria-current="step"`.
- **`TurnBar`:** gains `tone="income"`, the mockup's `.turnbar.income-turn`: a gold label and border, with no income button.
- **Library sections:**
  - `PromptArt` in every kind;
  - `DecisionOption` with resource art, with a VP badge, and with symbols;
  - `DecisionPanel` in the default tone, with a track tint, and in the income tone with `IncomeSteps`;
  - `CardShelf` with 3 tapestry cards, 3 tech cards plus the deck, 2 civilizations (one reviewed, one plain) and 2 mats;
  - `TurnBar` in the income tone.

**Steps:**
- [ ] Build the components and library sections in Lazar's look. Read the mockup's CSS for `.decision-panel`, `.decision-option`, `.income-progress`, `.floating-card`, `[data-income]` and `.turnbar.income-turn` in `docs/ui/main-screen.html`.
- [ ] **Check:**
  - `npm run check` is 0/0;
  - `npm run build`, then `node --test tests/styles.test.mjs tests/library.test.mjs` passes (the token and library tests);
  - in the browser, `/components.html` shows every new state (`npm run dev`, then look; take one screenshot per component into the report).
- [ ] **Commit:** `Refs #28: the prompt components`.

### Task 3: Placing on the capital

**Files:**
- Create `src/lib/area/placement-targets.js` and `tests/client-area-placement.test.mjs`.
- Modify `src/lib/components/player/CapitalGrid.svelte` and its library section.
- Modify `src/screens/game/PlayerTabs.svelte` (the Capital tab).

**Consumes:** the options from Task 1 whose place is `'capital'`. They are `{ index, plot: { row, col, rotation } }`, with `rotation` null for a building.

**Produces:**
- **`placement-targets.js`:**
  - `plotTargets(options) → { row, col, index }[]`: building places.
  - `legalNear(options, row, col, rotation) → number | null`: the option index with that rotation whose top-left is nearest (row, col) by squared distance. Ties go to the lower index. It is null when no option has that rotation.
  - `nextRotation(options, current) → number | null`: from the option at `current`, the option of the next rotation (cycling +1 … +3) nearest the same top-left. Null when no other rotation is legal.
- **`CapitalGrid`:**
  - gains `targets` (`{ row: number, col: number }[]`, default `[]`): each target plot gets a green outline and is a button (`aria-label` "Place at row r, column c"), firing the existing `onCapitalGridPlotClick` with `{ row, col }`;
  - gains `preview` (`{ row, col, building } | null`): the chosen building drawn faint on its plot.
  - Its existing landmark pieces, tray, drag and rotate stay as they are.
- **`PlayerTabs`:**
  - gains `placement` (`{ piece: { building?: string, landmark?: string }, options: PromptOption[], picked: number | null } | null`) and `onPlayerTabsPlace`, which fires with `event.value = { index: number, confirm: boolean }`;
  - **For a building:** `targets` = `plotTargets`. A click picks that index (`confirm: false`), and the preview shows it.
  - **For a landmark:** the `PlacementTray` holds the landmark. Choosing it places the piece at `legalNear(options, 4, 4, 0)`, or at the nearest legal place of any rotation.
    - Moves, drops and arrow keys snap with `legalNear` at the piece's rotation.
    - R and the rotate control use `nextRotation`.
    - Each landing fires `onPlayerTabsPlace` with that index (`confirm: false`). The piece's own confirm control fires `confirm: true`.
    - With no grid option, nothing is offered on the grid.
  - Whenever `placement` is set, the Capital tab draws `awaitingPlacement`.

**Steps:**
- [ ] **Write the tests** for `placement-targets.js` with hand-made options:
  - `legalNear` picks the nearest of three, by rotation;
  - it is null for a missing rotation;
  - `nextRotation` cycles from 3 to 0;
  - `plotTargets` keeps the indexes.
- [ ] **Run them:** `node --test tests/client-area-placement.test.mjs`. They fail.
- [ ] **Implement** the module, the `CapitalGrid` targets and preview, and the `PlayerTabs` placement.
- [ ] **Library:** the `CapitalGrid` section shows lit targets with one previewed farm.
- [ ] **Check:**
  - `npm run check` is 0/0;
  - the test passes;
  - Prettier on the touched files.
- [ ] **Commit:** `Refs #28: placing buildings and landmarks on the capital`.

### Task 4: Explore choices on the map

**Files:**
- Create `src/lib/area/explore.js` and `tests/client-area-explore.test.mjs`.
- Modify `src/lib/components/board/WorldMap.svelte` (a tile preview) and its library section.
- Modify `src/lib/hexmap.js` only if the preview needs a helper there.

**Produces:**
- `exploreChoices(game, decision, hex) → { index, tile, orient, corners, island, vp }[]`, for `decision.answers` with that `hex`:
  - `corners` is `turned(TERRITORY_TILES[tile-1].corners, orient)`;
  - `island` is the tile's island;
  - `vp` is `matchingSides(game, hex, tile, orient)`;
  - sorted by vp descending, then tile, then orient.

  Import `turned` and `matchingSides` from `src/lib/engine/game.js`. Task 1 adds both exports there; if Task 1 hasn't landed, add exactly these two export lines yourself (`export { matchingSides } from './map.js';` and `export { turned } from './terrain.js';`), and the merge keeps one copy.
- **`WorldMap`** gains `preview` (`{ hex: string, corners: Terrain[], island: Terrain[] } | null`): the turned tile drawn on that hex with the same wedges as an explored hex, at 85% opacity with a gold outline.

**Steps:**
- [ ] **Write the tests**, from a started 2-player game (`tests/helpers/engine.mjs`) where seat 1 holds tiles and an explore is open (push `{ explore: {} }` and run, as `tests/engine-explore.test.mjs` does):
  - every answer for the chosen hex appears once;
  - `vp` equals `matchingSides` on the full state for each;
  - the list is sorted;
  - the corners of orient 1 are the printed corners turned once.
- [ ] **Run them:** `node --test tests/client-area-explore.test.mjs`. They fail.
- [ ] **Implement** `explore.js` and the `WorldMap` preview.
- [ ] **Library:** the `WorldMap` section shows one hex with a preview.
- [ ] **Check:**
  - `npm run check` is 0/0;
  - Prettier on the touched files.
- [ ] **Commit:** `Refs #28: explore choices and the tile preview`.

### Task 5: The play screen's prompts

**Files:**
- Modify `src/screens/Game.svelte`, `src/lib/area/tabs.js` (if a mapping changes) and `tests/client-area-tabs.test.mjs`.

**Steps:**
- [ ] **Replace the plain prompt with `promptFor(promptDecision, game, seat)`:**
  - **The panel:** `title`, `confirmLabel`, `track`, `tone` (income), and the `IncomeSteps` snippet. The instruction is the panel's first line.
  - **Panel options:** a `DecisionOption` each, with `art`.
  - **Cost:** a `CostBox` with `prompt.cost` when it is set.
  - **Layout `'cards'`:** a `CardShelf` in the panel's `shelf` snippet, with the shelf options; the panel options stay below. Inspecting a shelf card shows it full size, as the Hand tab does.
  - **Layout `'map'`:** the map opens; the targets are the options' hexes.
    - Choosing a hex lists that hex's panel choices. For `chooseExplore` these are `exploreChoices`, as `DecisionOption`s with a `territory` art in its turn and `vp`. Choosing one sets the map `preview`.
    - "Choose another territory" clears the hex.
  - **Layout `'capital'`:** the Capital tab opens with `placement`, and `onPlayerTabsPlace` sets `picked`. A `confirm: true` sends. The panel keeps its non-grid options (beside the mat, the Craftsmen columns) and Confirm.
  - **The footer:** during the viewer's income turn the footer uses `TurnBar tone="income"`, labelled "Your income turn" with the heading "Income turn n · <current step label>".
- [ ] **Keep #26's behaviour:**
  - the advance payment panel;
  - the reset of the turn state;
  - no automatic send: one answer still needs Confirm;
  - the map prompt docked right.
- [ ] **Check:**
  - `npm run check` is 0/0;
  - `npm test` passes;
  - Prettier on the touched files.
- [ ] **Commit:** `Refs #28: the play screen's designed prompts`.

### Task 6: Walkthrough, screenshots and documents

- [ ] **Walkthrough:** two browser tabs on `npm start`, playing a game with the mouse. Use `window.drive()` only to skip ahead between families. Cover:
  - setup (the capital mats on the shelf, the civilizations);
  - an income turn with its gold steps (Tapestry on the shelf, an upgrade on the tech shelf);
  - an advance with a bonus (cost and tint);
  - a resource choice;
  - an invent;
  - an explore (hex, then the turned tiles with VP);
  - a building placed on the capital;
  - a landmark placed and turned;
  - a conquer with its dice;
  - a trap response;
  - the game's end.
- [ ] **Screenshots** in `docs/ui/screens/`: `game-prompt-cards.png`, `game-prompt-explore.png`, `game-prompt-capital.png` and `game-prompt-income.png`.
- [ ] **Documents:**
  - README "Current interface" and `docs/ui/README.md`;
  - CLAUDE.md: the #28 entry, the Architecture list (`prompts.js`, `area/placement-targets.js`, `area/explore.js`, the new components) and Next ("#6");
  - the design document's calls.
- [ ] **Commit:** `Fix #28: the designed decision prompts`.
