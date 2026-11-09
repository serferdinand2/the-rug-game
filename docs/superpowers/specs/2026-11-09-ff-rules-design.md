# Fantasies & Futures rules: charms, reservations, the overlay and the new tech cards (#39): design

Written 2026-11-09. #39 is in M9 · Fantasies & Futures. Its one GitHub blocker, #38 (the A&A Automa changes), is Lazar's: the owner leaves the Automa issues to him, so F&F starts without waiting (owner, 2026-11-09), as #35 and #36 started before #34. Decisions are marked **(owner)** or **(my call)**; earlier rulings are cited by rule id. My calls on the rules become R131–R134 in the README's "Rules conventions". **The owner approved this design on 2026-11-09**, the scope move of §4 and the lobby switch included; the calls in §12 stay the owner's to check after playing.

## 1. What and why

Fantasies & Futures adds two mechanisms that every one of its cards uses: **charms** on the tapestry cards and **items reserved for income turn 5** on a new income-mat overlay. Its 12 tech cards add a third: a top-row prerequisite met by a charmed card or by income turn 5, and **single-use** square benefits that flip the card. #39 builds the three mechanisms and the expansion switch, so a table can turn F&F on.

**Done when** a table with F&F on plays charms, reservations and the new tech cards in a full game with the mouse, with any mix of the other expansions, and a game without F&F is unchanged, seed for seed.

## 2. Decided

