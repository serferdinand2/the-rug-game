# Exploring and conquering on the map (#17): design

Written 2026-10-24. This is the sixth rules-engine issue. It plugs into the #13 core and #14's advance turns. It builds the four effects #14 hands over: `explore`, `exploreSpace`, `conquer` and `tileBenefit`. It also builds the trap response, as the first response card of a general response step.

Items marked **(my call)** are decisions I made that the owner has not confirmed. The owner confirmed the rest in the brainstorm on 2026-10-24:
- when a player attacks an opponent's lone outpost, the defender is asked about a trap **whenever they have any card in hand**, so nobody learns who holds traps;
- **the table's version decides whether a finished player may still respond**: yes under the Original 2019 rules, no under the Current rules (R108);
- a defender who holds no trap is **declined automatically after a random wait**, so it looks the same from outside;
- conquering, exploring and space tiles work as played back in §5–§8.

As in #13–#16, Board Game Arena (`elaskavaia/bga-tapestry`) is the prior art, and the engine is designed on its merits. Where no rule convention covers a detail, BGA settles it, as the owner decided on 2026-10-21.

## 1. What and why

Exploring puts a territory tile on the map and scores matching edges. Conquering puts an outpost on a territory, sometimes toppling an opponent's. The defender may spring a trap. Then the attacker rolls the two conquer dice. Space tiles are explored beside the income mat. Until now, all four effects threw an `Error` naming themselves.

## 2. Goals

1. `explore` places a territory tile from the player's supply on a legal hex, in any of 6 orientations. It scores 1 VP per matching side and gives the tile's benefit (01 §7.2).
2. `conquer` places an outpost on a legal territory. It topples a lone opponent outpost, gives the defender a response question, and rolls both dice (01 §7.3).
3. A trap keeps the defender in control, topples the attacker's outpost and gives the defender 1 resource of their choice (R21).
4. The response question never reveals whether the defender holds a trap (owner).
5. `exploreSpace` explores a space tile beside the income mat and gives its benefits (01 §7.2), with R105 for Interstellar Travel.
6. `tileBenefit` gives the conquered territory tile's benefit; a printed territory gives nothing (R8).
7. A pick with exactly one legal option is made automatically, as for placement in #16 **(my call**, extending the owner's #16 rule).

## 3. Non-goals and anti-goals

- **Non-goals.** These are handed off (§11):
  - the random wait before an automatic decline, which needs a clock: #24;
  - the hot-seat pass screen, which must not give trap holders away: #30;
  - the achievements (topple two outposts, conquer the middle island): #19, from the records §6 keeps;
  - tapestry cards that change conquering, such as Pillage and Plunder: #19;
  - the Automa and Shadow Empire as attackers and defenders, including the Automa's trap pool: #31;
  - civilization tokens that count as items on a territory (Traders and others): #20.
