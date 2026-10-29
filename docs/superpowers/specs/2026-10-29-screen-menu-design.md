# Every screen's menu from one module (#99): design

Written 2026-10-29. #99 is in M12 · Cosmetic enhancements, found by the client scan (#80). Every decision here is **(my call)**; the issue gave the shape.

## 1. What and why

The header menu's entries are written on each screen: the landing and lobby take `PageHeader`'s default, and the pass screen, the results and the game each list their own. All four `PageHeader` call sites wire sound the same way (`sound={store.sound}` and `store.setSound(event.value)`). Three menu handlers each map `'leave'` to `store.leaveTable()`. `PageHeader` inserts **Card gallery** after How to play with `findIndex` and `splice`, then filters it out again when it is chosen. #43 (the Discord Activity) will drop or change entries, which today means four places.

**Done when** every screen's entries come from one tested function and no screen wires sound or leaving itself.

## 2. The changes

- **`src/lib/menu.js`**: `menuItems(screen, { hosting })` for four screens, each with How to play first and **Card gallery** (`/cards.html`, in a new tab) second, as today:
  - `'start'` (loading, landing and lobby): then **About this project**;
  - `'passing'` and `'results'`: then **Leave table**;
  - `'game'`: then **Keyboard shortcuts**, **Table settings** for the host only, and **Leave table**.
- **`PageHeader`** takes `store` and `menu` (the screen) in place of `sound`, `items` and `onPageHeaderSound`. It reads `store.sound` and calls `store.setSound`, builds its entries with `menuItems(menu, { hosting })`, where hosting is `isHost(store.room)` at a table, and calls `store.leaveTable()` for **Leave table**. Every other entry still goes to `onPageHeaderMenu`. The gallery is a link, so it is never reported.
- **The screens** pass `{store}` and their `menu`. App keeps How to play and About; Results keeps How to play; the game keeps How to play, the shortcuts and Table settings. Their `'leave'` branches go.
- `PageHeader` is a screen part in `src/screens/`, so it has no library section, as before.

Nothing on screen changes.

## 3. Tests

Vitest, `tests/client-menu.test.mjs`: each screen's entries in order, with their labels; Table settings for the host only; the gallery is a new-tab link to `/cards.html`; a source guard that no file but `PageHeader` calls `setSound` or wires `onPageHeaderSound`, that no screen handles `'leave'` from the menu, and that `PageHeader` no longer splices. Playwright, new `tests/browser/menu.test.mjs`: the landing page's menu and its sound toggle, and at a hot-seat table the pass screen's menu, whose **Leave table** brings back the landing page.

## 4. Hand-offs

#90 moves the game header into a `GameHeader` part; it passes `menu="game"`. #43 adds its own screen or drops entries in `menuItems`.
