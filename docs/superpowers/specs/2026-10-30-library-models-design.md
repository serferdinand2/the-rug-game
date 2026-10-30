# The DecisionPanel and TrackBoard library examples from real models (#131): design

Written 2026-10-30. #131 is in M13 · Refactor, found by the client scan (#80), and waited for #79. Every decision here is **(my call)**; the issue gave the shape.

## 1. What and why

Two library sections copy modules instead of using them:
- The DecisionPanel section copies `picks.js` (`payMixes`, `sets`), hand-makes the Tanks payment, the Space Shuttle bonus and the Guilds trade as pick models with typed lead lines, and wires their status, confirm and cancel as `Game.svelte` did before #79. Its cap-warning example types its rows and status outright.
- The TrackBoard section's `fixtureTrack` re-implements `board.js` `trackBoard()` with typed space and landmark names, and drops `ordered`, so its hover words say "and" where the game says "then". The Track and ProgressLanes sections reuse its `BOARD_TRACKS`.

When a module changes, these sections go on showing the old behaviour. **Done when** neither section re-implements a module and `tests/library.test.mjs` passes.

## 2. The changes

- **`src/library/models.js`**, the library's review games: a four-player game dealt with seed 1 (players You, Ana, Marko and Vera, the play mockup's), its setup answered with the default picks, as the WorldMap section deals its maps. Each function edits the dealt state where a state is hard to reach (a review fixture, said so in its JSDoc), then plays real moves to the decision:
  - `boardView()`: seat 1's view with the mockup's players at the mockup's spaces;
  - `tanksPayment()`: the player to move holds 2 coins, 1 food and 3 culture, on military space 6; the advance to Tanks comes from `advanceOptions()`;
  - `shuttleBonus()`: on exploration space 9 with 2 food and tiles 6, 13, 19, 21, 25 and 29, the player advances to Space Shuttle and the engine asks its bonus;
  - `guildsTrade()`: an income turn that plays Guilds, with 12 VP, 2 food and 1 culture;
  - `capWarning()`: Guilds' 15 VP trade taken with 1 coin and 7 food, so the engine asks for 3 resources.

  The four decision functions return a `PromptSource` that sends nothing.
- **The DecisionPanel section** builds a `PromptState` (#79) from each source, so the pick models (`pickModel`, `advanceModel`, `offerModel`, `tradeOffers`), the rows and the panel's words (`panelControls`, `paymentControls`) are the game's own. The section reads `prompt.title`, `controls` or `payControls`, `pickRows`, `pickTiles` and `pickBlocked`, and calls `pickRow`, `pickTile`, `payRow`, `chooseOffer`, `cancel` and `clearPayment`, as `DecisionPrompt.svelte` does. Decline sends nothing in the library, so it starts a fresh prompt state. The cap-warning example picks food, food and coin when it is built.
- **The TrackBoard section** exports `BOARD_TRACKS = trackBoard(boardView())`, keeping the name the Track and ProgressLanes sections import. Nothing else in the section changes (#120 is reworking it at the same time).
- **What stays.** The shelf, options, income, docked and explore examples keep their hand-written props: the issue names only the pick prompts and the board. The WorldMap section keeps its own `dealt()`.

## 3. What the library shows differently

- Track hover words: seven ordered spaces say ", then" instead of " and" (exploration 4, 7, 8, 9 and 11, science 8, technology 8).
- Space names: Interstellar Travel, Nanotechnology and Anti-Aircraft Defense, not the mockup's short names.
- The cap-warning example has all three rows picked (food, food, coin), so its rows and its warning agree, and Confirm can be pressed, as in the game.

The tiers, landmarks, players and positions are unchanged, and so are the pick prompts' titles, leads, rows, tiles, offers and buttons.

## 4. Tests

- `tests/library-models.test.mjs`: the board's players, positions and landmarks, its "then"; Tanks' rows, lead and buttons; the Shuttle's tiles, its decline and its blocked tiles once 3 are chosen; Guilds' offers, its Back; the cap warning's words.
- `tests/library.test.mjs`: a source guard that the DecisionPanel section builds a `PromptState` and hand-builds no pick model, and the TrackBoard section calls `trackBoard()` and re-implements none of it.
