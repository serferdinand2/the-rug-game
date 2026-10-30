# Tinting a button by track through Button (#117) Implementation Plan

**Goal:** `Button` takes a track `tint`; `DecisionPanel` and `TurnBar` stop restyling it; the bars' 18% and 3 px are tokens.

**Spec:** `docs/superpowers/specs/2026-10-30-button-tint-design.md`

## Global Constraints

- docs/conventions.md throughout; `npm run check` clean; Prettier on the changed files only.
- Nothing on screen changes: the affected library sections are pixel-identical before and after.
- Other issues are being built in parallel: touch only Button, DecisionPanel, TurnBar, their library sections, tokens.css and the components README.

### Task 1: Tests first

- [x] `tests/styles.test.mjs`: Button's `tint`; no component restyles Button from outside; the bars' tokens.
- [x] Run them: FAIL (3).

### Task 2: Button and the tokens

- [x] `tint` prop, `--rg-button-tint`, `rg-button--tinted`; the primary and confirm rules.
- [x] `--track-bar-mix` and `--track-bar-band` in `tokens.css`.

### Task 3: The bars

- [x] `DecisionPanel`: `tint` on Confirm, drop the `:global` rules and the class; use the tokens.
- [x] `TurnBar`: the `actions` snippet gets the tint; drop the `--action` override; use the tokens.

### Task 4: The library and the index

- [x] Button's section: primary and confirm tinted by each track, and a disabled tinted Confirm.
- [x] TurnBar's section: the optional examples pass the tint on.
- [x] `src/lib/components/README.md`: Button's and TurnBar's rows.

### Task 5: Check

- [x] `npm run check`, the Vitest files, the library browser test.
- [x] Before and after screenshots and computed looks of the DecisionPanel and TurnBar sections: identical.
