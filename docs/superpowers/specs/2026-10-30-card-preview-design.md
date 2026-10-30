# One CardPreview component for a card shown in full (#96): design

Written 2026-10-30. #96 is in M13 · Refactor (area Cards), found by the client scan (#80), and waited for #79, which moved two of the card builders into the prompt state. It lands after #118, which gave every shelf card its drawn face, and #94, which moved the Tech tab's rows into `TechRows`. Every decision here is **(my call)**; the issue gave the shape.

## 1. What and why

A tech or tapestry card hovered or focused in the player area, or on a prompt's shelf, is shown in full over the shared area. `Game.svelte` drew that overlay, its scrim and its side variant itself, from `{ kind, data, side }`, and `PlayerTabs.inspect()` built the card's data for it with `techCardData()` or `tapestryCardData()`. `CardFan` reported only an index, so `PlayerTabs`, `TechRows` and `CardShelf` each looked the card up with `event.value.index === null ? null : list[event.value.index]`. A third card kind, such as landmarks if #63 makes them inspectable, would have to be added to every place.

**Done when** one component draws the card in full and no caller builds card data for it.

## 2. The changes

- **`player/CardPreview`** takes `kind` (`'tech'` or `'tapestry'`), `id` and `side`. It draws `TechnologyCard` or `TapestryCard` from the id (both already accept one, #108), and owns the overlay's CSS moved unchanged from `Game.svelte`: absolute over its positioned parent, the scrim, centred, no pointer, `aria-hidden`; `side` puts it at the left without the scrim. Library section and README row added.
- **The prompt's shelf (#118).** Since #118 every shelf card carries the `face` its shelf draws, and `inspectShelf()` and `inspectPick()` hand that same face on as `data`. Building it again from an id would draw each card twice, so `CardPreview` also takes `data`, as `TechnologyCard` and `TapestryCard` do, and the prompt state passes the face it already holds. Nothing builds card data for the preview: the player area sends ids, the shelf the face it drew. `Inspected` is `{ kind, id?, data?, side? }`.
- **`CardFan`'s inspect event** carries `{ index, item }`, `item` being `null` on leave. `PlayerTabs.inspect(kind, id, event)` reports `{ kind, id }`, or `null`, with the fan's own target; the hand and the display pass `event.value.item`, the Tech rows their id. `TechRows` and `CardShelf` read `item` too, so the four index look-ups go.
- **`Game.svelte`** renders `<CardPreview {...inspected} />` and drops its two overlay rules and its card imports.

Nothing on screen changes: the overlay keeps the same box, layer, scrim and side layout, and the cards are drawn from the same data.

## 3. Tests

Vitest, in `tests/client-prompt-state.test.mjs`: a tech card on an invent's shelf is previewed with the face the shelf draws, and the deck is not; a tapestry card to pay likewise; a source guard fails if `Game.svelte` imports a card component, if the prompt state or `PlayerTabs.inspect()` calls a `…CardData(` builder, or if `PlayerTabs` or `TechRows` looks a fan's card up by index again. `tests/library.test.mjs` checks the new component's structure and section. In Chromium, `tests/browser/player-area.test.mjs` hovers a display card on the Tech tab: the preview shows that card, by its title, and goes when the pointer leaves.

## 4. Hand-offs

#63 adds a landmark kind to `CardPreview` alone if landmark cards become inspectable.
