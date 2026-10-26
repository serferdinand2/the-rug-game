# Server API (#23): design

Written 2026-10-26. This is the second issue of M4 · Tables and server. It serves #22's tables over HTTP: clients sign in as guests, long-poll the table they sit at, and send moves that carry the table's version, so a stale move gets 409.

The owner asked for #23 without a question round ("Ok work on 23"), as for #19–#22. So every decision the issue, the design document, the conventions and #22's handoff don't settle is marked **(my call)**, for the owner to revisit.

## 1. What and why

The rules engine (#13–#21) plays a game, and `rooms.mjs` (#22) holds the table rules, both as pure functions. Nothing yet lets a browser use them. #23 is the adapter between them and HTTP, in Bird Table's style:
- `node:http`, no packages;
- every table in memory;
- guest sessions with bearer tokens;
- one long-poll endpoint for changes;
- the room version on every change.

The browser screens (#25–#30) are built on this API, so it has to say everything they need, and nothing private.

## 2. Goals

1. A guest signs in with a name and gets a token.
2. With it they create or join a table by its code, change its options, add and remove seats, start, end and leave it, and answer the game's decisions.
3. `GET /api/state?since=<version>` answers at once when the table is newer than `since`, and otherwise waits until it changes or 25 seconds pass.
4. Every mutating request about the table carries the table's version; a stale one gets **409** and changes nothing.
5. Game state leaves the server only through `view()`, for the seat the person plays.
6. The rate limits come from `limits.mjs`.
7. The issue's two checks: a two-client HTTP test plays a game, and stale moves get 409.

## 3. Non-goals

- The turn timer, undo and kicking a player who keeps timing out: #24. The issue lists the timer and undo endpoints, but they come with #24's rules.
- Discord login: #43. Guests are the only way in until then.
- The screens: #25–#30. The hot-seat pass screen (#30) decides which seat to show; the API lets it ask for any seat the host plays.
- Saving tables to disk, accounts, spectators (non-goals of the whole design).
- Telling a new deal from the old game in the event log (#29).

## 4. Modules

- **`api.mjs`** (new, at the root beside `server.mjs`): the table API. It holds the rooms, the sessions and the waiting requests in memory, and answers `/api/` requests. **(my call:** `server.mjs` already serves the static files; one more focused module keeps each file to one job.)
- **`server.mjs`** keeps the HTTP server, the security headers, static files and the per-address limit, and hands `/api/` requests to `api.mjs`. It still exports `server` and `config`; tests change `config` to shorten the waits.
- **`rooms.mjs`** gains two pure functions:
  - `roomView(room, personId, seat)`, what one person sees of a table;
  - `tableChoices()`, what a new table may choose. The new-table screen (#25) reads it, so it never offers something the engine refuses.
- **`limits.mjs`**: `rateLimiter()` may take its limit as a function, so a test can change a limit without restarting the server.
- **The engine** exports `VERSIONS` and `EXPANSIONS_BUILT`, an empty list until an expansion's setup is built. It is the counterpart of #22's `VARIANTS`. `checkOptions()` reads it, so "Plans & Ploys isn't available yet." comes from one place.

## 5. Sessions

- **`POST /api/login { name }`** creates a guest session and answers `{ token, name }`.
  - The token is 24 random bytes in hex.
  - The name goes through `cleanName()`, so a blank one is refused.
  - The client makes up a name when the player gives none: the launch mockup has a name generator.
  - Every login is a new person with a new id. The id never leaves the server. **(my call:** other players only need names and seat numbers, and an id that never leaves can't be spoofed.)
- **Requests** carry `Authorization: Bearer <token>`. Without a valid session, the answer is **401** "Sign in again.". **(my call:** Bird Table answers 400, but a separate status tells the client to sign in again.)
- **Expiry.** A session whose person holds a seat expires 24 hours after its last use; any other after 1 hour. **(my call)**
  - A seat counts if it is present at any table, or in a running game, away or not, since a player who leaves a running game must keep their session to come back.
  - A seat left at a finished table holds nothing. This keeps the held sessions under 5 per table, so at most 5,000 under the session cap.
  - A session that ends leaves every table it sits at, as `leave` would. Otherwise a seat nobody can play any more would stop the others from ending the game, and hold them from other tables. **(my call, from the review)**
- **The cap.** Sessions are capped at **10,000**. At the cap, a new login replaces the longest-unused session whose person holds no seat, so nobody loses a seat to it. Only when every session holds a seat does a login get 503 "The server is full. Try again later." **(my call, from the security review:** a hard cap let one address fill the server and lock everyone out for a day.)
- **One table at a time.** A session sits at one table at a time (`session.code`), as in Bird Table. To create or join another, the person leaves first. While their seat holds up a running online game, `unfinishedSeat` refuses them a new table: "You still have a seat in a game at table 3f9a1c07. Return to it with that code first." Because a person sits at one table at a time, they can't be in two lobbies, so `start` needs no `unfinishedSeat` check. That answers #22's handoff note.

## 6. Endpoints

All bodies and answers are JSON. Request bodies are at most 16 KB.

| Endpoint | Body or query | Session | Version | Answer |
|---|---|---|---|---|
| `GET /api/config` | | – | – | `tableChoices()` and the long-poll wait |
| `GET /api/tables` | | – | – | `{ tables: openTables(rooms) }` |
| `POST /api/login` | `{ name }` | – | – | `{ token, name }` |
| `GET /api/me` | | yes | – | `{ name, code, saved }`: `code` is the table they sit at, `saved` a running game where they hold a seat, for "Return to your game"; each null when there is none |
| `POST /api/create` | `{ options }` | yes | – | the room view |
| `POST /api/join` | `{ code }` | yes | – | the room view |
| `GET /api/state` | `?since=<version>&seat=<n>` | yes | – | the room view, long-polled |
| `POST /api/configure` | `{ version, options }` | yes | yes | the room view |
| `POST /api/add-seat` | `{ version, name }` | yes | yes | the room view |
| `POST /api/remove-seat` | `{ version, seat }` | yes | yes | the room view |
| `POST /api/start` | `{ version }` | yes | yes | the room view |
| `POST /api/end` | `{ version }` | yes | yes | the room view |
| `POST /api/move` | `{ version, seat, action }` | yes | yes | the room view |
| `POST /api/leave` | | yes | – | `{ saved, code }` |

How each endpoint behaves:
- **Body fields.** `options` holds the table settings, as `createRoom` and `configure` take them (`mode`, `version`, `expansions`, `variants`, `level`). The top-level `version` is always the table's version. **(my call:** this keeps the rules version and the table version apart.)
- **`create`** draws the code with `newCode()` and `crypto.randomInt`, sweeps expired tables, then `addRoom()`. It has a per-address limit of 20 a minute, as in Fablewood. One address may also keep at most **10** tables open at once (429 "Too many tables are open from your address. Close one first."). With that, filling the 1,000-table cap takes 100 addresses. **(my call, from the security review)**
- **`join`** takes the code case-insensitively, trimmed. An unknown code answers 404 "There is no table with that code."
- **`move`.** `seat` may be left out when the person plays one seat (online). At a hot-seat table it is required, because the host plays every seat.
- **`leave`** carries no version. **(my call:** leaving should always work, and it only touches the leaver's own seats.) It clears the session's table even when the room closes. `create` and `join` carry none either: a joiner can't know the version yet. **(my call)**
- **Missing version.** A table change whose `version` isn't a whole number gets 400 "Send the table version.", not 409. **(my call, from the review)**
- **`state`, `seat`.** `seat` picks which of the person's seats to see. Online it defaults to their seat. At a hot-seat table it defaults to the public view, so nothing private shows until the pass screen (#30) asks for a seat. **(my call)**

**Statuses:**
- 200 for success;
- 400 for a `PlayerError`, with `{ error }`;
- 401 for no valid session;
- 404 for an unknown endpoint or table code;
- 405 for the wrong method;
- 409 for a stale version: "The table changed. Try again.";
- 413 for a body over 16 KB;
- 429 when a limit is reached;
- 503 when the server is full;
- 500 for anything else, logged with a generic message (CONVENTIONS.md).

A body that isn't JSON, or isn't an object, gets 400 "Send the request as a JSON object."

## 7. The room view

`roomView(room, personId, seat)` is the only way a room leaves the server:

```js
{
  code, mode, options, phase,
  host: 1,                       // the seat number of the host's first seat
  seats: [{ seat: 1, name: 'Ana', away: false }, …],
  you: [1],                      // the seats this person plays
  viewing: 1,                    // the seat whose view `game` is, or null for the public view
  game: view(room.game, viewing) // null in the lobby
}
```

The server adds the table's `version`. Person ids, `touched` and the raw game never appear.

Who may see what:
- A person who holds no seat at the table is refused: "You aren't at this table."
- Asking for a seat they don't play is refused: "That seat isn't yours."
- A newcomer at a finished table holds a seat past the game's seats, so `view()` gives them the public view.

## 8. Changes and long polling

**One way in.** Every change goes through one function, `commit(code, next)`, as in Bird Table:
- When a transition returns the same room, nothing happens: no new version, no wake-up. #22 made "nothing changed" return the same object for this.
- Otherwise the room is stored with `version + 1` and `touched = now`, or deleted when `next` is null, and every request waiting on the table is answered.

**Waiting.** `GET /api/state?since=v`:
- answers at once when the table's version is above `v`, checked again when the request starts to wait, so a change in between is never missed;
- holds at most **4** waiting requests per session and **50** per address; past that the answer is 429 "Too many requests are waiting. Try again shortly.". The server accepts at most 10,000 connections. **(my call, from the review)**;
- otherwise it waits up to `config.longPollMs` (25 seconds), then answers with the table unchanged;
- a waiting request whose client went away is dropped;
- a waiting request whose person lost their seat (the host removed it, or the table closed or expired) is answered with 400 and the reason, so the client goes back to the landing page.

**Housekeeping.** Once a minute the server:
- expires games idle for a day, and lobbies idle for an hour, answering their waiting requests. A lobby's clients ask after it every 25 seconds, so only an abandoned one goes quiet. `LOBBY_IDLE_MS` in `rooms.mjs` sets the hour; **(my call, from the security review)**;
- expires sessions as §5 says;
- forgets quiet addresses in the rate limiters.

Each request a person makes about their table updates its `touched`.

**Robustness.** Answering a waiting request never throws: it runs from timers and from other people's changes, so an unexpected error there is logged and answered with 500 instead of stopping the server. A client that goes away mid-upload is dropped without logging a fault. A body over 16 KB is refused without reading it to the end, and the connection is closed.

**Randomness.** The engine's `random` is `crypto.randomInt`, as CONVENTIONS.md says.

## 9. Rate limits

Every request counts against one address, as `clientAddress()` gives it, honouring `TRUST_PROXY`. An IPv6 address counts by its /64 block (`addressKey()` in `limits.mjs`), since one household or host holds a whole block **(my call, from the security review)**:
- `/api/` in all: 1,800 a minute (today's limit);
- `create`: 20 a minute **(my call, from Fablewood)**;
- `login`: 30 a minute **(my call:** each login keeps a session in memory).

Past a limit the answer is 429 "Too many requests. Try again shortly.". The limits sit in `config`, so tests can change them.

What the limits do and don't do:
- **Behind a reverse proxy,** `TRUST_PROXY=true` must be set, or every player shares the proxy's address and its limits. The server warns once when a request arrives through a proxy it doesn't trust.
- **Sharing an address.** Players behind one carrier-grade NAT share an address too.
- **The table cap.** The per-address caps are the defence against filling the server. About 100 IPv4 addresses that keep polling could still fill the 1,000 tables and hold them. A started game lives for a day, and `LOBBY_IDLE_MS` only clears lobbies nobody polls. That is the limit of an in-memory server without accounts. **(review)**

## 10. Tests

`tests/api.test.mjs` starts the server on port 0 with short waits:
- **Two clients play a whole game over HTTP.** Each client long-polls its own view and answers its own open decisions with the first answer, at the same time as the other. They meet stale versions and retry, until the game is over. Throughout, neither view has the other seat's hand or picks.
- **A stale move gets 409** and changes nothing. Answering for another seat gets 400, and a request with no token gets 401.
- **Long polling:** answers at once when newer, wakes on another client's change, answers unchanged after the wait, and learns when the table closes or the host removes the seat.
- **Leaving:** leaving a running game keeps the seat away. A new table is then refused with the code, and coming back works.
- **Hot-seat:** the host adds players, starts, sees the public view by default and each seat on request, and moves for any seat.
- **Every endpoint's errors:** bad JSON, a large body, the wrong method, unknown paths and codes, a full server, the create limit and session expiry.
- `tests/rooms.test.mjs` covers `roomView()` and `tableChoices()`, and `tests/limits.test.mjs` covers a limit given as a function.

## 11. Handed off

- #24: the timer and undo endpoints and their room options, and timeouts through `commit`.
- #25: the landing page, new-table screen and lobby read `/api/config`, `/api/tables` and the room view. `src/lib/api.js` and `src/lib/game.svelte.js` (CONVENTIONS.md) are the client side, to be written there.
- #30: asks `state?seat=<n>` for the seat it passes to.
- #43: Discord login beside the guest login.
- #29: a deal counter, if it needs one to tell a new deal from the old game.
