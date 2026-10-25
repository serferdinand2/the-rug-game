# Table lifecycle (#22) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pure room transitions for creating, configuring, joining, leaving, starting and playing at a table, plus the helpers for the server's map of rooms, covered by a randomized invariant test.

**Architecture:** `rooms.mjs` at the repository root, beside `server.mjs` and `limits.mjs`, in Bird Table's style: each transition takes a room and returns a new one (or `null` when it closes) and throws the engine's `PlayerError`. The engine gains `checkOptions()` and a `variants` option, so the room checks options with the engine's own rules.

**Tech Stack:** Node 22 ES modules, no packages; `node:test`.

**Spec:** `docs/superpowers/specs/2026-10-25-table-lifecycle-design.md`

## Global Constraints

- Modes `'online' | 'hotseat' | 'solo'`; 2 to 5 seats to deal a game; at most 5 seats.
- Default options: `{ version: 'current', expansions: [], variants: [], level: null }`, mode `'online'`.
- Automa levels 1–6, default 2; solo is refused with exactly `Solo play isn't available yet.` after the level check.
- Codes: 8 lowercase hexadecimal digits. Cap: `MAX_ROOMS = 1000`. Expiry: `ROOM_IDLE_MS = 24 * 60 * 60 * 1000`.
- Names: trimmed, inner whitespace squeezed to one space, control characters removed, cut to 24 characters; empty is refused.
- Every refusal is `PlayerError` from `./src/lib/engine/game.js` with a sentence a player understands.
- `rooms.mjs` starts with a one-line comment, has JSDoc on every export, and uses the engine only through `src/lib/engine/game.js`.

## Review Focus

- A hot-seat host leaving a running game must not close the table, or the game is lost: Task 2 tests that every seat goes away and the room stays.
- A transition must never change the room it was given (the server keeps the old one on a 409): Task 2's randomized test deep-compares each input before and after (Task 3).
- `play` through a room must not let one online player answer for another seat: Task 2 tests `That seat isn't yours.`
- Options changed while a game runs would desync the room and its game: Task 2 tests `configure` refuses during play.
- A finished table where someone left must still map seat numbers to the finished game: Task 2 tests that leaving a finished game marks the seat away instead of removing it.

---

### Task 1: The engine checks table options

**Files:**
- Modify: `src/lib/engine/setup.js` (`validate` splits into the player checks and `checkOptions`; `createGame` takes `variants`), `src/lib/engine/game.js` (export `checkOptions`, `VARIANTS`)
- Test: `tests/engine-setup.test.mjs`

