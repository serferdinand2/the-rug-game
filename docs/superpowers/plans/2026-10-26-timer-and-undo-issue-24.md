# Turn timer and undo (#24) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A host-set turn timer whose timeout plays the rest of the turn with default answers, an undo inside your own turn that never goes past anything revealing, and the server's 3–10 s answer for a defender who can only decline.

**Architecture:** The engine adds what needs its knowledge (`state.turn`, default answers, decline-only responses, `revealed()`, `restore()`, the `timedOut` event) in a new `src/lib/engine/table.js` and `view.js`. `rooms.mjs` keeps the settings, clocks, declines and undo history as pure transitions (`settings`, `tick`, `timeout`, `undo`, plus history in `play`). `api.mjs` runs one timer per table from `Rooms.nextDeadline()` and serves `settings` and `undo`.

**Tech Stack:** Node 22, `node:http`, `node:crypto`; no packages; `node:test`.

**Spec:** `docs/superpowers/specs/2026-10-26-timer-and-undo-design.md`

## Global Constraints

- `TIMERS = [0, 1, 2, 5]` minutes (0 is off), frozen. New tables: `timer: 0`, `undo: true`.
- `config` in `server.mjs` gains `minuteMs: 60_000`, `declineMinMs: 3_000`, `declineMaxMs: 10_000`; the API reads them on every use.
- `HISTORY_LIMIT = 20` steps; `AUTO_LIMIT = 1_000` automatic answers in one `timeout()`.
- Messages, exactly: "Only the host can change the table." (existing), "Choose a timer of off, 1, 2 or 5 minutes.", "Choose whether undo is on.", "Undo is off at this table.", "There is nothing to undo.", "You can only take back your own choices.". Reuse play()'s "Start the game first.", "That seat isn't yours." and "Come back to the table first.".
- New events: `{ type: 'timedOut', player }` and `{ type: 'undone', player, from }`.
- The room view never holds `history`, `declines`, a clock's `scope` or a person id. `api.mjs` adds `version` and `now` (the server's `Date.now()`).
- `rooms.mjs` uses the engine only through `src/lib/engine/game.js`. Engine modules import only relative paths. No `Math.random()`: rooms take `random`, and the server passes `crypto.randomInt`.
- Files start with a one-line comment, exported functions and types have JSDoc, Prettier (tabs, single quotes), `npm run check` reports 0 errors and 0 warnings.
- Commits: `Refs #24: …`, the last one `Fix #24: …`, each ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

- A defender who declines by hand before the server's wait ends: the scheduled decline must be dropped, never answer a later decision. Task 3 tests it.
- A stale client still holding a decision id from a branch that was undone: `restore()` carries `nextId` forward, so a new decision never reuses that id. Task 1 tests it.
- A table timer that fires after its table closed or changed: it must re-read the room and do nothing, and closing must leave no timer. Task 5 tests it with `api.timers()`.
- Several setup clocks running out at once, in simultaneous lanes: the whole setup must be answered without ever auto-playing a fresh clock. Task 3 tests it.
- An away seat whose clock runs out is played like any other. Task 3 tests it.

---

### Task 1: The engine's part

**Files:**
- Create: `src/lib/engine/table.js` ("What the table needs from the engine: who is asked, default answers, decline-only responses, the timeout event and undo's restore.")
- Modify: `src/lib/engine/state.js` (`State.turn`), `setup.js` (`turn: 0`), `turn.js` (`startTurn` adds 1 before `turnStarted`), `view.js` (`revealed`), `game.js` (exports), `tests/helpers/invariants.mjs` (event numbers may jump only just before an `undone` event)
- Test: `tests/engine-table.test.mjs`

**Interfaces:**
- Produces, all exported from `game.js`:
  - `state.turn: number`, 0 during setup;
  - `askedSeats(state) → number[]`: the seats with an open decision, ascending;
  - `defaultAction(state, seat) → ({ decision: number } & Answer) | null`: the seat's first open decision (in `openDecisions` order) with `answers()[0]`;
  - `declineOnly(state) → { decision: number, player: number }[]`: open `chooseResponse` decisions whose `answers()` is only `[{ card: null }]`;
  - `revealed(before, after) → boolean`;
  - `timedOut(state, seat) → State`: a copy with the `timedOut` event;
  - `restore(before, current, player) → State`.

