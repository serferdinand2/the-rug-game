# Automa and Shadow Empire (#31) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement official Automa and Shadow Empire bot seats, with setup allowing human/bot seat selection and the lobby choosing bot type, official decisions, shared map/scoring rules, and understandable bot action reports.

**Architecture:** Keep bot state in the existing seat model and route bot turns through the engine's operation stack, injected random source, public event stream, shared map and scoring. Keep bot-only state separate from human fields, and expose only public bot information in views. Allow each setup seat to be marked human or bot, choose the bot type in the lobby, and render bot actions in the existing `PlayerAction` surface using the approved green treatment and the exact decision cards used for that action.

**Tech Stack:** JavaScript with JSDoc, Svelte 5, existing operation/event engine, Vitest and GitHub Actions CI.

**Spec:** `docs/superpowers/specs/2026-11-08-automa-shadow-empire-issue-31-design.md`

## Global Constraints

- There is no separate solo-mode switch: setup selects human or bot seats, and the lobby selects a bot type. Preserve official player-count restrictions.
- #31 supports base-game bot rules only; expansion Automa modes stay with #34, #38 and #41.
- Automa is a typed engine seat and never receives human-only resources, capital, income mat, hand or player choices.
- Use the injected `random(n)` for all random decisions.
- Honour README Rules conventions R36–R42 and R59 over inferred research notes.
- The base Automa's face-down tapestry cards are a separate trap/multiplier system, not the player's income-turn-1 Ceremony gain, so `tapestry-draft` does not change them; `civ-draft` does not change the separate base Automa civ pool.
- Bot reports use greenish pixel-noise and border styling; human `PlayerAction` reports remain as they are. Display the exact decision-card pair that caused the bot action.
- Keep `README.md` current and update `docs/status.md` when issue #31 lands.
- Do not run the test suite locally. Add and maintain tests, push the working branch, and use GitHub Actions CI logs for verification and fixes.

## Review Focus

- Human/bot seat selection, lobby bot type, turn order, Automa starting map and all six levels — tests assert seats, starting territories, decks, initial decisions and level-specific settings.
- A bot turn reaches a human decision only when an official rule requires one — tests assert automatic operations settle, and no bot-owned player prompt stalls the game.
- Hidden information and view privacy — tests assert bot internals are stable/public as specified and other players' hands/secrets remain hidden.
- Bot interactions with player effects, neighbours, achievements, landmarks and shared territory — tests cover representative cross-seat effects and invariants.
- Bot event/card-report consistency — tests assert displayed cards match the exact decision pair recorded for the event and human reports retain current styling/data.

---

## File Map

- `src/lib/engine/state.js`: bot seat shape, seat lookup helpers and shared neighbour logic.
- `src/lib/engine/setup.js`, `src/lib/engine/table.js`, `src/lib/engine/view.js`: human/bot seat declarations, lobby bot type, table construction, turn order and public/private views.
- New focused Automa modules under `src/lib/engine/` and card data under `src/lib/engine/data/`: decision/progress decks, level schedules and deterministic bot procedures.
- `src/lib/engine/registry.js`, `src/lib/engine/stack.js`, `src/lib/engine/turn.js`, `src/lib/engine/after-setup.js`, and shared map/track/effect modules: automatic bot operations integrated with normal turns and rules.
- `src/lib/rooms.mjs` and the existing room/clock modules: admission, start, turn progression and human decision clocks.
- `src/lib/player-actions.js`, `src/lib/event-feed.js`, and `src/lib/components/board/PlayerAction.svelte`: bot action data and green report surface with generated decision cards.
- `src/lib/lobby.js`, `src/lib/components/lobby/PlaySettings.svelte`, `SeatCard.svelte`, `src/lib/area/players.js`, `src/lib/game-names.js`, `src/lib/turn.js`, and decision-word/kind modules: human/bot seat selection, lobby bot type/level selection, bot seat names/chips, footer and prompt text.
- New focused tests in `tests/engine-automa.test.mjs`, `tests/engine-shadow-empire.test.mjs`, `tests/rooms-automa.test.mjs`, and updates to `tests/client-player-actions.test.mjs`, `tests/client-lobby.test.mjs`, plus existing simulation helpers.
- `README.md`, `docs/status.md`: shipped behavior and issue status.

## Task 1: Define and test bot seat invariants

**Files:**
- Modify: `src/lib/engine/state.js`, `src/lib/engine/view.js`
- Test: new `tests/engine-automa.test.mjs`

**Interfaces:** Preserve `seatOf(state, seat)`, `isPlayerSeat(state, seat)`, `playerSeat(state, seat)`, and `neighbours(state, player)`. Add only the smallest helpers needed to distinguish Automa and Shadow Empire from player seats.

- [ ] Add tests asserting Automa and Shadow Empire seats have no player-only fields, playerSeat rejects them, and neighbours include bots when rules require.
- [ ] Implement typed seat helpers and keep view serialization free of hidden human fields while exposing intended bot state.
- [ ] Commit the invariant layer before setup consumes it.

