# One card band and edition chip across the card families (#109) Implementation Plan

**Goal:** every card family uses `CardBand` and `CardEdition`, and each edition chip has its expansion's colour (owner's choice: one chip, Fantasies & Futures teal).

**Spec:** `docs/superpowers/specs/2026-10-29-card-band-design.md`

### Task 1: Decide and baseline

- [ ] Mockup `docs/ui/edition-chips.html` and its screenshot; the owner's decision.
- [ ] Screenshots of every card, each alone, on main.

### Task 2: Tests first

- [ ] `tests/client-card-band.test.mjs`: the colours and tokens, the chip, the band, every family's chip, the guard. Run: FAIL.

### Task 3: The components

- [ ] Tokens; `cardEditionColor`; `CardBand` and `CardEdition` with library sections and index rows.
- [ ] `CardFrame` (`editions`), `CivilizationCard`'s branches, the tech, tapestry, landmark and masterpiece cards; the gallery's codes.
- [ ] The four stylesheets trimmed to layout; `__` to `--`.

### Task 4: Verify

- [ ] Each card alone, after: only the intended changes. `npm run check`, `npm run test:unit`, the browser tests.
- [ ] README screenshots; card-design-rules.md, docs/ui/README.md, docs/architecture.md, docs/status.md; commit `Fix #109: …`.
