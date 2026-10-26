# Server API (#23) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Serve #22's tables over HTTP: guest sessions, the endpoints of design §6, long polling and 409 for stale versions.

**Architecture:** `api.mjs` holds rooms, sessions and waiting requests in memory and routes `/api/` requests to `rooms.mjs` transitions through one `commit()`; `server.mjs` keeps static serving and hands `/api/` to it. `rooms.mjs` gains the pure `roomView()` and `tableChoices()`.

**Tech Stack:** Node 22 `node:http`, `node:crypto`; no packages; `node:test` with `fetch` against port 0.

**Spec:** `docs/superpowers/specs/2026-10-26-server-api-design.md`

## Global Constraints

- Statuses: 400 `PlayerError` `{ error }`, 401 "Sign in again.", 404 unknown path ("Unknown request.") or table ("There is no table with that code."), 405 "Use GET for this request." / "Use POST for this request.", 409 "The table changed. Try again.", 413 "That request is too large.", 429 "Too many requests. Try again shortly.", 503 "The server is full. Try again later.", 500 "Something went wrong. Try again.".
- Bodies: JSON objects of at most 16 KB, else 400 "Send the request as a JSON object." (or 413).
- `config` (exported from `server.mjs`): `longPollMs` 25,000, `sessionMs` 86,400,000, `maxSessions` 10,000, `apiLimit` 1,800, `createLimit` 20, `loginLimit` 30, per minute.
- Bearer tokens are 24 random bytes in hex; person ids never leave the server.
- Every room in an answer goes through `roomView()`; the server adds `version`.
- Files start with a one-line comment; exported functions have JSDoc; Prettier (tabs, single quotes).

## Review Focus

- A long-poll request whose client disconnects must not be answered later or leak its timer: Task 3 tests that a closed request leaves no waiter (`api.waiting()` count back to 0).
- A request that throws midway must not leave a half-committed room: transitions are pure, and Task 3 tests that a refused move leaves the version unchanged.
- Two clients answering at once must both end up applied or 409, never lost: Task 4's concurrent game retries 409s and must finish.
- A hot-seat state request must never show a seat's private view unless asked: Task 4 tests the default public view.
- A removed or expired table must answer its waiters, not leave them hanging: Task 3 tests removal and sweep.

---

### Task 1: The pure pieces

**Files:**
- Modify: `src/lib/engine/setup.js`, `src/lib/engine/game.js` (export `VERSIONS`, `EXPANSIONS_BUILT`), `limits.mjs` (`rateLimiter(limit | () => limit, windowMs)`), `rooms.mjs` (`roomView`, `tableChoices`)
- Test: `tests/engine-setup.test.mjs`, `tests/limits.test.mjs`, `tests/rooms.test.mjs`

**Interfaces:**
- Produces: `EXPANSIONS_BUILT: readonly string[]` (empty); `roomView(room, personId, seat?) → RoomView` (design §7); `tableChoices() → { modes: ['online', 'hotseat'], versions: { id, name }[], expansions: string[], variants: string[], levels: number[], maxSeats: 5 }`.

