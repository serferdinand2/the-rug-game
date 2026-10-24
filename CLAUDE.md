# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

The Rug Game is a browser version of Stonemaier Games' **Tapestry**, with every official expansion. It keeps Tapestry's original theme: civilizations advancing through eras on the exploration, science, technology and military tracks, plus arts with Arts & Architecture.

The owner wants it to:
- use the same setup and approach as their games Fablewood Rummy and Bird Table;
- look like those games;
- meet the same goals: online tables, hot-seat play and solo play.

**Before writing any code, read [CONVENTIONS.md](CONVENTIONS.md).** It has the coding conventions: JavaScript with JSDoc (no TypeScript), Svelte 5 component structure, BEM classes with the `rg-` prefix, handler and callback naming, `ComponentEvent`, engine rules, tests and commits. The quick checklist is repeated at the end of this file.

`README.md` is the public overview. [docs/superpowers/specs/2026-10-20-the-rug-game-design.md](docs/superpowers/specs/2026-10-20-the-rug-game-design.md) is the full design document: decisions, scope and the 43-issue build plan.

## Commands

```sh
npm install                   # dev tools only (Svelte, Vite, svelte-check, Prettier); there are no runtime packages
npm start                     # builds the client, then serves http://127.0.0.1:3020; loads .env if present
npm run dev                   # Vite dev server with hot reload (http://127.0.0.1:5173, the library at /components.html) plus node --watch server.mjs
npm run build                 # Vite builds index.html and src/ into public/
npm run serve                 # serves an existing build without rebuilding (for hosts without dev tools)
npm test                      # builds, then runs every test in tests/
npm run check                 # svelte-check: JSDoc types in src/ and art/, must report 0 errors and 0 warnings
npm run format                # Prettier (tabs, single quotes); Markdown is left alone
npm run art                   # draws every art/drawings/<id>.js into static/art/<id>.svg (the art is reviewed in the component library)
node --test tests/static.test.mjs                        # one test file (run npm run build first)
node --test --test-name-pattern="ETag" tests/*.test.mjs  # tests whose name matches
```

GitHub Actions runs `npm ci`, `npm run check` and `npm test` on every push.

## Architecture

- `server.mjs` is the `node:http` server.
  - It exports `server` and `config` and only calls `listen()` when run directly, so tests start it in-process on port 0.
  - It serves files only from `public/`, resolving decoded paths and refusing anything outside the folder.
  - Vite's hashed bundles in `assets/` are cached for a year (`immutable`), and `fonts/` and `art/` for a week. Everything else, including the page, gets `no-cache` with a weak ETag, so a new deploy is picked up at once.
  - `/api/*` requests pass a per-address rate limiter (1,800 a minute). The table API arrives in #22–#23.
