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
npm run dev                   # Vite dev server with hot reload (http://127.0.0.1:5173) plus node --watch server.mjs
npm run build                 # Vite builds client/ into public/
npm test                      # builds, then runs every test in tests/
npm run check                 # svelte-check: JSDoc types in client/ and engine/, must report 0 errors and 0 warnings
npm run format                # Prettier (tabs, single quotes); Markdown is left alone
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
- **Client.** The browser interface is **Svelte 5** with runes forced on (5.57.2), built by **Vite** (8.3.4), without SvelteKit. Its layout is in CONVENTIONS.md.
  - `client/` is Vite's root:
    - `index.html` is the shell;
    - `src/main.js` mounts `src/App.svelte`, which is the placeholder page until #25;
    - `src/lib/component-event.js` holds `ComponentEvent`;
    - `src/styles/` holds `tokens.css` (design tokens) and `base.css` (fonts and page);
    - `static/` is copied into the build as is: `fonts/` and `favicon.svg`.
  - `public/` is the build output that `server.mjs` serves. It is git-ignored; never edit it.
  - `scripts/dev.mjs` runs the Node server and Vite side by side. Vite proxies `/api` to the server.
  - The configuration lives in `vite.config.js`, `svelte.config.js` (`runes: true`), `jsconfig.json` (`checkJs`, `strict`, Vite client types), `.prettierrc` and `.prettierignore`.
  - The rules engine will live in `engine/` (#12 onward), shared by the server and the client.
- `tests/` holds `node:test` suites. Server tests import `server` and listen on port 0, so they never need fixed ports.

## Where the work stands

Updated 2026-10-20. Update this section whenever a milestone moves.

- **Done:**
  - Rules research (`docs/research/`).
  - The approved design document.
  - The approved desktop main game screen (`docs/ui/`).
  - The approved art style C (`docs/art/`).
  - All 43 issues filed in [serferdinand2/the-rug-game](https://github.com/serferdinand2/the-rug-game/issues).
- **#1, #2 and #44 are done.**
  - The Node server, tests and CI exist.
  - The client is a Svelte 5 app built by Vite. The page is a placeholder until #25.
  - Every unverified rule detail is decided in the README's "Rules conventions" (R1–R104).
- **Ready to start:**
  - #12 Encode the base game data. This is the first rules-engine issue, now unblocked.
  - #45 Check the 20 "owner-check" rules against the physical box. This is the owner's job and blocks nothing.
  - #46 Tidy up seven minor findings from the code reviews of #1 and #44. This blocks nothing.
  - #3 Design the remaining screens (assigned to lazar-milin).
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

- **Order.** Work milestone by milestone, M0 to M11, as shown by the `M… · …` labels and milestones.
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
  - The owner approves each art batch in the asset gallery (#4).
  - Keep asking for decisions that change what gets built, and record each answer in the design document.

## The README always shows the current interface

The owner's standing rule: whenever the interface changes, `README.md` must show the newest version in the same commit. This applies both to an approved mockup and to a built screen.

- Screenshots live in `docs/ui/screens/`. Replace them, and update the "Current interface" section and `docs/ui/README.md`.
- Mockups are regenerated with `node docs/ui/mockups/gen-tabs.mjs docs/ui/main-screen.html --standalone`. Serve `docs/ui/` over HTTP, for example with `python3 -m http.server 52990 --bind 127.0.0.1`, because some browser tools block `file://`. Then screenshot each `.sec .screen` element.
- Once the game exists, take the screenshots from the running game instead of the mockups.

## Decisions already made

The design document has the details. In short:
- **Tables.**
  - Online (table code), hot-seat and solo modes, for 1–5 players.
  - The creator of a table chooses its expansions and its version: the original 2019 printing, or the current official rules with all errata and adjustments.
  - The 2024 Revised Civilization Pack is out of scope.
  - A player who leaves keeps an "away" seat, as in Bird Table.
- **Bots.** The only bots are the official Automa and Shadow Empire, exactly as in the real game. There are no bot seats in multiplayer and no bot takeover of a seat.
- **Art.**
  - Style C: 64×64 pixel-art scenes in card frames, drawn as vector SVG with one `crispEdges` path per colour. The reference is `docs/art/style-c/lighthouse-scene.svg`.
  - Small pieces, such as resources, buildings, outposts, dice, terrain and landmark grid markers, are simple icons in the same palette.
  - The order is to design the interface first, then show every asset in a gallery page, then build the game.
- **Interface.** The main screen has a tabbed centre view (Tracks, Map, Capital, Cards, Players), a decision bar beneath it and a status panel on the right.
  - Tracks is the default view on your turn. Your next space on each track shows its cost.
  - The view switches by itself when a choice needs another tab.
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
  - Alagard for titles and VCR OSD Mono for the interface. The single copies, with their licence notices, are in `client/static/fonts/`. `docs/ui/main-screen.html` loads them from there.
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
- The 92 items marked **[UNVERIFIED]**, and every open question, are decided in the README's **Rules conventions** as stable rule ids **R1–R104**.
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
- [ ] Game rules live in `engine/`, never in the server or a component; engine functions are pure, return new state, emit events and throw `PlayerError` for player mistakes
- [ ] No `Math.random()` in game logic, because randomness is injected
- [ ] Svelte components:
  - a `<script module>` with `@typedef`, `@property` and `@example`;
  - `$props()` with a `/** @type {Props} */` annotation;
  - `{...attr}` spread on the root element, with `class` merged.
- [ ] Handlers are named `{action}Handler`; callback props are named `on{ComponentName}{Action}` and receive a `ComponentEvent`
- [ ] CSS classes use the `rg-{component}--{element|modifier}` BEM pattern; colours come from design tokens
- [ ] State uses `$state()`, `$derived()` (preferred) and `$effect()`; bindable props use `$bindable()`
- [ ] Phone and desktop widths are checked; reduced motion and the keyboard work
- [ ] Tests were written first and `npm test` passes; the commit references its issue; the README shows the current interface
