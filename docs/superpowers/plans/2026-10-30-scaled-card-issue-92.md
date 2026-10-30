# Scale cards one way (#92) Implementation Plan

**Goal:** one `ScaledCard` scales every card from `CARD_SIZES`, no caller types a card's size, and the shelf lays its cards out with `CardFan`.

**Spec:** `docs/superpowers/specs/2026-10-30-scaled-card-design.md`

## Global Constraints

- docs/conventions.md throughout; `npm run check` clean; Prettier on the changed files only.
- Nothing on screen changes: every card keeps its size, place and look, on every screen and in the library.
- Keep clear of the parallel M13 work: `LandmarkPiece` (#111), `TrackBoard` (#120) and `TurnBar` (#122).

### Task 1: Tests first

- [ ] `tests/scaled-card.test.mjs`: `CARD_SIZES` against the card styles; `ScaledCard`'s boxes; `CardFan`'s `selected`, `disabled`, `labels`, `look` and `lift`; `CardShelf` through `CardFan`; the source guard.
- [ ] Run it: FAIL.

### Task 2: The parts

- [ ] `src/lib/cards/card-sizes.js` with `CARD_SIZES`.
- [ ] `src/lib/components/player/ScaledCard.svelte`, its library section and README row.
- [ ] `CardFan`: `selected` as one or several, `disabled`, `labels`, `look`, `lift`; the hand's rules under `--hand`; its library section shows the shelf look.

### Task 3: The callers

- [ ] `PlayerTabs.svelte`: the hand, the era card, the tech rows and the display in `ScaledCard`; the Civ tab's `--civ` box; drop `--scale` and `--scaled`.
- [ ] `PlayersOverview.svelte`: tech cards in `ScaledCard`; drop `--scale` and `--scaled`.
- [ ] `CardShelf.svelte`: one `CardFan` with the shelf look; tapestry, tech and civilization cards in `ScaledCard`; drop `SCALED`, `CIV_WIDTH`, `--scaled`, `--fit` and the fan's copy.
- [ ] Delete `ScaledTapestryCard` and its section; update the README rows and docs/architecture.md.
- [ ] Browser tests: the shelf's buttons are `.rg-card-fan--card`, the scaled tapestry card `.rg-scaled-card`, the Tech tab's box `.rg-scaled-card`.

### Task 4: Verify

- [ ] `npx vitest run tests/scaled-card.test.mjs tests/library.test.mjs`, `npm run test:unit`, `npm run check`, `npm run format` on the changed files.
- [ ] Browser (after merging): setup-prompts, pick-prompts, decision-prompt, card-layouts, player-area, explore-prompt, library, civ-card.
- [ ] Commit `Fix #92: …`.
