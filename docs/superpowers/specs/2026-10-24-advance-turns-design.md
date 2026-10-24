# Advance turns on the four tracks (#14): design

Written 2026-10-24. This is the third rules-engine issue. It plugs into the #13 core (`docs/superpowers/specs/2026-10-24-engine-core-design.md`): it adds decision kinds, automatic operations and effect handlers, and never changes the run loop.

Items marked **(my call)** are decisions I made that the owner has not confirmed. The owner settled R105 (#52) and told me to go ahead with #14 on the boundary below, reorganizing the issues first. The issue bodies of #14–#20 now name what each one takes over. As in #13, Board Game Arena (`elaskavaia/bga-tapestry`) is the prior art, and the engine is designed on its merits.

## 1. What and why

An advance turn is how a civilization grows: pay a tier's price, move one token one space, and take that space. Most track spaces do something another rules issue owns, such as explore (#17) or invent (#18). So #14 builds the turn itself and every effect that moves a token or reads the tracks, and it hands the rest off by name.

## 2. Goals

1. A player who has taken income turn 1 can choose an advance turn when they can pay for some advance. They pay the tier cost, move one token one space, and resolve the space (01 §3.1, §4.1).
2. The first player into tier II, III or IV of a track gains its landmark, on any player's turn (01 §3.1, FAQ #2, R9).
3. The benefit is mandatory. Its parts resolve in order when `ordered`, and otherwise in an order the player can choose wherever the order could matter (§6). The bonus is optional, paid at most once, and offered only when the player can pay it.
4. Research rolls the science die. The player may then advance on the rolled track, and the X gives no benefit or bonus. Landmarks are still gained (01 §3.3).
5. Nothing moves past space 12. Alien Biology scores 5 VP for a roll that would (01 §3.1, §3.7).
6. No player activates the same track space twice in one turn, in either version (R19, FAQ #5).
7. Each of the 48 spaces is tested. Where a space hands off to a later issue, the test checks what is handed off and when.

## 3. Non-goals and anti-goals

- **Non-goals.** These are handed off, and each issue's checklist names them:
  - placing buildings and landmarks (`placeBuilding`, `placeLandmark`) and `scoreCapital`: #16;
  - `explore`, `exploreSpace` (with R105's `fromGained`), `conquer` and `tileBenefit`: #17;
  - `invent`, `upgrade` and `techBenefit`: #18;
  - `tapestryOnTop` and the "complete any track" achievement: #19;
  - `gainCiv`: #20;
  - income turns, finished players and the game end: #15.
- **Anti-goals.** Any of these counts as failure:
  - a rule decided in the server or a component;
  - a handed-off effect that silently does nothing. Until its issue lands, it throws an ordinary `Error` that names the effect, as #13's unbuilt effects do. No real game reaches an advance turn before #15 anyway, because every first turn is an income turn;
  - a question to the player whose answer can't change anything.

## 4. The advance turn

1. **Turn start.** `startTurn` (used by setup's last step and by `endTurn`) emits `turnStarted`, clears the turn's activations, and pushes the seat's `chooseTurn` with an `endTurn` operation underneath. Everything the turn does runs above `endTurn`. **(my call)**
2. **`chooseTurn`.** The options are `['income']` on a first turn, and also `'advance'` once the seat could pay for at least one advance (§5). There is no pass (01 §4.1). Answering `advance` emits `turnChosen` and pushes `chooseAdvance`. Answering `income` still throws an ordinary `Error` naming #15.
3. **`chooseAdvance`.** The answer is `{ track, from, pay }`:
   - `from` is the space of the token to move. It matters only when AI Singularity has put a second token on a track, so it may be left out when every token on that track is on the same space.
   - `pay` names the actual resources, such as `{ food: 1, coin: 1 }` for tier II on exploration.
   - `answers()` lists every legal track, token and payment.
   - The cost is `advanceCost(track, from + 1)` (#12). The track's resource must be paid in that resource; `any` may be paid in any resource, the track's own included.

   Paying emits `resourcesPaid`; then the token moves (§7). The cost is one answer with the track, so a player never picks a track and only then finds out what it asks. **(my call)**
4. **`endTurn`.** It runs when everything above it is done. The next seat in seat order that hasn't finished takes its turn. #15 adds the game end to this step; until then, a game with no unfinished seat throws an ordinary `Error` naming #15.

## 5. Paying

`payment.js` holds the rules for paying a cost, shared by tier costs and bonuses. A cost (`data/effects.js`) names resources or things to discard, never both in the base game.

- **Resources.** The player pays exactly the named resources plus `any` more of any kind. They must hold them all.
- **Discards.** `territory: n` discards n territory tiles from the supply, `tapestry: n` n cards from the hand, and `tech: n` n tech cards from any row. The player names the ids, because tiles and cards differ.
  - Territory tiles leave the game for `supply.territoryDiscard`, because discarded tiles never return (FAQ #20). **(my call:** the field, so #21 can find every tile.)
  - Tapestry cards go to `supply.tapestry.discard` and tech cards to `supply.tech.discard`. Both piles are public, so the discard event names the cards.
- **`canPay`** says whether a seat holds enough. **`payments`** lists every way to pay, for `answers()`. **`checkPayment`** throws a `PlayerError`, and **`pay`** applies the payment and emits one event.

## 6. Benefits and their order

A space's benefit runs as #13's `effects` operation, with two new fields: `ordered` and `source: { track, space }`.

- **Ordered** benefits (the reference prints "then") run in list order, as in #13.
- **Unordered** benefits with two or more parts. **(my call)**
  - **Independent parts first.** `gain` and `vp` ask nothing that depends on the other parts, and in the base data no other part of the same benefit changes what they give or count. So they run first, and the player loses nothing by it.
  - **Choose among the rest.** If two or more parts remain, the player chooses which comes next (`chooseOrder`). When one part is left, it simply runs.
  - **Where the question appears.** It comes up exactly where the order can matter: Electronics and Nanotechnology (upgrade, then that card's benefit, or the other way round; FAQ #8), Cavalry (conquer and armory) and Mechs (conquer and civilization).
  - **Compared with BGA.** BGA instead marks a few spaces by hand as "choose the order": Cavalry, Nuclear Bomb, Mechs and Metallurgy. Every other benefit runs in a fixed order there.
  - **Expansions.** An expansion that adds a part which doesn't fit this rule widens it in its own issue.
- **`choice`** (Wagons, Herbalism, Biology, Stone Tools, Walls, Glass) asks `chooseOption` for one of the listed options, which then runs. Every option may be chosen, even one that would do nothing, since that is still the player's mandatory benefit.

## 7. Moving a token

`movement.js` holds one move for every way a token moves: the advance turn, `advance`, `regress` and `research`.

1. The token moves from `from` to `to`, and `tokenMoved` is emitted.
2. **Landmarks**, only when moving forward (R9). For each tier's first space (4, 7 or 10) that the move reaches or passes, the track's landmark, if still available, goes to the player. It leaves `state.landmarks`, `landmarkGained` is emitted, and a `placeLandmark` operation (#16) is pushed. Several are possible, lowest tier first. Regressing never gains landmarks.
3. **The space.** If the move gives the benefit, and the player hasn't activated that space this turn:
   - the space is recorded as activated;
   - `spaceActivated` is emitted;
   - its benefit runs (§6), then its bonus is offered (§8).

   Without the benefit (the X, Alien Biology), or on a space already activated this turn, the token still moves, but nothing more happens. **(my call:** an advance never fails because of the limit; it only gains nothing.)
4. **The stack.** Landmark placement, benefit and bonus are pushed together, so they resolve in the order of FAQ #1: landmark, benefit, bonus.

**The end of a track.** A token on space 12 cannot move forward. The advance turn doesn't offer that track. `advance` and research skip it. If no token on the rolled track can move, Alien Biology scores its 5 VP.

**Activations** are kept in `state.activated` as `{ player, track, space }` and cleared when a turn starts. They are kept per player, so an off-turn advance never blocks the current player (FAQ #5 says "during your turn"; R19 applies it in both versions).

## 8. The bonus

After the benefit, an automatic `bonus` operation checks whether the player can pay. If they can, it opens `chooseBonus`; otherwise nothing is asked. **(my call)**

- The answers are `{ pay: null }` (decline, the default) and every way to pay.
- Paying emits `bonusPaid`, then the bonus's effects run in order.

## 9. The track effects

| Effect | What happens | Decision |
|---|---|---|
| `research` | For each of `rolls` (default 1): roll `SCIENCE_DIE` (`random(12)`), emit `scienceDieRolled`. If some token on that track can move, the player may move one 1 space with the benefit and bonus, or with neither if `noBenefit`. If none can, gain `offTrackVp` (Alien Biology). The next roll comes after the decision. | `chooseMove` with `optional: true`; the advances come first and "stay" last |
| `advance` | Move 1 space forward on one of `tracks`, with benefit and bonus. Mandatory when any token there can move; otherwise nothing. | `chooseMove` |
| `regress` | Move 1 space back on one of `tracks`, then gain that space's benefit and bonus. Mandatory when any token there is past the start. Back to the start gains nothing. | `chooseMove` |
| `repeat` | Gain the benefit of a space where you have a token, and you may pay its bonus. The start space and the spaces you activated this turn are not offered, so Academic Research can't repeat itself (FAQ #6, #9). | `chooseRepeat` |
| `restartToken` | Take the token off the source space (AI Singularity, technology 12) and put a token on the start of any track, the technology track included. The track is recorded in `restartedTracks`, so it still counts as complete with 12 spaces advanced (01 §3.4, FAQ #9). | `chooseRestart` |
| `building` | Take one income building of that type off the income mat (the leftmost) and push `placeBuilding` (#16). With none left, nothing is gained and `noBuildingLeft` is emitted (FAQ #23). | none |
| `vp` (per) | 1 VP, or `each`, per thing counted (§10). | none |

Effect handlers receive the operation they run in as a fourth argument, so `restartToken` knows its source space.

## 10. The VP counters

| Counter | Counts |
|---|---|
| `territory` | Territories the player controls: hexes where every upright outpost is theirs and there is at least one (01 §7.3). `controlledTerritories()` lives in `control.js`, for #17 to reuse. |
| `territoryTile` | Territory tiles in the supply. |
| `techCard` | Tech cards in every row. |
| `tapestryCard` | Tapestry cards in the hand plus every card on the income mat, covered ones included. |
| `trackSpace` | Spaces advanced on `track`: the most advanced token, or 12 when the track is in `restartedTracks`. |
| `farm`, `house`, `market`, `armory` | Buildings that have left the income mat: 5 minus those left (R71). |

## 11. Decisions

| Kind | Fields | Answer | Default |
|---|---|---|---|
| `chooseAdvance` | none | `{ track, from, pay }` | the first track and payment |
| `chooseMove` | `direction` (`'advance'`, `'regress'`), `options` (`{ track, from }`), `benefit`, `optional` | `{ track, from }`, or `{ track: null }` to stay | the first move |
| `chooseOrder` | `effects`, the parts left to choose between | `{ effect: index }` | the first part |
| `chooseOption` | `options`, lists of effects | `{ option: index }` | the first option |
| `chooseBonus` | `track`, `space`, `cost`, `gain` | `{ pay: null }` or `{ pay }` | decline |
| `chooseRepeat` | `options` (`{ track, space }`) | `{ track, space }` | the first option |
| `chooseRestart` | `options` (track ids), `source` | `{ track }` | the first track |

None has hidden fields. `chooseBonus` lists hand cards in its answers, but `view()` sends answers only to their own player.

## 12. Events

| Type | Fields |
|---|---|
| `turnChosen` | `player`, `turn` |
| `resourcesPaid` | `player`, `paid` |
| `tokenMoved` | `player`, `track`, `from`, `to` |
| `landmarkGained` | `player`, `landmark`, `track` |
| `spaceActivated` | `player`, `track`, `space` |
| `scienceDieRolled` | `player`, `track` |
| `bonusPaid` | `player`, `track`, `space` |
| `tilesDiscarded` | `player`, `stack`, `tiles` |
| `cardsDiscarded` | `player`, `deck` (`'tapestry'` or `'tech'`), `cards` |
| `tokenRestarted` | `player`, `from`, `to` (track ids) |
| `buildingGained` | `player`, `building` |
| `noBuildingLeft` | `player`, `building` |

Everything here is public: tiles in supply, tech cards and the discard piles are face up.

## 13. State additions

- `state.activated`: `{ player, track, space }[]`, cleared at each turn start.
- `state.supply.territoryDiscard`: `number[]`.
- Every seat: `restartedTracks: TrackId[]`.

## 14. Tests

- The 48 spaces, one test each, from a token on the space before. Effects handed off are replaced, only inside the test, by stand-ins that record what they were given. The test checks the stand-in's calls and their order against the space's printed benefit.
- Turn choice: income only on a first turn, advance only when affordable, no pass. Costs per tier, payments that don't add up, the track resource, tokens at 12, two tokens on a track.
- Landmarks: the first player gains it, the second doesn't; an `advance` on another player's turn wins the race; research with the X still gains it; regressing never does.
- Order: Electronics asks; Medicine and Tunnels don't; independent parts run first.
- Bonus: offered only when payable, declined by default, paid once, each discard kind.
- Research: optional advance, X, Alien Biology off the track, a rolled track with no movable token.
- R19: Academic Research can't repeat itself or a space already activated; the limit is per player.
- AI Singularity: the token leaves, a track restart, 12 spaces counted, Academic Research can't repeat it afterwards.
- Every new decision kind's answers pass its own check (the #13 shape test), `play()` stays pure, and `view()` shows a bonus's hand-card answers only to their owner.

## 15. Module layout (my call)

```
src/lib/engine/
  turn.js          startTurn, endTurn
  payment.js       canPay, payments, checkPayment, pay
  movement.js      moveToken, movable tokens, spacesAdvanced, landmarks, activations
  control.js       controlledTerritories
  decisions/       choose-advance.js, choose-move.js, choose-order.js, choose-option.js, choose-bonus.js, choose-repeat.js, choose-restart.js
  effects/         research.js, move.js (advance, regress), repeat.js, restart-token.js, choice.js, building.js; vp.js gains the counters
```

The new automatic kinds are `endTurn`, `bonus` and `research`. Effect handlers take the operation as a fourth argument.

## 16. Left to the builder

- Field, event and error-message names, within the rules above.
- How the 48-space test table is laid out.
- Updating CLAUDE.md ("Where the work stands") and CONVENTIONS.md if a convention changes.
