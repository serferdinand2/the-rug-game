# Lifting a building off the income mat (#142) Implementation Plan

**Goal:** pointing at, or tabbing to, a building on the income mat lifts it straight up and shows the printed space under it.

**Spec:** `docs/superpowers/specs/2026-10-31-income-lift-design.md`

## Global Constraints

- docs/conventions.md throughout; `npm run check` clean; Prettier on the changed files only.
- Option A at 220 ms, as the owner chose; motion and colours from tokens; reduced motion fades.

### Task 1: Tests first

- [ ] `tests/client-income-mat.test.mjs`: the source guard of §4.
- [ ] `tests/browser/library.test.mjs`: rest, hover, focus, `lifted` and reduced motion.
- [ ] Run them: FAIL.

### Task 2: The component

- [ ] `IncomeMat.svelte`: the printed space under a cover, the shadow and the building; `tabindex` on covered spaces; the `lifted` prop; the lift and the reduced-motion fade; drop the row tint.

### Task 3: The library and docs

- [ ] The IncomeMat section: an example with `lifted`, and the description.
- [ ] The README row in `src/lib/components/README.md`.
- [ ] The README's current interface: a screenshot of the Income tab with a building lifted, from the running game.
- [ ] `docs/ui/README.md`: the mockup's row. `docs/status.md`: the entry and summary.

### Task 4: Verify

- [ ] `npm run test:unit`, `npm run check`, `PORT=3021 npm run test:e2e`.
- [ ] Commit `Fix #142: …` on `issue-142-income-lift`.
