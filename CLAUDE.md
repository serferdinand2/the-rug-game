# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

The Rug Game will be a browser version of Stonemaier Games' **Tapestry** (2019). It keeps Tapestry's original theme: civilizations advancing through eras on the exploration, science, technology and military tracks, plus arts with Arts & Architecture. It will include every official expansion.

The project's owner set three requirements:
- Use the same setup and approach as the sibling projects Fablewood Rummy and Bird Table.
- Use the same pixel-art style as those games.
- Meet the same goals as those games.

**Current state:** research only. There is no code, `package.json`, test suite or git repository yet. Before writing code, finish the design conversation, write a design document and get the owner's approval. Then plan the build in playable stages: base game, bots, Plans & Ploys, Arts & Architecture, then Fantasies & Futures. Each stage is large.

## Reference projects

These sibling directories under `~/Work` define the setup to copy. Read their `CLAUDE.md` before scaffolding anything, and never modify them.

- `../fablewood-rummy` is the closest template:
  - Node.js 22.9+, no runtime packages and no build step.
  - A DOM-independent rules engine in `public/engine.js`, shared by the server and the browser.
  - `server.mjs` with in-memory rooms keyed by table codes, rate limits in `limits.mjs`, and every response filtered through `view()`.
  - Online, hot-seat and bot practice modes, with host controls for timer and undo.
  - Tests run with `node --test tests/*.test.mjs`.
  - Alagard and VCR OSD Mono fonts.
  - Vector pixel-art SVGs, produced with `tools/px2svg.py`.
  - Art prompts are kept in `docs/art/`, outside `public/`.
- `../birdcard-ripoff` (Bird Table) adds:
  - Running as a Discord Activity.
  - Long polling with `GET /api/state?since=<version>`.
  - Typed per-move events driving animation, sound and the table log.
  - Pure room transitions with randomized invariant tests.
- `../bugtile-ripoff` (BugTile) shows host-selectable, combinable expansions.

## Rules research (`docs/research/`)

These files are the rules source for the engine. Use them instead of researching Tapestry again.

- `01-base-core-rules.md` covers setup, the four tracks space by space, income turns, the income mat, capital cities, the map, conquering, achievements, scoring and the official FAQ.
  - Its §6 and appendices A and B have all 6 capital-mat grids, the pre-printed map hexes and all 48 territory tiles.
  - `02-base-content.md` §6–7 is incomplete on these, so take them from 01.
- `02-base-content.md` covers:
  - The 16 base civilizations and their balance adjustments.
  - The 43 tapestry cards plus 7 traps.
  - The 33 tech cards and 18 landmarks with footprints.
  - The full Automa and Shadow Empire solo procedure.
- `03-expansions.md` covers Plans & Ploys, Arts & Architecture, Fantasies & Futures, the 2024 Revised Civilization Pack, and the setup-adjustment history.
  - Its §7 holds the cross-expansion combination rules, for example:
    - Removing cards that mention the arts track when that track is off.
    - Never mixing basic and advanced capital mats.
    - Using the d20 science die when the arts track is in play.
  - There are no promos.

How to read the research files:
- Effects are paraphrased, with every number kept exact.
- Source tags show where a fact came from. The trust order is: the Fantasies & Futures integrated rulebook, then the Plans & Ploys rulebook and the Stonemaier FAQ, then the base rulebook, then the printed art, then the open-source Board Game Arena implementation.
- A civilization uses either its original mat with the Fantasies & Futures adjustment list, or its revised mat with no adjustments. Never mix both for one civilization.
- Items marked **[UNVERIFIED]** are working assumptions. When the engine depends on one, choose a rule deliberately, cover it in tests and record it as a rules convention. Bird Table's `README.md` and `CLAUDE.md` show how. Known cases:
  - Nothing official breaks a tie left after the tallest-landmark tiebreaker.
  - One Plans & Ploys tapestry card is known only by a partial name.
  - The Polluters civilization's text is incomplete.
  - Landmark rotation is unconfirmed.

## Open decisions

The owner has not settled these. Ask before assuming them:
- **Artwork.** Will the owner generate images themselves, as with Fablewood's OpenAI images converted through `px2svg.py`, or should the art be code-drawn pixel SVG?
- **Discord Activity.** Should the game run inside Discord, like Bird Table and BugTile?
- **Expansions.** Can the host toggle each expansion on and off?
- **Bots.** Should the official Automa and Shadow Empire act as the practice bots?
- **Name and branding.** Should the game be called "The Rug Game" and ship without Stonemaier logos or artwork? The sibling projects ship no official art.

`.playwright-mcp/` holds browser-session logs from earlier exploration, not project files. Leave it out of version control.
