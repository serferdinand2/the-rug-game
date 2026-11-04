# Issue #174 Follow-up Implementation Plan

> **For agentic workers:** Follow this plan in order. The owner requested these precise refinements and asked to close #174 when complete.

**Goal:** Keep the current era card only in Eras and show the viewer's progress line, with hover on a track tile or token.

**Architecture:** `CapitalTab` stops rendering `EraNote`; the Eras tab remains the sole live home for the current tapestry. `Track` supplies hover state and the viewer's own position to `ProgressLanes`, which draws a player-coloured line with the track colour as its glow, behind every token.

**Tech Stack:** Svelte 5, existing `track-shape.js` position geometry, shared CSS tokens.

**Spec:** `docs/superpowers/specs/2026-11-04-tabletop-skin-design.md`

## Global Constraints

- Do not alter turn rules or legality; the hover line is visual only.
- Preserve #81's rule that the line/preview belongs only to the viewer's own token.
- Keep every token above the hover line.
- Use the existing player and track colour tokens and component BEM classes.
- Keep the Eras tab's current tapestry display intact.

## Review Focus

- Hovering a tile previews the viewer's current progress, even if the tile is not a legal next move.
- Hovering any player's token still highlights only the viewer's own progress.
- At position zero the line remains absent; at later positions it ends under the viewer's token.
- The track colour glow and player-coloured line remain distinct, and all tokens stay above them.
- Removing the Capital duplicate does not remove the card from Eras.

---

### Task 1: Keep the current era card in Eras only

**Files:**
- Modify: `src/screens/game/CapitalTab.svelte`
- Modify: `src/screens/game/PlayerTabs.svelte`
- Modify: `docs/ui/README.md`
- Modify: `docs/superpowers/specs/2026-11-04-tabletop-skin-design.md`

Remove the `EraNote` rendering and its now-unused prop/data wiring from the live Capital tab. Leave the Eras tab untouched. Confirm the Capital tab shows no era card and Eras still shows the active card.

### Task 2: Show the viewer's track progress while hovering

**Files:**
- Modify: `src/lib/components/board/Track.svelte`
- Modify: `src/lib/components/board/TrackBoard.svelte`
- Modify: `src/screens/Game.svelte`
- Modify: `src/lib/components/board/ProgressLanes.svelte`
- Modify: `src/lib/components/README.md`

Pass the viewer's seat into `TrackBoard` and `Track`. Use the existing hovered/focused tile state to reveal a line to the viewer's own current token. Hovering a token also reveals that same line. Color the line with the viewer's player color, add a glow in the track color, and place the line beneath all tokens. Keep the line hidden at the start position and ensure hover does not affect legal moves or selection. Verify both behaviors visually in the running browser.

### Task 3: Record completion and close issue #174

**Files:**
- Modify: `docs/status.md`

After the two UI changes are present and visually confirmed, update #174's status entry and close the GitHub issue.
