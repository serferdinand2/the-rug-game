# Landmark detail on technology benefits Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** A landmark-granting technology card shows the track-style gray landmark detail when its square benefit is hovered.

**Architecture:** Carry the engine landmark id through `techCardData()` into `TechnologyCardData`, then attach it and the benefit title to the existing global tooltip target. `Tooltip` and `LandmarkHoverDetail` remain the only popup and footprint renderers.

**Tech Stack:** Svelte 5, JavaScript with JSDoc, shared CSS tokens.

**Spec:** `docs/superpowers/specs/2026-10-31-tech-landmark-benefit-hover-design.md`

## Global Constraints

- Keep component markup in Svelte 5 and JavaScript with JSDoc.
- Reuse engine IDs and the existing `title`/`data-landmark` tooltip contract.
- Do not change card dimensions or non-landmark benefits.

## Review Focus

- A landmark card exposes its square benefit's tooltip target.
- A non-landmark card and the circle benefit do not expose a landmark detail target.
- The tooltip's footprint still comes from the shared landmark catalog.

### Task 1: Carry landmark IDs into the tech card and attach the hover target

**Files:**
- Modify: `src/lib/cards/game-cards.js`
- Modify: `src/lib/components/player/TechnologyCard.svelte`
- Modify: `src/lib/components/README.md`

**Interfaces:** `TechnologyCardData.landmark?: string`; `techCardData(id)` returns it only for landmark cards. The square benefit row passes its sentence as `title` and the ID as `data-landmark`.

- [ ] Add the optional `landmark` field to the card-face typedef and populate it from the engine card when present.
- [ ] Apply `title` and `data-landmark` only to the square effect row when the landmark id exists.
- [ ] Document that the square benefit opens the shared landmark detail tooltip.
- [ ] Review the rendered markup and preserve all existing card layout and tooltip styling.
