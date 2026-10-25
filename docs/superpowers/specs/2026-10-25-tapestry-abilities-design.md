# Tapestry cards and achievements (#19): design

Written 2026-10-25. This is the eighth rules-engine issue. It gives the 43 base tapestry cards and the trap their abilities, builds the `tapestryOnTop` effect that #14 and #18 hand over, and builds the 3 achievements. It also lays down three things #20's civilizations reuse: **abilities that last** (a THIS ERA card now, a civilization next), **triggers** (code that runs when something happens), and **advance blocks**.

The owner asked for #19 and #20 to be built without a question round ("go ahead and work on #19 and #20"). So the research, the rule conventions (R1–R108) and Board Game Arena (`elaskavaia/bga-tapestry`, read on 2026-10-25) settle what they can. Where BGA is the basis, it says **BGA**. Every other decision is marked **(my call)** for the owner to revisit after playing.

## 1. What and why

A tapestry card is played onto the income mat on income turns 2–4. A **WHEN PLAYED** card does something once. A **THIS ERA** card changes the rules for its player until the start of their next income turn. Until now, `chooseTapestry` pushed `tapestryAbility` and nothing ran it, and `tapestryOnTop` threw an `Error` naming itself.

The achievements are the three races printed on the board: complete a track, topple two opponent outposts, conquer the middle island. They were data only.

## 2. Goals

