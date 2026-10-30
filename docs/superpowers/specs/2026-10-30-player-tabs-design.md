# PlayerTabs split into tab parts (#95): design

Written 2026-10-30. #95 follows #94, #112, and the other refactors that changed
the same screen. The refactor keeps the current interface and decision flow.

## 1. What and why

`PlayerTabs.svelte` owns all seven player tabs and the capital placement state.
This couples unrelated work: a change to terrain choices or era cards means
editing the same screen as landmark placement. The capital's landing rules also
live in the component, despite being pure calculations that can be tested
without a browser.

**Done when** Capital, Tech, Eras, and Terrain each have a screen part; placement
derivations and landing choices are pure functions with focused tests; and the
existing capital, player-area, and explore browser tests pass without changing
the interface.

## 2. Screen parts

Add `CapitalTab.svelte`, `TechTab.svelte`, `ErasTab.svelte`, and
`TerrainTab.svelte` under `src/screens/game/`. They receive only the data and
callbacks their tab needs. `PlayerTabs` keeps the seven-tab row and the Hand,
Income, and Civ panels inline.

The moved markup keeps its existing elements, class names, order, and styles.
Each part uses a `display: contents` root so the `Tabs` panel retains its
current layout. `PlayerTabs` continues to sanitize another player's view and
does not pass private choices or callbacks to a read-only tab.

`ErasTab` receives the selected era as a bindable value. `PlayerTabs` retains
that small piece of selection state because the tab panel unmounts inactive
content; moving it into the conditional component would reset the selection
whenever the user visits another tab. The selected era still resets when the
active era or viewed seat changes.

## 3. Placement helpers

Extend `src/lib/area/placement-targets.js`, the home of the existing
engine-options-only placement logic:

- `centredCorner(footprint, rotation, row, col)` returns the landmark's
  top-left corner when a clicked plot is its centre.
- `landingIndex(options, landmark, at, placed)` chooses the nearest legal
  option for a click, retaining a placed landmark's rotation and preferring
  rotation zero for a landmark from the tray.
- `capitalPlacement(capital, placement, fresh)` returns the values CapitalTab
  needs: the pending building or landmark, picked plot, building targets,
  landmark positions, preview, placed and fresh pieces, and tray contents.
  The tray's initial position uses the capital grid size rather than a literal
  coordinate.

These functions use `landmarkPositions`, `optionAt`, `plotTargets`, `legalNear`,
`placeNear`, and `placingPiece`. The engine's options remain the only source of
legal positions (#112); no geometry is duplicated from `CapitalGrid`.

Add `defaultEra(slots)` to `src/lib/area/income.js`. It returns the active slot,
otherwise the latest slot with a card, otherwise `null`. `ErasTab` uses it for
the card shown before the player selects a slot. The Income tab continues to
receive the current era from `selfSummary`.

## 4. Tests

- Extend `tests/client-area-placement.test.mjs` for centered corners, legal
  landing indices, and `capitalPlacement` for no placement, buildings,
  landmarks, fresh pieces, and tray state.
- Extend `tests/client-area-income.test.mjs` for `defaultEra`'s active,
  latest-card, and empty-slot cases.
- Run the existing capital, player-area, and explore browser tests to verify
  tab selection, placement, tile picking, and rendering are unchanged.

## 5. Documentation

Document the four screen parts and the pure placement helpers in
`docs/architecture.md`, and record #95 in `docs/status.md` when it lands.
Because this is a visual-preserving refactor, the README screenshots do not
change.
