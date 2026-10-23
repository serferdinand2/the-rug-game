# Rules engine core (#13): design

Written 2026-10-24. This is the second rules-engine issue. It builds the core that every later rules issue (#14–#21, #31) plugs into: the game state, setup, the pending-decision stack, the actions that answer decisions, events and `view()`.

Items marked **(my call)** are decisions I made that the owner has not confirmed. The owner confirmed everything else in the brainstorm on 2026-10-24. The owner also asked for the engine to be designed on its merits, not copied from the sibling games: "build like there are better options". So the prior art here is Board Game Arena's Tapestry (`elaskavaia/bga-tapestry`), which is the most mature digital Tapestry. Its `benefit` table is a queue of pending benefits per player. A `benefitManager` state turns the top one into a player prompt, and civilization setup is one simultaneous state for everyone ("Everyone must choose a civilization").

## 1. What and why

Almost every Tapestry effect asks someone a question: which resource, which hex, which card, which order. The core gives the whole game one way to ask and answer.

- Effects push **operations** onto a stack.
- The engine runs automatic operations itself and stops at the first one that needs a player: a **decision**.
- A player's **action** answers a decision, and the engine carries on from there.

With this in place, #14–#20 only add effect kinds and decision kinds. They never touch the turn loop.

## 2. Goals

1. `createGame()` sets up a correct base game for 1–5 players in both versions (01 §2).
2. The setup choices are the game's first decisions, and all players answer them **at the same time** (owner).
3. `play()` is pure. It returns a new state, throws `PlayerError` for anything illegal, and never changes the state it was given.
4. `view()` never gives a player another player's hand, the civilizations another player is choosing between, the order of any deck or stack, or a face-down tile.
5. Every change appends a typed event with a `seq` that goes up by 1.
6. The state already has room for the Automa and the Shadow Empire seats (#31), which have no capital city, income mat or resources.

## 3. Non-goals and anti-goals

- **Non-goals for #13:**
  - Running a turn. Advance turns are #14 and income turns are #15. #13 stops when the first player is asked to choose their turn type.
  - Every effect kind except `gain` and plain `vp`. The rest come with the issue that first needs them: `vp: { per }` counters and any-order benefits with #14, the map with #17, and so on.
  - Expansion setup: the P&P landmark-card draft (#32), the A&A arts track and advanced mats (#35, #36), the F&F overlays (#39).
  - The bots' side of solo setup: the Automa and Shadow Empire seats, their decks and the solo card removals (#31).
  - Civilization powers and the current version's setup adjustments (R34, #20). Until #20, a civilization is only an id.
  - Table and room concerns: names, table codes, seats leaving, versions for long polling (#22, #23). Timers and undo (#24).
- **Anti-goals.** Any of these counts as failure, even if the tests pass:
  - a rule decided in the server or a component;
  - `Math.random()` anywhere in the engine;
  - private information that can leave through `view()`, including inside events;
  - a game created with an expansion that isn't built yet, which would give a half-built game;
  - a rule invented to fill a gap. A detail that the research and R1–R104 don't settle gets a new issue.

## 4. The public interface

`src/lib/engine/game.js` exports the only four things the server and the client use.

```js
createGame({ players, version, expansions = [], random }) // → state
play(state, seat, action, random)                          // → new state
view(state, seat)                                          // → what that seat may see
class PlayerError extends Error {}
```

- **Seats.** Players are named by seat number, 1 to n, in the order of `players`. That order is clockwise, so it is also turn order. The numbers match `SEATS` and `playerColor(seat)` in `src/lib/ui.js`, so a seat's number sets its colour. The room (#22) maps its own player ids to seats. **(my call)**
  - **Bot seats (#31).** The Automa and the Shadow Empire take the seats after the humans, with their own numbers and colours, so `seats` can be longer than `players`.
  - **Turn order** walks the seats in order. It skips a seat that has finished, and a seat that acts inside another seat's turn. In solo play the Shadow Empire acts inside the Automa's turn (02 §9.2 step 7); in the 2-player variant it takes a normal turn (02 §9.9). #31 sets that flag. **(my call)**
- **`players`** is a list of `{ name }`, 1 to 5 of them, humans only. The engine keeps the names so events and views can show them. Checking names is the room's job.
- **`version`** is `'original'` or `'current'` (`VERSIONS` in `data/ids.js`).
- **`expansions`** lists `'pp'`, `'aa'` and `'ff'` (the codes in `src/lib/art/catalog.js`). Until an expansion's own setup issue is done, choosing it throws `PlayerError`, for example "Plans & Ploys isn't available yet." An unknown code also throws `PlayerError`.
- **`random(n)`** returns a whole number from 0 to n − 1. The server passes `crypto.randomInt`. Tests pass `seededRandom(seed)` from `src/lib/engine/random.js` and print the seed when they fail. Only `createGame` and `play` take it. The state never holds it or any seed, so nothing in the state can predict a shuffle. **(my call)** This replaces the `random()` in CONVENTIONS.md, which gets updated in the same change. An integer interface maps straight onto `crypto.randomInt` with no float rounding. I considered keeping a seeded generator inside the state, which would make replays deterministic. I rejected it: anyone who learns the seed can predict every deck, and the engine can't use Node's crypto.
- **An action** names the decision it answers: `{ decision: 7, civ: 'nomads' }`. The id lets a player answer any of their own open decisions, such as the capital before the civilization or the other way round. It also turns a stale answer into a clear error instead of a wrong move. **(my call)**
- **Errors.** `PlayerError` messages are sentences a player understands, such as "Choose one of the two civilizations you were dealt." Any other error is a bug. A bad `random` or a malformed state is a programmer error, not a `PlayerError`.

## 5. Setup

`createGame()` does 01 §2 in this order. The steps are kept as a list in `setup.js`, so the expansion issues can add their own steps later.

1. **Board side.** The small map for 1–3 players, the large map for 4–5. Every hex of that side goes into the state; the printed territories keep their tile id and turn (`MAPS` in `data/maps.js`).
2. **Tech cards.** Shuffle the 33 base tech cards and turn 3 face up.
3. **Tapestry cards.** Shuffle 50 cards: the 43 different cards and 7 traps.
4. **Tiles.** Shuffle the 48 territory tiles and the 15 space tiles into separate face-down stacks.
5. **Landmarks.** The 12 track landmarks are on the landmark board and the 6 tech-card landmarks are beside the tech deck. Nobody owns any yet.
6. **Achievements.** All boxes are free. The VP come from the side in use (R24).
7. **Capital mats.**
   - 4–5 players: deal each player 1 different mat at random from the 6. Their start hex is that mat's large-map start.
   - 2–3 players: deal each player 1 different pair at random from `SMALL_MAP_PAIRS` ({1, 6}, {2, 4}, {3, 5}). Both mats of a pair share one small-map start hex, so the start is known now. Each player keeps 1 mat of their pair with a `chooseCapital` decision.
   - 1 player: as for 2–3 players, but the player always starts on "2/4", which is `0_2`, whichever mat they keep (02 §9.2 step 2, R40). The bots arrive in #31; until then a solo game sets up but can't be finished. **(my call)**
8. **Outposts.** Each player puts 2 upright outposts on their start hex and keeps 8 in supply.
9. **Income mats.** Each row holds its 5 buildings, so only space 1 of each row is exposed. All 4 tapestry slots are empty; era 1 is the printed Maker of Fire.
10. **Civilizations.** Shuffle the 16 base civilizations and deal 2 to each player face down. Each player keeps 1 with a `chooseCiv` decision.
11. **Tokens.** Every player has a token on the start of all 4 tracks and 0 VP. Resources, hand, tech cards and tiles start empty (01 §2.2 step 7).
12. **First player.** Chosen with `random` (01 §2.2 step 6).

The setup decisions are pushed as **one group**: every player's `chooseCapital` (on the small map) and `chooseCiv` (§7).

**Reveal. (my call)** Every pick stays hidden until the last one is made, so a late chooser never sees an earlier pick. This follows the owner's "at the same time", and the expansions' rule that the capital and the civilization are kept together. Then one event reveals every player's capital and civilization at once.

**After the group.** When the last pick is made, the engine runs the **after-setup steps**, in order. They are a second list in `setup.js`, so later issues add their own steps there:
1. Reveal every pick.
2. Shuffle every civilization nobody kept into the civilization deck, which later mid-game gains draw from (01 §2.2 step 3).
3. Later issues add steps that touch shared things, in turn order from the first player:
   - civilization setup that affects other players or shared supplies (#20), such as Tinkerers giving each opponent a tech card;
   - the P&P landmark-card draft, which starts with the player to the right of the first player (#32).
4. Set the phase to play, make the first player the current player, and ask them for their turn type with `chooseTurn`.

Setup that touches only the player's own things stays inside the group, in that player's lane (§7). This covers a civilization's own setup choices and a current-version adjustment that gains or loses a resource of the player's choice (#20). So nobody waits for anyone else's private choices.

**Versions.** In #13 both versions set up the same way. In the original rules the capital is chosen before the civilization, and F&F draws both together. That makes no difference, because both are open at once. The version is kept in the state for #15's tiebreak and #20's adjustments.

**Card ids. (my call)** The decks hold stable ids, so every card can be followed from place to place:
- civilizations, tapestry and tech cards use their catalog slugs, such as `'alchemists'`, `'age-of-sail'` and `'air-conditioning'`;
- the 7 traps are `'trap-1'` to `'trap-7'`, all drawn with the catalog's `tapestry/trap` picture;
- territory and space tiles use their numbers, 1–48 and 1–15.

The data issues (#18–#20) don't exist yet, so `decks.js` reads the base lists from `src/lib/art/catalog.js`, which imports nothing. When #18–#20 add the card data, they keep the same ids, and a test checks that they match the catalog.

## 6. The state

The state is plain, JSON-safe data. The names below are a guide for the builder. Later issues may add fields, but they shouldn't rename these.

- **Game:**
  - `version`, `expansions`, `map` (`'small'` or `'large'`), and `phase` (`'setup'`, `'play'` or `'over'`);
  - `first` and `current`: seat numbers;
  - `seats`: one entry per seat, in seat order.
- **Supplies:**
  - the tech deck, its 3 face-up cards and its discards;
  - the tapestry deck and its discards;
  - the territory stack and the space stack;
  - the civilization deck;
  - the capital mats nobody was dealt.
- **Board:**
  - `hexes`: each hex's tile and turn, and its outposts as `{ seat, toppled }`;
  - the landmarks still available;
  - each achievement's claimed boxes.
- **Flow:**
  - `pending`: the operation stack (§7);
  - `nextId`: the next operation id;
  - `seq`;
  - `events`.

A seat has a `kind`.
- **Every kind** has `seat`, `kind`, `name`, `vp`, `tracks`, outposts, `incomeTurns` and `finished`.
  - `tracks` holds a list of token spaces per track, because AI Singularity can put a second token on a track.
- **`kind: 'player'`** also has:
  - `resources` (0–8 each);
  - the income mat, as the buildings left in each row, plus the tapestry slots;
  - `capital` (the mat number and what is built on it), and the landmarks beside the mat;
  - `hand`, the tech cards by row, territory tiles, space tiles (in supply and explored), and civilizations.
- **`kind: 'automa'` and `kind: 'shadow'`** are left for #31. They simply lack the player-only fields.

  Engine code reaches player-only fields only through a helper that checks the kind, so nothing assumes every seat has resources. **(my call)**

## 7. Operations and decisions

`pending` is a stack: the top is index 0. Each entry is an **operation**: `{ id, player, kind, … }`.

- **Automatic operations** are run by the engine. An example is "the remaining effects of this benefit".
- **Decisions** need an answer from their `player`, who may be someone other than the current player, as in a trap response (#17).
- **The run loop.** After `createGame` and after every answer, the engine runs the top operation while it is automatic. It stops at a decision or when the stack is empty. Running an operation may push new ones on top, so whatever was waiting underneath carries on afterwards. Navigation, for example, gains a tile, then explores. This is BGA's `benefitManager` in a pure function.
- **Open decisions.** Usually only the top operation is open. If several decisions are pushed by the same step, all of them are open at once, and their player answers them in any order.
- **Groups (simultaneous decisions). (my call)** A group is one operation on the stack, holding one **lane** per player. A lane is a small stack of its own.
  - Each player's open decisions are the top of their own lane, so players in a group never wait for each other.
  - When a player's answer pushes a follow-up, it goes on top of that player's lane, so only that player waits for it. Automatic operations in a lane run straight away.
  - Effects that touch other players or shared supplies are never pushed inside a lane. They go to the after-setup steps (§5), or to after the group in general.
  - When every lane is empty, the group comes off the stack and the run loop carries on with whatever is below it.
  - The setup choices are the first group: each lane starts with that player's `chooseCapital` and `chooseCiv`, pushed together, so either can be answered first.
- **Answering.** `play(state, seat, action, random)`:
  1. clones the state with `structuredClone`;
  2. finds the decision named by `action.decision`;
  3. checks that it is open and belongs to `seat`;
  4. checks the answer;
  5. resolves the decision and removes it;
  6. continues the run loop;
  7. returns the new state.

  Any failure throws `PlayerError` before the clone is returned, so the live state is never touched.
- **Decision kinds** each live in their own module. Each kind defines:
  - `answers(state, decision)`: every legal answer, with the default first. #24's timeouts take the first one (2026-10-20 design: "take an income turn when choosing a turn type, otherwise the first legal option"). #21's random games pick from the list. **(my call)**
    - It runs on the full state, on the server.
    - `view()` sends each player the answers to their own open decisions, so the interface can highlight the legal choices without working out any rules itself. Decision modules never have to work from a view.
    - If a later decision kind has a very large answer list, its issue may send a compact summary instead. Explore, with each tile, hex and rotation, may be one (#17).
  - `check(state, decision, answer)`: throws a specific `PlayerError` for an illegal answer. A test checks that every answer from `answers()` passes `check()`.
  - `resolve(state, decision, answer, random)`: applies the answer.
  - `hidden`: the decision's fields that only its player may see.
- **The decision kinds in #13:**

| Kind | Fields | Answer | Notes |
|---|---|---|---|
| `chooseCapital` | `options: [1, 6]` | `{ capital: 1 }` | Small map only. The options are public: mats are public components. **(my call)** |
| `chooseCiv` | `options: ['alchemists', 'nomads']` (hidden) | `{ civ: 'nomads' }` | Others see that the player is choosing, not between which |
| `chooseResource` | `count: 2`, `from: 'any'` or a list of resource ids | `{ resources: { coin: 1, food: 1 } }` | Whole numbers that add up to `count`, only from `from` |
| `chooseTurn` | `options: ['income']` or `['income', 'advance']` | `{ turn: 'income' }` | Income is first, so it is the default. On a player's first turn only income is legal (01 §4.1) |

- **What `chooseTurn` does in #13.** #13 only offers and checks it. Resolving it belongs to #14 (advance) and #15 (income). Until then, a legal answer throws an ordinary `Error` naming the issue that builds it.

## 8. Effects in the core

A benefit is a list of effects (`data/effects.js`). The core turns it into an automatic operation that resolves the effects one at a time, in list order. Choosing the order of an unordered benefit is #14. BGA does it with a `benefitOption` prompt, and the operation stack already allows for one.

- **`gain`**, in this order:
  1. **Named resources** (coin, worker, food, culture) are added at once and stop at 8. Anything above 8 is lost, and the event says how much (01 §1.2).
  2. **`territory: n`** takes n tiles from the top of the territory stack into the player's supply, face up. An empty stack gives fewer or none, because discarded tiles never return (01 §7.2, FAQ #20).
  3. **`space: n`** works the same way with the space stack.
  4. **`tapestry: n`** draws n cards into the hand. When the deck is empty, the discards are shuffled into a new deck. With no discards there is nothing left to draw (01 §9.1, FAQ #24).
  5. **`any: n`** pushes a `chooseResource` decision for `count: n` on top.

  Named resources come before `any`, so the player chooses knowing what the cap already took.
- **`vp: n`** adds n to the player's VP.
- **Any other effect kind** throws an ordinary `Error` saying it isn't built yet, until its issue adds it.

Tests call the effect runner directly, because no track space or card can trigger it in #13.

## 9. Events

- An event is `{ seq, type, … }`, with `seq` going up by 1 across the whole game.
- An event that reveals something private puts it in one `secret` field. `view()` keeps that field only for the seat in the event's `player`. An example is a player's dealt civilizations or drawn tapestry cards. **(my call)**
- The state keeps the newest 500 events. Bird Table keeps 80, but a Tapestry turn emits many more. The server (#23) sends a client the events after its last `seq`. A client that has fallen too far behind gets a fresh view. **(my call)**
- The events in #13:

| Type | Fields |
|---|---|
| `gameCreated` | `version`, `expansions`, `map`, `seats` (`{ seat, name }`), `first` |
| `capitalDealt` | `player`, then `capital` on the large map or `options` on the small map |
| `outpostsPlaced` | `player`, `hex`, `count` |
| `civsDealt` | `player`, `secret: { civs }` |
| `capitalChosen` | `player`, `secret: { capital }` |
| `civChosen` | `player`, `secret: { civ }` |
| `setupRevealed` | `picks`: each seat's `{ seat, capital, civ }` |
| `setupDone` | none |
| `turnStarted` | `player` |
| `resourcesGained` | `player`, `gained`, `lost` |
| `tilesGained` | `player`, `stack` (`'territory'` or `'space'`), `tiles`: public, because territory tiles are always face up (01 §3.2) and tapestry hands are the only hidden information during play (01 §9.1, BGA help) |
| `cardsDrawn` | `player`, `count`, `secret: { cards }` |
| `deckShuffled` | `deck`, `count` |
| `vpGained` | `player`, `vp`, `total` |

The builder may rename these, but each change emits exactly one event per thing that happened. The client animates and writes the log from events, never by comparing states.

## 10. Privacy: `view(state, seat)`

`view()` is the only way state leaves the server. It returns a copy in which:

- **Other seats' hands** become counts. Tapestry hands are the only hidden information during play (01 §9.1, BGA help), so tiles in supply stay visible.
- **Setup picks.** Another seat's dealt civilizations never show. Until the reveal (§5), its kept capital and civilization don't show either.
- **Every deck and face-down stack** becomes a count: tech, tapestry, territory, space and civilizations. The 3 face-up tech cards and the tapestry discards stay visible.
- **Each decision's `hidden` fields** and each event's `secret` stay only for their own player.
- **`answers`.** The viewing player's own open decisions carry their legal answers (§7). Nobody else's do.
- **`seat` of `null`** gives the public view with every private part removed. The hot-seat pass screen (#30) needs it.

## 11. Tests

In `tests/engine-*.test.mjs`, written before the code. Test names are sentences and cite the rule, for example `'R40: a solo player starts on 2/4 whichever mat they keep'`.

- **Setup, for 1–5 players and both versions:**
  - the map side;
  - the deck sizes: 30 tech cards plus 3 face up, 50 tapestry cards, 48 territory tiles and 15 space tiles;
  - every player's starting values;
  - different mats on the large map, different pairs on the small map, and outposts on the right hex;
  - the first player is a seat;
  - the setup group holds n `chooseCiv` decisions, plus n `chooseCapital` decisions on the small map.
- **Answering setup:**
  - players may answer in any order, and each may answer capital or civilization first;
  - until the last pick, no other seat's view shows a kept capital or civilization; then `setupRevealed` shows them all;
  - afterwards the civilization deck holds 16 − n civilizations, and the first player faces `chooseTurn` with only income.
- **Groups.** A follow-up pushed into one lane keeps the other lanes open. The group ends only when every lane is empty, and then the operation below it runs. A `gain` with `any` inside a lane is enough to test this.
- **`PlayerError`** for:
  - another seat's decision;
  - a decision that isn't open, or an unknown or answered id;
  - an option that wasn't offered;
  - advancing on a first turn;
  - a resource answer that doesn't add up;
  - 0 or 6 players, an unknown version, and any expansion.
- **Purity.** `play()` leaves its input deep-equal to before, even when it throws.
- **Effects:**
  - resources stop at 8 and the event reports the loss;
  - `any` becomes `chooseResource`;
  - a tapestry draw reshuffles the discards when the deck is empty;
  - an empty tile stack gives nothing.
- **Decision kinds.** Every answer from `answers()` passes `check()`.
- **Events.** `seq` goes up by exactly 1 per event, and private parts sit only in `secret`.
- **Privacy (randomized).** For many seeds and every player count, setup is played out with random legal answers. After every step, the test checks each seat's `view()` and the `null` view. None may contain:
  - another seat's hand or dealt civilizations;
  - another seat's unrevealed picks or answers;
  - any deck order.

  The seed is printed on failure.
- **Reproducibility.** The same seed and the same answers give the same state.
- **Imports.** The new engine modules import only relative paths, as the #12 test already checks for `data/`.

## 12. Module layout (my call)

```
src/lib/engine/
  game.js          createGame, play, view, PlayerError: the only exports the server and client use
  errors.js        PlayerError
  random.js        shuffle(list, random), seededRandom(seed)
  setup.js         the setup steps, in order
  decks.js         the base deck ids (from the asset catalog until #18–#20)
  ops.js           the pending stack: push, open decisions, the run loop
  events.js        emit, and the 500-event window
  view.js          view
  decisions/       one module per decision kind: choose-capital.js, choose-civ.js, choose-resource.js, choose-turn.js
  effects/         one resolver per effect kind: gain.js, vp.js (#14–#20 add the rest)
```

## 13. Left to the builder

- Field, event and error-message names, within the rules above.
- How automatic operations are represented on the stack.
- The seeded generator's algorithm.
- Splitting the tests between files.
- Updating CONVENTIONS.md ("Rules engine": `random(n)`, the operation stack, the decision-kind modules) and CLAUDE.md ("Where the work stands") in the same change.
