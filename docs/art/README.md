# Art production notes

These are contributor notes. Nothing in this folder is served to players.

## Art style C (approved 2026-10-20)

The owner compared three versions of the same picture and chose style C:
- a 64×64 pixel-art scene with its own sky, setting and detail;
- shown inside a card frame, like Fablewood Rummy's card illustrations;
- drawn as vector SVG, with one `crispEdges` path per colour.

`style-c/lighthouse-scene.svg` is the approved reference: the Lighthouse landmark at night. To redraw it, run `node style-c/lighthouse.mjs style-c`.

Two other options were rejected as the main style: a 16×16 flat icon and a 32×32 shaded sprite. Small pieces that must stay readable at about 24px still use simple icons in the same palette. These are resources, buildings, outposts, dice, terrain, track symbols and the landmark grid markers.
