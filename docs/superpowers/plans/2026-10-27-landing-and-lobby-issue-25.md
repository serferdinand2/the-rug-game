# Landing page and lobby (#25) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Guests sign in, create or join a table, set it up in the lobby and start a game, on the real API, in Lazar's approved look.

**Architecture:** Readiness is one new room transition and endpoint. The client's logic sits in plain modules that `node --test` runs: `api.js` (requests and the token), `changes.js` (a change with its 409 retry), `boot.js` (where a returning person lands), `poll.js` (the long poll), `lobby.js` (seat slots and permissions) and `names.js` (the name generator). `game.svelte.js` holds the state as runes and wires those modules together. The screens in `src/screens/` compose the existing components.

**Tech Stack:** Svelte 5 (runes), Vite 8, plain Node 22 ES modules with JSDoc, `node:test`.

**Spec:** `docs/superpowers/specs/2026-10-27-landing-and-lobby-design.md`

## Global Constraints

- CONVENTIONS.md throughout: a one-line comment opening each file, JSDoc on exports, braces on every `if`, Prettier, `npm run check` at 0 errors and 0 warnings.
- Svelte: `<script module>` typedefs, `$props()` with `/** @type {Props} */`, `{...attr}` on the root with `class` merged, `rg-{name}--{part}` classes, colours only from `tokens.css`, handlers `{action}Handler`, callbacks `on{Component}{Action}` with a `ComponentEvent`.
- The client never decides a rule: what may be chosen comes from `GET /api/config` and the room view.
- Desktop only, checked at 1920×1080; keyboard and visible focus work.
- Commits say `Refs #25: …`; the last says `Fix #25: …`. Each ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

- Two players toggle readiness while the host changes a setting: the host's change still lands (the 409 retry), and nobody's seat is removed by mistake.
- A refresh in the lobby: the tab comes back to the same table, not the landing page.
- The host removes a player: that player's screen goes back to the landing page with "You're no longer at that table."
- The server is down at boot: the landing page shows "Can't reach the server. Retrying…", never a blank page.
- A hot-seat name that's already taken: the server's message shows and the typed name stays in the field.

---

### Task 1: Readiness on the server

**Files:** Modify `rooms.mjs`, `api.mjs`. Test: `tests/rooms.test.mjs`, `tests/api.test.mjs`.

**Interfaces:**
- Produces: `ready(room, personId, ready) → Room`; `RoomSeat.ready?: true`; the room view's seats `{ seat, name, away, ready }`; `POST /api/ready { ready }`, no `version`.

- [ ] Tests in `rooms.test.mjs`:
  - a player marks their own seat ready and unready, and the view shows it;
  - `ready` with the same value returns the same room;
  - refused at a hot-seat table with "Everyone here shares one screen.", and once a game is dealt with "The game has already started.";
  - `ready` that isn't a boolean is refused with "Choose whether you are ready.";
  - a joiner starts not ready and leaves the others' readiness alone;
  - `configure` that changes something, and `settings` that changes something, clear every seat's readiness in the lobby;
  - `start` deals seats without `ready`.
- [ ] Add a `ready` step to `randomStep`, and to `checkRoom` the invariant that `ready` appears only on seats of an online table with no game.
- [ ] Implement `ready` in `rooms.mjs` and the clearing in `configure` and `settings`; `roomView` adds `ready: s.ready === true`.
- [ ] Tests in `api.test.mjs`: `POST /api/ready { ready: true }` without a version answers the room view with the seat ready, and wakes a waiting poll; at a hot-seat table it answers 400 with the message.
- [ ] Add `ready: 'POST'` and its case in `api.mjs`, committing through `commit()` without the version check.
- [ ] `npm test` passes. Commit.

### Task 2: The API client, changes and boot

**Files:** Create `src/lib/api.js`, `src/lib/changes.js`, `src/lib/boot.js`. Test: `tests/client-api.test.mjs`.

