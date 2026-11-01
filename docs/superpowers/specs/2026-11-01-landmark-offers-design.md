# Show landmark footprints wherever they are offered (#63)

## Intent

Show the actual landmark footprint before a player commits to an offer, so they can plan capital space without looking up the shape. Keep the existing shared tooltip detail and use the same `LandmarkShape` source used by the capital and landmark cards.

## Decisions

- Every unowned track landmark shows its picture clipped to its footprint, with a faint outline around each plot and the gold landmark name beside it. Use a compact five-pixel plot size with a one-pixel gap; the 4×4 Rubber Works is the largest track footprint and must fit in the bottom label area.
- Exploration and the other tracks use one shared `TrackLandmark` component. When the engine removes a landmark from `trackBoard()` after it is taken, that component and its footprint disappear with it.
- Each of the six landmark-granting technology cards puts a small, labeled footprint diagram inside the square-benefit area beside its text. The invention artwork remains the card picture. The existing gray tooltip on that benefit continues to show the larger landmark picture, gold name, and footprint.
- A full-card preview uses `TechnologyCard`, so it includes the same inline footprint automatically. Track hover continues using `LandmarkHoverDetail`, which already provides the larger image/name/footprint treatment.
- Keep the diagram accessible by naming the landmark and its footprint dimensions. The track-space button label also names the dimensions.
- Reuse the existing `FOOTPRINTS`, landmark catalog, and `LandmarkShape`; do not draw a second footprint source.

## Scope

Track spaces, the six base technology cards that grant landmarks, their existing hover/full-card views, component documentation, gallery examples, focused tests, and the current game screenshot. The existing footprint/art tests remain the source of truth that all catalog drawings match their footprint data.
