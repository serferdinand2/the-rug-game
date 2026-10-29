# Tech and tapestry cards in Svelte from the engine's data (#108) Implementation Plan

**Goal:** no `{@html}` in the card components; the library shows the engine's text; the gallery stays pixel-identical.

**Spec:** `docs/superpowers/specs/2026-10-29-svelte-cards-design.md`

### Task 1: Baseline and tests first

- [ ] Screenshots of every tech and tapestry card on the gallery and the library.
- [ ] `client-game-cards`: server-rendered markup, `tapestryTiming`, the guard; the browser test's class names. Run them: FAIL.

### Task 2: The cards

- [ ] `TechnologyCard` and `TapestryCard` as Svelte markup with `--` classes; `card-layouts.css` renamed; the typedefs and `tapestryTiming` in `game-cards.js`.
- [ ] The static mockup's own `card-markup.js` and `card-layouts.css`; delete `card-layouts.js`; the library sections from engine data.

### Task 3: Verify

- [ ] Screenshots after: the gallery identical. `npm run test:unit`, `npm run check`, the browser tests.
- [ ] docs/architecture.md, docs/status.md, card-design-rules.md; commit `Fix #108: …`.
