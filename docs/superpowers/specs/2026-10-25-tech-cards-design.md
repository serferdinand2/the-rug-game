# Tech cards: inventing and upgrading (#18): design

Written 2026-10-25. This is the seventh rules-engine issue. It adds the 33 base tech cards as data and builds the three effects #14 hands over: `invent`, `upgrade` and `techBenefit`. It also builds the optional upgrade of income step 3 (#15) and the six landmark tech cards, which place their landmark through #16.

The owner had no preferences ("implement and we will see later"). So the rules research, the rule conventions and Board Game Arena (`elaskavaia/bga-tapestry`) settle everything, and every other decision is marked **(my call)** for the owner to revisit after playing.

## 1. What and why

A player invents tech cards into the bottom row beside their capital. Upgrading a card moves it up one row. Bottom to middle gives its circle benefit; middle to top needs a prerequisite and gives its square benefit. Six cards place a landmark. Until now, all three effects threw an `Error` naming themselves.

## 2. Goals

1. `invent` takes a face-up card or the top of the deck into the bottom row, and refills the display at once (01 §8).
2. `upgrade` moves 1 card up a row and gives its circle or square benefit. The top row needs the card's prerequisite, met by the player or either neighbour (01 §8, R18).
3. `techBenefit` gives the circle of a middle-row card or the square of a top-row card, without moving it (Electronics, Nanotechnology, Assembly Line).
4. The 33 base cards behave as 02 §4 prints them, including the six landmark cards.
5. Income step 3's upgrade may be declined. Every other upgrade is mandatory when possible (BGA formal rules).

## 3. Non-goals

- Radio's square (gain a random civilization) stays `gainCiv`, handed to #20.
- Printing Press's square (a tapestry card on top) stays `tapestryOnTop`, handed to #19.
- Civilizations that change tech cards (Inventors ignore prerequisites; Tinkerers): #20.
- Bots as neighbours for prerequisites: #31. Until then a bot neighbour's tracks count, and its income mat (it has none) never does.
- The F&F variant that removes Radio and Lithium-Ion Battery: #53.
- Expansion tech cards: their issues.

## 4. The data

`src/lib/engine/data/tech-cards.js` exports `TECH_CARDS`: the 33 base cards in `BASE_TECH` order (the catalog slugs). Each card is:

```js
{
	id: 'irrigation',
	name: 'Irrigation',
	circle: [{ gain: { food: 1 } }],          // gained moving bottom → middle
	square: [{ building: 'farm' }],           // gained moving middle → top
	requires: { track: 'science', tier: 2 },  // or { innovation: 'farming' }
	landmark: 'bakery',                       // only on the 6 landmark cards
}
```

