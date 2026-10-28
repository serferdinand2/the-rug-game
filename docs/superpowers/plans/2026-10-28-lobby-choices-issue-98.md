# The lobby's choices in lobby.js, and one PlaySettings (#98) Implementation Plan

**Goal:** The lobby's choice lists and lock rules live in `src/lib/lobby.js` with tests, and one `PlaySettings` component draws the turn timer and undo in the lobby and in Table settings.

**Spec:** `docs/superpowers/specs/2026-10-28-lobby-choices-design.md`

## Constraints

- Only `TableSettings.svelte`'s two rows change; its dialog shell is #87's.
- Don't touch the files other streams own (the brief's list, and the board files).
- The only visible change is Undo rules joining Turn timer in the left column; report it.

## Tasks

1. **Browser test first.** `tests/browser/lobby.test.mjs`: create a hot-seat table through the API, open the lobby, change Turn timer, Undo rules and Tapestry draft and read the table back; start, open Table settings from the menu, change both, read back; end and leave. Run it through the local config: it passes on today's code (it pins behaviour, which the refactor keeps).
2. **Unit tests first.** In `tests/client-lobby.test.mjs`: `modeChoices`, `modeLock`, `settingsLock`, `rulesChoices`, `expansionChoices`, `variantRows`, `toggleVariant`, `UNDO_CHOICES`, `YES_NO_CHOICES`, the coloured `timerChoices` and the `closed` slot. Run: FAIL.
3. **lobby.js.** Implement them with JSDoc. Run: PASS.
4. **Components.** `PlaySettings` (with its library section and README row); `SettingRow`'s `divided` and `SeatCard`'s `closed` (their library sections show them).
5. **Screens.** `Lobby.svelte` reads every list and rule from `lobby.js`, draws `PlaySettings` under Expansions, `divided` variant rows and `closed` seats, and drops its `:global` rule and fallback seat. `TableSettings.svelte` swaps its rows for `PlaySettings`.
6. **Check.** `npm run check`, `tests/client-lobby.test.mjs`, `tests/library.test.mjs`, `tests/styles.test.mjs`, the new browser test, `library.test.mjs` and `game.test.mjs` in the browser; screenshots before and after at 1920×1080.
7. **Commit** `Fix #98: …`.
