# One viewer-seat rule and tested browser fallbacks (#100): design

Written 2026-10-29. #100 is in M12 · Cosmetic enhancements, found by the client scan (#80). Every decision here is **(my call)**; the issue gave the shape.

## 1. What and why

"Which seat is the person at this screen" is written three times as `room.mode === 'hotseat' ? null : store.seat`: twice in `App.svelte` (the sound cue and the dice tray's caption) and once in `Results.svelte`. App's private-window storage fallback and its random source sit untested in the root component, though #43 runs the game in Discord's iframe, where storage may be refused. `HandOver` types its `store` as `any`.

**Done when** the rule is written once and tested, the fallbacks are in a tested module, and `HandOver` types its store as `GameStore`.

## 2. The changes

- **The rule.** `viewerSeat(room)` in `src/lib/moves.js`, beside `seatToShow`: the person's own seat online, `null` at a hot-seat table, where the whole table shares the screen, and `null` with no room. The store's new `viewer` getter, next to `seat`, returns it, and App and Results read `store.viewer`.
- **What stays.** `seatSlots` in `lobby.js` marks the seats in `room.you`, the seats this browser holds in the lobby, not the seat on show, so it keeps its own test **(my call)**. The store's `move` and `undo` send `seat` only at a hot-seat table: that is the seat the server needs, the inverse rule, and it stays.
- **The fallbacks.** `src/lib/storage.js` holds `safeStorage(get)` and `randomInt(n)`, moved unchanged from `App.svelte`. `safeStorage` returns the browser's storage when it can be read, and otherwise a `Map` that forgets when the page closes: a getter that throws and a storage whose `getItem` throws both fall back.
- **HandOver** types `store` as `import('../lib/game.svelte.js').GameStore`.

Nothing on screen changes.

## 3. Tests

Vitest: `tests/client-storage.test.mjs` covers the storage that works, a getter that throws, a `getItem` that throws, the fallback's get, set and remove, and `randomInt`'s range. `tests/client-api.test.mjs` covers `viewerSeat` next to `seatToShow`: online, hot-seat and no room. A source guard there fails if any file in `src/` writes `mode === 'hotseat' ? null`.

## 4. Hand-offs

#123 gives every seat one name. #43 can reuse `safeStorage` in the iframe.
