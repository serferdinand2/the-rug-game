# PlayerToken takes a seat (#103): design

Written 2026-10-28. #103 is a refactor found by #80's review. The issue's proposed solution is the brief; every other decision is marked **(my call)**.

## 1. What and why

Four places draw a player's token without `PlayerToken`: the pass screen works out the artwork colour from the seat itself, and `StandingRow`, `ScoreBoard` and `ProgressLanes` draw a raw `<img src={playerPieceUrl('token', seat)}>`, each with its own `image-rendering: pixelated`, two of them casting the seat to `any`. `PlayerToken` gains a `seat` prop, so a token is drawn one way everywhere.

**Done when** every token outside the cards' own colour examples is a `PlayerToken` given a seat, and nothing changes on screen.

## 2. The component

- `seat` (1–5) sets the artwork colour from `PLAYER_ART_COLORS`, the same table `playerPieceUrl` reads; `color` stays for the reviewed cards, which name a colour rather than a seat. When both are given, `seat` wins **(my call)**, because a seat is what the game knows.
- The image, its size, `decorative` and the pixelated rendering are unchanged.

## 3. The four places

- `PassScreen`: `<PlayerToken {seat} size={48} decorative />`; its colour cast goes.
- `StandingRow`: `<PlayerToken seat={row.seat} size={36} decorative />`; its `img` rule and both `any` casts go.
- `ScoreBoard`: `<PlayerToken seat={row.seat} size={24} decorative />`; its `img` rule and both `any` casts go.
- `ProgressLanes` was **left for after #85**, which reworked the track spaces and held `ProgressLanes.svelte` meanwhile (coordinator, 2026-10-28). Finished on 2026-10-30 (see §5).
- `results.js`: `StandingRow.seat` and `ScoreRow.seat` are typed as seats (`ui.js`' `Seat`).

Every token keeps its size, its empty `alt` and its pixelated rendering, so the look is pixel-identical. `PlayerToken` adds `draggable="false"` to the three, which the cards' tokens already have **(my call)**.

## 4. Tests

- `tests/library.test.mjs`: "every player token is a PlayerToken (#103)" fails on a component outside `PlayerToken` that builds a token's URL (`playerPieceUrl('token'`, `piece/token-`) or reads `PLAYER_ART_COLORS`. Until 2026-10-30 `ProgressLanes` was its one named exception (`TOKENS_LEFT`); now there is none.
- The library section shows the five seats, and the colours as before; `npm run check` covers the seat types.
- Browser: `pass-screen` and `results` run unchanged.

## 5. ProgressLanes, after #85 (2026-10-30)

- The marker's raw `<img>` becomes `<PlayerToken class="rg-progress-lanes--token" seat={lane.seat} decorative />`, and `playerPieceUrl` leaves its imports.
- Its rule becomes `.rg-progress-lanes--marker :global(.rg-progress-lanes--token)`, because a class handed to a child component carries no scoping hash **(my call)**. It keeps the position, the `3 × --progress-line` square and the radius; `object-fit: contain` and `image-rendering: pixelated` go, since `PlayerToken` sets both. The rule's width and height win over `PlayerToken`'s 32 px attributes, so the token stays 9 px: pixel-identical.
- Only the token swap and its CSS change in `ProgressLanes.svelte`; #120 reworks the board's layout around it in parallel (coordinator, 2026-10-30).
- `TOKENS_LEFT` goes from the guard test, which fails first on `ProgressLanes`.
- Browser: `tests/browser/library.test.mjs`' "a progress line's token sits on the line's end, and its marker keeps within the lanes (#72)" still finds `.rg-progress-lanes--token` inside each marker and measures it.