- [ ] **Step 1: Failing tests.** `'an expansion is refused until its setup is built'` (`EXPANSIONS_BUILT` is `[]`, frozen); `'a limit can be read each time, so it can change'` (a limit function returning 1 then 3); `roomView`: the lobby view's exact shape for the host; online `viewing` is the own seat and `game` is that seat's view (has its `hand`, the other seat has none); hot-seat defaults to `viewing: null` and a public game view, and `seat: 2` gives seat 2's; a stranger gets "You aren't at this table."; a seat not played gets "That seat isn't yours."; the newcomer at a finished table gets the public view; no `player` ids, `touched` or `version` anywhere in the JSON. `tableChoices()` equals its expected value.
- [ ] **Step 2: Run** the three test files. Expected: the new tests FAIL.
- [ ] **Step 3: Implement.** `checkOptions` refuses a known expansion not in `EXPANSIONS_BUILT` with the existing message. `tableChoices` lists `online` and `hotseat` (solo joins with #31).
- [ ] **Step 4: Run** the three files and `npm run check`. Expected: PASS, 0 errors.
- [ ] **Step 5: Commit** `Refs #23: add the room view and the table choices`.

### Task 2: Sessions and the table endpoints

**Files:**
- Create: `api.mjs`
- Modify: `server.mjs` (route `/api/` to `api.handle`, export `config` with the design's values, run `api.sweep()` every minute)
- Test: `tests/api.test.mjs`

**Interfaces:**
- Produces: `createApi(config) → { handle(req, res): Promise<void>, sweep(now?): void, waiting(): number }`; `server.mjs` exports `api` (the one instance) beside `server` and `config`.

- [ ] **Step 1: Failing tests** (server on port 0): login cleans the name and refuses a blank one; `/api/me` without a token is 401; `/api/config` equals `tableChoices()` plus `longPollMs`; create answers the room view with `version: 1`; join by code (any case) seats a second person; `/api/tables` lists the open lobby and stops once it starts; creating while seated is refused ("Leave your table first."); an unknown code is 404; bad JSON 400; a 17 KB body 413; `GET /api/create` 405; an unknown path 404.
- [ ] **Step 2: Run** `node --test tests/api.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement** `api.mjs`: sessions `{ id, name, used, code }`; `readJson(req)`; routing by method and path; `commit(code, next)` (design §8); `sendJson` with `Cache-Control: no-store`. Errors map to the Global Constraints' statuses; anything else is logged with `console.error` and answers 500.
- [ ] **Step 4: Run** `node --test tests/api.test.mjs tests/static.test.mjs`. Expected: PASS (the static tests' `/api/nothing` and `/api` still answer 404 JSON).
- [ ] **Step 5: Commit** `Refs #23: add guest sessions and the table endpoints`.

### Task 3: Versions, moves and long polling

**Files:**
- Modify: `api.mjs`
- Test: `tests/api.test.mjs`

- [ ] **Step 1: Failing tests:** configure, add-seat, remove-seat, start and end with a stale `version` get 409 and change nothing (state's version unchanged); a move for another's seat is 400; a refused move leaves the version; `state?since=` answers at once when newer, wakes within a second of another client's join, answers unchanged after `config.longPollMs` (shortened to 150 ms), and answers 400 "You aren't at this table." when the host removes the seat or the table expires (`api.sweep(now + 2 days)`); a waiting request whose client aborts leaves `api.waiting()` at 0; leaving a running game answers `{ saved: true }`, a new table is then refused naming the code, and joining back restores the seat.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement** the version check before every transition endpoint, `wait()`/`wake()` with the waiter's `seat`, `res.on('close')` cleanup, and `sweep()` (rooms, sessions, limiters).
- [ ] **Step 4: Run** `node --test tests/api.test.mjs`. Expected: PASS.
- [ ] **Step 5: Commit** `Refs #23: check versions and long-poll the table`.

### Task 4: Two clients play a game; hot-seat; limits

**Files:**
- Modify: `api.mjs` (as the tests need), `tests/api.test.mjs`

- [ ] **Step 1: Failing tests:** `'two clients play a whole game over HTTP, each answering only its own decisions'` (both loops run concurrently, retry on 409, finish with `game.phase === 'over'` and `game.result`, and never see the other seat's `hand` or `picks`); `'a hot-seat host plays every seat through one session'`; `'creating tables is limited per address'` (with `config.createLimit = 2`, the third create in a minute is 429); `'sessions expire after a day unused'` (`config.sessionMs = 50`); `'the server refuses logins past its session cap'` (`config.maxSessions` = current count).
- [ ] **Step 2: Run.** Expected: FAIL where behaviour is missing.
- [ ] **Step 3: Implement** what fails.
- [ ] **Step 4: Run** `npm test` and `npm run check`. Expected: all pass, 0 errors.
- [ ] **Step 5: Commit** `Refs #23: play a game over HTTP, hot-seat and the limits`.

### Task 5: Record #23

- [ ] Update `CLAUDE.md` (Architecture: `api.mjs`, the endpoints; Where the work stands; Next), `CONVENTIONS.md` (Server: sessions and statuses) and `README.md` (the status line); run `npm run format`; comment the handoffs on #24, #25, #30 and #43; commit `Fix #23: add the server API with long polling and version checks`.
