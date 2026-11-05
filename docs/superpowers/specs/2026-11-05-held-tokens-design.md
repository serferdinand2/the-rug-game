# Another player's token moves while their advance shows (#179)

**Asked (issue #179):** when another player advances, everyone else should see the token hop to its new space at the moment the display that says so (PlayerAction, #153) shows, not when the room update arrives. Today `ProgressLanes` hops a token (`tokenHop()`, #175) as soon as its position changes, whether or not anyone is looking; the displays wait for the dice and for the viewer's own question, play one by one, and the Tracks board may not be on screen at all. The owner made the issue's two calls on 2026-11-05 (recorded below). Other choices are Claude's, marked **(my call)**.

## Owner decisions (2026-11-05)

- **On the World Map:** when another player's advance shows, the shared board switches to Tracks and stays there afterwards.
- **Placement:** PlayerAction stays at the centre of the tracks, as #153 built it, even where it covers the token.
- **Review:** none; built in the main session, test first.

## Held tokens

- Each advance display carries the space its token left: the `advance` picture gains `from`, read from the `tokenMoved` event.
- `src/lib/held-tokens.js`, a plain module:
  - `heldTokens(queue, moved)`: for each player and track with an advance still queued, where the board draws the token. An advance not yet on show keeps it on the space it left; the one on show, once its display has moved it (`moved`), puts it on the space it reached. The first queued advance for a player and track decides, so queued advances move a token one display at a time. Each hold also records `final`, the space the queued advances leave the token on.
  - `holdTokens(tracks, held, still)`: the track board with each held token on its held space. A hold applies only while the game's position is its `final`, so a token another move has since taken elsewhere (a step back, an income turn's advance, AI Singularity's restart, a second token) is drawn where it really is **(my call)**. `still` marks every player while Skip all puts the tokens on their spaces.
- `App.svelte` computes the holds from its queue and passes them to `Game`, which draws `holdTokens(trackBoard(game), held, still)`.
- The queue now fills in `$effect.pre`, before the screen draws, so the board never draws a token on its new space and then takes it back **(my call)**.

## When the token moves

- An advance's display shows, and after `--duration-medium` (the panel's entrance and the board's settle) its token hops from the space it left, while the space is lit in the player's colour. The move is counted by the display (`shownCount`), so Show again plays the hop again: its tokens go back to the spaces they left at once (`still`), then hop as each display shows **(my call)**.
- A display that waits (the dice roll, the viewer's own question or notice) keeps its token held, so the board can lag behind the game until the question is closed **(my call)**. Once a token has moved it stays moved, even if the display then waits behind a question.
- **Tracks, and stay:** when an advance shows, `Game` switches the board to Tracks. The Tracks board mounts with the token on the space it left, so the hop is seen after a hand-over and from the Map alike.
- **Skip all** empties the queue: every held token goes to its final space at once, without a hop or a slide. `tokenHop()` takes `{ still }`, which stops any hop and sets the slide's duration to 0 until the page has painted.
- **Reduced motion** holds nothing: every token stands on its final space as the update arrives, as before.

## Testing

- `tests/client-held-tokens.test.mjs`: a queued advance holds its token on the space it left; the display on show moves it once `moved`; two queued advances on one track take turns; items already shown and other kinds hold nothing; `holdTokens` draws a hold only while the position is its final, leaves the other players alone and marks `still`.
- `tests/client-player-actions.test.mjs`: the advance picture's `from`.
- `tests/client-transitions.test.mjs`: a still token neither hops nor slides, and gets its timing back after the paint.
- Browser `tests/browser/held-tokens.test.mjs`, with motion on, counting the token's hops through `Element.animate`: at an online table the watcher looks at the Map (the board switches to Tracks) or at the tracks; the token is first drawn on the space it left and reaches the new one with one hop while the display shows. Under reduced motion it is already on its new space and nothing hops. At a hot-seat table, the player who takes the screen after the advance sees the same. Run against the code before the change, the Map case fails; with the queue filled in a plain `$effect`, the Tracks and hot-seat cases fail on a hop backwards.
- The library's ProgressLanes section gains "Skip all: 3 at once"; the browser test `motion` checks that it neither hops nor slides, and that the next move hops.
