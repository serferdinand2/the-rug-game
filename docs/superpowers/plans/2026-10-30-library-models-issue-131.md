# The DecisionPanel and TrackBoard library examples from real models (#131): plan

The design is `docs/superpowers/specs/2026-10-30-library-models-design.md`.

1. **Tests first.** Write `tests/library-models.test.mjs` for `boardView`, `tanksPayment`, `shuttleBonus`, `guildsTrade` and `capWarning`, read through `trackBoard()` and `PromptState`. Add the source guard to `tests/library.test.mjs`. Watch both fail.
2. **`src/library/models.js`.** Deal the seeded four-player game, play setup with `defaultAction`, and play on with `playUntil` to each decision, editing the dealt state only where the design says. Return each as a `PromptSource` whose `move` sends nothing.
3. **TrackBoard section.** Replace `fixtureTrack` and the typed tracks with `export const BOARD_TRACKS = trackBoard(boardView())`; update the header comment and the example's label. The Track and ProgressLanes sections keep importing `BOARD_TRACKS`; update ProgressLanes' comment.
4. **DecisionPanel section.** Drop `payMixes`, `sets`, `TANKS`, `SHUTTLE`, `GUILDS` and the hand wiring; build a `PromptState` for each pick example and read its title, controls, rows and tiles. Build the cap-warning example from `capWarning()` with food, food and coin picked.
5. **Check.** `npm run check` (0 errors, 0 warnings), `npm run test:unit`, Prettier on the changed files, and a screenshot of the four sections on a private port.
6. **Record.** Commit as "Fix #131: …"; the status entry goes to whoever records it in `docs/status.md`.