## Task 2: Implement base Automa and Shadow Empire data

**Files:**
- Create: `src/lib/engine/automa.js`, `src/lib/engine/shadow-empire.js`, and focused data modules under `src/lib/engine/data/`
- Modify: `src/lib/engine/registry.js`, `src/lib/engine/kinds.js`
- Test: `tests/engine-automa.test.mjs`, `tests/engine-shadow-empire.test.mjs`

**Interfaces:** Export data constructors and automatic operation handlers through the existing registry. Each bot decision operation must carry its exact card data and use `Context.random`; emitted events must identify the actor and source decision pair.

- [ ] Add tests for base decision/progress decks, all six difficulty schedules, four base Automa civs, 12-card Shadow Empire deck, shuffle/discard/reshuffle, and deterministic draws with a fixed random source.
- [ ] Add tests for each official decision-card field: both track indicators, tie-break order, hex pattern, income symbol and topple symbol.
- [ ] Implement immutable source data and serializable draw/discard state; ensure the selected pair is the single source for action execution and later display.
- [ ] Commit deck and decision data with deterministic engine coverage.

## Task 3: Add human/bot seat setup and lobby bot choices

**Files:**
- Modify: `src/lib/engine/setup.js`, `src/lib/engine/table.js`, `src/lib/engine/after-setup.js`, `src/lib/lobby.js`
- Test: `tests/engine-automa.test.mjs`, `tests/client-lobby.test.mjs`

**Interfaces:** Keep the existing `checkOptions()` and `createGame()` entry points. Extend their options using validated, serializable mode/level values and construct bot seats through the typed-seat helpers from Task 1.

- [ ] Add tests for seat declarations as human/bot, lobby selection of Automa or Shadow Empire, one-human + Automa starting territories, and official Shadow Empire player-count restrictions.
- [ ] Add rejection tests for expansion combinations, invalid difficulty, solo Arts track per R59, invalid player count/mode combinations, and unsupported bot variants.
- [ ] Implement validated seat kinds, bot type and Automa level in engine/lobby configuration; ensure the ordinary multiplayer setup remains unchanged. Defer visible controls and bot seat chips until Task 8, after mockup approval.
- [ ] Commit setup integration.

## Task 4: Run automatic bot turns through shared rules

**Files:**
- Modify: `src/lib/engine/turn.js`, `src/lib/engine/after-setup.js`, `src/lib/engine/registry.js`, `src/lib/engine/loop.js`, shared `map.js`, `movement.js`, `outposts.js`, `achievements.js`, `income.js`, and relevant effect modules as required by shared seat support
- Test: `tests/engine-automa.test.mjs`, `tests/engine-shadow-empire.test.mjs`

**Interfaces:** Bot-turn handlers enqueue operations on the existing stack; they do not bypass `run`, clone a parallel game model, or call player-only decisions. Automatic effects use the shared map/track handlers wherever the rules permit.

- [ ] Add tests for each bot income step, track advance and listed benefits; assert bot-only benefits do not create human resources/buildings/cards.
- [ ] Add map tests for explore/conquer targets, distance/tie-breaks, fixed solo starts, territory control, outpost placement/toppling and legal landmark pickup.
- [ ] Add Shadow Empire tests for its official action selection, reversed tie-break direction, 12-card deck, landmark-only gains and track-completion achievements.
- [ ] Add tests for neighbour-dependent player effects when a bot is the nearest/first neighbour: first-neighbour income bonus, tech prerequisites, Oil Magnate/Coal Baron/Steam Tycoon, opponent-based tapestry VP and effects, The Chosen/Historians/Traders/Architects, and `placeLandmark` behavior.
- [ ] Add tests proving player conquer never asks a bot defender for a response; test Automa face-down trap handling, automatic bot income turn 1 and bot turns stopping after income turn 5.
- [ ] Implement automatic turns as operation sequences that settle to completion before a human response is requested.
- [ ] Commit shared-rule bot execution.

## Task 5: Apply versions, variants, scoring and end conditions

**Files:**
- Modify: `src/lib/engine/setup.js`, `decks.js`, `ranking.js`, `game.js`, and bot modules from Tasks 2–4
- Test: `tests/engine-automa.test.mjs`, `tests/engine-shadow-empire.test.mjs`, `tests/engine-game-end.test.mjs`

**Interfaces:** Read game versions and variants from the same validated state used by human turns. End-game and rank calculations must receive all seats, while applying bot-specific scoring rules from R36–R42 and R59.

