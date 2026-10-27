# The player area and the players overview (#27) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The play screen's right quarter shows the player's capital, hand, income mat, eras, civilizations, tech and terrain, and the header chips open the players overview with a drill-down for any player.

**Architecture:** Plain, tested view modules in `src/lib/area/` turn a seat of the game view into what each tab draws; real tech and tapestry card data come from the engine through `describe.js` (`src/lib/cards/game-cards.js`). New components (`IncomeMat`, `EraSlots`, `TerritoryTile`, `CardFan`) and an overhang-aware `CapitalGrid` draw them. `src/screens/game/PlayerTabs.svelte` and `PlayersOverview.svelte` compose them in `Game.svelte`.

**Tech Stack:** Svelte 5 (runes), Vite 8, Node 22 ES modules with JSDoc, `node:test`.

**Spec:** `docs/superpowers/specs/2026-10-27-player-area-design.md`

## Global Constraints

- CONVENTIONS.md: JSDoc, braces, Prettier on touched files only (never `npm run format`), `npm run check` 0/0, colours only from tokens, BEM `rg-{name}--{part}` classes, `on{Component}{Action}` with `ComponentEvent`, a library section and a README row for every new or changed component.
- No card or civilization text is invented: every word comes from the engine's data through `src/lib/describe.js`.
- Engine imports go through `src/lib/engine/game.js` or data modules (never a civilization module first).
- Commits `Refs #27: …`, the last `Fix #27: …`, each ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

- An opponent's capital, tech and civilization in the overview: drawn from that seat of the viewer's view, with no hand.
- A landmark hanging over the capital's edge: drawn over the edge, not clipped or moved.
- A card played face down in an era slot: shown as face down to everyone, its owner included.
- A seat whose civilization has no reviewed recipe: the plain card, no invented text.
- A decision opening the right tab while the player had chosen another one by hand.

---

### Task 1: Real tech and tapestry cards

**Files:** Create `src/lib/cards/game-cards.js`, `tests/client-game-cards.test.mjs`. Modify `src/lib/components/player/TechnologyCard.svelte`, `TapestryCard.svelte`, `src/lib/cards/card-layouts.js` (markup from data), their library sections.

**Produces:** `techCardData(id) → TechnologyCardData`, `tapestryCardData(id) → TapestryCardData` (the shapes `card-layouts.js` already uses: title, art, circle, square, track?, level?, innovation?; title, art, timing, copy, note?, trap?). `TechnologyCard` and `TapestryCard` take `id` (fixture) or `data`.

- [ ] Tests: every id in `TECH_CARDS` and `TAPESTRY_CARDS` builds data with non-empty text and no "undefined" or "[object"; Clocks reads its prerequisite as Technology 2 like the fixture; a trap is `trap: true` with the response timing; the art path exists in `static/art/`.
- [ ] Implement; the markup functions take data; the components accept `data`; the library sections show a few real cards next to the fixtures.

### Task 2: The capital

**Files:** Create `src/lib/area/capital.js`, `tests/client-area-capital.test.mjs`. Modify `src/lib/components/player/CapitalGrid.svelte` (pieces that hang over the edge) and its section.

**Produces:** `capitalView(seat, code) → { mat, name, biome, terrainSeed, plots, pieces, counts, besideMat }`: plots from the engine's `cityPlots`, pieces from `capital.landmarks` (locked, with their footprints from `src/lib/art/footprints.js` and names), counts of complete rows, columns and districts from the engine, biome from the mat's name (lower case), the seed a number from the table code, and beside-the-mat names; null before a mat is dealt.

- [ ] Tests: on a dealt game the plots equal `cityPlots(seat)`; a landmark placed at row 7 with a 3-wide footprint keeps its row and col; counts match `completeLines`/`completeDistricts`; null before setup deals a mat.
- [ ] `CapitalGrid`: a piece whose turned shape runs past the grid is drawn over the edge (the grid's container doesn't clip it), only the in-grid cells count for the overlay; library example with an overhanging Lighthouse-sized piece.

### Task 3: The income mat and the eras

**Files:** Create `src/lib/area/income.js`, `tests/client-area-income.test.mjs`, `src/lib/components/player/IncomeMat.svelte`, `EraSlots.svelte` and their sections.

**Produces:** `incomeRows(seat) → { building, spaces: { name, reward, covered }[] }[]` (from `INCOME_MAT` and `incomeMat.buildings`: with n buildings left in a row, the first 6 − n spaces are exposed; rewards in words through `describe.js`); `eraSlots(seat) → { era, card: string | null, faceDown, active }[]` (era 1 printed "Maker of Fire"; slots 2–4 from `incomeMat.tapestry`, a null top card is face down; active from `seat.era`). `IncomeMat` props `rows`, `era`; `EraSlots` props `slots`, `selected`, `onEraSlotsSelect`.

- [ ] Tests: a dealt seat has every space covered but the first of each row; removing two markets exposes three; a face-down card reads face down; the active era is marked.
- [ ] Components in the mockup's look; library sections from fixtures.

### Task 4: Terrain tiles and overlapping cards

**Files:** Create `src/lib/area/terrain.js`, `tests/client-area-terrain.test.mjs`, `src/lib/components/player/TerritoryTile.svelte`, `src/lib/components/player/CardFan.svelte` and their sections.

**Produces:** `terrainView(seat) → { territories: { id, corners, island }[], space: { id, explored }[] }` (from `TERRITORY_TILES` and the seat's `territoryTiles`, `spaceTiles`, `exploredSpace`); `TerritoryTile` (one small flat-topped hex drawn with `hexmap.js`'s wedges and island, and its number) ; `CardFan` (children cards overlapping by a set amount; hover or focus raises one; `onCardFanInspect` with the index for a full view).

- [ ] Tests: territory tiles carry their corners and islands from the data; space tiles split held and explored.
- [ ] Components and library sections (a fan of 4 tapestry fixture cards; territory tiles 1, 17 and an island tile).

### Task 5: The player tabs and tab switching

**Files:** Create `src/screens/game/PlayerTabs.svelte`, `src/lib/area/tabs.js`, `tests/client-area-tabs.test.mjs`. Modify `src/screens/Game.svelte`.

- [ ] `tabFor(decision) → tab id | null` per spec §5, tested.
- [ ] The seven tabs with the Hand count, each drawing its view; the Civ tab with recipes for reviewed civilizations and the plain card otherwise; Your overview below; tab switching on a new decision.

### Task 6: The players overview

**Files:** Create `src/screens/game/PlayersOverview.svelte`, `src/lib/area/players.js`, `tests/client-area-players.test.mjs`. Modify `Game.svelte` (chips open it, the footer closes it).

- [ ] `playerCards(view, viewer, host) → PlayerCard props[]` tested (no hand for opponents, counts only).
- [ ] The overview with the drill-down (Capital, Civilization, Tech) for any player.

### Task 7: Walkthrough, screenshots and documents

- [ ] Two tabs mid-game: every tab, the overview with an opponent's capital, tab switching on an invent or a placement.
- [ ] Screenshots into `docs/ui/screens/`; README and `docs/ui/README.md`; CLAUDE.md #27 entry, Architecture, Next.
- [ ] Commit `Fix #27: …`.
