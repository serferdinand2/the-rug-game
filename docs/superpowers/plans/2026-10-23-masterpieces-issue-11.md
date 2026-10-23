# Masterpiece illustrations (issue #11) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Draw the 20 Arts & Architecture masterpieces, one 64×64 style C picture each, and push them to main for the owner's review. #11 stays open for the landmark cards, space tiles and inspiration tiles.

**Architecture:**
- Each picture is a drawing module at `art/drawings/masterpiece/<slug>.js`, built to `static/art/masterpiece/<slug>.svg` by the existing art build. The component library's Art area picks each one up by itself.
- A new test file checks every masterpiece: full bleed, no twins, and that all 20 are drawn.
- Seven subagents draw side by side, two or three cards each, writing only their own drawing files.

**Tech Stack:** Node.js 22.12+ built-ins, the `art/` toolkit from #4, `node:test`, and svelte-check for JSDoc.

**Spec:** [docs/superpowers/specs/2026-10-23-masterpieces-design.md](../specs/2026-10-23-masterpieces-design.md)

## Global Constraints

- **Toolkit rules** from #4 and `docs/art/README.md`: JSDoc and ES modules, no `node:` imports in `art/**/*.js`, a one-line comment at the top of each file, braces on every `if`/`else`, Prettier (tabs, single quotes), and `npm run check` with 0 errors and 0 warnings.
- **Drawing rules.** No `Math.random()`; one `seededRandom(seed)` stream per drawing. Colours are lowercase `#rrggbb` from `PALETTE` or blended from it with `mix()`.
- **Side-by-side drawings never edit shared files** (`art/palette.js`, `art/parts/`, `art/painter.js`, tests, docs), and never run `npm run art`, `npm test` or git.
- **Every picture** is 64×64, paints all 4,096 pixels, has no lettering, shows no likeness of a real person and has no building as its subject.
- **Detail at 7/10** (owner): one clear hero, about 50 to 90 colours, with tech/compass, tech/calendar and civ/entertainers as the yardstick.
- **Commits** say "Refs #11: …" and end with the `Co-Authored-By` line; drawings go in together with their SVGs (`npm run art`). #11 does not close.

## Review Focus

1. **Lettering**: Calligraphy, Graffiti, the seal, the globe and any gallery label. Checked at 4×.
2. **An art form that doesn't read at 1×**: Animation (the zoetrope), Mime (the invisible wall), Krav Maga (two figures in one move).
3. **A repeat**: each picture beside the earlier pictures the spec's §6.3 names, and the look-alike pairs (Ballet and Modern Dance; Painting, Fresco and Stained Glass; Animation and Motion Picture).
4. **Detail off target**: far below 50 or far above 90 colours, or a busy background.
5. **A building creeping in** behind Mime, Graffiti or Topiary.

---

### Task 1: The checks

**Files:** Create `tests/art-masterpiece.test.mjs`; modify `docs/art/README.md`.

- [ ] **Step 1:** Write `tests/art-masterpiece.test.mjs`, mirroring `tests/art-tech.test.mjs` for the `masterpiece/` group with `FINISHED = ['aa']`.
- [ ] **Step 2:** Run `node --test tests/art-masterpiece.test.mjs`. Expected: FAIL, listing all 20 masterpiece ids as not drawn.
- [ ] **Step 3:** In `docs/art/README.md`, name `tests/art-masterpiece.test.mjs` beside the other full-bleed checks.

### Task 2: The 20 drawings

**Files:** Create `art/drawings/masterpiece/<slug>.js` for all 20.

- [ ] **Step 1: Draw** side by side, seven subagents:
  - Painting, Fresco and Stained Glass (art on a wall);
  - Ballet, Modern Dance and Krav Maga (bodies in motion);
  - Theater, Mime and Costuming (performance);
  - Animation, Motion Picture and Art Deco (the early 20th century);
  - Calligraphy, Ceramics and Haute Cuisine (crafts close up);
  - Tapestry, Mapmaking and Baroque (objects in the making or on show);
  - Graffiti and Topiary (outdoors).
- [ ] **Step 2: Build and verify**: `npm run art`, `node --test tests/art-masterpiece.test.mjs tests/art-build.test.mjs`, `npm run check`. Expected: PASS, clean.

### Task 3: Review and hand-over

**Files:** Modify any drawing the review flags; `CLAUDE.md`.

- [ ] **Step 1: Review** all 20 at 1× and 4× on a contact sheet with the earlier pictures the spec names, against the spec and the Review Focus; fix the findings.
- [ ] **Step 2: Verify the whole suite**: `npm test` PASS, `npm run check` clean.
- [ ] **Step 3: Record it**: in CLAUDE.md's "Where the work stands", note that #11's 20 masterpieces are drawn and waiting for the owner.
- [ ] **Step 4: Commit** "Refs #11: draw the 20 masterpieces" and push to main.
- [ ] **Step 5: Hand the 20 to the owner** for review in the component library (`npm run dev`, then <http://127.0.0.1:5173/components.html#art-parts>).
