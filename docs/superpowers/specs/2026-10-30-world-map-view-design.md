# What the World Map draws on each hex (#114): design

Written 2026-10-30. #114 is in M13 · Refactor (Capital and map), found by the client scan (#80); its blocker #113 is closed. Every decision here is **(my call)**; the issue gave the shape.

## 1. What and why

`WorldMap.svelte` worked out each hex inside the component, with no test: it swapped a previewed tile into its hex and added "showing the chosen tile" to its label, decided each hex's target and score, which hexes dim and which are veiled, built the outline and picture, laid out the pieces (outposts before tokens, the Nomads' marks from its own `MARKS`), placed the "+N VP" tag from its own `TAG`, chose the outline layer's hexes and worded the VP in a nested `aria-label` ternary ("Up to 3 VP." or, on the selected hex, "3 VP."). `TilePicker` worded the same VP its own way ("up to 3 VP on this hex"). None of these phrases had a test.

**Done when** a tested `mapView()` gives every hex what the map draws, `WorldMap` keeps only `focused`, the events, the painted pictures and the SVG, and one "up to N VP" phrase serves both components.

## 2. The changes

- **`mapView(hexes, { targets, scores, selected, preview, fresh }, size = HEX_SIZE)`** in `src/lib/hexmap.js` returns one `MapViewHex` per hex, in order: the `MapHex`, with a previewed tile's corners, island, clouds and volcano swapped in, plus
  - `label`: the hex for assistive technology, with "Showing the chosen tile." on a previewed hex and, on a scored target, "Up to N VP." or "N VP." on the selected hex;
  - `previewed`, `target`, `score` (the VP on a target hex, else null), `selected`;
  - `dimmed` (not a target while others are) and `veiled` (a dimmed hex that is explored, so a veil covers its painted terrain; a previewed unexplored hex is never veiled);
  - `outlined` (a target, the preview, the selected hex or a fresh one: the outline layer, to which `WorldMap` adds the focused hex) and `pulses` (a fresh hex that is neither a target nor selected);
  - `outline` (SVG points), `picture` (the hex picture's box), `pieces` (outposts first, then tokens, each in its `pieceSpots` spot, a Nomads piece with its mark) and `tag` (the "+N VP" tag's box, font size and text, or null).

  `TAG` and `MARKS` move into `hexmap.js` with it. The tag is tuned for `HEX_SIZE`, so at another size it scales with the hex; at `HEX_SIZE` it is exactly as before.
- **`upToVp(vp)`** in `hexmap.js`: "up to 3 VP", from `amountWords('vp', vp)`. `mapView` and `TilePicker` both use it; the selected hex's "3 VP" is `amountWords` too. It sits in `hexmap.js`, not `words.js`, because only the map's VP use it and the Words and names issues edit `words.js` in parallel.
- **`WorldMap.svelte`** derives `drawn` from `mapView` and its outline layer from `outlined` and `focused`; its markup reads `label`, `selected`, `dimmed`, `pulses` and `tag` instead of working them out. The preview's painted picture and the painted map stay in the component, with their blob URLs.
- **The `preview` prop** is typed by the new `MapPreview` typedef in `hexmap.js` instead of an inline type.

Nothing on screen changes. The component's server-rendered HTML was compared before and after in nine states (plain, targets, scores, a selected scored hex, a selected hex beside a preview, a preview on a target, a preview alone, fresh hexes with a target and a selection, and a fresh hex alone): it is byte-identical.

## 3. Tests

Vitest, in `tests/client-hexmap.test.mjs`:
- nothing asked: every hex as `mapHexes` gives it, with its outline and picture, nothing lit;
- the targets: the rest dim, and only the explored ones are veiled;
- the scores: only on targets, the tag's box and text, "Up to N VP." and "Up to 0 VP.", no VP on a target without a score;
- the selected hex says "N VP.";
- the preview: the tile's terrain and pictures, its words, the "Showing the chosen tile. Up to N VP." label, and a dimmed previewed hex that is not veiled;
- fresh hexes: outlined, and pulsing unless a target or selected;
- the pieces: outposts, then tokens, in their spots, with the Nomads' marks;
- another size scales the outline, the picture and the tag;
- `upToVp`, and a source guard that `WorldMap` calls `mapView` and keeps no `TAG`, `MARKS`, `pieceSpots` or `addWords`, and `TilePicker` words its VP with `upToVp`.

`tests/tile-picker.test.mjs` passes unchanged. Playwright: `explore-prompt` and `hotkeys`, the browser tests that drive the map, pass unchanged.

## 4. Hand-offs

#49 changes the preview and the hex labels: both are now in `mapView`, under test. A fifth label phrase or a new overlay goes there too, not in the component.
