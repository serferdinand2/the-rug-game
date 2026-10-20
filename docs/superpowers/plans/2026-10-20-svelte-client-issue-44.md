# Svelte client setup (issue #44) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the hand-written placeholder in `public/` into a Svelte 5 app in `client/` that Vite builds into `public/`. Add the formatting, type checking and CI that CONVENTIONS.md expects.

**Architecture:**
- Vite's root is `client/` and its static folder is `client/static/`. It builds into `../public/`, which becomes git-ignored build output.
- `server.mjs` keeps serving `public/`. It also gives Vite's hashed `assets/` files a year-long immutable cache.
- `npm start` and `npm test` build first.
- `scripts/dev.mjs` runs `node --watch server.mjs` and Vite's dev server together. Vite proxies `/api` to the Node server.

**Tech Stack:** Node.js 22.9+, Svelte 5.57.2, Vite 8.3.4, `@sveltejs/vite-plugin-svelte` 7.3.1, svelte-check 4.7.7, Prettier 3.9.10 with `prettier-plugin-svelte` 4.1.1.

**Spec:**
- GitHub issue #44;
- [CONVENTIONS.md](../../../CONVENTIONS.md);
- [design document](../specs/2026-10-20-the-rug-game-design.md) §4.

## Global Constraints

- Dev dependencies only, with exact versions pinned. No runtime dependencies. No SvelteKit.
- JavaScript with JSDoc. svelte-check runs with `checkJs` and `strict`.
- Runes mode is forced for every component (`compilerOptions.runes = true`).
- Prettier settings come verbatim from CONVENTIONS.md. Markdown and generated files are not reformatted.
- Components follow CONVENTIONS.md: a `<script module>` with typedefs, `$props()`, `rg-` BEM classes and colours from the tokens.
- One copy of each font, in `client/static/fonts/`.

## Review Focus

1. A fresh clone running `npm ci && npm test` must build before the static tests run, or they fail on a missing `public/`. Pinned by the `pretest` script and CI.
2. Hashed bundles under `/assets/` must carry `immutable` caching, and `index.html` must still revalidate, or players keep a stale client after a deploy. Pinned in Task 2.
3. `docs/ui/main-screen.html` must still find the fonts after they move. Checked in a browser in Task 3.
4. Prettier must not rewrite the research Markdown or the generated mockup. Pinned by `.prettierignore` and a `npm run format` that leaves `git status` clean.
5. `npm run check` must pass on a clean tree, or CI fails on the first push. Pinned by CI.

---

### Task 1: `ComponentEvent` and the tool configuration

**Files:**
- Create:
  - `client/src/lib/component-event.js`;
  - `tests/component-event.test.mjs`;
  - `vite.config.js`, `svelte.config.js`, `jsconfig.json`;
  - `.prettierrc`, `.prettierignore`;
  - `scripts/dev.mjs`.
- Modify: `package.json` (dev dependencies, scripts), `.gitignore` (`public/`).

**Interfaces:**
- Produces:
  - `class ComponentEvent { constructor(value: any, target: HTMLElement, originalEvent?: Event) }`, with fields `value`, `target` and `originalEvent`;
  - the scripts `build`, `start` (with `prestart: build`), `dev`, `check`, `format`, and `test` (with `pretest: build`).

- [ ] **Step 1:** Write `tests/component-event.test.mjs`. Test `'carries the value, the target and the original event'`: `new ComponentEvent({ track: 'exploration', space: 5 }, target, original)` exposes all three, unchanged. Test `'the original event is optional'`: `originalEvent` is `undefined` when it isn't given.
- [ ] **Step 2:** Run `node --test tests/component-event.test.mjs`. It is expected to fail because the module is missing.
- [ ] **Step 3:** Implement `client/src/lib/component-event.js` as CONVENTIONS.md shows. The test is expected to pass.
- [ ] **Step 4:** Install the pinned dev dependencies (`npm install --save-dev --save-exact …`). Add the configs:
  - `vite.config.js`: root `client`, `publicDir` `static`, `build.outDir` `../public` with `emptyOutDir`, and a dev-server proxy sending `/api` to `http://127.0.0.1:${PORT || 3020}`;
  - `svelte.config.js` with `runes: true`;
  - `jsconfig.json` with `checkJs`, `strict`, `moduleResolution: bundler`, covering `client/src` and `engine`;
  - Prettier, with the files to ignore: `public/`, `*.md`, `docs/ui/main-screen.html`, `LICENSE`, `package-lock.json`, `.superpowers/` and `.playwright-mcp/`.

### Task 2: Move the placeholder into Svelte and serve the build

**Files:**
- Move:
  - `public/fonts/*` and `public/favicon.svg` into `client/static/`;
  - `public/index.html` into `client/index.html`, which becomes the Vite shell with `<div id="app">`.
- Create:
  - `client/src/main.js`;
  - `client/src/App.svelte` (the placeholder, as block `rg-placeholder`);
  - `client/src/styles/tokens.css` and `base.css`, made from `public/style.css` and the `docs/ui` palette.
- Modify: `server.mjs` (immutable caching for `assets/`) and `tests/static.test.mjs`.

- [ ] **Step 1:** Add a test, `'serves built bundles with immutable caching'`:
  - the built `/` contains a `<script type="module" … src="/assets/…">`;
  - that file answers 200, `text/javascript` and `public, max-age=31536000, immutable`;
  - `/` keeps `no-cache`.
- [ ] **Step 2:** Run `npm test`. The pretest step builds the client. The new test is expected to fail on the caching header.
- [ ] **Step 3:** In `server.mjs`, paths under `assets/` get `public, max-age=31536000, immutable`, and `art/` and `fonts/` keep their week.
- [ ] **Step 4:** Run `npm test`. Every test is expected to pass, including the existing placeholder, favicon and font tests against the built `public/`.
- [ ] **Step 5:** Run `npm start`, open http://127.0.0.1:3020, and check it at 1300px and 390px wide. It is expected to look like the previous placeholder, with no horizontal scroll at 390px.

### Task 3: Formatting, check, CI and docs

**Files:**
- Modify:
  - every existing `.mjs` and `.js` file (Prettier);
  - `.github/workflows/test.yml` (`npm ci`, `npm run check`, `npm test`);
  - `docs/ui/mockups/gen-tabs.mjs`, where the standalone font path becomes `../../client/static/fonts/`, and the regenerated `docs/ui/main-screen.html`;
  - `README.md`, `CLAUDE.md` and `CONVENTIONS.md`, for the commands, the layout and the font paths.

- [ ] **Step 1:** Run `npm run format`, then `npm run format` again. The second run is expected to change nothing, with `git status` unchanged by it.
- [ ] **Step 2:** Run `npm run check`. It is expected to report 0 errors and 0 warnings.
- [ ] **Step 3:** Regenerate the mockup, serve the repository root over HTTP, and confirm that both fonts load on `docs/ui/main-screen.html`.
- [ ] **Step 4:** Update the docs:
  - README "Run locally": `npm install`, `npm start`, `npm run dev`, `npm test`;
  - CLAUDE.md: the Commands and Architecture sections, and "Where the work stands";
  - CONVENTIONS.md: Markdown is not formatted by Prettier, and the fonts live in `client/static/fonts/`.
- [ ] **Step 5:** Commit as `Fix #44: set up the Svelte 5 client with Vite`, push to `main`, and confirm the GitHub Actions run passes.
