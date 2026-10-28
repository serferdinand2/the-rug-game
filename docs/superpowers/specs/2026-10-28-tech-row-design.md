# The Tech tab's display row fits its cards (#84, one item): design

Written 2026-10-28. One of #84's nine small bugs, found by the client scan (#80); the other items are fixed elsewhere.

## What and why

On the Tech tab, each tech card is drawn at full size (425 × 298 px) and scaled to 0.42 inside a box sized from `--rg-player-tabs-width` and `--rg-player-tabs-height`. The player's own rows give the box 298 px, but the display row gave it 286 px (`PlayerTabs.svelte` 572), so its box was 120 px tall for a 125 px card, and the card hung 5 px over what follows.

## The change

The display row's box is 298 px, as the player's rows are. #92 gives the card sizes one home, so the number stops being repeated **(hand-off)**.

**Visible change:** the display row is 5 px taller at 0.42, so the row's bottom margin starts below its cards instead of under them.

## Tests

`tests/browser/player-area.test.mjs`: on the Tech tab at 1920 × 1080, every tech card's box is as tall as the scaled card it holds.
