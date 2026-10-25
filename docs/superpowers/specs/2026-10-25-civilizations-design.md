# The 16 base civilizations (#20): design

Written 2026-10-25. This is the ninth rules-engine issue. It gives the 16 base civilizations their abilities in both versions, builds the `civAbilities` operation #15 hands over and the `gainCiv` effect #14 and #18 hand over, and puts civilization tokens and buildings on the map as items. It builds on #19's abilities and triggers (`docs/superpowers/specs/2026-10-25-tapestry-abilities-design.md` §5–§6).

As for #19, the owner asked for the work without a question round ("go ahead and work on #19 and #20"). The research (02 §1–§2), the rule conventions (R28–R35) and Board Game Arena (`elaskavaia/bga-tapestry`, read on 2026-10-25) settle what they can. **BGA** marks a BGA reading. **(my call)** marks a decision for the owner to revisit after playing.

## 1. What and why

Each player plays one civilization from the start and may gain more (Mechs, Radio). Most abilities fire in step 1 of income turns 2–5. Others react to events (a district completed, a conquest, a landmark gained), change a rule (where buildings may go), or score on the final income turn. Until now a civilization was only an id, `civAbilities` had no handler, and `gainCiv` threw an `Error` naming itself.

## 2. Goals

1. All 16 civilizations work as 02 §1.2 prints them, with R28–R33.
2. **Versions** (R34, R35):
   - **Original 2019 printing:** no adjustments.
   - **Current official rules:** the F&F rulebook p.32 adjustments (02 §2.2 column D), for the civilization chosen at setup only. Losses come at the end of income turn 1. A civilization gained mid-game gets nothing.
3. `civAbilities { player, turn }` runs every civilization the player holds whose ability fires on that turn, in the order the player chooses.
4. `gainCiv` draws a random civilization, adds it, and runs its mid-game clause.
5. After a player finishes, only the VP of passive abilities still reaches them (01 §4.3).
6. Tokens and pieces that civilizations put on the map are items. A territory with two items can't be conquered (02 §1.2, Traders' reminder).

## 3. Non-goals

- The Revised Civilization Pack (R101–R104), and BGA's adjustment options 4, 8 and 9, which mix in its rewrites.
- Bots as opponents (The Chosen's "per opponent", Historians' targets): #31. Until then only player seats are opponents (#19's `opponents()`).
- The civilization mats on screen, and the prompts: #27, #28, #47.
- Expansion civilizations: their issues.

## 4. Structure

- **One module per civilization**, `src/lib/engine/civs/<id>.js`, exporting a `Civ`:

```js
/**
 * @typedef {Object} Civ
 * @property {string} id
 * @property {(ctx, player: number, midGame: boolean) => void} [setup] - Tokens and starting choices; `midGame` for a gain after setup
 * @property {number[]} [incomeTurns] - The income turns its ability fires on, usually [2, 3, 4, 5]
 * @property {(ctx, player: number, turn: number) => void} [income] - The ability in step 1
 * @property {Record<string, import('../eras.js').Hook>} [hooks] - #19's trigger handlers
 * @property {(ctx, player: number) => void} [firstTurnEnd] - At the end of income turn 1 (§5)
 * @property {{ setup?: (ctx, player: number) => void, firstTurnEnd?: (ctx, player: number) => void }} [adjustment] - Current version only, the setup civilization only (§5)
 */
```

