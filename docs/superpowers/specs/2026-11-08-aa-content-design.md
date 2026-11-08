# Arts & Architecture content: civilizations, tapestry cards, tech cards (#37): design

Written 2026-11-08. #37 is in M8 · Arts & Architecture; its blockers (#35, #36, #107, #109) are closed. Decisions are marked **(owner)** or **(my call)**; earlier rulings are cited by rule id. The owner asked: "What's left, you make best decisions and start working on the next a&a issue" (2026-11-08), so every open point below is my call, listed in §11 for the owner to check.

## 1. What and why

#35 and #36 put the arts track, the masterpieces, the inspiration tiles, the advanced mats and A&A's landmark cards on main. A table with Arts & Architecture on still deals only the base and Plans & Ploys civilizations, tapestry cards and tech cards. #37 adds the expansion's own: 5 civilizations, 20 tapestry cards and 11 tech cards (its 5 landmark cards were built in #35 part 3).

**Done when** a table with A&A on deals the 5 civilizations, the 20 tapestry cards and the 11 tech cards, every one playable in a full game with the mouse, with and without the arts track and with Plans & Ploys on or off; a game without A&A is unchanged, seed for seed.

## 2. Decided

- **Scope (owner, #37):** the content of 03 §2.4, §2.5 and the A&A tech cards, numbers exact. The A&A Automa changes are #38 (Lazar's).
- **Art:** every card's picture is drawn already (`static/art/civ`, `tapestry`, `tech`, catalog `aa` groups). No new art.
- **Looks from the existing patterns, no mockup round (my call, as the owner ruled for #33):** the few new pieces (a tapestry card that holds buildings, a tech card that holds a landmark, four civilizations' mat pieces) are built from the existing card, grid and prompt patterns and marked **awaiting review** in the component library. The owner checks them there and in a game afterwards. The Collectors' card is already the owner's approved civilization card (option B, 2026-10-23).
- **Earlier rulings that apply:** R34 (setup adjustments: current version, setup civilization only), R59 (no arts track alone), R61 (Plague's resource is any 1), R62 (Relentless's teal icon is explore), R108 (a finished player may respond only in the original version), R113 (a civilization gained mid-game takes its printed start, except "if you start with them"), R118 (the arts track counts as any track), and #17 (a defender is asked whenever they hold any card).

## 3. Parts and order (my call)

The design covers the whole issue; the plan builds it in four parts, each landing on the branch `issue-37-aa-content` with every test green and the game playable:

1. **Decks and the 11 tech cards** (§4, §5): the decks take A&A's cards, the arts content leaves without the arts track, and the landmark-on-this-card mechanism.
2. **The 20 tapestry cards** (§6): the CONTINUOUS timing, cards that hold buildings or landmarks, National Parks, Spymaster's response, Granges' offer to every player.
3. **The 5 civilizations** (§7): Relentless, Collectors, Renegades, Gamblers, Urban Planners, simplest first.
4. **The screen** (§8): placing on a card, the civilizations' mat pieces, the card faces and words, How to play, the gallery's text, screenshots, README and status.

Each part carries its own log lines and decision words, so a new choice never shows as raw data; part 4 adds what needs a new picture. A choice the client can't draw yet falls back to its list of answers, as #36 part 1 did.

## 4. Decks with the expansion

- `decks.js`: `civsFor(expansions, variants)` adds the 5 A&A civilizations with `'aa'`; `tapestryFor` adds the 20 cards; `techDeck(variants)` becomes `techDeck(expansions, variants)` and adds the 11 tech cards. Without `'aa'` every list, and every draw that shuffles it, is exactly as today.
- **Without the arts track (R124, my call):** the content that names the arts track leaves the decks instead of being discarded and redrawn when drawn, as 03 §2's modularity note says. It plays the same, without showing a card that is then thrown away. That is 6 tapestry cards (Artistic Inspiration, Found Art, Government Grants, Granges, Silk Road, S.T.E.A.M., the six with the arts icon) and 4 tech cards (Microphone, Oil Paint, Opera, Public Art). No A&A civilization names it.
- **The variant "civilizations from one expansion" (my call):** stays Plans & Ploys only. A&A's 5 civilizations can't deal 2 to each of 3 or more players, and the setup check that refuses a deck too small already exists.
- **Solo:** Granges carries `solo: false` for #31 (03 §2.11); solo A&A plays without the arts track (R59), so Granges is out anyway.

## 5. The tech cards (11)

Data in `data/tech-cards.js` with `expansion: 'aa'`, effects as 03 §2's table, numbers exact:

| Card | Circle (middle row) | Square (top row) | Top-row prerequisite |
|---|---|---|---|
| Astrolabe | 1 food | Advance on exploration, benefit, may pay the bonus | A landmark on this card |
| Automation | 1 coin | Advance on technology, as Astrolabe | A landmark on this card |
| Calculus | 1 worker | Advance on science, as Astrolabe | A landmark on this card |
| War College | 1 culture | Advance on military, as Astrolabe | A landmark on this card |
| Microphone | Any 1 resource | Advance on the arts track, as Astrolabe | A landmark on this card |
| Duct Tape | 1 culture | Upgrade 1 tech card twice or 2 tech cards once each, ignoring prerequisites | Science tier III, you or a neighbour |
| Jet Fuel | 1 space tile | Explore a space tile from your supply | Science tier III, you or a neighbour |
| Oil Paint | Any 1 resource | Gain 1 masterpiece | Arts tier II (R125) |
| Opera | Advance on the arts track, no benefit or bonus | 1 VP per arts-track space advanced | Arts tier II, you or a neighbour |
| Public Art | 1 tapestry card | Inspire | Arts tier III, you or a neighbour |
| Suburbs | 4 VP | An income building of your choice | None |

- **A landmark on this card** (Astrolabe, Automation, Calculus, Microphone, War College): `TechRequirement` gains `{ landmark: true }`, met only while the card holds a landmark (one card each, 03 §2). Whenever the player gains a landmark, a card of theirs with this prerequisite, in the bottom or middle row and holding none, is one more place in `otherPlaces()` (`{ tech: id }`). Placing it there upgrades that card at once, and the upgrade and all it triggers resolve before the benefit that gave the landmark goes on (the ruling in 03 §2). The landmark stays there for the game and is discarded with the card. A top-row card is not offered (R126, my call): it can't upgrade, so the landmark would do nothing there.
- A landmark on a card counts as gained (landmark cards' goals, the Collectors) but is not in the capital: it doesn't break ties (as R13's beside-the-mat landmarks) and isn't in the Urban Planners' groups.
- **Duct Tape** ignores every prerequisite, the landmark one included (Jamey, 03 §2). One card twice may take it from the bottom to the top row.
- **Oil Paint (R125, my call):** the original version plays the card as first printed, "you" only, without the neighbours icon; the current version plays the FAQ's erratum and F&F's replacement card, you or a neighbour. `requires` gains `self: true` for the original version only.
- **Without the arts track** Microphone, Oil Paint, Opera and Public Art are left out (§4).

## 6. The tapestry cards (20)

Effects as 03 §2.5, numbers exact. `TapestryCard.timing` gains `'continuous'`, `expansion` gains `'aa'`.

### 6.1 New mechanisms

- **CONTINUOUS** (Commercial Center, Monuments, Star Chamber): the card works while it is the top card of its era slot, through later eras, until another tapestry card covers it or the game ends. It cannot be copied (Espionage, the Heralds and the like skip it, as they skip other cards they can't copy).
- **Cards that hold buildings** (Commercial Center 2×2, Monuments `..X/.XX/XXX`, Star Chamber `.X./XXX/.X.`): while the card works, each open square is a place in `otherPlaces()` for an income building (`{ card, row, col }`) and each spot where a landmark covers at least one open square for a landmark, which may hang off the card's shape (03 §2). The pieces live in `seat.onCards[card]`. They count as the player's for "per income building" and per-type counts, as the Craftsmen's columns do, and not as the capital for rows, columns, districts, Monarchy or the Architects. A card covered by another tapestry card discards what it holds.
  - Commercial Center: each square the piece newly covers pays its printed benefit (1 coin, 1 tapestry card, invent 1 tech card, a science-die roll without benefit) or 3 VP, chosen square by square (Jamey's ruling, 03 §2.12).
  - Monuments: once every square is covered, 8 VP or 1 each of culture, coin, food and worker.
  - Star Chamber: once every square is covered, advance once on any track with its benefit, the bonus free.
- **Cards that hold landmarks** (Space Race, Trade Routes; THIS ERA): whenever the player gains a landmark, the card is a place in `otherPlaces()` (`{ card }`): Space Race while it holds none, then 1 space tile and explore a space tile; Trade Routes always, then conquer gaining both dice's results, and 5 VP per landmark on the card. The landmarks stay on the card after the era, until it is covered.
- **National Parks** (THIS ERA): instead of the capital, an income building or landmark may go on a territory the player controls that holds only their 1 outpost (`{ hex }`, as the Nomads' places), then they choose the black or the red conquer die, roll it and gain that result. The piece is a second item on the hex, so it stops conquests there, as the Nomads' pieces do (R33); it counts as the player's, not as the capital's.
- **Spymaster's response (R127, my call):** when a player reaches the end of a track, each of their neighbours who holds any tapestry card is asked, so nobody learns who holds Spymaster (as #17's defender); one who can't play it is declined after #24's random wait. A played Spymaster advances its player on that track at the end of the mover's turn, with its benefit, and they may pay the bonus. R108 applies: in the current version a finished player isn't asked.
- **Granges' offer:** in turn order from the player, each player is asked whether to pay 1 food for 1 farm; one without food is skipped. If at least one opponent pays, the player may gain the benefit of their arts-track space, without its bonus.

### 6.2 Each card

| Card | Timing | Engine |
|---|---|---|
| Age of Enlightenment | WHEN PLAYED | Roll the science die (the table's); advance once or twice on the rolled track, as the player chooses (my call: no third choice of not advancing), then gain the final space's benefit only, no bonus. |
| Artistic Inspiration | THIS ERA | `advanced` on the arts track: 3 VP. Any science-die roll, with or without benefit, may take the arts track instead of the rolled one (a choice after the roll). |
| Commercial Center | CONTINUOUS | §6.1. |
| Found Art | THIS ERA | Paying for an arts-track advance, 2 territory tiles may stand in for one resource of the price, once per advance. |
| Government Grants | WHEN PLAYED | Advance on the arts track with its benefit, the bonus free; then regress on one other track with that space's benefit, no bonus. Mandatory where possible. |
| Granges | WHEN PLAYED | §6.1. |
| Information Age | WHEN PLAYED | Invent 1 tech card; then choose one of the player's tech cards: upgrade it, or gain its circle benefit. |
| Infrastructure Upgrade | WHEN PLAYED | Choose a landmark card from the landmark deck and keep it, as a drafted one; with none left, 10 VP. |
| Migration | WHEN PLAYED | Explore an empty hex not adjacent to any territory any player controls, the player's own included (03 §2.12), with a territory tile from their supply; place 2 of their outposts there. Not a conquer. The original card's "space" and F&F's "territory" read the same here, so both versions play it so. |
| Monuments | CONTINUOUS | §6.1. |
| Moon Landing | WHEN PLAYED | The player may discard 2 territory tiles and 1 tech card; if they do, gain 1 space tile, then explore a space tile. Otherwise invent 1 tech card. |
| National Parks | THIS ERA | §6.1. |
| Plague | WHEN PLAYED | Draw a random civilization: replace one of the player's civilizations with it and gain any 1 resource (R61), or discard it and gain 10 VP. The replaced one's gains stay; the new one starts as R113 says. |
| Political Posturing | WHEN PLAYED | Place a token on the highest-value open space of an achievement the player hasn't earned, gain its VP and hold it (03 §2.12). |
| Silk Road | WHEN PLAYED | Move to the first space of the arts track's next tier (from the start, tier I's space 1; R128, my call); gain that space's benefit, and may pay its bonus, or its tier's landmark if still there. From tier IV, nothing. |
| Space Race | THIS ERA | §6.1. |
| Spymaster | Response, or WHEN PLAYED | §6.1. As a tapestry: 5 VP, then draw 1 tapestry card, which may be played at once, covering this card. |
| Star Chamber | CONTINUOUS | §6.1. |
| S.T.E.A.M. | THIS ERA | Advancing into a new tier (I–IV) of the science or arts track: 1 worker. |
| Trade Routes | THIS ERA | §6.1. |

## 7. The civilizations (5)

Each is a module in `civs/`, its state in `seat.civData[id]`, its card drawn from data (#107), its words in `civ-rules.js` for both versions.

- **Relentless:** at the end of each of the player's income and advance turns on which they gained an income building or a landmark, a token goes on the mat. At the end of an advance turn on which they gained none, every token comes off and they gain by count: 1 → 1 VP; 2 → 3 VP and 1 tapestry card; 3 → 6 VP and (1 tapestry card or any 1 resource); 4 → 10 VP and (tapestry card, any resource or explore, R62); 5 or more → 15 VP and (tapestry card, any resource, explore or invent).
- **Collectors:** on an advance turn, when the player gains an outpost (from a conquer benefit), a house, a landmark, a tapestry card, a territory tile or a tech card, of a type the mat doesn't hold yet, they may put it on the mat and gain any 1 resource; one item per advance turn (Mike Young, 03 §2.4). The outpost is chosen as the conquer benefit starts, instead of conquering, with no dice (R129, my call: asked before the hex). Items there count as the player's for scoring but can't be used, upgraded, played or discarded. Game end: 1/3/6/10/15/21 VP for 1–6 items. Current version: +1 any resource at setup (F&F p.32).
- **Renegades:** a token on the start of the mat's 4-space track. When the player advances on a track and would gain the benefit, they may forgo it, and the bonus, to move their Renegades token 1 space, if the board space's tier matches the next Renegades space's tier; they still gain landmarks. Spaces: I a tapestry card and an income building of their choice; II a science-die roll with benefit, then invent; III explore, conquer, upgrade a tech card; IV 20 VP. It is no advancement track for any other effect, but its end counts for "complete any track".
- **Gamblers:** if the player starts with them, at the end of income turn 1 they reveal 3 tapestry cards and play a WHEN PLAYED one of their choice onto Maker of Fire, resolving it; the rest are discarded, or with no WHEN PLAYED card they keep 1 in hand. At the start of income turns 2–4 they do the same onto the era's slot, then play their normal tapestry card over it. A card that can't be fully resolved resolves as far as it goes (03 §2.4).
- **Urban Planners:** after the landmark cards are chosen (or when gained mid-game), they choose one more card from the landmark deck; with none left, they may discard this civilization and draw another. Whenever they gain a landmark, its place may be the mat (`{ planners: true }`); stored landmarks are placed in the capital later, free, at the start of their turn or before they end it (R130, my call: "any time during your turns" as two moments). At the end of their final income turn: 1/4/9/16/25/36/49 VP for the largest orthogonally connected group of 1–7 landmarks in the capital. Current version: +1 any resource at setup with 1–3 players, +2 with 4–5 (F&F p.32).

## 8. The screen (part 4)

- **Placing on a card:** `choosePlacement` already offers the capital, the Craftsmen's columns and hexes. A tapestry card that holds buildings shows its shape as a small grid in the prompt's shelf, its squares lit as targets, beside the capital grid; Space Race, Trade Routes and the landmark tech cards show as cards lit as targets. The Income tab's tapestry slot draws the pieces on a card; the Tech tab draws a landmark on its card.
- **Civilization mats:** Relentless's tokens as a count on its card; the Collectors' items in their six places on the card (the approved layout); the Renegades' token on its card's track; the Urban Planners' stored landmarks beside their card, each a button that starts its placement on the player's turn.
- **Words:** the card faces (`tapestry-text.js`, the tech text, `civ-rules.js`), the log, decision words, How to play's A&A tab, and the card gallery's text, for both versions.
- **Library:** each new piece in its component's section, marked awaiting review.
- **Screenshots and README:** taken from the running game once part 4 lands.

## 9. Tests (test-first)

- Engine, one file per part: `engine-aa-tech`, `engine-aa-tapestry`, `engine-aa-civs`. Every card and civilization has at least one test of its effect with exact numbers, and the R-rules in §11 each have one.
- The decks: the counts with A&A on and off, with and without the arts track and Plans & Ploys; a base game's seeded deal unchanged.
- The simulation: A&A's games now deal from the full decks, so its 1000-game run covers every card; the invariants count pieces on cards and on the civilization mats.
- Client: the placement targets, the words, the log; a browser test that places a building on Monuments and a landmark on a tech card.

## 10. Size

Four parts of roughly 3 to 5 hours each, so 15 to 20 hours in all, built in the main session with no agents. One review of the whole issue at the end, only if the owner agrees.

## 11. Calls for the owner to check

New rules, to add to the README's Rules conventions:
- **R124:** without the arts track, the arts content leaves the decks instead of being discarded and redrawn.
- **R125:** Oil Paint's prerequisite is "you" only in the original version, "you or a neighbour" in the current one.
- **R126:** a landmark may go only on a landmark tech card in the bottom or middle row.
- **R127:** Spymaster asks every neighbour who holds a tapestry card when a track is completed, with the random wait.
- **R128:** Silk Road from the arts track's start goes to tier I's first space.
- **R129:** the Collectors choose the outpost before the conquer's hex.
- **R130:** the Urban Planners place stored landmarks at the start of their turn or before they end it.

Other calls: the four-part order; no mockup round, with the new pieces awaiting review; the one-expansion civilization variant stays Plans & Ploys only; Age of Enlightenment always advances.
