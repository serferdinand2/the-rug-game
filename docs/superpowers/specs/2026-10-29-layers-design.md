# The game's keys and Escape through one tested layer state (#88): design

Written 2026-10-29. #88 is in M13 · Refactor (Game screen). The owner picked it as the one refactor that fixes a bug players hit. Every decision here is **(my call)** unless marked; the issue gave the shape.

## 1. What and why

Ana presses **I** (the footer asks "Take an income turn?"), then **L** (the log opens), then **Esc**. Both the log and the question close, because `LogPanel` listens for Escape on the window and so does `Game.svelte`.

The game screen keeps what is open in seven booleans: the overview and its player, the log, the settings, How to play, and the income and track questions. Each path that opens a layer closes a different set of the others:
- the menu closes the log and the overview before Table settings;
- the **H** and **K** keys don't close the settings;
- a chip opens the overview without closing the log;
- nothing clears a question.

The key handler reads the document (`querySelector('[aria-modal="true"]')` three times, and `closest('.rg-income-notice')`). Its Escape for the questions runs before `hotkeyAction`, whose `cancel` never fires. The first-income notice's flag uses `sessionStorage` directly.

**Done when** one Escape closes one thing in every combination, and no document query decides what a key does.

## 2. The layers

**`src/lib/layers.js`**, plain and tested. Its state is `Layers`: How to play (`rules`), Table settings (`settings`), the players overview and its `player`, the `log`, and the footer's `question` (`income` or `track`). Every combination of layers it can reach follows these rules:
- **`openLayer(layers, layer, { player })`:**
  - How to play, Table settings and the overview each open alone, closing every other layer, the question included.
  - The log closes only the overview; the question stays under it, as #88's example expects.
  - A question closes the overview, whose close bar would hide it.
- **`closeLayer(layers, layer)`** closes one layer.
- **`escapeLayer(layers, notice)`** names the one layer Escape closes. It goes from the top: How to play, Table settings, the overview, the log, the question, then the first-income notice, which is open only when nothing else is.

**`hotkeyGate(facts, layers)` in `hotkeys.js`** decides whether the screen takes a key at all. It receives these facts about the key: a modifier held, the key already taken by a component, typing in a field, in an open menu, in a modal dialog, and Enter on a control. Escape passes unless a menu, a field or a modal takes it; any other key also waits while How to play or Table settings is open. The screen reads those facts from the key's own target, and never queries the document.

`Game.svelte` keeps one `layers` state in place of the seven booleans:
- Escape closes `escapeLayer`'s layer.
- The hotkeys, the menu, the chips and the log button go through `openLayer` and `closeLayer`.
- Tab's peek at the log reads `layers.rules` instead of the document.
- `hotkeyAction` no longer answers Escape, so the dead `cancel` goes.

**The panels:**
- `LogPanel`'s window listener goes; the screen routes its Escape.
- Table settings and How to play keep `Dialog`'s own Escape on the box (#87), which goes no further.
- The dice tray keeps its own capture listener: while dice roll, Escape ends the roll and closes nothing else.

**The notice's flag:** the store gets an optional `session` storage (App passes `safeStorage(() => sessionStorage)`; without one it forgets). It gains `noticeClosed(key)` and `closeNotice(key)`. `storage.js` exports the forgetful store that `safeStorage` already falls back to, as `forgetfulStorage()`.

**What players notice:** pressing L with the overview open now shows the log, which today opens unseen under the overview. Pressing I or A with the overview open closes the overview, so the question shows. Otherwise nothing on screen changes.

## 3. Tests

- **`tests/client-layers.test.mjs`:**
  - each opening rule;
  - every combination reached by opening layers in any order, with or without the notice: each Escape closes exactly one thing, and a few Escapes close them all;
  - #88's example.
- **`client-hotkeys`:** Escape is no hotkey, and `hotkeyGate`'s cases.
- **`client-storage`:** `forgetfulStorage`.
- **Playwright `hotkeys.test.mjs`:** I, L and Esc close the log and keep the question, and a second Esc closes the question. The setup no longer takes the Futurists, whose head start made pressing 1 select Ships instead of opening Scouting's payment, which made the test flaky.

## 4. Hand-offs

#62 (End turn) and #35 (the arts track's key) add their keys through `hotkeyAction` and, where they open something, a layer.