- `limits.mjs` holds `rateLimiter()` and `clientAddress()`. With `TRUST_PROXY=true`, the last `X-Forwarded-For` address counts; otherwise the header is ignored.
- **Client.** The browser interface is **Svelte 5** with runes forced on (5.57.2), built by **Vite** (8.3.4), without SvelteKit. The project root is Vite's root, laid out like the owner's other Svelte projects (owner, 2026-10-21). The full layout is in CONVENTIONS.md.
  - `index.html` is the game page. `src/main.js` mounts `src/App.svelte`, which is the placeholder page until #25.
  - `components.html` is the component library page (#48). `src/library/main.js` mounts `src/library/Library.svelte`, which collects every `src/library/sections/<area>/<Name>.svelte` and shows each component in all its states. `src/lib/components/README.md` indexes the components.
  - `src/lib/` holds everything the app shares:
    - `components/<area>/` holds the Svelte components, grouped by area;
    - `component-event.js` holds `ComponentEvent`;
    - `ui.js` holds the shared interface ids (tracks, resources, terrain, seats) and turns them into token references;
    - `capital.js` holds the capital-grid geometry the interface needs: footprint rotation, legal positions and completed groups;
    - `art/catalog.js` lists all 413 assets with stable `<group>/<slug>` ids. It imports nothing, so the app and the engine can load it;
    - `art/footprints.js` holds the 33 landmark footprints. A landmark's picture is drawn in its footprint's shape at 32 pixels per plot, and the art build refuses one that covers the wrong plots. The rules engine must reuse this module;
    - `engine/` holds the rules engine, shared by the server and the app. It imports only relative paths: no DOM, Svelte or Node. Its `data/` folder holds the base-game data (#12), plain frozen modules: `ids.js` (versions with their tiebreak chains, and the track, resource, building and terrain ids), `effects.js` (the effect vocabulary), `tracks.js`, `income-mat.js`, `capitals.js`, `maps.js`, `territory-tiles.js`, `space-tiles.js`, `landmarks.js`, `achievements.js` and `dice.js`. Every benefit is a list of one-key effects such as `{ gain: { any: 1 } }`, explained in `docs/superpowers/specs/2026-10-24-base-game-data-design.md`.
    - The engine core (#13) sits beside `data/`. `game.js` is the entry point and exports `createGame`, `play`, `view` and `PlayerError`. The pending decisions live on an operation stack (`stack.js`, run by `loop.js`), where a group gives each player a lane so they decide at the same time. `kinds.js` registers the decision kinds (`decisions/`, each with its hidden fields, legal `answers()`, `check()` and `resolve()`) and the automatic kinds. The effect handlers live in `effects/index.js` (`EFFECTS`); each gets its operation, with the `source` space, as a fourth argument. Advance turns (#14) add `turn.js` (`startTurn`, `endTurn`), `payment.js` (paying costs and discards), `movement.js` (moving tokens, the landmark race, once-per-turn activations, `spacesAdvanced`) and `control.js` (`controlledTerritories`, for #17 to reuse). The design is `docs/superpowers/specs/2026-10-24-advance-turns-design.md`. Income turns (#15) add `income.js` (`INCOME_STEPS`, exposed spaces, `neighbours`) and `ranking.js` (`rankPlayers`, `landmarksInCity`); their design is `docs/superpowers/specs/2026-10-24-income-turns-design.md`. The setup steps are `SETUP_STEPS` in `setup.js` and `AFTER_SETUP_STEPS` in `after-setup.js`. `play.js` answers a decision. `state.js` holds the state types and the seat lookups. `events.js` numbers the events. `random.js` holds the injected randomness and the shuffle. `decks.js` lists the base decks. `errors.js` holds `PlayerError`. `view.js` is the only way state leaves the server. The design is `docs/superpowers/specs/2026-10-24-engine-core-design.md`.
  - `src/styles/` holds `tokens.css`, `base.css` and `pixel-noise.svg`:
    - `tokens.css` is the single source of truth for colours, the texture, type, spacing, layout sizes, borders, shadows, motion and layers;
    - `base.css` has the `@font-face` rules, the page and the focus outline;
    - `pixel-noise.svg` is the surface texture, a 256×256 tile cropped from `docs/ui/assets/middle-pixel-noise.svg`, which Vite hashes into `assets/`.
  - `static/` is copied into the build as is: `fonts/` (Cinzel and Atkinson Hyperlegible, with their licences), `art/` (the drawn SVGs) and `favicon.svg`.
  - `public/` is the build output that `server.mjs` serves. It is git-ignored; never edit it.
  - `scripts/dev.mjs` runs the Node server and Vite side by side. Vite proxies `/api` to the server.
  - The configuration lives in `vite.config.js`, `svelte.config.js` (`runes: true`), `jsconfig.json` (`checkJs`, `strict`, Vite client types), `.prettierrc` and `.prettierignore`.
- `art/` is the art drawing toolkit (#4), a build-time tool. See `docs/art/README.md`.
  - `painter.js`, `palette.js` and `parts/` draw style C pixel art. `drawings/<id>.js` holds one module per drawn asset.
  - It reads the asset ids and footprints from `src/lib/art/`.
  - `gallery.js` holds the scene-part samples, the grouping the owner reviews art in, and the check every drawing must pass. It has no Node APIs, so the library page runs it in the browser.
  - `npm run art` writes the SVGs into `static/art/`, which are committed. Tests fail when a committed SVG is out of date.
  - The art is reviewed in the **Art** part of the component library (`/components.html`): every scene part, and every asset in the catalog, drawn or as an empty slot naming its issue, with landmarks under their plot grid. It draws straight from the toolkit, so with `npm run dev` a changed drawing shows at once. It replaced the standalone `art/preview/index.html` gallery (owner, 2026-10-21).
- `tests/` holds `node:test` suites. Server tests import `server` and listen on port 0, so they never need fixed ports.

## Where the work stands

The six full capital mat SVGs are examples only. Actual capital mats must be generated from the reusable terrain tiles for each game, following the game setup and the rules-defined plot layout.

**#5 is complete (owner approval, 2026-10-23).** The reviewed resources, four income buildings, five track symbols, neutral player pieces and all five player-color variants are committed as reproducible SVGs. The associated 84 capital terrain tiles and six example mat compositions contribute to #6, which remains open. See `docs/art/issue-5.md` for the inventory and the decision to render dice faces and game symbols through text or draw them later with the map's terrain hex markers. The full former mockup is frozen in `docs/art/archive/2026-10-23-issue-5/`; placeholder dice, terrain hex marker and game-symbol drawings are archived only.

Updated 2026-10-24. Update this section whenever a milestone moves.

- **Done:**
  - Rules research (`docs/research/`).
  - The approved design document.
  - The phase-one desktop UI/UX manifest and interactive launch, lobby, play and player-overview mockups (`docs/ui/README.md`, 2026-10-21).
  - The production styles that follow it: `tokens.css` and `base.css`, with self-hosted Cinzel and Atkinson Hyperlegible (2026-10-21).
  - The component library (#48, 2026-10-21): 34 components in `src/lib/components/`, each shown in all its states on `/components.html`, which also holds the art. Several components show placeholders until their art lands; `src/lib/components/README.md` lists them. The owner closed #48 on 2026-10-21, ahead of its blocker #3.
  - The approved art style C (`docs/art/`).
  - All 43 issues filed in [serferdinand2/the-rug-game](https://github.com/serferdinand2/the-rug-game/issues).
- **#1, #2, #4, #7, #8, #9, #11, #12, #13, #14, #15, #44, #46, #48 and #52 are done.**
  - The Node server, tests and CI exist.
  - The client is a Svelte 5 app built by Vite. The page is a placeholder until #25.
  - Every unverified rule detail is decided in the README's "Rules conventions" (R1–R105).
- **#4 (art toolkit and asset catalog)** is done. The owner approved the scene parts on 2026-10-21.
- **#7 (landmarks)** is done. All 33 are drawn, each one picture in its footprint's shape, and the owner approved them in the asset gallery (`art/preview/index.html`) on 2026-10-21.
- **#9 (tapestry card pictures)** is done (2026-10-22). All 115 pictures are drawn: 44 base, 13 Plans & Ploys, 20 Arts & Architecture and 38 Fantasies & Futures. The design is `docs/superpowers/specs/2026-10-22-tapestry-cards-design.md` and the plan is `docs/superpowers/plans/2026-10-22-tapestry-cards-issue-9.md`.
  - The owner approved the base pictures, then asked for the other three sets to be finished without stopping for approval and #9 closed. Each set had a fresh review, and its findings were fixed.
  - New toolkit pieces: the scene parts `drawShip` (sails set or furled), `drawInterior`, `drawBanner`, `drawCrowd` and `drawWheel`; `paint` and `line` in `art/painter.js`; `glow` in `art/effects.js`; and the arcane, ghost and teal glow colours in the palette.
  - `tests/art-tapestry.test.mjs` checks that every tapestry picture paints all 4,096 pixels, that no two are identical, and that every card is drawn.
- **#8 (civilization portraits)** is done (2026-10-22). All 41 portraits are drawn: 16 base, 10 Plans & Ploys, 5 Arts & Architecture and 10 Fantasies & Futures. The design is `docs/superpowers/specs/2026-10-22-civilization-portraits-design.md` and the plan is `docs/superpowers/plans/2026-10-22-civilization-portraits-issue-8.md`.
  - The owner asked for them to be drawn like the tapestry pictures, straight through without stopping for approval, by subagents in parallel. The Alchemists came first as the reference; each set then had a fresh review, and its findings were fixed.
  - The palette gained two skin pairs: `skinTan`/`skinTanShade` and `skinDeep`/`skinDeepShade`. There are no new scene parts, so each portrait carries its own small drawing helpers.
  - `tests/art-civ.test.mjs` checks that every portrait paints all 4,096 pixels, that no two are identical, and that every civilization is drawn.
- **#10 (tech card pictures)** is under way (2026-10-22). All 56 cards are drawn: 33 base, 11 Arts & Architecture and 12 Fantasies & Futures. #10 waits for the owner's approval in the component library. The owner asked for the second 10 quickly, by parallel subagents, without a separate fresh review, and for the last 13 "a tiny bit simpler" (one big subject, plain backgrounds, about 40 to 60 colours); the 23 expansion cards follow the simpler rules too. The design is `docs/superpowers/specs/2026-10-22-tech-cards-design.md` and the plan is `docs/superpowers/plans/2026-10-22-tech-cards-issue-10.md`.
  - The owner asked for the same rules as the tapestry pictures and the portraits. Each tech picture shows its invention up close, as the hero of the card.
  - Few buildings (owner): the landmark cards show their invention, not their landmark. Bakery is newly discovered bread, Barn a newborn calf in straw, and Com Tower a dish antenna close up. Library, Stock Market and Treasury will do the same.
  - Clocks was drawn first as the reference; subagents drew the other nine side by side, and a fresh review followed.
  - `tests/art-tech.test.mjs` checks full bleed, no twins, and that every card of every set is drawn.
- **#11 (masterpieces, landmark cards, space and inspiration tiles)** is done (2026-10-24). All 20 masterpieces, 10 landmark cards, 4 inspiration tiles and 19 space tiles are drawn. The owner asked for #11 to be finished and pushed to main, so it closed without a separate approval, as #9 did; the owner can still ask for changes in the component library.
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
    - `art/parts/inspiration-tile.js` draws the shared frame, ground and sparkle. `tests/art-inspiration-tile.test.mjs` checks the size, full bleed, the frames, that each innovation fills its space, no twin spaces, and that all 4 are drawn.
  - **Space tiles.** The design is `docs/superpowers/specs/2026-10-24-space-tiles-design.md`.
    - The owner asked for #11 to be finished and pushed to main, read as the earlier #11 pictures' rules and process: 64×64 full bleed, 7/10 on detail, parallel subagents and a fresh review.
    - Each of the 19 is a space scene that hints at its tile's benefit: a space telescope for science, a gold asteroid for coin and worker, a black hole for 13 VP. The benefits are not drawn. The hero stays out of the corners, so a hexagonal frame can trim them.
    - `tests/art-space-tile.test.mjs` checks full bleed, no twins, and that all 19 are drawn.
- **#12 (base game data)** is done (2026-10-24). It is the first rules-engine issue. The design is `docs/superpowers/specs/2026-10-24-base-game-data-design.md`.
  - `src/lib/engine/data/` holds the 48 track spaces with their tier costs and `advanceCost()`, the income mat's 24 spaces and 4 tapestry slots, the 6 capital mats with their start hexes, both map sides (61 and 34 hexes, 25 and 13 printed territories), the 48 territory tiles, the 15 space tiles, the 18 base landmarks with R12's height ranking of all 33, the 3 achievements and the 3 dice.
  - Effects are data: a benefit is a list of one-key effects, taken in any order unless `ordered`, and a bonus is `{ pay, gain }`. The design lists the 19 effect kinds and the VP counters; #13–#20 interpret them.
  - Both versions share the board data (R1, R5); `VERSIONS` holds each version's tiebreak chain (R10, R11), and only the current one uses the height ranking.
  - Landmark footprints come from `src/lib/art/footprints.js`, and the grid size and plot numbering from `src/lib/capital.js`. The ids match `src/lib/ui.js` and the asset catalog.
  - The research has no side-to-neighbour mapping for hexes, so `HEX_SIDES` in `maps.js` is read from BGA's explore-scoring code, as are the small-map orientations (all 0 except `0_3`, turned 2). The tiles, printed territories, orientations and mat grids were cross-checked against BGA's `material.inc.php` and 01 §6.2 with no differences.
  - `tests/engine-data.test.mjs` checks every count, spot values from the research, that every effect has one known kind, that the data is frozen, and that engine modules import only relative paths.
- **#13 (rules engine core)** is done (2026-10-24). The design is `docs/superpowers/specs/2026-10-24-engine-core-design.md`.
  - `createGame()` sets up 1-5 players in either version, and `play()` answers one decision and returns a new state. Setup picks are simultaneous and secret until the reveal.
  - `view(state, seat)` hides the decks, other seats' hands and picks, hidden decision fields and event secrets, and adds `answers` to the viewer's own open decisions. `tests/engine-view.test.mjs` plays random setups for 1-5 players and checks every seat's view after each step.
- **#14 (advance turns)** is done (2026-10-24). The design is `docs/superpowers/specs/2026-10-24-advance-turns-design.md` and the plan is `docs/superpowers/plans/2026-10-24-advance-turns-issue-14.md`.
  - A player who has taken income turn 1 may advance when they can pay for some advance. They pay the tier cost, move one token one space, gain the tier's landmark if first (R9), then take the benefit and may pay the bonus. `chooseAdvance` answers the track, the token and the payment in one go.
  - Research, Physics, Quantum Physics, Neuroscience, Academic Research, AI Singularity, the "or" choices, the VP counters, bonuses and gaining income buildings are built. A track space is activated at most once per player per turn (R19).
  - An unordered benefit runs its plain gains first, then any VP counter that no other part could change; when two or more parts whose order can matter remain, `chooseOrder` lets the player pick (Electronics, Nanotechnology, Cavalry, Mechs, Nuclear Bomb, and some space tiles for #17).
  - The final review found two problems, both fixed with tests: VP counters ran too early, and an after-setup step placed after `'start'` would never run (it now throws). #54 asks the owner whether Alien Biology scores on a track whose token AI Singularity took off; the engine scores it until then.
  - The rest is handed off by name, and each issue lists it: placing buildings and landmarks and `scoreCapital` (#16); `explore`, `exploreSpace` (R105's `fromGained`), `conquer`, `tileBenefit` (#17); `invent`, `upgrade`, `techBenefit` (#18); `tapestryOnTop` and the track achievement (#19); `gainCiv` (#20). Until then they throw an `Error` naming themselves. Tests stand in for them with `stubHandoffs()` in `tests/helpers/engine.mjs`.
  - `tests/engine-track-spaces.test.mjs` reaches each of the 48 spaces by a real advance turn.
- **#15 (income turns, eras and the game end)** is done (2026-10-24). The design is `docs/superpowers/specs/2026-10-24-income-turns-design.md` and the plan is `docs/superpowers/plans/2026-10-24-income-turns-issue-15.md`.
  - Answering `chooseTurn` with income runs that income turn's steps from `INCOME_STEPS`, a list later issues insert into: civilization abilities (#20), the first-of-neighbours bonus and the era's tapestry card, the optional upgrade (#18), scoring, income, and finishing after income turn 5.
  - With an empty hand the top card goes on face down: the state keeps its id in `incomeMat.faceDown`, and `view()` hides it from everyone, its owner included.
  - A finished player is skipped and gains nothing but passive civilization VP: `runEffects` skips their effects unless the operation is `passive` (#20 marks its passive VP).
  - When every seat has finished, `rankPlayers` ranks them by VP and the version's tiebreak chain, and `state.result` records every tiebreak step used, with each compared player's value (owner). Shared places count 1, 1, 3. The tallest-landmark step reads `seat.capital.landmarks`, which #16 fills.
  - `tests/engine-scripted-game.test.mjs` plays a 2-player game from setup to the end.
- **Decided 2026-10-24:**
  - At the game end, players see each tiebreaker used, step by step (owner, #15).
  - R105: Interstellar Travel's "explore 1 of them" means one of the 3 space tiles it just gained, as printed; BGA's reading (any tile in hand) is rejected (owner, #52).
  - The owner asked for the issues to be reorganized before #14: #14–#20 now name the effects each one builds.
- **Decided 2026-10-23:**
  - Civilization cards use option B · Civilization mat from `docs/ui/collectors-card-options.html` (owner). It is 456 px wide, so it fits the Civilization tab. One component filled from data will draw all 41 civilizations, under #47; the owner asked for it ahead of #47's blocker #3.
  - The tracks backdrop, the income mat with its F&F overlay and the table background are cosmetic enhancements (owner). They moved from #6 to #51, in the new milestone M12 · Cosmetic enhancements, and are drawn after the core features. `COSMETIC_BOARDS` in `src/lib/art/catalog.js` gives them issue 51, so the library names it on their empty slots.
- **Decided 2026-10-22:**
  - Pictures may show real religious and political signs, flags and emblems, but no likeness of a real person and no lettering (owner).
  - Pictures may also show explicit material where the subject calls for it: blood, wounds, drawn weapons, skulls, drink, smoke, gambling, the occult, and bare skin where the subject has it (owner, #8).
- **Decided 2026-10-21:**
  - There is no phone layout.
  - The card gallery doubles as the in-game card reference (#47).
  - A components library page is #48.
  - #47 waits for #3's new `base.css`, `tokens.css` and `docs/ui/`. All three are in now; its GitHub blockers still decide when it starts. #48 is done.
  - The lobby's **Add bot** seat control is shelved (owner).
  - The asset gallery is part of the component library now, in its Art area (owner).
  - Cloud Colonies is back (owner). R77 lists the territories that show clouds, read from BGA's tile and board images, and #49 adds the card. The territory-tile and map art (#6) must show clouds on exactly those territories.
  - The owner-check rules are settled by Board Game Arena for now, not the physical box (owner). 17 are marked **BGA** in the README's "Rules conventions"; R28 and R40 were corrected to match BGA, and R66 now gives the track order from BGA's board images, so Twin Impact is in. R12 and R39 stay owner-check, because BGA has no data for them.
- **Next:**
  - Ready now, each blocked only by #13, which is done: #16 Implement capital city placement and district rewards; #17 Implement exploring and conquering on the map; #18 Implement tech cards: inventing and upgrading.
  - #54 Decide whether Alien Biology scores on a track AI Singularity emptied. The owner decides; it blocks nothing.
  - #45 Check R12 (landmark heights) and R39 (decision-card arrows) against the physical box. This is the owner's job, and it blocks nothing.
  - #3 Design the remaining screens (assigned to lazar-milin). Phase one is handed off in `docs/ui/README.md`; income, further decisions, results and the listed setup/details gaps remain. The production `tokens.css` and `base.css` now follow it, but #3 stays open.
  - #10 The owner reviews all 56 tech pictures, then #10 closes.
  - #6 Finish the remaining map, territory-tile and expansion capital art. The cosmetic boards wait in #51 until the core features are done.
- **Everything else is blocked** until earlier issues close (see "Working on issues").

## Starting on a new computer

1. Clone `https://github.com/serferdinand2/the-rug-game` and run `gh auth login` with your own GitHub account. The owner (serferdinand2) must have added you as a collaborator before you can push, comment or close issues.
2. Install Node.js 22.12 or newer (Vite 8 needs it), then run `npm install`, `npm test` and `npm start` (see Commands).
3. Optionally clone the sibling projects next to this repository, read-only, to copy their setup. All are public:
   - [lazar-milin/fablewood-rummy](https://github.com/lazar-milin/fablewood-rummy) is the closest template.
   - [lazar-milin/birdcard-ripoff](https://github.com/lazar-milin/birdcard-ripoff) is Bird Table.
   - [lazar-milin/bugtile-ripoff](https://github.com/lazar-milin/bugtile-ripoff) is BugTile.

   Never modify them from this project.
4. These things are not in the repository and don't need to be:
   - the research source PDFs, which are copyrighted (each research file lists its source URLs);
   - the brainstorming companion's session files (`.superpowers/`, ignored);
   - the previous agent's local memory. Everything that matters is in this file and `docs/`.

## Working on issues

- **Order.** Work milestone by milestone, M0 to M12, as shown by the `M… · …` labels and milestones.
  - Before starting an issue, check its blockers. Never start a blocked issue.
  - On GitHub, the blockers are under **Relationships → Blocked by**, and each blocked issue also has a "Blocked by" comment.
  - From the command line: `gh api repos/serferdinand2/the-rug-game/issues/<n>/dependencies/blocked_by --jq '.[] | "\(.number) \(.state) \(.title)"'`.
  - An issue is ready when every blocker is `closed`.
- **Pace.** The owner works issue by issue. Plan each issue before coding: break it into steps, then build it test-first. Reference the issue number in commits and pull requests, as in "Fix #12: …" or "Refs #9: …", and close the issue only when its checklist is done.
- **New issues** use the layout of the existing ones:
  - **Issue** (with an **Example**);
  - **Current problem** (only if something is wrong today);
  - **Proposed solution** (with a checkbox list);
  - **Related issues**.

  Give each one a type label (`enhancement`, `bug` or `documentation`), its milestone, and the matching `M… · …` label. If it depends on other issues, add a blocked-by link with `gh api -X POST repos/serferdinand2/the-rug-game/issues/<n>/dependencies/blocked_by -F issue_id=<database id of the blocker>`, plus a "Blocked by" comment. The database id comes from `gh api repos/serferdinand2/the-rug-game/issues/<blocker> --jq .id`. GitHub sometimes answers 5xx on this endpoint; retrying works.
- **Owner approvals.** The owner approves anything visual before it is built:
  - Show interface ideas as clickable HTML mockups with screenshots, not descriptions.
  - The owner approves each art batch in the Art part of the component library (`/components.html`).
  - Keep asking for decisions that change what gets built, and record each answer in the design document.

## The README always shows the current interface

The owner's standing rule: whenever the interface changes, `README.md` must show the newest version in the same commit. This applies both to an approved mockup and to a built screen.

- Screenshots live in `docs/ui/screens/`. Replace them, and update the "Current interface" section and `docs/ui/README.md`.
- The current references are the hand-edited `docs/ui/launch.html`, `lobby.html` and `main-screen.html`. Open them directly or run `node docs/ui/preview.mjs` and capture at 1920×1080. The superseded generator and PNGs live in `docs/ui/archivedpngmockups/`; never use that generator to overwrite the current play reference.
- Once the game exists, take the screenshots from the running game instead of the mockups.

## Decisions already made

The design document has the details. In short:
- **Tables.**
  - Online (table code), hot-seat and solo modes, for 1–5 players.
  - The creator of a table chooses its expansions and its version: the original 2019 printing, or the current official rules with all errata and adjustments.
  - The 2024 Revised Civilization Pack is out of scope.
  - A player who leaves keeps an "away" seat, as in Bird Table.
- **Bots.** The only bots are the official Automa and Shadow Empire, exactly as in the real game. There are no bot seats in multiplayer and no bot takeover of a seat. The lobby mockup's **Add bot** seat control is shelved (owner, 2026-10-21): don't build it.
- **Art.**
  - Style C: 64×64 pixel-art scenes in card frames, drawn as vector SVG with one `crispEdges` path per colour. The reference is `docs/art/style-c/lighthouse-scene.svg`.
  - Small pieces, such as resources, buildings, outposts, dice and terrain, are simple icons in the same palette.
  - Each landmark is one picture drawn in its footprint's shape, shown on its card and on the capital grid.
  - The order is to design the interface first, then show every asset in a gallery page, then build the game.
- **Interface.** Phase one supersedes the earlier five-tab centre layout: full-width header and turn footer, a 3/4 shared Tracks/World Map region, and a 1/4 player-tab region. The header opens a player overview with the same 3/4 + 1/4 split. Follow `docs/ui/README.md`, including its documented prototype limitations.
  - Tracks is the default shared view. Tier prices sit above groups of three pointed tiles; colour-coded progress lanes sit below. The Ships example demonstrates selecting, committing and resolving an optional action in the footer.
  - The view switches by itself when a choice needs another tab.
  - There is no phone layout. The game is for desktop screens only (owner, 2026-10-21).
  - See `docs/ui/README.md`.
- **Client framework.** Svelte 5 (runes) and Vite for the browser only, written in JavaScript with JSDoc. SvelteKit adds nothing for a single game screen behind a custom long-poll server. The server and the rules engine stay plain Node with no packages.
- **Gaps in the sources.** The owner has only the base game. Expansion content that no source shows is left out, never invented, and the README lists it (#2).

## Setup to copy from the sibling projects

Read the sibling projects' `CLAUDE.md` files before scaffolding (#1). The patterns to reuse:
- **Code:**
  - Node.js 22.12+ (the floor Vite 8 sets) and ES modules. No runtime packages on the server or in the engine. The Svelte client is the one exception with a build step.
  - A DOM-independent rules engine shared by the server and the browser.
  - `createGame()`, and `play()`, which returns a new state from a `structuredClone`.
  - `PlayerError` for messages meant for players.
  - Typed events with an increasing `seq`.
- **Server:**
  - `server.mjs` on `node:http` keeps rooms in memory.
  - Every response goes through `view()`, which hides private information.
  - Clients long-poll `GET /api/state?since=<version>`, and stale moves are rejected with 409.
  - `limits.mjs` holds the rate limits, and `.env` holds `HOST`, `PORT` (3020 here) and `TRUST_PROXY`.
- **Tests:** `node --test`, with randomized invariant tests for the engine and the rooms, also run in GitHub Actions.
- **Look:**
  - Cinzel for the names of game things and Atkinson Hyperlegible for everything else, with the roles in `docs/ui/README.md`. The single copies, with their licence notices, are in `static/fonts/`. The HTML mockups still load them from Google Fonts.
  - `src/styles/tokens.css` is the single source of truth for the look. Where the mockups disagree with it, for example the lobby's player colours, follow `tokens.css`.
  - The superseded Alagard and VCR OSD Mono fonts live only in `docs/ui/archivedpngmockups/fonts/`, for the archived mockup.
  - Art production notes stay in `docs/art/`, never in `public/`.
- **Discord Activity (#43):** follow Bird Table.

## Rules research (`docs/research/`)

These files are the rules source for the engine. Use them instead of researching Tapestry again.

- `01-base-core-rules.md` covers:
  - setup, the four tracks space by space, income turns and the income mat;
  - the capital city, the map, conquering, achievements and scoring;
  - the official FAQ.

  Its §6 and appendices A and B have all 6 capital-mat grids, the map hexes and all 48 territory tiles. `02-base-content.md` §6–7 is incomplete on these, so take them from 01.
- `02-base-content.md` covers:
  - the 16 base civilizations and their balance adjustments;
  - 43 tapestry cards plus 7 traps;
  - 33 tech cards and 18 landmarks with footprints;
  - the full Automa and Shadow Empire procedure.
- `03-expansions.md` covers:
  - Plans & Ploys, Arts & Architecture and Fantasies & Futures;
  - the Revised Civilization Pack, kept for reference only;
  - the history of setup adjustments.

  Its §7 holds the cross-expansion combination rules. There are no promos.

How to read the research:
- Effects are paraphrased, with every number exact.
- The source trust order is:
  1. the Fantasies & Futures integrated rulebook;
  2. the Plans & Ploys rulebook and the Stonemaier FAQ;
  3. the base rulebook;
  4. the printed art;
  5. the Board Game Arena implementation.
- The 92 items marked **[UNVERIFIED]**, and every open question, are decided in the README's **Rules conventions** as stable rule ids **R1–R105**.
  - Follow those decisions, not the research's working assumptions.
  - Cite the id in code comments and test names, for example `// R16`.
  - Content listed there as "left out" is never invented.
  - A detail that no rule covers gets a new issue, never a guess.

## Not version-controlled

`.playwright-mcp/` (browser-tool logs) and `.superpowers/` (brainstorm sessions) are local scratch folders and stay ignored.

## Conventions quick checklist

The full rules, with examples, are in [CONVENTIONS.md](CONVENTIONS.md).

- [ ] Prettier formatting (tabs, single quotes), braces on every `if`/`else`, and `npm run check` is clean
- [ ] The file starts with a one-line comment; exported functions and types have JSDoc; no TypeScript
- [ ] Game rules live in `src/lib/engine/`, never in the server or a component; engine functions are pure, return new state, emit events and throw `PlayerError` for player mistakes
- [ ] No `Math.random()` in game logic, because randomness is injected
- [ ] Svelte components:
  - a section on the library page (`src/library/sections/<area>/<Name>.svelte`) and a row in `src/lib/components/README.md`;
  - a `<script module>` with `@typedef`, `@property` and `@example`;
  - `$props()` with a `/** @type {Props} */` annotation;
  - `{...attr}` spread on the root element, with `class` merged.
- [ ] Handlers are named `{action}Handler`; callback props are named `on{ComponentName}{Action}` and receive a `ComponentEvent`
- [ ] CSS classes use the `rg-{component}--{element|modifier}` BEM pattern; colours come from design tokens
- [ ] State uses `$state()`, `$derived()` (preferred) and `$effect()`; bindable props use `$bindable()`
- [ ] Desktop width is checked (there is no phone layout); reduced motion and the keyboard work
- [ ] Tests were written first and `npm test` passes; the commit references its issue; the README shows the current interface
