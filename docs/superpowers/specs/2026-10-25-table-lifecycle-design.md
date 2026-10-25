# Table lifecycle (#22): design

Written 2026-10-25. This is the first issue of M4 · Tables and server. It adds the rules for tables: creating, configuring, joining, leaving and starting them. These are pure functions, which the server API (#23) will serve and the lobby (#25) will show.

The owner asked for #21 and #22 to be built and pushed to main without a question round ("work on 21 and 22 and push to main when you are done"). So every decision here that the issue, the design document or the approved lobby mockup doesn't settle is marked **(my call)**, for the owner to revisit.

**#53 is still open.** #22 is blocked by it because a table's options are fixed when its game starts, so the variants have to be known first. The owner asked for #22 anyway. So the table options include a `variants` list that the engine checks against the variants it has built, which today are none. When #53 is decided, each chosen variant is added to the engine's list and to the new-table screen; nothing in the table code changes. #53 stays open.

## 1. What and why

The engine (#13–#20) plays one game. A table is everything around it: who sits where, who may start, what happens when someone leaves, which rules the game uses. The sibling game Bird Table keeps these rules in `rooms.mjs` as pure transitions: each takes a room and returns a new one, and the server only stores the result. The issue asks for the same style, and it is the right one here too: the rules can be tested without a server, and a randomized test can throw thousands of joins and leaves at them.

The code says **room**, as Bird Table and CONVENTIONS.md do ("Mutating requests carry the room `version`"). Players see the word **table**. A room is one table.

## 2. Goals

1. Create a table, change its options, join it, leave it and start it, in online, hot-seat and solo modes.
2. The version, the expansions, the variants and the Automa's level are chosen at the table and fixed once the game starts.
3. Table codes like `3f9a1c07`, the open-tables list, expiry after a day without activity, and a cap on the number of tables.
4. The host role passes on when the host leaves.
5. A player who leaves a running game keeps an "away" seat and can return with the code. There are no bot seats.
6. Room transitions are covered by randomized invariant tests (the issue's checkbox).

## 3. Non-goals

- HTTP, sessions, logins, long polling and the room `version` counter: #23.
- The turn timer, kicking a player who times out, and undo: #24.
- The screens: #25. The hot-seat pass screen: #30.
- The Automa and the Shadow Empire: #31. Until then a solo table can't be created (§6).
- Rematch requests ("I want a rematch") and table win counts. The host can deal a new game at a finished table (§5); anything more waits for the results screen (#29).
- Spectators (a non-goal of the whole design).

## 4. The room

A room is a plain JSON object:

```js
{
  code: '3f9a1c07',
  mode: 'online',          // 'online' | 'hotseat' | 'solo'
  options: { version: 'current', expansions: [], variants: [], level: null },
  host: 'player-id',       // the id of the person who hosts; always holds a seat
  seats: [{ player: 'player-id', name: 'Ana' }, { player: 'other-id', name: 'Marko', away: true }],
  game: null,              // the engine state once dealt
  touched: 1761400000000,  // when anyone last used the table, for expiry
}
```

- **People and seats.** A person is `{ id, name }`; the server (#23) gives each session an id. A seat is a place in the game. Online, every person has one seat. At a hot-seat table one person, the host, plays every seat, so every seat's `player` is the host and each seat has its own name.
- **Seat numbers.** Seat `i` of the list is seat `i + 1` of the game, which sets its turn order and its colour (`playerColor()` in `src/lib/ui.js`). Seats never move or disappear while a game is on the table (§5), so the numbers stay right.
- **Away.** `away: true` marks a seat whose person left a game in progress. A person is *present* when they hold a seat that isn't away.
- **`touched`** is set when the room is created. The server updates it on every request (#23); the transitions never read the clock.

## 5. The transitions

Every transition is pure. It returns a new room, or the same room when nothing changes, or `null` when the room closes. It throws the engine's `PlayerError` with a sentence for the player when the move isn't allowed, so the server answers every rule error with 400.

`phase(room)` is `'lobby'` before the first deal, `'playing'` while the game runs and `'finished'` once it is over.

- **`createRoom(code, person, options, now)`.** The creator hosts and takes seat 1. `options` may name `mode` and any of the game options; the rest default to online, the current official rules, no expansions, no variants. **(my call: the current rules are the default, as on Board Game Arena.)**
- **`configure(room, personId, changes)`.** The host may change the mode and the options in the lobby, and at a finished table before dealing again. The approved lobby mockup has the mode switch and the settings panel in the lobby, so creating a table only needs a name (`docs/ui/README.md`, "Lobby page"). **(my call)** The options are fixed once a game is dealt, which is what #53 asks for.
  - The mode can change only while the host is the only person at the table, so nobody is dropped by surprise. Changing it keeps only the host's first seat. **(my call)**
  - The engine checks the version, the expansions and the variants with the same function `createGame()` uses, so the table can never hold options the engine would refuse.
- **`join(room, person)`.**
  - A person who is present already changes nothing.
  - A person with an away seat takes it back.
  - Anyone else sits down at the end, online only, while no game is running and fewer than 5 seats are taken. A hot-seat or solo table is played on one screen, so nobody else can join it.
  - A newcomer can sit down at a finished table, to be dealt into the next game, as in Bird Table.
- **`addSeat(room, personId, name)`.** At a hot-seat table, the host adds a player by name, up to 5, while no game is running. Names at one screen must differ, ignoring case, so the pass screen (#30) can tell them apart. **(my call)**
- **`removeSeat(room, personId, seat)`.** In the lobby, the host may clear a seat: the X on a player card in the mockup. Online, that is any seat but the host's own; at a hot-seat table, any seat while another remains. **(my call)**
- **`leave(room, personId)`** returns `{ room, saved }`.
  - In the lobby, the person's seats go; the last person out closes the room.
  - During a game, their seats are marked away (`saved: true`) and kept for their return.
  - At a finished table, their seats are marked away too, so the seat numbers still match the finished game. The room closes when nobody present is left. **(my call; Bird Table removes the seat here, but its game names players by id, and ours names them by seat number.)**
- **`start(room, personId, random)`.** The host deals a game with the room's options: `createGame()` with each seat's name, in seat order. It needs 2 to 5 seats. At a finished table it deals a new game with the present seats only, dropping the away ones.
- **`play(room, personId, seat, action, random)`.** The person answers a decision for a seat they play and are present at: online their own, at a hot-seat table any seat. The engine's `play()` does the rest, so every rule stays in the engine.
- **`seatsOf(room, personId)`** lists the seat numbers a person plays, for #23's views.

**The host.** The host always holds a seat, and is present whenever anyone is. When the host leaves, or steps away from a game, the role passes to the first present person in seat order. A returning host doesn't take it back (Bird Table).

**Names.** A name is trimmed, inner spaces are squeezed to one, control characters are removed, and it is cut to 24 characters, as in Fablewood and Bird Table. An empty name is refused.

## 6. Solo tables

The issue lists the Automa's difficulty among the choices made at a table. The research gives 6 levels, from 1 (Automa the Underachiever) to 6 (Automa the Crusher of Dreams), with 2 the default (02 §9.7). So `options.level` is 1–6 at a solo table and `null` elsewhere, and `configure` checks it.

The Automa and the Shadow Empire are #31, so a game against them can't be dealt yet. Choosing solo is refused with "Solo play isn't available yet.", after its level is checked, in the same way the engine refuses an expansion that isn't built. #31 removes that one check. **(my call)** The alternative, a one-player game with no opponent, isn't Tapestry's solo game, so it would only mislead.

Online and hot-seat tables need 2 players for the same reason: Tapestry plays one human only against the Automa. **(my call)** The 2-player Shadow Empire variant is #31's too, and joins the options there.

## 7. Many tables

The server keeps its rooms in a `Map` from code to room. These helpers work on that map:

- **`newCode(rooms, random)`**: 8 lowercase hexadecimal digits, as in the issue's example and Fablewood, drawn with the injected `random` until no room has it.
- **`addRoom(rooms, room)`** refuses a new table once **1,000** are open: "There are too many tables right now. Try again later." **(my call: a single process keeps every table in memory, and a few hundred kilobytes each puts 1,000 well within it.)** #23 adds a per-address limit on creating tables, as Fablewood has.
- **`expireRooms(rooms, now)`** removes every room nobody has used for **24 hours**, as both sibling games do, and returns their codes so the server can answer their waiting requests.
- **`openTables(rooms)`** lists the online lobbies with a free seat, most recently used first, with what the landing page shows: the code, the host's name, the seats taken, the version and the expansions (`docs/ui/README.md`, "Open tables").
- **`unfinishedSeat(rooms, personId, exceptCode)`** is the code of another table where the person holds a seat in a game still running. The server refuses to seat them elsewhere until it ends, as Bird Table does. **(my call: otherwise a player can abandon a game by opening a new table.)**

## 8. The engine change

`createGame()` gains a `variants` option, a list that defaults to empty. Each entry must be in `VARIANTS`, which is empty until #53 is decided, so any variant is refused with "Unknown variant: …". The checks of the version, the expansions and the variants move into `checkOptions()`, which `game.js` exports beside `createGame`, so the room can check options when the host changes them, not only when the game is dealt.

## 9. Tests

`tests/rooms.test.mjs`:
- one test per rule of §5–§7;
- a randomized test in Bird Table's style: 200 runs of 300 random steps each (create, configure, join, leave, add and remove seats, start and play) with 7 people, checking after every step that:
  - a room holds 1 to 5 seats, and closes only when its last present person leaves;
  - online, nobody holds two seats; at a hot-seat table, the host plays every seat and the names differ;
  - the host holds a seat and is present whenever anyone is;
  - nobody is away in the lobby;
  - while a game runs, the seats match the game's seats in number, order and name;
  - the options are ones the engine accepts, and they don't change while a game runs;
  - every refused step throws `PlayerError`, never another error;
  - `openTables` lists exactly the online lobbies with a free seat, and `unfinishedSeat` finds every running game a person sits in.

## 10. Handed off

- #23: the HTTP endpoints, sessions and their person ids, `touched`, the room `version` and long polling, the create rate limit, and the views (`view(room.game, seat)` for each seat in `seatsOf`).
- #24: the timer and undo, as room options, and kicking a player who keeps timing out.
- #25: the new-table and lobby screens. The mockup's **Open seat** slots, readiness and the civilization chooser need their own transitions when #3 finishes their design.
- #30: the hot-seat pass screen, which picks the seat to show.
- #31: solo tables, the Automa's level and the 2-player Shadow Empire variant.
- #53: the variants.
