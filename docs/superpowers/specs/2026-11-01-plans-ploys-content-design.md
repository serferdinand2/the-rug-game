# Plans & Ploys content: civilizations, tapestry cards, response cards (#33): design

Written 2026-11-01. #33 is in M7 · Plans & Ploys; its blockers (#32, #107, #109) are closed. Decisions are marked **(owner)** or **(my call)**; earlier rulings are cited by rule id.

## 1. What and why

#32 put Plans & Ploys behind the table's expansion switch with its landmark cards and space tiles. A table that turns it on still deals only the 16 base civilizations and the 50 base tapestry cards. #33 adds the expansion's own content, so a Plans & Ploys game plays as the box does, without the Automa.

**Done when** a table with Plans & Ploys on deals from 26 civilizations and 63 tapestry cards (50 + 13), every one of them playable in a full game, and the five response cards answer conquests and traps; a base game is unchanged.

## 2. Decided by the owner (2026-11-01)

- **Scope: everything in Plans & Ploys except the Automa.** The lobby switch already exists (#32). Solo play and the Automa civilizations stay with #31 and #34.
- **Visuals from the existing patterns, no mockup round.** The nine civilization cards that have no layout yet, and the few new pieces some civilizations need (§7), are built from the existing card and prompt patterns and marked **awaiting review** in the component library, as #47 did for four base cards. The owner checks them there afterwards. This replaces CLAUDE.md's mockup-first rule for this issue only.

Earlier rulings that apply:
- **R43, R44:** the unknown 15th card and Infrastructure Boost are left out, so Plans & Ploys adds 13 tapestry cards.
- **R45:** Retreat gives 1 worker; as a tapestry, 9 VP and 1 tapestry card.
- **R48:** the Tinkerers' setup line, by version.
- **R34:** setup adjustments apply in the current version only, to the civilization chosen at setup (§7 lists the Plans & Ploys ones).
- **R108:** the table's version decides whether a finished player may respond to a conquest. It applies to every response card, the attacker's counters included **(my call)**.
- **#17 (owner, 2026-10-24):** a defender is asked whenever they hold any card, so nobody learns who holds a response; one with nothing playable is declined after a random wait (#24's `declineOnly`).

## 3. Parts and order (my call)

The design covers the whole issue; the plan builds it in three parts, each landing on its own with every test green:

1. **Decks and the 13 tapestry cards**, including the five response cards and the attacker's counter step (§4–§6).
2. **The 10 civilizations**, the simpler ones first: Riverfolk, Recyclers, Aliens, Treasure Hunters, Tinkerers, Utilitarians, Infiltrators, Spies, Advisors, then Islanders (§7–§8).
3. **The rest:** the variant "civilizations from one expansion", How to play, the card gallery's text, the README and status (§9–§10).

## 4. Decks with the expansion

- `decks.js` gains `civsFor(expansions)` and `tapestryFor(expansions)`, read from the asset catalog's `expansion` field as the base lists are. With `'pp'`: the 10 Plans & Ploys civilizations, and the 13 cards (every `pp` tapestry asset except `infrastructure-boost` and any unknown card).
- Setup deals from them. Without `'pp'` the decks, and the random draws that shuffle them, are exactly as today, so every base test and seeded game is unchanged.
- The engine's `CIVS` registry adds the 10 modules; `tapestry-cards.js` adds the 13 cards, each with `expansion: 'pp'`.
- **Solo:** Advisors and Spies carry `solo: false` in the data for #31 to read; nothing else changes until #31 builds solo.

## 5. The tapestry cards

Each card's effect is 03 §1.4's, with every number exact. Engine notes:

| Card | Timing | Engine |
|---|---|---|
| Astronomy | WHEN PLAYED | Gain 1 territory tile and explore with it; gain 2 space tiles into the supply, unexplored. |
| Cartography | WHEN PLAYED | Gain 1 territory tile and explore with it; if that exploration scored at least 3 VP from matched sides, the player may conquer that same hex (an optional conquer limited to it, with its dice). |
| Engineering | THIS ERA | `invented` hook: the new card is upgraded to the middle row at once and its circle benefit is gained once. |
| Entertain the Masses | WHEN PLAYED | Gain the Stadium (`XXXX/XXXX`, `{ card }`) and place it, as #32 does the Monolith. It joins `EXPANSION_LANDMARKS`; a copy (Espionage, Heralds) finds none left and gains nothing. |
| Manifest Destiny | WHEN PLAYED | Conquer a territory adjacent to the player's capital-city territory (the starting hex); then they may gain the benefit of any territory tile they control. |
| Public Works | THIS ERA | `advanced` hook: if, after the move, that track is the player's least advanced (ties count), gain 3 VP. |
| Status Quo | WHEN PLAYED | Choose up to 4 of the player's track tokens, each in a different tier (I–IV); gain each one's current space's bonus, free. Every tier with a bonus is taken, asking only between tracks in the same tier, since a free bonus never hurts **(my call)**. |
| World's Fair | WHEN PLAYED | Gain 1 culture; then any 1 resource if the capital has at least one complete row or column; then 1 VP per complete district. |
| Double Cross, Retreat, Stolen Plans, Surprise Party, Surrender | WHEN PLAYED (as a tapestry) | The "as a tapestry" line: Double Cross 9 VP and 1 territory tile; Retreat 9 VP and 1 tapestry card (R45); Stolen Plans 8 VP and invent 1 tech card; Surprise Party 10 VP **or** 1 armory (a choice); Surrender 7 VP and any 1 resource. |

"Complete" rows, columns and districts count impassable plots as filled, as the base scoring does; "in the capital" counts what stands on the grid (#32's reading of R13).

## 6. Response cards

### 6.1 The defender's response

`responseCards()` (#17) grows from traps to every card the defender may play now:
- **Trap:** as today (R21).
- **Retreat:** if the defender controls a territory adjacent to the conquered hex (even one holding 2 items). Their outpost moves there instead of toppling; they gain 1 worker. The conquest stands and the dice roll as usual.
- **Surprise Party:** if the defender is further along the military track than the attacker. As a trap does: the defender's outpost stands up again, the attacker's topples; the defender gains 15 VP. It is not a Trap, so it cannot be countered.
- **Surrender:** always. The conquest stands; after the attacker's dice, the defender rolls both conquer dice and gains both results.

One response per defender per conquest; the question stays one decision, as today. A response that topples the attacker's outpost on the middle island stops the achievement (the `trapped` check already covers it).

### 6.2 The attacker's counter

A new decision, `chooseCounter`, follows a played **Trap** only, before the trap takes effect and before the dice:
- **Double Cross:** the trap is cancelled: it has no effect, so the outposts stay as the conquest left them (the attacker's upright, the defender's toppled); the attacker gains 5 VP. The trap is still discarded.
- **Stolen Plans:** as Double Cross, and the attacker takes a random tapestry card from the defender's hand. The trap and the stolen card both leave the defender.
- Declined: the trap takes effect as today (R21's resource, the outposts swapped).
- Nothing answers a counter. A cancelled trap gives the trapper nothing, not even R21's resource **(my call: "cancel" means the card does nothing)**.

So the response question carries the conquest's dice and pushes them itself once answered (`push` puts its first operation on top): a decline or a trap pushes its effects, then the dice; a Trap pushes `chooseCounter` with the dice, which pushes them once answered; Surrender's roll is pushed after the attacker's dice, so it comes "after they roll".

Privacy follows #17: the attacker is asked whenever they hold any card; with nothing playable they are declined after the random wait, so `declineOnly` covers `chooseCounter` too. In hot-seat play the attacker answers on their own screen.

### 6.3 Hidden information

A random card taken by Stolen Plans emits an event with a `secret` (the card), so undo is refused after it (#24's rule). The defender's hand stays hidden in every view.

## 7. The civilizations

Each is a module in `civs/` on the `Civ` shape, keeps its own state in `seat.civData[id]`, and draws its card from data in `civ-cards.js` (#107), marked **awaiting review** except Treasure Hunters, whose layout is already reviewed. Setup adjustments are the current version's only (R34).

| Civilization | Engine | Current-version adjustment | New on screen |
|---|---|---|---|
| **Advisors** | Setup: 3 tapestry cards. Gained mid-game: may give any of those 3 to neighbours, 5 VP per card given. Income 2–5: 1 VP per card in hand, then discard down to 4; if any were discarded, any 1 resource. On a neighbour's advance turn, each tapestry card that neighbour would draw first asks the Advisors' owner (only while they hold a card and are still playing): give one from hand instead, then draw 1. | none | the give question uses the card shelf |
| **Aliens** | Setup (and when gained): 4 space tiles face up in the supply. Income 2–5: discard a tile on the mat; then either explore a space tile from the supply onto the mat (paying any 1 resource first if one was just discarded) or gain any 1 resource. A tile on the mat is explored (its benefit gained; an ongoing tile works while it stays). | none | the tile on the civ card |
| **Infiltrators** | Setup: 1 culture. Income 2–5, one of: (A) an outpost onto a territory holding exactly 1 opponent outpost and nothing else; both stand, control is shared, gain the tile's benefit, the hex can't be conquered and doesn't count for the middle island; (B) a player token onto an opponent's starting hex: 1 VP per outpost that opponent hasn't placed; the 3rd token on the same hex gains a civilization. Passive: gaining a civilization draws 3 and keeps 1. | no starting culture | map choices, as conquer's |
| **Islanders** | See §8. | none | a 7-hex island on the civ card |
| **Recyclers** | Setup: draw 3 tech cards, keep 1 in the bottom row; no upgrade in income turn 1. Income 2–5: may upgrade a tech card. Any upgrade the Recyclers take may instead move a top-row card to the bottom row for 5 VP. Gaining a tech card may take it from the tech discard pile. | upgrade a tech card | the discard pile on the invent prompt |
| **Riverfolk** | Setup: 4 VP per district with at least 2 impassable plots. Buildings may go on impassable plots, which still count as filled; covering a district's last impassable plot gains any 1 resource. Final income turn: −1 VP per uncovered impassable plot. Gained mid-game: may discard it and gain another. | none (Cloud City needs A&A) | placing on impassable plots |
| **Spies** | Income 2–5: a token on an unused option (each once a game), gaining from a neighbour of choice: (1) a WHEN PLAYED tapestry card on their mat; (2) a territory or space tile in their supply (an ongoing tile counts only while it stays there); (3) their current track space's benefit, no bonus; (4) one of their tech cards' benefit for its row. Then they may look at that neighbour's hand. | lose any 1 resource | the four options on the civ card |
| **Tinkerers** | Setup: each opponent gains 1 tech card and may not upgrade in income turn 1 (current version: R48). Income 2–5: a token on an unused option: (1) resources equal to the cost of a track's current space; (2) advance to match the closest opponent ahead, benefit only; (3) regress exactly 3, benefit and pay for the bonus; (4) advance to the next bonus space, gain that bonus free, no benefit, no landmarks (R9). | R48 | the four options on the civ card |
| **Treasure Hunters** | Setup: 4 tokens, 2 territory tiles. Income 2–5: a token onto an empty territory (no items) adjacent to one the player controls, that shows an unused treasure's terrain; they control it and gain the treasure (03 §1.3, with its dice). See R114 for the terrains and the defence. | none | reviewed card; map choice, then the treasure when several match |
| **Utilitarians** | Setup: choose a tier II landmark from a track and place it; 2 tokens, one beside it if listed. After gaining a listed landmark, may place or move a token to it (2 active at most). The eight abilities as 03 §1.3 lists them. Gained mid-game: place up to 2 tokens beside landmarks already owned. | lose any 1 resource | the eight abilities with their tokens on the civ card |

Control changes: control today means "every upright outpost on the hex is yours" (`control.js`). Infiltrators' shared hexes and Treasure Hunters' tokens both control without that, so `controlledTerritories` gains both cases, and every count that reads it (scoring, the red die, achievements, Mystics) follows.

Ongoing space tiles (#32 handed on): the tiles answer `advanced` through `SPACE_TILE_HOOKS`, reading `exploredSpace`. A tile on the Aliens' mat works while it stays there and stops when discarded. A Spies' option 2 on an ongoing tile gives the Spies its 5 VP whenever they advance on its track, for as long as that tile stays unexplored in the neighbour's supply; once the neighbour explores it, it stops (03 §1.3, §1.5). This needs a second hook path that reads the neighbour's `spaceTiles`.

Three new rules go in the README's Rules conventions **(my calls)**:
- **R113, a civilization gained mid-game:** its printed start (tokens, resources, cards, tiles, VP) applies whenever it is gained, at setup or later, except text the mat marks "if you start with them" (the Tinkerers' opponents' tech card, the Utilitarians' tier II landmark). Basis: Joe Aubrey's rulings for the Aliens and Infiltrators (03 §1.3), and the base civilizations' tokens, which already work so. The setup adjustments stay setup-only (R34). So the Islanders gain their 4 tiles before placing up to 4.
- **R114, the Treasure Hunters' terrains and defence:** a territory, tile or printed, has a treasure's terrain if it shows that terrain anywhere, as R32 reads land masses; when several unused treasures match, the player picks one. Their token controls the hex. An opponent may conquer it as they would a lone outpost: the Treasure Hunters are the defender (asked for a response, and "an opponent controlled it" for both dice). A Trap, Surprise Party or Surrender works for them; Retreat does not, as it moves an outpost and they have only a token there. After a conquest the token stays, so the hex holds 2 items, and the attacker controls it.
- **R115, the Islanders:** §8.

## 8. The Islanders: a gap first

The Islanders' mat prints a central hex, and exploring a hex beside it scores 1 VP per matching side. No research file gives that central hex's six corners. CLAUDE.md: a detail no rule covers becomes an issue, never a guess.
- **First**, look for a clear photo or scan of the mat; Board Game Arena implements only the base game, so it has none. If a source shows the six corners, record them as R115 and build the Islanders: 4 territory tiles at setup; income 2–5 may explore one mat hex, scoring matched sides against the centre and any mat hex beside it, exactly as on the board (R5), and gaining the tile's benefit; any explore on an advance turn may target a mat hex; on the final income turn, 4 VP per mat tile whose three outward sides show only sea at every corner; gained mid-game, they gain the 4 tiles (R113), then may discard it, or keep it and place up to 4 tiles there with no benefit **(my calls on the corner model)**.
- **If not**, the Islanders are left out as R115, under the owner's standing rule that content no source shows is left out (#2); the README lists them and a new issue holds them, as R43 did for the 15th card. Plans & Ploys then deals 25 civilizations.

## 9. Handed on from earlier issues

- **#24 (undo):** every new hidden thing goes in `view()` and `revealed()` together; Stolen Plans' card and the Spies' look at a hand each emit a secret event.
- **#53 (variants):** the variant id `civs-from-pp` ("All civilizations from Plans & Ploys"): every civilization drawn, at setup and later, comes from the Plans & Ploys ten. The table needs `'pp'` on; `checkOptions()` refuses it otherwise. The base game is not a set of its own, because the source lists only PP, AA and FF (03 FF.2.6) **(my call)**. With five players the setup deal uses all ten; the five not kept go back to the deck (`chooseCiv`, as today), so later draws come from those.
- **#32:** the Stadium (§5) and the ongoing tiles with the Aliens and Spies (§7).

## 10. The client

- Card data: the 9 new civilization recipes in `civ-cards.js`, marked awaiting review; the 13 cards' text in the card data the gallery reads, so none says "Rules text pending".
- `DECISION_KINDS` and `decision-words.js`: each new decision kind, `chooseCounter` among them, with its title and answer words; prompts use the existing patterns (the card shelf, map choices, the civ card's choices from #78, `chooseOption`).
- The civ card's new pieces (§7) are sections drawn from data, each with a library state.
- How to play's Plans & Ploys tab (`rules-help.js`) and the civilizations' hover text (`civ-rules.js`) gain the new civilizations and cards.
- The log describes every new event in our own words.
- The README's "Current interface" gets a screenshot of a Plans & Ploys civilization and a response from a running game.

## 11. Tests

Test-first, as every issue:
- **Engine:** one test file per part. Every card and civilization has a test (the issue's checklist), each response with and against a trap, the counter step, R108 for both versions, the adjustments by version, control for shared hexes and Treasure Hunters, the variant, and a base game drawing exactly as before.
- **Invariants and views:** every tapestry card in exactly one place; civilization tokens accounted for; hands, the defender's hand under Stolen Plans and the Spies' look never leak.
- **Simulation:** Plans & Ploys games deal the new civilizations and cards, so the 200 random games play them.
- **Client:** words, card data and prompts under Vitest; browser tests for a response played, a counter, and one civilization's choice on its card.

## 12. Left to the builder

The decision kinds' names and shapes, the log and prompt wording, how each civilization's state is laid out in `civData`, and the order of the simpler civilizations within part 2.

## 13. Handed on

- **#31:** solo removes Advisors and Spies (`solo: false`).
- **#34:** the Automa's behaviour with the response cards (03 §1.7).
- **#35:** Arts & Architecture's cards that refer to these civilizations or cards.
