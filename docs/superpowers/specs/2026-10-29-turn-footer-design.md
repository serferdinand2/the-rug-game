# The turn footer as a screen part (#86): design

Written 2026-10-29. #86 is in M12 · Cosmetic enhancements, found by the client scan (#80). Every decision here is **(my call)**; the issue gave the shape.

## 1. What and why

`Game.svelte` picks one of eleven footers in a 100-line `{#if}` chain of `TurnBar` branches, with their words worked out inline: the overview's close bar, game over, the income question, the track question, forced income, a selected space, the turn choice, an income turn, a decision, setup and waiting. Its helpers sit in the screen too (`priceSymbols`, which rebuilds the whole board to read one tier, `onlyIncome`, `incomeDescription`, `currentSeat`, `asked`, three snippets), and the same conditions repeat. The advance's two moves, the turn choice and then the advance it opens, are sent from the screen. The track question fakes a `ComponentEvent` with a double cast to reuse the click's handler. Only browser tests reach any of it. #62 (End turn) and #71 (the footer repeats the panel's title) both change this footer.

**Done when** a tested `footerView()` decides every footer, `Game.svelte` renders one `TurnFooter` and keeps no footer snippets, and a tested helper sends the advance's two moves.

## 2. The changes

- **`footerView(game, seat, inputs)`** in `src/lib/turn.js` decides which footer shows and every word in it, in the screen's order: overview, over, income question, track question, forced income, selected space, turn choice, income turn, decision, setup, waiting, and `none` when no one is to play. It reads the viewer's decision (`myDecision`), `forcedIncome`, `incomeWords`, `decisionTurnHeading`, `takingTurnWords` and `askedSeats` itself. The screen gives it what only the screen knows:
  - what is open (`overviewOpen`, `noticeOpen`), the footer's questions (`incomeAsk`, `trackAsk`) and the `selected` space;
  - the advances the viewer can pay for (`options`), from which it works out the outlined spaces, the track question's choices and whether the selected space can be advanced to;
  - from the prompt state: whether the payment is picked in the panel (`paying`), the viewer's income turn (`income`) and its step (`incomeStep`).

  It returns `{ kind, tone, label, labelColor, heading, properName, track, detail, cost, income }`, as `TurnBar` takes them, plus the track question's `tracks` (each with its label, such as "1 · Exploration", and whether it can be chosen), the selected space's `advance` (whether Advance can be pressed, and its tooltip) and forced income's `takeIncome` (whether its button shows).
- **One price.** `tierSymbols(track, tier)` in `src/lib/board.js` is a tier's price as symbols. `trackBoard()` builds its tiers with it and the footer prices the selected space with it, so `priceSymbols` goes. This is the `tierSymbols` that #128's remainder named; `tierOf` and `picks.js`' tier lines stay #128's, after #85.
- **`src/screens/game/TurnFooter.svelte`** renders `OverviewCloseBar` or one `TurnBar` from the view, keyed on its `kind` so a new footer is a new bar, as each branch was. It takes `view` and `sending` and reports `onTurnFooterIncomeAsk`, `onTurnFooterIncome`, `onTurnFooterAdvance`, `onTurnFooterTrack` (with the track), `onTurnFooterCancel`, `onTurnFooterResults` and `onTurnFooterOverviewClose`, each with a `ComponentEvent`.
- **The advance's two moves.** `sendAdvance(move, next, turn, option, pay)` in `src/lib/moves.js`: from the turn choice it answers "advance" first, then the advance the newest view opens; from an open advance it sends only the advance. It returns false when the turn choice was refused, so the screen keeps the selected space, as before.
- **Selecting a space** is a plain `selectSpace()` in `Game.svelte`, which the track's click and the track question both call, so the fake event goes.
- **What stays.** `selected`, `incomeAsk` and `trackAsk` stay in `Game.svelte`, because the board and the hotkeys share them. `nameOf` stays for the header's clock until #90.

Nothing on screen changes.

## 3. Tests

Vitest:
- `tests/client-footer.test.mjs` has a test for each of the 11 footers and `none`, on real game views from `tests/helpers/engine.mjs` where the words come from the engine, and on edited copies where a state is hard to reach. It also checks the income button's absence under the notice, the track question's choices, Advance's two refusals and the waiting footer naming the asked player.
- `tests/client-board.test.mjs`: `tierSymbols` matches every tier of `trackBoard()`.
- `tests/client-api.test.mjs`: `sendAdvance` from a turn choice (two moves in order), from an open advance (one), after a refused turn choice (nothing more) and with no advance opened.
- A source guard that `Game.svelte` draws no `TurnBar` or `OverviewCloseBar` and keeps no footer snippets.

Playwright: the hotkeys, first-income, game, decision-prompt, pick-prompts, setup-prompts, track-text, results and dice-tray tests pass unchanged.

## 4. Hand-offs

#62 adds End turn to `footerView` and `TurnFooter`; #71 changes the decision footer's words in one place. #122 moves `TurnBar`'s income reveal out on this. #88 routes the keys, which still set `incomeAsk` and `trackAsk` in `Game.svelte`. #35's fifth track joins the track question through `TRACK_KEYS`.
