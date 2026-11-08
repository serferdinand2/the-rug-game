# The arts track in the client (#35 part 4) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A table with Arts & Architecture plays the arts track on screen as the approved mockup draws it:
- the fifth track in violet, with ≠ and = price marks;
- the masterpiece row on its line;
- each player's masterpieces on the Civ tab, and the inspired rows and spare tiles on the Income tab;
- shelves and panels for every new choice;
- the d20 in the dice tray;
- the words in How to play and the card reference.

**Architecture:** Logic goes in plain modules under `src/lib/` (`board.js`, `glyphs.js`, `describe.js`, `prompts.js`, `decision-kinds.js`, `dice.js`, `area/income.js`, a new `area/masterpieces.js`, a new `cards/masterpiece-text.js`), each tested under Vitest. Components stay presentational:
- new: `MasterpieceChip`, `MasterpieceRow`, `MasterpieceBack` and `InspirationTiles`;
- changed: `TierPrice`, `Track`, `TrackBoard`, `IncomeMat`, `CardShelf`, `PromptArt` and `Die`.

Screens wire them: `Game.svelte`, `PlayerTabs.svelte` and `DecisionPrompt.svelte`. The engine changes in one place: the Alchemists' roll events name the d20.

**Tech Stack:** JavaScript with JSDoc, Svelte 5 runes, Vite, Vitest with `node:assert/strict`, Playwright, and the art toolkit in `tools/art/`.

**Spec:** [docs/superpowers/specs/2026-11-06-arts-track-design.md](../specs/2026-11-06-arts-track-design.md): §2 has the owner's choices for part 4, §4 the client. The approved mockup is `docs/ui/arts-architecture.html` (`src/library/ArtsMockup.svelte`).

## Global Constraints

- **The owner's choices (§2):**
  - `--arts: #7b5aa6`;
  - tier II is `any any ≠` and tier IV is `any any =`;
  - the masterpiece row sits on the arts track's line, beside its name;
  - a player's masterpieces show on the Civ tab, under the landmark card.
- **Without the arts track the screen is unchanged:** four tracks, no masterpiece row, no tiles, no masterpieces, the d12.
- **Masterpieces are public.** Every seat's masterpieces show on its tabs to every viewer. The deck shows only its count.
- **Used masterpieces:** a used single-use card shows face down, as the arts symbol on violet with "used", and opens no card preview.
- **No screen-reader work.** Don't add aria labels or live regions; keep the existing ones as they are.
- **Components:** each new component gets a library section and a row in `src/lib/components/README.md`. Each has a `<script module>` typedef, `$props()` with `/** @type {Props} */`, an `{...attr}` spread with its class merged, and `rg-` BEM classes. Colours come from tokens.
- **Art:** new art is drawn by `tools/art/drawings/`, written by `npm run art`, and listed in the catalog. It waits for the owner's sign-off in the Art area, so it is shown to the owner, not called approved.
- **Process:**
  - Prettier only on changed files (`npx prettier --write <files>`).
  - Run e2e with `PORT=3021`.
  - `npm run check` reports 0 errors and 0 warnings.
  - Commits start `Refs #35: …` and end with the Co-Authored-By line.
  - Never edit `docs/conventions.md`; progress goes in `docs/status.md`.

## Review Focus

1. **A base or Plans & Ploys game draws exactly as before:** four tracks, the d12 and no new rows. Task 1 tests `trackBoard` and the track question; Task 5 tests the dice.
2. **Another player's tabs show their masterpieces and inspired rows,** read-only, and the public view hides nothing that the rules make public (Task 3).
3. **Streaming Implants' shelf:**
   - it marks a neighbour's card with the owner;
   - Stop declines;
   - the same card held by two players stays two shelf cards.

   Task 4 tests each.
4. **An Alchemists roll of the d20 lands on the arts face** in the tray and doesn't bust. Task 5 tests the event and the face.
5. **Hotkey 5:**
   - it picks the arts track only when it is offered;
   - the track question lists 5 tracks only with the arts track;
   - the shortcut sheet says "1–5" only then.

   Task 1 tests each.

---

### Task 1: The arts track on the board

