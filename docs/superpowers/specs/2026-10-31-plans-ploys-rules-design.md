# Plans & Ploys rules: landmark cards, space tiles, amendments (#32): design

Written 2026-10-31. #32 is in M7 · Plans & Ploys. **It started before its blocker #31 (the Automa and Shadow Empire) closed, on the owner's ruling (2026-10-31): "Start #32 anyway."** Its other blockers (#30, #101, #109, #126, #129) are closed. The owner chose the look from the clickable mockup [docs/ui/landmark-cards.html](../../ui/landmark-cards.html) (screenshots in `docs/ui/screens/issue-32/`). Decisions are marked **(owner)** or **(my call)**.

## 1. What and why

A table can switch on Plans & Ploys and play its rule changes (03 §1.2, §1.5, §1.6, combined per §7): landmark cards with their opening draft, and the four new space tiles. #33 adds the expansion's civilizations and tapestry cards (with Entertain the Masses and its Stadium) and #34 its Automa civilizations. The solo campaign is out of scope.

**Done when** a table with Plans & Ploys on drafts landmark cards as setup ends, gains a card's landmark at the end of the turn its goal is met, deals 19 space tiles with the four new ones working, and the lobby offers it; the base game is unchanged.

## 2. Decided by the owner (2026-10-31)

- **Start before #31.** The P&P parts that need the Automa wait for it (§7).
- **The lobby offers Plans & Ploys as soon as #32 lands**, partial: landmark cards and space tiles now; #33 adds its civilizations and cards to the same switch.
- **R111: a landmark card's goal is checked at the end of the final (5th) income turn too.** It is the end of one of your turns; the landmark scores nothing then but counts for the tallest-landmark tiebreak.
- **R112: the version alone picks the tiebreaker.** A table on the original 2019 rules keeps R10 (resources left) with Plans & Ploys on; the current rules keep R11.
- **The look** (mockup):
  - The draft is the card-shelf pattern: the cards above the panel "Keep a landmark card", whose status line says who gets the rest; Keep card confirms.
  - **Option A:** the kept card lives on the Civ tab, under the civilization cards, headed "Landmark card" with a goal line: not met yet with the count so far, met this turn, or gained. Another player's Civ tab shows theirs (#145).
  - When the goal is met, the placing prompt shows the card on the shelf above "Where does the Skyscraper go?", whose line says the card's goal is met.

## 3. The rules built

### 3.1 Turning the expansion on

`EXPANSIONS_BUILT` becomes `['pp']`. With `'pp'` in `state.expansions`:
- the space stack holds the base 15 tiles and the 4 new ones (19);
- the landmark supply (`state.landmarks`) adds the 5 landmark-card landmarks and the Monolith; the Stadium comes with #33's Entertain the Masses;
- setup drafts landmark cards (§3.2).

Nothing else changes for a base game: no new state is read without `'pp'`, and every base test passes unchanged.

### 3.2 Landmark cards and the draft

Data: `src/lib/engine/data/landmark-cards.js`, the 5 P&P cards (03 §1.6), each with its landmark and goal:

| Card | Goal at the end of your turn |
|---|---|
| Game Store | at least 1 tech card in your top row |
| TV Station | at least 3 income buildings of the same type in your capital city |
| Digital Studio | at least 2 complete districts in your capital city |
| Skyscraper | at least 1 complete row or column in your capital city |
| Urban Farm | at least 6 territory tiles in your supply |

"In your capital city" counts what stands on the capital mat's grid, not beside it (my call, as R13 reads "in your capital city"). Impassable plots count as filled for districts, rows and columns, as the base scoring does.

