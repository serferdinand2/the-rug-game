# F&F content part 3: the 10 civilizations (#40) Implementation Plan

> **For agentic workers:** the owner's standing rule: implement inline (superpowers:executing-plans), no subagents, no per-task reviews. One commit per civilization. Ledger: `.superpowers/sdd/2026-11-10-ff-content-part3-civs/progress.md`.

**Goal:** a table with F&F deals its 10 civilizations, each playing as 03 FF.3 prints it.

**Spec:** `docs/superpowers/specs/2026-11-10-ff-content-design.md` §6, §9 (my calls); research `docs/research/03-expansions.md` FF.3 (lines ~974–1225).

## What one civilization needs (the A&A pattern, #37)

1. `src/lib/engine/civs/<id>.js`: a `Civ` (`id`, `incomeTurns`, `setup(ctx, player, midGame)`, `income(ctx, player, turn)`, `hooks`, `solo: false` for Genies, Illuminati, Weefolk), its own decisions/automatic kinds registered in `kinds.js`; `civs/index.js` adds it to `CIVS`.
2. `decks.js`: `FF_CIVS` (in the order built) and `civsFor` adds it with `'ff'`.
3. Client: `cards/civ-cards.js` (its face: `portraitAlt`, `complexity` from FF.3's table, `effect`, `sections`), `cards/civ-rules.js` (its rules, both versions: no F&F adjustment, R34), `cards/reviewed-civilizations.js` (`{ id, edition: 'awaiting review' }` and a library sample state), `civ-card.js` (live state on the card, if it has some), log lines, decision words and kinds facts.
4. Tests in `tests/engine-ff-civs.test.mjs` (`startedGame(…, { civs: [...] , expansions: ['ff'] })`; each civilization's setup, abilities by income turn, run to the end), the client civ-card and civ-rules suites pass (they iterate every civilization).

## Order and rules (03 FF.3; complexity in brackets)

1. **Werefolk** [2]: start of income turns 2–5: discard the mat's space tile; draw one (`gainTiles` space 1) and flip it with the injected random (`ctx.random(2)`): face up → may regress on 1 track without benefit (`regress` optional, noBenefit); if it regressed, explore that tile onto the mat (`civData.werefolk.tile`, its benefit, discarded next income turn), else 4 VP; face down → advance on 1 track with benefit, bonus free. A tile not explored stays in the supply.
2. **Psionics** [2]: income turns 2–5: 2 territory tile; 3 tapestry card; 4 invent; 5 research (benefit, payable bonus). Always: one extra draw for every random gain from a deck or supply (tech, tapestry, masterpiece, territory, space tile, civilization) and one extra die roll, keep one (R74; adds to other extras: Empiricism 3). Hook points: `gainTiles`, `drawTapestry`, `drawTech` for invent-from-deck, `gainCiv`'s count (`civDraw`), masterpiece deck draws, every die roll (`scienceRoll`, conquer dice). Drafts: 3 keep 1 (#53 handoff).
3. **Artificers** [2]: income turns 2–4: pick a track: set its leftmost building aside (`besideMat`? no: out of play, `civData.artificers.aside`, counts for its type, R71) or slide it 1 left (needs an empty space left). Income turn 5: 1 VP per income building in the capital, or slide one track flush left. The income mat model must allow gaps (a row as an array of 6 positions); keep `incomeMat.buildings[row]` counts and add `incomeMat.slid?` offsets, or my call: model the slide as uncovering the next space and covering the first open one (exposedSpaces shift).
4. **Celestials** [2]: setup: 1 outpost and 1 token on the start territory; income turns 2–4: may move the token to an adjacent explored territory and gain both conquer dice (no control; a hex with the token counts 2 items); income turn 5: −2 VP per landmark hanging off the capital, +5 per landmark not (R99). Mid-game: replace an outpost on the start territory with the token; may discard to draw another.
5. **Faefolk** [3]: setup/gain: token on spot 1 of 7. Income turns 2–5: may gain 1 tapestry card, then move clockwise by visible cards (hand + uncovered mat cards, R73), mod 7; gain the spot (twice on IT5). Spots: 1 1 VP/tapestry card; 2 1 tapestry + 1 territory tile + invent + 1 VP/income building; 3 1 food + 1 VP/territory tile; 4 1 coin + 1 VP/tech card; 5 1 culture + 1 VP/territory; 6 1 worker + 1 VP/landmark; 7 1 space tile + explore a space tile.
6. **Genies** [1, solo false]: setup/gain: a token per opponent. Income turns 2–4: draw an opponent's token at random; that opponent picks a circled benefit and scores it; the Genies score it too and gain one square beside it. IT5: 2 different circled benefits. Ring: circles 1 VP/landmark, /territory tile, /territory, /tech card; squares research-no-benefit, invent, culture, explore; adjacency per FF.3.
7. **Weefolk** [2, solo false]: start of income turns 2–5 (and when gained): give a token to an opponent (active ones offered first), who places it on an open plot of their capital (`placeCapitalToken`, part 2; full city: replace an income building or 1×1 landmark, set aside). IT2–4: may pay 1 territory tile for any income building. IT5: 1 VP per income building or landmark in each row and column of each of their tokens.
8. **Illuminati** [2, solo false]: setup/gain: draw 3 tapestry keep 1; the 3 dice on their mat (`state.dice`). An opponent's roll takes the die off until the Illuminati's next income turn and pays them first (conquer dice: both results; science die: advance without benefit on the rolled track). Start of income turns 2–5: 6 VP per die still on the mat, then all return.
9. **Elder Ones** [3]: IT2–4: 1 resource or 2 tapestry cards. IT5: discard up to 6 cards for 2 resources each. After IT5: advance turns only, in turn order, while one is possible; 10 VP per landmark gained; the era-4 card stays in effect; no response cards.
10. **Merfolk** [3]: IT2–4: gain 1 tapestry card, then submerge all but 2 (hidden; `view()` and `revealed()`). IT5: gain 1, resurface all; end of IT5 keep 5. After IT5: each turn discard ≥1 card for 5 VP each, or play a WHEN PLAYED card onto the era-4 stack (left charm, reserved items at once); ends with no cards. Responses allowed.

`turn.js` for 9–10: a finished seat with Elder Ones or Merfolk "plays on" (`seat.playingOn`) and takes turns while it can; the game ends when every seat is done.

## Steps per civilization

- [ ] Failing engine tests; implement; client face, rules, sample, words; `npm run test:unit`, `npm run check`; commit `Refs #40: the <Name>`.
