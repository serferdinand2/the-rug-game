# One component draws a landmark's footprint (#110): design

Written 2026-10-30. #110 is in M13 · Refactor. #63 builds on it: it puts the shape on the track spaces and the cards. Every decision here is **(my call)**; nothing needed the owner.

## 1. What and why

A landmark's footprint was drawn twice:
- `LandmarkPiece` drew it as an SVG: one unit square per plot, the picture turned and clipped inside, and the border stroked inside the plots;
- `LandmarkCard` drew it as a grid of `<span>`s, an `.empty` span for each gap.

#63 needs a third copy on the track spaces. **Done when** `LandmarkPiece` and `LandmarkCard` both draw with one `LandmarkShape`, and the screens look the same as before.

## 2. The component

`src/lib/components/player/LandmarkShape.svelte`, root `<svg>`:

| Prop | Default | What it does |
|---|---|---|
| `id` | | The landmark's slug; picks its picture. Optional, since a card's shape has no picture |
| `footprint` | | As printed, such as `['XX', 'XX']` |
| `rotation` | `0` | Quarter turns clockwise |
| `plotSize` | | Pixels per plot; without it the shape fills its box (the piece on the capital) |
| `gap` | `0` | Pixels between plots, with `plotSize` (the card's 2 px) |
| `picture` | `true` | Draw the picture; `false` leaves the plain plots (the card) |
| `plots` | `false` | Outline every plot, not only the border, so the plots can be counted |
| `color` | `var(--gold)` | The outline |
| `tint` | a quarter of `color` over `--raised` | The fill under the picture |
| `element` | | Bindable: the svg, which `LandmarkPiece` uses as its drag image (#111) |

The shape is `aria-hidden` by default; a caller that needs a name passes `aria-hidden={false}`, `role="img"` and an `aria-label` (the owner's 2026-10-28 ruling: no new screen-reader work).

The border is drawn the way the piece drew it: twice the stroke, clipped to the plots, so it sits inside them. With `plots`, the stroked path is the plots' own squares; that gives the card's 2 px border on each 20 px plot.

## 3. Geometry in `placement.js`

- `pictureTransform(footprint, rotation)` turns the picture about the centre of the turned shape. It moved out of `LandmarkPiece`.
- `fillPath(shape, gap)` takes an optional gap, in plots, rounded so the path has no floating-point noise.

## 4. The users

- **`LandmarkPiece`** keeps its states, controls, keys, drag and glows. It passes its outline and tint custom properties as `color` and `tint`, and styles the glows on the shape through `:global(.rg-landmark-piece--shape)`.
- **`LandmarkCard`** draws `<LandmarkShape picture={false} plots plotSize={20} gap={2}>` in the card's colours. An empty footprint (an unknown slug in the gallery) draws nothing, as before.
- **`TrackSpace`** is left to #63.

## 5. Same look

Screenshots of the library's LandmarkPiece, CapitalGrid, PlacementTray and LandmarkCard sections, before and after, at 1920 × 1080: the first three are identical; the card differs in one pixel column of anti-aliasing, by at most 2 of 255. No README screenshot changes.

## 6. Hand-offs

- #63: put `LandmarkShape` on the track spaces and in the tech cards' square box. A faint plot grid could be `plots` with a softer `color`; at `gap={0}` neighbouring plots' borders meet, so the inner lines are twice as thick as the outer ones, which #63 may want to change.
- #111 and #112 work on `LandmarkPiece`; the shape is now one line there.
