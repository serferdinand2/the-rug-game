# Review tidy-up (issue #46) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the seven minor findings deferred by the code reviews of #1 and #44.

**Architecture:** Small changes to `server.mjs`, `tests/static.test.mjs`, the two ignore files, `package.json` and the README. Behaviour changes get a test that fails first. Changes that only tighten a test are proven by running them against a deliberately broken copy.

**Tech Stack:** Node.js 22.12+, `node:test`, Vite build output in `public/`.

**Spec:** GitHub issue #46 (its seven checkboxes) and [CONVENTIONS.md](../../../CONVENTIONS.md).

## Global Constraints

- No new dependencies. Prettier formatting, braces on every `if` and `else`, and a JSDoc block on every new function.
- Player-facing and API error bodies keep their existing shapes: `{ error }` JSON for `/api`, and plain text for static files.

## Review Focus

1. A file that exists but can't be read must never produce a cached, empty 200. Pinned in Task 1.
2. `/api` (no slash) must not fall through to static serving. Pinned in Task 1.
3. A nested `public/` folder outside the build output must stay tracked. Checked with `git check-ignore` in Task 3.
4. Running one test file without a build must say what to do. Checked in Task 2.
5. A host that drops dev dependencies must still be able to run a prebuilt app. Documented and scripted in Task 3.

---

### Task 1: Server behaviour

**Files:** Modify `server.mjs` and `tests/static.test.mjs`.

- [ ] **Step 1:** Write the failing tests.
  - `'a file that cannot be read answers 500, not an empty 200'`:
    - write `public/unreadable.txt`, then `chmod 000` it;
    - `GET /unreadable.txt` is expected to answer 500 with `{ error: 'Something went wrong. Try again.' }`;
    - remove the file in `finally`;
    - skip the test when running as root, because root can read it anyway.
  - `'/api without a slash answers JSON'`: `GET /api` is expected to answer 404 with `application/json` and `{ error: 'Unknown request.' }`.
- [ ] **Step 2:** Run `npm test`. Both tests are expected to fail: the first gets a 200, and the second gets a plain-text 404.
- [ ] **Step 3:**
  - In `serveStatic`, read the file before `writeHead`.
  - Route `pathname === '/api' || pathname.startsWith('/api/')` to the API.
- [ ] **Step 4:** Run `npm test`. Everything is expected to pass.

### Task 2: Tighter tests

**Files:** Modify `tests/static.test.mjs`.

- [ ] **Step 1:** The traversal test asserts that each status is one of 400, 403 or 404.
  - Prove it by temporarily making the server answer 500 for paths containing `%2e`, then restore.
- [ ] **Step 2:** Rename "serves the placeholder page" to `'serves the app shell'`, and assert both `<title>The Rug Game</title>` and `<div id="app">`.
  - Prove it by temporarily removing `<div id="app">` from the built `public/index.html`, then rebuild.
- [ ] **Step 3:** In `before()`, throw `Error('public/index.html is missing: run npm run build first (npm test does this for you).')` when the build output is missing.
  - Prove it by moving `public/` aside, running the file, then moving it back.

### Task 3: Ignore files, deploy script and docs

**Files:** Modify `.gitignore`, `.prettierignore`, `package.json`, `README.md` and `CLAUDE.md`.

- [ ] **Step 1:** Anchor the build folder as `/public/` in both ignore files.
  - Expected: `git check-ignore -v public/index.html` still matches;
  - `git check-ignore -v docs/x/public/a.txt` matches nothing.
- [ ] **Step 2:** Add the `serve` script, `node --env-file-if-exists=.env server.mjs`, which serves an existing build without needing dev dependencies.
  - Document the deploy steps in a README "Deploying" section: `npm ci`, `npm run build`, then optionally `npm prune --omit=dev`, then `npm run serve`.
  - Add `npm run serve` to the CLAUDE.md Commands.
- [ ] **Step 3:**
  - Run `npm run format`, `npm run check` and `npm test`, and expect all three to be clean.
  - Commit `Fix #46: tidy up the minor findings from the #1 and #44 reviews`.
  - Push to `main`, confirm CI passes, and confirm #46 is closed.
