# Landing page, new-table setup and lobby (#25): design

Written 2026-10-27. #25 builds the screens players see before a game starts: the landing page, where a player signs in and creates or joins a table, and the lobby, where the host sets the table up and starts the game. They talk to the table API from #23 and #24.

What the owner said is marked **(owner)**. Every other decision is marked **(my call)**, for the owner to revisit.

## 1. What and why

The server can run whole games (#22–#24), but the browser shows only a placeholder page. #3 is closed, so Lazar's mockups `docs/ui/launch.html` and `docs/ui/lobby.html` are the approved designs. #25 turns them into Svelte screens on the real API. It is the first of four client issues: #26 (the shared board), #27 (the player area) and #28 (the decision prompts) follow, in that order **(owner)**.

## 2. Decisions from the owner

- **Collisions (owner, 2026-10-27).** Where Lazar's mockup and the owner's design disagree, an aesthetic difference follows Lazar, and a functional one (a missing button, a flow the server needs) follows the owner's design.
- **Readiness is built, and it's informational (owner, 2026-10-27).** Each online player can mark themselves ready, and every seat shows READY or NOT READY. The host can start whether or not everyone is ready.
- **Own approach (owner, 2026-10-27).** Fablewood and Bird Table aren't the model. The client is designed to fit our own API.
- **Scope (owner, 2026-10-27).** #25 first, then #26–#28. #26 draws the game's real hex grids instead of the mockup's filler map.

## 3. Goals and non-goals

Goals:
- A guest can create a table, share its code, and play from the lobby to the start of a game, online or hot-seat.
- Coming back works: a refresh, a second visit, or a player whose running game is waiting.
- Every lobby control does what the server allows, and nothing more.

Non-goals:
- The game screen. After Start, a holding page stands in until #26.
- Solo tables, which wait for #31; expansions, which wait for their issues; Discord login (#43).
- Sound itself. The sound control is built and starts muted, but nothing plays until #29.
- The finished table and dealing again, which belong to the results screen (#29).

## 4. Layout and look

Lazar's mockups are the look: the 58 px header, the pixel-textured middle, the panel stack, the seat cards and the settings rows. The component library already has the parts: `TopBar`, `IconButton`, `Menu`, `TextInput`, `Button`, `Divider`, `Panel`, `Toast`, `Segmented`, `OpenTableRow`, `SeatCard`, `SettingRow` and `TableCode`. The screens compose them. A component changes only where the screen needs a state it doesn't have, and its library section shows the new state. Two need one each, drawn in their existing look **(my call)**:
- `SeatCard` gains an `add` state: the gold open frame holding a name field, **Add** and ×, for hot-seat tables. Its × moves to the frame's corner, as in the open state.
- `Segmented` gains `disabled`: the choices dim as `Button` does when disabled, and the group's tooltip says why.

The owner sees both in the screenshots and the library.

`tokens.css` stays the source for colours, as `docs/ui/README.md` says. The mockups' older player colours become the player tokens.

## 5. The landing page

As in `launch.html`:
- **The header:** the brand at the left, "Build a civilization that stands the test of time" in the middle, and the sound and menu controls at the right. The menu holds **How to play** and **About this project**.
- **The headline** names the four tracks in their colours.
- **The form panel:**
  - **Your name**, with the hint "Leave it empty to generate a mythical or historical name" inside the empty field. A blank name gets one from Lazar's generator: a first part and an ending, such as Cedarwyn. **(my call:** the mockup's generator, with longer lists)
  - **Create a table** signs in if needed, creates an online table with the current rules, and opens its lobby.
  - **or join friends**, the **8-character code** field and **Join table**. A code that isn't 8 letters or digits gets "Enter an 8-character table code." under the field before anything is sent.
- **The Open tables panel** lists `GET /api/tables`. Each row is an `OpenTableRow`: Join, the code, five seat boxes filled in the seats' colours, the rules version and the expansion badge. The list loads when the page opens and again every 10 seconds while it is shown **(my call)**. It has three more states: loading ("Looking for tables…"), empty ("No open tables right now. Create one and invite your friends.") and failed ("Can't reach the server. Retrying…").
- **Added (functional):** when `GET /api/me` reports a running game where the person holds a seat (`saved`), a **Return to your game** button sits at the top of the form panel, in Lazar's gold action style. It joins that table again. A person sitting at a table (`me.code`) never sees the landing page, because the app opens their table at boot. So the button shows only after they left a running game, which keeps their seat as away.
- **Errors** from the server (a full table, a wrong code, too many tables) show as the status line under the form, in the mockup's place for it.

## 6. The lobby

As in `lobby.html`, at 1000 px wide under the two-line invitation.

### 6.1 The top row

- **The mode panel:** **Mode:** with **Online mode** and **Local mode**, then the code with **COPY** when online, or "**Classic hot-seat gaming.** Your friends and you will share a screen." when local.
  - Only the host can switch, and only while the table has one seat (the server's rule). Otherwise the switch is shown but disabled, with a tooltip saying why **(my call)**.
  - COPY copies the code and confirms with a toast. If the browser refuses, the toast shows the code.
- **The action panel:** "Start the game, mark yourself / as ready, or leave the table!", then **Start game**, **I'm ready** and **Leave table**.
  - **Start game** is shown to the host only; other players see "Waiting for the host to start" in its place **(my call)**. The server refuses a start with fewer than 2 players, and the message shows as a toast.
  - **I'm ready** toggles the player's readiness. It turns gold with a green check when ready. It isn't shown at a hot-seat table, where everyone shares one screen **(my call)**.
  - **Leave table** leaves (`POST /api/leave`) and goes back to the landing page. A host who leaves hands hosting to the next seat, and a lobby nobody is left in closes (#22's rules), so leaving needs no confirmation.

### 6.2 The players

- **Players**, with "*n* of 5 joined", and five equal seat slots, 112 px high.
- **A filled seat** is a `SeatCard`: the player's colour, name, and the YOU · HOST · READY badges.
  - YOU marks the viewer's own seat. At a hot-seat table every seat is the host's, so YOU isn't shown there **(my call)**.
  - Readiness shows on every online seat, not only the viewer's **(owner)**.
  - The host's **×** removes a player (`remove-seat`). The host has no × on their own online seat.
  - An away seat isn't possible in a lobby (leaving a lobby gives the seat up), so it needs no state here.
- **An empty seat, online**, reads **Open seat** and does nothing when pressed; a friend fills it by joining with the code **(my call:** the server seats joiners in order, so Lazar's **Take the seat!**, which moves a player to another seat, has no server move behind it. It's left out.)
- **An empty seat, hot-seat:** **+ Open seat** turns into Lazar's gold open state, holding a name field and **Add** (`add-seat`), with × to cancel. A blank name gets a generated one. Names must differ, as the server checks. Only the host sees this; there is nobody else at a hot-seat table.
- **There is no civilization on a seat** and no civilization chooser. The rules deal each player 2 civilizations in secret once the game starts, and they keep one (01 §2.2). That choice is a decision prompt (#28), and Lazar's play-screen mockup already models it. **(functional collision, owner's design)**

### 6.3 The table settings

Lazar's two-column settings panel. Each row is a `SettingRow`: title, a thin rule, the choices. The choices come from `GET /api/config`, so the screen never offers what the server refuses.

Left column:
- **Rules:** Current rules or Original 2019 (`configure { version }`).
- **Expansions:** the three expansion choices when `config.expansions` lists them. While it lists none, the row reads "Base game only for now" in muted text **(my call)**.
- **Turn timer:** Off, 1 min, 2 min or 5 min (`settings { timer }`). It is missing from the mockup and the owner's design asks for it. **(functional collision, owner's design)**
- **Undo:** Allow undo or No undo (`settings { undo }`).

Right column, the variants (#53), each a Yes/No row like Lazar's extra rules:
- Tapestry draft on income turn 1;
- Civilization draft;
- Neoprene Nanotechnology;
- Without Radio and Lithium-Ion Battery;
- Start on the closest island.

The row titles are short forms of the `VARIANTS` names, and each row's tooltip carries the full name **(my call)**. They replace Lazar's sample rows, which aren't game rules: Landmarks draft, Random civilizations and Open information. Lazar's **Map** row (Random map, Archipelago, Continents) is left out too: the player count picks the map side. **(functional collisions, owner's design)**

Players who aren't the host see the settings, but can't change them **(my call)**.

### 6.4 Readiness on the server

A new room transition, `ready(room, personId, ready)`, and endpoint, `POST /api/ready { ready }`:
- A player sets readiness on their own seat, online, in the lobby.
- It carries no table `version`, like `leave` **(my call:** it touches only the player's own seat and decides nothing, so a stale version could only make it fail for no reason.)
- A joiner starts not ready, and a join doesn't change anyone else's readiness. A removed or departed seat takes its readiness with it **(my call)**.
- At a hot-seat table it is refused with "Everyone here shares one screen."; once a game is dealt, with "The game has already started."
- A host change to the mode, the options or the settings clears every seat's readiness, so READY always means ready for the table as it is now **(my call)**.
- Starting a game drops readiness: the seats are dealt without it.
- The room view's seats gain `ready: boolean`.
- `ready` returns the same room when nothing changes, so `commit()` doesn't wake anyone.

### 6.5 After Start

A holding page under the same header: the table code, the players in seat order, and "The game has begun. The game screen comes with #26." **(my call)** #26 replaces it.

## 7. The client

Three new modules, and the screens.

### 7.1 `src/lib/api.js`

The API client, as a plain module so `node --test` can run it against the real server:
- `createApi({ base, fetch, storage })` returns `{ request, token, name, signIn, signOut }`. In the app, `base` is `/api`, `fetch` the browser's, and `storage` the tab's `sessionStorage`.
- Every request sends `Authorization: Bearer <token>`. An answer outside 200 becomes an `ApiError` with the server's `error` message and the `status`.
- **The token lives in `sessionStorage`**, so a refresh keeps the session but each tab is its own guest **(my call:** two tabs can play two seats on one computer, which also makes testing easy. The server's sessions expire unused, so nothing is lost when a tab closes.)
- A 401 clears the stored token, so the next step signs in again.

### 7.2 `src/lib/game.svelte.js`

The one rune module that holds what the client knows (CONVENTIONS.md): `config`, `me`, the open `tables`, the current `room` view with its `version`, and short messages for the toast and the status line. Screens read it and call its actions:
- **Boot:** read `config`. With a stored token, ask `me`. If `me.code` names a table, fetch its `state` and open the lobby (or the holding page). A 401 forgets the token. Otherwise show the landing page.
- **Actions:** `createTable`, `joinTable`, `returnToGame`, `leaveTable`, `configure`, `settings`, `setReady`, `addSeat`, `removeSeat` and `start`. Each sends the room's `version` where the server wants one and takes the room view it answers.
- **A stale version (409)** fetches the newer state. If its seats are the same as before (the same names in the same order), the action is sent once more with the new version, because each action sets a value or names a seat that hasn't moved. If the seats changed, the client shows "The table changed. Try again." instead **(my call:** with three to five players toggling readiness, the host's clicks would often meet a newer version. A retry is safe while the seats stay put, but a removal after a seat moved could hit the wrong player.)

### 7.3 The long poll

`src/lib/poll.js` holds the loop as a plain function, `pollTable({ request, version, accept, stopped, wait })`, so a test can drive it:
- One request at a time: `GET /api/state?since=<version>`. Each answer goes to `accept`, and the next request asks with the new version.
- **Failures back off**: 1, 2, 4 and 8 seconds, then every 10, and the status says "Connection lost. Retrying…" until an answer comes **(my call)**.
- **A 400 from the poll** means the person lost their seat: the host removed them, or the table closed or expired. The poll sends no `seat`, so "You aren't at this table." is the only 400 `GET /api/state` can give it. The client goes back to the landing page and shows "You're no longer at that table." **(my call:** clearer than the server's wording on the landing page).
- The loop runs while a table is open and stops when the player leaves it.

### 7.4 The screens

`src/App.svelte` shows one screen at a time from the store's state: landing, lobby or holding. The screens live in `src/screens/` (`Landing.svelte`, `Lobby.svelte`, `Holding.svelte`) **(my call:** they own state and call the API, unlike the presentational components in `src/lib/components/`). Small rules a screen needs, such as which seats a viewer may remove or how a room view becomes five slots, live in `src/lib/lobby.js`, so they are tested in Node.

### 7.5 Shared header controls

- **Sound** toggles the red slash and remembers the choice in `localStorage`. It starts muted (design document goal 6).
- **The menu** holds How to play and About this project. How to play opens a short panel about creating and joining tables. Rules help in the game comes with the game screen.

## 8. Accessibility and the desktop

- Every control is a button or a labelled field, and works from the keyboard with visible focus.
- The toast and the status line are `aria-live`.
- The pages are checked at 1920×1080, the review size. There is no phone layout.

## 9. Tests

- **Rooms and API:** `ready()` in `tests/rooms.test.mjs`, with the randomized room test gaining a ready step; `POST /api/ready` and the view's `ready` in `tests/api.test.mjs`.
- **Client modules:** `tests/client-api.test.mjs` runs `api.js` against the server on port 0, signing in, creating, joining, and the error and 401 paths. `tests/client-poll.test.mjs` drives `pollTable` with a fake request: answers in order, the back-off, and the 400 that ends it. `tests/client-lobby.test.mjs` covers `lobby.js`, and `tests/client-names.test.mjs` the name generator.
- **Components:** each new component state gets its library section; `npm run check` stays at 0 errors and 0 warnings.
- **In the browser:** a walkthrough with two tabs: create, join, ready, settings, remove, a hot-seat table with added names, start, leave. The screenshots for the README come from the running game.

## 10. Documents

- The README's **Current interface** and `docs/ui/README.md` show the built landing page and lobby, captured from the running game (CLAUDE.md).
- CLAUDE.md records #25 when it's done, with the calls to revisit.

## 11. Handed off

- **#26–#28:** the game screen replaces the holding page; the header gains the in-game controls.
- **#29:** the finished table: results, dealing again, newcomers at a finished table, and readiness there if wanted. The log names the variants.
- **#30:** the hot-seat pass screen asks `state?seat=` for each seat.
- **#31:** Solo mode and the Automa's level join the mode switch and the settings.
- **#32 and later:** the expansion choices appear by themselves once `config.expansions` lists them.
- **#43:** Discord login beside the guest one.