**Interfaces:**
- Produces:
  - `class ApiError extends Error { status: number }`;
  - `createApi({ base, fetch, storage }) → { request(endpoint, body?), token(), name(), signIn(name), signOut() }`. `request` sends GET without a body and POST with one, and `Authorization: Bearer` when a token is stored. A 401 clears the token. Storage keys are `rg-token` and `rg-name`.
  - `change(request, endpoint, body, room) → Promise<RoomView>`: sends `{ ...body, version: room.version }`. On a 409 it fetches `state`; with the same seats (`sameSeats`) it sends once more with the new version, otherwise it throws `ApiError(409, 'The table changed. Try again.')` carrying the fresh room as `error.room`.
  - `sameSeats(a, b) → boolean`: the seats' names are equal, in order.
  - `boot(api) → Promise<{ config, me, room }>`: `room` is the table `me.code` names, or null. A 401 on `me` signs out and boots as a guest.

- [ ] Tests against the server on port 0 (as `api.test.mjs` starts it), with `storage` a `Map`-backed object:
  - `signIn` stores the token and name, and `request('me')` answers that name;
  - a refused request throws `ApiError` with the status and the server's message;
  - a 401 clears the stored token;
  - `change` lands after another person's change bumped the version, when the seats are the same;
  - `change` throws the 409 with `error.room` when someone joined in between;
  - `boot` with no token gives `me: null, room: null`; with a seated token, the room; with a stale token, a guest with the token cleared.
- [ ] Implement the three modules.
- [ ] Tests pass. Commit.

### Task 3: The lobby rules, names and the poll

**Files:** Create `src/lib/lobby.js`, `src/lib/names.js`, `src/lib/poll.js`. Test: `tests/client-lobby.test.mjs`, `tests/client-names.test.mjs`, `tests/client-poll.test.mjs`.

**Interfaces:**
- Produces:
  - `seatSlots(room, maxSeats) → Slot[]`, always `maxSeats` long. `Slot` is `{ seat, state: 'player' | 'empty', name, you, host, ready, removable }`. `you` only online; `ready` is a boolean online, undefined at a hot-seat table; `removable` when the viewer hosts, no game is dealt, the slot isn't the host's own online seat, and more than one seat is filled.
  - `isHost(room)`, `canChangeMode(room)` (the host, no game, one seat).
  - `validCode(text) → boolean`: 8 letters or digits after trimming.
  - `rulesLabel(id, config)`: `'Current rules'` or `'Original 2019 rules'`, as `OpenTableRow` shows them.
  - `VARIANT_LABELS`, the short row titles by id: `tapestry-draft` "Tapestry draft", `civ-draft` "Civilization draft", `neoprene-nanotechnology` "Neoprene Nanotechnology", `no-radio-battery` "No Radio or Battery", `closest-island` "Closest island".
  - `timerChoices(timers)`: `[{ value: '0', label: 'Off' }, { value: '1', label: '1 min' }, …]`.
  - `generateName(random) → string`, with `random(n)` a whole number below n: one of Lazar's first parts plus one of his endings, extended to at least 16 of each, never over 24 characters.
  - `backoff(failures) → ms`: 1000, 2000, 4000, 8000, then 10000.
  - `pollTable({ request, version, accept, lost, trouble, stopped, wait }) → Promise<void>`: one `state?since=<version()>` request at a time. Each answer goes to `accept`. A 400 calls `lost(error)` and ends. Any other failure calls `trouble(failures)` and waits `backoff(failures)`. It ends when `stopped()` is true.
- [ ] Tests:
  - `seatSlots` for a host and a guest online, at a hot-seat table, and with a game dealt;
  - `canChangeMode` true only for the host with one seat and no game;
  - `validCode` accepts `3f9a1c07` and ` 3F9A1C07 `, and refuses 7 or 9 characters and punctuation;
  - `generateName` gives names of 3–24 characters, and two different seeds give two different names;
  - `backoff` gives the sequence;
  - `pollTable` with a fake `request`: answers arrive in order with increasing `since`; a failure, then a success, calls `trouble(1)`, then `accept`; a 400 calls `lost` and stops; `stopped` ends the loop.
- [ ] Implement the three modules.
- [ ] Tests pass. Commit.

### Task 4: Two component states

**Files:** Modify `src/lib/components/lobby/SeatCard.svelte`, `src/lib/components/ui/Segmented.svelte`, their library sections in `src/library/sections/`, and `src/lib/components/README.md`.

