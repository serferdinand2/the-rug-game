# One Dialog for How to play, Table settings and the help panel (#87): design

Written 2026-10-28. #87 is in M12 · Cosmetic enhancements, found by the client scan (#80). Every decision here is **(my call)** unless marked; the issue gave the shape, and the coordinator asked to change only TableSettings' shell, since #98 rebuilds its rows.

## 1. What and why

The launch page's How to play (`HelpPanel`), the game's How to play (`RulesPanel`) and Table settings (`TableSettings`) each build their own dialog: the scrim, the box, the title, Escape on the window, the backdrop click and Close. Only Table settings gives the focus back when it closes; How to play loses it.

**Done when** the three panels are built on one `Dialog`, each gives the focus back on close, no panel reads another component's markup, and the How to play and Table settings browser tests pass.

## 2. Dialog

`src/lib/components/ui/Dialog.svelte`, with the props the issue named:

- `title`, the heading that names it (`aria-labelledby`, with an id from `$props.id()`).
- `modal` (true by default): over the whole screen on the 70% scrim, `aria-modal="true"`, and Tab and Shift+Tab wrap inside the box, so the focus can't wander behind the scrim. `modal={false}`: over its positioned parent only, on the lighter 52% scrim, `aria-modal="false"`, as Table settings sits over the board with the header and footer still in use.
- `size`: `narrow` (the launch column, `--launch-width`, 530px) or `wide` (up to 1000px). Both are as tall as their content up to the screen's height less a margin; the content scrolls in its own element.
- `children`, the content; `actions`, the buttons at the bottom right, by default a gold **Close**.
- `onDialogClose`, fired by Close, Escape or a click on the backdrop.

It remembers the element that had the focus as it opens, takes the focus into its box unless something inside already took it (How to play's selected tab), and gives it back when it closes. Escape is handled on its own box, which stops it there, so the game's window handler doesn't also act on it. The look is How to play's, which the README's screenshots show.

## 3. The panels

- **HelpPanel** keeps its steps; **RulesPanel** its tabs (which take the focus themselves, #91); **TableSettings** its rows, unchanged, inside the dialog with `modal={false}` and a **Done** action.
- None listens on the window or queries the DOM.

## 4. Visible changes

- **How to play (both):** none. The box measures the same.
- **HelpPanel:** the focus opens on the dialog itself, not on Close, as the other two do; Enter no longer closes it at once.
- **Table settings** takes the shared shell: the box is 530px wide (was 560px), with the dialogs' soft border, plain chrome without the texture, 24px padding all round (was 20px top and bottom), the title in the dialogs' 18px body text (was 22px gold), and Done 20px below the rows (was 12px). Its scrim, 52% over the board only, is unchanged. A click on the scrim now closes it, as it does the others. The owner approved this look on 2026-10-28. Whether Results and the pass screen should show the game's rules under How to play stays open.

## 5. Open question for the owner

- Results and the pass screen open the pre-game help (`HelpPanel`) under **How to play**, not the game's rules (`RULES_HELP`). Should they show the game's rules? (Skipped, as the issue asks the owner.)

## 6. Tests

Vitest (`tests/dialog.test.mjs`, rendering with `svelte/server`): the title names the dialog, `modal` sets `aria-modal`, Close is the default action and `actions` replaces it, `size` sets the width class; and the three panels use `Dialog` with no window listener, no `role="dialog"` and no DOM query of their own. Playwright: How to play gives the focus back to the menu; `tests/browser/dialogs.test.mjs` opens the launch page's How to play and the game's Table settings, closes each with Escape, the backdrop or Done, and checks the focus comes back to the menu.

## 7. Hand-offs

#88 routes Escape and the layers through one module, and can drop `Game.svelte`'s `aria-modal` queries and `settingsOpen`; it decides whether Table settings becomes modal. #97 turns the two scrims into tokens. #98 replaces TableSettings' rows.
