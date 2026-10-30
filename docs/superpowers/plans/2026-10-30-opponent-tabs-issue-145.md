# Another player's tabs (#145, #143): plan

The design is `docs/superpowers/specs/2026-10-30-opponent-tabs-design.md`, after the owner's ruling of 2026-10-30.

1. **Tests first** (`tests/client-area-inspect.test.mjs`, `tests/client-words.test.mjs`): `nextInspected`, `shownSeat`, `publicSeat`, `handCount`, `areaWords`, `possessive`; then `PlayerTabs` rendered with `svelte/server` for another seat's Hand and Eras tabs. Watch them fail.
2. **`src/lib/area/inspect.js`** and `possessive` in `words.js` until they pass.
3. **`InspectBar`** in `src/lib/components/player/`, its library section and README row; `tests/library.test.mjs`.
4. **`PlayerTabs`**: `viewer`, the guard, read-only, the border, the bar, the words, `onPlayerTabsBack`. The render test passes.
5. **`Game.svelte`** and **`GameHeader.svelte`**: the chip and 1–5 open a player's tabs; Escape and decisions go back; the overview is left unreachable.
6. **Browser test** `tests/browser/opponent-tabs.test.mjs`; `hotkeys.test.mjs` updated.
7. **Docs and screenshots:** `docs/ui/screens/game-overview.png` replaced by `game-opponent-tabs.png` from the running game at 1920×1080; README "Current interface", `docs/ui/README.md`, `docs/architecture.md`, How to play's shortcut words.
8. `npm run check`, the touched Vitest files plus `tests/library.test.mjs` and `tests/styles.test.mjs`, Prettier; commit "Fix #145 … Fix #143".
