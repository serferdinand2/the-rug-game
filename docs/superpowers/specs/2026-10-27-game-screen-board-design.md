# The game screen and the shared board (#26): design

Written 2026-10-27. #26 builds the first part of the game screen: its frame (header, the 3/4 + 1/4 middle, the footer), the shared board's two views (Advancement Tracks and World Map), and the turn itself (an income turn, or an advance with its payment). #27 fills the player area and the overview, #28 designs the prompt for every other decision.

What the owner said is marked **(owner)**. Every other decision is marked **(my call)**.

## 1. What and why

After #25 a started game shows a holding page. #26 replaces it with the play screen from Lazar's `docs/ui/main-screen.html`, driven by the room view and its `game` (`view()`), so a player sees the board and can take their turn.

## 2. Decisions from the owner

- **Order (owner, 2026-10-27):** #25, then #26–#28, then #6. #26 starts ahead of its blocker #6.
- **The map (owner, 2026-10-27):** until #6's map art exists, the World Map is "a fitted network of hexes the size that the game uses": the real board, 34 hexes for 1–3 players and 61 for 4–5, not the mockup's filler map.
- **Collisions (owner, 2026-10-27):** the mockup decides the look; the owner's design decides what works.

## 3. Scope

In #26:
- The game screen's frame, shared by #26–#28.
- The Advancement Tracks view with the players' progress, the landmarks still on the tracks, and the achievements.
- The World Map: the real hex grid, its territories, outposts and tokens. It can light up target hexes for #28.
- The turn: Take income, or choose a track space, see its benefit and price, and advance, choosing the payment when there is more than one.
- **A plain prompt for every other decision** **(my call)**: its question in words and its answers as buttons. With it, a whole game can be played after #26, if not prettily. #28 replaces it, kind by kind, with the designed prompts.
- The compact **Your overview** at the foot of the player area: name, VP, the four resources, hand, tech, territory and capital counts. A player can't choose a payment without seeing their resources **(my call)**. The tabs above it are #27.

Not in #26: the player tabs and the players overview (#27); the designed prompts (#28); the log, motion, results and dealing again (#29); the hot-seat pass screen (#30).

## 4. The frame

As in `main-screen.html`, at the 1920×1080 reference size:
- **Header (58 px):**
  - The brand at the left.
  - One `PlayerChip` per seat in the middle: the player's name, their civilization (in setup, "Setting up"), and their VP. The player whose turn it is has the green glow.
  - At the right:
    - the turn clock, when the timer is on;
    - **Undo** (the ↶ control), enabled when `canUndo`;
    - sound;
    - the menu, with How to play and Leave table.
  - Chip clicks open the players overview in #27.
