# The lobby's choices in lobby.js, and one PlaySettings (#98): design

Written 2026-10-28. #98 is one of the refactors the client scan (#80) filed. The issue's proposed solution is the brief; every decision it leaves open is marked **(my call)**.

## 1. What and why

`Lobby.svelte` builds its choice lists and lock rules inline (`MODES`, `YES_NO`, `UNDO`, `RULES_COLORS`, `RULES_ORDER`, the rules sort, the variant rows, the mode's tooltip), labels expansions by their raw code, and styles `SettingRow`'s root from outside. The turn timer and undo rows are drawn twice, in the lobby and in the in-game Table settings, with `UNDO` copied. Lists and rules are logic, so they move to `src/lib/lobby.js` with tests, and one component draws the play settings in both places. #31 (solo and the Automa level) then edits one list and one component.

**Done when** the lists and lock rules have Vitest tests, the lobby and Table settings draw the timer and undo with `PlaySettings`, and the lobby browser test passes.

## 2. lobby.js

- `modeChoices(modes)`: the server's `config.modes`, in its order, labelled "Online mode" and "Local mode"; an unknown mode reads "<Mode> mode", so #31's solo shows before it gets its own words **(my call)**.
- `modeLock(room)` and `settingsLock(room)`: why the viewer can't change the mode or the table, or `null` when they can. The mode: "The mode changes only while you are alone at the table." for the host, "Only the host changes the mode." for a guest. The table: "Only the host changes the table." `settingsLock` is not in the issue's list; it is the lobby's other lock rule **(my call)**.
- `rulesChoices(versions)`: current rules first, short labels, the science and technology colours.
- `expansionChoices(codes)`: each code named from the art catalog's `EXPANSIONS` (no more raw codes) in its expansion colour token **(my call: the tokens the library already uses; #101 then gives every expansion badge one name and colour)**. Nothing shows until an expansion is built.
- `variantRows(config, room)`: each variant's short title, full name and `yes`/`no`; `toggleVariant(variants, id, on)` builds the new list.
- `UNDO_CHOICES` and `YES_NO_CHOICES`, upper-case as the conventions name fixed data **(my call: the issue says `undoChoices`)**; `timerChoices` gains its colour.
- `seatSlots` gains a `closed` state: an empty seat the viewer can't open (a hot-seat table they don't host).

## 3. Components

- `src/lib/components/lobby/PlaySettings.svelte`: props `timers`, `timer`, `undo`, `disabled`, `title`; fires `onPlaySettingsChange` with `{ timer }` or `{ undo }`, which the lobby and Table settings pass to `store.settings`. Its root is `display: contents`, so its two rows take the parent's spacing: the lobby column's gap and the dialog's **(my call)**. A library section and a README row.
- `SettingRow` gains `divided` (a soft rule under the row), replacing the lobby's `:global` rule; the lobby sets it on every variant row but the last.
- `SeatCard` gains the `closed` state: the empty seat's plain surface, with no button, as the lobby's fallback `div` drew it.
- `TableSettings.svelte` only swaps its two rows for `PlaySettings`; its dialog shell stays for #87.
- The optional `src/screens/lobby/LobbySettings.svelte` split is left out, to keep the change small while #31, #101 and #102 build on the lobby **(my call)**.

## 4. What changes on screen

The timer and undo rows now sit together: **Undo rules moves from the top of the right column to the left column, under Turn timer**, and the right column holds only the variants, so the settings panel is 43px shorter at 1920×1080 (226px instead of 269px). One component can't put its two rows in two columns. Screenshots before and after show the Table settings dialog, the seats and every other part of the lobby pixel for pixel the same. This needs the owner's approval.

## 5. Tests

- `tests/client-lobby.test.mjs`: each new function, the `closed` slot, and the coloured timer choices.
- `tests/browser/lobby.test.mjs` (new): a hot-seat lobby shows the settings; Turn timer, Undo rules and a variant change the table through the server; in the game, Table settings changes the timer and undo too. It ends and leaves its table.