**Files:**
- Modify:
  - `src/styles/tokens.css` (`--arts`);
  - `src/lib/board.js` (`trackBoard` reads `tracksOf`; `tierSymbols('arts', …)`);
  - `src/lib/ui.js` (`CostSymbol` gains `'different' | 'same'`);
  - `src/lib/components/board/TierPrice.svelte` (draws the marks);
  - `src/lib/describe.js` (`priceWords` for the marks; `isTrack` knows `'arts'`);
  - `src/lib/glyphs.js` (word glyphs for the arts effects; the `incomeBuilding` counter);
  - `src/lib/decision-words.js` and `src/lib/prompts.js` (`isTrack` and track art for `'arts'`);
  - `src/lib/hotkeys.js` (`TRACK_KEYS` five);
  - `src/lib/turn.js` (the track question lists `tracksOf(game)`);
  - `src/lib/shortcuts.js` (the key range for the table);
  - `src/screens/Game.svelte` (`BoardSwitcher` gets the table's tracks).
- Test:
  - `tests/client-arts-board.test.mjs` (new);
  - `tests/client-id-lists.test.mjs`;
  - `tests/client-shortcuts.test.mjs`.

**Interfaces:**
- Produces:
  - `tierSymbols(track, tier)` returns `['any']`, `['any','any','different']`, `['any','any','any']` and `['any','any','same']` for `'arts'`;
  - `trackBoard(view)` returns one entry per `tracksOf(view)`;
  - `trackKeys(game)` is in `hotkeys.js`;
  - `TRACK_KEYS` is `[...TRACK_IDS, 'arts']`.

- [ ] **Step 1: Write the failing tests.** Each test checks one of these:
  - `trackBoard` of an A&A view has 5 tracks, the last `arts` named "Arts", with its three unowned landmarks. A base view has 4.
  - The arts track's tier symbols are as above.
  - `priceWords(['any','any','different'])` is "2 different resources" and `['any','any','same']` is "2 resources of the same type".
  - The glyphs:
    - space 3's benefit is the word "Create";
    - 5 and 8 are "Inspire";
    - 6 is "Broadcast" or a building;
    - 7 is "May refresh" plus "Create";
    - 12 is "Fire 3";
    - the bonuses of 5 and 11 gain "Create";
    - 10's counter is the word "Building", not "Thing".
  - `describeEffects` of Theater's effects reads "…on Arts".
  - A track answer `'arts'` gets track art and the words "Arts".
  - The track question lists 5 tracks with the arts track and 4 without; key `5` answers `'arts'` only when it is offered.
  - The shortcut sheet reads "1–5" for an arts table and "1–4" otherwise.
- [ ] **Step 2: Run them.** `npx vitest run tests/client-arts-board.test.mjs` should fail.
- [ ] **Step 3: Implement.**
  - TierPrice draws `different` and `same` as a bold "≠" and "=" in the text colour, after the icons, as the mockup's `.mk-mark` does.
  - `glyphs.js` maps the effect keys of `effects/arts.js` to word glyphs.
- [ ] **Step 4: Run the tests and check.** Run the file, the whole unit suite and `npm run check`; all pass.
- [ ] **Step 5: Look at it.** Open an A&A game in the dev server at 1920×1080 and look at:
  - the five tracks;
  - Flash Mob's and Infinite Spectrum Photography's four track icons, against the bonus band. If they press on the band, shrink the icons in that space only, by the existing `TrackSpace` sizing.
- [ ] **Step 6: Commit.** Message: "Refs #35: the arts track on the board".

### Task 2: The masterpiece row on the arts track's line, and the card preview

**Files:**
- Create:
  - `src/lib/cards/masterpiece-text.js`: `masterpieceText(id)`, the card's effect in words, with "This card is used once" for Art Deco and Mime;
  - `src/lib/components/player/MasterpieceChip.svelte`: picture and name, or face down with "used";
  - `src/lib/components/board/MasterpieceRow.svelte`: the "Masterpieces" label, the face-up chips and "Deck · N";
  - library sections for both.
- Modify:
  - `src/lib/components/board/Track.svelte` and `TrackBoard.svelte`: an optional `heading` snippet per track, drawn after the track's name;
  - `src/screens/Game.svelte`: the row on the arts track; hovering a chip opens the shared area's card preview;
  - the card preview (`src/lib/area/inspect.js` and the preview component): a `'masterpiece'` kind that draws `MasterpieceCard` with `masterpieceText`;
  - `src/gallery/CardEntry.svelte`: the card reference shows `masterpieceText` instead of "Rules text pending".
- Test: `tests/client-masterpieces.test.mjs` (new).

**Interfaces:**
- Produces:
  - `masterpieceText(id) => string`;
  - `masterpieceRow(view) => { faceUp: string[], deck: number } | null` (in `src/lib/area/masterpieces.js`), null without the arts track;
  - `MasterpieceChip` props `{ id, used?, size?: 'tiny' | 'small' }`, with `onMasterpieceChipInspect` fired with the id or null;
  - `MasterpieceRow` props `{ faceUp, deck }`, with `onMasterpieceRowInspect`.

- [ ] **Step 1: Write the failing tests.**
  - `masterpieceText`:
    - each of the 20 cards has words;
    - Theater names Arts;
    - Art Deco and Mime say they are used once.
  - `masterpieceRow`:
    - it gives the face-up cards and the deck count of an A&A view;
    - it is null for a base view and for an A&A view without the arts track.
- [ ] **Step 2: Run them.** `npx vitest run tests/client-masterpieces.test.mjs` should fail.
- [ ] **Step 3: Implement.** Move the mockup's chip look into `MasterpieceChip`, with token colours (new card tokens if none fit). Add the library sections.
- [ ] **Step 4: Run the tests and check.** The file, the unit suite and `npm run check` pass.
- [ ] **Step 5: Look at it.** In the dev server:
  - the row sits on the arts line;
  - pointing at a chip shows the card;
  - the gallery's masterpieces show their text.
- [ ] **Step 6: Commit.** Message: "Refs #35: the masterpiece row and the masterpiece cards' words".

### Task 3: Masterpieces and inspiration tiles in the player area

**Files:**
- Modify:
  - `src/lib/area/income.js`: an inspired row reads `INSPIRED_MAT`, with `inspired` on the row and `improved` on spaces 2, 4 and 6;
  - `src/lib/components/player/IncomeMat.svelte`: an improved space gets the gold frame and "+";
  - `src/lib/area/masterpieces.js`: `heldMasterpieces(seat)` and `spareTiles(seat)`;
  - `src/screens/game/PlayerTabs.svelte`: the Civ tab gets "Masterpieces" under the landmark card, and the Income tab gets "Inspiration tiles · N to place" under the mat.
- Create:
  - `src/lib/components/player/InspirationTiles.svelte`: the spare tiles, each showing the tile's picture when pointed at;
  - its library section.
- Test:
  - `tests/client-masterpieces.test.mjs`;
  - `tests/client-income.test.mjs`, or the existing income area test.

**Interfaces:**
- Consumes: `MasterpieceChip` (Task 2).
- Produces:
  - `heldMasterpieces(seat) => { card, name, used }[]`, in the order gained, and `[]` for a seat without them;
  - `spareTiles(seat) => BuildingId[]`, in income-mat order;
  - `IncomeRowView.inspired: boolean` and `IncomeSpaceView.improved: boolean`.

- [ ] **Step 1: Write the failing tests.**
  - An inspired Markets row's space 2 reads coin + 2 VP and is `improved`.
  - An uninspired row has no improved space.
  - `heldMasterpieces` keeps the order and the `used` flags.
  - `spareTiles` leaves out the inspired rows.
  - A seat without the arts track has neither.
- [ ] **Step 2: Run them.** They should fail.
- [ ] **Step 3: Implement.**
  - The Civ tab's masterpieces show for every seat's tabs, own or another's.
  - The tiles show only on the Income tab.
  - Pointing at a chip uses PlayerTabs' existing `onPlayerTabsInspect`, with the kind `'masterpiece'`.
- [ ] **Step 4: Run the tests and check.** The unit suite and `npm run check` pass.
- [ ] **Step 5: Look at it.** In a running A&A game, check:
  - the Income tab, with a row inspired;
  - the Civ tab, with a used card;
  - another player's tabs.
- [ ] **Step 6: Commit.** Message: "Refs #35: masterpieces and inspiration tiles in the player area".

### Task 4: The new choices

**Files:**
- Modify:
  - `src/lib/decision-kinds.js`: the shelf `'masterpiece'`, and these kinds:

    | Kind | Facts |
    |---|---|
    | `chooseCreate` | shelf, confirm "Take card" |
    | `chooseMasterpiece` | shelf, confirm "Fire"; a decline confirm "Stop" |
    | `chooseInspire` | tab `'income'`, confirm "Place tile", art `'building'` |
    | `chooseScienceDie` | art `'science-die'`, confirm "Roll" |
  - `src/lib/prompts.js`:
    - `shelfIdOf` and `shelfFace` handle masterpieces: a card, the deck as `{ deck: 'masterpiece', count }`, and an owner for a neighbour's card;
    - `STEP_LABELS.masterpieces` is "Masterpieces";
    - the art for the new shapes.
  - `src/lib/components/prompts/CardShelf.svelte`: draws `MasterpieceCard`, `MasterpieceBack` and the owner's tag.
  - `src/lib/components/prompts/PromptArt.svelte`: a die body, `{ kind: 'die-body', id: 'science' | 'science-d20' }`, and building art for inspire.
  - `src/screens/game/DecisionPrompt.svelte`, or prompt state: while an inspire row is picked, the Income tab's mat previews its improved spaces.
  - `src/lib/decision-words.js`: the titles and answers that don't read well yet.
- Create:
  - `src/lib/components/player/MasterpieceBack.svelte`: the deck's back with its count, drawn from `card-back/masterpiece` (Task 6), or the arts symbol on violet until that art exists;
  - its library section.
- Test: `tests/client-prompts-arts.test.mjs` (new).

**Interfaces:**
- Consumes: `masterpieceText` (Task 2) and `incomeRows` (Task 3).
- Produces:
  - `ShelfFace` gains `{ masterpiece: string, title, artwork, text, owner?: { name, seat } }` and `{ deck: 'masterpiece', count }`;
  - `IncomeMat` takes `preview: BuildingId | null`.

- [ ] **Step 1: Write the failing tests.**
  - **`chooseCreate`:** the prompt has a masterpiece shelf of 4 cards, the last the deck with the view's count, and confirms "Take card".
  - **`chooseMasterpiece` at income:**
    - the title says which fires next;
    - every card is on the shelf;
    - it confirms "Fire".
  - **Broadcast:** the title names Broadcast.
  - **Streaming Implants:**
    - a neighbour's card carries their name and seat;
    - Stop is the decline, with the confirm "Stop";
    - two players' same card are two shelf cards.
  - **`chooseInspire`:** each row is a panel option with its building art; it opens the Income tab and confirms "Place tile".
  - **`chooseRefresh`:** the two answers read "Keep them" and "Refresh them".
  - **`chooseScienceDie`:** each die has its body art and confirms "Roll".
  - **The income strip** labels the `'masterpieces'` step "Masterpieces".
- [ ] **Step 2: Run them.** `npx vitest run tests/client-prompts-arts.test.mjs` should fail.
- [ ] **Step 3: Implement** the changes listed under Files.
- [ ] **Step 4: Run the tests and check.** The unit suite and `npm run check` pass.
- [ ] **Step 5: Look at it.** Play an A&A game in the dev server to each choice:
  - create, from Dance;
  - an income turn with 2 masterpieces;
  - inspire.

  Each must match the mockup.
- [ ] **Step 6: Commit.** Message: "Refs #35: shelves and panels for the arts track's choices".

### Task 5: The d20 in the dice tray

**Files:**
- Modify:
  - `src/lib/engine/civs/alchemists.js`: `alchemistsRolled` and `alchemistsBust` carry `scienceDie: 'd20'` on a d20 roll, as `scienceDieRolled` does;
  - `src/lib/dice.js`: `DieId` gains `'science-d20'`. `diceOf` picks it from `event.scienceDie === 'd20'`, `faceOf` reads `SCIENCE_D20`, and `distinctFaces` gives its 5 faces;
  - `src/lib/components/board/Die.svelte`: the body by id. The artwork comes from Step 3.
  - `src/lib/art/catalog.js`: `die/science-d20-body`;
  - `tests/art-approved.test.mjs`'s bodies list.
- Create: `tools/art/drawings/die/science-d20-body.js`, from the mockup's draft (scratchpad `d20.mjs`), in the toolkit's drawing format.
- Test:
  - `tests/engine-arts-track.test.mjs`: the Alchemists' d20 events;
  - `tests/client-dice.test.mjs`, or the existing dice test.

- [ ] **Step 1: Write the failing tests.**
  - An Alchemists roll with the d20 emits `scienceDie: 'd20'`.
  - `rollsOf` turns a d20 `scienceDieRolled` landing on arts into `{ die: 'science-d20', face }`, whose `faceOf` is the arts track.
  - A d12 roll is unchanged.
  - `tumbleOf('science-d20', …)` flips among 5 distinct faces.
- [ ] **Step 2: Run them.** They should fail.
- [ ] **Step 3: Implement.** Run `npm run art` and check that only the new SVG is added.
- [ ] **Step 4: Run the tests and check.** The unit suite and `npm run check` pass. The Art area shows the d20 body.
- [ ] **Step 5: Commit.** Message: "Refs #35: the d20 in the dice tray".

### Task 6: The masterpiece card back

**Files:**
- Create: `tools/art/drawings/card-back/masterpiece.js`, in the tapestry and tech backs' format: the arts brush on a violet ground in the card frame.
- Modify:
  - `src/lib/art/catalog.js`;
  - `MasterpieceBack.svelte`, which uses it;
  - the existing card-back test, if any lists the backs.

- [ ] **Step 1: Draw it.** Run `npm run art`, then look at it in the Art area beside the tapestry and tech backs.
- [ ] **Step 2: Run the checks.** The unit suite and `npm run check` pass.
- [ ] **Step 3: Commit.** Message: "Refs #35: a masterpiece card back for the Art area".

### Task 7: How to play's Arts & Architecture section

**Files:**
- Modify: `src/lib/rules-help.js`, with a section `arts-architecture`, `expansion: 'aa'`.
- Test: `tests/client-rules-help.test.mjs`.

The section covers:
- the arts track and its prices;
- create and the masterpiece row;
- masterpieces firing at income turns 2–5, Broadcast and single-use cards;
- inspire;
- the d20;
- A&A's 5 landmark cards, and the players + 1 deal with Plans & Ploys (part 3's hand-off).

