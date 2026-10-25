---
name: The Rug Game — reviewed card system
description: Style B civilization cards using the owner's mockup palette and pixel paper.
colors:
  card-paper: "#e8d6ad"
  card-text: "#3c3021"
  card-muted: "#756447"
  title-gold: "#e2b857"
  title-band-start: "#5c3e1f"
  title-band-middle: "#987a51"
  title-band-end: "#cbb58c"
  placement: "#aaa8a1"
  placement-border: "#797875"
typography:
  card-title:
    fontFamily: "Cinzel, serif"
    fontSize: "28px"
    fontWeight: 700
    lineHeight: 1.05
  card-body:
    fontFamily: "Atkinson Hyperlegible, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.38
  card-label:
    fontFamily: "Atkinson Hyperlegible, sans-serif"
    fontSize: "10px"
  card-clarity:
    fontFamily: "Atkinson Hyperlegible, sans-serif"
    fontSize: "11px"
  card-benefit:
    fontFamily: "Atkinson Hyperlegible, sans-serif"
    fontSize: "12px"
spacing:
  card-inset: "12px"
  artwork-gap: "12px"
components:
  civilization-card:
    width: "425px"
    backgroundColor: "{colors.card-paper}"
    textColor: "{colors.card-text}"
  placement-compact:
    width: "62px"
    height: "62px"
  placement-large:
    width: "75px"
    height: "75px"
---

# Reviewed card system

## Overview

Preserve the owner's Style B civilization-mat composition. Warm pixel-textured paper, solid gold title letters and large pixel artwork sit inside the existing dark application. The mockup reference supplies palette and texture; it does not replace the card composition. This scoped design document describes the reviewed card system, not a redesign of every app surface.

The extensive normative decisions, pattern recipes, component APIs and superseded experiments are in [docs/ui/card-design-rules.md](docs/ui/card-design-rules.md). That guide and the newest owner instruction take precedence over older mockups. Fourteen civilization examples exercise the shared patterns; they do not claim all card families or gameplay adapters are complete.

## Colors

Solid mockup gold is for title letters. The former brown title colour belongs to the band gradient. Beige boxes identify triggered benefits and scoring. Grey squares are empty placement targets. Blue highlights identify the sample player's current state. Preserve artwork RGB and alpha, never recolour it with filters except the explicit muted unfilled-state illustration.

## Typography

Cinzel belongs to the title. Atkinson carries rules, benefits and scoring. Keep `X VP` on a single line. Dense benefit text is regular weight with only VP rewards bold. The main effect is larger than supporting clarification text.

## Layout

The 425 px frame has natural height, a 160 px square full portrait and its main instruction beside it. Use compact square placements, the approved five-across size as the maximum, and 39 px targets only for dense numbered prediction rows. Craftsmen columns align at the bottom; benefits sit to the right of each compact square. Expansion badges and complexity stay in the footer.

## Elevation & Depth

Use the supplied pixel-paper texture and existing card shadow. Borders separate semantic groups. Covered rewards remain behind pieces inside their original squares. Path lines communicate legal movement, not decorative depth.

## Shapes

Placement targets are square. Expansion labels are plain text boxes. Native resource art has no grey circle or enclosing reward box. Cards and tiles retain their meaningful miniature shapes when illustrating the type of item being placed.

## Components

`CardFrame`, `CardSlot`, `CardResource`, `PlayerToken`, `CardEffectBox`, `CardClarity`, `CardPlacementRows`, `CardRewardColumns`, `CardPathGrid`, `CardPredictionTracks`, `CardTerrainRewards`, `CardTokenReserve`, `CardScoreLadder`, `CardTechnologyTransfer`, and `CivilizationCard` are indexed in the component library. Components accept typed props/snippets and render supplied state; the engine owns legality and effects.

## Do's and Don'ts

- Use native 24 px or 48 px resource artwork; the 32 px originals are deprecated.
- Use the owner's shaded 32 px player tokens and native 24 px terrain hex markers.
- Keep resource groups unbroken and show `+ icon` for one resource.
- Keep clarifying rules beneath the relevant placement area.
- Keep original and current rules editions explicit.
- Do not restore superseded resource circles, oversized placement squares, expansion icons, stacked VP labels or duplicate token indicators.
- Do not close the whole card-gallery issue on the strength of civilization-frame work alone.
