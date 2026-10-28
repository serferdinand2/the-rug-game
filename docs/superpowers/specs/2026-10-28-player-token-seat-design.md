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
- `ProgressLanes` is **left for after #85**: Lazar's #85 reworks the track spaces and holds `ProgressLanes.svelte` meanwhile (coordinator, 2026-10-28). The guard test below names it as the one exception still to do.
- `results.js`: `StandingRow.seat` and `ScoreRow.seat` are typed as seats (`ui.js`' `Seat`).

Every token keeps its size, its empty `alt` and its pixelated rendering, so the look is pixel-identical. `PlayerToken` adds `draggable="false"` to the three, which the cards' tokens already have **(my call)**.

## 4. Tests

- `tests/library.test.mjs`: "every player token is a PlayerToken (#103)" fails on a component outside `PlayerToken` that builds a token's URL (`playerPieceUrl('token'`, `piece/token-`) or reads `PLAYER_ART_COLORS`; `ProgressLanes` is its one named exception until #85 lands.
- The library section shows the five seats, and the colours as before; `npm run check` covers the seat types.
- Browser: `pass-screen` and `results` run unchanged.
