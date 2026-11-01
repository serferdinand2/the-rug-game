# Landmark offers (#63) Implementation Plan

> **For agentic workers:** Use this plan task-by-task in the current session.

**Goal:** Show each available landmark's footprint on its track space and its technology card's square benefit, and preserve the larger shared hover detail.

**Architecture:** A small `LandmarkFootprint` component renders a labeled `LandmarkShape` from the canonical landmark catalog. `TrackLandmark` composes that diagram with its name and is used by both `TrackSpace` and `ExplorationFace`; `TechnologyCard` places the same diagram beside each landmark benefit. `trackBoard()` already removes taken landmarks, so the inline diagrams follow game state without special UI state.

**Tech Stack:** Svelte 5, JavaScript/JSDoc, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-01-landmark-offers-design.md`

## Global Constraints

- Read and reuse canonical `LANDMARKS` and `FOOTPRINTS` data.
- Do not change game rules or card dimensions.
- Keep the landmark-granting tech card's invention artwork and existing gray tooltip behavior.
- Keep available/taken display driven by `trackBoard()` data.

## Review Focus

- All 12 track offers show the matching shape; taken offers show neither name nor shape.
- All six landmark technology cards show the matching diagram inside the square benefit; non-landmark cards and circle benefits do not.
- The large full-card and track-hover details remain present and name/footprint accessible.
- The 4×4 Rubber Works diagram and long landmark names fit at the 1920×1080 game layout.

---

### Task 1: Add failing coverage for track and card offers

**Files:**
- Create: `tests/client-landmark-offers.test.mjs`
- Modify: `tests/client-footer.test.mjs`
- Modify: `tests/browser/track-text.test.mjs`

- [x] Assert every one of the 12 unowned track landmark entries has its canonical ID/name/footprint; after removing one from `view.landmarks`, that track entry no longer contains its offer.
- [x] Render each of the six landmark technology cards and assert the square effect contains that card's canonical diagram and accessible landmark/dimension label; assert a non-landmark card has no diagram and the circle benefit has none.
- [x] Add selected-footer data coverage and browser bounds/accessibility checks for in-tile footprints.

### Task 2: Build shared inline diagrams and track labels

**Files:**
- Create: `src/lib/components/player/LandmarkFootprint.svelte`
- Create: `src/lib/components/board/TrackLandmark.svelte`
- Create: `src/library/sections/player/LandmarkFootprint.svelte`
- Create: `src/library/sections/board/TrackLandmark.svelte`
- Modify: `src/lib/components/board/TrackSpace.svelte`
- Modify: `src/lib/components/board/ExplorationFace.svelte`
- Modify: `src/lib/components/player/TechnologyCard.svelte`
- Modify: `src/styles/card-layouts.css`

- [x] `LandmarkFootprint` accepts a landmark ID, optional plot size/gap, and SVG attributes; it resolves the canonical footprint and renders `LandmarkShape` with the picture, per-plot outlines, and an accessible dimensions label.
- [x] `TrackLandmark` displays the footprint and name in a compact centered row sized to fit track spaces.
- [x] `TrackSpace` and `ExplorationFace` use `TrackLandmark` for available offers and keep the existing hover contract.
- [x] `TechnologyCard` inserts the diagram only in each landmark card's square benefit; existing invention art and hover target remain.
- [x] Add the two-column square-benefit layout without changing card dimensions.
- [x] Add component-library sections, update component documentation, and run focused tests plus `npm run check`.

### Task 3: Update the gallery and documentation

**Files:**
- Modify: `src/lib/components/README.md`
- Create: `src/library/sections/board/TrackLandmark.svelte`
- Create: `src/library/sections/player/LandmarkFootprint.svelte`
- Modify: `src/library/sections/board/TrackSpace.svelte`
- Modify: `src/library/sections/player/LandmarkShape.svelte`
- Modify: `src/library/sections/player/TechnologyCard.svelte`
- Modify: `src/library/sections/prompts/TurnBar.svelte`

- [x] Document the reusable components and update the `TrackSpace`/`TechnologyCard` rows.
- [x] Add library sections with Lighthouse, Academy and irregular 4×4 Rubber Works examples; the existing TechnologyCard gallery renders the inline diagram and hover detail.
- [ ] Capture and add a README screenshot showing landmark offer footprints. Local browser access to the Vite port is denied in this environment; do not substitute a fabricated image.

### Task 4: Verify and land

- [x] Run `npm run check`, focused Vitest files, the footprint-art tests, and a production build.
- [ ] Push the branch and inspect the project's CI workflow; fix any issue-specific failure before merging.
- [ ] Inspect GitHub CI logs and fix any failure before merging.
- [ ] Merge the branch to `main`, then close #63 as completed and update `docs/status.md` in the same merge.
