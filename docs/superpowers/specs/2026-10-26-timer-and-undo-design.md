# Turn timer and undo (#24): design

Written 2026-10-26. This is the third issue of M4 · Tables and server. It adds a turn timer the host sets, with the server playing for a player whose time runs out, an undo inside your own turn, and the automatic answer for a defender who can only decline.

The owner answered the questions this time. What the owner said is marked **(owner)**. What I proposed and the owner confirmed is marked **(owner, agreed)**. Every other decision is marked **(my call)**, for the owner to revisit.

## 1. What and why

Tapestry turns are long, and an online table has no way to move on when someone stops answering. #22 gave the tables no kick, and the owner wants none. The timer is therefore the only way a table keeps moving.

Undo fixes a misclick, such as a building on the wrong plot or the wrong track. It must never let a player peek at something hidden and then take the choice back.

The rules engine is pure and knows nothing of time. The timer and the undo history are table concerns, so they live in `rooms.mjs` and `api.mjs`. The engine adds only what needs its knowledge: the turn number, the default answer, what is hidden, and restoring an earlier state with its event numbering intact.

## 2. Goals

1. The host sets the timer to off, 1, 2 or 5 minutes, and switches undo on or off. Both can change at any time, a running game included.
2. When a player's time runs out, the server plays the rest of their turn with the default answers, and the log says so.
3. Every screen learns when each clock runs out, so the game screen can count down and warn the player in the last 5 seconds.
4. A player takes back their own choices one at a time, back to the start of their turn. Undo never goes past a die roll, a draw, a card leaving a hand, or another player's choice.
5. A defender who can only decline is answered by the server after a random 3 to 10 seconds.
6. The issue's checks:
   - tests cover a timeout and an undo blocked after a roll;
   - undo covers a placement (#16's `choosePlacement`) within the turn;
   - a `chooseResponse` with only the decline answer is answered after 3 to 10 seconds.

## 3. Non-goals

- **Kicking.** The host can't remove a player who stops answering **(owner)**. #22's handoff offered kicking to #24; it is not built. A silent player keeps their seat. With the timer on, the server plays their turns. With the timer off, the table waits, as today, and the host can end the game once everyone else has left (#22's `end`).
- **Undo in setup.** The capital and civilization picks are simultaneous and secret, and the civilization setup follows the reveal. Undo is for turns only. **(my call)**
- **Undoing a choice made in someone else's turn**, such as a defender's response or a neighbour's pick. Undo is "within your own turn" (the issue). **(my call)**
- **The screens.** The lobby's timer and undo controls, the clocks, the 5-second warning, the undo button and the log lines belong to #25–#30. The page is a placeholder until #25. This issue makes the server ready for them.
- **Solo play.** Whether the Automa's and Shadow Empire's turns are timed is decided with #31.

## 4. The settings

- **`room.timer`**: minutes per clock, one of `TIMERS = [0, 1, 2, 5]`, where 0 is off **(owner, from the issue)**. Off by default **(owner, agreed)**.
- **`room.undo`**: a boolean, on by default **(owner, agreed)**.
- **Where they live.** They sit on the room beside `options`, not inside it, because `options` are fixed once a game is dealt and these change mid-game. **(my call)**
- **Changing them.** The host changes them with a new transition, `settings(room, personId, changes)`, served as `POST /api/settings { version, timer?, undo? }`.
  - It works in the lobby, during a game and at a finished table **(owner, agreed)**: with no kick, turning the timer on mid-game is how a host keeps a table moving.
  - Anyone but the host gets "Only the host can change the table.". A timer outside `TIMERS` gets "Choose a timer of off, 1, 2 or 5 minutes.", and an `undo` that isn't a boolean gets "Choose whether undo is on.".
  - Changing the timer during a game restarts every clock at once at the new length **(owner, agreed)**. Off clears every clock.
  - Changing the timer also clears the undo history **(my call, from the review)**. An undo puts back the clocks of its step (§8), so it would otherwise bring back a clock of the old length, or a fresh full one from a step taken with the timer off. A player could then dodge a shorter timer, or gain time after the timer is switched on.
  - Switching undo off clears the undo history.
  - A table is created with the defaults; the lobby changes them through `settings`. **(my call)**
- **What screens see.** `tableChoices()` gains `timers: [0, 1, 2, 5]`, and the room view gains `timer` and `undo`.

## 5. The clocks

A seat **is asked** when the engine has an open decision for it. Clocks run only while a game is running and the timer is on. Each clock has the timer's length.

- **The turn's player** (`game.current`) gets a fresh clock when their turn starts.
  - It covers the whole turn and doesn't restart after each choice **(owner, agreed)**.
  - It pauses while they aren't asked, for example while a defender answers, and resumes with the time it had left **(owner, agreed)**.
  - It ends with the turn.
  - A new turn is told apart by the engine's new turn number (§10), so a player who takes two turns in a row, once the others have finished, still gets a fresh clock.
- **During setup**, every player has one clock for the whole setup: the capital and civilization picks, then the civilization setup. It pauses and resumes the same way **(owner, agreed)**.
- **Anyone else asked during a turn**, such as a defender or a neighbour, gets a fresh clock when they become asked. It goes once they aren't asked any more **(owner, agreed)**.
- **The time** is the server's, in milliseconds. A running clock is `{ ends }` and a paused one `{ left }`. Both carry `expired` once they have run out.
- **The room view** gains `clocks`, one entry per seat that has a clock (`{ seat, ends?, left?, expired }`), and `now`, the server's time when it answered, so a screen can correct for its own clock. **(my call)**
- **The warning.** The game screen warns the player whose clock it is during its last 5 seconds **(owner)**. Everyone else sees the clock **(owner, agreed)**. The server sends nothing extra for the warning; the screen works it out from `ends` and `now`.

## 6. When a clock runs out

- **Auto-play.** The server plays for the player **(owner)**: it answers each of their open decisions with its default, one after another. It goes on for as long as they are asked within the clock's reach:
  - for the turn's player, the rest of the turn;
  - during setup, the rest of their setup;
  - for anyone else, until they aren't asked any more.
- **It continues from where they are** **(owner, agreed)**. If they already chose to advance, the server finishes that advance (the payment, the building's plot, any bonus) rather than switching them to an income turn. The issue's example, where Vera gets an income turn while choosing a track, is corrected to match.
- **The default** is the first of the engine's legal answers (`answers()` puts it first, engine core design): an income turn when choosing the turn type, otherwise the first legal option **(owner, from the issue)**.
- **When someone else is asked mid-way**, such as a defender after a conquest that auto-play made, auto-play waits for them. When the turn comes back, the expired clock resumes at zero and auto-play goes on at once. **(my call: it follows from the pause)**
- **The log.** When a clock first runs out, the engine adds a `timedOut` event `{ type: 'timedOut', player }` **(owner, agreed: the log records that the turn was played automatically)**. The answers that follow make their ordinary events.
- **Late requests.** A move or undo that arrives after a clock has run out first lets the timeout happen. The request then gets 409, because the table's version has moved on, as in Bird Table. **(my call)**
- **A safety limit.** At most 1,000 automatic answers in a row. Past that the error is logged and the room is left as it is, since that can only be a bug. **(my call)**
- **Every mode and every seat.** It works the same at a hot-seat table **(owner, agreed)**, and for an away seat: the timer doesn't care whether anyone is watching.

## 7. The defender who can only decline

The defender in a conquest is asked whenever they hold any card, so nobody learns who holds a trap (owner, #17). Holding cards but no trap, their only answer is to decline.

- When such a `chooseResponse` opens, the server answers it after a random wait of 3 to 10 seconds **(owner, from the issue)**. This happens in every mode, with the timer on or off.
  - The wait is drawn with the server's randomness when the decision opens.
  - It is kept on the room (`declines: { decision, player, at }[]`) and never appears in the room view. A screen that could see it would know the defender holds no trap. **(my call)**
- The defender's clock runs as for any other asked player, so their screen looks the same as a trap holder's.
- The defender may still decline sooner themselves; whichever comes first counts.
- When the timer runs out on a defender who holds a trap, the default is to decline (the first answer).

## 8. Undo

- **On or off.** The host's setting, on by default **(owner, agreed)**.
- **One choice at a time**, back to the start of your turn **(owner, agreed; the issue)**.
- **After the turn passes.** Your last choice passes play on, but you can still take it back until the next player makes their first choice **(owner, agreed)**. Otherwise a misplaced final building could never be fixed. When the next turn is yours again, because the others have finished, your first choice of the new turn closes the old one.
- **What undo can't go past** **(owner)**: a choice that showed someone something new. The server works this out itself **(owner, agreed)**. A choice is *revealing* when, while the engine answered it:
  - it used randomness: a die roll (conquering, research, the Alchemists) or a shuffle;
  - a hidden part of the state changed: any deck (tech, tapestry, territory, space, civilizations), any hand, any setup pick, or the face-down tapestry cards. That covers every draw, the tech display refilling after an invent, and a card leaving a hand, which everyone has then seen;
  - or it added an event with a `secret`.

  Hidden decision fields don't count. `chooseTapestry`'s options are the player's own hand, so counting them would block undoing an income-turn choice that showed nothing new. **(my call)**
- **What also clears the history:**
  - another player's choice **(owner)**, the automatic decline included;
  - a choice of yours that leaves another player asked while the turn is still yours, such as a conquest that asks the defender for a response, or a card that asks the neighbours **(my call, from the review)**. Their open choice can tell you something: a response still open after 10 seconds means the defender holds a trap (§7), and taking the conquest back then would dodge it. Undo would also make their choice vanish while they think. This doesn't touch the window after the turn passes: there the next player is asked because the turn passed, not because of your choice;
  - an answer the timer made (a turn the timer finished can't be undone; **owner, agreed**);
  - the end of the game, so the final ranking can't be taken back **(my call)**;
  - the host switching undo off;
  - the host changing the timer, so an undo can't bring back a clock of another length (§4) **(my call, from the review)**;
  - dealing a new game, or ending one.
- **Which choices are kept.** Only choices the turn's player makes in their own turn go into the history, and only while the game is in play, not setup.
- **The history** (`room.history`) holds, newest last, the game as it was before each choice, with the seat, the turn number and the clocks.
  - It is capped at 20 steps; the oldest goes first. A 5-player game state is about 45 KB, and a turn of random play takes up to 10 choices. 20 steps keep a table under about 1 MB. **(my call)**
  - It never appears in the room view.
- **Taking a choice back.** `undo(room, personId, seat)` is served as `POST /api/undo { version, seat? }`; `seat` defaults as it does for `move`.
  - It needs undo on, a step in the history, a last step that belongs to `seat`, and a person who plays that seat and is present.
  - It restores the game through the engine's `restore()` (§10) and puts back the clocks from that step as they were.
  - The end times are absolute, so the time spent still counts: the clock keeps running while you undo **(owner, agreed)**. If it has already run out, the timeout follows at once.
  - Refusals:
    - "Undo is off at this table.";
    - "There is nothing to undo.";
    - "You can only take back your own choices." when the last step is another seat's.
- **What screens see.** The room view gains `canUndo` for the seat it shows. **(my call)**

## 9. The server

- **One timer per table** in `api.mjs`, for the table's next deadline: the earliest running clock or automatic decline.
  - `commit()` brings the room's clocks and declines up to date (`Rooms.tick`, §10) and reschedules the timer on every change.
  - When it fires, `Rooms.timeout(room, now, random)` runs and its result goes through `commit()`. Calling `commit()` from a timer is safe (#23).
  - An unexpected error is logged and never thrown, as in `answer()`. The table is then left alone until its next change, so a bug can't spin in a loop. **(my call)**
  - Timers are `unref()`ed.
- **Clearing the timers** (#23's handoff, as Bird Table does): when a table closes, when it expires (`expireRooms`, from `sweep` and from `create`), and when the server closes (`api.close()`, called from the server's `close` event).
- **Settings in `config`** (`server.mjs`), so tests shorten them: `minuteMs: 60_000`, `declineMinMs: 3_000`, `declineMaxMs: 10_000`.
- **Endpoints:** `settings` and `undo`, both POST with the table's version. `move` and `undo` apply an expired deadline before checking the version.

## 10. Modules

- **The engine** (`src/lib/engine/`):
  - `state.turn`: 0 during setup, and `startTurn` adds 1. **(my call:** the clocks and the history must tell a new turn from the same player's next one.)
  - `askedSeats(state)`: the seats with an open decision.
  - `defaultAction(state, seat)`: the seat's first open decision with its first answer, as `{ decision, ...answer }`, or null.
  - `declineOnly(state)`: the ids of open `chooseResponse` decisions whose only answer is to decline, so `rooms.mjs` needs no decision kinds.
  - `revealed(before, after)`: whether any hidden part changed or a new event carries a `secret`. It sits in `src/lib/engine/table.js` with the other table helpers **(my call, from the build)**. A test (`tests/engine-table.test.mjs`, "every part view() hides counts") checks that every field `view()` hides is one `revealed()` compares, so the two stay in step.
  - `timedOut(state, seat)`: a copy with the `timedOut` event added.
  - `restore(before, current, player)`: `before`, with its event numbers and decision ids carried on from `current`, and an `undone` event `{ type: 'undone', player, from }`, where `from` is the first event number taken back. Event numbers and decision ids keep rising, so a screen never mistakes new events for old ones, and a stale decision id never answers a new decision. **(my call)** The invariants' check of consecutive event numbers allows a gap just before an `undone` event.
  - All are in `table.js` and exported from `game.js`.
- **`rooms.mjs`:**
  - `TIMERS` and `HISTORY_LIMIT` (20);
  - `settings`, `undo` and `timeout(room, now, random, limit = AUTO_LIMIT)`, which plays what has run out and throws past `AUTO_LIMIT` (1,000), which can only be a bug;
  - `scopeOf(game, seat)`: what a seat's clock covers, `setup`, `turn:<n>` for the turn's player or `asked:<n>` for anyone else, so `tick` knows when a clock carries over;
  - `tick(room, now, timing, random)`, which brings `clocks` and `declines` up to date after any change, and `nextDeadline(room)`. `timing` holds `minuteMs` and the decline range from `config`. Transitions carry `clocks` over as they are; `settings` empties them, and the undo history, when the timer changes, so `tick` starts fresh ones.
  - `play()` keeps the history. It counts the random numbers the engine draws through a wrapped `random`, and asks `revealed()`.
  - `start` and `end` clear the history and the clocks.
  - `roomView` adds `timer`, `undo`, `clocks`, `now` and `canUndo`.
- **`api.mjs`:** the two endpoints, the table timers and `close()`.
  - `playDue(code, now)` runs `timeout` when the table's deadline has passed and commits the result. If the answer changed nothing, it logs the error and the table keeps no timer until its next change.
  - `createApi(config, { timeout })` takes the timeout function as a test seam, which defaults to `Rooms.timeout`.

## 11. Tests

- **The issue's checks:**
  - a clock runs out and the server finishes the turn, online and at a hot-seat table;
  - undo is refused after a roll (a conquest, or research);
  - undo takes back a `choosePlacement` within the turn;
  - a decline-only response is answered after 3 to 10 seconds, and a trap holder's isn't.
- **The clocks** (`rooms.mjs`, with explicit times):
  - the turn's clock pauses and resumes across a defender's response;
  - one clock for setup;
  - a fresh clock for a neighbour;
  - a timer change restarts every clock, and off clears them;
  - an expired, paused clock resumes and auto-play goes on;
  - a late move gets 409.
- **The history:**
  - cleared by another player's choice, a new turn, a draw, a roll, a card played from the hand, a timer answer, the game end, undo switched off, and a timer change;
  - cleared by a conquest that asks the defender for a response, so the attacker can't take it back while the defender decides;
  - taking back the last choice of a turn before the next player's first choice, and not after;
  - the 20-step cap.
- **`revealed()`** covers every field `view()` hides. After each `restore()`, `checkState()` passes and the game equals the stored one.
- **#22's randomized room test** gains `settings`, `undo` and `timeout` steps.
- **Over HTTP:**
  - the two endpoints and their statuses;
  - the timers are cleared when a table closes, expires and when the server closes;
  - with a very short minute, two clients who never answer still see their game played to the end.

## 12. Handed off

- **#25–#28:** the lobby's timer and undo controls, the clocks and the 5-second warning, the undo button (`canUndo`), and the `timedOut` and `undone` events.
- **#29:** the log drops the events from an `undone` event's `from` onwards and shows `timedOut`.
- **#30:** at a hot-seat table, undo and the clock follow the seat whose turn it is.
- **#31:** whether the Automa's and Shadow Empire's turns have a clock.
- **Every expansion issue:** a choice that shows a player something hidden without changing a deck or a hand must add an event with a `secret`, or undo would let them peek and take it back.