- [ ] **Step 1: Write the failing tests.**
  - `'the turn number is 0 in setup and rises by 1 with each turn'`: `newGame(2)` has 0, `startedGame(2)` has 1, and the next turn has 2.
  - `'the default action takes an income turn, and a seat with nothing open has none'`.
  - `'askedSeats lists both players in setup, and the turn player once play starts'`.
  - `'a defender holding cards but no trap is listed as decline-only, and a trap holder is not'`: use `trapGame(['trap-3'])` and a non-trap hand. Move `trapGame` from `tests/engine-conquer.test.mjs` into `tests/helpers/engine.mjs` as `conquestGame(hand, options)`, and update its callers.
  - `'revealed: answering a placement reveals nothing'`.
  - `'revealed: every part view() hides counts'`: change each part in turn on a clone of `after` and expect `true`: every deck in `supply` (tech, tapestry, territory, space, civilizations), a hand, a pick, `incomeMat.faceDown`, and a new event with `secret`.
  - `'revealed: a hidden decision field alone does not count'`: a new `chooseTapestry` whose `options` are the hand.
  - `'restore takes the game back and keeps the numbers rising'`:
    - the result equals `before` apart from `seq`, `events` and `nextId`;
    - `seq` is `current.seq + 1`, and the last event is `{ type: 'undone', player, from: before.seq + 1, seq: current.seq + 1 }`;
    - `nextId` is `current.nextId` or more;
    - `checkState(restored, current.seq)` passes.
  - `'timedOut adds one event and changes nothing else'`.
- [ ] **Step 2: Run** `node --test tests/engine-table.test.mjs`. Expected: FAIL (no `table.js`).
- [ ] **Step 3: Implement.** `revealed()` compares, as JSON, every deck in `supply`, every player seat's `hand`, `picks` and `incomeMat.faceDown`, and looks for a `secret` in the events with `seq > before.seq`. `restore()` copies `before` with `seq = current.seq` and `nextId = max(before.nextId, current.nextId)`, then emits `undone` with `from: before.seq + 1`.
- [ ] **Step 4: Run** `node --test tests/engine-*.test.mjs` and `npm run check`. Expected: PASS, 0 errors.
- [ ] **Step 5: Commit** `Refs #24: add the turn number, default answers, revealed() and restore() to the engine`.

### Task 2: Settings and clocks

