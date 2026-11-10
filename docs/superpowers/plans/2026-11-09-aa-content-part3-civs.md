# A&A content, part 3: the 5 civilizations (#37) — plan

> Built inline in the main session (owner's standing rule), test-first, no agents. One commit per civilization or two.

**Goal:** a table with Arts & Architecture deals the Relentless, Collectors, Renegades, Gamblers and Urban Planners, each played in full.

**Spec:** [2026-11-08-aa-content-design.md](../specs/2026-11-08-aa-content-design.md) §7; text and rulings 03 §2.4; current-version setup gains FF.8.3 (R34).

## Global constraints

- `civsFor(expansions, variants)` adds A&A's civilizations that are built, in catalog order, so each joins the deck in the commit that builds it (as part 2's tapestry cards did). A game without A&A deals as today.
- Each civilization is a module in `civs/`, registered in `civs/registry.js`, its state in `seat.civData[id]`, its card words in `civ-rules.js` for both versions, and its mat drawn from data where the card has a track or spaces (#107).
- Each new decision and event has words; the screen's mat pieces are part 4.

## Order (simplest first)

1. **Relentless:** a token on the mat at the end of each of the player's income and advance turns on which they gained an income building or a landmark; at the end of an advance turn with none gained, the tokens come off for 1/3/6/10/15 VP and the chart's extras (R62: the teal icon is explore). Needs a turn-end hook for civilizations.
2. **Renegades:** the 4-space track; an advance that would gain a benefit on a board tier matching the next Renegades space may take that space instead (benefit and bonus forgone, landmarks still gained). Its end counts for "complete any track".
3. **Gamblers:** only if started with them: at the end of income turn 1, 3 tapestry cards revealed, a WHEN PLAYED one played onto Maker of Fire's slot and resolved, the rest discarded (none: keep 1); at the start of income turns 2–4, the same onto the era's slot before the normal card.
4. **Collectors:** one item per advance turn of a type the mat doesn't hold yet (outpost from a conquer benefit, chosen before the hex, R129; house; landmark; tapestry card; territory tile; tech card), for any 1 resource; 1/3/6/10/15/21 VP at the end; current version +1 any resource at setup.
5. **Urban Planners:** one more landmark card at setup or when gained (none left: may discard them for another); a gained landmark may wait on the mat, placed later at the start of a turn of theirs or before they end it (R130); at the end of their final income turn 1/4/9/16/25/36/49 VP for the largest connected group of capital landmarks; current version +1 any resource (1–3 players) or +2 (4–5).

Each step: the engine tests in `tests/engine-aa-civs.test.mjs` first, then the module, the words, the simulation, and a commit.