- **`src/lib/engine/civs/index.js`** exports `CIVS` (id → `Civ`, all 16), `findCiv(id)` and `civsOf(state, player)`.
- **`src/lib/engine/civs/civ.js`** holds the `Civ` typedef, `offer()` (below) and the `placeToken` effect. It imports no civilization, so civilization modules can import it without a cycle. One cycle remains: `abilities.js` imports `index.js`, and several civilization modules import `abilities.js`. So a civilization module can't be the first engine module loaded; callers import the engine through `game.js`, `kinds.js` or `play.js`.
- **`seat.civData`** holds each civilization's own state, keyed by civilization id: tokens left, positions, predictions. Each module documents its shape as a JSDoc typedef. It is public: everything on a civilization mat is visible.
- **Triggers.** `activeHooks()` in `abilities.js` adds the hooks of each civilization in `seat.civs` after the era ability's.
  - Every operation a civilization hook returns is marked `passive: true`.
  - `runEffects` lets a finished player's `passive` operation run only its `vp` effects. It skips the rest, through `chooseOption` and `chooseOrder` too.
  - So a hook returns its whole benefit, and a finished owner gets only the VP of it: Historians' 3 VP squares, a Traders red die. **BGA**
  - **A finished owner's hook** returns only `effects` operations. It takes no card (Inventors), places nothing, and asks nothing. An optional gain ("you may") becomes a plain `effects` operation, because only its VP can run and VP never hurt. A helper `offer(state, owner, effects)` returns `chooseOption { options: [[], effects] }` for a player still playing, and a plain passive `effects` operation for a finished one.
- **One outpost helper.** `takeOutpost(ctx, player)` in `outposts.js` handles every outpost leaving the supply, for `conquerHex` and `placeOutpost`. It fires a new trigger, `outpostTaken { player }`, where the Militants choose a row.

## 5. Setup, adjustments and gaining

