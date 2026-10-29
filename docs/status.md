# Where the work stands

The only record of the project's progress (owner, 2026-10-28): what is done and what comes next, then issue by issue what each issue built, the calls to revisit after playing, and what it handed on to later issues. CLAUDE.md links here and holds no progress of its own. Claude and Codex both update this file whenever an issue lands or a milestone moves: the summary below and the issue's entry (see CLAUDE.md and AGENTS.md).

Updated 2026-10-29. The issues are listed in the order they were finished.

## Summary

- **At a glance:**
  - M0 to M5 are built: a whole base game can be played with the mouse, online or hot-seat. One of their issues is still open: #45 (the owner checks R12 and R39 against the box).
  - M12 · Cosmetic enhancements: #61, #66, #67, #68, #69, #70, #72, #74, #75, #79, #80, #77, #78 and #84 are done. #82 (the joined terrain of the base mats) is done: its branch merged into main on 2026-10-29.
  - M13 · Refactor (new on 2026-10-29, owner) holds the refactors that #80's scan filed, each with an area label: Words and names, Cards, Track board, Players and scoring, Capital and map, Game screen or Lobby. #86, #87, #89, #90, #91, #93, #97, #98, #99, #100, #113, #119, #130, #123, #127, #126, #129, #88 and #101 are done, and #121 closed as not planned. #103, #124 and #128 are partly built; what is left of each waits for #85.
  - #80's scan filed #84 and #86–#131, ranked in its summary comment.
  - M13's Words and names issues come first (owner, 2026-10-29), then solo play (M6) and the expansions (M7–M9) by milestone. Each of #31–#37, #40, #41 and #49 is also blocked by the refactors it builds on (owner, 2026-10-29; see CLAUDE.md's rulings); see [Working on issues](../CLAUDE.md#working-on-issues) for the order and the blockers.
- **Done:**
  - Rules research (`docs/research/`).
  - The approved design document.
  - The phase-one desktop UI/UX manifest and interactive launch, lobby, play and player-overview mockups (`docs/ui/README.md`, 2026-10-21).
  - The production styles that follow it: `tokens.css` and `base.css`, with self-hosted Cinzel and Atkinson Hyperlegible (2026-10-21).
  - The component library (#48, 2026-10-21): 34 components in `src/lib/components/`, each shown in all its states on `/components.html`, which also holds the art. Several components show placeholders until their art lands; `src/lib/components/README.md` lists them. The owner closed #48 on 2026-10-21, ahead of its blocker #3.
  - The approved art style C (`docs/art/`).
  - All 43 issues filed in [serferdinand2/the-rug-game](https://github.com/serferdinand2/the-rug-game/issues).
- **#1, #2, #3, #4, #6, #7, #8, #9, #10, #11, #12, #13, #14, #15, #16, #17, #18, #19, #20, #21, #22, #23, #24, #25, #26, #27, #28, #29, #30, #44, #46, #47, #48, #52, #53, #54, #55, #56, #57, #58, #59, #61, #66, #67, #68, #69, #70, #72, #73, #74 and #75 are done.** Lazar closed #3 and #73 on 2026-10-27, and the owner closed #6 the same day. The owner approved #69 and #74 in the component library on 2026-10-28, and closed #75 and #61 the same day. Lazar closed #68 on 2026-10-28, and #47 closed the same day when his card gallery merged.
  - The Node server, tests and CI exist.
  - The client is a Svelte 5 app built by Vite. The landing page, the lobby (#25), the play screen (#26), the player area (#27) and the designed prompts (#28) are built; a whole base game can be played with the mouse.
  - Every unverified rule detail is decided in the README's "Rules conventions" (R1–R110).
- **Next:**
  - M13's Words and names issues, ahead of M6 (owner, 2026-10-29). #123, #127, #126 and #129 are done (see [#123](#123-every-game-name-and-english-list-from-one-helper), [#127](#127-the-track-resource-and-building-lists-from-the-engine), [#126](#126-describejs-split-into-effect-words-decision-words-and-card-text) and [#129](#129-each-decision-kinds-client-facts-in-one-table)), so #31 is unblocked. What is left of #124, #125 and #128 waits for #85.
  - #77 (the first turn takes income by itself) is done: the owner approved its IncomeNotice and TurnBar sections and closed it on 2026-10-29.
  - #42 (How to play in the game, the keyboard shortcuts and the civilizations' text) is done for the base game; each expansion issue adds its own text.
  - #83 (the game's hotkeys) is done; its commit closed it on 2026-10-28, and the owner can still check the new TurnBar states in the component library.
  - #79 (every decision prompt at the tracks' centre, the prompt out of `Game.svelte`) is done; it merged and closed on 2026-10-28, after the owner's ruling on the library.
  - A first batch of #80's findings landed together on 2026-10-28: #84, #87, #91, #93, #98, #103, #113, #124, #128 and #130 (see [its entry](#80s-findings-first-batch)). #104 waits for #103's last piece and #125 for #124's.
  - A second batch of #80's findings landed together on 2026-10-29: #89, #97, #99, #100 and #119 (see [its entry](#80s-findings-second-batch)).
  - #78 (choices on the civilization card) is done: the owner approved the CivilizationCard section and closed it on 2026-10-29 (see [its entry](#78-choices-on-the-civilization-card)).
  - #86 (the turn footer) and #90 (the game header) followed the same day (see [their entry](#86-and-90-the-games-footer-and-header)). #88 and #122 can start now that #86 is in.
  - The owner ruled out screen-reader work (CLAUDE.md, 2026-10-28), so #121, which is only labels, is closed as not planned.
  - #80 is done: its findings are #84 and #86–#131.
  - #82 (the joined terrain of the base mats) is done: the owner approved all six base mats in the component library on 2026-10-28, and it merged into main on 2026-10-29. The expansion mats follow in #132 (M8) and #133 (M9), and the World Map's terrain in #134 (M12).
  - The six base example mats left the library on 2026-10-29, as duplicates of their reliefs' previews (owner; see [its entry](#the-base-example-mats-leave-the-library-refs-82)).
  - Then the next unblocked issues by milestone (see [Working on issues](../CLAUDE.md#working-on-issues)).
  - #45 Check R12 (landmark heights) and R39 (decision-card arrows) against the physical box. This is the owner's job, and it blocks nothing.
  - The cosmetic boards wait in #51 until the core features are done.
- **Everything else is blocked** until earlier issues close (see [Working on issues](../CLAUDE.md#working-on-issues)).

## Calls to revisit after playing

Many issues were built without a question round, so their designs mark every unsettled choice "(my call)" for the owner to revisit after playing. The issues below list such calls under their own heading; each design document in `docs/superpowers/specs/` has the full list.

- [#18 (tech cards: inventing and upgrading)](#18-tech-cards-inventing-and-upgrading)
- [#19 (tapestry cards and achievements)](#19-tapestry-cards-and-achievements)
- [#20 (the 16 base civilizations)](#20-the-16-base-civilizations)
- [#21 (randomized full-game simulation test)](#21-randomized-full-game-simulation-test)
- [#22 (the table lifecycle)](#22-the-table-lifecycle)
- [#23 (the server API)](#23-the-server-api)
- [#24 (the turn timer and undo)](#24-the-turn-timer-and-undo)
- [#53 (the optional variants)](#53-the-optional-variants)
- [#25 (the landing page, the new-table setup and the lobby)](#25-the-landing-page-the-new-table-setup-and-the-lobby)
- [#26 (the game screen and the shared board)](#26-the-game-screen-and-the-shared-board)
- [#27 (the player area and the players overview)](#27-the-player-area-and-the-players-overview)
- [#29 (the table log, scoreboard, results, sound and motion)](#29-the-table-log-scoreboard-results-sound-and-motion)
- [#30 (the hot-seat pass screen)](#30-the-hot-seat-pass-screen)
- [#28 (the decision prompts)](#28-the-decision-prompts)
- [#72, #67, #69 and #74 (the owner's M12 issues)](#72-67-69-and-74-the-owners-m12-issues)
- [#75 (picking several things one by one)](#75-picking-several-things-one-by-one)
- [#61 (the dice tray)](#61-the-dice-tray)
- [#77 (the first turn takes income by itself)](#77-the-first-turn-takes-income-by-itself)
- [#42 (How to play in the game)](#42-how-to-play-in-the-game)
- [#83 (the game's hotkeys)](#83-the-games-hotkeys)
- [#80's findings, first batch](#80s-findings-first-batch)
- [#82 (the joined terrain of the base mats)](#82-the-joined-terrain-of-the-base-mats)
- [#80's findings, second batch](#80s-findings-second-batch)
- [#86 and #90 (the game's footer and header)](#86-and-90-the-games-footer-and-header)
- [#78 (choices on the civilization card)](#78-choices-on-the-civilization-card)
- [#123 (every game name and English list from one helper)](#123-every-game-name-and-english-list-from-one-helper)
- [#127 (the track, resource and building lists from the engine)](#127-the-track-resource-and-building-lists-from-the-engine)
- [#126 (describe.js split into effect words, decision words and card text)](#126-describejs-split-into-effect-words-decision-words-and-card-text)
- [#129 (each decision kind's client facts in one table)](#129-each-decision-kinds-client-facts-in-one-table)
- [#88 (the game's keys and Escape through one layer state)](#88-the-games-keys-and-escape-through-one-layer-state)
- [#101 (rules versions, expansions and variants named in one place)](#101-rules-versions-expansions-and-variants-named-in-one-place)

## Issues

### #5 (the resources, buildings, track symbols and player pieces)

It is complete (owner approval, 2026-10-23). The reviewed resources, four income buildings, five track symbols, neutral player pieces and all five player-color variants are committed as reproducible SVGs. The associated 84 capital terrain tiles and six example mat compositions contribute to #6, which remains open. See `docs/art/issue-5.md` for the inventory and the decision to render dice faces and game symbols through text or draw them later with the map's terrain hex markers. The full former mockup is frozen in `docs/art/archive/2026-10-23-issue-5/`; placeholder dice, terrain hex marker and game-symbol drawings are archived only.

### #4 (art toolkit and asset catalog)

It is done. The owner approved the scene parts on 2026-10-21.

### #7 (landmarks)

It is done. All 33 are drawn, each one picture in its footprint's shape, and the owner approved them in the asset gallery (`art/preview/index.html`) on 2026-10-21.

### #9 (tapestry card pictures)

It is done (2026-10-22). All 115 pictures are drawn: 44 base, 13 Plans & Ploys, 20 Arts & Architecture and 38 Fantasies & Futures. The design is `docs/superpowers/specs/2026-10-22-tapestry-cards-design.md` and the plan is `docs/superpowers/plans/2026-10-22-tapestry-cards-issue-9.md`.
- The owner approved the base pictures, then asked for the other three sets to be finished without stopping for approval and #9 closed. Each set had a fresh review, and its findings were fixed.
- New toolkit pieces: the scene parts `drawShip` (sails set or furled), `drawInterior`, `drawBanner`, `drawCrowd` and `drawWheel`; `paint` and `line` in `tools/art/painter.js`; `glow` in `tools/art/effects.js`; and the arcane, ghost and teal glow colours in the palette.
- `tests/art-tapestry.test.mjs` checks that every tapestry picture paints all 4,096 pixels, that no two are identical, and that every card is drawn.

### #8 (civilization portraits)

It is done (2026-10-22). All 41 portraits are drawn: 16 base, 10 Plans & Ploys, 5 Arts & Architecture and 10 Fantasies & Futures. The design is `docs/superpowers/specs/2026-10-22-civilization-portraits-design.md` and the plan is `docs/superpowers/plans/2026-10-22-civilization-portraits-issue-8.md`.
- The owner asked for them to be drawn like the tapestry pictures, straight through without stopping for approval, by subagents in parallel. The Alchemists came first as the reference; each set then had a fresh review, and its findings were fixed.
- The palette gained two skin pairs: `skinTan`/`skinTanShade` and `skinDeep`/`skinDeepShade`. There are no new scene parts, so each portrait carries its own small drawing helpers.
- `tests/art-civ.test.mjs` checks that every portrait paints all 4,096 pixels, that no two are identical, and that every civilization is drawn.

### #10 (tech card pictures)

It is done (closed 2026-10-24). All 56 cards are drawn: 33 base, 11 Arts & Architecture and 12 Fantasies & Futures. The owner asked for the second 10 quickly, by parallel subagents, without a separate fresh review, and for the last 13 "a tiny bit simpler" (one big subject, plain backgrounds, about 40 to 60 colours); the 23 expansion cards follow the simpler rules too. The design is `docs/superpowers/specs/2026-10-22-tech-cards-design.md` and the plan is `docs/superpowers/plans/2026-10-22-tech-cards-issue-10.md`.
- The owner asked for the same rules as the tapestry pictures and the portraits. Each tech picture shows its invention up close, as the hero of the card.
- Few buildings (owner): the landmark cards show their invention, not their landmark. Bakery is newly discovered bread, Barn a newborn calf in straw, and Com Tower a dish antenna close up. Library, Stock Market and Treasury will do the same.
- Clocks was drawn first as the reference; subagents drew the other nine side by side, and a fresh review followed.
- `tests/art-tech.test.mjs` checks full bleed, no twins, and that every card of every set is drawn.

### #11 (masterpieces, landmark cards, space and inspiration tiles)

It is done (2026-10-24). All 20 masterpieces, 10 landmark cards, 4 inspiration tiles and 19 space tiles are drawn. The owner asked for #11 to be finished and pushed to main, so it closed without a separate approval, as #9 did; the owner can still ask for changes in the component library.
- **Masterpieces.** The design is `docs/superpowers/specs/2026-10-23-masterpieces-design.md` and the plan is `docs/superpowers/plans/2026-10-23-masterpieces-issue-11.md`.
  - The owner asked for the same rules as the other pictures, parallel subagents, few buildings and "7/10 on details": one clear hero and about 50 to 90 colours, with the Compass, Calendar and Entertainers pictures as the yardstick.
  - Each masterpiece shows its art form as the hero: the work itself, the performer, or the maker's hands at it. Seven subagents drew them side by side, and a fresh review followed.
  - `tests/art-masterpiece.test.mjs` checks full bleed, no twins, and that all 20 are drawn.
- **Landmark cards.** The design is `docs/superpowers/specs/2026-10-23-landmark-cards-design.md` and the plan is `docs/superpowers/plans/2026-10-23-landmark-cards-issue-11.md`.
  - The owner asked for "only artwork again", read as the masterpieces' rules and process.
  - Each card shows the life of its landmark close up, not the building's outside, which the landmark picture (#7) already shows: the game on the store's table, the camera in the studio, the gears inside the mill. Five subagents drew them side by side, two each, and a fresh review followed.
  - `tests/art-landmark-card.test.mjs` checks full bleed, no twins, and that all 10 are drawn.
- **Inspiration tiles.** The design is `docs/superpowers/specs/2026-10-23-inspiration-tiles-design.md`.
  - The owner asked for them to be finished and pushed to main, one parallel subagent per tile.
  - Each tile is a 192×32 strip: its income row's six innovations, one 32×32 space each (the size of a building), on the arts track's violet. The improved spaces 2, 4 and 6 have a gold frame and a sparkle. The benefits are not drawn; the interface shows them.
  - `tools/art/parts/inspiration-tile.js` draws the shared frame, ground and sparkle. `tests/art-inspiration-tile.test.mjs` checks the size, full bleed, the frames, that each innovation fills its space, no twin spaces, and that all 4 are drawn.
- **Space tiles.** The design is `docs/superpowers/specs/2026-10-24-space-tiles-design.md`.
  - The owner asked for #11 to be finished and pushed to main, read as the earlier #11 pictures' rules and process: 64×64 full bleed, 7/10 on detail, parallel subagents and a fresh review.
  - Each of the 19 is a space scene that hints at its tile's benefit: a space telescope for science, a gold asteroid for coin and worker, a black hole for 13 VP. The benefits are not drawn. The hero stays out of the corners, so a hexagonal frame can trim them.
  - `tests/art-space-tile.test.mjs` checks full bleed, no twins, and that all 19 are drawn.

### #12 (base game data)

It is done (2026-10-24). It is the first rules-engine issue. The design is `docs/superpowers/specs/2026-10-24-base-game-data-design.md`.
- `src/lib/engine/data/` holds the 48 track spaces with their tier costs and `advanceCost()`, the income mat's 24 spaces and 4 tapestry slots, the 6 capital mats with their start hexes, both map sides (61 and 34 hexes, 25 and 13 printed territories), the 48 territory tiles, the 15 space tiles, the 18 base landmarks with R12's height ranking of all 33, the 3 achievements and the 3 dice.
- Effects are data: a benefit is a list of one-key effects, taken in any order unless `ordered`, and a bonus is `{ pay, gain }`. The design lists the 19 effect kinds and the VP counters; #13–#20 interpret them.
- Both versions share the board data (R1, R5); `VERSIONS` holds each version's tiebreak chain (R10, R11), and only the current one uses the height ranking.
- Landmark footprints come from `src/lib/art/footprints.js`, and the grid size and plot numbering from `src/lib/capital.js`. The ids match `src/lib/ui.js` and the asset catalog.
- The research has no side-to-neighbour mapping for hexes, so `HEX_SIDES` in `maps.js` is read from BGA's explore-scoring code, as are the small-map orientations (all 0 except `0_3`, turned 2). The tiles, printed territories, orientations and mat grids were cross-checked against BGA's `material.inc.php` and 01 §6.2 with no differences.
- `tests/engine-data.test.mjs` checks every count, spot values from the research, that every effect has one known kind, that the data is frozen, and that engine modules import only relative paths.

### #13 (rules engine core)

It is done (2026-10-24). The design is `docs/superpowers/specs/2026-10-24-engine-core-design.md`.
- `createGame()` sets up 1-5 players in either version, and `play()` answers one decision and returns a new state. Setup picks are simultaneous and secret until the reveal.
- `view(state, seat)` hides the decks, other seats' hands and picks, hidden decision fields and event secrets, and adds `answers` to the viewer's own open decisions. `tests/engine-view.test.mjs` plays random setups for 1-5 players and checks every seat's view after each step.

### #14 (advance turns)

It is done (2026-10-24). The design is `docs/superpowers/specs/2026-10-24-advance-turns-design.md` and the plan is `docs/superpowers/plans/2026-10-24-advance-turns-issue-14.md`.
- A player who has taken income turn 1 may advance when they can pay for some advance. They pay the tier cost, move one token one space, gain the tier's landmark if first (R9), then take the benefit and may pay the bonus. `chooseAdvance` answers the track, the token and the payment in one go.
- Research, Physics, Quantum Physics, Neuroscience, Academic Research, AI Singularity, the "or" choices, the VP counters, bonuses and gaining income buildings are built. A track space is activated at most once per player per turn (R19).
- An unordered benefit runs its plain gains first, then any VP counter that no other part could change; when two or more parts whose order can matter remain, `chooseOrder` lets the player pick (Electronics, Nanotechnology, Cavalry, Mechs, Nuclear Bomb, and some space tiles for #17).
- The final review found two problems, both fixed with tests: VP counters ran too early, and an after-setup step placed after `'start'` would never run (it now throws). #54 asked the owner whether Alien Biology scores on a track whose token AI Singularity took off; it does (R109, owner, 2026-10-26).
- The rest is handed off by name, and each issue lists it: `tapestryOnTop` and the track achievement (#19); `gainCiv` (#20). Until then they throw an `Error` naming themselves. Tests stand in for them with `stubHandoffs()` in `tests/helpers/engine.mjs`.
- `tests/engine-track-spaces.test.mjs` reaches each of the 48 spaces by a real advance turn.

### #15 (income turns, eras and the game end)

It is done (2026-10-24). The design is `docs/superpowers/specs/2026-10-24-income-turns-design.md` and the plan is `docs/superpowers/plans/2026-10-24-income-turns-issue-15.md`.
- Answering `chooseTurn` with income runs that income turn's steps from `INCOME_STEPS`, a list later issues insert into: civilization abilities (#20), the first-of-neighbours bonus and the era's tapestry card, the optional upgrade (#18), scoring, income, and finishing after income turn 5.
- With an empty hand the top card goes on face down: the state keeps its id in `incomeMat.faceDown`, and `view()` hides it from everyone, its owner included.
- A finished player is skipped and gains nothing but passive civilization VP: `runEffects` skips their effects unless the operation is `passive` (#20 marks its passive VP).
- When every seat has finished, `rankPlayers` ranks them by VP and the version's tiebreak chain, and `state.result` records every tiebreak step used, with each compared player's value (owner). Shared places count 1, 1, 3. The tallest-landmark step reads `seat.capital.landmarks`, which #16 fills (it holds pieces, and `landmarksInCity` returns their ids).
- `tests/engine-scripted-game.test.mjs` plays a 2-player game from setup to the end.
- The final review found two problems, both fixed with tests: the `passive` mark was lost through `chooseOption` and `chooseOrder`, and an income step after `'finish'` would silently do nothing (it now throws).

### #16 (capital city placement and district rewards)

It is done (2026-10-24). The design is `docs/superpowers/specs/2026-10-24-capital-city-design.md` and the plan is `docs/superpowers/plans/2026-10-24-capital-city-issue-16.md`.
- A building goes on an open plot. A landmark goes in any of 4 rotations; it may hang over the edge if at least one grid plot is covered, but it may not overlap a piece or an impassable plot on the grid, and it may not cover another landmark's overhang off the grid (R106). When nothing fits, the piece goes beside the mat (`besideMat`). When there is only one place, it is placed automatically (owner).
- Each district a building or landmark completes pays 1 resource of the player's choice, one choice for all of them. It comes before the rest of the benefit and the bonus, so a landmark's district can pay the bonus (FAQ #1).
- `scoreCapital` scores the complete rows and columns. Symbology now really scores the capital on income turns 2-5.
- `capital.landmarks` now holds pieces `{ landmark, row, col, rotation }`, and `landmarksInCity` returns ids. `cityPlots(seat)` is derived from the mat and the pieces, and uses the interface's `PlotKind`.
- `tests/engine-capital.test.mjs` and `tests/engine-city.test.mjs` cover it. The scripted game checks both capitals at the end.
- Handed off: #18 pushes `placeLandmark` for the tech-card landmarks; #27 draws overhanging and beside-the-mat pieces; #31 places the bots' landmarks; #36 handles the advanced mats.

### #17 (exploring and conquering on the map)

It is done (2026-10-24). The design is `docs/superpowers/specs/2026-10-24-map-design.md` and the plan is `docs/superpowers/plans/2026-10-24-map-issue-17.md`.
- Exploring: a tile goes on an unexplored hex next to a territory the player controls (or anywhere, when the effect says so). The player picks the tile, the hex and the turn with `chooseExplore`; when every answer is the same, it is explored at once. Each matching side scores 1 VP, then the tile's benefit runs. Nothing happens with no tile or no legal hex (FAQ #19).
- Space tiles and R105: `chooseSpaceTile` explores a space tile beside the income mat, and Interstellar Travel's "explore 1 of them" uses the 3 tiles it just gained (`fromGained`).
- Conquering: `chooseConquer` picks an explored hex, and both dice roll even after a trap (01 §7.3). The black die's "?" gives the tile's benefit even after a trap, and a printed territory gives nothing (R107).
- The response question: `chooseResponse` asks the defender whenever they hold any card, so nobody learns who holds a trap (owner). A defender without a trap can only decline; the server answers after a random wait, which #24 builds. A finished defender is asked only in the original version (R108). A sprung trap keeps control and topples the attacker.
- Records for #19: an outpost has `toppledBy`, and a `conquered` event says whether the conquest was trapped.
- Handed off: #19 (Pillage and Plunder, the topple and middle-island achievements), #20 (civilization tokens on territories), #24 (the random wait), #30 (the hot-seat pass screen must not show who holds a card), #31 (the bots), #33 and #40 (other response cards).
- `tests/engine-map.test.mjs`, `tests/engine-explore.test.mjs` and `tests/engine-conquer.test.mjs` cover it.

### #18 (tech cards: inventing and upgrading)

It is done (2026-10-25). The design is `docs/superpowers/specs/2026-10-25-tech-cards-design.md` and the plan is `docs/superpowers/plans/2026-10-25-tech-cards-issue-18.md`.
- The owner's input was "not sure. implement and we will see later". So the research, the rule conventions and Board Game Arena settle what they can, and every other decision is marked "(my call)" in the design for the owner to revisit after playing.
- The data: `TECH_CARDS` holds the 33 base cards in `BASE_TECH` order, each with a circle, a square and a prerequisite. Six landmark cards need an innovation on the income mat (R18). New effect vocabulary: `noBenefit` on `advance` and `regress`, the `landmark` effect, and `oncePerTurn` on `repeat`.
- Inventing: `invent` takes a face-up card or the top of the deck into the bottom row, and the display is refilled. An empty deck is rebuilt from the discards. Rubber and Metallurgy may first refresh the display, which is an answer to `chooseInvent`, not a separate question. A newly invented card gives no benefit.
- Upgrading: a bottom card goes to the middle and gives its circle, and a middle card goes to the top and gives its square. The prerequisite may be met by you or by a neighbour. Only income step 3's upgrade is optional.
- `techBenefit` gives the benefit of a card in the middle or top row without moving it (Electronics, Assembly Line, Nanotechnology). A landmark card gains its landmark and places it through #16. Lithium-Ion Battery's square works once per turn, tracked in `state.usedThisTurn` (FAQ #6).
- Handed off: #19 (Printing Press's `tapestryOnTop`), #20 (Radio's `gainCiv`, and the Inventors and Tinkerers), #27 and #28 (the tech rows, the display and the prompts for the three new decisions), #31 (bots as neighbours for prerequisites), #53 (the variant without Radio and Lithium-Ion Battery).
- `tests/engine-tech-data.test.mjs`, `tests/engine-tech.test.mjs` and `tests/engine-tech-cards.test.mjs` cover it.

### #19 (tapestry cards and achievements)

It is done (2026-10-25). The design is `docs/superpowers/specs/2026-10-25-tapestry-abilities-design.md` and the plan is `docs/superpowers/plans/2026-10-25-tapestry-abilities-issue-19.md`.
- The owner asked for #19 and #20 to be built without a question round ("go ahead and work on #19 and #20"). So the research, the rule conventions and Board Game Arena settle what they can. The design marks BGA's readings **BGA** and every other decision "(my call)", for the owner to revisit after playing.
- The data: `TAPESTRY_CARDS` holds the 43 base cards in `BASE_TAPESTRY` order, then the trap. Each is WHEN PLAYED or THIS ERA. A trap played as a card is worth 10 VP (R22). The effect vocabulary gains 20 kinds, `optional` and `freeBonus` on `advance`, `tile` on `explore`, `faceUpOnly`, `deckOnly` and `thenUpgrade` on `invent`, the `trackLead`, `landmark` and `opponent` VP counters, and `vp` in a cost. The base-game data design's effect table lists them.
- Playing: a card goes on top of an era's slot, and its ability runs. `tapestryOnTop` plays a card from the hand on the current era (R25); with an empty hand nothing is played (FAQ #10). Espionage copies any visible top card but another Espionage.
- THIS ERA: `seat.era` holds the active ability. It starts when the card resolves, so it already works in the same income turn's later steps. It ends at the start of the next income turn, when another card covers it, or when the player finishes.
- Triggers and blocks: `triggered()` asks each seat's active ability when something happens, such as an invent, an upgrade or an advance. `advanceBlocked()` covers Broker of Peace, Theocracy and Dictatorship, whose blocks sit in `state.blocks` until turn order reaches or skips their player again (R26). `allies()` keeps Alliance partners from conquering each other.
- Achievements: completing a track, toppling two opponent outposts and conquering the middle island are claimed the moment they happen, on anyone's turn, and score at once (R23, R24).
- Calls to revisit after playing, from the design and from the build:
  - A THIS ERA card also ends when its player finishes, so one played on income turn 5 works for the rest of that turn.
  - Dictatorship, Broker of Peace and Theocracy block only forward moves. The note that Dictatorship blocks Socialism means Socialism's forward jump.
  - Dictatorship with no track to advance on blocks nothing. A research roll on a blocked track gives nothing.
  - Dark Ages advances on a track where the token can still move, when there is one; the card says only "the remaining track".
  - Coal Baron explores first, then the neighbours draw, as 02 §3 prints it (BGA draws first).
  - Monarchy scores only buildings in the capital, not beside the mat (R13).
  - Theocracy scores every tier a move enters or passes (R9's reading).
  - A benefit copied by Marriage of State doesn't trigger another Marriage of State.
  - Wartime Economy's free bonus stays optional (FAQ #4).
  - Renaissance's free bonus activates its space when it is offered, as BGA's marker does.
  - Age of Sail may give a tile to a finished opponent.
  - `tapestryOnTop` plays a lone card without asking, but income step 2 still asks.
  - A finished player claims no achievement. "Topple two" is checked when a conquest ends, so a topple that a trap undoes doesn't count.
- Handed off:
  - #20: civilizations join `triggered()` through `activeHooks()`, and the advance checks. The Heralds reuse `copyAbility` and `chooseTapestry` on era 1. The Inventors fire `upgraded` with the card's owner. Civilization triggers must let Tyranny's `chooseTapestry` open before anything takes a gained card from the hand.
  - #27 and #28: the tapestry strip, the active era card, blocks, achievements and the prompts for the new decisions.
  - #31: bots as opponents and neighbours. Some cards already reach them through `neighbours()`, so #31 must check Oil Magnate, Coal Baron and Steam Tycoon. Other effects look at every seat instead of `opponents()`: Plea for Aid, Technocracy and the `trackLead` and `opponent` VP counters. #31 decides whether bots count there.
  - #36: `impassableCovered` in `placing.js` assumes the basic mats.
- `tests/engine-tapestry-data.test.mjs`, `engine-tapestry-play`, `engine-tapestry-cards`, `engine-tapestry-tracks`, `engine-tapestry-map`, `engine-tapestry-era`, `engine-tapestry-copy`, `engine-abilities`, `engine-achievements`, `engine-counters` and `engine-payment` cover it. `tests/engine-tapestry-all.test.mjs` runs every card to the end from a busy mid-game seat.

### #20 (the 16 base civilizations)

It is done (2026-10-25). The design is `docs/superpowers/specs/2026-10-25-civilizations-design.md` and the plan is `docs/superpowers/plans/2026-10-25-civilizations-issue-20.md`.
- As for #19, the owner asked for the work without a question round. The research, the rule conventions (R28–R35) and Board Game Arena settle what they can. The design marks BGA's readings **BGA** and every other decision "(my call)", for the owner to revisit after playing.
- The framework: each civilization is a module in `civs/`, with its setup, the income turns its ability fires on, its trigger hooks, its end of income turn 1 and the current version's adjustment. It keeps its own state in `seat.civData[id]`, which every player can see.
  - After the reveal, every player sets up their civilizations at the same time, then takes the current version's adjustment for the civilization chosen at setup only (R34). The Futurists' and Heralds' adjustments come at the end of income turn 1.
  - Step 1 of income turns 2–5 runs each civilization whose ability fires. With several, the player picks the order (`chooseCivAbility`). A civilization gained during step 1 still fires that turn.
  - Civilization hooks join `triggered()`. Their operations are passive, so a finished player still gets their VP, and only their VP (01 §4.3). An optional gain is an `offer()`: a choice with the decline first.
  - `gainCiv` (Mechs, Radio) draws from the deck and runs the civilization's mid-game clause. The Mystics gained mid-game discard themselves for another.
  - New effects: `lose` (the Futurists' adjustment) and `placeToken`, and `noBonus` (Leaders) and `offTrackVp` (Alchemists) on `advance`. The base-game data design's effect table lists them.
- Map items: the Traders' and Isolationists' tokens sit in `hex.tokens` and give no control (R33). Nomads pieces sit in `hex.outposts`: they give control and topple like outposts, but never count as outposts. A territory with two items can't be conquered.
- New decisions: `chooseSlot` serves every civilization pick, with a `purpose` for the interface. `chooseCivAbility`, `chooseAlchemists`, `chooseSwap` and `chooseProphecy` are new too. `choosePlacement` gains the Craftsmen's columns, the Nomads' hexes and beside the mat.
- When an opponent's marked card reaches the top row, the Inventors take it. They may first gain its square when their own token moved it, in both versions. When anyone else upgraded it, they may gain the square only under the original rules: the current version follows the F&F rulebook r10-1, which corrects the first printing's FAQ (03 FF.8.2). Neither Golden Age nor an Alliance answers an upgrade by an Inventors token.
- When the Heralds copy Espionage, the copied ability rests on no card of theirs, so a copied THIS ERA ability lasts until their next income turn. A tapestry ability's `source` is `{ tapestry: ability, card }`, with `card` the card on the mat or null.
- Calls to revisit after playing, from the design and from the build:
  - A loss takes culture first, as much as is held. With no culture, no culture is lost.
  - `gainCiv` rebuilds an empty deck from the discards, except the civilization discarded last. So a lone Mystics discard gives nothing.
  - Futurists gained mid-game advance as at setup (BGA discards them). With several tokens on a track, the most advanced one moves.
  - Historians gained mid-game give all 4 tokens at once, choosing an opponent for each (BGA deals them round the table). With several territory tiles, the Historians choose which one to discard.
  - The Isolationists score in step 1 of income turn 5, and 0 VP with no territory (BGA scores 5 when the player finishes).
  - The Leaders aren't offered a blocked track, or one where no token can advance (BGA lets the square be wasted).
  - An Inventors mark stays with the card id, even through a discard and a later invent. A second token may go on a marked card.
  - A Traders token isn't offered on a territory whose lone item is a Nomads piece, because a piece is not an outpost.
  - Terraforming over an Architects cube earns its 5 VP, as over any impassable plot.
  - `startedGame()` deals civilizations without a setup or an adjustment and clears them once play starts, so no older test changes. `startedGame(n, { civs })` keeps the ones named, and `newGame()` deals real ones.
- Handed off:
  - #21: the simulation test. Beside #19's invariants (card and tile conservation, the era card always uncovered, no era on a finished seat), it should check that every civilization is in exactly one place: `supply.civs`, `supply.civDiscard` or a `seat.civs`.
  - #27, #28 and #47: the civilization mats with their tokens, the items on the map, and the prompts for the new decisions.
  - #31: bots as opponents for The Chosen, the Historians, the Traders' VP and the Architects' cubes. The Traders' `rivals()` copies `opponents()`, so #31 must update both.
- `tests/engine-civ-framework.test.mjs`, `engine-civ-hooks`, `engine-civs-setup`, `engine-civs-income`, `engine-civs-placement`, `engine-civs-map` and `engine-civs-cards` cover it. `tests/engine-civs-all.test.mjs` plays every civilization through setup, all five income turns and the game end in both versions. `engine-view` checks that civilization data is public and `chooseCiv` stays hidden.

### #21 (randomized full-game simulation test)

It is done (2026-10-25). It completes M3. The design is `docs/superpowers/specs/2026-10-25-simulation-test-design.md` and the plan is `docs/superpowers/plans/2026-10-25-simulation-test-issue-21.md`.
- As for #19 and #20, the owner asked for the work without a question round, so the design marks every other decision "(my call)".
- `tests/simulation.test.mjs` plays 200 random legal games from `createGame()` to the final ranking: 1–5 players, both versions, and two policies, *random* and *busy* (an offered advance turn 85% of the time), 10 games for each of the 20 combinations. Game `i` uses seed `i + 1`.
- Each answer comes from the acting player's own `view()`, as a client gets it. After every action, `checkState()` (`tests/helpers/invariants.mjs`) checks that every tech and tapestry card, territory and space tile, civilization, capital mat and landmark is in exactly one place, that each player owns 5 of each income building, 10 outposts and their civilization tokens, the ranges of resources, VP and track spaces, consecutive event numbers, #19's era rules, and that an answerable decision is open until the game ends. `checkViews()` (`tests/helpers/views.mjs`, shared with `engine-view.test.mjs`) checks every seat's view and the public one.
- The games run on worker threads (one per core but one, at most 8): about 20 seconds locally, about a minute on GitHub's runners. A failure names its seed, game, action and decision, and how to replay it with `SIM_SEED`. A worker silent for a minute is stopped and its game failed by name, so an endless loop inside one `play()` can't hang CI; the CI job also stops after 15 minutes.
- No engine bug turned up: 1,200 probe games, the 200 of the test and a 1,000-game soak all pass. The first run did correct the view checker: R35's draw reveals cards to everyone on purpose. `REVEALS` in `tests/helpers/views.mjs` lists the event fields that reveal cards by rule; a new public reveal must be added there, or the simulation reports it as a leak.
- A secret id is excused only where it is public now, or, in the action's new events, where it was public before the action or is revealed by rule. Older events aren't searched again. The fresh review showed that excusing ids named in older events hid a real leak, so that went. Six tech cards share an id with a landmark (Bakery, Barn, Com Tower, Library, Stock Market, Treasury), so their deck order can't be checked by id.
- Coverage: in the 200 games `chooseRestart`, `chooseSpaceTile`, `chooseHex` and `chooseSwap` never open, and the tech deck is never rebuilt from its discards. A later policy aimed at the late game could reach them.
- Handed off: #31 adds solo games and the bots' pieces to the checks; each expansion issue adds its cards, tiles and pieces to `checkState()` and its decks to `checkViews()`; #24's undo can reuse `checkState()`.

### #22 (the table lifecycle)

It is done (2026-10-25). It is the first issue of M4. The design is `docs/superpowers/specs/2026-10-25-table-lifecycle-design.md` and the plan is `docs/superpowers/plans/2026-10-25-table-lifecycle-issue-22.md`.
- The owner asked for #22 without a question round, although its blocker #53 (the variants) is still open. So the table options carry a `variants` list that the engine checks against `VARIANTS`, which stays empty until #53 is decided; #53 stays open. Every decision the issue, the design document and the lobby mockup don't settle is marked "(my call)" in the design.
- A room is `{ code, mode, options: { version, expansions, variants, level }, host, seats: [{ player, name, away? }], game, touched }`. Online, every person has one seat. At a hot-seat table the host plays every seat, and the names differ.
- Calls to revisit:
  - The table starts with the current official rules, online. The host may change the options in the lobby, and at a finished table before dealing again, because the approved lobby mockup has the mode switch and the settings panel there. The mode changes only before the first deal and while the table has one seat.
  - Solo tables check the Automa's level (1–6, default 2), then are refused with "Solo play isn't available yet." until #31. Online and hot-seat games need 2 players.
  - Leaving a lobby gives up the seat. Leaving a game in progress or a finished one marks a dealt seat away, so the seat numbers keep matching the game; a newcomer's seat at a finished table goes. A finished table closes once nobody present is left, a running one never.
  - `end` lets the host abandon a running game, back to the lobby: at a hot-seat table at any time, online once everyone else has left (the review found that otherwise a game everyone left holds its players until it expires).
  - While no game is running the host may remove a seat (the mockup's X), but not their own online seat. At a finished table that only marks a dealt seat away, so it isn't dealt again.
  - The host may deal a new game at a finished table, to the present seats only. Newcomers may sit down at a finished table, as in Bird Table; the away seats don't count towards the 5.
  - At most 1,000 tables; a table nobody uses for a day expires. `unfinishedSeat` lets #23 keep a player in a running online game from sitting elsewhere; a hot-seat game holds nobody.
- Handed off, and written on each issue: #23 (endpoints, sessions and person ids, `touched`, the room `version`, long polling, a create rate limit, sweeping before `addRoom`, `unfinishedSeat` at start too, and the room's view with `view(game, seat)` for each seat in `seatsOf`), #24 (timer, kicking, undo), #25 (the lobby's Open seat slots, readiness and the civilization chooser need their own transitions), #29 (telling a new deal from the old game), #30 (which hot-seat seat to show), #31 (solo tables, the 2-player Shadow Empire variant, and bot seats in the room tests), #53 (the variants: a variant with a setting changes the list's shape).
- `tests/rooms.test.mjs` covers every rule, and its randomized test runs 200 runs of 300 random steps over online and hot-seat tables. `tests/engine-setup.test.mjs` covers `checkOptions()`.

### #23 (the server API)

It is done (2026-10-26). The design is `docs/superpowers/specs/2026-10-26-server-api-design.md` and the plan is `docs/superpowers/plans/2026-10-26-server-api-issue-23.md`.
- The owner asked for #23 without a question round, so the design marks every other decision "(my call)".
- `api.mjs` serves #22's transitions to guests:
  - **Sign-in:** `POST /api/login { name }` gives a bearer token, and every other request carries it.
  - **Endpoints:** `config`, `tables`, `me` (`{ name, code, saved }`), `create { options }`, `join { code }`, `state?since=&seat=`, then `configure`, `add-seat`, `remove-seat`, `start`, `end` and `move { version, seat?, action }`, and `leave`.
  - **Versions:** every table change carries the table's `version`; a stale one gets 409, a missing one 400.
  - **Statuses:** 400 for a `PlayerError`; 401 sign in again; 404, 405, 413, 429 and 503; 500 for a bug.
- `GET /api/state?since=<version>` answers at once when the table is newer, otherwise waits up to 25 s.
  - `seat` picks which of your seats to see. At a hot-seat table the default is the public view, so #30 asks for each seat.
  - Answering a waiting request never throws: an unexpected error is logged and answered with 500, because it runs from timers and from other people's changes.
- Calls to revisit:
  - Person ids never leave the server; views name seats by number.
  - `leave`, `create` and `join` carry no version.
  - A session sits at one table at a time. A session whose person holds a seat lasts a day unused, and any other an hour. A seat counts if it is present, or in a running game away or not.
  - A session that ends leaves its tables.
  - At the 10,000-session cap a login replaces the longest-unused session holding no seat.
  - Per address (an IPv6 address counts by its /64 block): 1,800 requests, 20 tables and 30 logins a minute; at most 10 open tables, 50 long polls, and 4 long polls per session.
  - A lobby nobody polls closes after an hour.
- Two automated security reviews and a fresh code review shaped these limits; the design's §9 says what they don't stop (about 100 IPv4 addresses could still fill the tables). Behind a reverse proxy, `TRUST_PROXY=true` is required; the server warns once when it sees `X-Forwarded-For` without it.
- Handed off: #24 (the timer and undo endpoints, through `change()`/`commit()`; clear turn timers on expiry and server close, as Bird Table does), #25 (the client side: `src/lib/api.js` and `src/lib/game.svelte.js`, reading `config`, `tables`, `me.saved` and the room view), #30 (`state?seat=`), #43 (Discord login beside the guest one), #29 (a deal counter if the log needs one).
- `tests/api.test.mjs` starts the server on port 0. Its main test has two clients play a whole game over HTTP at the same time, retrying on 409, without seeing each other's hand or picks. The others cover every endpoint and status, long polling, hot-seat, the limits and session expiry.

### #24 (the turn timer and undo)

It is done (2026-10-26). The design is `docs/superpowers/specs/2026-10-26-timer-and-undo-design.md` and the plan is `docs/superpowers/plans/2026-10-26-timer-and-undo-issue-24.md`.
- The owner answered the questions this time:
  - a timeout plays the rest of the turn with the default answers, from where the player is (a started advance is finished, not swapped for an income turn);
  - the screens warn the player in the last 5 seconds (drawn later);
  - undo stops at anything revealing;
  - there is no kick.
- Built:
  - **Settings:** the host sets `timer` (off, 1, 2 or 5 minutes) and `undo` (on or off) through `settings`, in the lobby, in a game or at a finished table. New tables start with the defaults (timer off, undo on). A timer change restarts every clock.
  - **Clocks:** the turn's player has one clock for the whole turn, paused while they are not asked. Setup has one clock per player. Anyone else asked gets a fresh clock. The room view carries `clocks` and `now`.
  - **Timeouts:** an expired clock adds a `timedOut` event, then the server answers with the defaults until the player is not asked any more.
  - **The decline wait:** a defender who can only decline is answered after a random 3 to 10 seconds, online (#30 dropped it at hot-seat tables, where the defender answers through the pass screen). The wait stays on the room and never reaches the view.
  - **Undo:** a player takes back their own choices one at a time, back to the start of their turn, and still the last one until the next player's first choice. A choice is revealing, and cannot be taken back, when the engine used randomness, changed anything `view()` hides, or added an event with a `secret`.
  - **Endpoints and timers:** `settings` and `undo`, and one timer per table (see Architecture).
- Calls to revisit:
  - No undo in setup or in someone else's turn.
  - A choice that leaves another player asked during your turn (a conquest's response, a neighbour's pick) ends undo, because their open choice can tell you something.
  - The last choice of the game can't be undone.
  - Undo keeps 20 steps: about 2 MB per table at worst, about 2 GB at the 1,000-table cap (random play peaked at 8 steps, about 0.9 MB).
  - A move that arrives after a clock ran out lets the timeout happen first, then gets 409.
  - A timer change empties the undo history.
  - The engine counts turns (`state.turn`).
  - `revealed()` sits in `table.js`, and both it and `view()` read `HIDDEN_DECKS` in `view.js`, and a test derives the hidden decks from `view()`'s own output.
  - The decline wait is never in the view.
  - Settings change only through their own endpoint.
- Handed off, and written on each issue:
  - #25 to #28: the lobby's timer and undo controls, the clocks and warning, the undo button (`canUndo`) and the `timedOut` and `undone` events;
  - #29: the log drops the events from an `undone` event's `from` onwards;
  - #30: undo and the clock follow the hot-seat seat whose turn it is;
  - #31: whether the Automa's and Shadow Empire's turns have a clock;
  - every expansion issue: a new hidden deck joins `HIDDEN_DECKS`; a new hidden hand-like field is added to `revealed()` and `view()` together; a choice that shows a player something hidden without changing any of them must add an event with a `secret`, or undo would let them peek; an expansion with simultaneous decisions mid-turn checks that a seat asked again gets a fresh clock.
- `tests/engine-table.test.mjs`, `tests/rooms-clocks.test.mjs`, `tests/rooms-undo.test.mjs` and `tests/api-timer.test.mjs` cover it, and the randomized room test gained `settings`, `undo` and `timeout` steps. `tests/helpers/engine.mjs` gained `conquestGame`.

### #53 (the optional variants)

It is done (2026-10-26). The design is `docs/superpowers/specs/2026-10-26-variants-design.md` and the plan is `docs/superpowers/plans/2026-10-26-variants-issue-53.md`.
- The owner chose 7 of the 8 official variants; "remove any cards the players choose" is out. Five are built and listed in `VARIANTS`:
  - `tapestry-draft`: income turn 1 draws 2 tapestry cards and keeps 1. `gain` takes a `keep` count, and the new `chooseKeep` decision asks which; the others are discarded, and only the kept card triggers.
  - `civ-draft`: `gainCiv` draws 2 civilizations and keeps 1, through `chooseCiv` with `midGame: true`; the other is discarded face up.
  - `neoprene-nanotechnology`: Nanotechnology's bonus costs 2 tech cards (`bonusOf` in `choose-bonus.js`, exported from `game.js` for the Tracks view).
  - `no-radio-battery`: Radio and Lithium-Ion Battery are left out of the tech deck (`techDeck`).
  - `closest-island`: R110. Players start round the map in seat order, spaced evenly, from a random island (`ISLANDS` and the `startOnIslands` setup step).
- Recorded for later: civilizations from one expansion (#33, ids `civs-from-pp`, `civs-from-aa`, `civs-from-ff`) and either science die (#35, `either-science-die`). With the drafts, F&F's Psionics draw 3 and keep 1 (#40).
- Calls to revisit: any mix of variants in both versions, each at most once; the drafts' discards are public; `tapestry-draft` changes only income turn 1's Ceremony card; the civilization pick can be undone but the tapestry keep can't; R110's reading.
- Handed off: #3 and #25 (the variant checkboxes, from `config`'s `variants`), #26 (show bonuses through `bonusOf`), #28 (prompts for `chooseKeep` and the mid-game `chooseCiv`), #29 (the log names a game's variants), #31 (whether the variants touch the Automa's draws), #33, #35 and #40.
- `tests/engine-variants.test.mjs` covers each variant, and `checkViews()` now also watches the civilizations of an open mid-game draft. A fresh review found no bug; its smaller findings (repeated ids, missing tests, this file) are fixed. The simulation plays every other 20 games with all five on. In those games every income turn 1 drafts, but no game gains a civilization or reaches Nanotechnology, so the unit tests carry those two.

### #25 (the landing page, the new-table setup and the lobby)

It is done (2026-10-27). The design is `docs/superpowers/specs/2026-10-27-landing-and-lobby-design.md` and the plan is `docs/superpowers/plans/2026-10-27-landing-and-lobby-issue-25.md`.
- The owner's rules for the client (2026-10-27): where Lazar's mockups and the owner's design collide, the mockups decide the look and the owner's design decides what works; and the client fits our own API rather than copying Fablewood or Bird Table. The owner chose readiness as an informational toggle, and #25, then #26–#28, then #6.
- Built: the landing page (sign in by name, a generated name when blank, create, join by code or from the Open tables list, Return to your game), the lobby (Online/Local mode, the code and COPY, Start game, I'm ready and Leave table, five seats, hot-seat players added by name, the host's ×, the settings), and a holding page after Start. A refresh comes back to the table; a player the host removes lands back on the landing page.
- The server gained `ready()` and `POST /api/ready`. The random room test checks that readiness lives only in an online lobby and that a host change clears it.
- CI on main had been red since Lazar's `src/styles/card-layouts.css` (hard-coded colours, undeclared custom properties); its colours now name tokens with the same values (Refs #47).
- Calls to revisit:
  - No civilization in the lobby: the rules deal two once the game starts (#28). The mockup's Map row and three sample rule rows are left out; the five variants take their place as Yes/No rows, under Undo rules.
  - Online, Open seat copies the code; Take the seat! is left out, as the server seats joiners in order.
  - A host change to the rules, variants, timer or undo clears everyone's readiness; a joiner starts not ready.
  - A stale change is sent once more when the seats are the same, otherwise "The table changed. Try again."
  - Each browser tab is its own guest (`sessionStorage`); sound is remembered in `localStorage` and starts muted.
  - The mode switch, the divider and the Open tables heading are in Cinzel, as in the mockups; the brand keeps the play mockup's look.
- Handed off: #26–#28 replace the holding page and add the in-game header controls; #29 the finished table, dealing again and the log; #30 the hot-seat pass screen (`state?seat=`); #31 solo mode and the Automa's level in the lobby; the expansion issues appear by themselves once `config.expansions` lists them; #43 Discord login.
- `tests/client-api.test.mjs` (against the server on port 0), `client-lobby`, `client-names` and `client-poll` cover the client modules; `rooms.test.mjs` and `api.test.mjs` cover readiness. A browser walkthrough with several tabs checked every flow, and the README's screenshots come from the running game.

### #26 (the game screen and the shared board)

It is done (2026-10-27). The design is `docs/superpowers/specs/2026-10-27-game-screen-board-design.md` and the plan is `docs/superpowers/plans/2026-10-27-game-screen-board-issue-26.md`. The owner approved it ("build all"), ahead of its blocker #6.
- Built: `Game.svelte` with the header (player chips, the turn clock, Undo, sound, the menu with Leave table), the shared area (the board switcher, the achievements, the tracks with the spaces the viewer can pay for outlined in green, and the World Map as the real board's hex grid), the player area with Your overview, the footer turn (income, or a chosen space's benefit, bonus and price, then Advance, asking for the payment when there is a choice) and the decision panel with a plain prompt for every other decision. A whole game can be played with it.
- The World Map (owner): flat-topped hexes as on the printed board, hex `a_b` at x = 1.5·s·(b − a), y = (√3/2)·s·(a + b), corner 0 top-left, side e facing `HEX_SIDES[e]`; terrain wedges per corner, islands, dashed unexplored hexes; outposts as squares, tokens as circles. #6's art replaces the drawn terrains.
- Legal advances and payments are the engine's own `advances()` and `chooseAdvance.answers()`, run on the viewer's view before anything is sent; a test over 40 random games checks the preview always equals the server's answers.
- New components, each in the library: `AchievementStrip`, `TurnClock`, `SelfSummary`, `DecisionPanel`, `DecisionOption`, a rebuilt `WorldMap` (`hexes`, `targets`, `selected`), and `available` on `TrackSpace`/`Track`/`TrackBoard`. Four of the tasks were built by parallel implementers in their own worktrees.
- Calls to revisit: available spaces are green (gold stays for selected); landmarks leave the track once taken; the achievements sit in the shared area's head; the plain prompt until #28; Your overview's last count is complete capital lines; a stale move isn't resent; at a hot-seat table the lowest asked seat is shown, without a pass screen until #30; the setup chip reads "Setting up".
- Handed off: #27 (the tabs, switching tabs for decisions, the overview from the chips), #28 (the designed prompts, extending `describe.js` to cards and civilizations), #29 (log, motion, results, timed-out notice, settings during a game), #30 (the pass screen), #6 (the map art; the outpost SVGs could replace the squares).
- `tests/client-turn`, `client-board`, `client-hexmap`, `client-describe`, `client-clock` and `client-overview` cover the modules; `client-api` plays setup and first turns through `sendMove`. A browser walkthrough with two tabs played setup, income turns, advances with a payment choice and an explore on the map.

### #27 (the player area and the players overview)

It is done (2026-10-27). The design is `docs/superpowers/specs/2026-10-27-player-area-design.md` and the plan is `docs/superpowers/plans/2026-10-27-player-area-issue-27.md`. Built without stopping for approval ("build all").
- Built: the seven player tabs (Capital, Hand, Income, Eras, Civ, Tech, Terrain) above Your overview; a card shown in full over the shared area on hover; tab switching by decision; the players overview from the chips with a Capital, Civilization or Tech drill-down for any player.
- Real cards: `techCardData` and `tapestryCardData` build the reviewed frames from the engine's data; `describe.js` gained the THIS ERA and card-rule texts (`describeTapestryCard`), paraphrased from the research with exact numbers. `TechnologyCard`/`TapestryCard` take `id` (fixture) or `data`.
- New components: `IncomeMat`, `EraSlots`, `TerritoryTile`, `CardFan`; `CapitalGrid` draws landmarks over the edge (R106), and `placement.js` gained `pieceArea`. Four tasks were built by parallel implementers in worktrees.
- Calls to revisit: the four base civilizations without a recipe (Futurists, Heralds, Nomads, The Chosen) get a plain portrait card until #47 (drawn since, 2026-10-27); the capital's terrain seed is the table code; the tab mapping per decision; the overview's capital "points" are complete lines.
- Handed off: #28 (placing on the capital and choosing cards in the tabs), #47 (the missing civilization cards and the card gallery).
- `tests/client-game-cards`, `client-area-capital`, `client-area-income`, `client-area-terrain`, `client-area-tabs` and `client-area-players` cover it; a two-tab walkthrough checked every tab and the overview.

### #55 (Vitest and Playwright)

It is done (2026-10-27). The 118 `node:test` suites moved to Vitest 5 mechanically: `test` from `vitest`, `before`/`after` as `beforeAll`/`afterAll`, `t.after` as the context's `onTestFinished`, `t.mock` as `vi` (spies restored by `restoreMocks`, fake timers put back after each test), assertions still `node:assert/strict`. A Vitest global setup builds `build/`, so `npm run test:unit` needs no `pretest`. Playwright 1.64 runs one Chromium project (`playwright.config.js`, svelte_components' settings) over `tests/browser/`: the library page and the game page, without console errors. CI runs `quality` and `test` jobs on Node 24 with `actions/checkout@v6` and `setup-node@v6`, caching Chromium and keeping failed runs' traces. The simulation keeps its worker threads, watchdog, `SIM_SEED` and `SIM_GAMES`.

### #29 (the table log, scoreboard, results, sound and motion)

It is done (2026-10-27). The design is `docs/superpowers/specs/2026-10-27-log-results-sound-design.md`. The owner asked for it to be built and pushed without a question round, so every unsettled choice is marked "(my call)".
- **VP sources:** the engine credits every VP to a source (`seat.vpSources`: tracks, tapestry, tech, map, civ, income, capital, achievements, paid, other). An operation's `origin` names it; `push()` passes it from the operation being run or answered (`contextFor(…, from)`), unless the new one has its own origin or a source of its own. `vpGained` carries `source`; the simulation checks the sources add up to the VP, and a test checks random games never credit other.
- **Built:** the deal counter on rooms; the log and scores panel (header ▤, over the player area); the results screen after Lazar's end screen, with Deal again; sound cues; motion (map pulse, capital glow, chip pop, growing lines); the timed-out toast; Table settings for the host during a game.
- Calls to revisit: the log uses names, never "you"; at a hot-seat table the result box shows the winners; one cue per batch of events; the log panel covers the player area; dealing again keeps the rules.
- `tests/engine-vp-sources`, `rooms-deal`, `client-event-feed`, `client-log`, `client-results`, `client-sound-motion` and `tests/browser/results.test.mjs` cover it.
- A fresh review found that Review game board snapped back to the results on any room update (the reset now keys on the table and deal only), that Mercantilism's conversion and Age of Sail's gift were credited to the income turn and the tracks (now the tapestry), and a few accessibility slips (the log region, labelled groups, focus in the settings, one Escape for one panel); all are fixed, with tests for the first two.

### #56–#59 (the owner's first look at setup and the tracks)

They are done (2026-10-27). The owner filed them after playing setup and asked for them to be resolved. The decision-prompts design, §8, records them.
- #56: each capital mat on offer is its 9×9 `CapitalGrid` (`matPlots`, `terrainSeed` in `src/lib/area/capital.js`), not the example art.
- #57 and #58: civilization cards on the shelf are whole, 425 px wide at their own height, scaled down only as far as the shelf needs (never below 0.75), and each sizes its own button, so the outline fits. The shelf fills the height above the panel; a panel without options of its own puts its instruction in the status line.
- #59: each track space shows its benefit and bonus through `src/lib/glyphs.js`, with the words as its tooltip; the track board is a size container that lets spaces grow up to 1.25 times as tall as wide.
- `tests/client-glyphs.test.mjs` and `tests/browser/setup-prompts.test.mjs` cover them. The browser test closes its table: the server allows 10 open tables per address, and a running game stays open for a day.

### #30 (the hot-seat pass screen)

It is done (2026-10-27). The design is `docs/superpowers/specs/2026-10-27-hot-seat-pass-screen-design.md` and the plan is `docs/superpowers/plans/2026-10-27-hot-seat-pass-screen-issue-30.md`. The owner asked for it without a question round ("resolve issue 30"), so every unsettled choice is marked "(my call)".
- Whenever a hot-seat screen passes to another player (a new turn, another player's question, the next player's setup, a new deal, a refresh), the pass screen names them: "Pass the screen to Vera", their token, a reason line from the public view, their clock when the table has a timer, and **I'm Vera**. Until then the client holds only the public view and asks `state?seat=` only after the hand-over (#23).
- The server schedules no automatic decline at a hot-seat table (`tick` in `api/rooms.mjs`): every asked defender takes the screen and answers the response question, trap or not, so the pass screen, its clock and its reason line look the same either way (#17). The pass screen holds its player even when a timeout moves the game on; events that arrive meanwhile make no sound or toast. A player who takes the screen with nothing left to do passes it on at once. Its menu offers How to play and Leave table.
- Calls to revisit: the 0.6-second wait before **I'm Vera** answers, and the button never focused for the player; no automatic decline at hot-seat tables; no undo or table settings from the pass screen (undo as before #30); a finished hot-seat game is reviewed through the public view; the reason line reads the same for every question outside a player's turn.
- `tests/client-pass.test.mjs` covers `handOver` and `passReason`; `tests/rooms-clocks.test.mjs` the missing decline at hot-seat tables; `tests/browser/pass-screen.test.mjs` plays a deal through a hand-over and a refresh, watching the page's requests.
- A fresh review found that the automatic decline still gave a no-trap defender away when the turn timer was on (the clock vanished from the pass screen) or when it ended the attacker's turn (the reason line changed); hence the server change. Its smaller findings (the game's final move, a late answer after leaving, Leave table on the pass screen, the announced opening, the idle clock) are fixed.

### #6 (the boards)

It is done (2026-10-27): drawn, then approved and closed by the owner the same day. The design is `docs/superpowers/specs/2026-10-27-boards-design.md` and the plan is `docs/superpowers/plans/2026-10-27-boards-issue-6.md`. Built without stopping for approval ("When you are done just finish up #6").
- **The map is composed, not painted** (the capital's rule from #5): each terrain has one 64×56 hex picture (`hex/*`, `tools/art/parts/territory.js`), and WorldMap and TerritoryTile fill each wedge and island part with it, clipped, with a coast where land meets sea. A turned tile stays crisp and shows the terrains the engine scores. `territory-tile/1–48` and `board/map-small`/`map-large` are the same composition in pixels, for the gallery; the boards are examples.
- **Clouds are game data (R77):** `TERRITORY_TILES` and the printed hexes carry `clouds` and `volcano`. The cloud and volcano overlays sit at spots shared in `src/lib/art/hex-overlays.js` (the volcano on its mountains' corner in every turn); screen readers hear them. #49 scores the clouds.
- **The 12 advanced capital biomes** each have 8 buildable and 6 impassable 32×32 plots and an example mat on the printed layout from 03-expansions (`tools/art/parts/capital-biomes/<biome>.js`, `LAYOUT` pinned against the research in each test). What the research doesn't show (rule text, icons, frames) is left out.
- **Handed off to #36:** each biome module exports `FEATURES` (its ordinary pools, its position-bound variants such as Quagmire's reeds and wisps, and its mat-only features such as Canyon's cacti or Polar's rings). #36 composes advanced mats in the game from them; `capitalTileUrl` stays base-only, so no special tile lands on a random plot.
- A fresh review found no bug in the data or the composition; its art findings (a Cloud City tile, several obstacles that read as something else, beaches round the Archipelago's volcanoes) are fixed, and the overlays now sit at their spots instead of stretching over the hex.
- `tests/art-territory`, `art-capital-<biome>` (12), `art-capital-features` and `client-hexmap` cover it.

### #28 (the decision prompts)

It is done (2026-10-27). The design is `docs/superpowers/specs/2026-10-27-decision-prompts-design.md` and the plan is `docs/superpowers/plans/2026-10-27-decision-prompts-issue-28.md`. Built without stopping for approval ("build all").
- `promptFor()` gives every open decision a title, an instruction, a layout (`options`, `cards`, `map` or `capital`) and one option per answer with its art; a test over random games checks that every answer is reachable exactly once. Nothing is sent before Confirm.
- New components, each in the library: `PromptArt`, `CardShelf`, `IncomeSteps`; `DecisionOption` gains `art` and `vp`, `DecisionPanel` `track`, `tone`, `steps` and `docked`, `TurnBar` the `income` tone, `WorldMap` `preview`, `CapitalGrid` `targets`, `preview` and `room`. `CivilizationCard` draws its frame, portrait and name for a civilization without a recipe.
- The #27 final review's fixes came first: room for landmarks over the edge in the tab and the overview, a card on Maker of Fire, the full-card view clearing, the PlayerCard's terrain and true capital points, card wording, and the overview's keyboard.
- Calls to revisit: an explore started on its best tile and turn (replaced by #74's tile picker); a building click previews and Confirm sends, while a landmark's own lock sends; `chooseSwap` and `chooseCivAbility` stay panel choices; the income strip shows Ability, Tapestry, Upgrade, Score and Income, the first-of-neighbours bonus inside Tapestry; the capital mats' choice showed the example mat art until #56 drew each mat as its grid.
- Known gaps: `CapitalGrid`'s own fit check stops R and the arrow keys at places over the edge (R106) or under Terraforming, which a plot click or a drop still reaches; a trap response and a tapestry discard never came up in the walkthrough (the prompt tests cover them).
- The final review found that a Nomads player could never place in their capital (their territories took the prompt over); the capital now leads and the map's hexes stay lit beside it, and the panel docks whenever the map shows hexes to choose. It also made the card shelf scroll rather than clip, fanned tapestry cards only past four, and centred landmarks.
- `tests/client-prompts`, `client-area-explore` and `client-area-placement` cover it. Two hot-seat games were played to the end in the browser through the prompts alone, and a third checked the Nomads' placement.

### #72, #67, #69 and #74 (the owner's M12 issues)

They were built on 2026-10-27 without a question round. #72 and #67 are done, and #69 and #74 are done since the owner approved them on 2026-10-28.
- **#72:** the progress lines and the chips' fill animate with transforms, not widths.
- **#67:** the screen headline sizes are tokens in `tokens.css` (`--font-size-4xl`, `-5xl`, `-6xl` and `--font-size-display-sm`, `-display`, `-display-lg`).
- **#69:** track-space text grows to 11px from about 2240×1260 and to 12px from 2560×1440; `tests/browser/track-text.test.mjs` checks nothing is cut off. The owner approved it in the library's TrackSpace section (owner, 2026-10-28).
- **#74 (the explore prompt):** the design is `docs/superpowers/specs/2026-10-27-explore-prompt-design.md` and the plan is `docs/superpowers/plans/2026-10-27-explore-prompt-issue-74.md`.
  - Built: the docked panel shows the player's tiles as pictures ("Your tiles · n", `TilePicker`), a chosen line ("Hex −1,−1, turned once") and `TurnControl` (↺, "+3 VP", ↻, "R turns it"), pinned above Explore while the tiles scroll (`DecisionPanel`'s `pinned` snippet). The tile or the hex can be picked first; a hex first picks the lowest-numbered tile at its best turn. With a tile picked, each lit hex shows its best VP as a "+N VP" tag (`WorldMap`'s `scores`). R and Shift+R turn the tile. The Terrain tab's offered tiles are buttons too (`PlayerTabs`' `tilePick`). `describeTurn` replaced `describeTile`.
  - Calls to revisit: a hex picked first takes the lowest-numbered tile; the best turn is the highest VP, then the lowest turn; picking another tile or hex keeps the other and moves to its best turn; clicking the picked tile again does nothing; an explore has no separate status line, as the chosen line names the hex and turn once; no cancel button (another hex is one click away); one tile is picked from the start; the 6 turns of an island tile still step through all 6; the row wraps and Explore stays visible; the tile numbers print on the pictures; a tile's accessible name gives its terrains and best VP; the chosen hex's name gives its VP in the turn chosen, the other lit hexes' "up to"; R is ignored while the overview, Table settings or How to play is open, and repeats when held; nothing changes while the explore is being sent; while a panel is docked, the board leaves its width free (`--docked-panel-width`, `--docked-panel-inset`), so no hex lies under it.
  - The owner approved it in the library's TilePicker, TurnControl, DecisionPanel and WorldMap sections (owner, 2026-10-28).
  - `tests/browser/explore-prompt.test.mjs` plays a hot-seat table to an explore and closes it.

### #75 (picking several things one by one)

Built on 2026-10-28 after a mockup round: the owner asked for Board Game Arena's method ("use bga method"), then for height over width, every panel at the screen's centre and the advance's cost there too. The design is `docs/superpowers/specs/2026-10-28-multi-select-prompt-design.md` and the plan `docs/superpowers/plans/2026-10-28-multi-select-prompt-issue-75.md`.
- Built: `src/lib/picks.js` turns `chooseResource`, `chooseConversion`, `chooseBonus` (resources, tiles or cards), `chooseTrade` (offers, then rows) and an advance's payments into rows and pickers, and matches a selection to one answer; a resource or card is enabled only if some answer holds everything chosen with it. `ResourceRows` draws the rows; `TilePicker`, `CardShelf` and the Terrain tab pick several at once; `SelfSummary` shows the counts after the choices so far; `DecisionPanel` gains `centred` and `statusWarn`. Picking a space with a choice of payment opens the centred panel at once, replacing the "How do you pay for …?" list. A VP trade sends the trade, then the `chooseResource` it opens, with one Confirm.
  - Calls to revisit: the chosen resource again clears its row (BGA keeps it); a single resource is one row too; card payments keep the shelf above a bottom panel (the shelf's 392px cards can't fit above a centred one); the Hand tab's fan doesn't pick; a decision with one way to pay keeps its one option (Olympic Host); Cancel on the advance panel clears the space, and the footer's Advance waits while the panel is open; the cap warning is `--danger` red; the resources are drawn at their native 48px; a trade offer with one way to pay shows it with Back and Confirm; tiles wrap three to a row.
  - It is done: the owner closed it on 2026-10-28 ("close tickets we resolved"), which approves its ResourceRows, TilePicker, CardShelf, SelfSummary and DecisionPanel sections.
  - `tests/client-picks.test.mjs` covers the model; `tests/client-prompts.test.mjs` builds every answer of every pick model over 60 random games; `tests/browser/pick-prompts.test.mjs` plays hot-seat tables to a tile bonus and to an advance, and closes them.

### #61 (the dice tray)

Built on 2026-10-28 without a question round ("finish up 61"), from the issue. The design is `docs/superpowers/specs/2026-10-28-dice-tray-design.md` and the plan `docs/superpowers/plans/2026-10-28-dice-tray-issue-61.md`.
- Built: `src/lib/dice.js` turns `scienceDieRolled`, `conquerDiceRolled`, `alchemistsRolled` and `alchemistsBust` (which now names its `track`) into rolls; `Die` draws a style C body (`die/science-body`, `die/red-body`, `die/black-body`, new in the catalog's `die` group) with the face composed on it, as #5 decided; `DiceTray` plays a batch in order (1 s tumble, 1.5 s hold, a fade), above the panels (`--layer-tray`); `App.svelte` draws it over every screen from the store's fresh events; `cueFor()` gains `dice` (`drop_001`).
  - Calls to revisit: the tray fades rather than parking beside the panel; captions name no cause until #60; a hot-seat caption names the roller, never "You"; the dice cue reuses `drop_001`; the science face shown is the first of the track's three; the bust's caption is red; no d20 or arts face until #35 and Arts & Architecture.
  - It is done: the owner closed it on 2026-10-28 ("close tickets we resolved"), which approves its Die and DiceTray sections and the three die bodies, now in `docs/art/approved-assets.json`.
  - `tests/client-dice.test.mjs` covers the rolls and every face; `tests/browser/dice-tray.test.mjs` plays an online table to a conquest and sees it on both screens.

### #73 and #68 (Lazar's screenshots and VP labels)

Recorded on 2026-10-28, when Lazar's branch `lazar-milin-cleanup-after-milestone-5` merged into main. Lazar closed #73 on 2026-10-27 and #68 on 2026-10-28.
- #73: the README's civilization-choice screenshot showed an old placeholder. Lazar retook it (`game-prompt-civ.png`) and the other decision screenshots: the capital mats, landmark placement, cards on the shelf and the income turn.
- #68: the card score ladder's VP labels use `--font-size-3xs` from the type scale instead of a fixed 8 px (`src/styles/card-patterns.css`).
- Without an issue, the same branch restored the pixel texture on its own pages and took the track-coloured outlines off the resource icons in track prices and cost boxes (`launch.png` and `lobby.png` retaken; `docs/ui/README.md` records both).

### #47 (the card frames and the card gallery)

Closed on 2026-10-28, when Lazar's branch merged (owner: "close issues that they resolve"). The frames follow `docs/ui/card-design-rules.md`, which the owner approved; Lazar built the gallery and the last frames on 2026-10-27 and 2026-10-28.
- Built: the card gallery, `cards.html` → `src/gallery/`, lists every catalog asset by type and expansion, with a count per type, a search, an edition filter and **Show more**. Civilization, tapestry, tech, landmark-card, masterpiece and space-tile entries use their game frames with the engine's text where it exists; undrawn art is a slot naming the item. Every screen's header menu opens it in a new tab (`PageHeader.svelte`). New components: `LandmarkCard` and `MasterpieceCard` (319 px), and `ScaledTapestryCard`, which shows a whole tapestry card smaller on the shelf (0.7) and in the Eras (0.6) and Hand (0.42) tabs without the layout jumping. Review pages: `docs/ui/landmark-cards-review.html` and `docs/ui/masterpiece-card-review.html`.
- The merge added what the unit tests ask of every component, which the branch lacked: library sections for `LandmarkCard` and `ScaledTapestryCard`, an `@example` in all three, their rows in `src/lib/components/README.md`, tokens for three hard-coded colours, and the gallery page in `tests/vite-config.test.mjs`.
  - Calls to revisit: landmark cards read "Rules text pending" until the expansions' rules supply their conditions; `LandmarkCard` draws its edition chip in the Arts & Architecture colours, also for the five Plans & Ploys cards; 24 catalog items have no art yet (15 dice faces, 5 game symbols, 4 boards).
  - `tests/browser/card-layouts.test.mjs` checks that card art and edition rules align and that tapestry cards grow with their text.

### #77 (the first turn takes income by itself)

Built on 2026-10-28. The owner changed the issue's brief when asked: "Just make the first income automatic. make sure player knows what's going on. also make sure player knows when there are no more legal moves except to income." The design is `docs/superpowers/specs/2026-10-28-first-income-turn-design.md` and the plan `docs/superpowers/plans/2026-10-28-first-income-turn-issue-77.md`.
- Built: `startTurn()` (`src/lib/engine/turn.js`) takes income turn 1 itself for a player seat with no income turns: `turnStarted`, `turnChosen` (`income`) and the income steps under the turn's end, with nobody asked. So the move that ends setup runs every seat's income turn 1 in turn order, stopping only where it asks something (the tapestry draft's keep, a civilization's end-of-first-turn rule); `state.turn` counts those turns too. `turnOptions()` and `chooseTurn.check()` lost their first-turn branch. In `src/lib/turn.js`: `incomeWords()`, `forcedIncome()`, `takingTurnWords()` and `firstIncomeNotice()`. The new `IncomeNotice` opens once per seat after its income turn 1; a turn with only income to take has its own footer with a gold **Take income** in the actions; `cueFor()` plays the turn cue only for the batch's last `turnStarted`.
  - Calls to revisit: the notice is a centred panel over the board with **Got it**, titled "Era I begins", remembered in `sessionStorage`; its holdings follow `describeCost()`'s order (coin, food, worker, culture); a later forced income turn stays a click, since it ends an era; its **Take income** is the outlined `gold` button, as the footer's **Results** is; the waiting footer names any income turn ("Ana is taking income turn 3."); "End era IV, score it and finish playing." before income turn 5.
  - Tests: `startedGame()` (`tests/helpers/engine.mjs`) answers setup with every seat's `incomeTurns` already 1 unless `keepIncome` is passed, so tests start from what setup gave, as before; `firstIncomeTurn()` runs a seat's income turn 1 again after a `fill`. `tests/browser/first-income.test.mjs` plays a hot-seat setup and sees each player's notice once. `pick-prompts` closes the notice as it takes the screen, and its several-resources test now reads the answer's own `resourcesGained`, since an income step's gains could follow in the same move.
  - Handed off: #31 (whether the Automa and the Shadow Empire take an automatic income turn 1; `startTurn()` only does it for player seats), #62 (the first turn has no **End turn** moment), #71 (the footer's heading and detail wording agree with these states).
- **Closed** on 2026-10-29, when the owner approved the IncomeNotice and TurnBar sections in the component library.

### #42 (How to play in the game)

Built on 2026-10-28, ahead of M10, because the owner asked while #77 was finishing: first "add keyboard actions in the hamburger menu so that players know how to use keyboard shortcuts", then "just resolve 42 as well then". The design is `docs/superpowers/specs/2026-10-28-how-to-play-design.md`.
- Built: `src/lib/rules-help.js` (`RULES_HELP`, six sections of the base rules, paraphrased from `docs/research/` with every number exact; decided rules carry their R id in a comment), `src/lib/civ-rules.js` (`civRules`, `civAbilityText`: the 16 base civilizations' full abilities in either version, with a "Current rules:" paragraph for the eleven whose current text differs: ten R34 adjustments and the Inventors' top-row rule), `src/lib/shortcuts.js` (`SHORTCUTS`), and `src/screens/game/RulesPanel.svelte`, How to play in the game with a Keyboard shortcuts tab. The game's menu gains **Keyboard shortcuts**, How to play in a game is now the game's own (App's table steps stay before a game), and `PlayerChip` gains `ability` for its tooltip.
  - Calls to revisit: the chip's ability is the native tooltip, as the track spaces' words are; a section stays near 200 words, so the finer FAQ points (R108's finished defender, an explore with no tile, the landmark heights in the tiebreak) are left out rather than said loosely; the civilizations' text follows the engine where the research reads differently (the Heralds' draw stops at a When Played card, the Militants pay on income turns 2–5, the Mystics pay when a count equals the prediction).
  - Tests: `tests/client-rules-help.test.mjs` and `tests/client-civ-rules.test.mjs` check every section and civilization and spot-check their numbers against the engine's data; `tests/client-shortcuts.test.mjs` checks every key the game answers to is listed; `tests/browser/rules-panel.test.mjs` opens both entries from the menu and reads a chip.
  - Handed off: each expansion issue (#32–#41) adds its civilizations to `civ-rules.js` and its rules to `rules-help.js`; the card gallery (#47) already shows the tapestry, tech and space-tile text.

### #83 (the game's hotkeys)

Built on 2026-10-28, filed and specified by the owner in a few messages after #42 ("I tohught somethign more like I for income, 1,2,3 to see different players Q,W,e to toggle between capital hand etc"). The design is `docs/superpowers/specs/2026-10-28-hotkeys-design.md`.
- Built: `src/lib/hotkeys.js` (`hotkeyAction`, `TRACK_KEYS`: a key and the screen's context to an action), `SHORTCUTS` rewritten as the keymap, and `Game.svelte`'s one key handler with three new states: `incomeAsk` (the footer's "Take an income turn?", which the **Take income** button now opens too), `trackAsk` ("Advance on which track?") and `logPeek` (the log while Tab is held). `PlayersOverview` gains `player`; `LandmarkPiece` and `TurnControl` turn on **.** and **,** instead of R.
  - Calls to revisit: **M** on the map goes back to the tracks; the track question's numbered buttons work with the mouse too; a track with several tokens advances the most advanced; Enter acts only when no control has the focus (a focused button presses itself); a decision panel's controls don't block the hotkeys, a menu, a modal or a field does; the Tab peek waits 200 ms.
  - Tests: `tests/client-hotkeys.test.mjs` (every key in each context), `tests/client-shortcuts.test.mjs` (every hotkey is listed), `tests/browser/hotkeys.test.mjs` (a hot-seat game played with the keys: Enter, W, Q, M, 2, a held Tab, A then 1, and I asked, cancelled and taken). `explore-prompt` presses **.** where it pressed R.
  - Handed off: #35 gives the arts track key **5** in `TRACK_KEYS`.

### #80 (scan the client for code that should be its own component)

Done on 2026-10-28, with no code change. Five read-only passes covered `src/App.svelte`, `src/screens/`, every component in `src/lib/components/`, every client module in `src/lib/` and the library sections. The findings were merged where they touch the same code and filed as #84 (nine small bugs) and #86–#131, each in the repository's layout, with the M12 milestone and blocked-by links where they must land in order. The ranked list is the summary comment on #80. Line numbers in those issues are as of commit 047209f.
- Highest cost to open work: #86 (the turn footer, for #62 and #71), #95 (split `PlayerTabs`, for #78 and #82), #106 and #107 (the civilization card from data; #47 closed without it), #123 (one names module) and #127 (the client's track lists from the engine, for #35).
- Handed off: #79 was the first finding; the issues blocked by it are listed on #80.

### #79 (the decision prompt in one place, at the tracks' centre)

Built on 2026-10-28. The design is `docs/superpowers/specs/2026-10-28-decision-prompt-design.md`. The owner ruled that every prompt opens at the centre, then, reviewing the library, that it is the centre of the tracks, not of the screen.
- Built: `src/lib/prompt-state.svelte.js` (`PromptState`: the prompt's selection keyed to the decision, what the board, the player area, the footer and the dice tray read, and the actions), `panelControls` and `paymentControls` in `src/lib/prompts.js`, and the screen part `src/screens/game/DecisionPrompt.svelte`. `Game.svelte` went from 1,926 to about 1,100 lines and keeps only the turn's state. `DecisionPanel` centres by default, with the shelf and the panel as one stack; `centred` became `narrow` (440 px, `--narrow-panel-width`) and `docked` stays for the Map view. `CardShelf` takes the `room` the panel leaves it. `DiceTray` takes `panel` from the game (bound from `Game` through `App`) instead of finding the panel by its class, and Enter confirms through the prompt state instead of clicking the panel's button. The library's DecisionPanel and DiceTray sections show the stacks in a scaled 1920×1080 screen (`src/library/Screen.svelte`).
  - Also: the footer words a space as its track does, so an ordered space says "then" (`spaceWords` in `board.js`, Refs #84), and the landmark prompt names the **.** and **,** keys instead of R.
  - Calls to revisit: the stack is centred in the shared area, so on the vertical its middle is the screen's, a little above the tracks' own middle (the board's head row sits above them); a dice roll over a stack of cards rolls over the player area; the options panel's 480 to 900 px width and the shelf's 18 px gap are #28's.
  - Tests: `tests/client-prompts.test.mjs` (`panelControls`, `paymentControls`), `tests/client-prompt-state.test.mjs` (resets, explore, picks, trades, shelf, placement, payment, sending), `tests/client-board.test.mjs` (`spaceWords`), `tests/browser/decision-prompt.test.mjs` (a card choice and an options prompt open at the tracks' centre); the pick tests measure against the tracks' centre.
  - Handed off: #86, #88, #92, #96, #97, #99, #105, #116, #117, #118, #119, #126, #129 and #131 waited for this.

### #80's findings, first batch

Built on 2026-10-28 as ten of #80's smallest findings, in four parallel streams that kept clear of #79, #82 and #85 (Lazar's track-space rework), then merged onto main with #79 in it. Each issue has its design and plan under `docs/superpowers/` (2026-10-28). The owner ruled out screen-reader work the same day, so the labels these issues changed stay as built and nothing more is done for them.
- **#130:** the store's take-or-fetch rule is `acceptStep()` in `src/lib/pass.js`, tested case by case; `game.svelte.js` only applies it, and `#fetchView` and `takeSeat` share one `#askView`. The timeout toast reads as the log does, "Vera's clock ran out; the rest of the turn was played for them." (owner, 2026-10-28).
- **#103 (partly):** `PlayerToken` takes a `seat`, and the pass screen, the standings and the scoreboard draw their tokens with it. Left: `ProgressLanes`' token, after #85; `tests/library.test.mjs` names it in `TOKENS_LEFT` until then. #104 waits for it.
- **#113:** `territoryShapes()`, `territoryClips()` and `territoryWords()` in `hexmap.js`, drawn by the new `TerritoryClips` and `TerritoryArt`, which `WorldMap` and `TerritoryTile` both use; `PromptArt` takes `tilePreview`. Pixel-identical. #114 builds on it.
- **#124 (partly):** `describe.js` exports `amountWords`, `resourceName` and `priceWords`; `CostBox`, `ResourceIcon`, `ResourceChip`, `ResourceRows` and `picks.js` use them, so every amount has its plural. The owner approved "resource of your choice" for "any" everywhere and digits in prices. Left: `TierPrice` switches to `priceWords` after #85. Found, not fixed: `engine/payment.js` 217 still says "Pay 2 coin".
- **#84:** landmark names come from the art catalog ("TV Station"), the income mat says "an armory", the placed landmark's rotate title is "Rotate (. or ,)" (owner), `CardRewardColumns` keeps its class, the Tech tab's display row is 298 px, and #124 (plurals), #91 (duplicate ids) and #79 (the footer's "then") did the rest. The achievement label was dropped with the screen-reader ruling.
- **#128 (partly):** the engine exports `capitalScore`, `tiebreakValues` and `exposedSpaces` through `game.js`; the player cards, the overview, the scoreboard and the income mat read them, and `PlayerTabs` takes the era from `selfSummary`. Left: the tier part (`tierOf` as the one helper, `tierSymbols` in `board.js`, `picks.js`' tier lines, `Game.svelte`'s `priceSymbols`), after #85 and #86.
- **#98:** the lobby's lists and lock rules are in `lobby.js` (`modeChoices`, `modeLock`, `settingsLock`, `rulesChoices`, `expansionChoices`, `variantRows`, `toggleVariant`, `UNDO_CHOICES`, `YES_NO_CHOICES`); the new `PlaySettings` draws the timer and undo rows in the lobby and in Table settings; `SeatCard` gains `closed` and `SettingRow` `divided`. Undo rules moved to the left column under Turn timer (owner, 2026-10-28; `docs/ui/screens/lobby.png`). New browser test `tests/browser/lobby.test.mjs`.
- **#91:** `Tabs` prefixes its ids, draws its panel and takes the focus (`idPrefix`, `panelClass`, `autofocus`); `PlayerCard` takes `autofocus`, so nothing queries another component's markup.
- **#93:** `TilePicker` gains `pickable`, `size` and `dataIdPrefix` and draws the Terrain tab's tiles; a picked tile keeps its fill on hover.
- **#87:** `src/lib/components/ui/Dialog.svelte` is the one shell for How to play, the launch help and Table settings: it takes the focus and gives it back, handles Escape on its own box and keeps Tab inside when modal. Table settings stays not modal and takes the shared look (owner, 2026-10-28). Open: should Results and the pass screen show the game's rules under How to play?
  - Calls to revisit: Table settings closes on a click on the scrim; the launch page's How to play opens with the focus on its box, not Close.
- **Tests:** every issue built test-first. Together on main: `npm run check` clean, 1801 unit tests (the simulation included) and all 31 browser tests pass.
- **Handed off:** #85 finishes #103, #124 and #128's track parts; #86 takes `priceSymbols`; #88 routes Escape and decides whether Table settings is modal; #95 builds on #91 and #93; #101 and #102 on #98.

### #82 (the joined terrain of the base mats)

Built on 2026-10-28. The owner set the look over five rounds of throwaway sketches ("More realistic and less symbolic", "Make it visually appear 2.5D"), then approved all six base mats in the component library on 2026-10-28 ("ok push to main"). Mountain and Forest were drawn first, from the approved sketch; Wetland, Tropical, Desert and Grassland followed without one. The owner scoped the issue to the base game ("just the base game for now"). The design is `docs/superpowers/specs/2026-10-28-joined-terrain-design.md` and the plan `docs/superpowers/plans/2026-10-28-joined-terrain-issue-82.md`.
- Built: `tools/art/parts/capital-relief/` draws a mat's impassable plots as one 2.5D picture, its relief (`capital-relief/<mat>`, 296×296, transparent), from the mat's printed layout. Plots joined by a side or a corner make one group. Its footprint is inset from the open sides with rounded corners, and a corner-only join gets a small patch that may reach into the buildable plots' corners (owner). Each biome has a painter: snow-capped peaks, broadleaf trees and pines, reed beds round dark pools, jungle with palms, sandstone buttes among dunes, and grassy hills with stone tors. `ground.js` draws each biome's natural ground.
  - The base `capital-terrain/<biome>-open-01` to `-08` are now that natural ground, and the example mats `capital-mat/<biome>` are the ground with the relief over it.
  - `CapitalGrid` lays the relief over its ground tiles, under the buildings. The red X and the flat background on impassable plots are gone (owner), and the gap is 1/296 of the width, so the plots line up with the relief's pixels.
  - `src/lib/capital-terrain.js` (`plotTerrain`, `reliefUrl`) decides what each plot shows. A building on a printed impassable plot (Terraforming) clears the relief there. An Architects' cube is now a piece of its own, `piece/architects-cube`, on its plot's ground.
  - The library's Art area has a Capital relief group: each mat's relief on its ground, and a specimen sheet per biome with every kind of join.
  - The library draws its art only when a tile comes into view, a slice at a time, and loads each drawing module only then (owner, 2026-10-28). The page opens in about 1.1 s instead of 8.4 s. Each drawing's size is known up front (`src/library/`), so the `#art-…` links land and stay put; a new asset of an odd size needs its size added there, and `tests/library-art.test.mjs` says so.
- Released: the 36 base impassable tiles are retired, with their drawings, SVGs and catalog entries. `docs/art/approved-assets.json` pins the redrawn ground tiles and example mats, the six reliefs and the cube: 101 entries. From now on the manifest is updated with the art on the issue branch, which merges only after the owner approves the batch (`docs/art/README.md`).
- The README's capital screenshots are retaken from the running game: the Capital tab, the players overview, the mats on offer at setup and the library's CapitalGrid.
- Calls to revisit after playing: Tropical's palms barely read as palms at the Capital tab's size; the Desert's butte outlines are strong; the Grassland's golden ground may read as sand. Each mat's relief is the same in every game, like the printed mat, and only the ground varies with the table's seed (my call).
- Tests: `tests/art-capital-relief.test.mjs` (the groups, joins, footprints and corner patches on every base mat and the specimen layouts; each relief the same in every build, palette colours only, nothing on a buildable plot outside a corner patch; each biome's ground and corner piece), `art-capital-terrain` (the natural ground and the 296×296 example mats), `client-capital-terrain` (what each plot shows), `art-approved` (the 101 pinned assets), and the library's browser tests (the relief's place in the stack, the cube, a cleared plot, the gap, a landmark over the edge, a mat on offer, and targets under a corner patch).
- Handed off: #132 (the Arts & Architecture mats' reliefs, M8) and #133 (the Fantasies & Futures mats', M9), each done the same way, with the advanced mats' printed features kept; #134 (the World Map's terrain hexes and territory tiles in the 2.5D style, M12).

### #80's findings, second batch

Built on 2026-10-29 as five more of #80's smallest unassigned findings, one branch each, merged onto main one after another. They keep clear of Lazar's issues (#60, #62, #63, #71, #81 and #85: the track spaces, the turn bar and the prompts' wording). Each issue has its design and plan under `docs/superpowers/` (2026-10-29).
- **#100:** `viewerSeat(room)` in `moves.js` is the one viewer-seat rule (the person's own seat online, nobody at a hot-seat table), behind the store's `viewer` getter; App's sound cue and dice tray and Results read it. App's storage fallback and random source are `safeStorage` and `randomInt` in the new `src/lib/storage.js`, tested with a getter and a `getItem` that throw. `HandOver` types its store. `seatSlots` keeps its own rule, since it marks the seats in `room.you`, not the seat on show.
- **#119:** `prefersReducedMotion()` in `motion.js` is the one `matchMedia` call. `TUMBLE_MS` moved to `dice.js`, and `Die` sets `--rg-die-tumble` from it on its own root, so a die rolls at the same pace in the library. The tray's fade reads the `--duration-medium` token through `msOf()`, so `FADE_MS` and its separate reduced-motion check are gone.
- **#89:** `shownClock(room, seat)` (the header's four-step choice, moved unchanged) and `isRunning(clock)` in `clock.js`. `clockTime.now` in the new `src/lib/now.svelte.js` is one 250 ms timer, through Svelte's `createSubscriber`, that runs only while a screen reads it. `TurnClock` takes `name` and titles itself ("Vera: 1:42"). The pass screen chooses with `shownClock` too, and shows the clock only when it is the named player's own.
- **#99:** `menuItems(screen, { hosting })` in the new `src/lib/menu.js` lists the start pages', the pass screen's, the results' and the game's entries. `PageHeader` takes the store and its `menu`, turns sound on and off, and leaves the table itself. New browser test `tests/browser/menu.test.mjs`.
- **#97:** tokens `--scrim`, `--scrim-strong`, `--float-surface` and `--opacity-disabled`, used by `DecisionPanel`, `Dialog`, the game's card inspector, `DiceTray`, `Button`, `Segmented` and `TurnControl`. `Button` styles `aria-disabled`, so `PassScreen` drops its `:global` patch. `Panel` takes `titleFont`, so the landing page's Open tables panel needs no doubled class, and the lobby's dead players-title rule is gone. The issue's `Spoken` component (visually hidden text) is left out under the screen-reader ruling. Before-and-after screenshots of the touched library sections and the landing page are byte-identical apart from the item below.
- Calls to revisit after playing: the pass screen's take button dims to 0.5 while it arms and loads, as every `Button` does, instead of 0.6 (#97); the pass screen shows no clock when the header would show another player's (#89).
- **Tests:** every issue was built test-first; the browser tests for #89 and #99 were written to pass on the old code, so they pin its behaviour, and #89's was checked to fail with the ticker's subscription taken out. Together on main: `npm run check` clean, 1923 unit tests (the simulation included) and all 42 browser tests pass. The hotkeys browser test failed once under a slow parallel run and passed on every run after.
- **Handed off:** #90 moves the header with `shownClock`, `clockTime` and `menu="game"`. #116 takes the dimmer look of a choice that can't be picked (0.3–0.35) and `DecisionOption`'s disabled state. #43 can reuse `safeStorage` and give its screen its own entries in `menuItems`.

### #86 and #90 (the game's footer and header)

Built on 2026-10-29, after the second batch, one branch each, merged onto main in turn. Each issue has its design and plan under `docs/superpowers/` (2026-10-29). Together they take about 300 lines out of `Game.svelte`.
- **#86:** `footerView(game, seat, inputs)` in `turn.js` decides which of the eleven footers shows (the overview's close bar, game over, the income and track questions, forced income, a selected space, the turn choice, an income turn, a decision, setup, waiting) and every word in it, with a test for each on a real game view. The new screen part `src/screens/game/TurnFooter.svelte` draws it as one `TurnBar`, keyed on its kind. `tierSymbols(track, tier)` in `board.js` is a tier's price, used by `trackBoard()` and the footer, so the footer no longer rebuilds the board; that was `tierSymbols` from #128's remainder. `sendAdvance` in `moves.js` sends the advance's two moves and is tested, and selecting a space is a plain `selectSpace()`, so the fake `ComponentEvent` is gone.
- **#90:** `playerChips(view)` in `area/players.js` gives the header's chips; its "Setting up" rule is `civilizationOf()`, shared with `playerCards()`. The new screen part `src/screens/game/GameHeader.svelte` draws `PageHeader` with the game's menu, the chips, the turn clock, Undo and the log button with its dot. `IconButton` got no `dot` prop (the issue's optional idea): the dot stays a span over the button, inside `GameHeader`.
- **Pixels:** screenshots of six footers and five header states in a hot-seat game are byte-identical before and after.
- **Tests:** test-first; `tests/client-footer.test.mjs` is new. #90's design and plan were written after its tests and code, not before. Together on main: `npm run check` clean, 1947 unit tests (the simulation included) and all 42 browser tests pass. Two browser runs during the work failed in milliseconds when back-to-back runs went over the dev server's per-minute table and login limits; on a fresh server everything passes.
- **Handed off:** #62 (End turn) and #71 (the decision footer's words) now change `footerView` and `TurnFooter`. #122 moves `TurnBar`'s income reveal out, and #88 routes the keys, which still set `incomeAsk` and `trackAsk` in `Game.svelte`. #128's remainder is `tierOf` and `picks.js`' tier lines, after #85. #31 adds bot seats to `playerChips` and bot turns to the waiting footer.

### #78 (choices on the civilization card)

Built on 2026-10-29, when the owner asked for it to be done and pushed while away ("work on 78 next and push to main"), so there was no question round. The design is `docs/superpowers/specs/2026-10-29-civ-card-choices-design.md` and the plan `docs/superpowers/plans/2026-10-29-civ-card-choices-issue-78.md`. It stayed open until the owner approved the CivilizationCard section in the component library, as its checklist asked.
- Built: `src/lib/civ-card.js` turns a seat's `civData` into marks on named spots for the Entertainers, Merrymakers, Leaders, Militants, Historians and Mystics (`civCardMarks`), says which spot an answer picks (`cardSpot`) and what it gives (`spotWords`), and gives a card its marks and the spots on offer (`civCardView`). The library's reviewed play illustration now comes from `SAMPLE_CIV_DATA` through the same code. The engine exports the Historians' squares and the Mystics' prophecies for it.
  - `prompts.js` places those answers on the card (`place: 'card'`, `spot`, the `card` layout and its instruction), worded by `spotWords`. `PromptState` keeps the chosen `spot`; `selectSpot()` picks a spot's answer, or lists the answers several share (the Historians' opponents) in the panel; `civPick` feeds the Civ tab. The panel lists no column-and-row buttons; a picked spot's words are its status line.
  - `CivilizationCard` takes `live`, `seat`, `selected` and `onCivilizationCardPick`; `CardSlot` takes `pickable`, `picked`, `value` and `onCardSlotPick` and is then a button. A spot on offer has a `--ok` outline (dashed with keyboard focus), the picked one gold. The card sets `--player-1` to its seat's colour, so its borders match its tokens. The 12 other civilizations ignore `live`. The library has a live and a choosing example for each of the six; its 58 existing card screenshots are byte-identical.
  - The Civ tab and the players overview draw the six cards live; the overview's are to look at only.
  - New screenshot `docs/ui/screens/game-civ-card-choice.png` in the README and `docs/ui/README.md`.
  - The browser tests' dev server raises its per-address limits on new tables and logins (`CREATE_LIMIT` and `LOGIN_LIMIT`, set in `playwright.config.js`; production keeps 20 and 30). The suite had reached about 21 new tables a minute from one address, so a test's `create` was refused now and then; this was probably behind the hotkeys flakes earlier the same day.
- Calls to revisit: the panel opens at the tracks' centre, as every prompt does under the owner's #79 ruling, though #78 asked for it not to cover the board; a Mystics prediction reached shows no mark (no reviewed style for one); seat 3's green tokens look like the outline of a spot on offer and seat 4's yellow like the picked gold; spots carry no new accessible names (the screen-reader ruling); an Entertainers token on the start shows the start token at full strength.
- Tests: `tests/client-civ-card.test.mjs` (new), `client-prompt-state` (choices on the card), `client-prompts` (every card option has its spot), `limits` (the environment's limits) and the new browser test `tests/browser/civ-card.test.mjs`, which deals one hot-seat table of five again until the Entertainers are offered and moves their token on the card. Together on main: `npm run check` clean, 1965 unit tests and all 43 browser tests pass, twice in a row.
- Handed off: #107 draws the card from data on these spot ids and marks; #60 can add where an effect comes from to the card's panel; #33, #37 and #40 add a case to `civCardMarks` and `cardSpot` for each expansion civilization whose choice is a spot on its card.
- **Closed** on 2026-10-29, when the owner approved the CivilizationCard section in the component library ("78 looks good").

### The base example mats leave the library (Refs #82)

Done on 2026-10-29, when the owner asked what the Art area's Capital mats and Capital relief sections each are and ruled "let's not duplicate the art". The design document's §3.4 records the ruling.
- Removed: the six base example mats `capital-mat/<biome>`, with their drawings, SVGs, catalog entries and lines in `docs/art/approved-assets.json` (now 95). Each was `drawReliefPreview` on the mat's layout, the same picture as its relief's preview under Capital relief. `drawCapitalMat` is gone from `tools/art/parts/capital-terrain.js`.
- Kept: the 12 expansion example mats. They are not duplicates: nine of them draw printed features no tile has (`FEATURES.matOnly`), such as Canyon's cacti, Netherworld's imps, Polar's field lines and the Veil.
- `PromptArt` draws a `mat` item as its relief. The game never shows that picture: the capital shelf draws each mat as its `CapitalGrid` (#56).
- Tests: `art-capital-terrain` (a base mat has no example drawing or catalog entry, and has a relief), `art-catalog` (the group's counts), `art-approved` (12 example mats, 95 pinned assets), `engine-data` (every base mat has a relief) and `library-art`.
- Handed off: #132 and #133 drop each expansion mat's example once its relief is drawn and whatever only the example draws is drawn elsewhere (my call).

### #123 (every game name and English list from one helper)

Built on 2026-10-29, the first of M13's Words and names issues, after the owner moved the refactors to M13 and asked for this block first. The design is `docs/superpowers/specs/2026-10-29-game-names-design.md` and the plan `docs/superpowers/plans/2026-10-29-game-names-issue-123.md`.
- **Built:**
  - `src/lib/words.js`: the English helpers, from `describe.js` and `results.js`. It adds `countWords` for nouns that are not ids, which replaces the map's and the log's own counting.
  - `src/lib/game-names.js`: one function per game name, from `describe.js` and `ui.js`. Three are new: `tapestryCardOf` (the engine's `tapestryCard`, so the trap copies are mapped in one place), `civilizationOf` (the one "Setting up") and `achievementName` (the strip's short names).
  - `ui.js`'s `TRACKS` and `RESOURCES` take their names from it.
  - Gone: the six list joins, the second `article` and title case, six landmark maps, two building maps, four trap regexes, two achievement maps, three numeral lists, every `Seat N` and `Player N` fallback, and the map's second `hexName`. `describe.js` exports no names.
- **Calls to revisit** (my calls):
  - A seat without a name is "Player N" and no seat is "a player". The log and the prompts used to say "Seat N", "A player" and "another player".
  - The one hex name is "hex 2,−1", capitalized at the start of the map's label and the explore line.
  - The standings say "Setting up" for a player without a civilization, as the header does, instead of nothing.
  - None of these shows in a real game, so nothing on screen changes.
- **Tests:** test-first. `tests/client-words.test.mjs` and `tests/client-game-names.test.mjs` are new. The second checks all 33 catalog landmarks and every card's name, and holds a source guard against copies; `TierPrice`'s own price words are its one allowed copy, until #124's remainder. The name tests moved there from `client-describe`, `client-results` and `ui.test.mjs`.
  - `npm run check` is clean, and all 1984 unit tests pass.
  - All 43 browser tests passed on the branch's own dev servers (ports 3021 and 5174, since the main checkout's dev server held 3020 and 5173). The dice tray's conquest test failed once and passed five times in a row on a rerun. It plays random moves through the API, which this issue doesn't touch.
- **Handed off:**
  - #126 splits what is left of `describe.js`.
  - #127 reads `ui.js`'s id lists from the engine.
  - #124 and #125 finish the price and player-area words with `amountWords` and `nounOf`, `TierPrice` included.
  - #101 names the versions and expansions.
  - #31 names the Automa's seat through `seatName`.

### #127 (the track, resource and building lists from the engine)

Built on 2026-10-29, right after #123. The design is `docs/superpowers/specs/2026-10-29-engine-lists-design.md` and the plan `docs/superpowers/plans/2026-10-29-engine-lists-issue-127.md`.
- **Built:**
  - The client reads the engine's `TRACK_IDS` and `BUILDING_IDS` in `ui.js`, `prompts.js`, `glyphs.js`, `describe.js`, `area/players.js`, `board.js` and `hotkeys.js`; `board.js` takes its tiers from `TIER_COSTS`.
  - `ui.js` exports `RESOURCE_ORDER`, the one screen order of the resources. `prompts.js`, `glyphs.js`, `prompt-state.svelte.js`, `IncomeNotice` and two library sections use it. `describe.js` uses the engine's `RESOURCE_IDS`, since it only asks whether something is a resource.
  - `ui.js`'s `TrackId` and `ResourceId` are the engine's types.
  - `hotkeys.js` exports `TAB_KEYS`, and `shortcuts.js` builds its track line and its player-area group from the hotkeys' own keys, with the same words as before.
- **Calls to revisit** (my calls):
  - The screens keep listing food before workers, unlike the engine (01 §1.2). Changing that would change the interface.
  - Library fixtures that draw a mockup's tracks stay hand-written, since they are samples.
- **Tests:** test-first. The new `tests/client-id-lists.test.mjs` checks:
  - the lists against the engine;
  - every engine track's name, art symbol, tint token, board track and player-card place;
  - a source guard against hand-written track, resource and building lists.

  `client-shortcuts` takes its expected keys from `TRACK_KEYS` and `TAB_KEYS`.
  - `npm run check` is clean, and all 1989 unit tests pass.
  - All 43 browser tests pass on the branch's own servers.
  - `hotkeys.test.mjs` failed twice and then passed 6 times in a row. It is an old flake, not this change: its setup takes the first civilization offered, and a Futurists deal starts the player on space 4, so pressing 1 selects Ships instead of opening Scouting's payment.
- **Handed off:**
  - #35 adds `arts` to the engine's `TRACK_IDS`; the new test then asks for its name, symbol and tint.
  - #120 lays the board out for any number of tracks.
  - The hotkeys test's civilization pick is worth a small fix.

### #126 (describe.js split into effect words, decision words and card text)

Built on 2026-10-29, after #123 and #127. The owner had made #31 and #32 wait for it the same day. The design is `docs/superpowers/specs/2026-10-29-describe-split-design.md` and the plan `docs/superpowers/plans/2026-10-29-describe-split-issue-126.md`.
- **Built:**
  - `describe.js` (679 lines, from 1,391) keeps the effect, cost, bonus and payment words.
  - `src/lib/decision-words.js` takes `decisionTitle`, `describeAnswer` and `PROPHECIES`, with the helpers only they use: `whose`, the capital plot names, the tech card lookup and the fallback answer.
  - `src/lib/cards/tapestry-text.js` takes the 33 tapestry card texts and `describeTapestryCard`. `civ-rules.js` moved beside it, into `src/lib/cards/`.
  - `describe.js` exports the five pieces the decision words build on: `effectsPhrase`, `effectPhrase`, `paymentVerbs`, `amounts` and `describeTurn`.
  - `prompts.js`, `picks.js`, `log.js`, `cards/game-cards.js`, `area/players.js` and the PlayerChip section import from the new places.
- **Calls to revisit** (my calls):
  - `isRecord` and `isCount` stay as small local copies in each module, as in `log.js`, `prompts.js` and `glyphs.js`.
  - The tapestry text keeps its own "Take this effect" for an unknown card. Its test checks it against `describe.js`'s words for an unknown effect.
- **Tests:**
  - `client-describe` split into three files: it keeps the effect words, and the new `client-decision-words` and `client-tapestry-text` take the rest. The one test that mixed decision and effect fallbacks split in two.
  - A new test pins `describe.js`'s exports.
  - `assertReadable` moved to `tests/helpers/readable.mjs`.
  - `npm run check` is clean, all 1991 unit tests pass, and all 43 browser tests pass on the branch's own servers.
- **Handed off:**
  - #60 edits the effect phrases in `describe.js` and the titles in `decision-words.js`.
  - #129 builds its table beside `decision-words.js`.
  - #108 builds the tapestry cards from `cards/tapestry-text.js`.
  - #31 and #32–#41 add their decision kinds to `decision-words.js`.

### #129 (each decision kind's client facts in one table)

Built on 2026-10-29, the last of M13's unblocked Words and names issues, after #126. The design is `docs/superpowers/specs/2026-10-29-decision-kinds-design.md` and the plan `docs/superpowers/plans/2026-10-29-decision-kinds-issue-129.md`.
- **Built:**
  - `src/lib/decision-kinds.js` holds `DECISION_KINDS`: one entry for each of the engine's 38 kinds, with the facts it has (shelf, tab, Confirm words, art shape). `kindFacts(kind)` returns all four, null where a kind has none. `ART_SHAPES` lists the 13 art shapes.
  - In `prompts.js`, `SHELVES`, `CONFIRM_LABELS`, `TRACK_ANSWERS` and the two kind switches are gone:
    - `placeOf` reads the shelf;
    - `artOf` draws a shelf answer from its shelf, and any other answer through one maker per shape, in a map typed by `ArtShape`, so `npm run check` fails on a shape without a maker.
  - `area/tabs.js`'s `TAB_OF` is gone: `tabFor` reads the table, and the Nomads' map-only placement stays its one exception.
  - A new decision kind (#31, #32–#41) is one table entry, plus its title and answer words in `decision-words.js`.
- **Calls to revisit** (my calls):
  - The titles and answer words stay in `decision-words.js`, where #60 edits them, and are not in the table.
  - Kinds share art shapes, rather than each kind having its own art function.
- **Tests:** test-first. The new `tests/client-decision-kinds.test.mjs` checks:
  - the table against the engine's `DECISIONS`;
  - that every fact is a known one;
  - that every engine kind has its own `TITLES` and `ANSWERS` entry in `decision-words.js`, read from the source, so the answers are checked now too;
  - a guard against per-kind maps elsewhere.

  `npm run check` is clean, all 1997 unit tests pass, and all 43 browser tests pass on the branch's own servers.
- **Handed off:**
  - #31 and #32–#41 add their kinds to `DECISION_KINDS`; the new test fails until they do.
  - #31's blockers are now all closed.

### #88 (the game's keys and Escape through one layer state)

Built on 2026-10-29, when the owner chose it as the M13 refactor that fixes a bug players hit. The design is `docs/superpowers/specs/2026-10-29-layers-design.md` and the plan `docs/superpowers/plans/2026-10-29-layers-issue-88.md`.
- **The bug:** **I**, then **L**, then **Esc** closed both the log and the footer's question, because `LogPanel` and `Game.svelte` each listened for Escape on the window. Now one Escape closes one thing.
- **Built:**
  - `src/lib/layers.js` holds what is open over the game screen: How to play, Table settings, the overview and its player, the log, and the footer's question.
    - `openLayer` writes the opening rules once. How to play, Table settings and the overview open alone; the log closes only the overview; a question closes the overview.
    - `escapeLayer` names the one thing Escape closes, from the top down, with the first-income notice last.
  - `hotkeyGate` in `hotkeys.js` decides whether the screen takes a key, from facts about it: a modifier, a component, a field, a menu, a modal, or Enter on a control.
  - `Game.svelte`:
    - one `layers` state replaces seven booleans;
    - the menu, the hotkeys, the chips and the log button all go through `openLayer`;
    - no document query or `.rg-income-notice` lookup decides a key any more;
    - `hotkeyAction`'s dead `cancel` is gone.
  - `LogPanel`'s window listener is gone.
  - The first-income notice's flag goes through the store's new optional `session` storage. App passes `safeStorage(() => sessionStorage)`; `forgetfulStorage()` is the default.
- **Calls to revisit** (my calls):
  - **L** with the overview open now shows the log. Before, the log opened unseen under the overview.
  - **I** or **A** with the overview open closes it, so the question shows.
  - Escape now closes the notice even when the focus is in a decision panel, since a decision panel has no Escape of its own.
- **Tests:** test-first.
  - The new `tests/client-layers.test.mjs` walks every combination reachable by opening layers in any order, with and without the notice, and checks that each Escape closes exactly one thing.
  - `client-hotkeys` covers `hotkeyGate`, and `client-storage` covers `forgetfulStorage`.
  - The hotkeys browser test now presses I, L, Esc, Esc. Its setup no longer takes the Futurists, which fixes the flake #127's entry noted. It and the rules-panel and dialogs tests passed 5 times in a row.
  - `npm run check` is clean, all 2009 unit tests pass, and all 43 browser tests pass on the branch's own servers.
- **Handed off:** #62 (End turn) and #35 (the arts track's key) add their keys through `hotkeyAction`, and a layer where they open something.

### #101 (rules versions, expansions and variants named in one place)

Built on 2026-10-29, among the refactors #32 waits for. The design is `docs/superpowers/specs/2026-10-29-version-names-design.md` and the plan `docs/superpowers/plans/2026-10-29-version-names-issue-101.md`.
- **The owner's wording:** the rules versions are "Current rules" and "Original 2019 rules" everywhere, the lobby's mockup words. The settings row keeps "Original 2019" (owner, 2026-10-29). Before, the results said "Current official rules", and the log mixed the two sets.
- **Built:**
  - `versionName`, `expansionName` and `variantName` in `game-names.js`, `expansionColor` in `ui.js`, and `expansionBadges` in `lobby.js`.
  - The lobby, the landing page, the log, the results, `CivilizationCard`, the card gallery's `CardEntry` and the library use them. `rulesLabel`, `VARIANT_LABELS`, the two `RULES` maps and the copied `EXPANSIONS.find` lookups are gone.
  - The results draw each expansion badge in its own colour, not gold.
  - `OpenTableRow` takes `expansions: { name, color }[]`, and the landing page now passes each open table's expansions.
  - `npm run check` caught a real bug while this was built: `.map(variantName)` would have passed the index as the fallback.
- **Calls to revisit** (my calls):
  - Several badges stack under the rules line, as the one badge did. The library's OpenTableRow section has a new example with two expansions, for the owner to check.
  - The log keeps the names' capitals ("under the Current rules"), while the results' tie sentence lowercases them ("Under the current rules").
- **Screens:** `docs/ui/screens/game-results.png` was retaken from a real three-player hot-seat game with the tapestry draft, so its facts list says "Current rules".
- **Tests:**
  - `client-game-names` gains the three names and a guard against the old lookups.
  - `ui.test` checks each expansion colour's token, and `client-results` the badges' colours.
  - `client-log` and `client-results` take the owner's wording, and `client-lobby`'s naming tests moved to `client-game-names`.
  - `npm run check` is clean, all 2012 unit tests pass, and all 43 browser tests pass on the branch's own servers.
- **Handed off:**
  - #109's edition chips use `expansionName` and `expansionColor`.
  - #32 is the first expansion to show them.

## Card-design handoff (2026-10-24, Refs #3 #47)

Before generating or modifying cards, read `docs/ui/card-design-rules.md`; its colours are tokens in `src/styles/`. The root `DESIGN.md` that repeated them was removed (owner, 2026-10-27). The Style B frame is now **425 px**, with natural height, 160 px full portraits, square placement targets capped at 75 px, and native 24/48 resource assets with no circles. All fourteen reviewed civilization recipes use the shared Svelte card components. Four more, the Futurists, Heralds, Nomads and The Chosen, complete the 16 base civilizations and await the owner's review (2026-10-27). Every base civilization, tapestry and tech card's text was then checked against the engine: the cards say what the engine does, each current-rules adjustment is on its card, the Entertainers' links come from `entertainersMoves`, and the Leaders show no Arts space (only the out-of-scope Revised pack adds one). The review route is built and deployable; the component library exposes each primitive. Shaded player tokens replace the flat colour variants, and the five approved terrain hex markers now ship as reproducible assets.

This completes the civilization-frame/pattern portion of #47, not every card family, all 41 rules read-models or in-game reference access. It contributes civilization-detail UI to #3; broader decisions, income flow and results remain open. Original-mat fixtures are explicitly labelled. Do not mistake these layout fixtures for current-edition engine data.
