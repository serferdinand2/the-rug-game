# Player View Border and Capital Flag Implementation Plan

> **For agentic workers:** Implement this plan natively in the current worktree. Steps use checkbox syntax for tracking.

**Goal:** Fix edge-tab/frame collisions in another player's area and replace the capital map icon with vector art based on the supplied PNG.

**Architecture:** Add an inset to the inspected player's tab viewport and draw summary frame rails with their top edge beginning below its separator. Replace the catalogued capital SVG variants, then rasterize the same vectors to transparent PNGs.

**Tech Stack:** Svelte 5, CSS, SVG, Chromium canvas rasterization.

**Spec:** `docs/superpowers/specs/2026-10-31-player-view-border-and-capital-flag-design.md`

## Global Constraints

- Preserve existing player-view, resource and capital game state.
- Keep pixel artwork crisp and transparent outside the castle and banner.
- Preserve all unrelated edits in the current worktree.

## Review Focus

- Selected Capital tab at the left edge of the scroll row.
- Tab row at narrow widths where scrolling is active.
- Resource separator's joins with the colored vertical rails.
- Alpha and dimensions of every color's SVG and PNG.

---

### Task 1: Player frame details

**Files:**
- Modify: `src/screens/game/PlayerTabs.svelte`, `src/screens/Game.svelte`

- [x] Inset the inspected tab row at the left edge by the player-frame width.
- [x] Start the summary's side rails below the horizontal separator while keeping the bottom rail.

### Task 2: Capital art

**Files:**
- Replace: `static/art/piece/capital-fortress-{blue,red,green,yellow,purple}.svg`
- Replace: `static/art/piece/capital-fortress-{blue,red,green,yellow,purple}.png`

- [x] Vectorize the supplied castle silhouette and color its banner for each seat.
- [x] Rasterize all five SVGs at the source's 225×150 size with transparency.
