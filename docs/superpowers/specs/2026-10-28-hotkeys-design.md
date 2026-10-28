# Game hotkeys (#83): design

Written 2026-10-28. The owner found #42's keyboard shortcuts too general to help anyone play ("I tohught somethign more like I for income, 1,2,3 to see different players Q,W,e to toggle between capital hand etc") and set the keymap in a few messages; what the owner said is marked **(owner)**, every other decision **(my call)**.

## 1. The keymap

| Key | Does |
|---|---|
| **I** | Take income, when the footer offers it: it asks first **(owner)**; **I** or **Enter** again confirms |
| **A**, then **1**–**4** | "Advance on which track?" in the footer, then the track by its number **(owner)**: Exploration, Science, Technology, Military in the board's order; **5** joins for the arts track (#35) |
| **Enter** | Confirm the open decision panel, or the footer's Advance for a selected space, when no control has the focus |
| **Z** | Undo |
| **M** | Go to the World Map **(owner)**; on the map, back to the tracks **(my call)** |
| **Q W E R T Y U** | The player tabs in order: Capital, Hand, Income, Eras, Civ, Tech, Terrain **(owner)** |
| **1**–**5** | Open the players overview on that player's capital **(owner)**; the same key again closes it |
| **Tab**, held | Show the log and scores while it is held **(owner)**; a tap still moves the focus **(my call)** |
| **L** | Open or close the log and scores |
| **H** / **K** | How to play / Keyboard shortcuts |
| **,** / **.** | Turn the explore's tile back / forward; **.** or **,** turns a landmark being placed **(my call: R is now the Eras tab)** |
| **Esc** | Close what is open, one thing at a time, and cancel the track question or the income question |

## 2. Rules

- **When keys work:** on the game screen only; never while typing in a field, with Ctrl, Alt or Cmd held, while a modal (How to play) or the header menu has the keyboard, or when a component already handled the key (`defaultPrevented`, such as a landmark piece's arrows). Esc and Tab keep their own rules.
- **An action key does nothing unless the action is available:** I only with the viewer's turn choice offering income and no notice up; A only with an advance to pay for; a track number only for a track with a payable space; Z only when undo is allowed.
- **The income question** replaces both ways of taking income: the footer's **Take income** (the reveal, and the forced-income state of #77) now opens "Take an income turn?" with the income words (#77), **Cancel** and a gold **Take income**. It never sends on the first press **(owner)**.
- **The track question** is a footer state: "Advance on which track?" with the four tracks numbered, the unpayable ones dimmed. A number picks the token's next space as a click would (#75's payment panel opens when the payment has a choice, otherwise it advances at once); Esc or a click elsewhere cancels.
- **Tab held:** the first keydown moves the focus as usual and starts a 200 ms timer; repeats are prevented, so a held Tab doesn't race through the controls; when the timer fires the log panel shows (its own Log/Scores tabs) until keyup. If the panel was open already, Tab changes nothing.

## 3. The pieces

- `src/lib/hotkeys.js`: `hotkeyAction(key, context)`, a pure map from a key and the screen's context to an action (`income`, `advance`, `track`, `confirm`, `undo`, `map`, `tab`, `player`, `log`, `help`, `keys`, `turn`, `cancel`), tested under Vitest.
- `src/lib/shortcuts.js`: `SHORTCUTS` becomes this keymap, grouped (Your turn, The board and the players, Your player area, Help, Placing and exploring, Anywhere).
- `Game.svelte`: one key handler using `hotkeyAction`; `incomeAsk`, `trackAsk` and `logPeek` states; two TurnBar states.
- `PlayersOverview`: a `player` prop, the seat whose capital opens on the right.
- `LandmarkPiece`: turns on **.** and **,** instead of R.
- Library: the TurnBar section shows the income question and the track question.

## 4. Tests

Vitest: every key's action in each context. Playwright: in a hot-seat game, I asks and Esc cancels, I twice takes income, A then 1 opens the advance, W shows the Hand tab, M the map, 2 the overview, a held Tab the log.
