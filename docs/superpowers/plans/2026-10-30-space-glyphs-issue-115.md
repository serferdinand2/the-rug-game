# A track space's glyphs as their own component (#115) Implementation Plan

**Goal:** `SpaceGlyphs` draws every glyph of a track space, `TrackSpace` keeps the shell, name, landmark, number and hover, and the shell and fill share one shape per variant.

**Spec:** `docs/superpowers/specs/2026-10-30-space-glyphs-design.md`

## Global Constraints

- docs/conventions.md throughout; `npm run check` clean; Prettier on the changed files only.
- The board stays pixel-identical at every container size.
- Keep clear of #120: no change to `TrackBoard`, `BoardSwitcher` or `ProgressLanes`; in `Track` only the line that passes a space's entry.

### Task 1: The baseline

- [ ] Capture the library's TrackBoard (its own size and five forced sizes), TrackSpace, Track and ExplorationFace sections: element boxes, computed styles and screenshots.

### Task 2: Tests first

- [ ] `tests/space-glyphs.test.mjs`: each glyph kind, counts, the X, the variants; every real space's glyphs come from `SpaceGlyphs`; the source guards.
- [ ] Run it: FAIL.

### Task 3: The component

- [ ] `src/lib/components/board/SpaceGlyphs.svelte`: the snippet's markup, the glyph CSS with `dense` and `bonus` variants, and its container steps.
- [ ] `TrackSpace.svelte`: draw through `SpaceGlyphs`, `plusBefore()`, `--rg-space-glyphs-text`, `--rg-track-space-shape`, the special spaces' `:global()` layout rules; drop the snippet, `iconForWord` and the glyph CSS.
- [ ] `Track.svelte`: `{...entry}`.
- [ ] `tests/browser/track-text.test.mjs`: `.rg-space-glyphs--resource img`.

### Task 4: The library

- [ ] `src/library/sections/board/SpaceGlyphs.svelte` with every glyph kind and the three variants; a row in `src/lib/components/README.md`.

### Task 5: Verify

- [ ] `npx vitest run tests/space-glyphs.test.mjs tests/track-space.test.mjs tests/library.test.mjs tests/styles.test.mjs`, then `npm run test:unit` and `npm run check`.
- [ ] The capture again: identical boxes, styles and screenshots.
- [ ] Commit `Fix #115: …`.
