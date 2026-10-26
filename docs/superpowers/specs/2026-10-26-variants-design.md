# Optional variants (#53): design

Written 2026-10-26. #53 is an M0 decision issue: which official optional variants a table's creator may switch on. #22 built the table options with a `variants` list that the engine checks against `VARIANTS`, which was empty until now.

The owner answered the questions on 2026-10-26. What the owner said is marked **(owner)**. Every other decision is marked **(my call)**, for the owner to revisit.

## 1. What and why

The Fantasies & Futures rulebook lists optional variants (03 FF.2.6, 01 §2.2). Some only change a number, and some change what a player draws. A table that wants one has had no way to play it.

The owner chose seven of the eight variants on #53's list **(owner)**. Five need nothing beyond the base game, so they are built now. Two need an expansion that doesn't exist yet. They are recorded here, with their ids, for the issue that builds that expansion.

## 2. The decisions

| Variant | Owner | Built |
|---|---|---|
| Income turn 1: draw 2 tapestry cards, keep 1 | yes | now |
| Whenever you draw a civilization, draw 2, keep 1 | yes | now |
| Neoprene Nanotechnology bonus: discard 2 tech cards instead of 3 | yes | now |
| Remove Radio and Lithium-Ion Battery from the tech deck | yes | now |
| Start in the centre of the island closest to you | yes | now |
| All players draw civilizations from the same expansion | yes | with #33 (the first expansion civilizations) |
| A&A: roll either science die (d12 or d20) | yes | with #35 (the arts track and the d20) |
| Remove any tapestry or tech cards the players choose | **no** | never |

The 2-player Shadow Empire variant was decided earlier and comes with #31 (design document §4).

## 3. The table option

- `VARIANTS` in `src/lib/engine/setup.js` becomes a frozen list of `{ id, name }`, like `VERSIONS`, so the new-table screen can label each one. `checkOptions()` accepts an id only if it is in the list. **(my call)**
- The ids are kebab-case, like the other data ids **(my call)**:
  - `tapestry-draft`: Income turn 1: draw 2 tapestry cards, keep 1
  - `civ-draft`: Gaining a civilization: draw 2, keep 1
  - `neoprene-nanotechnology`: Nanotechnology's bonus discards 2 tech cards
  - `no-radio-battery`: Leave out Radio and Lithium-Ion Battery
  - `closest-island`: Start on the island closest to you
- A table's `options.variants` stays a list of ids. `tableChoices()` (and so `GET /api/config`) lists `variants` as `{ id, name }`.
- Any mix may be switched on, in both versions **(my call)**: the variants come from different printings, but none contradicts either version's rules.
- The game keeps its variants in `state.variants` and in its `gameCreated` event, as #22 built. Both are public.

## 4. How each variant plays

### 4.1 `tapestry-draft`

- On income turn 1, the Ceremony space's tapestry card becomes "draw 2, keep 1". Ceremony is the only exposed space that gives a tapestry card on income turn 1. Only income turn 1 changes; Ceremony gives 1 card on later income turns as usual.
- The `gain` effect gets a `keep` count: `{ gain: { culture: 1, tapestry: 2, keep: 1 } }` draws 2 cards into the hand, then the new decision `chooseKeep` asks which to keep. The rest go to the tapestry discard. **(my call)** It is general so F&F's Psionics can draw 3 and keep 1 (#40).
- The income step makes this change on income turn 1 when the variant is on: a gain of n tapestry cards becomes n + 1 with `keep: n`. **(my call)**
- `chooseKeep { options, keep }` has hidden `options`. Its answer is `{ card }`, and the default is the first card drawn. When fewer cards than `keep` + 1 could be drawn, nothing is asked.
- The triggers for gaining a tapestry card (`tapestryGained`) fire after the choice, with the kept card only. A discarded card was never gained. **(my call)**
- A discard is public, as every tapestry discard is in the engine (`cardsDiscarded`).

### 4.2 `civ-draft`

