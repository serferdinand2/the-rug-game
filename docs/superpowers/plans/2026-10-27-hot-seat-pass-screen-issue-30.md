# The hot-seat pass screen (#30): plan

The design is `docs/superpowers/specs/2026-10-27-hot-seat-pass-screen-design.md`. Each task is built test-first.

1. **The hand-over logic.** `src/lib/pass.js`: `handOver(room, shown, passing)` gives the seat on show, the player named on the pass screen and the view to ask for instead of taking the room; `passReason(game, seat)` gives the reason line. `tests/client-pass.test.mjs` covers every case of design §2–§6. `seatToFetch` in `moves.js` goes, with its test.
2. **The store.** `src/lib/game.svelte.js` gains `passing` and `takeSeat()`, runs every room through `handOver`, and keeps events that arrive during a pass out of `fresh`.
3. **The component.** `src/lib/components/ui/PassScreen.svelte` (name, seat, reason, clock, the arming wait, `onPassScreenTake`), its library section and its row in `src/lib/components/README.md`.
4. **The app.** `App.svelte` shows the page header and the pass screen instead of the game while `store.passing` is set, ticking the named player's clock.
5. **Browser tests.** `tests/browser/pass-screen.test.mjs` plays a two-seat hot-seat deal through a hand-over and a refresh; `setup-prompts.test.mjs` takes the screen for each seat.
6. **Docs.** The README's current interface gains the pass screen's screenshot; `docs/ui/README.md` and CLAUDE.md follow.
