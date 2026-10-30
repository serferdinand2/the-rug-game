# SeatCard cut down to the lobby's seat states (#102) Implementation Plan

**Goal:** the seat's words come from tested helpers in `lobby.js`, `SeatCard` draws only the lobby's states with one ×, and `TableCode` draws its field with `TextInput`.

**Spec:** `docs/superpowers/specs/2026-10-30-seat-card-design.md`

## Global Constraints

- docs/conventions.md throughout; `npm run check` clean; Prettier on the changed files only.
- Nothing on the lobby's screen changes; the lobby and library browser tests pass unchanged.
- The civilization path and the add form's own controls stay until the owner decides (spec §3).

### Task 1: Tests first

- [ ] `tests/client-lobby.test.mjs`: `seatLabel` and `seatBadges`.
- [ ] `tests/client-seat-card.test.mjs`: SeatCard's states and ×, TableCode's TextInput, the source guards.
- [ ] Run them: FAIL.

### Task 2: The helpers

- [ ] `seatLabel` and `seatBadges` in `lobby.js`.

### Task 3: The components

- [ ] `SeatCard`: drop `open` and `onSeatCardTake`; the `remove` snippet; `rg-seat-card--frame`; call the helpers; `var(--input-height-small)`.
- [ ] `TextInput`: `onTextInputFocus`; the small variant keeps its line border on focus.
- [ ] `TableCode`: `TextInput` and `Button`.
- [ ] The library sections of SeatCard and TextInput, and the components README.

### Task 4: Verify

- [ ] `npx vitest run tests/client-lobby.test.mjs tests/client-seat-card.test.mjs`, `npm run test:unit`, `npm run check`.
- [ ] Browser (after merging): lobby, library.
- [ ] Commit `Fix #102: …`.

### Task 5: The owner's answers (owner, 2026-10-30)

- [x] Keep the civilization line and `CivChooser`; record it in the design, on `SeatCard` and in the README and library.
- [x] Tests first: the add seat renders a small, block `TextInput` and a small, block gold submit `Button`; `SeatCard` has no field or add-button CSS of its own; `TextInput`'s small focus rule is read-only only; the library's one-frame test counts blurred shadows only.
- [x] `TextInput` gains `block`; `SeatCard`'s add form uses `TextInput` and `Button` and focuses the form's input on opening; its own field and button CSS goes.
- [x] Before and after screenshots in `docs/ui/screens/issue-102/`.
- [x] `npm run check`, the client Vitest files, Prettier; commit `Fix #102: …`.
