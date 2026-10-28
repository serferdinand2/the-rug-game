# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Who edits this file

Only Claude edits CLAUDE.md (owner, 2026-10-27). Lazar works with Codex, which follows [AGENTS.md](AGENTS.md): it reads this file but never changes it, and it changes documentation only when asked to.

Keep this file short, because every Claude session and subagent loads all of it. History goes in [docs/status.md](docs/status.md), module detail in [docs/architecture.md](docs/architecture.md), and each issue's decisions in its design document under `docs/superpowers/specs/`. This file keeps what every task needs: what the project is, the commands, a map, the working rules and the decisions already made.

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
npm run dev                   # Vite dev server with hot reload (http://127.0.0.1:5173, the library at /components.html) plus node --watch server/server.mjs
npm run build                 # Vite builds index.html and src/ into build/
npm run serve                 # serves an existing build without rebuilding (for hosts without dev tools)
npm test                      # Vitest over tests/*.test.mjs (it builds first), then Playwright in Chromium (#55)
npm run test:unit             # Vitest only; npm run test:watch keeps it running
npm run test:e2e              # Playwright only: starts npm run dev and opens the pages in tests/browser/; npm run test:debug shows the browser
npm run check                 # svelte-check: JSDoc types in src/ and tools/art/, must report 0 errors and 0 warnings
npm run format                # Prettier (tabs, single quotes); Markdown is left alone
npm run art                   # draws every tools/art/drawings/<id>.js into static/art/<id>.svg (the art is reviewed in the component library)
npx vitest run tests/static.test.mjs                      # one test file (the global setup builds build/ first)
npx vitest run -t "ETag"                                  # tests whose name matches
npx vitest run tests/simulation.test.mjs                  # 200 random full games on worker threads (#21)
SIM_SEED=17 npx vitest run tests/simulation.test.mjs      # replay one game on the main thread; SIM_GAMES=1000 plays more
npx playwright install chromium                           # once, before the first npm run test:e2e
```

GitHub Actions runs two jobs on every push and pull request (#55): `quality` (`npm ci`, `npm run check`) and `test` (`npm run test:unit`, then Chromium installed and cached, then `npm run test:e2e`, keeping the traces of a failed run for 7 days).

## Project map

The modules in detail, with the issue that added each, are in [docs/architecture.md](docs/architecture.md); each area's design is in `docs/superpowers/specs/`. The folders:

- **Server** (`server/`, `api/`): `server/server.mjs` is the `node:http` server. It exports `server` and `config` and only listens when run directly, so tests start it in-process on port 0; it serves only `build/`. `api/api.mjs` is the table API: every change goes through `commit()`, rooms leave only through `roomView()`, and its limits sit in `config`. `api/rooms.mjs` holds the table rules as pure transitions. `server/limits.mjs` holds the rate limits.
- **Rules engine** (`src/lib/engine/`): pure, shared by the server and the browser, importing only relative paths. `game.js` is the entry point (`createGame`, `play`, `view`, `PlayerError`). The data is in `data/`, decision kinds in `decisions/` (registered in `kinds.js`), effects in `effects/`, civilizations in `civs/`. `view.js` is the only way state leaves the server; `table.js` holds what tables need to know about a game.
  - **Import the engine through `game.js`, `kinds.js` or `play.js`.** Because of a cycle, nine modules (eight civilizations in `civs/` and `decisions/choose-prophecy.js`) throw a `ReferenceError` when imported first; docs/architecture.md lists them.
- **Client** (Svelte 5 with runes, built by Vite, no SvelteKit): `index.html` → `src/main.js` → `src/App.svelte`, which shows one screen from `src/screens/`. Screens own state and call the store `src/lib/game.svelte.js`; components in `src/lib/components/<area>/` stay presentational and are indexed in its README. Logic lives in plain modules in `src/lib/` (such as `prompts.js`, `describe.js`, `area/`), each tested under Vitest.
- **Component library**: `components.html` → `src/library/`, which shows every component in all its states, and the art.
- **Look**: `src/styles/tokens.css` is the single source of truth; `base.css` holds the fonts and the page. `static/` is copied into the build as is. `build/` is build output: never edit it.
- **Art**: `tools/art/` draws the pixel art into `static/art/` (`npm run art`; see `docs/art/README.md`). `src/lib/art/` holds the asset catalog and the landmark footprints, which the engine must reuse.
- **Tests**: `tests/*.test.mjs` run under Vitest with `node:assert/strict`, helped by `tests/helpers/` (`engine.mjs`, `views.mjs` with `checkViews`, `invariants.mjs` with `checkState`, `simulation.mjs`). `tests/browser/` holds the Playwright tests. A browser test that creates a table must end and leave it, because the server allows 10 open tables per address and a running game stays open for a day.
- **Docs**: `docs/research/` (the rules sources), `docs/superpowers/specs/` and `plans/` (one design and plan per issue), `docs/ui/` (the interface manifest, mockups and screenshots), `docs/art/` (art notes), `docs/status.md` and `docs/architecture.md`.

## Where the work stands

The full record is [docs/status.md](docs/status.md): what every issue built, its calls to revisit after playing, and what it handed on. Update it whenever an issue lands or a milestone moves, and keep this summary to a few lines.

Updated 2026-10-28.

- M0 to M5 are built: a whole base game can be played with the mouse, online or hot-seat. Three of their issues are still open: #45 (the owner checks R12 and R39 against the box), #47 (the card gallery) and #73 (a README screenshot).
- M12 · Cosmetic enhancements: #66, #67, #69, #70, #72 and #74 are done. #75 and #61 are built and wait for the owner's look in the component library.
- Solo play (M6) and the expansions (M7–M9) come next by milestone; see [Working on issues](#working-on-issues) for the order and the blockers.

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

## Owner rulings by date

Rulings the owner made along the way. Each issue's design document records its own; these apply across issues.

- The six full capital mat SVGs are examples only. Actual capital mats must be generated from the reusable terrain tiles for each game, following the game setup and the rules-defined plot layout.
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

## Card design

Before generating or modifying cards, read `docs/ui/card-design-rules.md`; its colours are tokens in `src/styles/`. Where the card work stands (Refs #3 #47) is in [docs/status.md](docs/status.md#card-design-handoff-2026-10-24-refs-3-47).

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
