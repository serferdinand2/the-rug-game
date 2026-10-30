# SeatCard cut down to the lobby's seat states (#102): design

Written 2026-10-30. #102 is in M13 · Refactor (Lobby), found by the client scan (#80) and blocked by #98, which is closed. Every decision here is **(my call)** unless marked otherwise; the issue gave the shape, and the owner answered §3 on 2026-10-30.

## 1. What and why

`SeatCard` carries an `open` state ("Take the seat!", `onSeatCardTake`) that only the library uses: the server seats joiners in order, so the lobby never shows it (`docs/ui/README.md`). Its seat label is a four-way nested ternary and its badges are label logic inside the component. The × is written three times, and the take button and the add form copy the same gold-frame CSS. `TableCode` hand-rolls the read-only field that `TextInput`'s `size="small"` variant was made for, and the add form hand-rolls a name field and its Add button.

**Done when** the seat's words come from tested helpers in `lobby.js`, `SeatCard` draws only the lobby's states with one ×, `TableCode` draws its field with `TextInput`, and the lobby looks and behaves exactly as before, apart from the add form the owner approved in §3.

## 2. The changes

- **`seatLabel(slot)`** in `src/lib/lobby.js`: the seat's group name, "Seat 3: Ana", "Seat 3: add a player", or "Seat 3: empty" for an empty or closed slot. **`seatBadges(slot)`**: YOU and HOST in gold, then READY in the ok colour or NOT READY muted, and nothing for an unknown readiness. `SeatCard` calls both.
- **`SeatCard`** keeps `empty`, `closed`, `add` and `player`. The `open` state, `onSeatCardTake` and the take button's CSS go. The × is one `remove` snippet, given its label, tooltip and handler: "Close seat 3" in the add state, "Remove Ana" for a player. With the take button gone, the gold frame is one class, `rg-seat-card--frame`, on the add form.
- **`TextInput`** gains `onTextInputFocus`, a callback with the input as its target, so `TableCode` selects the whole code on focus.
- **`TableCode`** draws `<TextInput size="small" hideLabel readonly>` and keeps `Button` for COPY. Its own field CSS goes.
- **`TextInput`'s small variant** keeps its line border on focus, as the lobby's code field always has: the variant is documented as the lobby's table code, and the lobby's code shows only the page's focus outline. The launch page's medium fields keep their gold focus border.
- **The library:** SeatCard's section drops the open seat; its working row opens an empty seat into the add state and adds the typed name as a player. TextInput's section shows the focus callback on the small field.

Nothing on the lobby's screen changes here; the add form's look changes with the owner's answer in §3.

## 3. The owner's answers (owner, 2026-10-30)

Both questions were asked here and in `docs/status.md`; the owner answered yes to both.

- **The civilization path stays (owner, 2026-10-30).** `civilization`, `showCivilization`, `canChooseCivilization`, `onSeatCardChooseCivilization` and `CivChooser` have a future: they are kept as they are, documented on `SeatCard` and in the components README, and drawn in the library's SeatCard section. The lobby still passes `showCivilization={false}`. No code changes.
- **The add form takes the shared look (owner, 2026-10-30).** The name field is `<TextInput size="small" block hideLabel>` and Add is `<Button type="submit" mode="gold" size="small" block>`, inside the one gold frame. The add form's own field and button CSS (`rg-seat-card--add-input`, `rg-seat-card--add-button`) is gone. What changes for a player: the name is typed in TextInput's small gold bold letters with its 8 px inset and placeholder grey; on focus the field shows the gold border, the 1 px gold ring and the page's gold focus outline; Add has Button's small gold font, border and colours. The frame, the ×, the 24-letter limit, the placeholder, Enter to add and the focus on opening are as before.
  - **`TextInput`** gains `block` (fill the container's width, as `Button`'s `block` does). Its small variant keeps the line border on focus only while it is `readonly`, which is the lobby's table code, so the editable name field takes the gold focus like the launch page's fields.
  - **The focus on opening:** `SeatCard` binds its form and focuses the form's input when the seat opens, since `TextInput` does not hand out its input.
  - **The one gold frame:** the library's browser test counts the elements with a border and a glow, a shadow that blurs. The focused field's ring is a 1 px spread that does not blur, so it is not a second frame (my call).
  - Before and after: `docs/ui/screens/issue-102/add-form-before-*.png` and `add-form-after-*.png`, from the library at 1920×1080. `docs/ui/screens/lobby.png` shows no add form, so the README's picture stays.

## 4. Tests

Vitest:
- `tests/client-lobby.test.mjs`: `seatLabel` for each state, and `seatBadges` for you, host and each readiness.
- `tests/client-seat-card.test.mjs` renders with `svelte/server`: each state's group name and content, one × with its label and tooltip in the add state and for a removable player, none otherwise, and no take button; `TableCode` draws a small, read-only `TextInput` named "Table code" holding the code; a source guard that `SeatCard` has no `open` state, no nested ternary and one `rg-seat-card--remove` button, and that `TableCode` has no `<input>` of its own.

Playwright: `tests/browser/lobby.test.mjs` (the seat group "Seat 3: empty" and Open seat) passes unchanged; `tests/browser/library.test.mjs` (the add seat's one gold frame) counts only blurred shadows as a frame and checks that the seat holds one `TextInput` field and a gold Add.

For the owner's add form, `tests/client-seat-card.test.mjs` checks that the add seat renders a small, block `TextInput` and a small, block gold submit `Button`, that `SeatCard` has no `<input>` or add-form CSS of its own, and that `TextInput`'s small variant keeps the line border on focus only while read-only.

## 5. Hand-offs

None: with the owner's answers in §3 built, #102 is done. A lobby civilization choice, if one is ever built, starts from `SeatCard`'s civilization line and `CivChooser`.
