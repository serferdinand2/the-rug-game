# Tinting a button by track through Button (#117): design

Written 2026-10-30. #117 is in M13 · Refactor, found by the client scan (#80), and waited for #79. Every decision here is **(my call)** unless marked; the issue gave the shape.

## 1. What and why

Two components restyled `Button` from outside to tint it with a track's colour:

- `DecisionPanel` gave its Confirm a class and reached it with `:global(.rg-decision-panel--confirm:not(:disabled))`, setting its border to the track, its fill to 65% of the track over `--text` (55% on hover) and its text to `--ink`.
- `TurnBar`, in its optional tone, overrode the `--action` token on its buttons' row, so a primary Button drew in `color-mix(track 60%, --text)` (and its hover mixed that 88% with `--text`).

Both bars also wrote their own tint, `color-mix(track 18%, --chrome)` with an `inset 0 -3px` band of the track.

**Done when** no component restyles `Button` from outside, a tracked button is one `tint` prop, the 18% and 3 px are tokens, and the screen draws exactly as before.

## 2. The changes

- **`Button` takes `tint`**, a token reference from `trackColor`, such as `'var(--military)'`. It sets `--rg-button-tint` on the button and the `rg-button--tinted` modifier. Only two modes read it, each keeping the look it had:
  - `primary`: border and fill `color-mix(tint 60%, --text)`; hover mixes that 88% with `--text`, as the overridden `--action` did.
  - `confirm`: border the tint itself, fill `color-mix(tint 65%, --text)`, 55% on hover, only while it can be pressed: a disabled Confirm stays gold, as `:not(:disabled)` kept it.
  - Other modes ignore it.
- **`DecisionPanel`** passes `tint` to its Confirm. The `:global` rules and the `rg-decision-panel--confirm` class go.
- **`TurnBar`** cannot tint its buttons itself, because its `actions` snippet is written by its parent. The snippet now gets the tint as its argument: the track's colour (gold without a track, as the bar's own tint) in the optional tone, `undefined` otherwise, and the parent passes it on with `<Button mode="primary" {tint}>`. The `--action` override goes. `TurnFooter` never shows the optional tone, so it takes no argument; the library's optional examples pass it on.
- **Tokens.** `--track-bar-mix: 18%` and `--track-bar-band: 3px` in `tokens.css`; both bars use them, the band as `inset 0 calc(-1 * var(--track-bar-band))`.
- **Guards** in `tests/styles.test.mjs`: Button's `tint` prop and rules; no stylesheet but `tokens.css` sets `--action`; no component has a `:global` rule on `.rg-button` or on a class it hands a `<Button>`; both bars take their tint and band from the tokens.
- **The library.** Button's section shows `primary` and `confirm` tinted by each of the four tracks, and a disabled tinted Confirm that stays gold.

## 3. Left as it is, for the owner

The issue noted that the two tints differ; this change keeps every one, so the screen stays the same:

- Confirm takes 65% of the track (border the full colour), the footer's commit button 60% (border the same as its fill).
- The status line under a track decision is 35% track over `--text`; the optional footer's label and proper name are 60%.

**Owner question:** should one track tint serve both buttons, and one both bars' text? Answering it is a change of these numbers in `Button.svelte` and the two bars, nothing more.

The issue's second checkbox, the owner checking the tinted buttons in the library, stays open.

## 4. Tests

- Vitest: the three guards above, failing before the change; `tests/library.test.mjs` and `tests/client-footer.test.mjs` unchanged and passing.
- Pixel check: the DecisionPanel and TurnBar library sections, screenshotted at 1920×1080 before and after (Button's section hidden, so nothing above them moves), are identical, and the computed border, fill, text colour, shadow and opacity of all 105 buttons in them, plain and hovered, and of 58 bar parts, are the same.
