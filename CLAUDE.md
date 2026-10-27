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
npm test                      # Vitest over tests/*.test.mjs (it builds first), then Playwright in Chromium (#55)
npm run test:unit             # Vitest only; npm run test:watch keeps it running
npm run test:e2e              # Playwright only: starts npm run dev and opens the pages in tests/browser/; npm run test:debug shows the browser
npm run check                 # svelte-check: JSDoc types in src/ and art/, must report 0 errors and 0 warnings
npm run format                # Prettier (tabs, single quotes); Markdown is left alone
npm run art                   # draws every art/drawings/<id>.js into static/art/<id>.svg (the art is reviewed in the component library)
npx vitest run tests/static.test.mjs                      # one test file (the global setup builds public/ first)
npx vitest run -t "ETag"                                  # tests whose name matches
npx vitest run tests/simulation.test.mjs                  # 200 random full games on worker threads (#21)
SIM_SEED=17 npx vitest run tests/simulation.test.mjs      # replay one game on the main thread; SIM_GAMES=1000 plays more
npx playwright install chromium                           # once, before the first npm run test:e2e
```

GitHub Actions runs two jobs on every push and pull request (#55): `quality` (`npm ci`, `npm run check`) and `test` (`npm run test:unit`, then Chromium installed and cached, then `npm run test:e2e`, keeping the traces of a failed run for 7 days).

## Architecture

- `server.mjs` is the `node:http` server.
  - It exports `server` and `config` and only calls `listen()` when run directly, so tests start it in-process on port 0.
  - It serves files only from `public/`, resolving decoded paths and refusing anything outside the folder.
  - Vite's hashed bundles in `assets/` are cached for a year (`immutable`), and `fonts/` and `art/` for a week. Everything else, including the page, gets `no-cache` with a weak ETag, so a new deploy is picked up at once.
  - `/api/*` requests pass a per-address rate limiter (1,800 a minute) and go to the table API in `api.mjs` (#23).
- `api.mjs` is the table API (#23): `createApi(config)` keeps every table, guest session and long-poll request in memory, and serves `rooms.mjs`.
  - **Endpoints:** `config`, `tables`, `login`, `me`, `create`, `join`, `state` (`?since=<version>&seat=<n>`), `configure`, `settings` (#24), `add-seat`, `remove-seat`, `ready` (#25, no version), `start`, `end`, `move`, `undo` (#24) and `leave`.
  - **Timers (#24):** each table has one timer, set from `nextDeadline(room)`. `commit()` brings the room's clocks and declines up to date (`tick`) in the same commit as each change, and sets the timer again. When it fires, `playDue()` runs `timeout` and commits only if something progressed. Timers are `unref()`ed and cleared when a table closes or expires and when the server closes (`api.close()`). `config` gains `minuteMs`, `declineMinMs` and `declineMaxMs`, so tests shorten the waits. The design is `docs/superpowers/specs/2026-10-26-timer-and-undo-design.md`.
  - **Changes:** every change goes through `commit()`, which bumps the table's `version` and answers the requests waiting on it; a change carrying a stale `version` gets 409.
  - **What leaves the server:** rooms leave only through `roomView()`, so no person id, token or raw game ever does.
  - **Sessions:** bearer tokens; a session sits at one table at a time.
  - **Limits:** they sit in `config` (exported from `server.mjs`), which the API reads on every use, so tests shorten waits and raise limits there. The design is `docs/superpowers/specs/2026-10-26-server-api-design.md`.
- `limits.mjs` holds `rateLimiter()` and `clientAddress()`. With `TRUST_PROXY=true`, the last `X-Forwarded-For` address counts; otherwise the header is ignored.
- `rooms.mjs` holds the table rules (#22) as pure transitions in Bird Table's style: `createRoom`, `configure`, `join`, `addSeat`, `removeSeat`, `leave`, `start`, `end` and `play`, plus `settings`, `undo`, `timeout`, `tick`, `nextDeadline`, `scopeOf`, `phase`, `seatsOf` and `cleanName`. #25 adds `ready` (a seat's readiness in an online lobby, cleared by a host change). #24 adds `TIMERS` (off, 1, 2 and 5 minutes), `HISTORY_LIMIT` (20 undo steps) and `AUTO_LIMIT` (1,000 automatic answers in a row), and the room fields `timer`, `undo`, `clocks`, `declines` and `history`. Each returns a new room, or `null` when it closes, and throws the engine's `PlayerError`. The code says room, players see table. For the server's `Map` of rooms it has `newCode`, `addRoom` (`MAX_ROOMS` 1,000), `expireRooms` (`ROOM_IDLE_MS`, a day), `openTables` and `unfinishedSeat`. Room seat `i` is game seat `i + 1`; seats never move or disappear while a game is on the table. It uses the engine only through `src/lib/engine/game.js`, whose `checkOptions()` checks a table's options.
- **Client.** The browser interface is **Svelte 5** with runes forced on (5.57.2), built by **Vite** (8.3.4), without SvelteKit. The project root is Vite's root, laid out like the owner's other Svelte projects (owner, 2026-10-21). The full layout is in CONVENTIONS.md.
  - `index.html` is the game page. `src/main.js` mounts `src/App.svelte`, which shows one screen at a time from the store (#25): `src/screens/Landing.svelte`, `Lobby.svelte` and, once a game is dealt, `Game.svelte` (#26), with `PageHeader.svelte` and `HelpPanel.svelte`. Screens own state and call the store; the components in `src/lib/components/` stay presentational.
  - The client's plain modules (#25), each tested under Vitest: `src/lib/api.js` (`createApi`, `ApiError`; the token in `sessionStorage`, so each tab is its own guest), `changes.js` (`change()`: a stale version is retried once while the seats stay the same), `boot.js` (where a returning tab lands), `poll.js` (`pollTable`, one long poll at a time with back-off), `lobby.js` (seat slots, who may change what, labels) and `names.js` (Lazar's name generator). #26 adds `turn.js` (`myDecision`, `advanceOptions`: the engine's own `advances()` and answers run on the viewer's view), `moves.js` (`sendMove`, `seatToShow`), `board.js` (the tracks and achievements), `hexmap.js` (the board's hex geometry and `mapHexes`), `describe.js` (plain English for effects, costs, decisions and answers), `clock.js` and `overview.js`. #27 adds `src/lib/area/` (`capital.js`, `income.js`, `terrain.js`, `tabs.js`, `players.js`: what each player tab and the overview draw from a seat of the view) and `src/lib/cards/game-cards.js` (`techCardData`, `tapestryCardData` from the engine through `describe.js`); the screens `src/screens/game/PlayerTabs.svelte` and `PlayersOverview.svelte`. #28 adds `src/lib/prompts.js` (`promptFor`, `incomeView`, `effectArt`: what the decision panel draws for an open decision), `src/lib/area/explore.js` (`exploreChoices`: each tile and turn on a hex with its VP) and `src/lib/area/placement-targets.js` (`plotTargets`, `legalNear`, `nextRotation`, `placeNear`, `placingPiece`: the capital's legal places for the Capital tab). #59 adds `src/lib/glyphs.js` (`effectGlyphs`, `spaceGlyphs`, `bonusGlyphs`: what a track space draws for its benefit and bonus), and #56 `matPlots` and `terrainSeed` in `src/lib/area/capital.js`. `src/lib/game.svelte.js` is the rune store that ties them together. `src/lib/engine/game.js` also exports `completeDistricts`, `uniformLines`, `matchingSides`, `turned`, `INCOME_STEPS`, `INCOME_STEP_KINDS`, and `advances`, `DECISIONS`, `openDecisions`, `controlledTerritories`, `cityPlots` and `completeLines` for the app.
  - `components.html` is the component library page (#48). `src/library/main.js` mounts `src/library/Library.svelte`, which collects every `src/library/sections/<area>/<Name>.svelte` and shows each component in all its states. `src/lib/components/README.md` indexes the components.
  - `src/lib/` holds everything the app shares:
    - `components/<area>/` holds the Svelte components, grouped by area;
    - `component-event.js` holds `ComponentEvent`;
    - `ui.js` holds the shared interface ids (tracks, resources, terrain, seats) and turns them into token references;
    - `capital.js` holds the capital-grid geometry the interface needs: footprint rotation, legal positions and completed groups;
    - `art/catalog.js` lists all 413 assets with stable `<group>/<slug>` ids. It imports nothing, so the app and the engine can load it;
    - `art/hex-overlays.js` holds where the cloud and volcano overlays sit in a territory's 64×56 picture, shared by the art and the map (#6);
    - `art/footprints.js` holds the 33 landmark footprints. A landmark's picture is drawn in its footprint's shape at 32 pixels per plot, and the art build refuses one that covers the wrong plots. The rules engine must reuse this module;
    - `engine/` holds the rules engine, shared by the server and the app. It imports only relative paths: no DOM, Svelte or Node. Its `data/` folder holds the base-game data (#12), plain frozen modules: `ids.js` (versions with their tiebreak chains, and the track, resource, building and terrain ids), `effects.js` (the effect vocabulary), `tracks.js`, `income-mat.js`, `capitals.js`, `maps.js`, `territory-tiles.js`, `space-tiles.js`, `tech-cards.js`, `tapestry-cards.js`, `landmarks.js`, `achievements.js` and `dice.js`. Every benefit is a list of one-key effects such as `{ gain: { any: 1 } }`, explained in `docs/superpowers/specs/2026-10-24-base-game-data-design.md`.
    - The engine core (#13) sits beside `data/`. `game.js` is the entry point and exports `createGame`, `play`, `view` and `PlayerError`. The pending decisions live on an operation stack (`stack.js`, run by `loop.js`), where a group gives each player a lane so they decide at the same time. `kinds.js` registers the decision kinds (`decisions/`, each with its hidden fields, legal `answers()`, `check()` and `resolve()`) and the automatic kinds. The effect handlers live in `effects/index.js` (`EFFECTS`); each gets its operation, with the `source` space, as a fourth argument. Advance turns (#14) add `turn.js` (`startTurn`, `endTurn`), `payment.js` (paying costs and discards), `movement.js` (moving tokens, the landmark race, once-per-turn activations, `spacesAdvanced`) and `control.js` (`controlledTerritories`, which #17 reuses). The design is `docs/superpowers/specs/2026-10-24-advance-turns-design.md`. Income turns (#15) add `income.js` (`INCOME_STEPS`, exposed spaces, `neighbours`) and `ranking.js` (`rankPlayers`, `landmarksInCity`); their design is `docs/superpowers/specs/2026-10-24-income-turns-design.md`. Capital placement (#16) adds `city.js` (the plots, the legal places, complete districts and lines) and `placing.js` (`placeBuilding`, `placeLandmark`, `placePiece`); its design is `docs/superpowers/specs/2026-10-24-capital-city-design.md`. Exploring and conquering (#17) add `map.js` (hex neighbours, matching sides, legal hexes and targets), `effects/explore.js` and `effects/conquer.js`; their design is `docs/superpowers/specs/2026-10-24-map-design.md`. Tech cards (#18) add `data/tech-cards.js` (the 33 cards), `tech.js` (the deck, the display and the prerequisites) and `effects/tech.js` (`invent`, `upgrade`, `techBenefit`, `landmark`); their design is `docs/superpowers/specs/2026-10-25-tech-cards-design.md`. Tapestry cards (#19) add `data/tapestry-cards.js` (the 43 cards and the trap), `tapestry.js` (playing a card, the current era, the visible cards), `abilities.js` (the active THIS ERA ability, `triggered()`, advance blocks, allies), `eras.js` (the THIS ERA triggers), `achievements.js`, and `effects/tapestry.js`, `effects/players.js` and `effects/cards.js`; their design is `docs/superpowers/specs/2026-10-25-tapestry-abilities-design.md`. Civilizations (#20) add `civs/` (one module per civilization; `CIVS` and `civsOf` in `civs/index.js`; the `Civ` typedef, `offer` and `placeToken` in `civs/civ.js`), `civ-turns.js` (civilization setup and adjustments, step 1 of income turns, `gainCiv`), `outposts.js` (`takeOutpost`), `terrain.js` (the terrains a territory shows) and `effects/lose.js`; their design is `docs/superpowers/specs/2026-10-25-civilizations-design.md`. Because of the `abilities.js` → `civs/index.js` cycle, nine modules throw a `ReferenceError` when imported first: the civilization modules `civs/architects.js`, `futurists.js`, `heralds.js`, `historians.js`, `inventors.js`, `leaders.js`, `mystics.js` and `the-chosen.js`, and `decisions/choose-prophecy.js`. So import the engine through `game.js`, `kinds.js` or `play.js`. #47's civilization-mat component must import a civilization's data tables through `src/lib/engine/game.js` or `civs/index.js`, never a civilization module first. The setup steps are `SETUP_STEPS` in `setup.js` and `AFTER_SETUP_STEPS` in `after-setup.js`. The optional variants (#53) are `VARIANTS` in `setup.js`, as `{ id, name }`; each is checked in `state.variants` where its rule lives, and `techDeck(variants)` in `decks.js` gives a game's tech cards. `play.js` answers a decision. `state.js` holds the state types and the seat lookups. `events.js` numbers the events. `random.js` holds the injected randomness and the shuffle. `decks.js` lists the base decks. `errors.js` holds `PlayerError`. `table.js` (#24) holds what tables need to know about a game: `askedSeats`, `defaultAction`, `declineOnly`, `revealed`, `timedOut` and `restore`; `state.turn` counts turns (0 in setup). `view.js` is the only way state leaves the server. The design is `docs/superpowers/specs/2026-10-24-engine-core-design.md`.
  - `src/styles/` holds `tokens.css`, `base.css` and `pixel-noise.svg`:
    - `tokens.css` is the single source of truth for colours, the texture, type, spacing, layout sizes, borders, shadows, motion and layers;
    - `base.css` has the `@font-face` rules, the page and the focus outline;
    - `pixel-noise.svg` is the surface texture, a 256×256 tile cropped from `docs/ui/assets/middle-pixel-noise.svg`, which Vite hashes into `assets/`.
  - `static/` is copied into the build as is: `fonts/` (Cinzel and Atkinson Hyperlegible, with their licences), `art/` (the drawn SVGs) and `favicon.svg`.
  - `public/` is the build output that `server.mjs` serves. It is git-ignored; never edit it.
  - `scripts/dev.mjs` runs the Node server and Vite side by side. Vite proxies `/api` to the server.
  - The configuration lives in `vite.config.js`, `svelte.config.js` (`runes: true`), `jsconfig.json` (`checkJs`, `strict`, Vite client types), `.prettierrc` and `.prettierignore`.
- `art/` is the art drawing toolkit (#4), a build-time tool. See `docs/art/README.md`.
  - `painter.js`, `palette.js` and `parts/` draw style C pixel art. `drawings/<id>.js` holds one module per drawn asset. #6 adds `parts/territory.js` (the terrain hex pictures, the overlays, the territory tiles and the example boards) and `parts/capital-biomes/` (one module per advanced capital biome, each with its `LAYOUT` and `FEATURES`).
  - It reads the asset ids and footprints from `src/lib/art/`.
  - `gallery.js` holds the scene-part samples, the grouping the owner reviews art in, and the check every drawing must pass. It has no Node APIs, so the library page runs it in the browser.
  - `npm run art` writes the SVGs into `static/art/`, which are committed. Tests fail when a committed SVG is out of date.
  - The art is reviewed in the **Art** part of the component library (`/components.html`): every scene part, and every asset in the catalog, drawn or as an empty slot naming its issue, with landmarks under their plot grid. It draws straight from the toolkit, so with `npm run dev` a changed drawing shows at once. It replaced the standalone `art/preview/index.html` gallery (owner, 2026-10-21).
- `tests/` holds the Vitest suites, `tests/*.test.mjs`, configured in `vite.config.js`'s `test` block, with `node:assert/strict` assertions (#55). Server tests import `server` and listen on port 0, so they never need fixed ports. `tests/helpers/` holds the shared helpers: `build.mjs` (Vitest's global setup, which builds `public/` once), `engine.mjs` (new and started games), `views.mjs` (`checkViews`), `invariants.mjs` (`checkState`) and `simulation.mjs` (one random game).
- `tests/browser/` holds the Playwright tests (`playwright.config.js`, one Chromium project, as svelte_components runs its own): the library page shows every section and the game page the landing page, without console errors; `setup-prompts.test.mjs` plays setup at 1920×1080 and checks the capital grids, the civilization cards and the track spaces (#56–#59). Each screen adds its browser tests here. A test that creates a table must end and leave it, because the server allows 10 open tables per address and a running game stays open for a day.

## Where the work stands

The six full capital mat SVGs are examples only. Actual capital mats must be generated from the reusable terrain tiles for each game, following the game setup and the rules-defined plot layout.

**#5 is complete (owner approval, 2026-10-23).** The reviewed resources, four income buildings, five track symbols, neutral player pieces and all five player-color variants are committed as reproducible SVGs. The associated 84 capital terrain tiles and six example mat compositions contribute to #6, which remains open. See `docs/art/issue-5.md` for the inventory and the decision to render dice faces and game symbols through text or draw them later with the map's terrain hex markers. The full former mockup is frozen in `docs/art/archive/2026-10-23-issue-5/`; placeholder dice, terrain hex marker and game-symbol drawings are archived only.

Updated 2026-10-27. Update this section whenever a milestone moves.

- **Done:**
  - Rules research (`docs/research/`).
  - The approved design document.
  - The phase-one desktop UI/UX manifest and interactive launch, lobby, play and player-overview mockups (`docs/ui/README.md`, 2026-10-21).
  - The production styles that follow it: `tokens.css` and `base.css`, with self-hosted Cinzel and Atkinson Hyperlegible (2026-10-21).
  - The component library (#48, 2026-10-21): 34 components in `src/lib/components/`, each shown in all its states on `/components.html`, which also holds the art. Several components show placeholders until their art lands; `src/lib/components/README.md` lists them. The owner closed #48 on 2026-10-21, ahead of its blocker #3.
  - The approved art style C (`docs/art/`).
  - All 43 issues filed in [serferdinand2/the-rug-game](https://github.com/serferdinand2/the-rug-game/issues).
- **#1, #2, #3, #4, #7, #8, #9, #10, #11, #12, #13, #14, #15, #16, #17, #18, #19, #20, #21, #22, #23, #24, #25, #26, #27, #28, #44, #46, #48, #52, #53, #54, #55, #56, #57, #58 and #59 are done.** Lazar closed #3 on 2026-10-27.
  - The Node server, tests and CI exist.
  - The client is a Svelte 5 app built by Vite. The landing page, the lobby (#25), the play screen (#26), the player area (#27) and the designed prompts (#28) are built; a whole base game can be played with the mouse.
  - Every unverified rule detail is decided in the README's "Rules conventions" (R1–R110).
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
- **#10 (tech card pictures)** is done (closed 2026-10-24). All 56 cards are drawn: 33 base, 11 Arts & Architecture and 12 Fantasies & Futures. The owner asked for the second 10 quickly, by parallel subagents, without a separate fresh review, and for the last 13 "a tiny bit simpler" (one big subject, plain backgrounds, about 40 to 60 colours); the 23 expansion cards follow the simpler rules too. The design is `docs/superpowers/specs/2026-10-22-tech-cards-design.md` and the plan is `docs/superpowers/plans/2026-10-22-tech-cards-issue-10.md`.
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
  - The final review found two problems, both fixed with tests: VP counters ran too early, and an after-setup step placed after `'start'` would never run (it now throws). #54 asked the owner whether Alien Biology scores on a track whose token AI Singularity took off; it does (R109, owner, 2026-10-26).
  - The rest is handed off by name, and each issue lists it: `tapestryOnTop` and the track achievement (#19); `gainCiv` (#20). Until then they throw an `Error` naming themselves. Tests stand in for them with `stubHandoffs()` in `tests/helpers/engine.mjs`.
  - `tests/engine-track-spaces.test.mjs` reaches each of the 48 spaces by a real advance turn.
- **#15 (income turns, eras and the game end)** is done (2026-10-24). The design is `docs/superpowers/specs/2026-10-24-income-turns-design.md` and the plan is `docs/superpowers/plans/2026-10-24-income-turns-issue-15.md`.
  - Answering `chooseTurn` with income runs that income turn's steps from `INCOME_STEPS`, a list later issues insert into: civilization abilities (#20), the first-of-neighbours bonus and the era's tapestry card, the optional upgrade (#18), scoring, income, and finishing after income turn 5.
  - With an empty hand the top card goes on face down: the state keeps its id in `incomeMat.faceDown`, and `view()` hides it from everyone, its owner included.
  - A finished player is skipped and gains nothing but passive civilization VP: `runEffects` skips their effects unless the operation is `passive` (#20 marks its passive VP).
  - When every seat has finished, `rankPlayers` ranks them by VP and the version's tiebreak chain, and `state.result` records every tiebreak step used, with each compared player's value (owner). Shared places count 1, 1, 3. The tallest-landmark step reads `seat.capital.landmarks`, which #16 fills (it holds pieces, and `landmarksInCity` returns their ids).
  - `tests/engine-scripted-game.test.mjs` plays a 2-player game from setup to the end.
  - The final review found two problems, both fixed with tests: the `passive` mark was lost through `chooseOption` and `chooseOrder`, and an income step after `'finish'` would silently do nothing (it now throws).
- **#16 (capital city placement and district rewards)** is done (2026-10-24). The design is `docs/superpowers/specs/2026-10-24-capital-city-design.md` and the plan is `docs/superpowers/plans/2026-10-24-capital-city-issue-16.md`.
  - A building goes on an open plot. A landmark goes in any of 4 rotations; it may hang over the edge if at least one grid plot is covered, but it may not overlap a piece or an impassable plot on the grid, and it may not cover another landmark's overhang off the grid (R106). When nothing fits, the piece goes beside the mat (`besideMat`). When there is only one place, it is placed automatically (owner).
  - Each district a building or landmark completes pays 1 resource of the player's choice, one choice for all of them. It comes before the rest of the benefit and the bonus, so a landmark's district can pay the bonus (FAQ #1).
  - `scoreCapital` scores the complete rows and columns. Symbology now really scores the capital on income turns 2-5.
  - `capital.landmarks` now holds pieces `{ landmark, row, col, rotation }`, and `landmarksInCity` returns ids. `cityPlots(seat)` is derived from the mat and the pieces, and uses the interface's `PlotKind`.
  - `tests/engine-capital.test.mjs` and `tests/engine-city.test.mjs` cover it. The scripted game checks both capitals at the end.
  - Handed off: #18 pushes `placeLandmark` for the tech-card landmarks; #27 draws overhanging and beside-the-mat pieces; #31 places the bots' landmarks; #36 handles the advanced mats.
- **#17 (exploring and conquering on the map)** is done (2026-10-24). The design is `docs/superpowers/specs/2026-10-24-map-design.md` and the plan is `docs/superpowers/plans/2026-10-24-map-issue-17.md`.
  - Exploring: a tile goes on an unexplored hex next to a territory the player controls (or anywhere, when the effect says so). The player picks the tile, the hex and the turn with `chooseExplore`; when every answer is the same, it is explored at once. Each matching side scores 1 VP, then the tile's benefit runs. Nothing happens with no tile or no legal hex (FAQ #19).
  - Space tiles and R105: `chooseSpaceTile` explores a space tile beside the income mat, and Interstellar Travel's "explore 1 of them" uses the 3 tiles it just gained (`fromGained`).
  - Conquering: `chooseConquer` picks an explored hex, and both dice roll even after a trap (01 §7.3). The black die's "?" gives the tile's benefit even after a trap, and a printed territory gives nothing (R107).
  - The response question: `chooseResponse` asks the defender whenever they hold any card, so nobody learns who holds a trap (owner). A defender without a trap can only decline; the server answers after a random wait, which #24 builds. A finished defender is asked only in the original version (R108). A sprung trap keeps control and topples the attacker.
  - Records for #19: an outpost has `toppledBy`, and a `conquered` event says whether the conquest was trapped.
  - Handed off: #19 (Pillage and Plunder, the topple and middle-island achievements), #20 (civilization tokens on territories), #24 (the random wait), #30 (the hot-seat pass screen must not show who holds a card), #31 (the bots), #33 and #40 (other response cards).
  - `tests/engine-map.test.mjs`, `tests/engine-explore.test.mjs` and `tests/engine-conquer.test.mjs` cover it.
- **#18 (tech cards: inventing and upgrading)** is done (2026-10-25). The design is `docs/superpowers/specs/2026-10-25-tech-cards-design.md` and the plan is `docs/superpowers/plans/2026-10-25-tech-cards-issue-18.md`.
  - The owner's input was "not sure. implement and we will see later". So the research, the rule conventions and Board Game Arena settle what they can, and every other decision is marked "(my call)" in the design for the owner to revisit after playing.
  - The data: `TECH_CARDS` holds the 33 base cards in `BASE_TECH` order, each with a circle, a square and a prerequisite. Six landmark cards need an innovation on the income mat (R18). New effect vocabulary: `noBenefit` on `advance` and `regress`, the `landmark` effect, and `oncePerTurn` on `repeat`.
  - Inventing: `invent` takes a face-up card or the top of the deck into the bottom row, and the display is refilled. An empty deck is rebuilt from the discards. Rubber and Metallurgy may first refresh the display, which is an answer to `chooseInvent`, not a separate question. A newly invented card gives no benefit.
  - Upgrading: a bottom card goes to the middle and gives its circle, and a middle card goes to the top and gives its square. The prerequisite may be met by you or by a neighbour. Only income step 3's upgrade is optional.
  - `techBenefit` gives the benefit of a card in the middle or top row without moving it (Electronics, Assembly Line, Nanotechnology). A landmark card gains its landmark and places it through #16. Lithium-Ion Battery's square works once per turn, tracked in `state.usedThisTurn` (FAQ #6).
  - Handed off: #19 (Printing Press's `tapestryOnTop`), #20 (Radio's `gainCiv`, and the Inventors and Tinkerers), #27 and #28 (the tech rows, the display and the prompts for the three new decisions), #31 (bots as neighbours for prerequisites), #53 (the variant without Radio and Lithium-Ion Battery).
  - `tests/engine-tech-data.test.mjs`, `tests/engine-tech.test.mjs` and `tests/engine-tech-cards.test.mjs` cover it.
- **#19 (tapestry cards and achievements)** is done (2026-10-25). The design is `docs/superpowers/specs/2026-10-25-tapestry-abilities-design.md` and the plan is `docs/superpowers/plans/2026-10-25-tapestry-abilities-issue-19.md`.
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
- **#20 (the 16 base civilizations)** is done (2026-10-25). The design is `docs/superpowers/specs/2026-10-25-civilizations-design.md` and the plan is `docs/superpowers/plans/2026-10-25-civilizations-issue-20.md`.
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
- **#21 (randomized full-game simulation test)** is done (2026-10-25). It completes M3. The design is `docs/superpowers/specs/2026-10-25-simulation-test-design.md` and the plan is `docs/superpowers/plans/2026-10-25-simulation-test-issue-21.md`.
  - As for #19 and #20, the owner asked for the work without a question round, so the design marks every other decision "(my call)".
  - `tests/simulation.test.mjs` plays 200 random legal games from `createGame()` to the final ranking: 1–5 players, both versions, and two policies, *random* and *busy* (an offered advance turn 85% of the time), 10 games for each of the 20 combinations. Game `i` uses seed `i + 1`.
  - Each answer comes from the acting player's own `view()`, as a client gets it. After every action, `checkState()` (`tests/helpers/invariants.mjs`) checks that every tech and tapestry card, territory and space tile, civilization, capital mat and landmark is in exactly one place, that each player owns 5 of each income building, 10 outposts and their civilization tokens, the ranges of resources, VP and track spaces, consecutive event numbers, #19's era rules, and that an answerable decision is open until the game ends. `checkViews()` (`tests/helpers/views.mjs`, shared with `engine-view.test.mjs`) checks every seat's view and the public one.
  - The games run on worker threads (one per core but one, at most 8): about 20 seconds locally, about a minute on GitHub's runners. A failure names its seed, game, action and decision, and how to replay it with `SIM_SEED`. A worker silent for a minute is stopped and its game failed by name, so an endless loop inside one `play()` can't hang CI; the CI job also stops after 15 minutes.
  - No engine bug turned up: 1,200 probe games, the 200 of the test and a 1,000-game soak all pass. The first run did correct the view checker: R35's draw reveals cards to everyone on purpose. `REVEALS` in `tests/helpers/views.mjs` lists the event fields that reveal cards by rule; a new public reveal must be added there, or the simulation reports it as a leak.
  - A secret id is excused only where it is public now, or, in the action's new events, where it was public before the action or is revealed by rule. Older events aren't searched again. The fresh review showed that excusing ids named in older events hid a real leak, so that went. Six tech cards share an id with a landmark (Bakery, Barn, Com Tower, Library, Stock Market, Treasury), so their deck order can't be checked by id.
  - Coverage: in the 200 games `chooseRestart`, `chooseSpaceTile`, `chooseHex` and `chooseSwap` never open, and the tech deck is never rebuilt from its discards. A later policy aimed at the late game could reach them.
  - Handed off: #31 adds solo games and the bots' pieces to the checks; each expansion issue adds its cards, tiles and pieces to `checkState()` and its decks to `checkViews()`; #24's undo can reuse `checkState()`.
- **#22 (the table lifecycle)** is done (2026-10-25). It is the first issue of M4. The design is `docs/superpowers/specs/2026-10-25-table-lifecycle-design.md` and the plan is `docs/superpowers/plans/2026-10-25-table-lifecycle-issue-22.md`.
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
- **#23 (the server API)** is done (2026-10-26). The design is `docs/superpowers/specs/2026-10-26-server-api-design.md` and the plan is `docs/superpowers/plans/2026-10-26-server-api-issue-23.md`.
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
- **#24 (the turn timer and undo)** is done (2026-10-26). The design is `docs/superpowers/specs/2026-10-26-timer-and-undo-design.md` and the plan is `docs/superpowers/plans/2026-10-26-timer-and-undo-issue-24.md`.
  - The owner answered the questions this time:
    - a timeout plays the rest of the turn with the default answers, from where the player is (a started advance is finished, not swapped for an income turn);
    - the screens warn the player in the last 5 seconds (drawn later);
    - undo stops at anything revealing;
    - there is no kick.
  - Built:
    - **Settings:** the host sets `timer` (off, 1, 2 or 5 minutes) and `undo` (on or off) through `settings`, in the lobby, in a game or at a finished table. New tables start with the defaults (timer off, undo on). A timer change restarts every clock.
    - **Clocks:** the turn's player has one clock for the whole turn, paused while they are not asked. Setup has one clock per player. Anyone else asked gets a fresh clock. The room view carries `clocks` and `now`.
    - **Timeouts:** an expired clock adds a `timedOut` event, then the server answers with the defaults until the player is not asked any more.
    - **The decline wait:** a defender who can only decline is answered after a random 3 to 10 seconds, in every mode. The wait stays on the room and never reaches the view.
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
- **#53 (the optional variants)** is done (2026-10-26). The design is `docs/superpowers/specs/2026-10-26-variants-design.md` and the plan is `docs/superpowers/plans/2026-10-26-variants-issue-53.md`.
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
- **#25 (the landing page, the new-table setup and the lobby)** is done (2026-10-27). The design is `docs/superpowers/specs/2026-10-27-landing-and-lobby-design.md` and the plan is `docs/superpowers/plans/2026-10-27-landing-and-lobby-issue-25.md`.
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
- **#26 (the game screen and the shared board)** is done (2026-10-27). The design is `docs/superpowers/specs/2026-10-27-game-screen-board-design.md` and the plan is `docs/superpowers/plans/2026-10-27-game-screen-board-issue-26.md`. The owner approved it ("build all"), ahead of its blocker #6.
  - Built: `Game.svelte` with the header (player chips, the turn clock, Undo, sound, the menu with Leave table), the shared area (the board switcher, the achievements, the tracks with the spaces the viewer can pay for outlined in green, and the World Map as the real board's hex grid), the player area with Your overview, the footer turn (income, or a chosen space's benefit, bonus and price, then Advance, asking for the payment when there is a choice) and the decision panel with a plain prompt for every other decision. A whole game can be played with it.
  - The World Map (owner): flat-topped hexes as on the printed board, hex `a_b` at x = 1.5·s·(b − a), y = (√3/2)·s·(a + b), corner 0 top-left, side e facing `HEX_SIDES[e]`; terrain wedges per corner, islands, dashed unexplored hexes; outposts as squares, tokens as circles. #6's art replaces the drawn terrains.
  - Legal advances and payments are the engine's own `advances()` and `chooseAdvance.answers()`, run on the viewer's view before anything is sent; a test over 40 random games checks the preview always equals the server's answers.
  - New components, each in the library: `AchievementStrip`, `TurnClock`, `SelfSummary`, `DecisionPanel`, `DecisionOption`, a rebuilt `WorldMap` (`hexes`, `targets`, `selected`), and `available` on `TrackSpace`/`Track`/`TrackBoard`. Four of the tasks were built by parallel implementers in their own worktrees.
  - Calls to revisit: available spaces are green (gold stays for selected); landmarks leave the track once taken; the achievements sit in the shared area's head; the plain prompt until #28; Your overview's last count is complete capital lines; a stale move isn't resent; at a hot-seat table the lowest asked seat is shown, without a pass screen until #30; the setup chip reads "Setting up".
  - Handed off: #27 (the tabs, switching tabs for decisions, the overview from the chips), #28 (the designed prompts, extending `describe.js` to cards and civilizations), #29 (log, motion, results, timed-out notice, settings during a game), #30 (the pass screen), #6 (the map art; the outpost SVGs could replace the squares).
  - `tests/client-turn`, `client-board`, `client-hexmap`, `client-describe`, `client-clock` and `client-overview` cover the modules; `client-api` plays setup and first turns through `sendMove`. A browser walkthrough with two tabs played setup, income turns, advances with a payment choice and an explore on the map.
- **#27 (the player area and the players overview)** is done (2026-10-27). The design is `docs/superpowers/specs/2026-10-27-player-area-design.md` and the plan is `docs/superpowers/plans/2026-10-27-player-area-issue-27.md`. Built without stopping for approval ("build all").
  - Built: the seven player tabs (Capital, Hand, Income, Eras, Civ, Tech, Terrain) above Your overview; a card shown in full over the shared area on hover; tab switching by decision; the players overview from the chips with a Capital, Civilization or Tech drill-down for any player.
  - Real cards: `techCardData` and `tapestryCardData` build the reviewed frames from the engine's data; `describe.js` gained the THIS ERA and card-rule texts (`describeTapestryCard`), paraphrased from the research with exact numbers. `TechnologyCard`/`TapestryCard` take `id` (fixture) or `data`.
  - New components: `IncomeMat`, `EraSlots`, `TerritoryTile`, `CardFan`; `CapitalGrid` draws landmarks over the edge (R106), and `placement.js` gained `pieceArea`. Four tasks were built by parallel implementers in worktrees.
  - Calls to revisit: the four base civilizations without a recipe (Futurists, Heralds, Nomads, The Chosen) get a plain portrait card until #47; the capital's terrain seed is the table code; the tab mapping per decision; the overview's capital "points" are complete lines.
  - Handed off: #28 (placing on the capital and choosing cards in the tabs), #47 (the missing civilization cards and the card gallery).
  - `tests/client-game-cards`, `client-area-capital`, `client-area-income`, `client-area-terrain`, `client-area-tabs` and `client-area-players` cover it; a two-tab walkthrough checked every tab and the overview.
- **#55 (Vitest and Playwright)** is done (2026-10-27). The 118 `node:test` suites moved to Vitest 5 mechanically: `test` from `vitest`, `before`/`after` as `beforeAll`/`afterAll`, `t.after` as the context's `onTestFinished`, `t.mock` as `vi` (spies restored by `restoreMocks`, fake timers put back after each test), assertions still `node:assert/strict`. A Vitest global setup builds `public/`, so `npm run test:unit` needs no `pretest`. Playwright 1.64 runs one Chromium project (`playwright.config.js`, svelte_components' settings) over `tests/browser/`: the library page and the game page, without console errors. CI runs `quality` and `test` jobs on Node 24 with `actions/checkout@v6` and `setup-node@v6`, caching Chromium and keeping failed runs' traces. The simulation keeps its worker threads, watchdog, `SIM_SEED` and `SIM_GAMES`.
- **#56–#59 (the owner's first look at setup and the tracks)** are done (2026-10-27). The owner filed them after playing setup and asked for them to be resolved. The decision-prompts design, §8, records them.
  - #56: each capital mat on offer is its 9×9 `CapitalGrid` (`matPlots`, `terrainSeed` in `src/lib/area/capital.js`), not the example art.
  - #57 and #58: civilization cards on the shelf are whole, 425 px wide at their own height, scaled down only as far as the shelf needs (never below 0.75), and each sizes its own button, so the outline fits. The shelf fills the height above the panel; a panel without options of its own puts its instruction in the status line.
  - #59: each track space shows its benefit and bonus through `src/lib/glyphs.js`, with the words as its tooltip; the track board is a size container that lets spaces grow up to 1.25 times as tall as wide.
  - `tests/client-glyphs.test.mjs` and `tests/browser/setup-prompts.test.mjs` cover them. The browser test closes its table: the server allows 10 open tables per address, and a running game stays open for a day.
- **#6 (the boards)** is drawn (2026-10-27); only the owner's approval in the gallery is left, so the issue stays open. The design is `docs/superpowers/specs/2026-10-27-boards-design.md` and the plan is `docs/superpowers/plans/2026-10-27-boards-issue-6.md`. Built without stopping for approval ("When you are done just finish up #6").
  - **The map is composed, not painted** (the capital's rule from #5): each terrain has one 64×56 hex picture (`hex/*`, `art/parts/territory.js`), and WorldMap and TerritoryTile fill each wedge and island part with it, clipped, with a coast where land meets sea. A turned tile stays crisp and shows the terrains the engine scores. `territory-tile/1–48` and `board/map-small`/`map-large` are the same composition in pixels, for the gallery; the boards are examples.
  - **Clouds are game data (R77):** `TERRITORY_TILES` and the printed hexes carry `clouds` and `volcano`. The cloud and volcano overlays sit at spots shared in `src/lib/art/hex-overlays.js` (the volcano on its mountains' corner in every turn); screen readers hear them. #49 scores the clouds.
  - **The 12 advanced capital biomes** each have 8 buildable and 6 impassable 32×32 plots and an example mat on the printed layout from 03-expansions (`art/parts/capital-biomes/<biome>.js`, `LAYOUT` pinned against the research in each test). What the research doesn't show (rule text, icons, frames) is left out.
  - **Handed off to #36:** each biome module exports `FEATURES` (its ordinary pools, its position-bound variants such as Quagmire's reeds and wisps, and its mat-only features such as Canyon's cacti or Polar's rings). #36 composes advanced mats in the game from them; `capitalTileUrl` stays base-only, so no special tile lands on a random plot.
  - A fresh review found no bug in the data or the composition; its art findings (a Cloud City tile, several obstacles that read as something else, beaches round the Archipelago's volcanoes) are fixed, and the overlays now sit at their spots instead of stretching over the hex.
  - `tests/art-territory`, `art-capital-<biome>` (12), `art-capital-features` and `client-hexmap` cover it.
- **#28 (the decision prompts)** is done (2026-10-27). The design is `docs/superpowers/specs/2026-10-27-decision-prompts-design.md` and the plan is `docs/superpowers/plans/2026-10-27-decision-prompts-issue-28.md`. Built without stopping for approval ("build all").
  - `promptFor()` gives every open decision a title, an instruction, a layout (`options`, `cards`, `map` or `capital`) and one option per answer with its art; a test over random games checks that every answer is reachable exactly once. Nothing is sent before Confirm.
  - New components, each in the library: `PromptArt`, `CardShelf`, `IncomeSteps`; `DecisionOption` gains `art` and `vp`, `DecisionPanel` `track`, `tone`, `steps` and `docked`, `TurnBar` the `income` tone, `WorldMap` `preview`, `CapitalGrid` `targets`, `preview` and `room`. `CivilizationCard` draws its frame, portrait and name for a civilization without a recipe.
  - The #27 final review's fixes came first: room for landmarks over the edge in the tab and the overview, a card on Maker of Fire, the full-card view clearing, the PlayerCard's terrain and true capital points, card wording, and the overview's keyboard.
  - Calls to revisit: an explore starts on its best tile and turn; a building click previews and Confirm sends, while a landmark's own lock sends; `chooseSwap` and `chooseCivAbility` stay panel choices; the income strip shows Ability, Tapestry, Upgrade, Score and Income, the first-of-neighbours bonus inside Tapestry; the capital mats' choice showed the example mat art until #56 drew each mat as its grid.
  - Known gaps: `CapitalGrid`'s own fit check stops R and the arrow keys at places over the edge (R106) or under Terraforming, which a plot click or a drop still reaches; a trap response and a tapestry discard never came up in the walkthrough (the prompt tests cover them).
  - The final review found that a Nomads player could never place in their capital (their territories took the prompt over); the capital now leads and the map's hexes stay lit beside it, and the panel docks whenever the map shows hexes to choose. It also made the card shelf scroll rather than clip, fanned tapestry cards only past four, and centred landmarks.
  - `tests/client-prompts`, `client-area-explore` and `client-area-placement` cover it. Two hot-seat games were played to the end in the browser through the prompts alone, and a third checked the Nomads' placement.
- **Decided 2026-10-27:**
  - Lazar's mockups decide the look and the owner's design decides what works, where they collide; the client is designed for our own API (owner, #25).
  - Readiness is informational: the host may start without it (owner, #25).
  - Work order: #25, then #26–#28, then #6. #26 draws the game's real hex grids (34 hexes for 1–3 players, 61 for 4–5) instead of the mockup's filler map, until #6's map art exists (owner).
- **Decided 2026-10-26:**
  - R109: Alien Biology scores 5 VP on a track whose token AI Singularity took off, as FAQ #9 treats the token as still on space 12 (owner, #54).
  - A table may switch on 7 of the 8 official optional variants: the tapestry and civilization drafts, the neoprene Nanotechnology bonus, leaving out Radio and Lithium-Ion Battery, closest-island starts, civilizations from one expansion and either science die. Not the players removing cards of their choice (owner, #53).
- **Decided 2026-10-24:**
  - At the game end, players see each tiebreaker used, step by step (owner, #15).
  - R105: Interstellar Travel's "explore 1 of them" means one of the 3 space tiles it just gained, as printed; BGA's reading (any tile in hand) is rejected (owner, #52).
  - The defender in a conquer is asked whenever they hold any card, so nobody learns who holds traps. A defender without a trap is declined automatically after a random wait, which #24 builds (owner, #17).
  - R108: the table's version decides whether a finished player may still respond to a conquer. Current rules: no. Original 2019 rules: yes, but a sprung trap gains no resource (owner, #17).
  - The owner asked for the issues to be reorganized before #14: #14–#20 now name the effects each one builds.
- **Decided 2026-10-23:**
  - Civilization cards use option B · Civilization mat from `docs/ui/collectors-card-options.html` (owner). It is 425 px wide (owner revision, 2026-10-24), so it fits the Civilization tab. One component filled from data will draw all 41 civilizations, under #47; the owner asked for it ahead of #47's blocker #3.
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
  - The owner reviews #6's art in the component library's Art part (`/components.html#art-parts`) and closes #6.
  - Then the next unblocked issues by milestone (see "Working on issues").
  - #45 Check R12 (landmark heights) and R39 (decision-card arrows) against the physical box. This is the owner's job, and it blocks nothing.
  - The cosmetic boards wait in #51 until the core features are done.
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
- **Tests:** Vitest for the Node suites and Playwright in Chromium for the browser, set up as SurveyPlanet's `svelte_components` runs its own (#55), with randomized invariant tests for the engine and the rooms, also run in GitHub Actions.
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
- The 92 items marked **[UNVERIFIED]**, and every open question, are decided in the README's **Rules conventions** as stable rule ids **R1–R110**.
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

## Card-design handoff, 2026-10-24 (Refs #3 #47)

Before generating or modifying cards, read `docs/ui/card-design-rules.md` and the scoped `DESIGN.md`. The Style B frame is now **425 px**, with natural height, 160 px full portraits, square placement targets capped at 75 px, and native 24/48 resource assets with no circles. All fourteen reviewed civilization recipes use the shared Svelte card components. The review route is built and deployable; the component library exposes each primitive. Shaded player tokens replace the flat colour variants, and the five approved terrain hex markers now ship as reproducible assets.

This completes the civilization-frame/pattern portion of #47, not every card family, all 41 rules read-models or in-game reference access. It contributes civilization-detail UI to #3; broader decisions, income flow and results remain open. Original-mat fixtures are explicitly labelled. Do not mistake these layout fixtures for current-edition engine data.
