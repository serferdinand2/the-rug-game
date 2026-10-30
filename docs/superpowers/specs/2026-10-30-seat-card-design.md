# SeatCard cut down to the lobby's seat states (#102): design

Written 2026-10-30. #102 is in M13 · Refactor (Lobby), found by the client scan (#80) and blocked by #98, which is closed. Every decision here is **(my call)** unless marked otherwise; the issue gave the shape.

## 1. What and why

`SeatCard` carries an `open` state ("Take the seat!", `onSeatCardTake`) that only the library uses: the server seats joiners in order, so the lobby never shows it (`docs/ui/README.md`). Its seat label is a four-way nested ternary and its badges are label logic inside the component. The × is written three times, and the take button and the add form copy the same gold-frame CSS. `TableCode` hand-rolls the read-only field that `TextInput`'s `size="small"` variant was made for, and the add form hand-rolls a name field and its Add button.

**Done when** the seat's words come from tested helpers in `lobby.js`, `SeatCard` draws only the lobby's states with one ×, `TableCode` draws its field with `TextInput`, and the lobby looks and behaves exactly as before.

## 2. The changes

- **`seatLabel(slot)`** in `src/lib/lobby.js`: the seat's group name, "Seat 3: Ana", "Seat 3: add a player", or "Seat 3: empty" for an empty or closed slot. **`seatBadges(slot)`**: YOU and HOST in gold, then READY in the ok colour or NOT READY muted, and nothing for an unknown readiness. `SeatCard` calls both.
- **`SeatCard`** keeps `empty`, `closed`, `add` and `player`. The `open` state, `onSeatCardTake` and the take button's CSS go. The × is one `remove` snippet, given its label, tooltip and handler: "Close seat 3" in the add state, "Remove Ana" for a player. With the take button gone, the gold frame is one class, `rg-seat-card--frame`, on the add form.
- **`TextInput`** gains `onTextInputFocus`, a callback with the input as its target, so `TableCode` selects the whole code on focus.
- **`TableCode`** draws `<TextInput size="small" hideLabel readonly>` and keeps `Button` for COPY. Its own field CSS goes.
- **`TextInput`'s small variant** keeps its line border on focus, as the lobby's code field always has: the variant is documented as the lobby's table code, and the lobby's code shows only the page's focus outline. The launch page's medium fields keep their gold focus border.
- **The library:** SeatCard's section drops the open seat; its working row opens an empty seat into the add state and adds the typed name as a player. TextInput's section shows the focus callback on the small field.

Nothing on the lobby's screen changes.

## 3. What is left for the owner

- **The civilization path.** The issue asks whether `civilization`, `showCivilization`, `canChooseCivilization`, `onSeatCardChooseCivilization` and `CivChooser` have a future with #78. #78 is closed and chose on the Civ card itself, without them, and the lobby always passes `showCivilization={false}`. Only the library draws them. They stay until the owner answers; dropping them then is a deletion only.
- **The add form's field and Add.** Drawn with `TextInput` and `Button`, they would look different: `TextInput`'s small field has gold bold capitals, an 8 px inset and its own placeholder grey, and the medium one is 44 px tall; both show the page's focus outline, where the add field has plain text, a 6 px inset, the browser's placeholder and a gold border only. `Button mode="gold" size="small"` has a smaller font, a dimmer border and brighter text than Add. That is a visible change, so it is not built. The field and Add's height now read `var(--input-height-small)`, the same 30 px. Either the owner approves the shared look in the library first, or the add form keeps its own.

## 4. Tests

Vitest:
- `tests/client-lobby.test.mjs`: `seatLabel` for each state, and `seatBadges` for you, host and each readiness.
- `tests/client-seat-card.test.mjs` renders with `svelte/server`: each state's group name and content, one × with its label and tooltip in the add state and for a removable player, none otherwise, and no take button; `TableCode` draws a small, read-only `TextInput` named "Table code" holding the code; a source guard that `SeatCard` has no `open` state, no nested ternary and one `rg-seat-card--remove` button, and that `TableCode` has no `<input>` of its own.

Playwright: `tests/browser/lobby.test.mjs` (the seat group "Seat 3: empty" and Open seat) and `tests/browser/library.test.mjs` (the add seat's one gold frame) pass unchanged.

## 5. Hand-offs

The owner's answers in §3 decide a follow-up: drop the civilization path, and draw the add form with the shared controls if their look is approved.
