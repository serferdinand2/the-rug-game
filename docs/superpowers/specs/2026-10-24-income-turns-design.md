# Income turns, eras and the game end (#15): design

Written 2026-10-24. This is the fourth rules-engine issue. It plugs into the #13 core and #14's turns: it adds decision kinds, automatic operations and the income-turn steps, and it fills in `chooseTurn`'s income answer and `endTurn`'s game end.

Items marked **(my call)** are decisions I made that the owner has not confirmed. The owner confirmed the rest in the brainstorm on 2026-10-24:
- the end of the game shows **each tiebreaker** used, step by step;
- the income turn and finishing work as played back in §4–§6.

As in #13 and #14, Board Game Arena (`elaskavaia/bga-tapestry`) is the prior art, and the engine is designed on its merits.

## 1. What and why

An income turn starts a player's next era. They use their civilization, play a tapestry card, may upgrade a tech card, score what their income mat shows, and collect income. After five of them a player is finished. When everyone has finished, the game ends and the players are ranked.

Many of these steps are owned by other issues: civilization abilities (#20), tapestry card abilities (#19), upgrading (#18), and scoring the capital city (#16). So #15 builds the income turn's order and everything that is the income mat's own, and hands the rest off by name, as #14 did.

## 2. Goals

1. Answering `chooseTurn` with `income` runs that player's next income turn, 1 to 5, with the steps that turn number has (01 §4.2).
2. In step 2, the first player of their neighbours to start an era gains its bonus: 1, 2 or 3 resources of their choice in eras 2, 3 and 4.
3. A tapestry card must be played from the hand on income turns 2–4. With an empty hand, the top card of the deck goes on face down, and nobody can see it.
4. Scoring (step 3) and income (step 4) come from the spaces the income mat shows.
5. After income turn 5 a player is finished. Turn order skips them, and the game ends when every seat has finished.
6. The game end ranks every player by VP, then by the table's tiebreak chain (R10, R11), and records **every tiebreak step used** (owner).

## 3. Non-goals and anti-goals

- **Non-goals.** These are handed off; each issue's checklist names them (§9):
  - civilization abilities on income turns 2–5, and passive civilization VP after a player finishes: #20;
  - a played tapestry card's ability, the end of a THIS ERA card at the start of the next income turn, and cards played in step 1 or after era 4 (R25): #19;
  - the optional upgrade in step 3: #18;
  - scoring the capital city (Symbology, Writing, Email): #16, which also keeps the list of landmarks on the grid for the tiebreak;
  - the Automa and the Shadow Empire as neighbours and on the turn order: #31.
- **Anti-goals.** Any of these counts as failure:
  - a handed-off step that silently does nothing. Until its issue lands, it throws an ordinary `Error` that names it, as in #14;
  - a face-down tapestry card that anyone can identify through `view()`, events or answers;
  - a tie that the result doesn't explain.

## 4. The income turn

1. **Answering `income`** emits `turnChosen`. It raises the seat's `incomeTurns` to N, emits `incomeTurnStarted { player, turn: N }`, and pushes an automatic `incomeSteps` operation.
2. **`INCOME_STEPS`** is an ordered list of steps in `income.js`, each with the income turns it applies to. It works like `AFTER_SETUP`: one step runs at a time, and the rest wait under whatever it pushes. Later issues insert their own steps; A&A's masterpieces, for example, come before step 1. **(my call)**

| Step | Turns | What happens |
|---|---|---|
| `civAbilities` | 2–5 | Pushes `civAbilities { player, turn }` for #20. |
| `tapestry` | 2–4 | The first-of-neighbours bonus (§5), then the card (§6). |
| `upgrade` | 2–5 | Pushes the effect `{ upgrade: { optional: true } }` for #18. |
| `score` | 2–5 | Runs every exposed space's `score` effects, row by row (market, house, farm, armory), in order. `scoreCapital` goes to #16. |
| `income` | 1–4 | Runs every exposed space's `income` effects, row by row, in order. Resources stop at 8. |
| `finish` | 5 | Marks the seat finished and emits `playerFinished`. |

3. **Exposed spaces.** Space 1 of every row always shows. With `left` buildings still on a row, spaces 1 to 6 − `left` show (01 §5).
4. **The turn ends** through `endTurn`, which sits under the turn as in #14.

## 5. The first-of-neighbours bonus

- **Neighbours** are the seats directly before and after the player in seat order. In a 2-player game the one opponent counts once (01 §4.2).
- The bonus is the era slot's `firstBonus` from `TAPESTRY_SLOTS`: `{ any: 1 }`, `{ any: 2 }` or `{ any: 3 }` for eras 2, 3 and 4.
- A player gains it when neither neighbour has started that era yet, which means each neighbour's `incomeTurns` is below N. It is gained before the card is played, through the `gain` effect, so the player chooses the resources. `firstBonus` is emitted with `{ player, era }`.
- **Solo.** A solo game has no neighbour until #31 adds the bots, so the check finds none and the bonus is always gained. #31 makes the bots count. **(my call)**

## 6. Playing the tapestry card

- **With cards in hand**, `chooseTapestry { options }` asks which card to play. The options are the hand, so they are a hidden field. Playing is mandatory: there is no "skip".
  - The card leaves the hand for era N's slot (`incomeMat.tapestry[N − 1]`).
  - `tapestryPlayed { player, era, card }` is emitted. The card is public from now on.
  - `tapestryAbility { player, card, era }` is pushed for #19.
- **With an empty hand**, the top card of the deck goes onto the slot face down, with no ability.
  - The deck is reshuffled from the discards first if it is empty (FAQ #24); with neither, nothing is played.
  - The card id stays in the state, so #21 can account for every card. `incomeMat.faceDown` lists it.
  - `view()` replaces that id with `null` in every seat's view, its owner's included, and drops the `faceDown` list. The event `tapestryPlayed { player, era, card: null, faceDown: true }` names no card.
  - It counts as a tapestry card on the income mat, as for Anti-Aircraft Defense. **(my call:** a face-down card is still a tapestry card.)

## 7. Finishing and the game end

- After income turn 5 the seat is `finished`. `endTurn` skips it, as #14 built.
- **A finished player gains nothing but passive civilization VP** (01 §4.3). This is one central rule, not a check in every later issue. **(my call)**
  - `runEffects` skips an `effects` operation whose player has finished, unless the operation is marked `passive: true`.
  - #20 marks its passive civilization VP that way.
  - Nothing is emitted for a skipped operation, because nothing happened.
  - This covers every gain that reaches a finished player through effects, such as Diplomacy's "each player gains 1 any resource" (#19) or an opponent's civilization ability (#20).
  - Decisions are not effects, so the rule doesn't cover trap responses after a player's final income turn (FAQ #18). #17 refuses those.
- When `endTurn` finds no unfinished seat, the game ends:
  - `phase` becomes `'over'` and `current` becomes `null`;
  - the ranking (§8) is stored in `state.result`;
  - `gameEnded { result }` is emitted.

  `play()` already refuses every action once the game is over.

## 8. The ranking and its tiebreaks

- **Order.** Players are ordered by VP, highest first.
- **Breaking a tie.** Players with the same VP form a tie, which the table version's chain (`VERSIONS[].tiebreak`, after `'vp'`) tries to break, step by step:
  - **`tallestLandmark`** (current rules, R11–R13). A player's value is their tallest landmark on the capital city grid by `HEIGHT_RANKING`, or `null` for none. Taller wins, and any landmark beats none. The landmarks on the grid come from `landmarksInCity(seat)`, which reads `seat.capital.landmarks`. #16 fills that list with every landmark covering at least 1 grid plot (R13). Until then it is empty, so this step separates nobody.
  - **`resources`** (both versions, R10, R11). A player's value is coin + worker + food + culture. More wins.
- **How each step works.** A step splits the players it compares into groups with equal values, best first. A group of one has its place. A group of two or more goes on to the next step.
- **Shared places.** Players still tied after the last step share a place. Places count like this: 1, 1, 3. **(my call)**
- **`state.result`:**
  - `ranking`: `{ seat, place, vp }[]` in place order;
  - `ties`: one entry per group of players tied on VP, each `{ vp, seats, steps }`. Each step is `{ by, values: { seat, value }[] }`, with the value of every player that step compared. If a step splits a group and part of it goes on, that part's next step is its own entry. Players who weren't tied have no entry.
- **Example (current rules).** Seats 1 and 3 both have 87 VP. Seat 1's tallest landmark in the city is the Fusion Reactor, seat 3's the Lighthouse. The result:
  - `ranking`: seat 1 in place 1, seat 3 in place 2;
  - `ties`: `[{ vp: 87, seats: [1, 3], steps: [{ by: 'tallestLandmark', values: [{ seat: 1, value: 'fusion-reactor' }, { seat: 3, value: 'lighthouse' }] }] }]`.

## 9. What the other issues take over

Their checklists get these lines.

| Issue | Takes over |
|---|---|
| #16 | Keep `seat.capital.landmarks`: the landmarks covering at least 1 grid plot, for the tiebreak (R13). |
| #17 | A finished player can't respond with a trap or response card (FAQ #18). |
| #18 | The optional upgrade of income step 3: `{ upgrade: { optional: true } }`, which may be declined. |
| #19 | `tapestryAbility` (WHEN PLAYED and THIS ERA), the end of a THIS ERA card at the start of the next income turn (an income step before `civAbilities`), and R25's cards played in step 1 or after era 4. A card that reaches every player (Diplomacy, Olympic Host) does so through `effects` operations, so finished players are skipped. |
| #20 | `civAbilities` on income turns 2–5, and passive VP after a player finishes, pushed as `effects` with `passive: true`. |
| #31 | Bots as neighbours for the first-of-neighbours bonus, and on the turn order. |

## 10. Decisions and events

| Decision | Fields | Answer | Default |
|---|---|---|---|
| `chooseTapestry` | `options` (hidden: the hand), `era` | `{ card }` | the first card in the hand |

| Event | Fields |
|---|---|
| `incomeTurnStarted` | `player`, `turn` |
| `firstBonus` | `player`, `era` |
| `tapestryPlayed` | `player`, `era`, `card` (`null` when face down), `faceDown` |
| `playerFinished` | `player` |
| `gameEnded` | `result` |

## 11. State additions

- `incomeMat.faceDown: string[]`, the face-down card ids. `view()` hides them, along with their ids in the slots.
- `capital.landmarks: string[]`, the landmarks on the grid. It stays empty until #16 fills it.
- `state.result`: `null` until the game ends, then the ranking (§8).

## 12. Tests

- **Each step on the right turns.**
  - Income turn 1 gives income only.
  - Turns 2–4 run every step.
  - Turn 5 has no card and no income, and finishes the player.
- **First-of-neighbours.**
  - A player starting an era before both neighbours gains the bonus; after either one, not.
  - In a 2-player game the one opponent counts.
  - The bonus is 1, 2 and 3 any in eras 2, 3 and 4.
- **The card.**
  - It is mandatory, it leaves the hand for the slot, and the ability goes to #19.
  - With an empty hand, the face-down card is hidden from every view, its owner's included, while the state keeps it.
  - It counts for `tapestryCard`.
- **Score and income** from the exposed spaces, with more buildings off the mat showing more.
- **Finishing at different times.**
  - A finished player is skipped while the others play on.
  - The game ends only when everyone has finished.
  - An effect for a finished player does nothing; one marked `passive: true` still gains its VP.
- **The ranking**, in both versions:
  - no tie;
  - a tie broken by resources;
  - a tie broken by the tallest landmark, with `capital.landmarks` set by hand;
  - a tie a landmark can't break (neither has one);
  - three players tied and split over two steps;
  - a shared place (1, 1, 3).
- **A scripted 2-player game** plays from setup to the end, with income and advance turns, the handed-off steps stood in for, and the expected final scores and ranking.
- **Core checks.**
  - `chooseTapestry`'s answers pass its check.
  - `play()` stays pure.
  - `view()` never shows another seat's `chooseTapestry` options or any face-down card.

## 13. Module layout (my call)

```
src/lib/engine/
  income.js        INCOME_STEPS, the incomeSteps operation, exposed spaces, neighbours
  ranking.js       the ranking and its tiebreaks, landmarksInCity
  turn.js          endTurn ends the game when every seat has finished
  decisions/       choose-tapestry.js; choose-turn.js resolves income
```

## 14. Left to the builder

- Field, event and error-message names, within the rules above.
- The script of the 2-player test game.
- Updating CLAUDE.md ("Where the work stands"), the #16, #17, #18, #19, #20 and #31 checklists (§9), and `tests/helpers/engine.mjs`'s stand-ins for `civAbilities` and `tapestryAbility`.
