# A&A content, part 2: the 20 tapestry cards (#37) — plan

> Built inline in the main session (owner's standing rule), test-first, no agents. Three commits, each green.

**Goal:** a table with Arts & Architecture deals A&A's 20 tapestry cards (14 without the arts track, R124), every one playable.

**Spec:** [2026-11-08-aa-content-design.md](../specs/2026-11-08-aa-content-design.md) §4, §6. Numbers as 03 §2.5.

## Global constraints

- A game without `'aa'` is unchanged, seed for seed.
- `tapestryFor(expansions, variants)` adds the A&A cards **that have data**, in catalog order, so each card joins the deck in the commit that builds it; the last commit's test checks all 20 (14 without the arts track).
- Each card has its face words (`tapestry-text.js`), and each new event, decision and slot purpose its words, in the commit that builds it.
- Pieces that aren't in the capital count as owned but not in the city (R13), as part 1's landmark on a tech card does.

## 2a: the deck and the cards that need no new place (13 cards)

- [ ] Deck: `tapestryFor(expansions, variants)`; R124's six arts cards out without the arts track; `TapestryCard.expansion` gains `'aa'`, `timing` gains `'continuous'`; Granges carries `solo: false` (added with Granges in 2c).
- [ ] **S.T.E.A.M.** (era hook `advanced`): 1 worker for each new tier entered on science or arts (R9's reading, as Theocracy).
- [ ] **Artistic Inspiration**: `advanced` on arts → 3 VP; a science-die roll offers the arts track beside the rolled face(s) (`chooseRoll`), with or without benefit.
- [ ] **Found Art**: an arts-track advance's payments also offer 2 territory tiles for one resource of the price, once per advance.
- [ ] **Government Grants**: `[{ advance: { tracks: ['arts'], freeBonus: true } }, { regress: { tracks: the four, noBonus: true } }]` (`regress` gains `noBonus`).
- [ ] **Information Age**: invent, then a choice of upgrading a tech card or the circle benefit of any of the player's cards (`techBenefit` gains `anyRow`).
- [ ] **Age of Enlightenment**: roll the table's science die; once or twice on that track without benefit (a choice where both can move), then the final space's benefit without bonus (`repeat` gains `track` and `noBonus`).
- [ ] **Silk Road**: jump to the first space of the arts track's next tier (R128: from the start, space 1); gain its benefit and may pay its bonus, or its landmark if still there; from tier IV, nothing.
- [ ] **Political Posturing**: claim an achievement the player hasn't, on its highest open box (`askSlot`, purpose `politicalPosturing`).
- [ ] **Infrastructure Upgrade**: choose a card of the landmark deck and keep it as a drafted one (`seat.extraLandmarkCards`, A&A only; `landmarkCardOps` checks every held card); none left: 10 VP.
- [ ] **Migration**: explore an empty hex adjacent to no controlled territory, with a supply tile, then 2 outposts there (no conquer).
- [ ] **Moon Landing**: may discard 2 territory tiles and 1 tech card for 1 space tile and explore a space tile; otherwise invent.
- [ ] **Plague**: draw a random civilization; replace one of the player's with it and gain any 1 resource (R61, R113), or discard it for 10 VP.
- [ ] **Spymaster** as a tapestry card: 5 VP, draw 1 tapestry card, which may be played at once on this card's slot.
- [ ] Tests in `tests/engine-aa-tapestry.test.mjs`, one per card with exact numbers; the client words; the simulation.

## 2b: the cards that hold pieces (6 cards)

- [ ] CONTINUOUS timing: active while the top card of its slot; never copied.
- [ ] Commercial Center, Monuments, Star Chamber: `seat.onCards[card]` places for buildings and landmarks (`{ card, row, col, rotation? }`), the rewards, and a covered card's pieces discarded.
- [ ] Space Race and Trade Routes: `{ card }` places for a gained landmark, and their rewards.
- [ ] National Parks: `{ hex }` places on a controlled territory holding only the player's 1 outpost; then a chosen conquer die rolled.

## 2c: the cards that ask other players

- [ ] Granges: each player in turn order may pay 1 food for 1 farm; if an opponent does, the player may gain their arts space's benefit, no bonus.
- [ ] Spymaster's response (R127): every neighbour of a player who completes a track, holding any tapestry card, is asked, with #24's random wait; a played Spymaster advances on that track at the end of the mover's turn, with its benefit, and may pay the bonus. R108 applies.
- [ ] The decks' final counts: 20 A&A cards, 14 without the arts track.
