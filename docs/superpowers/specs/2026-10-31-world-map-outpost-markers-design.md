# Player flags and capital marker on the World Map

Written 2026-10-31. The World Map should use the approved colored art for player outposts, including its toppled variants, and distinguish each player's starting capital with a wide fortress-and-flag marker.

## Decisions

- Use the existing five `outpost-{color}.svg` and `outpost-toppled-{color}.svg` assets for ordinary map outposts. Remove the map's square/polygon approximations.
- Draw a dedicated capital fortress SVG in each player color. Its landscape silhouette occupies the combined width of the two starting outpost spots; the start outposts remain unchanged in engine state and accessible map labels.
- Determine the capital hex from the public `outpostsPlaced` setup event, which also covers the closest-island variant and does not reveal a small-map mat pick. Use the public capital mat's `CAPITAL_MATS[number - 1].start` only as a fallback when the setup event has left the event window.
- Keep the Nomads' mark on ordinary outposts and tokens unchanged. Do not alter control, ownership, or toppled rules.

## Verification

- `mapHexes` identifies each capital start for both map sizes and leaves its two outposts unchanged.
- `mapView` draws one capital marker spanning two spot widths in place of the two starting outpost indicators.
- WorldMap uses player-colored regular and toppled SVGs for non-capital outposts.
- The new capital SVGs are catalogued and have the expected pixel-art silhouette and color variants.
