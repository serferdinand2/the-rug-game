# Hand CardShelf resolved card faces (#118) Implementation Plan

**Goal:** the shelf draws faces resolved once in `prompts.js`, the deck back and a mat's face are components, and `fitScale` replaces `civFit`.

**Spec:** `docs/superpowers/specs/2026-10-30-card-shelf-faces-design.md`

## Global Constraints

- docs/conventions.md throughout; `npm run check` clean; Prettier on the changed files only.
- Nothing on screen changes.
- Stay inside `CardShelf`, its faces and the prompt state: #96 adds `CardPreview` in parallel.

### Task 1: Tests first

- [ ] `tests/card-shelf-faces.test.mjs`: `fitScale`, `shelfFace`, `shelfCards`, the two components, `CardShelf` with faces, the source guard.
- [ ] Run it: FAIL.

### Task 2: The model

- [ ] `fitScale` in `src/lib/cards/card-sizes.js`.
- [ ] `shelfFace` and `shelfCards` in `src/lib/prompts.js`.
- [ ] `PromptState`: `shelfCards` from `prompts.js`, a new `pickCards`, and `inspectShelf` / `inspectPick` from `face`.

### Task 3: The components

- [ ] `player/TechDeckBack.svelte` and `player/CapitalMatFace.svelte`, their library sections and README rows.
- [ ] `CardShelf` draws faces with them and `fitScale`; no engine imports.
- [ ] `PromptArt` draws its deck chip with `TechDeckBack`.
- [ ] `DecisionPrompt.svelte` passes `state.pickCards`; the library sections build cards with `shelfFace`.
- [ ] docs/architecture.md and the components README.

### Task 4: Checks

- [ ] `npm run check`; the Vitest files touched; the browser tests `setup-prompts`, `decision-prompt`, `card-layouts`, `library`.
- [ ] Commit "Refs #118" or "Fix #118".
