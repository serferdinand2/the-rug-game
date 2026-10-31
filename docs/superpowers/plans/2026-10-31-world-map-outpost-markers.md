# World Map Outpost Markers Implementation Plan

> **For agentic workers:** Implement this plan natively in the current worktree. Steps use checkbox syntax for tracking.

**Goal:** Replace square map outposts with the approved player flag artwork and give each player's starting capital a wide fortress-and-flag marker.

**Architecture:** `mapHexes` identifies capital starts from public mat data and adds visual metadata only. `mapView` combines the two starting outpost markers into one wide capital marker; `WorldMap` renders the catalogued player SVGs. Engine state and rules are untouched.

**Tech Stack:** JavaScript with JSDoc, Svelte 5, SVG, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-31-world-map-outpost-markers-design.md`

## Global Constraints

- Keep game logic and accessibility labels unchanged.
- Use project SVG and Svelte conventions.
- Preserve the existing working tree edits.

## Review Focus

- Both large and small map capital starts map to the correct hex.
- During a small-map mat pick, the public starting-hex marker must not reveal which mat the player selected.
- Toppled non-capital outposts use the toppled asset and retain Nomads marks.
- Capital width includes the gap between the two original spots and remains centered.
- Map data still reports both starting outposts for screen readers and rules.

---

### Task 1: Capital metadata and geometry

**Files:**
- Modify: `src/lib/hexmap.js`
- Test: `tests/client-hexmap.test.mjs`

- [ ] Add tests for both map sizes, unchanged outpost labels/data, and the combined capital piece's width and center.
- [ ] Run the focused test and observe the expected failure.
- [x] Implement visual-only capital identification from the public setup event and combine the two starting spots in `piecesOn`.
- [ ] Run the focused test to green; Vitest currently fails before loading suites because its shared `node_modules` junction denies cache writes.

### Task 2: Artwork and rendering

**Files:**
- Create: five `static/art/piece/capital-fortress-{color}.svg` variants.
- Modify: `src/lib/art/catalog.js`, `src/lib/ui.js`, `src/lib/components/board/WorldMap.svelte`, `src/lib/components/README.md`.
- Test: `tests/client-hexmap.test.mjs` plus focused component/render validation.

- [ ] Add catalog and URL helper coverage for capital art and existing flag art.
- [x] Add the hand-drawn pixel SVG fortress variants and catalog entries.
- [x] Render capital, standing, and toppled art with their correct player colors; remove the old square markers.
- [x] Format changed files. Focused tests and type check remain pending; Vitest fails before suites start at a denied `node_modules` cache write.