**Files:**
- Modify: `rooms.mjs`, `tests/rooms.test.mjs` (the room view's shape, `tableChoices()`)
- Test: `tests/rooms-clocks.test.mjs` (create)

**Interfaces:**
- Consumes: `askedSeats`, `declineOnly` (Task 1).
- Produces:
  - `Room` gains `timer: number`, `undo: boolean`, `clocks: Record<number, Clock>`, `declines: { decision: number, player: number, at: number }[]` and `history: Step[]` (filled in Task 4);
  - `Clock = { scope: string, ends?: number, left?: number, expired?: true }`;
  - `Timing = { minuteMs: number, declineMinMs: number, declineMaxMs: number }`;
  - `TIMERS`, `HISTORY_LIMIT`, `AUTO_LIMIT`;
  - `settings(room, personId, changes) → Room`, the same room when nothing changes;
  - `tick(room, now, timing, random) → Room`;
  - `nextDeadline(room) → number | null`;
  - `roomView` adds `timer`, `undo` and `clocks: { seat, ends?, left?, expired }[]` (by seat, without `scope`);
  - `tableChoices()` adds `timers`.

- [ ] **Step 1: Write the failing tests** (in `tests/rooms-clocks.test.mjs`, with explicit times; `timing = { minuteMs: 1000, declineMinMs: 3000, declineMaxMs: 10000 }`):
  - `'a table starts with the timer off, undo on, and no clocks'`.
  - `'only the host changes the timer and undo, to allowed values, in the lobby, during a game and when finished'`: the three messages, and the same room for no change.
  - `"the turn's clock covers the whole turn"`: timer 1, `tick` at 0 gives the current seat `ends: 1000`; after a choice at 300 that keeps the turn going, it is still 1000.
  - `"the turn's clock pauses while a defender answers, and resumes with what it had left"`: use `conquestGame` with the turn player's `chooseConquer` open.
  - `'a defender gets a fresh clock that goes once they answer'`.
  - `'setup gives every player one clock for all of setup'`: one seat's pick leaves its clock as it was.
  - `'a new turn gets a fresh clock, even for the same player twice in a row'`.
  - `'changing the timer restarts every clock, and off clears them'`.
  - `'a decline-only response is scheduled 3 to 10 seconds out, and a trap holder is not'`: `at` lies in [now + 3000, now + 10000]; with the timer off too.
  - `'nextDeadline is the earliest running clock or decline, and paused clocks do not count'`.
  - `'start and end clear the clocks, the declines and the history'`.
- [ ] **Step 2: Run** `node --test tests/rooms-clocks.test.mjs tests/rooms.test.mjs`. Expected: the new tests FAIL.
- [ ] **Step 3: Implement.** `createRoom` adds the defaults. `settings` empties `clocks` when the timer changes (so `tick` starts fresh ones) and `history` when undo goes off. `tick` works out each seat's scope:
  - `'setup'` during setup;
  - `` `turn:${game.turn}` `` for `game.current`;
  - `` `asked:${game.turn}` `` for anyone else.

  A clock carries over only when its scope matches. A `setup` or `turn` clock pauses when its seat isn't asked (`left = max(0, ends − now)`) and resumes when it is (`ends = now + left`), keeping `expired`. An `asked` clock goes when its seat isn't asked. A seat that is asked and has no clock gets `{ scope, ends: now + timer × minuteMs }`. With timer 0 or no running game, `clocks` is `{}`.

  Declines run whenever a game is running, timer or not. A decline stays while its decision is still in `declineOnly()`. A new one gets `at = now + declineMinMs + random(declineMaxMs − declineMinMs + 1)`.
- [ ] **Step 4: Run** the two files and `npm run check`. Expected: PASS.
- [ ] **Step 5: Commit** `Refs #24: add the timer and undo settings and the clocks`.

### Task 3: Timeouts

**Files:**
- Modify: `rooms.mjs`
- Test: `tests/rooms-clocks.test.mjs`

**Interfaces:**
- Consumes: `defaultAction`, `timedOut`, `declineOnly` (Task 1); `tick`, `Clock` (Task 2).
- Produces: `timeout(room, now, random) → Room`, the same room when nothing is due.

- [ ] **Step 1: Write the failing tests:**
  - `'when the clock runs out the server finishes the turn from where it is, and logs it once'`: the player chose advance, then ran out. The advance completes, the turn passes, and there is exactly one `timedOut` event.
  - `"the next player's fresh clock is not played"`.
  - `'auto-play waits for a defender, then goes on as soon as the turn comes back'`: after the defender answers, `tick` resumes the expired clock with `ends = now`, and the next `timeout` finishes the turn with no second `timedOut`.
  - `'both setup clocks run out together and the whole setup is answered'`: `game.phase` becomes `'play'`, and there are two `timedOut` events.
  - `'a due decline is answered, and one the defender answered first is dropped'`.
  - `'an away seat and a hot-seat seat are played the same way'`.
  - `'a timeout that cannot finish throws after 1,000 answers'`: use a stubbed engine state that keeps asking.
- [ ] **Step 2: Run** `node --test tests/rooms-clocks.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - First answer each due decline whose decision is still open, as `{ decision, card: null }` for its player.
  - Then, for each seat whose running clock has `ends ≤ now`:
    - unless it is already `expired`, add `timedOut` and set the clock to `{ scope, ends: now, expired: true }`;
    - then play `defaultAction(game, seat)` for as long as it isn't null and the seat's scope is unchanged.
  - Count every answer against `AUTO_LIMIT`, and past it throw `Error('The timer could not finish the turn.')`.
  - If anything was answered, empty `history`.
- [ ] **Step 4: Run** the file and `npm run check`. Expected: PASS.
- [ ] **Step 5: Commit** `Refs #24: play a timed-out turn with the default answers`.

### Task 4: Undo

**Files:**
- Modify: `rooms.mjs` (`play` keeps the history, `undo`, `canUndo` in `roomView`), `tests/rooms.test.mjs` (the random steps gain `settings`, `undo` and `timeout`, each followed by `tick`)
- Test: `tests/rooms-undo.test.mjs` (create)

**Interfaces:**
- Consumes: `revealed`, `restore`, `askedSeats` (Task 1); `Clock` (Task 2).
- Produces:
  - `Step = { game: State, seat: number, turn: number, clocks: Record<number, Clock> }`;
  - `undo(room, personId, seat) → Room`;
  - `roomView` adds `canUndo: boolean`, true when undo is on and the last step's seat is the seat being viewed.

- [ ] **Step 1: Write the failing tests:**
  - `'a placement is taken back within the turn'` (the issue's check): `choosePlacement` is open again with its old id, and an `undone` event follows.
  - `'choices come back one at a time, back to the start of the turn'`.
  - `'undo is refused after a roll'` (the issue's check): a conquest with an empty defender hand, and a research roll, each give "There is nothing to undo.".
  - `'a draw, a card leaving a hand, or a shuffle closes the history'`.
  - `'a conquest that asks the defender closes the history'`.
  - `"the last choice of a turn can be taken back until the next player's first choice, and not after"`.
  - `'two turns in a row: the first choice of the new turn closes the old one'`.
  - `'a timer answer, the game end, undo off, a new deal and an ended game each clear the history'`.
  - `"another seat's choice clears the history, and refusals use the exact messages"`: undo off; nothing to undo; another seat's step; not your seat; away.
  - `'undo puts back the clocks of that step, and an expired one is due at once'`: `nextDeadline(...) ≤ now` after `tick`.
  - `'the history keeps the newest 20 steps'`.
  - `'canUndo is true only for the seat whose step is last'`: false in the hot-seat public view.
- [ ] **Step 2: Run** `node --test tests/rooms-undo.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement.** `play` wraps `random` to count draws. Then:
  - Empty the history when undo is off, or when the last step's seat or turn differs from this choice's seat or `before.turn`.
  - Keep a step only when all of these hold; otherwise empty the history:
    - the game was in play and `seat === before.current`;
    - nothing was drawn and `revealed(before, after)` is false;
    - `after.phase !== 'over'`;
    - no seat other than `seat` is asked while `after.turn === before.turn`.
  - Steps are `{ game: before, seat, turn: before.turn, clocks: room.clocks }`, cut to the newest `HISTORY_LIMIT`.
  - `undo` checks, in order: a game is on, the person plays the seat and is present, undo is on, there is a step, and the step is theirs. It then sets `game = restore(step.game, room.game, seat)`, `clocks = step.clocks`, and drops the step.
- [ ] **Step 4: Run** `node --test tests/rooms*.test.mjs` and `npm run check`. Expected: PASS, including the random steps.
- [ ] **Step 5: Commit** `Refs #24: undo inside your own turn, never past anything revealing`.

### Task 5: The server

**Files:**
- Modify: `api.mjs` (the endpoints, `commit` ticks, the table timers, `timers()`, `close()`, `viewFor` adds `now`), `server.mjs` (the `config` values, `server.on('close', () => api.close())`)
- Test: `tests/api-timer.test.mjs` (create; the same `call`, `login` and `table` helpers as `tests/api.test.mjs`)

**Interfaces:**
- Consumes: `settings`, `tick`, `timeout`, `nextDeadline`, `undo` (Tasks 2–4).
- Produces:
  - `POST /api/settings { version, timer?, undo? }`;
  - `POST /api/undo { version, seat? }`, where `seat` defaults as for `move`;
  - `createApi()` returns `{ handle, sweep, waiting, timers(): number, close(): void }`.

- [ ] **Step 1: Write the failing tests:**
  - `'the host changes the timer and undo over HTTP, with the table version'`: a stale version gets 409, and a non-host 400.
  - `'a choice is taken back over HTTP'`: play defaults until a view has `canUndo`, then undo. The version rises and `canUndo` flips. With nothing to undo, the answer is 400 "There is nothing to undo.".
  - `'when a clock runs out the server plays the turn and wakes the long polls'`: `config.minuteMs = 20`.
  - `'two clients who never answer see their game played to the end'`: `minuteMs` 5 and declines of 1 to 2 ms, long-polling until `phase` is `'finished'`, giving up after 60 s.
  - `'a move that arrives after the clock ran out gets 409'`.
  - `'the table timers are cleared when a table closes, when it expires and when the server closes'`: `api.timers()` goes back to 0.
  - `'the room view has the timer, undo, clocks, now and canUndo, and the config the timers'`.
- [ ] **Step 2: Run** `npm run build && node --test tests/api-timer.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - `commit()` passes a changed room through `Rooms.tick(next, now, timing, random)`, where `timing` is read from `config` each time, then reschedules the table's timer from `nextDeadline`.
  - When the timer fires, it re-reads the room and returns unless `nextDeadline ≤ Date.now()`. Otherwise it commits `Rooms.timeout(...)`. Any error is logged with `console.error`, and the room is left alone.
  - `move` and `undo` first commit a due timeout, so a late request gets 409.
  - Clear a table's timer when `commit` closes the table and for every code `expireRooms` returns, in both `sweep` and `create`. `close()` clears them all.
  - Every timer is `unref()`ed.
- [ ] **Step 4: Run** `npm test` and `npm run check`. Expected: PASS, 0 errors, and the 200-game simulation still passes.
- [ ] **Step 5: Commit** `Refs #24: run the table timers and serve settings and undo`.

### Task 6: Record #24

**Files:**
- Modify: `CLAUDE.md` (Architecture: the endpoints, the new `rooms.mjs` transitions, `engine/table.js`; Where the work stands: a #24 entry and Next), `README.md` (the status line and anything that lists the API or table settings), `docs/superpowers/specs/2026-10-20-the-rug-game-design.md` (§24 points to the #24 design)

- [ ] **Step 1: Update** the three files.
- [ ] **Step 2: GitHub.** These steps write to GitHub; confirm with the owner before running them.
  - In #24's example, replace "so the server takes an income turn for her" with the corrected behaviour: the advance she started is finished with the defaults.
  - Comment the handoffs of design §12:
    - on #25, #27, #28, #29, #30 and #31;
    - on #32, #33, #35, #37, #39, #40 and #49, the rule about events with a `secret`.
- [ ] **Step 3: Run** `npm test` and `npm run check`. Expected: PASS.
- [ ] **Step 4: Commit** `Fix #24: add the turn timer and in-turn undo`. Close #24 once its three checklist items are ticked.
