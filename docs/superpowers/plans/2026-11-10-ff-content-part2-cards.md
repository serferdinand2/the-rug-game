# F&F content part 2: the 26 tapestry cards (#40) Implementation Plan

> **For agentic workers:** the owner's standing rule: implement inline (superpowers:executing-plans), no subagents, no per-task reviews. Steps use checkbox (`- [ ]`) syntax.

**Goal:** F&F's other 26 tapestry cards play in a full game, with their charms (03 FF.4.1) and abilities (FF.4.3), numbers exact.

**Spec:** `docs/superpowers/specs/2026-11-10-ff-content-design.md` §5; #39's charms and `ff()` maker.

## Global Constraints

As part 1's. Each card: data in `data/tapestry-cards.js` via `ff(card, charms)`, its face words in `cards/tapestry-text.js` when its rules are code, its decision words and log lines, and a test in `tests/engine-ff-cards.test.mjs` (data deep-equal; played to the end with and without the arts track). Cards join the deck as built (`tapestryFor` deals built ones).

## Review Focus

- A card that reveals or draws (Citadel of Power, Seer Sight, Soothsaying) never shows a hidden card to a player who shouldn't see it, and the decks stay whole (invariants).
- An arts option without the arts track is never offered (choice filter, extended to arts VP counters).
- A response card discarded to topple an attacker gives one of its two charms, the defender's pick, and denies the middle island as a trap does.

---

### Task 1 (batch a): 11 plain WHEN PLAYED cards

| Card | Played | Left charm | Right charm |
|---|---|---|---|
| alien-disclosure | `alienDisclosure` (1 space tile; may pay 5 VP to explore it now, R86) | `invent: { refresh: true }` | — |
| chimera-citizen-rights | `chimera` (roll; military/exploration: explore + 1 culture; science/technology: upgrade; arts: inspire; no advance) | — | 1 tapestry card |
| citadel-of-power | `citadelOfPower` (reveal tech cards until a landmark card; gain its landmark; discard it; shuffle the rest back) | — | 1 VP per landmark |
| deja-vu | `dejaVu` (7 VP, or the benefit, no bonus, of a tier-II space, 4–6, you reached or passed) | — | research, no benefit |
| haunted-houses | trade: pay 7 tapestry cards for `gainCiv` + 7 VP, otherwise 1 tapestry card + a house (R113) | — | 2 VP |
| hive-mind | 2 VP per capital row holding a market (`vp: { per: 'marketRow', each: 2 }`) | 1 market | — |
| muses | `muses` (7 VP, or a track where you are ahead of every opponent: exploration 1 territory tile + farm; military 1 culture + 1 VP per territory; arts 1 masterpiece; science research; technology refresh + invent 2) | 1 VP per arts space, or 5 VP | — |
| technomancy | `technomancy` (the circle benefits of 2 of the 3 face-up tech cards) | — | 1 VP per tech card |
| temporal-nomadism | `temporalNomadism` (regress to a space of your choice on a track not completed; its benefit, no bonus) | — | any 1 resource |
| uploaded-consciousness | `uploadedConsciousness: { left: 3 }` (an optional trade: 1 territory tile for 1 tapestry card + any 1 resource, again up to 3) | — | 1 VP per tech card |
| wizards-guild | 3 VP per charm tag on your mat's uncovered face-up cards (`vp: { per: 'charm', each: 3 }`) | worker or food | culture or coin |

- [ ] Failing tests per card; implement; words; commit `Refs #40: 11 of F&F's tapestry cards`.

### Task 2 (batch b): 10 era, continuous and looking cards

Astral Expeditions (a bonus paid may be swapped for a space tile or exploring one, R76), Interdimensional Trade (a tapestry card gained: may discard one for invent + 2 VP), Living Cities (a landmark gained: 1 VP per farm), Good Omens (a guess before each roll; one reward a turn, R81), Doppelgangers (a second token on an opponent's space), Dream Monitors (a token in the capital filling its plot, R78; 2 resources beside a house), High Council (every player holding a card asked, #17-style), Seer Sight (3 VP per THIS ERA card revealed), Soothsaying (the player picks the opponent for each charmed card), Superpower Regulators (R84). Charms as FF.4.1.

- [ ] Failing tests per card; implement; words; commit `Refs #40: F&F's era, continuous and looking cards`.

### Task 3 (batch c): the 5 response cards

Ghost Ship, Gremlins, The Kraken, League of the Charmed, Robotic Decoys: `response: 'conquest'`; discarded, they topple the attacker and give one of their two charms (the defender picks); played as a tapestry, their text (7 VP; League 1 culture + 2 VP; Robotic Decoys THIS ERA) and their charms (R75).

- [ ] Failing tests; implement; words; commit `Refs #40: F&F's response cards`.

### Task 4: record

- [ ] Simulation, `npm run test:unit`, `npm run check`, the browser suite; docs/status.md; commit `Refs #40: part 2, F&F's tapestry cards: record`.
