# The table log, scoreboard, results, sound and motion (#29): design

Written 2026-10-27. #29 is the last screen work of M5 before the hot-seat pass screen (#30). It adds what a table needs around the game itself: a log of what happened, the current scores, the results when the game ends, sound cues and a little motion.

The owner asked for #29 to be built and pushed without a question round ("work on #29 and only then push to main", 2026-10-27). What the owner said is marked **(owner)**, every other decision **(my call)**. As before, Lazar's mockups decide the look and the owner's design decides what works **(owner)**. The results screen follows Lazar's end-screen proposal (`docs/ui/end-screen.html`).

## 1. What and why

The design document's goal 6 promises "a table log, a scoreboard and sound cues that start muted", and its build plan says #29 is "event-driven, as in Bird Table: no replay after a refresh, and no motion when the reduce-motion setting is on". Today a game ends on a footer that says "The game is over", nothing tells a player what the others did, and the game is silent.

Hand-offs this issue takes on, from the issue's comments and CLAUDE.md:
- **#22, #23:** a new deal at a finished table numbers its events from 1 again, so the client must tell a new deal from the old game: a deal counter on the room.
- **#24:** an `undone` event `{ player, from }` takes back the events from `from` onwards; a `timedOut` event marks a turn the server played on.
- **#53:** the game's variants (`gameCreated`, `state.variants`) are named in the log or the game info.
- **#25, #26:** the finished table and dealing again, the timed-out notice, and the table settings during a game.
- **#15 (owner):** at the end, players see each tiebreaker used, step by step.

## 2. Where VP came from (engine)

Lazar's end screen lets a player open each row to see "where the VP came from, already awarded during play", and asks for the awards to be grouped by source, never scored again. The engine records VP in only two places, `vp()` (effects/vp.js) and `payVp` in payment.js, so the source can be recorded exactly **(my call)**:

- Each seat gets `vpSources`, VP by source, always adding up to its VP. The sources are `tracks` (advancement rewards), `tapestry`, `tech`, `map` (exploring and conquering), `civ` (civilization abilities), `income` (income turn scoring), `capital` (complete rows and columns), `achievements`, `paid` (VP paid, negative) and `other`.
- An operation's `origin` names its source. `push()` gives every new operation the origin of the operation that pushed it, unless the new one has its own: an explicit `origin`, or one read from its `source` (a track space, a tapestry ability, a tech card, a hex or a space tile). So a few roots carry the rest: an income turn's steps are `income`, its civilization step and every civilization hook `civ`, every THIS ERA hook `tapestry`, achievements `achievements`, Capitalism's VP `tapestry`, and capital scoring `capital`.
- `vpGained` events carry the `source`.
- The simulation checks after every action that each seat's sources add up to its VP.

## 3. The deal (server)