- The benefits follow the 02 §4 table, number for number. Each is a list of one-key effects, as in #12.
- **`requires`** is `{ track, tier }` for 27 cards, where tier 2, 3 or 4 means a token on space 4, 7 or 10 or beyond. The six landmark cards use `{ innovation }`, the income-mat space `id`s of R18: Treasury `'currency'`, Stock Market `'banking'`, Bakery `'farming'`, Barn `'breeding'`, Library `'writing'`, Com Tower `'telephone'`.
- **New effect vocabulary** (added to `data/effects.js` and its design table):
  - `advance` and `regress` gain `noBenefit: true`: move the token without the space's benefit or bonus. Any landmark is still gained (#14's `moveToken`). They are used by Clocks, Siegecraft, Vaccines and Zeppelins (circle) and Time Travel (square, exploration or military).
  - `landmark: '<id>'`, a new kind: gain that landmark and place it (§8). It is used by the six landmark squares.
  - `repeat` gains `oncePerTurn: true` (Lithium-Ion Battery's square, FAQ #6).
- Effects that already exist: Assembly Line's circle is `{ techBenefit: { icon: 'square' } }` and its square `{ techBenefit: { icon: 'circle' } }`. The Nail's square is a `choice` of market, house or farm. Dynamite and Warships use `conquer`, Compass `explore`, Eyeglasses `invent`, Penicillin `research` with `noBenefit`, Radio `gainCiv` and Printing Press `tapestryOnTop`.

## 5. The deck and the display

`state.supply.tech` is `{ deck, faceUp, discard }`, as #13 set it up. `view()` already turns the deck into a count.

- **Drawing** a card takes the top of the deck. If the deck is empty, the discards are shuffled into a new deck first (FAQ #24), and `techDeckShuffled { count }` is emitted. With neither, there is no card.
- **Refilling** puts a drawn card in the display wherever a card left it, so the display keeps 3 cards while any can be drawn.
- **Refreshing** (Metallurgy, Rubber) discards the face-up cards and deals new ones. It emits `techDisplayRefreshed { discarded, faceUp }`.

## 6. Inventing

The `invent` effect, `{ invent: { count?, refresh? } }`, invents `count` cards (default 1) one at a time:

1. **The answers:**
   - `{ card }` for each face-up card, in display order;
   - `{ card: 'deck' }` when a card can be drawn;
   - `{ refresh: true }` when `refresh` is set and this is the first card of the effect. Refreshing is optional: "you may first replace". It is an answer rather than a separate question, so a player who doesn't want it isn't asked twice. **(my call)**
2. **No answer:** nothing happens, and `noInvent { player }` is emitted.
3. **One answer:** taken automatically, as for every pick with one option. **(my call**, the owner's #16 rule)
4. **Otherwise** `chooseInvent { player, left, refresh }` asks. The default (first answer) is the first face-up card.
5. **Taking a card** puts it at the end of `seat.tech.bottom`. It emits `techInvented { player, card, from: 'display' | 'deck' }`, then refills the display. A card from the deck is public from then on, like every tech card. With cards left to invent, it asks again without the refresh answer.
6. **A refresh** replaces the display, then asks again for the same card, without the refresh answer.

A newly invented card gives no benefit (01 §8).

## 7. Upgrading

The `upgrade` effect, `{ upgrade: { optional? } }`:

1. **Upgradable cards:**
   - every bottom-row card, which goes to the middle and gives its circle;
   - every middle-row card whose prerequisite is met, which goes to the top and gives its square.

   They are listed bottom row first, then middle, each in row order. Top-row cards can't be upgraded.
2. **The prerequisite** is met when the player or either neighbour (`neighbours()` in `income.js`) currently has:
   - **a track tier:** `spacesAdvanced(seat, track) ≥ 4, 7 or 10` for tier 2, 3 or 4, so a track AI Singularity restarted counts as 12;
   - **an innovation:** that income-mat space among `exposedSpaces(seat, row)`, for a player seat (R18).
3. **The answers** are `{ card }` for each upgradable card. With `optional`, `{ card: null }` comes first and declines, like a bonus. **(my call:** declining is the default, as for bonuses.)
4. **Mandatory with no card:** nothing happens, and `noUpgrade { player }` is emitted. **Mandatory with one card:** it is upgraded automatically. **Optional** always asks while a card can be upgraded, and does nothing when none can.
5. **Upgrading a card** moves it to the end of the next row and emits `techUpgraded { player, card, from, to }`. It then pushes `{ player, kind: 'effects', effects: <circle or square, cloned>, source: { tech: card, icon } }`.

## 8. Card benefits without moving, and landmarks

- **`techBenefit`**, `{ techBenefit: { icon } }`. The options are the cards in the middle row (`circle`) or the top row (`square`). With none, nothing happens (`noTechBenefit { player }`). One is taken automatically. Otherwise `chooseTechBenefit { player, icon, options }` asks. The chosen card's benefit is pushed with `source: { tech: card, icon }`, and the card stays where it is.
  - Electronics may take the circle of the card it just upgraded (FAQ #8): that card is in the middle row by then.
  - Chains end by themselves (R19). A card's circle or square always targets the other row, and track spaces activate once per turn.
- **`landmark`**, `{ landmark: id }`. If the landmark is still in `state.landmarks`, it leaves it, `landmarkGained { player, landmark, tech: true }` is emitted, and `placeLandmark { player, landmark }` (#16) is pushed. Otherwise `noLandmarkLeft { player, landmark }` is emitted and nothing is gained. This happens in ordinary play: Nanotechnology's square or Assembly Line's circle may pick a landmark card already in the top row, whose landmark the player has already placed. Such a card is still offered, since every option may be chosen even when it does nothing (as `effects/choice.js` does). **(my call)**
- **Lithium-Ion Battery's square** is `{ repeat: { oncePerTurn: true } }`. Its source card goes into `state.usedThisTurn` (`{ player, card }[]`, cleared when a turn starts, beside `state.activated`). A second use in the same turn does nothing and emits `oncePerTurnUsed { player, card }` (FAQ #6). **(my call:** a list by card, so later once-per-turn abilities reuse it.)

## 9. Decisions and events

| Decision | Fields | Answer | Default |
|---|---|---|---|
| `chooseInvent` | `left`, `refresh` | `{ card }`, `{ card: 'deck' }` or `{ refresh: true }` | the first face-up card |
| `chooseUpgrade` | `optional` | `{ card }` or `{ card: null }` | the first card; `null` when optional |
| `chooseTechBenefit` | `icon`, `options` | `{ card }` | the first option |

None has hidden fields: tech cards are public (01 §9.1). `check()` refuses anything not in `answers()`: "You can't invent that card.", "You can't upgrade that card." and "Choose one of the cards offered.".

| Event | Fields |
|---|---|
| `noInvent`, `noUpgrade`, `noTechBenefit` | `player` |
| `techInvented` | `player`, `card`, `from` |
| `techDeckShuffled` | `count` |
| `techDisplayRefreshed` | `discarded`, `faceUp` |
| `techUpgraded` | `player`, `card`, `from`, `to` |
| `landmarkGained` (existing) | `player`, `landmark`, plus `tech: true` |
| `noLandmarkLeft` | `player`, `landmark` |
| `oncePerTurnUsed` | `player`, `card` |

## 10. What the other issues take over

| Issue | Takes over |
|---|---|
| #19 | Printing Press's square (`tapestryOnTop`). |
| #20 | Radio's square (`gainCiv`); Inventors (no prerequisites) and Tinkerers. |
| #27, #28 | The tech-card rows and display, and the prompts for `chooseInvent`, `chooseUpgrade` and `chooseTechBenefit`. |
| #31 | Bots as neighbours for prerequisites. |
| #53 | The variant without Radio and Lithium-Ion Battery. |

## 11. Tests

- **Data:** the 33 cards are in `BASE_TECH` order; spot checks against 02 §4 (Irrigation, Clocks, The Nail, Time Travel, Lithium-Ion Battery, Assembly Line, every landmark card); 27 track and 6 innovation prerequisites; every effect has a known kind; the data is frozen.
- **Inventing:** a face-up card and its refill; the deck; the discards reshuffled when the deck is empty; nothing left; one answer taken automatically; Rubber's refresh and 2 cards, refreshing only before the first.
- **Upgrading:** bottom to middle with the circle; middle to top with the square; a prerequisite met by the player, by a neighbour, or by neither (not offered); R18's innovations by exposed space; top-row cards never offered; the optional upgrade declined; mandatory with one card automatic, with none nothing.
- **Card benefits:** Electronics double-dipping (FAQ #8); Nanotechnology's square; an Assembly Line chain ending (R19); a landmark card placing its landmark through #16; Lithium-Ion Battery's square only once per turn.
- **All 33 cards:** for each card, upgrading it from the bottom and from the middle runs its circle and square to completion, with the remaining stand-ins (`tapestryOnTop`, `gainCiv`) recorded.
- **Migrations:** `invent`, `upgrade` and `techBenefit` leave `stubHandoffs()`. The technology-track tests (spaces 1, 3–9 and 11), the income step 3 tests, the territory tiles with an invent or upgrade, and the black "?" on such a tile see the real thing.

## 12. Files

```
src/lib/engine/
  data/tech-cards.js        the 33 cards
  data/effects.js           noBenefit, landmark, oncePerTurn
  tech.js                   drawing, refilling, refreshing, prerequisites, upgradable cards
  effects/tech.js           invent, upgrade, techBenefit, landmark
  decisions/choose-invent.js, choose-upgrade.js, choose-tech-benefit.js
  effects/move.js           noBenefit
  effects/repeat.js         oncePerTurn
  state.js, setup.js, turn.js   usedThisTurn
```

## 13. Documentation

CLAUDE.md's "Where the work stands", the base-game data design's effect table (`docs/superpowers/specs/2026-10-24-base-game-data-design.md`), the #18 checklist and the §10 lines on the other issues.