- [ ] Add tests for version differences, official base scoring, income multipliers, traps, achievements, Automa landmarks, Shadow Empire non-winning status and final ordering/tie-breaks.
- [ ] Add tests confirming `tapestry-draft` does not alter the Automa's trap-pool or mat-multiplier card procedure; the variant remains applied to human Ceremony draws.
- [ ] Add tests for `civ-draft`: the base Automa's separate civ pool is unchanged; confirm normal player draws still follow the existing variant implementation.
- [ ] Implement only source-backed exceptions; defer README updates to Task 9.
- [ ] Commit rule parity and scoring.

## Task 6: Make rooms, clocks and public views handle bots

**Files:**
- Modify: `src/lib/rooms.mjs`, relevant room turn/clock modules, `src/lib/engine/view.js`
- Test: `tests/rooms-automa.test.mjs`, existing `tests/rooms*.test.mjs`, `tests/client-api.test.mjs`

**Interfaces:** Preserve existing room play and timeout contracts. Bot actions are public events. Clocks accrue only to humans who must answer a decision; autonomous bot turns do not consume a human decision timer.

- [ ] Add tests for room creation/join/start with solo and two-human Shadow Empire modes, room state recovery, bot action broadcast to every human and correct active-seat progression.
- [ ] Add tests proving no clock starts for a bot turn and the correct human clock starts when a bot effect requires that human to answer.
- [ ] Add view tests for bot public fields and privacy of human hands, choices and civilization/tapestry drafts.
- [ ] Implement room and clock integration; preserve existing normal multiplayer contracts.
- [ ] Commit room lifecycle support.

## Task 7: Build and approve the lobby and action-report mockup

**Files:**
- Create: clickable mockup under `docs/ui/` with a companion screenshot
- Reference: `src/lib/components/board/PlayerAction.svelte`, `src/lib/components/lobby/PlaySettings.svelte`, existing pixel-noise tokens and card components

**Interfaces:** Show human/bot seat selection at setup, the lobby's Automa/Shadow Empire type and Automa level choices, plus a bot action report corresponding to the eventual `PlayerAction` data: bot name/action text, greenish pixel-noise background and green border, plus the exact revealed track and tie-break cards used for the move. Keep human reports as a comparison only if useful; do not redefine their appearance.

- [ ] Build a clickable mockup containing human/bot seat choice, lobby bot type/level choices, bot seat labels, and at least one representative bot move with its generated decision-card pair, using the same card art/components and noise treatment as the game.
- [ ] Open the mockup for owner review and obtain visual approval before changing product UI.
- [ ] Record any approved card sizing/placement changes in this plan before implementation.

## Task 8: Implement bot action feed and lobby presentation

**Files:**
- Modify: `src/lib/player-actions.js`, `src/lib/event-feed.js`, `src/lib/game-names.js`, `src/lib/area/players.js`, `src/lib/turn.js`, `src/lib/decision-kinds.js`, `src/lib/decision-words.js`, `src/lib/components/board/PlayerAction.svelte`, `src/lib/components/lobby/PlaySettings.svelte`, `src/lib/components/lobby/SeatCard.svelte`, and lobby files from Task 3
- Test: `tests/client-player-actions.test.mjs`, `tests/client-event-feed.test.mjs`, `tests/client-lobby.test.mjs`, `tests/client-game-names.test.mjs`, `tests/client-area-players.test.mjs`, `tests/client-footer.test.mjs`, `tests/client-decision-kinds.test.mjs`, `tests/client-decision-words.test.mjs`

**Interfaces:** Bot event projection creates `PlayerActionItem` data from public events and includes the exact decision-card pair stored by the engine. `PlayerAction` selects bot styling from actor kind; existing human-action fields and visual behavior remain intact.

- [ ] Add tests for bot event projection, card-pair correspondence, every-human visibility and unchanged human report output.
- [ ] Add tests that `seatName`, `playerChips` and `footerView` identify bot seats consistently; add decision-kind and decision-word entries for any new prompt kind actually required by bot-facing rules.
- [ ] Implement greenish border/noise styles and the approved responsive card pair layout using established component classes/tokens.
- [ ] Add lobby bot labels and player chips if not completed in Task 3; avoid presenting bots as human seats in controls.
- [ ] Commit the approved UI treatment.

## Task 9: Scripted solo game, randomized simulation and documentation

**Files:**
- Modify: `tests/helpers/simulation.mjs`, `tests/helpers/simulation-worker.mjs`, `tests/simulation*.test.mjs`, `README.md`, `docs/status.md`

- [ ] Add a scripted one-human + Automa game covering setup through game end and randomized simulations across all six levels and supported bot/variant combinations.
- [ ] Extend state/view invariants to check bot seat validity, operation settlement, no impossible bot choices, no leaked private player data and valid final scoring.
- [ ] Update README to explain available solo/Shadow Empire table options and bot report presentation.
- [ ] Update `docs/status.md` when issue #31 is ready to land.
- [ ] Push the branch and use GitHub Actions as the test authority; inspect CI logs, fix any failures, push fixes, and wait for a clean run. Do not run tests locally.
- [ ] Commit final integration only after hosted checks pass; then follow the agreed merge process.