A room counts its deals: `deal` is 0 before the first and goes up by 1 at each `start`; the room view carries it **(my call, the #22 hand-off's suggestion)**.

## 4. New events, no replay (client)

`src/lib/event-feed.js`, as Bird Table's `changedEvents`:
- `freshEvents(previous, next)` gives the events that arrived since the previous room view of the same table and deal, in order. It gives none on the first view after a refresh, a reconnect, a new table or a new deal, and none when events were missed (a gap): nothing is replayed.
- `liveEvents(events)` drops what an `undone` event took back: the events from its `from` up to it. The `undone` event stays, so the log can say a choice was taken back.

Sound, motion and the toasts read only fresh events; the log reads the live events of the view.

## 5. The log and the scores

- **Words:** `src/lib/log.js` gives each event a sentence in plain English, or none for bookkeeping (spaces activated, once-a-turn marks, decks shuffled, setup done, and the turn choice, which the next line says anyway). It reuses `describe.js` for names, resources, tiles, hexes and effects. Lines use players' names, never "you", so a hot-seat table reads the same for everyone **(my call)**. Secrets never show: an event's `secret` is only in its owner's view, and only that view names the secret thing ("Ana drew Militarism"; for the others "Ana drew a tapestry card"). A VP line says where the VP came from ("Ana scored 3 VP from a tapestry card"), and an explore or an achievement line leaves its VP to that line, so no VP is told twice **(my call)**.
- **The panel:** a header button (▤, "Log and scores") opens a panel over the player area, the full height of the middle, with two tabs: **Log** and **Scores** **(my call:** the play mockup has no log, and the shared board must stay in view**)**. Escape or the button closes it. A dot on the button marks entries that arrived while it was closed.
- **The log tab:** the newest entry at the bottom, scrolled into view; a line per turn ("Turn 12 · Ana") between turns; each entry starts with its player's colour. The first entry names the rules and variants (#53). A timed-out turn and an undone choice have their own lines (#24).
- **The scores tab:** the players by VP, each with VP by source (§2), and the two tiebreak values (the tallest landmark in the capital, the resources) for the table's version.

## 6. The results screen

When the game is over, the table shows the results instead of the game, as Lazar's end screen draws them **(Lazar's mockup)**:
- **The header** reads "Game complete" and "Table CODE · n players".
- **Final standings:** each player's place, token, name, civilization and final VP, from the engine's ranking (`state.result`); a shared place repeats and the next one skips (1, 1, 3). The winners' rows are gold. Choosing a name opens "Where the VP came from" with the seat's sources (§2). The rule note under them says how places were decided.
- **Your result:** the viewer's place and VP, and who won. At a hot-seat table, where the view belongs to no seat, it shows the winner instead **(my call)**.
- **How the tie was decided:** every tie the ranking split, step by step: each step's name, each tied player's value (the landmark's name in gold Cinzel, or the resources), and whether that step separated them (#15, owner). Without a tie: "No tie to decide: places follow final VP."
- **This table:** the rules version, the mode and number of players, the expansions (badges, or "Base game") and the variants (#53).
- **The footer:** "Game complete", then **Review game board** (the game screen as it ended, with a **Results** button back), **Deal again** for the host (a new deal at the same table, #22) and **Return to tables** (leave). A new deal goes straight to the new game.

## 7. Sound

- **Cues:** the five CC0 interface sounds Bird Table uses (Kenney's Interface Sounds 1.0, licence in `static/audio/LICENSE.txt`) **(my call)**: your turn begins (`select`), a token advances (`click`), something placed, explored or conquered (`drop`), an achievement or a landmark (`confirmation`), and the game's end (`confirmation-end`).
- **Rules:** one cue at most for each batch of fresh events, the most important one, so a busy batch is not noisy. Sound starts muted and the choice is remembered (#25 already keeps it); audio unlocks on the first click or key; missing audio never interrupts the game.

## 8. Motion

Driven by fresh events, and none when the system asks for reduced motion **(owner's design)**:
- a territory just explored, conquered or given an outpost pulses on the World Map;
- a building or landmark just placed glows on the Capital tab;
- a player chip's VP pops when it rises;
- the progress lines grow to their new space (a transition, so a refresh shows them in place).

## 9. Notices and settings

- **Timed out (#24):** a fresh `timedOut` event shows a toast: "Ana ran out of time. The rest of the turn was played for them." The log keeps it.
- **Table settings during a game (#24, #26):** the header menu offers the host **Table settings**: the turn timer and undo, as in the lobby.

## 10. Not in #29

- The hot-seat pass screen (#30).
- Solo results and the Automa's score (#31).
- Changing the rules between deals: the lobby still does that before the first deal; at a finished table the host deals again with the same rules **(my call)**.

## 11. Tests

- **Engine:** VP sources add up to VP in every simulated game (`checkState`); each source is credited where it should be (a track space, a tapestry card, an achievement, an explore, an income turn, a civilization).
- **Server:** the deal counter goes up with each deal and is in the room view.
- **Client:** `event-feed` (fresh events, no replay, undone ranges), `log` (every event type the engine can emit has words, with no "undefined", and secrets only for their owner), the sound cue for a batch, the motion highlights, and the results model (places, shared places, tie steps, sources).
- **Browser:** a hot-seat game played to the end shows the results with every player, opens a row's sources, reviews the board and comes back; the log panel lists the game's events.

## 12. The final review

A fresh review of the whole change found one real bug and a few small ones, all fixed:
- "Review game board" returned to the results within 25 seconds, because the reset reacted to every room view; it now reacts only to another table or a new deal. The browser test changes a setting while reviewing and checks the board stays.
- Mercantilism's conversion and Age of Sail's gift now count as the tapestry's (they inherited the income turn and the tracks).
- The log's region wraps its list, the standings and each breakdown are labelled groups, the settings dialog takes and returns the focus, and opening the settings closes the log and the overview, so one Escape closes one thing.
- A hex or chip that changes again within two seconds moves again; a Craftsmen building highlights no plot; a seat without `vpSources` (a bot, #31) gets them on its first VP.
