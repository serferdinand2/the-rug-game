# The scrim, floating surface and disabled look in tokens (#97) Implementation Plan

**Goal:** the scrims, the floating surface and the disabled look come from tokens, `Button` owns its `aria-disabled` look, and `Panel` sets its heading font.

**Spec:** `docs/superpowers/specs/2026-10-29-shared-looks-design.md`

## Global Constraints

- docs/conventions.md throughout; `npm run check` clean; Prettier on the changed files only.
- Pixel-identical except the pass screen's dimmed take button; the hidden-text part is left out (owner's screen-reader ruling).

### Task 1: Before

- [ ] Screenshot the seven library sections and the landing page (reduced motion, animations off), twice, to check the capture is deterministic.

### Task 2: Tests first

- [ ] `tests/styles.test.mjs`: the tokens, the source guard, `Button`'s `aria-disabled` rule.
- [ ] `tests/ui.test.mjs`: `Panel`'s `titleFont`.
- [ ] Run them: FAIL.

### Task 3: Tokens and components

- [ ] `tokens.css`: `--scrim`, `--scrim-strong`, `--float-surface`, `--opacity-disabled`.
- [ ] `DecisionPanel`, `Dialog`, `Game.svelte`, `DiceTray`, `Button`, `Segmented`, `PassScreen`.
- [ ] `Panel` `titleFont`, its library section; `Landing` and `Lobby`.

### Task 4: Verify

- [ ] Screenshot again and compare byte for byte; only PassScreen may differ, in its take button.
- [ ] `npx vitest run tests/styles.test.mjs tests/ui.test.mjs tests/library.test.mjs`, `npm run check`.
- [ ] Browser: `lobby`, `pass-screen`, `dialogs`, `decision-prompt`, `library`.
- [ ] Commit `Fix #97: …`.