1. All 43 base cards and the trap work as 02 §3 prints them, with the rulings listed there.
2. A THIS ERA card works from the moment it is played until the start of its player's next income turn. It stops at once when another card covers it (01 §9.2).
3. `tapestryOnTop` plays a card from the hand onto the current era's slot (Nuclear Bomb, Printing Press). With an empty hand nothing is played (FAQ #10). R25 settles era 1, step 1 and income turn 5.
4. Cards that reach other players do so through `effects` operations, so finished players are skipped (#15).
5. The achievements are claimed the moment the condition is met, on anyone's turn, in the order players meet it, and score at once (R23, R24).
6. Triggers and abilities are general enough that #20 adds civilizations to them without touching the call sites again.

## 3. Non-goals

- Civilizations, Heralds copying cards and their Maker of Fire play: #20. This design leaves room for them (§5, §6).
- Bots as opponents and neighbours (Age of Discovery reaches bots; Age of Wonders compares with them): #31. Until then only player seats are opponents.
- Expansion cards and CONTINUOUS cards: their issues.
- The prompts and the tapestry strip on screen: #27, #28.

## 4. The data

`src/lib/engine/data/tapestry-cards.js` exports `TAPESTRY_CARDS`, the 43 cards in catalog order and then the trap, and `tapestryCard(id)`, which also maps `trap-1`…`trap-7` to the trap.

```js
{
	id: 'meritocracy',
	name: 'Meritocracy',
	timing: 'played',                 // 'played' (WHEN PLAYED) or 'era' (THIS ERA)
	played: [{ invent: {} }, { vp: { per: 'techCard', each: 2 } }],
	ordered: true,                    // the default; Renaissance is the only false
}
```

- **`played`** is what runs when the card's ability resolves. For a WHEN PLAYED card that is the whole card. For a THIS ERA card it is the setup choice, if any: Alliance and Marriage of State choose their partner (`eraPartner`). The other 18 THIS ERA cards have `played: []`; their rules live in triggers and checks (§6).
- **The trap** played as a tapestry card is `[{ vp: 10 }]` (R22).
- A test checks that the ids match `BASE_TAPESTRY`.

### New effect vocabulary

Added to `data/effects.js` and to the base-game data design's effect table.

| Effect | Used by | What it does |
|---|---|---|
| `tapestryOnTop: {}` | Nuclear Bomb, Printing Press | Plays a card from the hand onto the current era's slot (§7). |
| `eraPartner: { track? }` | Alliance, Marriage of State | Chooses the opponent (and track) the active THIS ERA ability names. |
| `copyTapestry: {}` | Espionage | Copies the ability of a visible tapestry card (§7). |
| `sharedAdvance: { track: 'roll' \| 'choose', others: 'opponents' \| 'neighbours', optional? }` | Age of Discovery, Oil Magnate | You advance with the benefit; the others advance on the same track without it. |
| `others: { who: 'neighbours' \| 'all', effects }` | Coal Baron, Diplomacy, Steam Tycoon | Each listed player runs `effects` as their own `effects` operation. Neighbours go right, then left; `all` goes from you clockwise. |
| `trade: { offers: { pay: Cost, gain: Effect[] }[], optional?, host? }` | Guilds, Olympic Host | Pay one offer's cost for its gain. `Cost` gains `vp`. |
| `discardTapestry: { vpEach }` | Democracy | Discard any number of cards from the hand, one at a time, for `vpEach` VP each. |
| `anyBuilding: {}` | Diplomacy, Olympic Host | One income building of the player's choice, among the types still on the income mat. |
| `trackLandmark: {}` | Dystopia | Gain any track landmark nobody owns, and place it. |
| `landmarkRank: { fewest, most, otherwise }` | Age of Wonders | Compares landmarks owned with every opponent. |
| `placeOutpost: { hex }` | Militarism | Puts an outpost from the supply on a hex. Not a conquest. |
| `darkAges`, `socialism`, `dictatorship`, `revolution`, `colonialism`, `pleaForAid`, `technocracy`, `tradeEconomy`, `coalBaron`, `olympicHost` (each `{}`) | the card of that name | One card's own rules (§8). |

Changes to existing kinds:
- `advance` gains `optional` (Oil Magnate) and `freeBonus` (Renaissance: no benefit, but the bonus of the space reached may be taken without paying).
- `explore` gains `tile` (Coal Baron explores with the tile it just gained).
- `invent` gains `faceUpOnly` and `thenUpgrade` (Steam Tycoon, Technocracy) and `deckOnly` (Steam Tycoon's neighbours).
- New VP counters: `trackLead` (tracks where no other token is further ahead than your best, ties included: Boast of Superiority), `landmark` (landmarks you own anywhere, R71: Feudalism) and `opponent` (other seats: Technocracy).
- `Cost` gains `vp`. `canPay`, `payments`, `checkPayment` and `pay` handle it like a fixed resource: you can't pay VP you don't have (Guilds).

## 5. Abilities that last

`src/lib/engine/abilities.js` answers "what is active for this player now".

### THIS ERA

- **`seat.era`** (player seats) is `null` or `{ card, ability, opponent?, track? }`:
  - `ability` is the card whose rules apply;
  - `card` is the physical card on the income mat whose covering ends it. They differ only for Espionage, which copies another card's ability (`card: 'espionage'`);
  - `opponent` and `track` are set by `eraPartner`.
- **It starts** when the card's `tapestryAbility` resolves (§7), so a card played in step 2 already works in steps 3 and 4 of the same income turn (Capitalism, Mercantilism, Golden Age). **BGA**
- **It ends**, emitting `eraEnded { player, card, ability }`:
  - at the start of the player's next income turn, before civilization abilities: a new income step `eraEnd`, first in `INCOME_STEPS`, on income turns 2–5 (01 §9.2);
  - when a card is played on top of `card` (01 §9.2: only the visible top card is active);
  - when the player finishes. A THIS ERA card played during income turn 5 (R25, current rules) therefore works for the rest of that turn. **(my call:** BGA never lets a card be played then; ending at the finish keeps an ability from outliving its player.)
- `eraAbility(state, player)` returns the active ability id or `null`. `hasEra(state, player, id)` tests one.

### Advance blocks

`advanceBlocked(state, player, track)` is true when:
- the player's era ability is Broker of Peace and the track is military, or Theocracy and the track is science;
- another player's Dictatorship block names the track (§8).

Every forward move a player chooses consults it: the advance-turn options (`advances`), the `advance` effect, research results, `sharedAdvance`, Dark Ages, Socialism, Renaissance and Dictatorship. A blocked option is simply not offered; a mandatory move with no option left does nothing. Regressing is never blocked. **(my call:** Dictatorship, Broker of Peace and Theocracy all say "advance". The official note that Dictatorship blocks Socialism (02 §3) is read as Socialism's forward jump. BGA reads it the same way.)

### Allies

`allies(state, player)`: the seats that hold an Alliance naming the player, and the seat the player's Alliance names. `conquerTargets` leaves out every hex an ally controls (Alliance: "neither of you may conquer the other's territories"). **BGA**

## 6. Triggers

A trigger is code that runs when something happens to a player, for any player whose ability cares. `triggered(state, hook, payload)` returns the operations to push. Each handler is `(state, owner, payload) => NewOperation[]` and changes nothing itself; whatever it does happens in the operations it returns. The call site decides where they go: usually right after its own operations, so "after them" holds.

- **Who is asked.** Every player seat, in seat order starting with the acting player, with its era ability. #20 adds each seat's civilizations to the same list.
- **The registry.** `ERA_HOOKS` (`src/lib/engine/eras.js`) maps a THIS ERA card id to its handlers.

| Hook | Called from | Payload | Handlers (#19) |
|---|---|---|---|
| `invented` | `inventCard` | `player`, `card` | Academia (+3 VP), Industrialism (the card's circle; the card stays put) |
| `tapestryGained` | the `gain` effect's tapestry draw | `player`, `cards` | Academia (+3 VP per card), Tyranny (§8) |
| `upgraded` | `upgradeCard` | `player`, `card`, `icon` | Golden Age (+3 VP, every upgrade), Alliance (the holder gains the same benefit after the ally) |
| `advanced` | `moveToken`, forward moves only | `player`, `track`, `from`, `to`, `claimedPassed` | Broker of Peace, Empiricism, Theocracy, Revisionism |
| `landmarkGained` | `moveToken`, `landmark`, `trackLandmark` | `player`, `landmark`, `fromTrack` | Revisionism |
| `benefitGained` | `activationOps`, Trade Economy | `player`, `track`, `space` | Marriage of State |
| `buildingGained` | the `building` effect | `player`, `building` | Capitalism (+1 coin for a market) |
| `piecePlaced` | `placePiece` (a piece on the capital mat) | `player`, `building?`, `landmark?`, `impassable` | Monarchy, Terraforming |

`claimedPassed` counts the tier first spaces (4, 7, 10) the move reached or passed whose landmark someone already owned. `impassable` counts the impassable plots the piece covers.

Rules that change how a step works are plain checks at that step, not triggers: Age of Sail, Exploitation and Militarism (exploring), Pillage and Plunder and Pirate Rule (conquering), Wartime Economy (bonuses), Golden Age (prerequisites), Empiricism (science die), Terraforming (where pieces fit), Capitalism and Mercantilism (income).

## 7. Playing cards

`src/lib/engine/tapestry.js`.

- **`playTapestry(ctx, player, card, era, faceDown)`** puts the card on top of that era's slot. If the card it covers is `seat.era.card`, the THIS ERA ability ends. It emits `tapestryPlayed`, and unless the card is face down it pushes `tapestryAbility { player, card, era }`. `chooseTapestry` and `faceDownTapestry` use it.
- **`tapestryAbility`** (automatic) looks the card up with `tapestryCard`. A THIS ERA card sets `seat.era` and emits `eraStarted { player, card, ability }`. Then `played` runs as an `effects` operation with `source: { tapestry: ability, card }`: the card whose rules run, and the card on the mat, null for a copy with no card behind it (#20's Heralds). `copyTapestry` rests its copy on that `card`. The operation may carry `ability` when it differs from `card` (Espionage).
- **The current era** for a play "on top of your current tapestry" is the player's `incomeTurns`:
  - era 1 (income turn 1): nothing is played (R25);
  - eras 2–4: that era's slot. During step 1 of an income turn the slot is still empty, and the card goes there; the step-2 card then covers it (R25);
  - income turn 5: current rules play onto the era-4 stack; original rules play nothing (R25).
- **`tapestryOnTop`** pushes `chooseTapestry { options: hand, era }`. A lone card in hand is played without asking, as for any pick with one option. **(my call:** income step 2 still asks, as #15 built it.) With an empty hand, or no current era, it emits `noTapestryOnTop { player }` (FAQ #10).
- **`startEra`** first ends any era still active, so a player never has two.
- **`chooseTapestry`** gains `optional` (a `{ card: null }` answer, first) and `afterPlay` (effects that run only if a card was played). Its options stay hidden.
- **Espionage** (`copyTapestry`) offers the visible top card of every slot of every player, its own included. It leaves out face-down cards, covered cards and Espionage itself (02 §3; **BGA**). A trap played as a tapestry can be copied (10 VP). The answer pushes `tapestryAbility { player, card: 'espionage', ability: <copied>, era }`. So a copied THIS ERA card works while Espionage is uncovered, and a copied Alliance or Marriage of State asks for its partner. With no card to copy, it emits `noCopy { player }`.
- **`eraPartner`** asks `choosePartner`. The options are the other player seats, and for Marriage of State every track too, except a track another active Marriage of State already names (the official anti-loop ruling for a copied Marriage of State, 02 §3). With no option it does nothing. The answer is written into `seat.era`.

## 8. The cards

WHEN PLAYED cards first, then THIS ERA. Each line is the whole rule; "BGA" marks a BGA reading where 02 §3 is silent.

### WHEN PLAYED

- **Age of Discovery.** `sharedAdvance { track: 'roll', others: 'opponents' }`. Roll the science die (Empiricism applies). You must advance on that track with the benefit, and may pay the bonus. Then every opponent, clockwise from your left, must advance on it without benefit or bonus; they still gain landmarks, in that order (02 §3). A blocked or finished player is skipped. **BGA**
- **Age of Wonders.** `landmarkRank`. Count every landmark each seat owns (R71). Fewer than every opponent: 2 any resources. More than every opponent: 12 VP. Anything else, ties included: 1 any resource and 6 VP. With no opponent (solo before #31): the last. **BGA**
- **Boast of Superiority.** `{ vp: { per: 'trackLead', each: 4 } }`. A track counts when no other seat's best token is further ahead than yours. `spacesAdvanced` makes a track AI Singularity restarted count as 12, for everyone. **BGA**
- **Coal Baron.** `coalBaron`. Gain the top territory tile and explore with it; the explore must use that tile (**BGA**). If the tile is gone (Age of Sail's gift), nothing is explored. Then each neighbour gains 1 tile, right then left (02 §3's order; BGA has them draw before the explore).
- **Colonialism.** `colonialism`. Choose a territory tile you control (not a printed territory, R27). Gain 1 resource for each different land terrain on it, corners and island: mountain → worker, grassland → culture, forest → food, desert → coin. With none, nothing. **BGA**
- **Dark Ages.** `darkAges`. Choose the track to advance on, among those where you could advance; if there are none, among those where you have a token. Regress once without benefit on each other track, where possible. Then advance 3 times without benefit on the chosen track, one space at a time, gaining landmarks (the F&F FAQ order: regress, then advance).
- **Democracy.** `[{ gain: { tapestry: 3 } }, { discardTapestry: { vpEach: 2 } }]`. Any cards may be discarded, new ones and traps included; `chooseDiscard` asks one card at a time until the player stops. **BGA**
- **Dictatorship.** `dictatorship`. Choose a track you can advance on. Opponents are blocked on it (`state.blocks`), then you advance on it with the benefit and may pay the bonus. The block lifts when turn order next reaches you, or skips you because you have finished (R26; BGA lifts it at the start of your next turn too). With no track to advance on, nothing happens and nothing is blocked. **(my call)**
- **Diplomacy.** `[{ anyBuilding: {} }, { others: { who: 'all', effects: [{ gain: { any: 1 } }] } }]`. **BGA** order.
- **Dystopia.** `trackLandmark`. Choose any of the 12 track landmarks nobody owns; gain it and place it. With none left, nothing (02 §3).
- **Espionage.** `copyTapestry` (§7).
- **Feudalism.** `choice` of `[{ gain: { any: 1 } }]` or `[{ vp: { per: 'landmark', each: 3 } }]`.
- **Guilds.** `trade`, mandatory: pay 5, 10 or 15 VP for 1, 2 or 3 any resources, or pay 1, 2 or 3 any resources for 5, 10 or 15 VP. With nothing affordable, nothing. **BGA**
- **Meritocracy.** Invent, then 2 VP per tech card you have.
- **Oil Magnate.** `sharedAdvance { track: 'choose', others: 'neighbours', optional: true }`. Choose a track where you have a token. You may advance on it with the benefit and may pay the bonus. Then each neighbour, right then left, may advance on it without benefit or bonus (gaining landmarks). **BGA**
- **Olympic Host.** `olympicHost`. Starting with you and going clockwise, each player with a worker may pay 1 worker for 10 VP (`trade`, optional, marked with the host). Then, if any opponent paid and you have an income building left, gain 1 of your choice; otherwise gain 1 coin. **BGA**
- **Plea for Aid.** `pleaForAid`. For each track where your best token is behind every other seat's every token: 2 VP and 1 any resource. **BGA**
- **Renaissance.** Four `advance { noBenefit, freeBonus }` effects, one per track, unordered, so the player chooses the order (**BGA**). Landmarks are gained. Each space reached offers its bonus for free, unless that space was already activated this turn (R19); offering it activates the space, as BGA's once-per-turn marker does.
- **Revolution.** `choice` of `[{ gain: { any: 1 } }]` or `[{ revolution: {} }]`. The second picks 1 to 3 hexes holding your toppled outposts, one at a time (the first is required, the rest optional). On each, your outposts stand up and every upright opponent outpost topples, toppled by you. Not a conquest: no dice, no middle island. "Topple two" is checked after each hex.
- **Socialism.** `socialism`. For each of your tokens, the options are the nearest opponent token ahead of it and the nearest behind it on the same track (not one on the same space; **BGA**). Ahead is left out on a blocked track. The token jumps there without benefit or bonus. A forward jump gains every landmark it passes (R9).
- **Steam Tycoon.** `[{ invent: { faceUpOnly: true, thenUpgrade: true } }, { others: { who: 'neighbours', effects: [{ invent: { deckOnly: true } }] } }]`.
- **Technocracy.** `technocracy`. If no other seat has started this era (`incomeTurns` at least yours), invent and upgrade that card. Otherwise 3 VP per opponent. **BGA**
- **Trade Economy.** `tradeEconomy`. Choose any opponent token on space 1–12 of any track, except a space you activated this turn (R19). You gain that space's benefit, which activates the space for you. If it has a bonus, its owner may take it for free.
- **Trap** (played as a tapestry). 10 VP (R22).

### THIS ERA

- **Academia.** +3 VP for each tech card you invent and each tapestry card you gain. **BGA**
- **Age of Sail.** Whenever you explore, first draw 3 territory tiles, even if the explore then finds no hex. Before placing, you may give 1 territory tile from your supply to an opponent for 3 VP (`chooseGift`), once per explore. **BGA**
- **Alliance.** Choose an opponent. Neither of you may conquer the other's territories. Whenever they upgrade a tech card, you gain the same benefit after them (no Golden Age VP for it). **BGA**
- **Broker of Peace.** You can't advance on military. +3 VP each time an opponent advances on military. **BGA**
- **Capitalism.** In your income step, +2 VP per coin icon earned. Whenever you gain a market, also gain 1 coin. **BGA**
- **Empiricism.** +2 VP each time you advance on science. Every science die you roll rolls twice, and you choose one result (`chooseRoll`, which can't be declined). **BGA**
- **Exploitation.** Whenever you explore a territory tile, choose: the matching-side VP and the benefit as usual, or the benefit twice and no VP (`chooseOption`). Space tiles are not territories (02 §3).
- **Golden Age.** Upgrades to the top row ignore prerequisites. +3 VP for every upgrade, bottom to middle too. **BGA**
- **Industrialism.** Whenever you invent a card, gain its circle benefit; the card stays in the bottom row. With Steam Tycoon or Technocracy the circle comes twice. **BGA**
- **Marriage of State.** Choose an opponent and a track. Whenever they gain a track space's benefit on that track (advances, repeats, Trade Economy), you gain the same benefit after them, without the bonus. A benefit you gain this way doesn't trigger another Marriage of State. **(my call)** It emits `benefitCopied`.
- **Mercantilism.** In your income step, for each food icon earned, you may turn 1 food into 1 other resource for 2 VP (`chooseConversion`). **BGA**
- **Militarism.** Whenever you explore a territory tile and have an outpost left, you may put one there (`chooseOption`), before the tile's benefit. Not a conquest: no dice, no response, no achievement. **BGA**
- **Monarchy.** +3 VP whenever you place an income building in your capital city. A building beside the mat isn't in the city (R13's reading), so it scores nothing. **(my call:** BGA scores it too.)
- **Pillage and Plunder.** Whenever you conquer a territory with an opponent's outpost, the defender isn't asked for a response, and you gain both dice. **BGA**
- **Pirate Rule.** Whenever you conquer, after the dice you also gain the conquered territory tile's benefit (`tileBenefit`); a printed territory gives nothing. It applies even after a trap. **BGA**
- **Revisionism.** +1 any resource whenever you gain a track landmark, Dystopia included. +1 armory for each landmark space a forward move of yours reaches or passes whose landmark someone already owns. **BGA**
- **Terraforming.** Your buildings and landmarks may cover impassable plots. +5 VP for each piece that covers at least one. **BGA**
- **Theocracy.** You can't advance on science. +4 VP for each tier your forward move enters: each first space (1, 4, 7, 10) it reaches or passes. **(my call:** R9's reading of "entering a tier". BGA counts only a move that lands on that space.)
- **Tyranny.** Whenever you gain tapestry cards, you may play one of them on top of Tyranny at once (`chooseTapestry`, optional, among the cards just gained). If you do, gain 5 VP; Tyranny is then covered, so it happens once. **BGA**
- **Wartime Economy.** A bonus whose cost is only "any resource" costs nothing. It stays optional. **(my call:** BGA takes it automatically, but bonuses are always optional, FAQ #4.)

## 9. Achievements

`src/lib/engine/achievements.js`. `claimAchievement(ctx, player, id)` puts the player in `state.achievements[id]` and gains the VP of the next box on the map side at once (R23, R24). Nothing happens if the player already has it, every box is taken, or the player has finished. **(my call:** a finished player gains nothing but passive civilization VP, 01 §4.3.) It emits `achievementClaimed { player, achievement, vp }`.

- **Complete any track.** Checked in `moveToken` whenever a token reaches space 12, by any move and on anyone's turn. A track AI Singularity later restarts was reached first, so it already counts.
- **Topple two opponent outposts.** Counts the outposts whose `toppledBy` is the player and that are still toppled. It is checked when a conquest ends (in `conquerDice`, after any response, for every seat with an outpost on that hex, attacker first), and after each Revolution hex. Checking at the end of the conquest keeps a topple that a trap undoes from counting. **(my call)**
- **Conquer the middle island.** A conquest of the map side's `middle` hex that isn't trapped (`conquerDice`).
- **Order.** Each check claims as it runs, so players are ordered by when they met the condition: Age of Discovery's roller first, then clockwise.

## 10. Other changes to existing code

- `research`: `rollScience(ctx, player, next)` rolls once, or twice with Empiricism (asking with `chooseRoll` when the faces differ), then pushes `next` with the track. Research and Age of Discovery use it. A roll whose track is blocked gives nothing, not Alien Biology's VP. **(my call)**
- `moveToken`: claims "complete any track", fires `advanced` and `landmarkGained`, and with `freeBonus` offers the bonus free.
- `activationOps`: fires `benefitGained` after the benefit, before the bonus.
- `bonus` operations gain `free`: `offerBonus` then offers the bonus with an empty cost (Renaissance, Trade Economy's owner), as it does under Wartime Economy. `offerBonus` offers nothing to a finished player, since Trade Economy's owner bonus is a bare `bonus` operation that `runEffects` can't skip (01 §4.3).
- `chooseMove`: `direction: 'jump'`, whose options carry `to` (Socialism), and `freeBonus` (Renaissance).
- `advances` leaves out blocked tracks, and `chooseAdvance.check` refuses one with "You can't advance on that track now."
- `explore`: Age of Sail, Exploitation, Militarism and `tile`. `spaceTileOptions` also accepts `benefitCopied` as the start of a benefit (Marriage of State copying Interstellar Travel).
- `conquerHex` and `conquerDice`: Pillage and Plunder, Pirate Rule, the achievements. `conquerTargets`: allies.
- `inventCard`: `faceUpOnly`, `deckOnly`, `thenUpgrade` (an automatic `upgradeCard { player, card }`), and `invented`. The next card of a multi-card invent waits under the triggers, as an `invent` effect that keeps every option but `count` and `refresh`. `chooseInvent` carries those options as `invent`, so they reach every card of the effect.
- `upgradable`: Golden Age.
- `city.js`: `buildingSpots`, `landmarkSpots` and the problem checks take a `terraform` flag; `placeBuilding` and `choosePlacement` pass it.
- Income: the `income` step adds Capitalism's VP and Mercantilism's conversions after the income; `finish` ends the era.
- `startTurn` and `endTurn`: Dictatorship blocks lift (R26).

## 11. Decisions and events

| Decision | Fields | Answer | Default | Hidden |
|---|---|---|---|---|
| `chooseTapestry` (changed) | `options`, `era`, `optional?`, `afterPlay?` | `{ card }` or `{ card: null }` | first card; `null` when optional | `options` |
| `choosePartner` | `options` | `{ player, track? }` | first | |
| `chooseCopy` | `options` (`{ player, card }`), `espionage` (the Espionage card on the mat) | `{ player, card }` | first | |
| `chooseTrack` | `options`, `purpose`, `then` | `{ track }` | first | |
| `chooseRoll` | `options` (2 tracks), `then` | `{ track }` | first | |
| `chooseTrade` | `offers`, `optional`, `host?`, `source?` (the space or card the gain came from) | `{ offer, pay }` or `{ offer: null }` | first; `null` when optional | |
| `chooseDiscard` | `vpEach` | `{ card }` or `{ card: null }` | `null` | |
| `chooseHex` | `options`, `optional`, `purpose`, `then` | `{ hex }` or `{ hex: null }` | first; `null` when optional | |
| `chooseLandmark` | `options` | `{ landmark }` | first | |
| `chooseSpace` | `options` (`{ player, track, space }`) | the same | first | |
| `chooseGift` | none | `{ tile, player }` or `{ tile: null }` | `null` | |
| `chooseConversion` | `max` | `{ resources }` (coin, worker, culture; total ≤ `max` and ≤ food held) | none converted | |
| `chooseInvent` (changed) | `left`, `refresh`, `invent` | as before | as before | |
| `chooseMove` (changed) | `direction` (`'jump'` too), `options` (`{ track, from, to? }`), `freeBonus?` | `{ track, from, to? }` | as before | |
| `chooseOption` (changed) | `options`, `purpose?` (`'militarism'`, `'exploitation'`) | as before | as before | |
| `chooseExplore` (changed) | `anywhere?`, `tile?` (the only tile offered: Coal Baron) | as before | as before | |

`chooseTrack` and `chooseHex` push `then` with the answer added, so one decision serves several cards; `purpose` tells the interface what is being asked. `chooseDiscard`'s answers come from the hand, and only its player sees answers, so nothing else needs hiding.

| Event | Fields |
|---|---|
| `eraStarted`, `eraEnded` | `player`, `card`, `ability` |
| `noTapestryOnTop`, `noCopy` | `player` |
| `partnerChosen` | `player`, `opponent`, `track?` |
| `trackBlocked`, `trackUnblocked` | `player`, `track` |
| `achievementClaimed` | `player`, `achievement`, `vp` |
| `tileGiven` | `player`, `to`, `tile` |
| `benefitCopied` | `player`, `track`, `space`, `from` |
| `outpostRaised` (existing), `outpostToppled` (existing) | Revolution reuses them |
| `outpostPlaced` (existing) | Militarism adds `militarism: true` |
| `tradeMade` | `player`, `offer`, `host?` |
| `vpPaid` | `player`, `vp`, `total` (the player's VP after paying) |
| `resourcesConverted` | `player`, `resources`, `vp` |
| `noTrade`, `noMove`, `noColonialism`, `noOutpost` | `player` |
| `noBuildingLeft` | `player`, `building` (`null` for any building) |
| `noLandmarkLeft` | `player`, `landmark` (`null` for Dystopia) |

## 12. What the other issues take over

| Issue | Takes over |
|---|---|
| #20 | Civilizations in `triggered()` and the advance checks; Heralds copying WHEN PLAYED cards (`chooseCopy` with a purpose) and playing on Maker of Fire (`chooseTapestry` with era 1); Inventors upgrading an ally's card (`upgraded` with the card's owner). |
| #27, #28 | The tapestry strip, the active era card, blocks, achievements and the prompts for the new decisions. |
| #31 | Bots as opponents and neighbours in every card that names them. |

## 13. Tests

- **Data:** 44 entries in catalog order, `tapestryCard('trap-3')`, timings (20 THIS ERA, 23 WHEN PLAYED and the trap), every effect a known kind, frozen.
- **Playing:** WHEN PLAYED runs once; THIS ERA starts at play, works in the same income turn's later steps, ends at the next income turn's start, when covered, and at the finish; face-down cards do nothing; `tapestryOnTop` in eras 1, 2–4 and 5 for both versions, with an empty hand, and in step 1 (R25); Espionage copying a WHEN PLAYED card, a THIS ERA card (and losing it when covered), a trap, and with nothing to copy.
- **Every card** has at least one test of its rule as written in §8, and the edge named there (Coal Baron's tile, Dark Ages' blocked track, Socialism's two directions, Trade Economy's owner bonus, Olympic Host with and without an opponent paying, Technocracy first and not first, Golden Age's prerequisite, Alliance's conquer block both ways, Marriage of State's track exclusion, Pillage and Plunder's skipped response, Pirate Rule after a trap, Terraforming on an impassable plot, Tyranny's one play).
- **Blocks:** Broker of Peace, Theocracy and Dictatorship remove options from advance turns, research and card advances; a Dictatorship block lifts when turn order reaches its player (R26).
- **Achievements:** each one; the claiming order with 3 players (Age of Discovery); boxes running out; a trapped conquest of the middle island; a topple undone by a trap; Revolution; a finished player gains nothing.
- **Migrations:** `tapestryOnTop` and `tapestryAbility` leave `stubHandoffs()`; the Nuclear Bomb and Printing Press tests and the scripted game see the real thing.

## 14. Files

```
src/lib/engine/
  data/tapestry-cards.js      the 43 cards and the trap
  data/effects.js             the new effect kinds and counters
  tapestry.js                 playing cards, the current era, visible cards, tapestryAbility
  abilities.js                era abilities, blocks, allies, triggered()
  eras.js                     the THIS ERA triggers
  achievements.js             claiming and the three checks
  effects/tapestry.js         tapestryOnTop, copyTapestry, eraPartner, discardTapestry
  effects/players.js          others, sharedAdvance, trade, olympicHost
  effects/cards.js            darkAges, socialism, dictatorship, tradeEconomy, pleaForAid, technocracy,
                              landmarkRank, trackLandmark, anyBuilding, coalBaron, colonialism, revolution, placeOutpost
  decisions/                  choose-partner, choose-copy, choose-track, choose-roll, choose-trade, choose-discard,
                              choose-hex, choose-landmark, choose-space, choose-gift, choose-conversion
```

## 15. Documentation

CLAUDE.md's "Where the work stands", the base-game data design's effect table, the #19 checklist, and the §12 lines on #20, #27, #28 and #31.
