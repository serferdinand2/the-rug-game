# Archived PNG mockups · earlier interface

These files preserve the 2026-10-20 main-screen design that preceded the first UI/UX design phase. They are historical references, not the current implementation target.

The current UI/UX manifest is [../README.md](../README.md). Use its launch, lobby and main-screen HTML references when building game pages.

| Earlier view | Screenshot |
|---|---|
| Tracks | [1-tracks.png](1-tracks.png) |
| Map | [2-map.png](2-map.png) |
| Capital | [3-capital.png](3-capital.png) |
| Cards | [4-cards.png](4-cards.png) |
| Players | [5-players.png](5-players.png) |

The [earlier standalone main-screen page](main-screen.html) and [original interface notes](original-interface-reference.md) are preserved alongside the PNGs. The HTML's font paths were adjusted for its archive location; the older font files remain in `client/static/fonts/`.

The old generator and shared wireframe kit are under [mockups/](mockups/). If historical regeneration is needed, run from the repository root:

```sh
node docs/ui/archivedpngmockups/mockups/gen-tabs.mjs docs/ui/archivedpngmockups/main-screen.html --standalone
```

Do not direct this generator at `docs/ui/main-screen.html`. It produces the superseded Alagard/VCR, purple-panel, tabbed-centre layout, not the phase-one Cinzel/Atkinson design.
