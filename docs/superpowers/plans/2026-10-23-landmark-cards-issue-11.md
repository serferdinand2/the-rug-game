# Landmark card illustrations (issue #11) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Draw the 10 landmark cards of Plans & Ploys and Arts & Architecture, one 64×64 style C picture each, and push them to main for the owner's review. #11 stays open for the space tiles and inspiration tiles.

**Architecture:**
- Each picture is a drawing module at `art/drawings/landmark-card/<slug>.js`, built to `static/art/landmark-card/<slug>.svg` by the existing art build. The component library's Art area picks each one up by itself.
- A new test file checks every landmark card: full bleed, no twins, and that all 10 are drawn.
- Five subagents draw side by side, two cards each, writing only their own drawing files.

**Tech Stack:** Node.js 22.12+ built-ins, the `art/` toolkit from #4, `node:test`, and svelte-check for JSDoc.

**Spec:** [docs/superpowers/specs/2026-10-23-landmark-cards-design.md](../specs/2026-10-23-landmark-cards-design.md)

## Global Constraints

- **Toolkit rules** from #4 and `docs/art/README.md`: JSDoc and ES modules, no `node:` imports in `art/**/*.js`, a one-line comment at the top of each file, braces on every `if`/`else`, Prettier (tabs, single quotes), and `npm run check` with 0 errors and 0 warnings.
- **Drawing rules.** No `Math.random()`; one `seededRandom(seed)` stream per drawing. Colours are lowercase `#rrggbb` from `PALETTE` or blended from it with `mix()`.
- **Side-by-side drawings never edit shared files** (`art/palette.js`, `art/parts/`, `art/painter.js`, tests, docs), and never run `npm run art`, `npm test` or git.
- **Every picture** is 64×64, paints all 4,096 pixels, has no lettering, shows no likeness of a real person and shows the life of its landmark, not the landmark's outside.
- **Detail at 7/10** (owner, from the masterpieces): one clear hero, about 50 to 90 colours, with tech/compass, tech/calendar and civ/entertainers as the yardstick.
- **Commits** say "Refs #11: …" and end with the `Co-Authored-By` line; drawings go in together with their SVGs (`npm run art`). #11 does not close.

## Review Focus

1. **Lettering**: the game boxes, the monitor, the camera's tally light and the news desk. Checked at 4×.
2. **A landmark that doesn't read at 1×**: TV Station (the camera), Birdwatching Perch (binoculars and heron), Bridge (the arch from beneath), Windmill (gears in the dark).
3. **A repeat**: each card beside its landmark picture and the earlier pictures the spec's §6.3 names, and the look-alike pairs (Game Store and Digital Studio; Urban Farm and Villa; Birdwatching Perch and Bridge).
4. **Detail off target**: far below 50 or far above 90 colours, or a busy background.
5. **A building creeping in** as the subject, above all behind Castle and Bridge.

---

### Task 1: The checks

**Files:** Create `tests/art-landmark-card.test.mjs`; modify `docs/art/README.md`.

- [ ] **Step 1:** Write `tests/art-landmark-card.test.mjs`, mirroring `tests/art-masterpiece.test.mjs` for the `landmark-card/` group with `FINISHED = ['pp', 'aa']`.
- [ ] **Step 2:** Run `node --test tests/art-landmark-card.test.mjs`. Expected: FAIL, listing all 10 landmark card ids as not drawn.
- [ ] **Step 3:** In `docs/art/README.md`, name `tests/art-landmark-card.test.mjs` beside the other full-bleed checks.

### Task 2: The 10 drawings

**Files:** Create `art/drawings/landmark-card/<slug>.js` for all 10.

- [ ] **Step 1: Draw** side by side, five subagents:
  - Game Store and Digital Studio (a table and a desk, indoors);
  - TV Station and Skyscraper (the 20th century at work);
  - Urban Farm and Villa (food in the open air);
  - Birdwatching Perch and Bridge (water seen from shelter);
  - Castle and Windmill (timber and iron mechanisms).
- [ ] **Step 2: Build and verify**: `npm run art`, `node --test tests/art-landmark-card.test.mjs tests/art-build.test.mjs`, `npm run check`. Expected: PASS, clean.

### Task 3: Review and hand-over

**Files:** Modify any drawing the review flags; `CLAUDE.md`.

- [ ] **Step 1: Review** all 10 at 1× and 4× on a contact sheet beside their landmark pictures and the earlier pictures the spec names, against the spec and the Review Focus; fix the findings.
- [ ] **Step 2: Verify the whole suite**: `npm test` PASS, `npm run check` clean.
- [ ] **Step 3: Record it**: in CLAUDE.md's "Where the work stands", note that #11's 10 landmark cards are drawn and waiting for the owner.
- [ ] **Step 4: Commit** "Refs #11: draw the 10 landmark cards" and push to main.
- [ ] **Step 5: Hand the 10 to the owner** for review in the component library (`npm run dev`, then <http://127.0.0.1:5173/components.html#art-parts>).