- Gaining a civilization mid-game (`gainCiv`: Mechs, Radio, the Mystics' replacement) draws 2 and keeps 1. Setup already deals 2 and keeps 1, so it doesn't change (01 §2.2).
- The player answers `chooseCiv`, the setup decision, with `midGame: true` on it. Its `options` are already hidden, and the simulation's invariants already count them. **(my call)**
- The kept civilization joins the player's and gets its mid-game setup, as before. The other goes face up onto `supply.civDiscard`, with a `civDiscarded` event. F&F says "discard the other", and the engine's civilization discards are face up. **(my call)**
- When only 1 civilization could be drawn, it is gained without a question. When none could, nothing is gained (`noCivLeft`), as before.
- The draw keeps `drawCiv`'s rules: an empty deck is rebuilt from the discards, except the one discarded last.
- The Mystics may be kept. Gained mid-game, they discard themselves for another civilization, which is drafted again.

### 4.3 `neoprene-nanotechnology`

- The bonus of Nanotechnology (technology space 11) costs 2 tech cards instead of 3, for 10 VP. Only the place that offers the bonus reads it, so the track data keeps the printed cost.

### 4.4 `no-radio-battery`

- Radio and Lithium-Ion Battery are taken out before the tech deck is shuffled. They are nowhere in the game.
- `techDeck(variants)` in `decks.js` returns the tech cards a game uses. The simulation's invariants check the tech cards against it instead of `BASE_TECH`.

### 4.5 `closest-island`: R110

The physical rule is "Instead of using capital numbers, place your starting outposts in the centre of the island closest to you. With 4 players, space the start positions evenly." Online there is no "closest to you", so this reading becomes R110 in the README's rules conventions **(my call)**:

- **The islands** are the start regions: 6 on the large map, at the start hexes of capitals 1–6, and 3 on the small map, at the shared spots 1/6, 2/4 and 3/5. The start hex is the island's "centre".
- **Around the map.** Players sit round the map in seat order, as they sit round a table, so map neighbours are turn-order neighbours. The capital numbers run round the map in one direction (they follow `HEX_SIDES`), so the islands are taken in number order.
- **Spaced evenly.** With n players and k islands, seat i (from 0) takes island (r + ⌊i·k/n⌋) mod k, where r is random. Four players on the large map take islands r, r+1, r+3 and r+4, so the gaps are 1, 2, 1, 2.
- **The capital mats** are still dealt as usual, and they still give the capital grid; only the start hex changes.
- **Solo** keeps R40: the variant changes nothing at a 1-player table.
- `random` is called once more only when the variant is on, so every other game deals as before.

## 5. Recorded for later

- **Civilizations from one expansion (#33).** The owner said yes. With only the base game built, every civilization is a base civilization, so there is nothing to switch on. The plan is one id per expansion, `civs-from-pp`, `civs-from-aa` and `civs-from-ff`, at most one at a time, so `variants` stays a flat list of ids **(my call)**. #33 decides whether the base civilizations count as a fourth set.
- **Either science die (#35).** The owner said yes. The id will be `either-science-die`; it needs the arts track, so `checkOptions()` must refuse it without A&A.
- **Psionics (#40).** With `tapestry-draft`, the Psionics draw 3 tapestry cards on income turn 1 and keep 1. With `civ-draft`, they draw 3 civilizations and keep 1. `gain`'s `keep` and the mid-game `chooseCiv` already allow it.

## 6. Hidden information, undo and the timer

- Both drafts take cards from hidden decks, so `revealed()` (#24) already makes them impossible to undo. Nothing new is needed.
- On a timeout the server answers `chooseKeep` and the mid-game `chooseCiv` with their first option, like any decision.
- `view()` hides `chooseKeep`'s and `chooseCiv`'s options from everyone else. The kept tapestry card stays in the hand, and the discards are public.

## 7. Tests

- `tests/engine-variants.test.mjs` covers each variant: on and off, the decision's answers and its hidden fields, the discards, the triggers, R110's assignments for every player count, and solo.
- `checkOptions()`, `createGame()` and `tableChoices()` accept the five ids and refuse unknown ones.
- The simulation plays half its games with all five variants on, so each of the 20 combinations gets 5 games each way. Its invariants use `techDeck()`.

## 8. Handed off

- **#3 and #25:** the new-table screen shows the five variants as checkboxes, from `GET /api/config`'s `variants`.
- **#28:** prompts for `chooseKeep`, and for `chooseCiv` with `midGame: true`.
- **#29:** the log names the variants of a game from its `gameCreated` event.
- **#31:** decide whether the variants apply to the Automa's draws.
- **#33, #35 and #40:** §5.