- **The clock (functional, from #24) (my call on the look):** the asked player's time left, as `1:42` beside Undo, counted down from `ends` and corrected by the server's `now`. A paused clock shows its `left`. In its last 5 seconds the viewer's own clock turns red and reads "5 s left", in words as well as colour. Everyone sees the clock of the player being asked.
- **Middle:** the shared area takes 3/4 and the player area 1/4, both on the pixel texture.
  - The shared area's head has the `BoardSwitcher` (Advancement Tracks / World Map) and, at its right, the achievements.
- **Footer (58 px):** the `TurnBar`, as §6 describes.

## 5. The shared board

### 5.1 Advancement Tracks

`TrackBoard`, filled from the engine's data and the view:
- **Spaces:** the names from `TRACKS`. The tier prices come from `TIER_COSTS`, the track's resource and `any`.
- **Landmarks:** a landmark shows on its space (4, 7 or 10) while nobody has taken it, that is while it is in `state.landmarks`. Once it is taken it goes, as on the board **(my call)**.
- **Lanes:** each player's progress lane runs to their furthest token on the track. A second token, from the Futurists or AI Singularity, is drawn as a second end mark **(my call)**.
- **Spaces the player can advance to (functional):** while the viewer may choose an advance, every space they can pay for has a green outline, the colour the design uses for valid choices. The gold outline stays for the selected space. The issue's "gold outline" for available spaces would clash with selection, so the look follows Lazar's colours **(my call)**.
- **The legal spaces come from the engine:** the client runs the engine's `advances()` and `chooseAdvance.answers()` on its own view, while chooseTurn is open and before anything is sent. The engine is shared with the browser for this, and it only reads what the viewer can see.
  - A probe over 60 random games found no difference: 4,198 turn choices and 3,148 advance choices, comparing the preview on the viewer's view against the real state.
  - A test keeps it that way.
- **Selecting a space** fills the footer: "Advance to **Ships**", the benefit in words, the price, and **Advance**.
- **Bonuses** come from `bonusOf(state, track, space)`, so the neoprene Nanotechnology variant shows 2 tech cards (#53's hand-off).
- **Achievements, in the head of the shared area (functional, owner's issue):** the three achievements by short name, each with the colour squares of the players who claimed it, in order, and its VP for the next claimant. Lazar removed the old strip under the tracks, so they move into the head row **(my call)**.

### 5.2 World Map

- **The grid:** the hexes of `MAPS[state.map]`, flat-topped, laid out from `HEX_SIDES`. Hex `a_b` sits at x = 1.5·s·(b − a), y = (√3/2)·s·(a + b).
  - This puts start 1 at the top and the others clockwise, as the map data's comments describe the printed board.
  - The grid is scaled to fit the shared area.
- **A territory** is drawn from its terrains:
  - each of its 6 corners is a wedge of its terrain's colour (`turned()` by its orient);
  - an island is a small hexagon in the middle, split among its terrains;
  - an unexplored hex is the unexplored colour, with a dashed edge, as in the mockup.
  - The colours are the terrain tokens, as in `WorldMap` today.
- **Pieces:**
  - an outpost is a small square in its player's colour, and a toppled one lies on its side, outlined;
  - a Nomads piece is marked like an outpost with a small building or landmark symbol;
  - a civilization token is a small circle in its player's colour.
  - Several pieces on one hex sit side by side.
- **Targets (for #28):** `WorldMap` takes `targets` (hex keys) and reports `onWorldMapSelect` with the hex. While targets are set, the other hexes dim, and every target is a keyboard-focusable button.
  - In #26 the plain prompt uses this for `chooseExplore`, `chooseConquer` and `chooseHex`: choose the hex on the map, then the rest in the prompt.
- **Labels:** each hex has a label for assistive technology: its terrains, or "unexplored", and whose pieces stand on it.
- `WorldMap`'s `rows` prop gives way to `hexes`. Its library section shows both sides, empty and mid-game.

## 6. The footer and the turn

`TurnBar`'s tones:
- **Setup:** "Setting up the table". Your own picks open in the decision panel (§7).
- **Your turn, choosing (chooseTurn open):** the neutral tone with **Take income** (sending `{ turn: 'income' }`). Choosing a space switches to the selected tone, as in the mockup. With no advance payable, the tracks show no green outline, and only income is offered.
- **Advance:**
  - Selecting a space is a free preview: nothing is sent, and Take income stays available.
  - **Advance** first settles the payment from the preview: when the chosen space has more than one legal payment, the decision panel asks for it; with one, nothing is asked.
  - Then the client sends `chooseTurn { turn: 'advance' }` and, on its answer, `chooseAdvance { track, from, pay }`, back to back. They are two choices for undo, as the engine counts them.
- **Your other decisions:** the footer names the decision ("Choose a resource") and the decision panel opens. The viewer's decision is the first open decision whose `player` is the viewer and that carries `answers`. That covers a trap response on someone else's turn, and setup's simultaneous picks.
- **Someone else's turn:** the waiting tone, "**Ana**'s turn", in their colour. When someone else is being asked something, such as a trap response, it reads "Waiting for **Ana**".
- **Game over:** "The game is over." The results are #29.

A move that meets a stale version (409) fetches the newer state and shows "The table changed. Try again." It isn't retried: a move that was legal may not be any more **(my call)**.

## 7. The decision panel and the plain prompt

As in the mockup's decision overlay:
- a dark scrim over the shared area only, so the player area stays visible;
- the panel sits a little above the footer, with its title, its content and **Confirm**.

In #26 it shows two things:
- **The payment for an advance:** each legal payment as a row of resource symbols, then Confirm.
- **The plain prompt for any other decision:**
  - the title names the decision in words, for example "Choose a resource", "Gain the bonus?" or "Where does the Farm go?";
  - each answer is a button, with the answer described in words (§8);
  - for map decisions, the map opens and the hexes in the answers light up;
  - choosing an answer and pressing Confirm sends it;
  - decisions with very many answers (exploring) scroll inside the panel.

The view switches by itself: a map decision opens the World Map, and the others leave the board as it is. #27 adds the switch to the right tab.

## 8. Words for effects and answers

`src/lib/describe.js` turns the engine's data into short English. It is a plain module, tested in Node:
- **a benefit:** "Gain 1 coin and 1 culture", "Explore a territory", "Gain 1 VP for each territory you control";
- **a cost:** "1 food and 1 resource of your choice";
- **an answer:** "Pay 1 food and 1 worker", "Plot in row 3, column 5, turned once", "Hex 2,−1 with tile 17, turned twice".

It covers the effect kinds of the track spaces and the decisions' answers. #28 extends it for cards and civilizations. Names come from the data: tracks, spaces, landmarks, buildings and terrains in Cinzel where the design wants them.

## 9. Your overview

The compact block at the foot of the player area, as in the mockup:
- the player's colour, name, era and VP;
- the four resources in `--raised` boxes with the 24 px icons;
- the hand, tech, territory and capital counts.

It updates with every answer. The tabs above it are #27; until then the player area says "Your capital, hand, income mat, eras, civilization and tech come with #27." **(my call)**

## 10. Hot-seat

At a hot-seat table the client shows the seat being asked: it requests `state?seat=` for it and switches as the asked seat changes. When several seats are asked at once (setup), it shows the lowest-numbered one, and moves to the next once that one has answered **(my call)**. Without #30's pass screen, the next player can glimpse the previous player's hand, so hot-seat is for testing until #30. Online play is unaffected.

## 11. Client structure

- `src/screens/Game.svelte`: the play screen, replacing `Holding.svelte`.
- New screen parts in `src/screens/game/`: `GameHeader`, `SharedBoard`, `DecisionPanel`, `PlainPrompt` and `YourOverview`.
- New components where the library needs them:
  - `TrackSpace` gains `available`;
  - `WorldMap` is rebuilt on `hexes`;
  - `TurnClock` is new;
  - `AchievementStrip` is new.
  - Each has a library section and a README row.
- Plain modules, each tested in Node:
  - `src/lib/board.js`: the tracks, the lanes and the achievements from a view;
  - `src/lib/hexmap.js`: positions, corners, wedges and the fit;
  - `src/lib/turn.js`: the legal advances and payments from the engine, and which decision is the viewer's;
  - `src/lib/describe.js`;
  - `src/lib/clock.js`: time left from `ends`, `left` and `now`.
- The store gains `move(action)`, `undo()` and the seat to view at a hot-seat table.

## 12. Tests

- `board`, `hexmap`, `turn`, `describe` and `clock` each get a test file.
- `hexmap` checks that side *e* of every hex faces its neighbour at `HEX_SIDES[e]`.
- `turn` plays random games (the simulation's helpers) and checks that the client's preview of legal advances and payments equals the server's `chooseAdvance` answers whenever one opens.
- `describe` checks that every track space's benefit and bonus, and every answer of the random games' decisions, describes to a non-empty sentence with no "undefined".
- An API test plays a short game through the store's `move` path.
- A browser walkthrough plays several turns in two tabs, and its screenshots replace the README's play-screen mockup images.

## 13. Handed off

- **#27:** the tabs, switching tabs for decisions, the players overview from the chips.
- **#28:** the designed prompt for each decision family, replacing the plain prompt; extending `describe.js` to cards and civilizations.
- **#29:** the log and motion from events, the results, a timed-out notice, the host's settings during a game.
- **#30:** the pass screen in front of a hot-seat seat.
- **#6:** the map art replaces the drawn terrain wedges.
