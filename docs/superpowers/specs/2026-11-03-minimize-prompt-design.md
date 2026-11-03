# Minimizing a decision prompt (#149): design

## Intent

A decision prompt covers the shared area with its scrim, the Tracks/Map switch included, so a player can't look at the board, or switch to the map, while deciding. They should be able to minimize the prompt, look at the board, and bring the prompt back without losing what they had chosen.

## Owner's decision (2026-11-03)

The mockup `docs/ui/prompt-and-hand.html` (screenshots in `docs/ui/screens/issues-148-149-158/`) offered two places for the way back: the turn footer (1), or a bar floating at the bottom of the board (2). The owner chose **the footer**.

## Behaviour

- The panel's title bar has a **Minimize** button, a bar icon with the key V beside its word. V does the same.
- Minimized, the panel, its shelf of cards and its scrim go. The board is the ordinary board: the Tracks/Map switch and M work, the tracks and map show their hovers, and a map decision's lit hexes stay lit.
- The footer keeps the question: the label "Your decision", the panel's title as its heading, the line "Minimized while you look at the board.", and a gold **Show choice** button with V beside its word. Show choice or V brings the panel back.
- Enter, which confirms an open panel, brings a minimized one back instead of sending a choice the player can't see (Claude's call).
- What was chosen stays chosen, because the choices live in the prompt state, keyed to the decision, not in the panel.
- A new decision opens its panel by itself: the minimized state belongs to the decision that was minimized.
- An advance's payment panel (#75) can't be minimized: its Cancel already goes back to the board.
- The dice tray treats a minimized prompt as nothing open over the board, and a map decision's board no longer leaves room for a docked panel while it is minimized.

## How it is built

- `PromptState` (`src/lib/prompt-state.svelte.js`): `minimized`, keyed to the decision as the choices are, with `minimize()`, `restore()` and `toggleMinimized()`; `canMinimize` for a decision panel; `panel` is 'none' while minimized, and `boardDocked` (the board's room for a docked panel) false.
- `DecisionPanel`: an optional `onDecisionPanelMinimize`; given, the title bar shows Minimize. `DecisionPrompt` passes it for a decision, not for a payment.
- `footerView` (`src/lib/turn.js`): a `minimized` input (the panel's title) and footer kind 'minimized'; `TurnFooter` draws Show choice and reports `onTurnFooterRestore`.
- `hotkeyAction` (`src/lib/hotkeys.js`): V is `{ type: 'prompt' }` while a prompt can be minimized or is minimized; the Keyboard shortcuts list names it.
- `Game.svelte` wires them: the prompt shows unless minimized, and the footer gets the title.

## Tests

- `client-prompt-state`: minimizing keeps the choice, hides the panel, undocks the map, and a new decision restores it; a payment can't be minimized.
- `client-footer`: the minimized footer and its Show choice.
- `client-hotkeys`: V while a prompt is open or minimized, and nothing otherwise.
- The library's DecisionPanel section shows the Minimize button.
- A browser test: a prompt is minimized, the map is looked at, the prompt is restored with its choice kept, and the choice is confirmed.