The draft, a new after-setup step `landmarkCards` before `start` (03 §1.2):
- The landmark deck is shuffled at setup with the other decks. The player going last (to the first player's right) draws one card per player and keeps one; the rest pass counter-clockwise, so each player before them in turn order keeps one, the first player last. A player left with one card keeps it without being asked; the log says which (owner, as drawn).
- Solo, before #31: the player draws 2 and keeps 1; the other goes back under the deck until #31 gives it to the Automa's landmark box (my call).
- The cards a player is offered are hidden from everyone else (`chooseLandmarkCard` hides its `options`); the kept card is public, as it lies face up. The rest form the face-down landmark deck (`supply.landmarkCards`, a hidden deck in `view.js`), which A&A's and F&F's effects draw from later.
- The kept card is `seat.landmarkCard: { card, gained }`.

### 3.3 The goal

At the end of each of the player's own turns (advance or income turn, the final income turn included, R111), before the next seat's turn starts: if the player holds a card not yet gained and its goal is met, they **must** gain that landmark and place it (03 §1.2). It is placed as any gained landmark is (R13–R15, R106; beside the mat when it fits nowhere), its `landmarkGained` triggers fire, and then the turn ends. A goal met on another player's turn waits for the end of the player's own next turn. Only the player's own card counts.

`landmarkGoal(seat, card)` in the engine gives `{ have, need }` for each goal, so the client's goal line and the engine's check read the same count.

### 3.4 The new space tiles

Ids 16–19, in the catalog's order, each with its art slug:

| Id | Art | Effect |
|---|---|---|
| 16 | `technology-5-vp` | Ongoing: whenever you advance on the technology track, gain 5 VP. |
| 17 | `science-5-vp` | Ongoing: whenever you advance on the science track, gain 5 VP. |
| 18 | `military-5-vp` | Ongoing: whenever you advance on the military track, gain 5 VP. |
| 19 | `monolith` | Gain the Monolith landmark and place it in your capital city. |

- The ongoing tiles work once explored, from the next advance on: they answer the `advanced` trigger, which fires once per move, so a move of several spaces is one advance (03 §1.2). A regress or a Futurists jump is not an advance (the trigger's rules, #20 design §7). Their VP count under "Exploring and conquering", as every space tile's do (`source: { spaceTile }`).
- The replacement tile for the base misprint is already tile 11 (R5), in both versions.

### 3.5 What needs nothing new

- **The exploration bag:** the territory stack is already drawn at random.
- **The 12 landmark tokens:** a physical reminder; the track spaces already show which landmarks are left (#63).
- **The tapestry reshuffle:** already built for both versions (01 §9.1, FAQ #24).
- **The tiebreaker:** R11 for the current rules (R112).

## 4. The client

- **The draft:** `CardShelf` takes a `landmark` kind, drawing `LandmarkCard`s; `DECISION_KINDS` gains `chooseLandmarkCard: { shelf: 'landmark', confirm: 'Keep card' }`; its title is "Keep a landmark card" and its status line names who gets the rest.
- **The card's words:** each P&P card's goal finishes the card's "Gain this landmark when you …" line, in card data shared with the gallery, so the gallery shows it too instead of "Rules text pending".
- **The Civ tab:** under the civilization cards, "Landmark card", the goal line, then the card; a gained card is marked Gained.
- **Gaining it:** the placement operation carries `source: { landmarkCard }`, so the placing panel puts the card on the shelf and its line says the goal is met.
- **Space tiles:** the Terrain tab and prompts draw tiles 16–19 by their art slug, and their words come from the data.
- **The log:** the draft, the card kept, the goal met and the ongoing tiles' VP, in our own words.

## 5. Tests

- Engine (`tests/engine-plans-ploys.test.mjs`): the options and supply with and without `'pp'`; the draft order, hidden offers and auto-keep at 1–5 players; each goal's count; the goal met at the end of an advance turn, an income turn and the final income turn, never on another player's turn, once only; placement beside the mat; the ongoing tiles once per move, not on a regress; the Monolith; R112.
- `tests/helpers/invariants.mjs` and `views.mjs`: the landmark cards and P&P space tiles are each accounted for exactly once, and the offers and deck never leak. The simulation plays P&P games too.
- Client: the draft and goal words, the Civ tab's card and goal line, the shelf kind; browser: a P&P table drafts and shows the card.

## 6. Left to the builder

The exact log and status words, following the mockup's.

## 7. Handed on

- **#31:** solo, the card not kept goes to the Automa's landmark box (§3.2); the Shadow Empire is not drafted for (03 §1.2).
- **#33:** the Stadium (Entertain the Masses); the Aliens' and Spies' rules for ongoing space tiles (03 §1.5 notes); Utilitarians and other cards that use landmarks.
- **#35:** A&A's landmark cards join the deck, and the draft deals players + 1 when both expansions' cards are in (03 §7).