**Interfaces:**
- Produces:
  - `SeatCard` `state: 'add'`: the gold open frame holding a labelled name input (the placeholder "Name, or leave empty"), **Add**, and the × cancel. `onSeatCardAdd` receives `{ seat, name }`, and `onSeatCardCancel` as in the open state. Enter in the field adds. A bindable `name` keeps the typed text across a refused add.
  - `Segmented` `disabled?: boolean`: every choice is a disabled button, dimmed as `Button` is.
- [ ] Add the states. The library sections show `add` (empty and with a name) and a disabled `Segmented`, with the README rows updated.
- [ ] `npm run check` 0/0; `node --test tests/library.test.mjs tests/styles.test.mjs` pass. Commit.

### Task 5: The store and the screens

**Files:** Create `src/lib/game.svelte.js`, `src/screens/PageHeader.svelte`, `src/screens/HelpPanel.svelte`, `src/screens/Landing.svelte`, `src/screens/Lobby.svelte`, `src/screens/Holding.svelte`. Modify `src/App.svelte`.

**Interfaces:**
- Consumes: Tasks 2–4.
- Produces: `createStore({ api, random, storage }) → Store` in `game.svelte.js`. Its `$state` fields are `screen` ('loading' | 'landing' | 'table'), `config`, `me`, `tables`, `tablesState` ('loading' | 'ready' | 'failed'), `room`, `status` and `toast`. Its actions are `start()` (boot), `createTable(name)`, `joinTable(name, code)`, `returnToGame()`, `leaveTable()`, `configure(options)`, `settings(changes)`, `setReady(ready)`, `addSeat(name)`, `removeSeat(seat)`, `startGame()`, `copyCode()`, `notify(message)` and `setSound(on)`.

- [ ] The store:
  - `start()` boots, then shows the landing page or the table. While a table is open it runs `pollTable`, stopping on leave and on `lost` (back to the landing page with "You're no longer at that table.").
  - While the landing page shows, it refreshes `tables` every 10 seconds.
  - Create and join sign in first when the stored name differs from the typed one, or no token is stored. A blank name is generated.
  - Every lobby action goes through `change()`, except `ready` and `leave`. A refused one puts the message in `toast`, or in `status` on the landing page.
  - Sound is remembered under `rg-sound`, off by default.
- [ ] The screens, to the spec's §5–§6 and Lazar's mockups:
  - `PageHeader`: `TopBar` with the optional title, sound and menu (How to play, About this project). How to play opens `HelpPanel`; About shows the toast "A browser game of civilizations rising through the eras, inspired by Tapestry."
  - `Landing`: the headline, the form panel with the Return button when `me.saved`, and the Open tables panel in its four states.
  - `Lobby`: the invitation, the top row, the players, the settings in two columns. A guest's settings are disabled.
  - `Holding`: the code, the players and "The game has begun. The game screen comes with #26."
- [ ] `App.svelte` creates the store with `createApi({ base: '/api/', fetch: window.fetch.bind(window), storage: sessionStorage })` and `crypto`-based `random`. It shows the screen for `store.screen`, and one fixed `Toast`.
- [ ] `npm run check` 0/0; `npm test` passes (`tests/static.test.mjs` still finds the page). Commit.

### Task 6: Walkthrough, screenshots and documents

**Files:** Modify `README.md` (Current interface), `docs/ui/README.md`, `docs/ui/screens/launch.png`, `docs/ui/screens/lobby.png`, CLAUDE.md, the spec if a call changed.

- [ ] Run `npm start` and walk through in a browser at 1920×1080 with two tabs: create; join by code and from the Open tables list; ready on and off on both; the host changes rules, timer, undo and a variant, and both see readiness cleared; COPY; the host removes the guest, and the guest lands on the landing page with the message; Local mode with three added names, a duplicate name refused; start; the holding page; a refresh comes back; leave; Return to your game after leaving a running game.
- [ ] Capture the landing page and the lobby from the running game into `docs/ui/screens/`, and update both READMEs' sections.
- [ ] CLAUDE.md: the #25 entry with its calls, the Architecture lines for the client modules and `ready`, and "Next".
- [ ] `npm run format`, `npm run check`, `npm test`. Commit `Fix #25: …`.
