# What the World Map draws on each hex (#114) Implementation Plan

**Goal:** a tested `mapView()` in `hexmap.js` gives every hex what `WorldMap` draws, and one "up to N VP" phrase serves `WorldMap` and `TilePicker`.

**Spec:** `docs/superpowers/specs/2026-10-30-world-map-view-design.md`

## Global Constraints

- docs/conventions.md throughout; `npm run check` clean; Prettier on the changed files only.
- Nothing on screen changes: `WorldMap`'s server-rendered HTML stays byte-identical, and the map's browser tests pass unchanged.
- Leave `words.js` alone: the Words and names issues edit it in parallel.

### Task 1: Tests first

- [ ] `tests/client-hexmap.test.mjs`: `mapView` with nothing asked, targets, scores, the selected hex, the preview, fresh hexes, pieces and another size; `upToVp`; the source guard for `WorldMap` and `TilePicker`.
- [ ] Save `WorldMap`'s server HTML in several states, for the comparison in Task 4.
- [ ] Run them: FAIL.

### Task 2: The module

- [ ] `MapPreview`, `MapAsk`, `MapPiece`, `MapTag` and `MapViewHex` typedefs in `hexmap.js`.
- [ ] Move `TAG` and `MARKS` there; `upToVp`, `mapView`, with the private `addWords`, `scoreTag` and `piecesOn`.

### Task 3: The components

- [ ] `WorldMap.svelte`: `drawn` from `mapView`, the outline layer from `outlined` and `focused`, the markup reading `label`, `selected`, `dimmed`, `pulses` and `tag`; drop `TAG`, `MARKS`, `addWords`, `pieces()` and the unused imports; type `preview` with `MapPreview`.
- [ ] `TilePicker.svelte`: its label with `upToVp`.
- [ ] `docs/architecture.md` and `src/lib/components/README.md` name `mapView`.

### Task 4: Verify

- [ ] The saved HTML matches byte for byte.
- [ ] `npx vitest run tests/client-hexmap.test.mjs tests/tile-picker.test.mjs`, `npm run test:unit`, `npm run check`.
- [ ] Browser: `explore-prompt`, `hotkeys`.
- [ ] Commit `Fix #114: …`.
