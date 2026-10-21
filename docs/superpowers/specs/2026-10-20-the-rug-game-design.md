# The Rug Game: design and build plan

Date: 2026-10-20. Status: approved by the owner. Every item in the build plan is filed as a GitHub issue with the same number in [serferdinand2/the-rug-game](https://github.com/serferdinand2/the-rug-game/issues) (#1–#43), with blocked-by links that enforce the order.

Items marked **(my call)** are decisions I made that the owner has not confirmed. Everything else is either the owner's decision or comes from the sibling projects the owner said to copy.

## 1. What this is and why

The Rug Game is a browser version of Stonemaier Games' Tapestry with every official expansion. The owner wants it to:
- keep the original theme: civilizations growing from early history into the future;
- use the same setup and approach as Fablewood Rummy and Bird Table (`../fablewood-rummy`, `../birdcard-ripoff`);
- look like those games;
- meet the same goals: friends playing together online, on one shared screen, or alone against the official solo opponents.

The rules come from the research in `docs/research/`.

## 2. Goals

1. Play a full game of Tapestry, with 1–5 players, in a browser:
   - **online**, with a table code;
   - **hot-seat**, sharing one screen;
   - **solo**, against the official Automa and Shadow Empire.
2. Base game plus Plans & Ploys, Arts & Architecture and Fantasies & Futures.
3. **Table setup (owner).** Whoever creates a table chooses which versions and expansions that table uses. Any combination of expansions works, as the official rules allow. Versions are:
   - **Original 2019 printing:** civilizations exactly as printed, and the 2019 rulebook.
   - **Current official rules:** the Fantasies & Futures integrated rulebook, with all errata, rule amendments and the official civilization adjustment list.
   - My reading of "versions" is a guess that the owner can correct.
   - The 2024 Revised Civilization Pack is not offered. Our only source for it is Stonemaier's draft sheet, whose printed wording changed afterwards, and the two revised capital mats it ships are unknown. Revisit it if the printed pack becomes available. **(my call)**
4. The server enforces every rule. The browser only displays the game and sends choices.
5. Illustrations in the owner's chosen style C: 64×64 vector pixel-art scenes with sky, setting and detail, inside card frames like Fablewood's.
6. The same table comforts as the sibling games:
   - a turn timer and undo, both set by the host;
   - leaving and rejoining a table. As in Bird Table, a player who leaves a running game keeps their seat as "away" and can return with the table code. **(my call)**
   - open tables listed on the landing page;
   - a table log, a scoreboard and sound cues that start muted.
7. It runs as a Discord Activity, like Bird Table and BugTile. **(my call)** This is the last milestone, so dropping it costs nothing earlier.

## 3. Non-goals and anti-goals

- **Non-goals:**
  - no bots outside the official solo rules: no bot seats in multiplayer games and no bot taking over a human's seat (owner);
  - no Revised Civilization Pack (see goal 3);
  - no accounts, database or saved games;
  - one server process, with tables kept in memory (same as the siblings);
  - no Plans & Ploys solo campaign or Fantasies & Futures Kaiju scenarios;
  - no spectators.
- **Anti-goals,** which would count as failure even if the game technically works:
  - rules enforced only in the browser;
  - any player able to see another player's hand or the order of the decks;
  - official Stonemaier logos, artwork or rulebook text. Card text is written in our own words, with every number kept exact;
  - a game that only plays on a large desktop screen.

## 4. Decisions about how it is built

From the sibling projects (owner: "same setup and approach"):
- **Server and code:**
  - Node.js 22.12+ (Vite 8 needs it). No runtime packages on the server or in the rules engine.
  - **The browser client is Svelte 5 (runes) built with Vite, without SvelteKit** (owner, 2026-10-20).
    - Written in JavaScript with JSDoc; the rules are in `CONVENTIONS.md`.
    - Sources are in `src/`, with the pages at the root, and build into `public/`, which a single `server.mjs` serves. The layout follows the owner's own Svelte projects: components in `src/lib/components/<area>/`, shared modules in `src/lib/`, and `static/` at the root. **(owner, 2026-10-21)**
    - This replaces Fablewood's "no build step" rule for the client only.
  - The rules engine is DOM-independent, lives in `src/lib/engine/`, and is shared by the server and the browser.
  - Every response goes through `view()`, which hides private information.
  - `PlayerError` carries the messages meant for players.
  - Clients long-poll `GET /api/state?since=<version>`, and stale moves are rejected with 409.
- **Tests and config:**
  - Tests run with `node --test`, and GitHub Actions runs them too.
  - The rate limits and `.env` settings work like Fablewood's.
- **Art and licence:**
  - Phase-one UI fonts (2026-10-21): Cinzel for named game elements and Atkinson Hyperlegible for players, instructions, controls and data. Both are self-hosted in `static/fonts/` with their SIL Open Font License notices. Alagard and VCR OSD Mono are kept only for the archived mockup.
  - Art is vector pixel SVG, using one crispEdges path per colour. Production notes live in `docs/art/`, never in `public/`.
  - Licence: GPL-3.0-only, like the siblings. **(my call)**

New for this game:
- **Choices as data.** Almost every Tapestry effect asks the player something: which resource, which hex, which card. **(my call)**
  - Effects are written as data, for example `gain any 1`, `explore`, `conquer`.
  - The engine keeps a list of pending decisions, each owned by one player.
  - An action answers the top pending decision.
  - Decisions can belong to a player whose turn it isn't, such as a trap response during someone's conquest.
  - The browser draws whatever decision is on top. The Automa and the timer answer the same decisions.
- **Solo opponents (owner).** The Automa and Shadow Empire work exactly as in the real game, including setup, the decision deck, difficulty levels, Automa civilizations and scoring.
  - Solo means one human against the Automa and the Shadow Empire, on the map side the rules require.
  - In a two-human game the table may add the Shadow Empire, as the official 2-player variant allows.
  - The state model allows for the Automa from the start, because it has no capital city, income buildings or resources.
- **Timeouts.** When a player's timer runs out, the server makes the default legal choice: take an income turn when choosing a turn type, otherwise the first legal option. **(my call)**
- **What the owner can check.** The owner has the original Tapestry, but no expansions.
  - Base-game [UNVERIFIED] items get checked against the owner's copy.
  - Expansion items that no source shows are left out, never invented. Examples: the unknown 15th Plans & Ploys tapestry card and the Polluters Automa civilization. The README lists what is missing, and the items get added if a source turns up. **(my call)**
- **Art.** The owner chose style C.
  - Style C is used for every illustration: civilizations, tapestry cards, tech cards, landmarks, masterpieces, space tiles and landmark cards.
  - Small game pieces use simple pixel icons in the same palette: resources, income buildings, outposts, dice, terrain and track symbols. The comparison page showed that a 64×64 scene can't be read at 24px. **(my call)**
  - Each landmark's picture is drawn in the shape of its footprint (32 pixels per plot), and the same picture is shown on its card and on the capital-city grid. **(owner, 2026-10-21)**
  - The owner reviews each art batch in the asset gallery before it is merged. Since 2026-10-21 the asset gallery is the Art part of the component library page (`/components.html`, #48), drawn live from the art toolkit. **(owner, 2026-10-21)**
  - A component library page shows every interface component in all its states, built from the phase-one mockups; components show placeholders until their art lands. **(owner, 2026-10-21)**
- **Interface (owner).** The approved designs live in `docs/ui/`.
  - Phase-one handoff, 2026-10-21: a compact full-width header and turn footer enclose a 3/4 shared Tracks/World Map region and 1/4 player-tab region. Clicking header players opens the player overview in the same split. Launch and lobby are included. The UI/UX manifest in `docs/ui/README.md` supersedes the earlier five-tab centre design.
  - Tracks is the default shared view. The phase-one mockup shows tier prices above pointed tiles, player progress lanes below, and a footer selection/commit/optional-action example. See the manifest for exact visual and interaction roles.
  - The view switches to whatever the current engine decision needs; the prototype demonstrates only selected examples. Phase two still covers income turns, the remaining decisions and results.
  - There is no phone layout. The game is for desktop screens only. The owner decided this on 2026-10-21, while #3 was in progress.
  - Cinzel names game elements; Atkinson Hyperlegible names players and carries instructions, controls and data.
  - `src/styles/tokens.css` is the single source of truth for colours, texture, type, spacing, borders, shadows and motion, taken from the phase-one mockups with one value per role. Where a mockup disagrees, `tokens.css` wins. **(owner, 2026-10-21)**
  - One set of player colours: the play page's brighter set, with purple for seat five. The lobby's earlier set reused the track colours, and players and tracks must stay separate colour systems. Corners are square everywhere. **(my call, 2026-10-21)**
  - The lobby bot controls describe seat/host interactions only. Which bots are supported remains governed by the existing bot policy; the designer explicitly deferred that implementation decision.
  - The lobby's **Add bot** seat control is shelved: it is not built for now, and an empty slot offers only **Open seat**. **(owner, 2026-10-21)**
- **Naming** **(my call)**
  - "The Rug Game", with the default port 3020.
  - Civilization and card names stay as in Tapestry, because they are ordinary words. Only the art and wording are our own.
- **Unverified rules.** The research has about 95 [UNVERIFIED] items, mostly icon details. Each one is settled deliberately in issue 2, listed under "Rules conventions" in the README and covered by a test. Answers are never guessed silently in code.
  - The base-game decisions marked owner-check are settled against the Board Game Arena implementation (code, data and component images) instead of the physical box, so the rules engine can start. The two that BGA can't answer, R12 (landmark heights) and R39 (decision-card arrows), stay with the owner in issue 45, which blocks nothing. **(owner, 2026-10-21)**

## 5. How much there is

| Content | Base | P&P | A&A | F&F | Total |
|---|---|---|---|---|---|
| Civilizations | 16 | 10 | 5 | 10 | 41 |
| Tapestry cards | 43 + trap | 13 | 20 | 38 | 115 different pictures |
| Tech cards | 33 | – | 11 | 12 | 56 |
| Landmarks | 18 | 7 | 8 | – | 33 |
| Landmark cards | – | 5 | 5 | – | 10 |
| Space tiles | 15 | 4 | – | – | 19 |
| Capital mats | 6 | – | 6 advanced | 6 advanced | 18 |
| Masterpieces | – | – | 20 | – | 20 |

That is 294 illustrations and about 260 rules entries. The full asset catalog, with icons and boards, is in [2026-10-21-art-toolkit-design.md](2026-10-21-art-toolkit-design.md).

After #2, some content that no source shows is left out. The full tapestry deck is 121 cards instead of 123: two Plans & Ploys cards are missing. Some solo content is missing too, and the Automa can't play with the arts track. The README's "Rules conventions" lists all of it.

## 6. Build plan: milestones and issues

Each numbered item becomes one GitHub issue, and each milestone becomes a GitHub milestone. The owner set the order:
1. Plan the interface for the best gameplay.
2. Build a page showing every asset (illustrations, icons and boards) and approve it.
3. Build the game.

Every issue is done when:
- its "Done when" line is true;
- `npm test` passes;
- any interface change has been checked at desktop width.

### Milestone 0: Groundwork

1. **Set up the project like Fablewood.**
   - `package.json` (start and test scripts), `server.mjs` serving `public/` safely, `limits.mjs`, `.env.example`, the GitHub Actions test workflow, the GPL licence, the README and `AGENTS.md`.
   - Done when: `npm start` serves a placeholder page and `npm test` runs.
2. **Settle the unverified rules.**
   - Check the base-game [UNVERIFIED] items against the owner's copy of Tapestry.
   - Decide the remaining ones deliberately. For expansion content no source shows, record "left out".
   - Write everything into a "Rules conventions" section of the README.
   - Done when: every flag has a written decision.

### Milestone 1: Interface design

3. **Design every screen.**
   - Approved mockups for:
     - the landing page;
     - the new-table setup (mode, versions, expansions, solo difficulty, timer and undo);
     - the lobby;
     - the main game screen;
     - every kind of decision prompt;
     - the income-turn sequence;
     - inspecting other players;
     - the end-of-game results.
   - Save them in `docs/ui/` with notes on behaviour.
   - Progress: the desktop main game screen was approved on 2026-10-20 and is in `docs/ui/README.md`.
   - Done when: the owner has approved every screen.

### Milestone 2: Assets (style C)

4. **Art toolkit and asset catalog.** The design is in [2026-10-21-art-toolkit-design.md](2026-10-21-art-toolkit-design.md).
   - A pixel-painter library producing crispEdges SVGs, based on the lighthouse prototype.
   - A shared palette and reusable scene parts (skies, sea, terrain, buildings, figures).
   - A catalog of every asset with a stable id, grouped by type and expansion.
   - Done when: the catalog lists every illustration, icon and board, and the lighthouse is rebuilt with the toolkit.
5. **Icons and small pieces.**
   - Resources, the four income buildings, outposts, player tokens, dice faces, terrain, and the track symbols (including arts).
   - No separate capital-grid markers for landmarks: the grid shows each landmark's own picture (owner, 2026-10-21).
6. **Boards.**
   - Map terrain and both map sides, the track board, all 18 capital mats, the income mat with its overlays, and the table background.
7. **Landmarks:** 33 pictures, each drawn in its footprint's shape so it covers exactly its plots on the board ([2026-10-21-landmarks-design.md](2026-10-21-landmarks-design.md)).
8. **Civilizations:** 41 portraits.
9. **Tapestry cards:** 115 illustrations, in batches by set.
10. **Tech cards:** 56 illustrations.
11. **Other cards and tiles:** 20 masterpieces, 10 landmark cards, 19 space tiles and the inspiration tiles.

Each art issue (5–11) is done when:
- every picture in it is shown in the gallery (47);
- the owner has approved it there.

Added on 2026-10-21, when issue 4 was split:

47. **Card frames and card gallery page** (split from 4 on 2026-10-21; waits for the new interface base from 3).
   - Card frames in the new interface style.
   - One page that shows every asset, grouped by type and expansion. Assets not drawn yet appear as labelled empty slots, so progress is visible.
   - The same page is the players' card reference during a game. It shows card text once the rules data exists. **(owner, 2026-10-21)**

### Milestone 3: Base game rules engine (no interface)

12. **Base game data.**
    - Turn the research into data modules: the 48 track spaces, income mat, 6 capital mats, both map sides, 48 territory tiles, 15 space tiles, 18 landmarks with footprints, and the achievements.
    - Both versions are included: the original 2019 printing and the current official rules.
    - Done when: tests check every count and spot-check values against the research.
13. **Engine core.**
    - Game state; `createGame()` for 1–5 players, with setup by player count, version and expansions.
    - Resources capped at 8, VP, turn order, and the pending-decision list.
    - Actions answer decisions; `view()` hides private information; events are typed and carry `seq`.
    - Done when: a new game sets up correctly for every player count, and illegal actions are rejected with `PlayerError`.
14. **Advance turns.**
    - Paying tier costs, moving on a track, benefits and optional bonuses, and the first player into a tier taking its landmark.
    - The research die and track ends.
    - Done when: all 48 spaces are covered by tests.
15. **Income turns and game end.**
    - Eras 1–5 and their steps, the first-of-neighbours bonus, VP scoring from the income mat, and income.
    - Players finishing at different times, the game end, and each version's tiebreaker.
    - Done when: a scripted 2-player game reaches the end with the expected scores.
16. **Capital city.**
    - Placing income buildings and landmarks on the 9×9 grid, with footprints, rotation as settled in issue 2, and impassable plots.
    - Completing a district gives a resource; overflow landmarks go beside the mat.
    - Done when: placement rules and district rewards are tested on all 6 mats.
17. **Map: explore and conquer.**
    - Territory tiles and matched-edge scoring, outposts, conquering with both dice, toppling, traps as responses, control, and space tiles.
    - Done when: tests cover each conquer outcome and a trap response.
18. **Tech cards.**
    - Inventing, the three face-up cards, upgrading through the rows, conditions that compare you with your neighbours, and landmark tech cards.
    - Done when: all 33 cards' benefits and upgrade conditions are tested.
19. **Tapestry cards and achievements.**
    - All 43 cards plus traps, played immediately or for the era; the 3 achievements.
    - Done when: every card has at least one test.
20. **Base civilizations.**
    - All 16, as printed and with the official adjustments.
    - Done when: every civilization has a test in both versions.
21. **Full-game simulation test.**
    - Random legal play from setup to the end, for 1–5 players and both versions.
    - After every action it checks that every card, tile and token is accounted for and that `view()` leaks nothing private.
    - Done when: 200 random games finish without errors.

### Milestone 4: Tables and server

22. **Table lifecycle.**
    - Create, join, leave and start; host hand-over; online, hot-seat and solo modes.
    - Per-table versions and expansions chosen at creation; table codes; the open-tables list; expiry and table limits.
    - Away seats, as in Bird Table.
    - Done when: room transitions are covered by randomized invariant tests.
23. **Server API.**
    - Long-polling state, moves with version checks, rate limits and safe static serving.
    - Done when: a two-client HTTP test plays a short scripted game and stale moves get 409.
24. **Timer and undo.**
    - A host-set turn timer with off, 1, 2 or 5 minutes, because Tapestry turns are long. Timeouts make the default legal choice. **(my call)**
    - Undo inside your own turn, but never past a die roll or a card draw.
    - Done when: tests cover a timeout and an undo blocked after a roll.

### Milestone 5: Playable base game

Built to the approved designs from issue 3, using the assets from milestone 2.

25. **Landing page, new-table setup and lobby.**
26. **The shared board:** map, tracks, landmarks and achievements.
27. **Player area:** civilization, income mat, capital city, tech cards, hand and resources, plus inspecting other players.
28. **Decision prompts.**
    - Every kind of pending decision.
    - Done when: a full base game can be played with the mouse alone.
29. **Table log, scoreboard, results, sound and motion.**
    - Event-driven, as in Bird Table: no replay after a refresh, and no motion when the reduce-motion setting is on.
30. **Hot-seat pass screen.**
    - Done when: a hot-seat game never shows one player's hand to the next player.

Added on 2026-10-21:

48. **Components library page** (added 2026-10-21). A page that shows every interface component in each of its states. Each new component is added to it in the same change.

### Milestone 6: Solo play

31. **Automa and Shadow Empire,** exactly as in the real game.
    - Setup, the decision deck, all difficulty levels, the base Automa civilizations and scoring.
    - The Shadow Empire variant for two humans.
    - Done when: a scripted solo game follows the official procedure step by step, and random solo games finish without errors.

### Milestone 7: Plans & Ploys

32. **Rules:** landmark cards and their opening draft, the new space tiles, and the rule amendments.
33. **Content:** 10 civilizations and the known tapestry cards, with tests.
34. **Automa:** the Plans & Ploys Automa civilizations.

### Milestone 8: Arts & Architecture

35. **The arts track:** the 5th track, the d20 science die, masterpieces and inspiration tiles. Cards that mention arts are removed when the track is off.
36. **Advanced capital mats:** the 6 mats, with the basic-plus-advanced draw.
37. **Content:** 5 civilizations, 20 tapestry cards, 11 tech cards and 5 landmark cards, with tests.
38. **Automa:** the replacement decision cards, the Automa civilizations and the income cards.

### Milestone 9: Fantasies & Futures

39. **Rules:** charms, reservations for income turn 5, income-mat overlays and the 5 replacement cards.
40. **Content:** 10 civilizations, 38 tapestry cards, 12 tech cards and 6 advanced capital mats, with tests.
41. **Automa:** the Charmers, Erratics and Time Travelers Automa cards.

Added on 2026-10-21:

49. **Cloud Colonies** (added 2026-10-21). The 38th Fantasies & Futures tapestry card, at first left out by R77 because no source lists which base territories show clouds. The same day the owner had the cloud pictures read from BGA's territory-tile and board images (R77), so the card is back; this issue adds it. The territory-tile and map art (#6) must show clouds on exactly those territories. **(owner, 2026-10-21)**

### Milestone 10: Rules pages

42. **Rules pages:** a "How to play" panel and a reference for each civilization and card, written in our own words. The reference text appears on the card gallery page (47).

### Milestone 11: Discord Activity

43. **Run as a Discord Activity,** as in Bird Table: the bundled SDK, OAuth login on the server, and identity-based seats.

## 7. How the issues get filed

- One issue per item above, in this order, using the layout of the existing repositories:
  - an **Issue** section with an **Example**;
  - **Current problem**;
  - **Proposed solution**, with the "Done when" check;
  - **Related issues**, naming what it depends on.
- Labels: `enhancement` for all of them, plus `documentation` for issues 2, 3 and 42. The repository's existing label set has no area labels, matching Fablewood.
- One GitHub milestone per section above.
- Commits and pull requests reference their issue number, as in Fablewood.

## 8. Left to the builder

- File layout inside `public/`, the effect-data format, and the internal state shape.
- How to split large issues (for example card batches) into pull requests.
