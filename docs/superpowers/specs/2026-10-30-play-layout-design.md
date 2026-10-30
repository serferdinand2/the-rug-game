# The play screen's frame in one component (#105): design

Written 2026-10-30. #105 is in M13 · Refactor (Game screen), found by the client scan (#80). Every decision here is **(my call)**; the issue gave the shape.

## 1. What and why

`Game.svelte` and `Results.svelte` each build the play screen's frame in their own CSS: the root grid of header, middle and footer (`var(--bar-height) minmax(0, 1fr) var(--bar-height)`, the window's height), the middle's 3/4 + 1/4 split (`var(--play-columns)`, `var(--play-gap)`, `var(--ink)` between the areas), and the two areas on the pixel texture. A change to the frame, such as a fifth track's height or the overview's split, has to be made twice.

**Done when** both screens draw the frame through one `PlayLayout`, keep no copy of its grid, and look exactly as before at 1920×1080.

## 2. The component

`src/lib/components/ui/PlayLayout.svelte` draws:

- the root grid, with the `header` and `footer` snippets as its first and last rows;
- the middle, `position: relative`, with the two areas and then the optional `overlays` snippet, for what is positioned over the middle (the players overview, the log, Table settings, How to play);
- the shared area as `<main>`, the left 3/4, with the `shared` snippet, named by `sharedLabel`;
- the player area as `<aside>`, the right 1/4, with the `player` snippet, named by `playerLabel`;
- `areasInert` makes both areas `inert`, as under the players overview.

Each area is one grid cell that its snippet's element fills (`grid-template: minmax(0, 1fr) / minmax(0, 1fr)`), with `min-width: 0`, `min-height: 0`, `overflow: hidden` and the texture. So a screen keeps its own padding, flex or grid layout and scrolling on the element it puts in the area, and the frame needs no knowledge of what is inside. Svelte scopes CSS to the component that writes it, so a screen can't style an element `PlayLayout` owns; filling the cell with a screen-owned element is how the screen keeps its layout without `:global`.

The root's height is `var(--rg-play-layout-height, 100vh)`, so the library page can show the frame at 320px.

Names:
- The issue's `private` snippet is `player`: `private` is a reserved word in strict-mode JavaScript, so `{#snippet private()}` and `let { private } = $props()` can't compile. The player area is what the screens and docs call it.
- `areasInert`, not `inert`: the props type joins the root `div`'s HTML attributes, whose own `inert` (`boolean | null`) would collide, and an `inert` on the frame would read as the whole frame being out of reach.

## 3. The screens

- **Game.** `GameHeader` is the header, `TurnFooter` the footer, the panels over the board the overlays. The board side is `<div class="rg-game--shared">` and the player side `<div class="rg-game--private">`, which keep their old layout rules (the flex column, the padding, `position: relative` for the prompt and the card inspector; the tabs over Your overview). The labels "Shared board" and "Your player area" and the overview's `inert` move to `PlayLayout`. The footer is passed as `footer={turnFooter}`, a snippet declared outside `PlayLayout`'s children, because a `{#snippet footer()}` among them would hide the screen's `footer` view that `TurnFooter` takes. The `.rg-game--private` class stays, so the browser tests that find the player area by it keep working.
- **Results.** `PageHeader` is the header and the results bar the footer, unchanged. The standings and the details are `<div>`s that fill the areas and scroll inside them.
- **What changes in the page.** Game's shared area is now a `<main>` (it was a labelled `<section>`) and Results' a `<main>` as before; both player areas are `<aside>`s as before. The owner's screen-reader ruling (2026-10-28) means nothing else follows from that.

Nothing on screen changes.

## 4. Not done

- **The results footer stays its own bar.** #86 built `TurnFooter` for the game's footers, and the results bar's buttons (Review game board, Return to tables, Deal again) and its "Game complete" label are not a `TurnBar` state. Drawing it as one would change how it looks, so it is left for a cosmetic issue if the owner wants it.

## 5. Tests

- Vitest: `tests/client-play-layout.test.mjs`, a source guard that each screen draws one `PlayLayout` and keeps none of the frame's grid (no `--middle`, no `var(--bar-height)` rows, no `var(--play-columns)`, no `100vh`), and that `PlayLayout` holds the frame and renders its five snippets. `tests/library.test.mjs` checks the component's structure and its library section; `tests/styles.test.mjs` its tokens.
- Pixels: screenshots of a hot-seat game (the first-income notice, the plain tracks, the players overview, the World Map, a second player tab), the results and the board review, at 1920×1080, byte-identical before and after.
- Playwright: the browser tests that reach the two screens (`results`, `pass-screen`, `player-area`, `rules-panel`, `hotkeys`, `dialogs`, `lobby`, `decision-prompt`, `pick-prompts` and the rest of the game's) pass unchanged.

## 6. Hand-offs

A change to the frame, such as #35's fifth track or a new overlay, is made once in `PlayLayout`. A screen that adds a third play-like view (solo's Automa board, #31) can take the same frame.
