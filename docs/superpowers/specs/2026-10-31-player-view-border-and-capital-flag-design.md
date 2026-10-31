# Inspected player frame and capital flag art

Written 2026-10-31. Fix the selected Capital tab colliding with an inspected player's colored frame, make the frame join the resource separator cleanly, and replace the map capital icon with a vector rendering of the supplied castle.

## Decisions

- In another player's area, inset the tabs' scroll viewport by the frame width so a selected edge tab cannot paint across the colored border.
- Keep the resource/tab separator continuous across the inspected area. Start the colored side rails below that separator, with the bottom rail unchanged.
- Redraw the supplied 225×150 pixel castle by tracing its raster regions as crisp-edge SVG, fill only the enclosed transparent banner with each player's color, and replace all five SVG assets and their PNG exports.
- Keep marker sizing, map geometry, and game control data unchanged.

## Verification

- A selected leftmost Capital tab has clear space inside the inspected player's colored frame.
- The resource divider reads as one uninterrupted line; colored side rails start below it.
- Capital SVG and PNG variants are transparent, 256×160, and differ in flag color only.