- **After-setup step `civSetup`**, before `start`, runs as a group with one lane per player (#13 design §7). Each lane runs each held civilization's `setup(ctx, player, false)`, then, in the current version, the setup civilization's `adjustment.setup(ctx, player)`. It runs after the reveal, because its results show on the board.
- **The setup civilization** is `seat.civs[0]`: civilizations gained later are appended.
- **Adjustments** (current version only; the civilization chosen at setup only):

Most adjustments push one `effects` operation, written here as its effects:

| Civilization | `adjustment.setup` | `adjustment.firstTurnEnd` |
|---|---|---|
| Alchemists | `[{ gain: { any: 1 } }, { vp: 10 }]` | |
| Architects | 1 impassable cube per opponent (below) | |
| Entertainers | `[{ gain: { any: 1 } }, { vp: 10 }]` | |
| Futurists | | lose 1 culture, then 1 resource of the player's choice |
| Heralds | | R35's draw (below) |
| Isolationists | `[{ gain: { territory: 2 } }]` | |
| Merrymakers | `[{ gain: { any: 1 } }]` | |
| Mystics | `[{ gain: { any: 1 } }]` | |
| The Chosen | `[{ vp: { per: 'opponent', each: 15 } }]` | |
| Traders | `[{ gain: { any: 2 } }, { vp: 10 }]` | |

  The other six have none.
  - **Architects' cubes.** One per opponent, each on an open plot in a district that holds no cube yet (`chooseSlot`, purpose `architectsCube`). They live in `seat.capital.cubes` (plot indexes), and `cityPlots` shows them as `'blocked'`. Terraforming may build over a cube and earns its 5 VP there, as over any impassable plot. **(my call)**
  - **Losses** use a new effect, `lose: { culture?, any? }`.
    - Culture is taken first, as much as the player has. With no culture, no culture is lost. **(my call)**
    - Each `any` point asks with `chooseSlot` (purpose `loseResource`) among the resources held, or takes the only one, or takes nothing.
- **Income step `civFirstTurnEnd`**, after `income` on income turn 1: each held civilization's `firstTurnEnd`, then, in the current version, the setup civilization's `adjustment.firstTurnEnd`. The Heralds' Maker of Fire play (§7) is a `firstTurnEnd`.
- **`gainCiv`**:
  - It takes the top of `supply.civs`. An empty deck is first rebuilt from the new `supply.civDiscard`, shuffled, except the civilization discarded last, so the Mystics never draw themselves again at once. With nothing left to draw, nothing is gained (`noCivLeft { player }`), so a lone Mystics discard gives nothing. **(my call)**
  - The civilization is appended to `seat.civs` (the mat to the left, 02 §1). `civGained { player, civ }` is emitted, and its `setup(ctx, player, true)` runs. **(my call)** on the deck and discards, as BGA does.
  - **Mystics** alone discards itself, to `civDiscard`, and the player gains another (`civDiscarded`).
  - **Futurists** gained mid-game work as at setup. 02 §1 says "when gained (at setup or mid-game)". **(my call:** BGA discards and redraws them instead.)

## 6. Income step 1

`civAbilities { player, turn, done }` lists the player's civilizations whose `incomeTurns` include the turn and that aren't in `done`:
- **None:** nothing happens.
- **One:** it runs.
- **Several:** `chooseCivAbility { options }` asks which comes next ("use them in any order", 01 §4.2).

Each civilization runs its `income`, then `civAbilities` comes back with that civilization added to `done`. So a civilization gained during step 1 still fires that turn. **BGA** Optional abilities ("you may") offer a decline in their own decision.

## 7. The civilizations

R28–R33 are cited where they apply. A pick with exactly one legal answer is made without asking unless it can be declined (#19's single-options rule).

- **Alchemists.** Income turns 2–5.
  - **Rolling.** Roll the science die and mark the track (Empiricism doesn't apply, **BGA**). Then `chooseAlchemists` asks: roll again, or stop. The first roll is required.
  - **Bust.** Rolling a track already marked busts: gain 1 any resource, and the marks clear.
  - **Stopping.** For each marked track, in the order rolled, an optional advance without benefit or bonus: `advance { tracks: [t], noBenefit, optional, offTrackVp: 5 }`.
  - **The 5 VP.** `offTrackVp` gives 5 VP instead when every token on that track is on space 12. A blocked track gives nothing. Landmarks are gained.
- **Architects.**
  - **District rewards.** Each district a piece completes whose income buildings are all one type, with at least one, pays 1 more any resource. Landmarks, impassable plots and cubes don't count. This uses a new trigger, `districtsCompleted { player, districts }`, fired by `placePiece`. **BGA**
  - **Capital scoring.** When the capital is scored (`scoreCapital`), each complete row or column whose income buildings are all one type, with at least one, scores 2 VP instead of 1.
  - **Gained mid-game:** up to 3 swaps of two income buildings of different types in the capital. Each swap is optional (`chooseSwap`). Swaps pay no district reward.
- **Craftsmen.**
  - **Placement.** Whenever an income building is placed, the lowest open space of each of the 3 columns is offered besides the capital. With no open capital plot, the columns and beside-the-mat are offered.
  - **Benefits.** Covering a space gains its benefit. Bottom to top:
    - **A:** 1 worker; 1 territory tile; 5 VP.
    - **B:** 1 coin; invent; upgrade; 10 VP.
    - **C:** 1 food; 1 tapestry card; 1 culture; research with the benefit and an optional bonus; 15 VP.
  - **What the grid counts as.** It is part of the capital for building counts (R71 already counts every building off the income mat) and for Monarchy, which `piecePlaced` gives. It never completes rows, columns or districts. `civData.craftsmen` holds the buildings in each column.
- **Entertainers.**
  - **Moving.** Income turns 2–5: the token moves one step right along a link (R28) and gains that space. The move is required while one is possible.
  - **The grid**, rows top to bottom in each column:
    - **Column 1:** 1 worker, 1 culture, 1 food, 1 coin.
    - **Column 2:** farm, market, house, armory.
    - **Column 3:** conquer; research without benefit; invent; explore.
    - **Column 4:** advance on technology, exploration, military, science. Each is a full advance with the benefit, and the bonus may be paid (R29).
  - **Gained mid-game:** the token goes on any space but the start and gains it.
- **Futurists.**
  - **When gained:** advance exactly 4 spaces on every track, stopping at 12. There are no benefits, bonuses or landmarks (02 §1.2), and the landmarks passed stay available.
  - **Jump rules.** It is a jump (`moveToken` with `jump: true`): never blocked, gaining no landmarks, and firing no `advanced` trigger. **BGA** A token reaching 12 still claims "complete any track" (01 §10).
  - **Several tokens on a track:** the most advanced one moves. **(my call)**
  - Then gain 1 of each resource.
- **Heralds.**
  - **The ability.** 4 tokens. Income turns 2–5: you may put a token on any visible WHEN PLAYED card on any income mat, your own included, and traps included (`chooseSlot`, purpose `heralds`). Each card holds at most one Herald token.
  - **What you gain.** The card's ability. #19's `copyAbility(ctx, player, null, card)` pushes `tapestryAbility` with no physical card. So a THIS ERA ability reached through a copied Espionage lasts until the next income turn. **BGA**
  - **Maker of Fire.** At the end of income turn 1 (`firstTurnEnd`), for the player who started with the Heralds:
    - **Original:** you may play any card from your hand on Maker of Fire (`chooseTapestry`, era 1, optional), and its ability resolves. A THIS ERA card lasts until income turn 2.
    - **Current (R35):** this replaces the original play. Draw tapestry cards until you reveal a WHEN PLAYED card. The others are revealed and discarded, and the found card goes to your hand. The found card is public too, as it is revealed: `cardsRevealed { player, cards, found }`, with `found` null when the deck ran out first. You may then play that card, and only that card, on Maker of Fire, and gain its effect, unless it is Renaissance. A trap counts as a WHEN PLAYED card (10 VP as a tapestry, R22). **BGA**
    - So the Heralds' `firstTurnEnd` does the original play only under the original rules, and their `adjustment.firstTurnEnd` does R35's draw and play.
- **Historians.**
  - **Tokens.** 4 tokens cover four squares: 3 VP and 1 food on top, 1 worker and 3 VP below.
  - **The ability.** Income turns 2–5: you may discard 1 territory tile to give a token to any opponent, who may already hold one. You choose which square it uncovers (`chooseSlot`, purpose `historians`; R30). With several territory tiles, a required `chooseSlot` (purpose `historiansTile`) asks which to discard. **(my call)**
  - **The trigger.** Whenever an opponent holding at least one of your tokens gains any landmark (hook `landmarkGained`), you gain every uncovered square, once per landmark. **BGA**
  - **Gained mid-game:** you give all 4 tokens at once, choosing an opponent for each. **(my call:** BGA deals them round the table.)
- **Inventors.**
  - **The ability.** 4 tokens. Income turns 2–5: you may put a token on any tech card not in its owner's top row, yours or an opponent's (`chooseSlot`, answers `{ player, card }`).
    - The card is upgraded at once for its owner. It ignores its prerequisite now, and for the rest of the game for whoever holds it (`upgradable` checks the marks).
    - A mark stays with the card id, even through a discard and a later invent, and a second token may go on a card already marked. **(my call)**
    - The upgrade fires `upgraded` with `player` = the card's owner and `inventors` = your seat. Golden Age gives no VP for it. **BGA**
  - **The trigger** (hook `upgraded`), for an opponent's card carrying your token:
    - **It reaches their top row**, by anyone, your own token included: you may gain its square once (`chooseOption`, decline first), and then you take the card into your bottom row. Your token stays on it.
    - **It reaches their middle row through your ability:** you may gain its circle after them.
    - A card your token sends straight to the top row is offered once, by the first rule (02 §1.2: "your opponent gets the square benefit, then you do").
- **Isolationists.**
  - **The token.** 4 tokens. Whenever you conquer a territory that held no item before, you may also place a token there (`chooseOption`), and gain 1 any resource. With two items, nobody can conquer it.
  - **Final scoring.** Your final income turn (step 1 of income turn 5): VP for your largest group of controlled territories of one land terrain (R32): 1 → 5, 2 → 10, 3 → 16, 4 → 23, 5 → 31, 6 or more → 40 (R31). With none, 0. **(my call:** BGA scores 5 for none, and scores when the player finishes rather than in step 1.)
- **Leaders.** Income turns 2–5: you may cover an uncovered leader square (one per track) and advance on that track for free, with the benefit but no bonus (`advance { tracks: [t], noBonus: true }`). A blocked track, or one where no token can advance, isn't offered. **(my call:** BGA lets the square be wasted.)
- **Merrymakers.**
  - **Moving.** Income turns 2–5: move one of the 3 tokens up one space and gain everything on it. The move is required while one is possible. Two icons on one space are unordered, so the player picks the order.
  - **The columns**, bottom to top:
    - **Column 1:** 1 coin; 1 worker and 1 food; 1 culture and an armory.
    - **Column 2:** 1 territory tile; invent and 1 tapestry card; explore and research with the benefit and an optional bonus.
    - **Column 3:** 5 VP; 10 VP; 15 VP.
- **Militants.**
  - **The mat.** The outposts in your supply sit on its 8 spaces:
    - **Top row**, left to right: 1 coin, 2 VP, 1 food, 4 VP.
    - **Bottom row:** 1 VP, 1 worker, 3 VP, 1 culture.
  - **Taking an outpost.** Whenever an outpost leaves your supply (`takeOutpost`), it comes from the far left of a row you choose (`chooseSlot`). With one row left, it is taken there.
  - **The ability.** At the start of each income turn 2–5, gain every uncovered space. This is automatic.
  - **Gained mid-game:** your remaining outposts go on the spaces from right to left, choosing the row for each.
- **Mystics.**
  - **Predictions.** When the civilization comes into play at setup, predict 4 numbers, one category at a time (`chooseProphecy`):
    - tech cards: 1–9;
    - complete districts: 1–9;
    - controlled territories: 1–9;
    - completed tracks: 1–4.
  - **Reaching one.** The first time each count equals its prediction, gain 1 any resource. The counts are first checked once the four predictions are made, so a prediction already met pays at once. **BGA** A new trigger, `countsChanged { player }`, is fired after an invent, an upgrade, Inventors taking a card, a piece placed, the end of any conquest, a trap, a Revolution hex, an outpost placed, and a token reaching space 12. These are BGA's check points.
  - **Final scoring.** Step 1 of income turn 5: 10 VP for each prediction the count equals exactly.
  - **Gained mid-game:** discarded, and you gain another civilization.
- **Nomads.**
  - **Placement.** Whenever you place a building or landmark, it may go on the map instead (`choosePlacement` answers with `{ hex }`):
    - **(a)** a territory you control holding exactly 1 item: gain 1 any resource. It can no longer be conquered.
    - **(b)** an explored territory with no item, next to one you control: you control it now. This is not a conquest. An opponent may conquer it, toppling the piece like an outpost.
  - **The piece** is upright and gives control. It counts for building and landmark counts (R71), but not for the tiebreak (R13), Monarchy or "topple two".
- **The Chosen.** Income turns 2–5:
  - **Tracks:** for each track where no other token is further ahead than your best (the `trackLead` counter, which includes completed tracks), gain 1 VP per opponent.
  - **Achievements:** for each achievement you hold, gain 1 any resource. On income turn 5, gain 5 VP each instead.
- **Traders.** Income turns 2–5: you may place a token on any explored territory, anywhere (`chooseSlot`, purpose `traders`).
  - **A territory with no item:** gain 1 VP for each neighbouring territory an opponent controls. When an opponent later conquers it and keeps one die, you may gain the other die's face as if you had rolled it. This uses a new trigger, `dieKept { player, hex, other }`, fired by `chooseDie`.
  - **A territory with exactly one item, an opponent's upright outpost:** gain that territory tile's benefit (`tileBenefit`); a printed territory gives none. With two items, nobody can conquer it. A lone Nomads piece is not an outpost, so a token isn't offered there. **(my call)**
  - **Control.** The token never gives control (R33).

## 8. Items on the map

- **`Hex.tokens`** holds `{ seat, civ }[]`: the Traders' and Isolationists' tokens. They give no control.
- **Nomads' pieces** are entries in `Hex.outposts` with `piece: { building } | { landmark }`. They give control and topple like outposts. They are never counted as outposts: not for the supply, `toppledBy`, Revolution or "topple two". **BGA**
- **Conquering** needs at most one item (`outposts.length + tokens.length <= 1`). `loneOpponent` needs that one item to be an upright outpost or piece of another seat.
- **`landmarksOwned`** also counts landmarks on the map (R71).
- **`itemCount(state, hex)`** in `control.js` counts a hex's items. `cornersOf` and `turned` moved from `map.js` to a new `terrain.js`, beside the new `terrainsOf` (each terrain a territory shows, for the Isolationists). It imports only data, so civilization modules (the Isolationists) can read terrains without the import cycle `map.js` is part of.

## 9. Other changes to existing code

- **Placement.** `placeBuilding`, `placeLandmark` and `choosePlacement` gain answers for Craftsmen's columns (`{ craftsmen: 0 | 1 | 2 }`), Nomads' hexes (`{ hex }`) and, when alternatives exist but no capital plot does, `{ besideMat: true }`.
- **`placePiece`** fires `districtsCompleted` after its district reward.
- **`scoreCapital`** handles Architects' uniform lines.
- **`cityPlots`** shows Architects' cubes as impassable.
- **`conquerHex`** gets `takeOutpost`, items, and Isolationists' token offer. **`conquerDice`** fires `countsChanged`.
- **`chooseDie`** fires `dieKept`.
- **Tech cards.** `upgradable` honours Inventors' marks. `upgradeCard` takes an optional `inventors` seat for the `upgraded` payload, and Golden Age ignores such upgrades.
- **`moveToken`** gains `jump` (Futurists) and `noBonus` (Leaders). The `advance` effect gains `noBonus` and `offTrackVp`.
- **`runEffects`:** a finished player's passive operation runs only its VP.
- **Supply:** `supply.civDiscard`.
- **The new effect `lose`** (Futurists' adjustment).

## 10. Decisions and events

| Decision | Fields | Answer | Default |
|---|---|---|---|
| `chooseCivAbility` | `options`, `turn`, `done` | `{ civ }` | first |
| `chooseAlchemists` | `marked` | `{ roll: true }` or `{ roll: false }` | roll |
| `chooseSwap` | `left` | `{ a, b }` (two plot indexes) or `{ a: null }` | `null` |
| `chooseSlot` | `options`, `optional`, `purpose`, `then` | `{ slot }` or `{ slot: null }` | first, or `null` when optional |
| `chooseProphecy` | `category`, `options` | `{ value }` | first |
| `choosePlacement` (changed) | as before | adds `{ craftsmen }`, `{ hex }`, `{ besideMat: true }` | first capital plot, or beside the mat when there is none |

`chooseSlot` pushes `then` with `slot` added, so one decision serves every civilization pick. Each `purpose` tells the interface what is being asked:
- `architectsCube`: a plot for an impassable cube;
- `loseResource`: the resource to lose (the `lose` effect);
- `entertainers`: the space the token moves to;
- `merrymakers`: the column whose token moves up;
- `leaders`: the track whose leader square to cover (optional);
- `historians`: the opponent and the square, `{ to, square }`; `historiansTile`: the territory tile to discard;
- `militantsRow`: the row an outpost leaves; `militantsPlace`: the row an outpost goes on, when gained mid-game;
- `heralds`: the card to put a token on, `{ player, card }`;
- `inventors`: the tech card to put a token on, `{ player, card }`;
- `traders`: the hex for a token.

Its options compare by deep equality. An optional gain asks with `chooseOption`, purpose `civOffer`, the decline first. None of them has hidden fields: civilization mats are public, and `seat.civData` shows in every view.

| Event | Fields |
|---|---|
| `civGained`, `civDiscarded` | `player`, `civ` |
| `noCivLeft` | `player` |
| `civAbilityUsed` | `player`, `civ` |
| `tokenPlaced` | `player`, `civ`, `hex` |
| `alchemistsRolled` | `player`, `track`, `marked` |
| `alchemistsBust` | `player` |
| `prophecyMade` | `player`, `category`, `value` |
| `prophecyReached` | `player`, `category` |
| `resourcesLost` | `player`, `lost` |
| `cardsRevealed` | `player`, `cards`, `found` (R35's draw; `found` is null when nothing was found) |
| `entertainersMoved` | `player`, `space` (`'c<column>r<row>'`) |
| `merrymakersMoved` | `player`, `column`, `level` |
| `cubePlaced` | `player`, `plot` |
| `buildingsSwapped` | `player`, `a`, `b` (plot indexes) |
| `piecePlacedOnMap` | `player`, `hex`, `piece` |
| `militantsUncovered`, `militantsCovered` | `player`, `row`, `space` |
| `heraldsCopied` | `player`, `owner`, `card` |
| `historiansGave` | `player`, `to`, `square` |
| `inventorsMarked` | `player`, `owner`, `card` |
| `inventorsTook` | `player`, `from`, `card` |

Existing events change too:
- `capitalScored` gains `uniform`, the Architects' extra VP for lines of one building type.
- `buildingPlaced` has `craftsmen` (the column) instead of `row` and `col` for a building on a Craftsmen column.
- `placedBesideMat` can now follow a choice, `{ besideMat: true }`, as well as a full capital.
- `deckShuffled` has `deck: 'civs'` when `gainCiv` rebuilds the deck from the discards.

## 11. Tests

**Keeping civilizations out of other tests.** Once civilization abilities are real, every game a test starts has them, and their setup choices, VP and income-turn questions would change hundreds of existing tests. So `startedGame()` in `tests/helpers/engine.mjs` deals each seat a civilization with no setup effect and no adjustment: Leaders, Nomads, Inventors, Historians and Craftsmen, in seat order. Once play starts, it clears `seat.civs` and `seat.civData`, so no ability fires.
- A test that wants civilizations asks for them: `startedGame(n, { civs: ['alchemists', …] })` deals those, keeps them, and runs their setup and, in the current version, their adjustments.
- `newGame()` and `createGame()` stay untouched, so the setup tests still see real deals. **(my call)**

Each civilization gets at least one test of its ability in each version: the adjustment, or the lack of one, plus the ability itself. Further tests cover:
- the `civAbilities` order with two civilizations;
- a civilization gained in step 1 firing that turn;
- `gainCiv` from an empty deck and from the discards;
- passive VP for a finished Historians player;
- items blocking a conquest;
- Nomads' control and topple;
- Militants' rows when conquering and when gained mid-game;
- the Isolationists' land mass with multi-terrain tiles (R32);
- Mystics' check points;
- Inventors taking a card;
- the Heralds' Maker of Fire play in both versions (R35).

An end-to-end test (`tests/engine-civs-all.test.mjs`) plays every civilization's setup, all five income turns and the game end, in both versions, against the next civilization in the list. Each game is played twice: once with every default answer (income turns only, every optional choice declined), and once with up to two advance turns between income turns, every optional choice taken, and pieces placed on the Craftsmen's columns or the Nomads' map when offered. Each civilization's ability must fire on exactly its income turns. `tests/engine-view.test.mjs` checks that `seat.civData` shows in every view and `chooseCiv`'s options only in their owner's.

## 12. Files

```
src/lib/engine/civs/index.js        CIVS, findCiv, civsOf
src/lib/engine/civs/civ.js          the Civ typedef, offer, the placeToken effect
src/lib/engine/civs/<id>.js         the 16 civilizations
src/lib/engine/civ-turns.js         civAbilities, civSetup, civAdjust, civFirstTurnEnd, gainCiv
src/lib/engine/outposts.js          takeOutpost
src/lib/engine/terrain.js           terrainsOf, cornersOf, turned
src/lib/engine/effects/lose.js      the lose effect
src/lib/engine/decisions/           choose-civ-ability, choose-alchemists, choose-swap, choose-slot, choose-prophecy
```

## 13. What the other issues take over

| Issue | Takes over |
|---|---|
| #21 | The simulation test: civilization conservation across `supply.civs`, `supply.civDiscard` and every `seat.civs`, beside #19's invariants. |
| #27, #28, #47 | The civilization mats with their tokens, the items on the map, and the prompts for the new decisions. |
| #31 | Bots as opponents (The Chosen, Historians, Traders' VP, Architects' cubes) and their civilization cards. The Traders' `rivals()` copies `opponents()` to stay out of the import cycle, so #31 must update both. |

## 14. Documentation

CLAUDE.md's "Where the work stands", the #20 checklist, and the lines on #27, #28, #31 and #47.
