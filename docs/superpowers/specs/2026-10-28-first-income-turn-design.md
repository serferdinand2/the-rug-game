# The first turn takes income by itself (#77): design

Written 2026-10-28. #77 is in M12 · Cosmetic enhancements. The issue asked for a first-turn footer that explains why the only move is **Take income**. The owner changed the brief when asked: "Just make the first income automatic. make sure player knows what's going on. also make sure player knows when there are no more legal moves except to income." What the owner said is marked **(owner)**, every other decision **(my call)**.

## 1. What and why

A player's first turn must be income turn 1 (01 §4.1), so it offers no choice. Today the engine still asks for it, and the footer offers the same small **Take income** as any later turn, so a new player looks for an advance they can't make. From now on nobody is asked: when setup ends, every seat takes income turn 1 in seat order, and the screen says what happened **(owner)**. A later turn on which no advance can be paid for still waits for the player, but the footer says that income is the only move and puts **Take income** where **Advance** usually is **(owner)**.

**Done when** a new game goes from the last setup choice straight to the first player's second turn, every player is told that their first income turn was taken for them and what it gave them, and a later turn with no advance to pay for says so, with a gold **Take income** in the actions slot.

## 2. Goals, non-goals and anti-goals

- **Goals.** Income turn 1 needs no click; a player can't miss what it did; a forced income turn later says why it is forced; the income words fit the turn they describe.
- **Non-goals.** A later forced income turn stays a click: it ends an era, so the player may want to look at the board first **(my call, reading the owner's two requests as different)**. The rules don't change: income turn 1 runs the same steps and still asks whatever it asked before.
- **Anti-goals.** A notice that covers a question the player must answer, shows again on every refresh, or tells one player what another drew.

## 3. The engine

- `startTurn()` (`src/lib/engine/turn.js`) takes income turn 1 for a seat whose `incomeTurns` is 0: it emits `turnStarted` and `turnChosen` (`turn: 'income'`) as now, so the log and its listeners see what they saw before, then starts the income turn under the turn's `endTurn`. No `chooseTurn` is pushed **(my call: the engine, not the client, so online, hot-seat, the timer and the simulation all behave the same)**.
- So the move that ends setup runs every seat's income turn 1 in seat order. It stops only where income turn 1 asks something: the tapestry-draft variant's keep (#53), or a civilization's end-of-first-turn rule (#20). Answering it carries on to the next seat.
- `turnOptions()` and `chooseTurn.check()` lose their first-turn branch, which nothing can reach any more **(my call)**. "You can't pay for any advance, so take an income turn." stays.
- **Undo (#24)** is unaffected: the move that ends setup is a setup move, which is never kept, and its draws are revealing anyway.
- **Clocks (#24)**: the first seat asked after setup still gets a fresh clock. It is the first player's second turn, or the first seat that income turn 1 asks something.

## 4. The screen

- **The notice (my call).** Once a seated viewer's income turn 1 is over, a one-time notice opens in the decision panel's place: the `DecisionPanel` in its gold income tone, centred.
  - Title "Era I begins".
  - "Every player's first turn is an income turn, so the game took yours for you." Then "You start with" and the viewer's own holdings from their view (resources, territory tiles and tapestry cards in hand), with the game's resource icons. A civilization's own starting gifts or its income-turn-1 loss are already in those numbers, so the line is always true.
  - "From now on, each turn you either advance on a track or take income."
  - A **Got it** button (and Escape) closes it.
  - It opens only in play, while the viewer's `incomeTurns` is 1, and only when the viewer has no open decision other than `chooseTurn`, so it never covers a question.
  - It is remembered per table code and seat in `sessionStorage` (each access in try/catch), so a refresh doesn't open it again and each hot-seat seat sees its own. If storage fails, it opens again after a refresh, which is harmless.
- **While income turn 1 asks the viewer something**, the gold income footer adds the detail "Every player's first turn is an income turn." **(my call)**.
- **While another seat is in an income turn**, the waiting footer names it: "Ana is taking their first income turn." for turn 1, "Ana is taking income turn 3." for later ones **(my call)**.
- **A turn with no advance to pay for** (the engine offers only `income`):
  - The heading is the engine's words: "You can't pay for any advance, so take an income turn."
  - The detail is what this income turn does (below).
  - A gold **Take income** sits in the actions slot on the right. The left-side income reveal is not shown.
  - Selecting a track space still marks it on the board, but the footer keeps this state: no **Advance**, and **Take income** stays.
- **The income words** fit the income turn they start: "End era I, gain income and begin era II." through "End era III, gain income and begin era IV.", and for income turn 5, which has no income, "End era IV, score it and finish playing." The ordinary turn's income reveal uses them too **(my call: the old fixed sentence was wrong for income turn 5 as well)**.

## 5. The pieces

- Engine: `startTurn()` and `choose-turn.js`.
- `src/lib/turn.js`: `incomeWords(turn)` for the next income turn's sentence; `forcedIncome(view, seat)` for whether the viewer's turn offers only income; `firstIncomeNotice(view, seat)` for the notice's words and holdings, or null when it shouldn't open; and the waiting footer's income-turn words.
- `Game.svelte`: the notice, the forced-income footer branch (ahead of the selected-space branch), and the income words in the reveal.
- `src/lib/components/prompts/IncomeNotice.svelte`: the notice, a presentational wrapper of `DecisionPanel` with its own library section **(my call)**.
- Library: the TurnBar section shows the forced-income footer and the first-income details.
- `src/lib/sound.js`: the turn cue comes only for the turn a batch leaves running, so a seat's own automatic first turn doesn't play it **(my call)**.

## 6. Tests

- **Engine.**
  - After setup every seat has taken income turn 1, in seat order, and the first player faces `chooseTurn` with `advance` offered.
  - The events run `turnStarted`, `turnChosen`, `incomeTurnStarted` (turn 1) seat by seat.
  - The tapestry-draft variant stops at the first seat's keep and goes on after the answer.
  - A civilization's end-of-first-turn rule still runs.
  - The tests and helpers that answered income turn 1 by hand move to the new start. The tests built on `startedGame()` and `readyTurn()` must keep testing what they tested, so the helpers may need to give back the state they gave before. The planner checks each file.
  - The scripted game and the 200-game simulation still pass.
- **Server.** The clocks, undo and client-API tests follow the new first decision.
- **Client (Vitest).** `incomeWords` for turns 1–5; `forcedIncome`; `firstIncomeNotice` (opens after income turn 1, not before it, not in era II, not over another decision, not for the public view; the holdings line); the waiting footer's words.
- **Browser (Playwright).** A table plays setup; the first player's screen shows the notice, **Got it** closes it, a refresh doesn't reopen it, and the footer offers an advance. The forced-income footer is covered by Vitest and the library, since no browser path reaches it cheaply.

## 7. Documentation, approval and hand-offs

- The README's "Current interface" and `docs/ui/README.md` show the notice and the forced-income footer from the running game. `docs/status.md` and `docs/architecture.md` record the engine change; the components README gets a row if the notice is its own component.
- #77's body is rewritten to the owner's new brief before the work lands.
- The owner approves the notice and the footer states in the library. As with #61 and #74, they are built into the game in the same change, and #77 closes once the owner has looked **(my call, following "Just make…")**.
- **Hand-offs.**
  - #31: whether the Automa and the Shadow Empire take an automatic income turn 1. `startTurn()` only does it for player seats.
  - #62: the first turn has no **End turn** moment, since nobody takes it.
  - #71: the footer's heading and detail wording agree with the states here.
