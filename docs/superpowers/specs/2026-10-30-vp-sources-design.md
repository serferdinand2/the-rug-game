# One VP sources list for the scoreboard and the standings (#104): design

Written 2026-10-30. Decisions not taken from the issue are marked **(my call)**.

## 1. What and why

The log's `ScoreBoard` and the results' `StandingRow` each drew the same `<dl>` of `row.sources` (a label and "N VP" per source) with their own copy of its CSS, and `ScoreBoard` worded the tiebreak line ("Tallest landmark: Skyscraper · 7 resources", with the plural) in its template. #31 would add the Automa's row to both, in two copies.

**Done when** both components draw their sources with one `VpSources` component, the tiebreak line comes from `results.js` with a test, and nothing on screen changes.

## 2. `VpSources`

- `src/lib/components/results/VpSources.svelte`, props `sources` (`SourceLine[]` from `vpBreakdown`), `columns = 1 | 2` and `empty` (default `''`), plus `{...attr}` on its root.
- With sources it draws the `<dl class="rg-vp-sources">`; `columns={2}` adds `rg-vp-sources--two`. Without sources it draws `<p class="rg-vp-sources--none">{empty}</p>`, or nothing when `empty` is empty.
- The list's own look moves in with it, each column count keeping the gaps it had: one column (the scoreboard) is the compact list, two columns (the standings) the wider one with VP that never wraps **(my call: the column count carries those gaps, so no extra prop)**.
- Where the list sits stays with the parent, since `library.test.mjs` lets a component style only its own classes: `ScoreBoard` wraps it in `rg-score-board--sources` (the top margin and the log's small type), drawn only when there are sources, as before. `StandingRow`'s list needs nothing more.
- `VpSources` lives in `results/` beside `StandingRow`, as the issue names it; `ScoreBoard` imports it from there.

## 3. The tiebreak line

- `scoreboard()` gives each `ScoreRow` a `tiebreak: TiebreakPart[]`, each part `{ text, landmark }`, so the template only joins them and draws a landmark's name in gold as before **(my call: the issue asks for "the sentence", but a plain string would lose the gold name)**.
- `tiebreakLine(landmark, resources)` is exported from `results.js` so the library section builds its rows the same way. `landmark` undefined means the table's rules compare no landmarks (the original rules): only "7 resources". `null` reads "Tallest landmark: none · …".
- `ScoreRow` keeps `landmark` and `resources`: the #128 tests read them.

## 4. Left as it is

- The rows' shared background (`color-mix(in srgb, var(--raised) 82%, transparent)`) and the viewer's bar (`box-shadow: inset 4px 0 …`), which `ScoreBoard`, `StandingRow` and `Results.svelte` each write, stay in each component **(my call)**: the issue's solution names only the list, and a shared token would touch `tokens.css`, which other issues are changing now. A follow-up can make them tokens.

## 5. Tests

- `client-results`: the tiebreak line under the current rules (a landmark, marked; none; the plural) and the original rules; `VpSources` rendered with one and two columns, with the empty words and with nothing; `ScoreBoard` and `StandingRow` use `VpSources` and draw no `<dl>` themselves, and `ScoreBoard` words no tiebreak.
- `library.test.mjs` checks the new section and row; the results browser test reads the standings' VP through `.rg-vp-sources dd`.
