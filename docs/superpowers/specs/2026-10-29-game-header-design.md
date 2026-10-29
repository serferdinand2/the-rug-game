# The game header as a screen part (#90): design

Written 2026-10-29. #90 is in M12 · Cosmetic enhancements, found by the client scan (#80), and starts after #89 gave the header its clock helpers and #99 its menu. Every decision here is **(my call)**; the issue gave the shape.

## 1. What and why

`Game.svelte` builds the game header inline: the player chips, the turn clock, Undo and the log button with its dot for unseen entries. The chip's civilization rule ("Setting up" before a player has one) repeats `playerCards()` in `src/lib/area/players.js`, and the chip's ability text is worked out inline. When #31 adds the Automa's seat, both copies would need the change.

**Done when** `Game.svelte` renders one `GameHeader`, and a tested `playerChips()` gives the chips.

## 2. The changes

- **`playerChips(view)`** in `src/lib/area/players.js`: one chip per player seat, in seat order, with its seat, name, civilization, VP, whether it is their turn and their civilization's ability for the tooltip. Its civilization comes from `civilizationOf(seat)`, which `playerCards()` now uses too.
- **`src/screens/game/GameHeader.svelte`** takes `store`, `game`, `seat`, `overviewOpen`, `logOpen`, `logUnread` and `bumped` (the seats whose VP just rose), and reports `onGameHeaderChip` (with the chip's seat), `onGameHeaderLog` and `onGameHeaderMenu`. It draws `PageHeader` with `menu="game"`, the chips from `playerChips`, the clock it chooses with `shownClock` and counts down with `clockTime`, Undo through the store, and the log button with its dot. The dot's CSS moves with it.
- `nameOf` moves with the clock, its last user in `Game.svelte`.
- Its attributes type leaves out `title`, which is `PageHeader`'s own sentence.
- **Left out:** the issue's optional `dot` prop on `IconButton`. It would change a shared component and its library section for one use, so the dot stays a span over the button, now inside `GameHeader`.

Nothing on screen changes. Screenshots of the header on one hot-seat table (under the first-income notice, after it, with the players overview open and with the log open), taken before and after, are byte-identical.

## 3. Tests

Vitest, in `tests/client-area-players.test.mjs`: the chips' seats, names, VP and current player in seat order; "Setting up" and no ability before a civilization, then the civilization's name, the same as its card's, and its ability text; a source guard that `Game.svelte` renders one `GameHeader` and no `PageHeader`, chip, clock or dot of its own. Playwright: the hotkeys, first-income, game, pass-screen, menu and results tests pass.

## 4. Hand-offs

#31 adds bot seats to `playerChips`. #123 gives every seat one name, which `nameOf` can then use.
