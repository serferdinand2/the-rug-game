# The decision prompt in one place, always centred (#79) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every decision prompt opens at the screen's centre (a shelf of cards above it as one stack), except a choice on the map while the Map view shows, and the prompt lives in one screen part with its words from a tested function.

**Architecture:** `panelControls` in `src/lib/prompts.js` gives the panel's words and Confirm state. `PromptState` in `src/lib/prompt-state.svelte.js` owns the prompt's selection, keyed to the decision, and derives what the board, the player area, the footer and the dice tray need. `src/screens/game/DecisionPrompt.svelte` renders the one `DecisionPanel`. `DecisionPanel` centres by default, with the shelf and panel as one stack; `DiceTray` takes a `panel` prop from the game instead of reading the panel's class.

**Spec:** `docs/superpowers/specs/2026-10-28-decision-prompt-design.md`

## Global Constraints

- docs/conventions.md throughout; `npm run check` 0 errors and 0 warnings; tests first, watched failing.
- No visible change to any prompt until Task 5; Tasks 1–4 are a refactor the existing browser tests pin.
- The owner approves the centred stack in the library (Task 5) before the docs and screenshots say it is the game's (Task 7).
- Commits: `Refs #79: …`, the last `Fix #79: …`.

## Tasks

- [ ] **1. `panelControls`.** Tests in `tests/client-prompts.test.mjs` for each status, warning, confirm label, Confirm state, cancel label and action, confirm action and content flag that `Game.svelte`'s ternaries give today (options, picked answer, pick with items and rows, trade offers, chosen offer with and without picks, explore, docked map choice with a hex, sending). Then the function.
- [ ] **2. `PromptState`.** Tests in `tests/client-prompt-state.test.mjs` (real decisions from `tests/helpers/engine.mjs`): a new decision starts with nothing chosen; an explore with one tile starts with it; a hex picks the tile's best turn and the answer; turning the tile; a trade's offer, Back and decline; a pick's rows and the overview counts; the payment's rows and its answer; the placement and the tile pick the tabs get; `panel` is `none`, `panel` or `shelf`. Then the module, moving `Game.svelte`'s derived values and handlers.
- [ ] **3. `DecisionPrompt.svelte`.** The screen part with `Game.svelte`'s five snippets and both panels, reading `PromptState` and `panelControls`; callbacks `onDecisionPromptAdvance`, `onDecisionPromptCancel`, `onDecisionPromptInspect`.
- [ ] **4. `Game.svelte` uses them.** Create the state, render the part, feed the map, Capital and Terrain tabs, overview, footer and hotkeys from it; Enter confirms through it. `npm run check`, `npm run test:unit`, and the prompt, explore, pick, setup and hotkey Playwright tests pass unchanged.
- [ ] **5. Centred by default, in the library.** `DecisionPanel`: drop `centred` and the bottom placement; the stack, the spacer and the measured `room` for the shelf snippet. `CardShelf`: a `room` prop. `IncomeNotice` drops `centred`. Library: DecisionPanel section examples for a tapestry, a tech and a civilization shelf and an options prompt at the centre; the DiceTray section's `panel` examples; stages become size containers. Screenshots of the library at 1920×1080 go to the owner for approval.
- [ ] **6. The dice tray learns from the game.** `DiceTray` `panel` prop replaces `look()`; `Game` binds `panel`; `App` passes it. Playwright: a card choice and an `options` prompt open at the screen's centre.
- [ ] **7. Docs and screenshots.** README "Current interface", `docs/ui/README.md` (no bottom placement left), `src/lib/components/README.md`, `docs/architecture.md`, `docs/status.md`; retake the prompt screenshots from the running game. `npm test` passes.
