# The store's take-or-fetch rule in pass.js (#130): design

Written 2026-10-28. #130 is a refactor found by #80's review. The issue's proposed solution is the brief; every other decision is marked **(my call)**.

## 1. What and why

`src/lib/game.svelte.js`' private `#accept` decides, for every room view that arrives, whether the store drops it (an older version), shows it, asks for another view instead (#26 review, #30), and which events are fresh. No test reaches it, because no test imports the rune module. The rule moves into a pure function in `src/lib/pass.js`, next to `handOver`, which it builds on.

**Done when** `acceptStep` decides every case under Vitest, the store only applies its answer, and the hot-seat browser tests pass unchanged.

## 2. The rule

`acceptStep(current, incoming, shown, passing)` returns `{ take, fetch, shown, passing, fresh }`:

- **Stale.** An older version of the table on show is dropped: nothing is taken or asked, `shown` and `passing` stay as they were, and nothing is fresh. An older version of another table is not stale.
- **Hand-over.** Otherwise `shown`, `passing` and `fetch` are `handOver(incoming, shown, passing)`'s (unchanged).
- **Take.** The incoming room is shown when the hand-over takes it as it is (`fetch` undefined), when nothing is on show yet, or when it is the own view of the player holding the screen with no pass screen up (`own`): the move that brings a pass screen, or ends the game, shows at once and still sounds (#30 design §4).
- **Fresh.** `freshEvents(current, incoming)` when the room is taken and no pass screen was up; otherwise none, so events that arrive under a pass screen stay silent.

The store keeps the side effects: it sets `shown` and `passing`, asks for `fetch`, takes the room (with `receivedAt` and `me.code`), and counts and announces the fresh events.

## 3. The store's other changes

- **One guard for asked views (my call).** `#fetchView` and `takeSeat` each asked for a view and dropped the answer when the tab had left the table. Both now go through one `#askView(code, seat)`, which drops an answer from an older generation or another table; each caller keeps its own failure handling (the poll asks again; the pass screen stays and a toast says the server can't be reached). Inside one generation the table on show never goes back to null, so the two old guards were the same.
- **The timeout toast.** It reads `log.js`' `eventText` for the `timedOut` event, so the toast and the log say the same: "Vera's clock ran out; the rest of the turn was played for them." (was "Vera ran out of time. The rest of the turn was played for them."). This is the one visible change, and the issue asks for it; the owner approved the wording on 2026-10-28.

## 4. Tests

`tests/client-pass.test.mjs` gains one test per case: a stale version (and an older version of another table, which is taken), an online room with fresh events, the first view (taken even when the hand-over asks for another), a room for another seat swapped for the right one, the holder's own view when the turn passes (taken, fresh, and the public view asked for), the public view while a seat is on show (the seat's view asked for, nothing taken), and a pass screen (taken but silent; the named player's view taken when it arrives, still silent). The hot-seat browser tests (`pass-screen`, and every other test that plays a hot-seat table) run unchanged.