It says the arts parts don't apply when the table plays without the arts track.

- [ ] **Step 1: Write the failing tests.**
  - The section shows for an A&A table only.
  - It lists the 5 cards' goals.
  - It stays within the one-screen limit the test already holds sections to.
- [ ] **Step 2: Implement.** Run the tests and `npm run check`; all pass.
- [ ] **Step 3: Commit.** Message: "Refs #35: How to play's Arts & Architecture section".

### Task 8: Browser test, interface record and status

**Files:**
- Create: `tests/browser/arts-architecture.spec.mjs`, with the name pattern of the existing specs.
- Modify:
  - `README.md` ("Current interface");
  - `docs/ui/README.md`;
  - `docs/ui/screens/`: new screenshots from the running game;
  - `docs/status.md`: the M8 line, and a part 4 entry with the calls to revisit;
  - `docs/architecture.md`: the new modules;
  - the design's §4: the calls made while building.

The browser test:
1. creates a hot-seat A&A table for 2;
2. starts it;
3. checks the board has the Arts track with its masterpiece row and 3 chips;
4. checks the Civ tab shows a Masterpieces heading;
5. ends the table and leaves it.

- [ ] **Step 1: Write the test.** Run it alone: `PORT=3021 npx playwright test tests/browser/arts-architecture.spec.mjs`. It passes.
- [ ] **Step 2: Run everything.** Run the full unit suite, the simulation, `npm run check`, and the whole e2e suite with `PORT=3021`.
- [ ] **Step 3: Update the interface record.** Take the screenshots from the running game at 1920×1080:
  - the board with the arts track;
  - the Civ tab with masterpieces;
  - the Income tab with an inspired row.

  Then update the README and `docs/ui/README.md`.
- [ ] **Step 4: Record the work.** Update status.md, architecture.md and the design. Commit: "Refs #35: record part 4, the arts track in the client".
