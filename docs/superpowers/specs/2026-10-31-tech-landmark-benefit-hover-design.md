# Landmark detail on technology benefits: design

## Intent

When a player hovers the square benefit of a technology card that grants a landmark, show the same gray tooltip treatment used for landmark track spaces, including the landmark picture, gold name and square footprint matrix.

## Existing behavior

`TechnologyCard` receives benefit wording from `techCardData()`. The engine's landmark technology cards already carry a `landmark` id. The shared page `Tooltip` already reads `title` and `data-landmark`, then appends `LandmarkHoverDetail`, which draws the landmark picture, name and matrix in the track tooltip's gray box.

## Decision

Pass the landmark card's engine id through `TechnologyCardData`. Only the square benefit row gets `title={card.square}` and `data-landmark={card.landmark}` when that id exists. This reuses the global tooltip and the existing detail component; no card-local overlay or duplicate matrix drawing is introduced. Cards without a landmark keep their existing hover behavior and layout.

## Scope and constraints

- Show the detail only when the square benefit is hovered; the circle benefit and the card body do not trigger it.
- Preserve the shared gray tooltip, divider, image, gold title and footprint matrix styling.
- Use engine-provided landmark IDs and catalog data, not names parsed from display text.
- Keep card dimensions and benefit layout unchanged.

## Approaches

- Reuse the global tooltip through its existing `title`/`data-landmark` contract (**chosen**): exact track behavior and one source for the matrix.
- Add a card-local popup: duplicates positioning and styling and risks drifting from track hovers.
- Expand the full-card preview: exposes unrelated card content and does not match the requested small gray detail box.