- **Scope (owner, #39):** 03 FF.2: charms, reservations for income turn 5, the overlays, the replacement cards and the era-4 stack after income turn 5. The Kaiju scenarios are out. The F&F Automa (#41) is Lazar's.
- **Looks (owner, 2026-11-09):** the new pieces are built from the existing card, income-mat and prompt patterns, with no mockup round, and marked **awaiting review** in the component library, as #37 did. The owner checks them there and in a game.
- **Earlier rulings that apply:** R25 (a card played in or after income turn 5 goes onto the era-4 stack in the current version, none in the original), R67 (a covered card's right charm still triggers), R68 (every charmed card that goes onto the mat counts for the prerequisite), R71 (a building that left the income mat counts for "per building", never as "in the city"), R72 (Elder Ones and Merfolk after income turn 5), R75 (response cards played as a tapestry gain their charms), R80 (Generation Ships' arts option), R82 (Lost Artifacts takes a face-up card or the deck's top), R85 (Zombie Army's conquers), R92 (the overlay's back isn't modelled), R100 (rulebook r10-1 is the text of record), R117 (no building left), R118 (the arts track counts as any track), R124 (A&A's arts content leaves without the arts track).

## 3. Already built (nothing to do but test)

The rules F&F's comprehensive rulebook gives every game are in already:
- **The era-4 stack:** `currentEra()` sends a card played in or after income turn 5 to the era-4 slot under the current rules (R25).
- **A response card that topples the attacker denies the middle-island achievement:** `conquerDice` denies it whenever the attacker's outpost was toppled, whatever toppled it.
- **The 5 replacement cards:** Oil Paint's prerequisite (R125), Migration's wording (#37 reads "space" and "territory" the same), and the corrected footprints of Birdwatching Perch, Castle and Villa (`art/footprints.js` already draws the corrected shapes, 03 FF.6b 3.2).

Part 1 adds a test for each of these, so they stay put.

## 4. Scope and parts (my call)

The mechanisms are tested with the real cards that carry them, not with stand-ins, so #39 also adds the content that only these mechanisms need:
- the **11 tapestry cards that reserve an item** (Ecstatic Visions, Generation Ships, Ghost Towns, Great Library of Potions, Lost Artifacts, Microbial Magic, Phantasmal Paladins, Quest Culture, Secret Societies, Suspended Animation, Zombie Army), with their charms;
- the **12 tech cards** (all carry the new prerequisite, 8 are single use).

#40 keeps the other 26 tapestry cards (the response cards among them), the 10 civilizations and the 6 advanced mats; its issue text is updated when #39 lands. This follows #35, which built the masterpieces with the arts track.

**The expansion switch (my call):** `EXPANSIONS_BUILT` gains `'ff'` in part 1, so the lobby offers F&F once #39 lands, dealing the content built so far, as Plans & Ploys was offered from #32 (owner, 2026-10-31) and A&A from #35 and #36.

Three parts, each landing on the branch `issue-39-ff-rules` with every test green and the game playable:
1. **The tech cards** (§7, §9): the switch, the prerequisite, single use, the 12 tech cards, and §3's tests.
2. **Charms and reservations** (§5, §6, §8): charms, the overlay, the income-turn-5 step and the 11 cards that carry both; the simulation plays F&F. Charms moved here from part 1 while planning it, since the only charmed cards #39 adds are these 11, so charms are tested with them.
3. **The screen** (§10): card faces, the overlay on the Eras tab, prompts, log lines, How to play, the library, the lobby, screenshots, the README and status.

Each engine part carries its own log lines and decision words, so a new choice never shows as raw data. Part 3 adds the pictures.

## 5. Charms

**Data.** `TapestryCard` gains `charms?: { left?: Effect[], right?: Effect[] }`, numbers exact from 03 FF.4.1. An "X OR Y" charm is a `choice`. Only F&F's cards have charms (R69).

**When they trigger.** Everything happens in `playTapestry()`, when a card goes onto a player's era slot `e` (any way: the income turn, an overplay, a card on Maker of Fire, a play after income turn 5):
- **Left charm:** the card is face up and slot `e − 1` holds a card, face up or face down. Era 1 has no slot to its left: Maker of Fire is printed, not a card (03 FF.2.1).
- **Right charms (R67):** every face-up card in slot `e − 1`, covered or not, whose right charm hasn't triggered yet triggers it now, whether the new card is face up or face down. Each card's trigger is kept once in `seat.charmsUsed` (the card ids), so a later card on slot `e` triggers nothing (R72 follows).
- **A face-down card has no charms (R131, my call):** played face down it gains no left charm, and its right charm never triggers, since nobody sees it; it does not count as a charmed card played (R68 applies to face-up cards only), or the prerequisite would tell the table what a hidden card is.
- **Played charmed:** a face-up charmed card going onto the mat sets `seat.playedCharmed = true` for good (R68).

**Order (03 FF.2.1).** The charms and the card's own ability (WHEN PLAYED effects, or starting its THIS ERA) resolve in the order the player chooses. They become one unordered `effects` operation of three new effect kinds: `charm: { card, side }` (runs that card's charm), and `ability: { card, era }` (pushes today's `tapestryAbility` operation). The existing `chooseOrder` asks only when the order can matter: a charm whose effects are all plain gains counts as a gain and runs first without a question, as `nextIndex()` already does for gains. A lone item runs at once.

**Mandatory** where possible (03 FF.2.1): the charm's effects run as ordinary benefits, so an "advance without benefit" charm is taken. **Never copied:** Espionage and the Heralds copy an ability through `tapestryAbility`, which never reaches charms. A copied ability that reserves an item does reserve it (03 FF.2.1, Microbial Magic).

**VP:** a charm's VP counts as the tapestry cards' (`source: { tapestry, card, charm }`), and each charm gained emits `charmGained { player, card, side }` for the log.

## 6. Reserved items and income turn 5

**The overlay.** With F&F, each player seat starts with `reserved: ReservedItem[]`, the items on its overlay, in the order placed; public, as everything on the mat. An item names the card that reserved it (`card`, the card on the mat) and the card whose rules apply (`ability`, which differs for a copy), and what it is:

| Item | Placed by | What it counts for while reserved |
|---|---|---|
| `{ building }` | Microbial Magic (farm), Phantasmal Paladins (armory), Great Library of Potions (market), Secret Societies (house): the next one off the income mat | Its income-mat space is uncovered at once; it counts for "per farm" and the like (R71), never as in the capital |
| `{ tech }` | Lost Artifacts: a face-up card (the display refills) or the deck's top (R82) | Nothing: "do not score it until it is invented" |
| `{ space }` | Generation Ships, Ecstatic Visions: 1 of 3 drawn, the other 2 shuffled back | Nothing |
| `{ masterpiece }` | Ecstatic Visions with the arts track: 1 of 3 drawn, the other 2 shuffled back | Nothing; it can't be broadcast |
| `{ territory: [3 tiles] }` | Quest Culture: 3 tiles from the supply | "VP per territory tile" |
| `{ outposts: n }` | Zombie Army: up to 3 of the player's outposts, each from a territory that holds that one outpost and nothing else; those territories are vacated | Nothing |
| `{ token }` | Ghost Towns, Suspended Animation: a reminder | Nothing |

A new effect kind `reserve: { … }` places each; with nothing to place (no farm left, an empty stack), nothing is reserved. Drawing 3 to keep 1 is a decision whose hidden options only its player sees; the 2 returned are shuffled back, so the decks change and undo can't let a player peek (the #24 handoff).

**Income turn 5.** A new income step, `reserved`, runs on income turn 5 only, with F&F, after `tapestry` and before `upgrade`, where the tapestry step would be (03 FF.2.2). It uses every reserved item, in the order the player chooses (**R132, my call**: the rulebook gives no order, so the player picks, as for masterpieces; an item is mandatory where possible). Each item's use is its card's `reserved` effects:

| Card | Income turn 5 |
|---|---|
| Microbial Magic, Phantasmal Paladins, Great Library of Potions, Secret Societies | Place the reserved building anywhere that takes income buildings, as a gained one (its triggers follow, 03 FF.2.2) |
| Lost Artifacts | Invent the card, then upgrade it twice, ignoring prerequisites |
| Generation Ships | Explore the reserved space tile, or with the arts track discard it to gain an inspiration tile |
| Ecstatic Visions | Explore the reserved space tile; or gain the reserved masterpiece (**R133, my call**: it joins the player's masterpieces and fires once at once, as a masterpiece gained during the masterpiece step does) |
| Quest Culture | Explore anywhere with each of the 3 tiles |
| Zombie Army | Each outpost returns to the supply and makes one normal conquer, one at a time; with no legal target it stays in the supply (R85) |
| Ghost Towns | 3 VP per income building still on the income mat |
| Suspended Animation | Advance on any track with its benefit, the bonus free |

**Used at once after era 4 (03 FF.2.2).** A card that reserves an item while its player is on or after income turn 5 (a play onto the era-4 stack) uses the item at once. A covered card's items are still used, since they live on the overlay, not the card.

**Tunnels and the like** can't take a reserved building: it is no longer on the income mat, so nothing that takes from the mat sees it.

## 7. The prerequisite and single use

- **`requires: { charmOrFive: true }`** (all 12 F&F tech cards): met when `seat.playedCharmed` or the player is on or after income turn 5. Neighbours are ignored. Golden Age and an Inventors token waive it, as every prerequisite.
- **`singleUse: true`** (8 of the 12): gaining the square benefit flips the card: it stays in the top row, listed in `seat.tech.flipped`, and still counts as a tech card. A flipped card's benefits are never gained again by any effect (Technocracy-style benefit copies, the Recyclers' recycling, the Inventors' theft) (**R134, my call**: 03 FF.2.3 says other players may not use flipped techs; the card's own "gain the square benefit once" rules out its owner too). An opponent may not upgrade a player's single-use card to the top row (03 FF.2.3); the Inventors' stolen single-use card stays flipped and can't be upgraded again.

## 8. The 11 reserving tapestry cards

All WHEN PLAYED. Effects as 03 FF.4.3, charms as FF.4.1, numbers exact. Without the arts track an "X or arts" choice offers only X (R118's tracks in play); nothing leaves the deck.

| Card | When played | Left charm | Right charm |
|---|---|---|---|
| Ecstatic Visions | Reserve 1 of 3 masterpieces (arts track only) or 1 of 3 space tiles | 1 territory tile and 1 tapestry card, or advance on arts without benefit | — |
| Generation Ships | Reserve 1 of 3 space tiles | — | 1 VP per territory tile, or regress on arts without benefit (R80) |
| Ghost Towns | Reserve a reminder | Advance on any track without benefit | Advance on any track without benefit |
| Great Library of Potions | Reserve the next market | 1 coin and 5 VP | Invent 1 tech card |
| Lost Artifacts | Reserve a tech card (R82) | — | Advance on technology without benefit |
| Microbial Magic | Reserve the next farm | 1 food and 5 VP | 1 VP per territory tile |
| Phantasmal Paladins | Reserve the next armory | 1 culture and 5 VP | 1 VP per territory you control |
| Quest Culture | Reserve 3 territory tiles | — | 1 territory tile, or explore with a territory tile |
| Secret Societies | Reserve the next house | 2 tapestry cards, or advance on arts without benefit | 1 worker and 5 VP |
| Suspended Animation | Reserve a reminder | 1 tapestry card | 1 tapestry card |
| Zombie Army | Reserve up to 3 outposts | 1 armory | — |

Solo removes none of them (03 FF.4.1); #31 reads `solo` as for Granges.

## 9. The 12 tech cards

Data in `data/tech-cards.js` with `expansion: 'ff'`, all `requires: { charmOrFive: true }`, effects as 03 FF.5:

| Card | Circle | Square | Single use |
|---|---|---|---|
| Golem Minions | 1 VP per landmark (every landmark owned, R71) | Advance on military without benefit, then 1 VP per military space advanced | No |
| Levitation | Explore with a territory tile, or gain 1 space tile | Explore a space tile from your supply | Yes |
| Mind Control | Advance on science or military without benefit | Advance on science or military, benefit, may pay the bonus | Yes |
| Object Cloning | Advance on arts or technology without benefit | The same with benefit, may pay the bonus | Yes |
| Perfect Memory | Advance on science or arts without benefit | The same with benefit, may pay the bonus | Yes |
| Pyrokinesis | 1 armory | 1 VP per territory you control, then 1 VP per armory | No |
| Remote Viewing | 1 territory tile, then explore anywhere | Research with benefit, may pay the bonus | Yes |
| Superhuman Strength | Advance on exploration or military without benefit | The same with benefit, may pay the bonus | Yes |
| Super Speed | 1 VP per territory tile in your supply | Explore twice | No |
| Teleportation | Advance on exploration or technology without benefit | The same with benefit, may pay the bonus | Yes |
| Transmogrification | Invent 1 tech card | 1 income building of your choice | No |
| Weather Control | Explore with a territory tile | Gain the benefit of your current position on any track, may pay the bonus (Lithium-Ion Battery's icon) | Yes |

`techDeck(expansions, variants)` adds them after A&A's. Without the arts track, Object Cloning and Perfect Memory offer only their other track and stay in the deck.

## 10. The screen

From the existing patterns, each new piece marked **awaiting review** in the library:
- **Tapestry card faces:** a charm tag on the card's left or right edge, in F&F's teal, and the charm's words as its own line of the copy ("Left charm: …"). Reserving cards say what they reserve and what it does on income turn 5. The F&F edition chip already exists (`ui.js`).
- **The overlay:** with F&F, the Eras tab's slots gain a fifth, "V · Reserved", which shows the reserved items when selected: buildings, cards and tiles by their existing chips and small faces, outposts and the reminder token by the player's colour.
- **Tech card faces:** the prerequisite reads "A charmed card played, or income turn 5"; single-use cards say "Single use"; a flipped card shows the tech back with its name and "Used".
- **Prompts:** the order of charms and an ability uses `chooseOrder`'s list; keeping 1 of 3 space tiles or masterpieces uses the existing tile and card shelves; Lost Artifacts uses the invent shelf; Zombie Army's outposts are picked on the map, docked as every map choice is (#79).
- **Log lines** for charms gained, items reserved and used, and a tech card flipped; **How to play** gets an F&F section; the **lobby** offers F&F; the README's screenshots and docs/status.md follow.

## 11. Tests

Test-first, in `tests/ff-rules.test.mjs` and a test per card, with `checkState` and `checkViews` on each:
- every trigger in §5, R67, R72 (an extra card on slot 4 after income turn 5), R75, R131, the order question asked only when it matters, a copy gaining no charm;
- every item in §6 reserved and used, an item reserved on income turn 5 used at once, a covered card's item still used, the reserved building's income space uncovered, R71's counts;
- §7's prerequisite before and after a charmed card and on income turn 5, a flipped card's benefits never gained again, R134;
- §3's already-built rules;
- the simulation plays F&F alone and with the other expansions; a game without F&F is unchanged, seed for seed;
- a browser test plays a charm and shows the overlay, and ends and leaves its table.

## 12. My calls for the owner to check

- **R131:** a face-down card has no charms and doesn't count as a charmed card played.
- **R132:** the player orders the reserved items on income turn 5.
- **R133:** Ecstatic Visions' reserved masterpiece joins the player's masterpieces and fires once at once.
- **R134:** a flipped single-use card's benefits are never gained again, by anyone; an opponent never upgrades a player's single-use card to the top row.
- The 11 reserving cards and the 12 tech cards move from #40 to #39 (§4).
- F&F is offered in the lobby from #39 on (§4).
- The looks in §10, awaiting review.