- **Anti-goals.** Any of these counts as failure:
  - anything in `view()`, an event or another player's answers that tells the attacker whether the defender holds a trap before they decide;
  - an outpost on an unexplored hex (R16), on a hex with 2 items, or on a territory the player already controls;
  - an explore or conquer that silently does nothing when a legal move exists (benefits are mandatory, FAQ #4);
  - a tile or outpost that disappears or appears twice.

## 4. The state

- **`Outpost`** gains `toppledBy?: number`: the seat that caused the topple, the attacker in a conquest and the defender after a trap. An outpost stood back up loses it. #19's "topple two opponent outposts" reads it, together with `toppled`.
- **`Hex`** stays `{ tile, orient, outposts }`. `tile` is `null` while unexplored, 1–48 for a territory tile and 49–77 for a printed territory. `orient` is 60° clockwise steps, 0–5, as BGA stores it.
- An explored territory tile leaves `seat.territoryTiles` for its hex. An explored space tile moves from `seat.spaceTiles` to `seat.exploredSpace`. A trap card moves from the hand to `supply.tapestry.discard`.
- `seat.outposts` counts the outposts in supply. A conquer takes one; nothing ever returns one.
- Nothing new is private, so `view()` doesn't change. It already hides the hand, and the response question carries no hidden field (§7).

## 5. Exploring

The `explore` effect, `{ explore: { anywhere? } }`:

1. **Legal hexes:** every hex of the table's map side that is unexplored (`tile === null`). Unless `anywhere` is set, it must also be next to a territory the player controls (`controlledTerritories`, `hexNeighbours`).
2. **No tile in supply, or no legal hex:** nothing happens (FAQ #19). `noExplore { player }` is emitted.
3. **The answers:** every territory tile in the player's supply × every legal hex × orientations 0–5.
4. **One option:** if every answer puts the same tile on the same hex with the same turned corners, it is explored automatically. That happens with one tile, one hex, and a tile whose 6 corners are all sea. **(my call)**
5. **Otherwise** `chooseExplore { player, anywhere }` asks (§9).
6. **Exploring a tile** at `(hex, orient)`:
   - takes it out of `seat.territoryTiles` and sets the hex's `tile` and `orient`;
   - counts the matching sides (below), emits `explored { player, hex, tile, orient, vp }`, and gains that many VP through the `vp` handler;
   - pushes an `effects` operation with the tile's `benefit` (`TERRITORY_TILES`).
7. **No outpost and no control** come from exploring (01 §7.2).

**Matching sides**, as BGA's `getMatchingEdgeCount`. For each side `e` (0–5) of the new tile:
- the neighbour is `HEX_SIDES[e]` away. If it is off the map or unexplored, the side doesn't score;
- the neighbour's facing side is `w = (e + 3) % 6`;
- the new tile's printed corners at that side are `mL = (e − orient) mod 6` and `mR = (mL + 1) % 6`. The neighbour's are `wL = (w − its orient) mod 6` and `wR = (wL + 1) % 6`;
- the side scores 1 VP when `corners[mL] === theirs[wR]` or `corners[mR] === theirs[wL]`.

A neighbour's corners come from `TERRITORY_TILES` for tiles 1–48, and from the map side's `printed` entry for 49–77. Water counts as terrain, and an island in a tile's middle plays no part. Sides facing printed territories and the middle island can score.

## 6. Conquering

The `conquer` effect, `{ conquer: { anywhere?, bothDice? } }`:

1. **Legal targets:** every hex that:
   - is explored (R16);
   - holds at most 1 outpost;
   - is not controlled by the player;
   - is next to a territory the player controls, unless `anywhere` is set.
2. **No outpost in supply, or no legal target:** nothing happens. `noConquer { player }` is emitted.
3. **One target:** it is conquered automatically. **Several:** `chooseConquer { player, anywhere, bothDice }` asks (§9).
4. **Conquering a hex:**
   1. `opponent` is the seat of a lone upright outpost of another seat on it, if there is one. `bothDice: 'ifOpponent'` is judged now, before any trap (R17).
   2. One outpost leaves the supply and goes on the hex, upright. `outpostPlaced { player, hex }` is emitted.
   3. **An opponent's lone outpost** is toppled with `toppledBy: player`, and `outpostToppled { player: opponent, hex, by: player }` is emitted.
   4. **The response question.** The defender is asked when they are a player (not a bot), hold at least one card, and are not finished, unless the table plays the Original rules (§7, R108). Hand sizes are public, so skipping an empty hand reveals nothing.
   5. Under the question, an automatic `conquerDice { player, hex, both }` waits. `both` is true for `'always'`, or for `'ifOpponent'` when `opponent` was set.
   6. **Room for the expansions.** The steps run in this order: topple, the defender's response, then the dice. Plans & Ploys (#33) adds the attacker's counter-responses (Double Cross, Stolen Plans) between the response and the dice. Fantasies & Futures (#40) adds responses that act after the dice (Surrender). Each is its own operation pushed between these, so nothing here needs to change. **(my call)**
5. **`conquerDice`** runs once any trap is settled:
   - it emits `conquered { player, hex, trapped }`. `trapped` means the player's outpost there is toppled. #19's middle-island achievement reads it;
   - it rolls the red and black dice, each `random(6)`, and emits `conquerDiceRolled { player, red, black }` with the face indices into `RED_DIE` and `BLACK_DIE`;
   - **with `both`**, it pushes one `effects` operation with both faces' effects, `source: { hex }`;
   - **otherwise** it pushes `chooseDie { player, hex, red, black }` (§9). The chosen face's effect runs as an `effects` operation with `source: { hex }`.
6. **The dice always roll**, even after a trap (01 §7.3). The red die's "1 VP per territory you control" counts when it is gained, after control has changed.

**`tileBenefit`**, `{ tileBenefit: {} }`, the black die's "?":
- it reads the hex from its operation's `source.hex`. A tile 1–48 pushes that tile's `benefit` as an `effects` operation; a printed territory (49–77) gives nothing (R8). `tileBenefit { player, hex, tile }` is emitted, with `tile: null` for a printed territory;
- **after a trap it still gives the tile's benefit**, as BGA does. The rules don't say, so this is recorded as **R107** (BGA). Both versions.

## 7. The response question

`chooseResponse { player: defender, attacker, hex }` is a decision for the defender. It sits on top of the stack, so it is open at once, whoever's turn it is. It has a general name because the expansions add other response cards to it (Retreat, Surprise Party, Ghost Ships and more, 03 §1, §6), with one response per defender per conquer. In the base game the only response card is the trap. **(my call)**

- **Answers:** `{ card: null }` first, which is the default and declines, then `{ card }` for each response card in the defender's hand, in hand order. In the base game those are the traps, `trap-1` to `trap-7`. One function, `responseCards(state, defender)`, lists them, so the expansions extend it. The decision itself names no card, so it has no hidden field. Only its owner gets its `answers` in `view()`, as for every decision.
- **Declining** emits `responseDeclined { player, hex }`.
- **Springing a trap:**
  - the card leaves the hand for the tapestry discard, and `responsePlayed { player, hex, card, attacker }` is emitted. The card is public from then on;
  - the defender's outpost stands up again (`toppled: false`, no `toppledBy`), and the attacker's is toppled with `toppledBy: defender`. `outpostToppled { player: attacker, hex, by: defender }` is emitted;
  - an `effects` operation `[{ gain: { any: 1 } }]` is pushed for the defender (R21).
- **No response card in hand.** The defender still faces the decision, and its only answer is to decline. The server answers it after a random wait, so a defender without a trap looks the same as one who thought it over (owner). The engine needs nothing for this: the server sees that `answers()` holds only the decline. #24 builds the wait. **(my call:** a wait between 3 and 10 seconds.)
- **A finished defender** (R108):
  - **Current rules:** never asked. The Arts & Architecture amendment forbids responses after a player's final income turn (FAQ #18).
  - **Original 2019 rules:** asked like anyone else, since the amendment came later (owner). A sprung trap still keeps their control and topples the attacker, but its 1 resource is not gained, because a finished player gains nothing but passive civilization VP (01 §4.3, #15's central rule in `runEffects`).
- **A bot** is never asked, until #31.
- **`check()`** refuses a card that isn't a response card in the defender's hand: "You can't play that card as a response."

## 8. Space tiles

The `exploreSpace` effect, `{ exploreSpace: { fromGained? } }`:

1. **The options** are the space tiles in `seat.spaceTiles`.
2. **With `fromGained`** (Interstellar Travel, R105), the options are only the tiles this benefit just gained. These are the tiles named by the player's `tilesGained` events with `stack: 'space'`, emitted after the `spaceActivated` event of the operation's `source`, that are still in `seat.spaceTiles`. **(my call:** the events already record exactly which tiles were gained, and the data stays as #12 wrote it.)
3. **No option:** nothing happens. `noSpaceTile { player }` is emitted.
4. **One option:** it is explored automatically. **Several:** `chooseSpaceTile { player, options }` asks (§9).
5. **Exploring a space tile:**
   - moves it from `seat.spaceTiles` to `seat.exploredSpace`;
   - emits `spaceExplored { player, tile }`;
   - pushes an `effects` operation with the tile's `benefit`, `ordered` as `SPACE_TILES` says (tile 11 is "conquer, then 1 VP per territory", R5).

## 9. Decisions and events

| Decision | Player | Fields | Answer | Default (the first answer) |
|---|---|---|---|---|
| `chooseExplore` | explorer | `anywhere` | `{ tile, hex, orient }` | the highest-scoring answer; ties by tile id, then the map side's hex order, then orient **(my call)** |
| `chooseConquer` | attacker | `anywhere`, `bothDice` | `{ hex }` | the first legal hex in the map side's hex order |
| `chooseResponse` | defender | `attacker`, `hex` | `{ card }` or `{ card: null }` | `{ card: null }` |
| `chooseDie` | attacker | `hex`, `red`, `black` | `{ die: 'red' }` or `{ die: 'black' }` | `'red'` **(my call)** |
| `chooseSpaceTile` | explorer | `options` | `{ tile }` | the first option |

None has hidden fields. `check()` refuses anything not in `answers()`, with a sentence a player understands, such as "You can't explore there." or "Choose one of the two dice.".

| Event | Fields |
|---|---|
| `noExplore` | `player` |
| `explored` | `player`, `hex`, `tile`, `orient`, `vp` |
| `noConquer` | `player` |
| `outpostPlaced` | `player`, `hex` |
| `outpostToppled` | `player` (the outpost's owner), `hex`, `by` |
| `responseDeclined` | `player`, `hex` |
| `responsePlayed` | `player`, `hex`, `card`, `attacker` |
| `conquered` | `player`, `hex`, `trapped` |
| `conquerDiceRolled` | `player`, `red`, `black` |
| `tileBenefit` | `player`, `hex`, `tile` |
| `noSpaceTile` | `player` |
| `spaceExplored` | `player`, `tile` |

**Answer sizes.** `chooseExplore` can list many answers: tiles × hexes × 6, a few thousand at most with "anywhere". The server sends them only to the exploring player. #23 may trim them if they prove too large. **(my call)**

## 10. Interaction with what exists

- `runEffects` already skips every effect of a finished player, so a finished player never explores or conquers.
- `changes()` in `effects/index.js` already treats `explore` as changing the territory-tile counter, and `conquer`, `exploreSpace` and `tileBenefit` as possibly changing anything, so unordered benefits still ask for an order where it matters.
- `stubHandoffs()` in `tests/helpers/engine.mjs` stops standing in for `explore`, `exploreSpace`, `conquer` and `tileBenefit`. The tests that relied on those stand-ins now see the real thing, as #16's did.

## 11. What the other issues take over

| Issue | Takes over |
|---|---|
| #19 | "Topple two opponent outposts" counts outposts whose `toppledBy` is the player and that are still toppled. "Conquer the middle island" is a `conquered` event on the map side's `middle` with `trapped: false`. Pillage and Plunder skips the response question and gives both dice; the Pirate rule gives `tileBenefit`. |
| #20 | Civilization tokens that are items on a territory, so a hex with an outpost and a token can't be conquered. Civilizations that change exploring or conquering. |
| #24 | When a `chooseResponse`'s only answer is to decline, the server answers it after a random wait (owner), of 3–10 seconds (my call). The turn timer's timeout takes each decision's first answer. |
| #30 | The hot-seat pass screen for a response question must not show who holds a response card. Every asked defender gets the same pass screen and wait. |
| #31 | The Automa and Shadow Empire conquering and exploring, and the Automa's face-down trap pool (02 §9.7). |
| #27, #28 | The map view and the prompts for `chooseExplore` (tile, hex and turn, with the VP shown), `chooseConquer`, `chooseResponse`, `chooseDie` and `chooseSpaceTile`. |
| #33, #40 | The other response cards, added to `responseCards()`; the attacker's counter-responses (Double Cross, Stolen Plans) as their own step before the dice; responses after the dice (Surrender); and how the privacy rule applies to an attacker's counter-response. |

## 12. Tests

New tests, written first, in `tests/engine-map.test.mjs` (and others if it grows too long):

- **Exploring.**
  - Only unexplored hexes next to a controlled territory are offered. With `anywhere`, every unexplored hex is offered.
  - No tile, or no legal hex, does nothing and emits `noExplore`.
  - Matching sides score as in §5. A hand-built neighbourhood checks a printed territory, the middle island, an unexplored neighbour and the map edge. Turning the tile changes the score.
  - The tile leaves the supply, its benefit is gained, and no outpost is placed.
  - One option is explored automatically. The default answer scores the most.
- **Conquering.**
  - Each outcome: an empty territory; an opponent's lone outpost with no trap; a sprung trap; a defender with an empty hand (no question); a finished defender: no question under the Current rules; a question under the Original rules, where a sprung trap gives no resource (R108).
  - Refused targets: an unexplored hex (R16), a hex with 2 outposts, the player's own territory, a hex that isn't next to one they control. `anywhere` drops the last rule.
  - No outpost in supply does nothing.
  - Tanks gives both dice against an opponent, even when trapped (R17), and one die against an empty territory. Mechs always gives both.
  - The red die's "per territory" counts the new territory. The black "?" gives the tile's benefit, gives nothing on a printed territory, and still gives the tile's benefit after a trap (R107).
  - `toppledBy` and `conquered { trapped }` are recorded.
- **The response question.**
  - A sprung trap discards the card, gives the defender 1 resource of their choice (R21), keeps them in control and topples the attacker.
  - A defender with cards but no trap is still asked; their only answer is to decline.
  - **Privacy.** For a defender with a trap and one with none, the attacker's `view()` is identical apart from the hand counts: same decision, no answers, no card. The events before the answer are identical too.
  - A non-trap card is refused.
- **Space tiles.** A tile goes beside the mat and gives its benefits, in order for tile 11 (R5). Interstellar Travel offers only the tiles it just gained, fewer than 3 if the stack ran low, and none if it gained none (R105). With no tile, nothing happens.
- **Every new decision kind** gets a fixture in `tests/engine-final-fixes.test.mjs`, and its answers pass its `check()`.

Existing tests that change:
- `tests/helpers/engine.mjs` stops standing in for `explore`, `exploreSpace`, `conquer` and `tileBenefit`.
- The track-space tests for exploration 2, 3, 4, 6, 7, 9, 11 and 12 and military 1, 3, 5, 6, 7, 8 and 12, the movement and order tests, and the scripted game (steps 4 and 5), now see real explores and conquers. The whole suite finds any others.

## 13. Files

```
src/lib/engine/
  map.js                          legal hexes, matching sides, exploring and conquering a hex, the dice
  effects/explore.js              explore and exploreSpace
  effects/conquer.js              conquer, tileBenefit, and the automatic conquerDice
  decisions/choose-explore.js
  decisions/choose-conquer.js
  decisions/choose-response.js
  decisions/choose-die.js
  decisions/choose-space-tile.js
  kinds.js, effects/index.js      registrations
  state.js                        Outpost.toppledBy
README.md                         R107 and R108 in "Rules conventions"
```

The builder may split or merge these if a file grows too long or too thin.

## 14. Documentation

In the same pull request:
- CLAUDE.md's "Where the work stands", and the owner's response-question decision under "Decided 2026-10-24";
- R107 and R108 in the README's "Rules conventions", and "R1–R106" becomes "R1–R108";
- the #17 checklist, and the §11 lines on #19, #20, #24, #27, #28, #30, #31, #33 and #40.

The interface doesn't change, so the README's "Current interface" stays as it is.