**Interfaces:**
- Produces: `checkOptions({ version, expansions = [], variants = [] })` throws `PlayerError` in this order: unknown version, expansions not a list, unknown expansion, unbuilt expansion, variants not a list, unknown variant (`Unknown variant: ${v}.`). `VARIANTS`: a frozen empty list of variant ids (#53). `createGame({ players, version, expansions, variants = [], random })`.

- [ ] **Step 1: Write the failing tests:** `'checkOptions accepts both versions with no expansions or variants'`; `'checkOptions refuses what createGame refuses'` (unknown version, `['pp']`, `['xx']`, `variants: 'x'` → `/variants must be a list/`, `variants: ['draft']` → `/Unknown variant: draft/`); `'createGame refuses an unknown variant'`.
- [ ] **Step 2: Run** `node --test tests/engine-setup.test.mjs`. Expected: the new tests FAIL.
- [ ] **Step 3: Implement** as in Interfaces; the existing refusal messages stay word for word.
- [ ] **Step 4: Run** `node --test tests/engine-setup.test.mjs` and `npm run check`. Expected: PASS, 0 errors.
- [ ] **Step 5: Commit** `Refs #22: let the engine check a table's options, variants included`.

### Task 2: The room transitions

**Files:**
- Create: `rooms.mjs`
- Test: `tests/rooms.test.mjs`

**Interfaces:**
- Consumes: `createGame`, `play`, `checkOptions`, `PlayerError` from `./src/lib/engine/game.js`.
- Produces (design §4–§6): `MAX_SEATS = 5`, `LEVELS = [1, 2, 3, 4, 5, 6]`; `phase(room) → 'lobby' | 'playing' | 'finished'`; `createRoom(code, person, options = {}, now = 0) → Room`; `configure(room, personId, changes) → Room`; `join(room, person) → Room`; `addSeat(room, personId, name) → Room`; `removeSeat(room, personId, seat) → Room` (seat is 1-based); `leave(room, personId) → { room: Room | null, saved: boolean }`; `start(room, personId, random) → Room`; `play(room, personId, seat, action, random) → Room`; `seatsOf(room, personId) → number[]`; `cleanName(name) → string`. `person` is `{ id: string, name: string }`.

- [ ] **Step 1: Write the failing tests**, one per rule, each asserting the exact message:
  - creating: the creator hosts seat 1 with the defaults; options and mode are checked (`Unknown rules version: x.`, `Unknown table mode: x.`); solo with level 7 → `Choose an Automa level from 1 to 6.`; solo with level 2 → `Solo play isn't available yet.`; a level at a non-solo table → `Only a solo table has an Automa level.`.
  - configuring: only the host (`Only the host can change the table.`); not while playing (`The game has already started.`); the mode only while alone (`The other players must leave before the mode changes.`), keeping the host's first seat; returns the same room when nothing changes.
  - joining: present → same room; away → seat back, host unchanged; newcomers online only (`This table is played on one screen.`), not mid-game (`This game has already started.`), not past 5 (`This table is full.`); a newcomer may join a finished table.
  - hot-seat seats: host only (`Only the host can add players.`), hot-seat only (`Players join an online table with its code.`), different names (`Each player at this screen needs a different name.`), up to 5, not mid-game.
  - removing: host only, lobby only, not the host's own online seat (`The host can't remove their own seat.`), at least one seat left at a hot-seat table.
  - leaving: lobby removes the seats and hands the host on; the last one out → `null`; mid-game marks away with `saved: true` and hands the host to the first present person; a hot-seat host leaving mid-game → every seat away, room kept; finished marks away, room `null` once nobody present remains; not seated → `You aren't at this table.`.
  - starting: only the host (`Only the host can start the game.`); not while running (`The game is already running.`); 2–5 seats (`A game needs at least 2 players.`); the game's seats are the room's names in order, with the room's version; a finished table deals a new game to the present seats only.
  - playing: before a deal → `Start the game first.`; another's online seat → `That seat isn't yours.`; an away seat → `Come back to the table first.`; a hot-seat host answers any seat; a legal answer returns a room whose game moved on.
  - names: `cleanName('  Ana \n  Maria  ')` is `'Ana Maria'`; 30 letters are cut to 24; `'   '` → `Enter a name.`.
- [ ] **Step 2: Run** `node --test tests/rooms.test.mjs`. Expected: FAIL (module missing).
- [ ] **Step 3: Implement `rooms.mjs`.** One private `withHost(room)` restores the host rule after every change (the first present person in seat order when the host is absent); one `settle(room)` returns `null` when the closing rule says so. Transitions return new objects and never mutate their input.
- [ ] **Step 4: Run** `node --test tests/rooms.test.mjs`. Expected: PASS.
- [ ] **Step 5: Commit** `Refs #22: add the room transitions`.

### Task 3: Many rooms, and the randomized test

**Files:**
- Modify: `rooms.mjs`
- Test: `tests/rooms.test.mjs`

**Interfaces:**
- Produces (design §7): `MAX_ROOMS`, `ROOM_IDLE_MS`; `newCode(rooms, random) → string`; `addRoom(rooms, room)` (sets it in the map; `There are too many tables right now. Try again later.` at the cap); `expireRooms(rooms, now) → string[]`; `openTables(rooms) → { code, host, seats, version, expansions }[]` (`host` is the host's name, `seats` the number taken), most recently touched first; `unfinishedSeat(rooms, personId, exceptCode) → string | null`. `rooms` is a `Map<string, Room>`.

- [ ] **Step 1: Write the failing tests:** a code is 8 hex digits and skips taken ones (a `random` that first draws a taken code); the cap; expiry keeps a room touched exactly `ROOM_IDLE_MS` ago and removes older ones, returning their codes; `openTables` lists only online lobbies with a free seat, newest first; `unfinishedSeat` finds a running game, ignores `exceptCode`, finished games and lobbies. Then `'random steps never break the room rules'`: 200 runs × 300 steps with 7 people and `seededRandom(run)`, over all three modes, checking after every step the invariants of design §9, that the input room is deep-equal to a copy taken before the step, and that every refusal is a `PlayerError`; a failure names the run and step.
- [ ] **Step 2: Run** `node --test tests/rooms.test.mjs`. Expected: the new tests FAIL.
- [ ] **Step 3: Implement** the helpers.
- [ ] **Step 4: Run** `npm test` and `npm run check`. Expected: all pass, 0 errors and 0 warnings.
- [ ] **Step 5: Commit** `Refs #22: add table codes, the open-tables list, expiry and the cap`.

### Task 4: Record #22

**Files:**
- Modify: `CLAUDE.md` (Architecture: `rooms.mjs`; Where the work stands: #22 done; Next: #23), `CONVENTIONS.md` (Server: rooms), `README.md` (the status line)

- [ ] **Step 1:** Update the files; comment on #53 that the table options take its variants through `VARIANTS`; run `npm run format`.
- [ ] **Step 2: Commit** `Fix #22: add the table lifecycle`.
