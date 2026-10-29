# One clock choice and one ticking time (#89): design

Written 2026-10-29. #89 is in M12 · Cosmetic enhancements, found by the client scan (#80). Every decision here is **(my call)**; the issue gave the shape.

## 1. What and why

The game screen and the hot-seat pass screen each run a 250 ms `setInterval` for the browser's time and each choose a clock their own way: `Game.svelte` with an untested four-step `??` chain, `HandOver.svelte` with the named player's clock. Both write the running rule `clock.ends !== undefined && !clock.expired` inline, and both callers of `TurnClock` build its tooltip `"{name}: {formatClock(ms)}"`. `TurnClock` sets its modifiers with ternaries in the class string.

**Done when** both screens choose with one tested function, one timer ticks, and `TurnClock` builds its own title.

## 2. The changes

- **The choice.** `shownClock(room, seat)` in `src/lib/clock.js` is the game header's chain, moved unchanged: the seat's running clock, else any running clock, else the seat's paused clock, else the first, else none (#26 spec §4). A room without `clocks` has none.
- **The pass screen** chooses with `shownClock` too, for the player it names, and shows the clock only when it is that player's own **(my call)**. The screen speaks to that player and draws the clock in their colour, so it must not show someone else's. In practice this is the clock it showed before: the named player is the one asked, and an asked player's clock runs.
- **The running rule.** `isRunning(clock)` in `clock.js`. The header's 5-second warning keeps its own test of `ends`, unchanged.
- **One timer.** `src/lib/now.svelte.js` exports `clockTime`, whose `now` getter returns `Date.now()` and, read in an effect or the markup, subscribes through Svelte's `createSubscriber` to one 250 ms interval. The interval runs only while something reads it and stops when nothing does. Both screens read `clockTime.now`; their own timers go.
- **TurnClock** takes `name` (the clock's player) and sets its own `title`, `"Vera: 1:42"`, and sets its modifiers with `class:` directives. The pass screen passes the name it shows, and the game header passes the clock seat's name.

Nothing on screen changes.

## 3. Tests

Vitest, in `tests/client-clock.test.mjs`: `shownClock` (the seat's running clock first, another's running clock before the seat's paused one, a paused one only when none runs, and none), `isRunning` (running, paused, expired), `TurnClock`'s title and modifiers rendered with `svelte/server`, `clockTime.now` outside an effect, and a source guard that no screen or component calls `setInterval`, chooses from `clocks` or writes the running rule. Playwright, in `pass-screen.test.mjs`: at a hot-seat table with a 5-minute timer, the asked player's clock, found by its title, ticks down on the pass screen and then in the game header. With the subscription taken out, the clock stands still and this test fails.

## 4. Hand-offs

#90 moves the game header, with its clock, into a `GameHeader` part. #31 may add bot turns to the clocks.
