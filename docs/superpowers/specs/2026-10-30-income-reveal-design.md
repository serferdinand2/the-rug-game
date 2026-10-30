# The income reveal as its own component (#122): design

Written 2026-10-30. #122 is in M13 · Refactor, found by the client scan (#80), and waited for #86. Every decision here is **(my call)**, except the one in §4, which the owner decided.

## 1. What and why

`TurnBar` draws the footer, and it also holds every rule of the folding **Take income** reveal: which tones show it (not waiting, not the income turn), which fold it (selected and optional), which open it on hover or focus (selected only), and which make it inert with a disabled button (optional). Its own `income` prop and `onTurnBarIncome` callback carry it. #62 adds End turn to this footer and #71 changes its words, so those rules would sit among theirs.

**Done when** `TurnBar` has no income-specific rules, the reveal is its own component with a library section, and the footer looks and behaves as before, reduced motion included.

## 2. The changes

- **`src/lib/components/prompts/IncomeReveal.svelte`** draws the reveal: the words (`description`) and the button (`label`), reported through `onIncomeRevealClick` with a `ComponentEvent`. Two props replace the tones:
  - `folded`: closed to nothing, and open while its parent element is hovered or holds the focus. In the footer the parent is the turn label's group, so it opens on hover or keyboard focus of "Your turn", as before.
  - `disabled`: inert, the button disabled, and it stays closed even when folded.

  Its CSS is TurnBar's, moved: the same 455 px width, the same `--duration-medium` and `--duration-fast` transitions, which `tokens.css` sets to 0 under reduced motion. The parent's hover and focus are matched with `:global(:hover) > .rg-income-reveal--folded`, so the component styles only its own classes.
- **`TurnBar`** takes a `reveal` snippet instead of `income` and `onTurnBarIncome`, and draws it before the label in the label's group (renamed from `rg-turn-bar--income-access` to `rg-turn-bar--lead`). It decides nothing about it: the caller passes a reveal only where one belongs. The `income` tone stays, because it is the gold income-turn footer, not the reveal.
- **`footerView()`** in `src/lib/turn.js` says whether the reveal folds: its `income` gains `folded`, true on a selected space and false on the turn choice. No other footer has an `income`, so the waiting and income-turn footers still show none.
- **`TurnFooter`** passes an `IncomeReveal` snippet when the view has an `income`, reporting its click as `onTurnFooterIncomeAsk`, as before.
- **The library.** `IncomeReveal` gets its own section (open, folded and disabled, beside a stand-in label to hover); TurnBar's section passes the reveal as a snippet, the optional examples folded and disabled as the optional tone did.

Nothing on screen changes. The only class that changes is the reveal's: `rg-turn-bar--income-reveal` becomes `rg-income-reveal`, and the library's browser test that checks the forced-income footer has none follows it.

## 3. Tests

Vitest:
- `tests/client-footer.test.mjs`: the selected space's `income` is folded and the turn choice's is not; a source guard that `TurnBar.svelte` has no `income` prop, no `onTurnBarIncome` and no reveal classes, and that `TurnFooter.svelte` draws an `IncomeReveal`.
- `tests/library.test.mjs` checks the new component's structure, callback and classes, and that it has a section.

Playwright: the library, first-income, hotkeys and game tests cover the footer; `tests/browser/library.test.mjs` looks for `.rg-income-reveal` now.

## 4. Left to the owner

The issue asks whether the `optional` tone and the props only the library uses (`properIcon`, `headingEnd`, `costLabel`) stay; the approved Ships mockup draws them, and #20's optional benefits may need them. **Decided (owner, 2026-10-30): they stay.** The `optional` tone and `properIcon`, `headingEnd` and `costLabel` are kept as they are, for the Ships mockup's optional action and #20's optional benefits.

## 5. Hand-offs

#62 adds End turn to `TurnFooter`'s actions without meeting the reveal's rules. #71 changes the footer's words in `footerView`.
