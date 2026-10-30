# The card patterns as data components (#106) Implementation Plan

**Goal:** each card pattern primitive takes its content as data and its state as props, and owns a scoped `<style>`; every civilization card stays pixel-identical.

**Spec:** `docs/superpowers/specs/2026-10-30-card-patterns-design.md`

Each step: tests first in `tests/client-card-patterns.test.mjs` (FAIL), then the component, `CivilizationCard`, its library section and README row; then `npm run check`, `npm run test:unit`, Prettier, and the screenshots and computed styles of every civilization card (review page in both states, the library's `CivilizationCard` section) compared with the baseline; one commit `Refs #106: …`.

### Task 0: Baseline

- [ ] Screenshots and computed styles of every civilization card on main, from a production build.

### Task 1: Text and effect boxes

- [ ] `CardResource`: own style, `fine`, `--card-resource-center` and `--card-resource-height`.
- [ ] `CardClarity`: its paragraph, `setup`, `above`, `minHeight`.
- [ ] `CardEffectBox`: `title`, `gain`, `label`, `symbolText`; new `CardEffectList` with `above`.

### Task 2: Score ladder, token reserve, technology transfer

- [ ] `CardScoreLadder` `steps`, `current`, `label`, `noun`, `kind`; the Isolationists' score uses it.
- [ ] `CardTokenReserve` and `CardTechnologyTransfer` styles.

### Task 3: Terrain rewards — `rows`

### Task 4: Prediction tracks — `categories`

### Task 5: Reward columns — Craftsmen and Merrymakers `columns`

### Task 6: Path grid — `heads`, `spaces`, `links`, `current`

### Task 7: Placement rows — `items` for the five kinds

### Task 8: Clean-up

- [ ] `CardSlot` `filled`; `CardFrame` `plain`; library sections without the fake frame; dead rules out of `card-patterns.css`.
- [ ] card-design-rules.md, docs/architecture.md, docs/status.md; `Fix #106: …` once the owner has checked the gallery.
