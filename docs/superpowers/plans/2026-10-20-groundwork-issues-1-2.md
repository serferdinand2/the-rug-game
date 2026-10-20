# Groundwork (issues #1 and #2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the repository a running Node server, a test suite and CI in Fablewood Rummy's setup (#1). Turn every [UNVERIFIED] research flag into a written rules convention (#2).

**Architecture:**
- `server.mjs` is a `node:http` server.
  - It serves only `public/` and answers `/api/*` through a per-address rate limiter.
  - It exports `server` and `config` and only listens when run directly, so tests run it in-process on port 0.
- `limits.mjs` holds the rate limiter and the client-address logic. It has no I/O, so it is unit-tested.
- The rules decisions go into the README's "Rules conventions" section, one collapsible block per area. A pointer in each research file leads there.

**Tech Stack:** Node.js 22.9+ (ES modules, `node:http`, `node:test`), no runtime packages, GitHub Actions.

**Spec:**
- [docs/superpowers/specs/2026-10-20-the-rug-game-design.md](../specs/2026-10-20-the-rug-game-design.md), issues 1 and 2;
- GitHub issues #1 and #2.

## Global Constraints

- Node.js `>=22.9`. No runtime dependencies and no build step.
- The default port is `3020` and the default host is `127.0.0.1`. `TRUST_PROXY=true` counts the last `X-Forwarded-For` address.
- Rate limits: 1,800 API requests per address per minute. The 20-new-tables-per-minute limit arrives with `/api/create` in #23.
- Only `public/` is served. Art and fonts are cached for a week; everything else is revalidated (`no-cache`) and carries a weak ETag and `X-Content-Type-Options: nosniff`.
- Licence: GPL-3.0-only. The fonts keep their own notices beside them.
- One copy of each font: `public/fonts/`.
- Every source file starts with a one-line comment saying what it is for.
- Owner rule: `README.md` always shows the current interface.

## Review Focus

1. Encoded path traversal (`%2e%2e`, `%252e`, `%2f`, `file:` URLs, NUL bytes) must never return a file from outside `public/`. This is pinned in Task 2.
2. A malformed percent-encoding such as `/%E0%A4%A` must answer 400 and must not crash the server. This is pinned in Task 2.
3. Importing `server.mjs` from a test must not bind a port. This is pinned in Task 2.
4. When `TRUST_PROXY` is off, a spoofed `X-Forwarded-For` header must be ignored. This is pinned in Task 1.
5. An unknown `/api/` path must answer JSON with 404, not the HTML page or a 500. This is pinned in Task 2.

---

### Task 1: Package, limits and CI

**Files:**
- Create: `package.json`, `limits.mjs`, `tests/limits.test.mjs`, `.env.example`, `.github/workflows/test.yml`, `LICENSE` (GPL-3.0 text copied from fablewood-rummy)

**Interfaces:**
- Produces:
  - `rateLimiter(limit: number, windowMs: number) -> { allow(ip: string, now?: number): boolean, sweep(now?: number): void, size: number }`
  - `clientAddress(req: http.IncomingMessage, trustProxy: boolean) -> string`

- [ ] **Step 1: Write failing tests** in `tests/limits.test.mjs`:
  - `each address may send a fixed number of requests per window`: with `rateLimiter(3, 1000)`, three `allow('a', 0)` calls are true, `allow('a', 999)` is false, `allow('b', 999)` is true, and `allow('a', 1000)` is true.
  - `quiet addresses are forgotten`: `allow('a', 0)` and `allow('b', 1500)`. Then `sweep(2500)` leaves `size === 1`, and `sweep(4000)` leaves `size === 0`.
  - `forwarded addresses count only behind a trusted proxy`: for a request with `headers['x-forwarded-for'] = '198.51.100.250, 203.0.113.1'` and `socket.remoteAddress = '10.0.0.1'`:
    - `clientAddress(req, true)` returns `'203.0.113.1'`;
    - `clientAddress(req, false)` returns `'10.0.0.1'`.
- [ ] **Step 2:** Run `node --test tests/limits.test.mjs`. It is expected to fail because the module is missing.
- [ ] **Step 3:** Implement `limits.mjs`, using fixed windows as in Fablewood.
- [ ] **Step 4:** Add `package.json`:
  - name `the-rug-game`, `"type": "module"`, `"private": true`;
  - `engines.node` `>=22.9`, licence `GPL-3.0-only`;
  - scripts `start`: `node --env-file-if-exists=.env server.mjs` and `test`: `node --test tests/*.test.mjs`.
- [ ] **Step 5:** Add `.env.example` (`HOST=127.0.0.1`, `PORT=3020`, `TRUST_PROXY=false`, each with a comment), the CI workflow (`actions/checkout@v4`, `actions/setup-node@v4` with node 22, `npm test`) and `LICENSE`.
- [ ] **Step 6:** Run `npm test`. All tests are expected to pass.

### Task 2: Static server and placeholder page

**Files:**
- Create: `server.mjs`, `public/index.html`, `public/style.css`, `public/favicon.svg` (copied from `docs/art/style-c/lighthouse-scene.svg`), `tests/static.test.mjs`
- Move: `docs/ui/fonts/*` to `public/fonts/`.
- Modify:
  - `docs/ui/mockups/gen-tabs.mjs`: the standalone font path becomes `../../public/fonts/`;
  - `docs/ui/main-screen.html`, regenerated.

**Interfaces:**
- Consumes: `rateLimiter` and `clientAddress` from Task 1.
- Produces:
  - `export const config = { host, port, trustProxy }`, read from the environment;
  - `export const server` (an `http.Server`, not listening on import). Later issues (#23) add routes to it.

- [ ] **Step 1: Write failing tests** in `tests/static.test.mjs`. Start `server.listen(0)` in `before` and close it in `after`. Use raw `http.get`, because `fetch` normalises paths.
  - `importing the server does not listen`: `server.listening === false` before `before()` runs. Check it at module top level, before `listen`.
  - `serves the placeholder page`: `/` gives 200, `text/html`, a body that matches `/The Rug Game/`, and an `X-Content-Type-Options` of `nosniff`.
  - `serves the favicon and fonts with long caching`:
    - `/favicon.svg` gives 200 and `image/svg+xml`;
    - `/fonts/alagard.ttf` and `/fonts/vcr-osd-mono.ttf` give 200, `font/ttf` and `Cache-Control: public, max-age=604800`.
  - `revalidates with weak ETags`: a second `/` request sending `If-None-Match` with the first response's `ETag` gets 304.
  - `never serves files outside public/`:
    - Paths: `/file:/etc/hosts`, `/file:///etc/hosts`, `/%2e%2e/server.mjs`, `/%252e%252e/server.mjs`, `/..%2fserver.mjs`, `/%2fetc%2fhosts`, `/fonts/%00`, `/%2e%2e/.git/config`.
    - Expected: none of them is 200, and no body matches `/node:http|repositoryformatversion|localhost/`.
  - `rejects malformed percent-encoding`: `/%E0%A4%A` gives 400, and the server still answers `/` with 200 afterwards.
  - `unknown API paths answer JSON`: `/api/nothing` gives 404, `application/json` and `{ error: 'Unknown request.' }`.
- [ ] **Step 2:** Run `node --test tests/static.test.mjs`. It is expected to fail because `server.mjs` is missing.
- [ ] **Step 3:** Implement `server.mjs` following Fablewood's static handler:
  - resolve the decoded path with `path.resolve(publicDir, …)`, and refuse anything outside `publicDir` or containing `\0`;
  - a MIME map;
  - gzip for html, js, css, json and svg when the request accepts it;
  - errors are logged, and the client gets 500 `{ error: 'Something went wrong. Try again.' }`;
  - listen only when `process.argv[1]` resolves to this file, logging `The Rug Game: http://…`.
- [ ] **Step 4:** Move the fonts, then write `public/index.html` (a title in Alagard, one sentence saying the game is in development, and a link to the GitHub repository) and `public/style.css`, in the night palette of `docs/ui/`.
- [ ] **Step 5:** Point the mockup generator at `../../public/fonts/`, regenerate `docs/ui/main-screen.html` and confirm it still loads both fonts.
- [ ] **Step 6:** Run `npm test` and expect it to pass. Run `npm start`, open http://127.0.0.1:3020 and confirm the page renders. Add a screenshot of the landing placeholder? No: the README's "Current interface" stays the approved main screen, because the placeholder is not a designed screen.

### Task 3: Documentation for #1

**Files:** Modify `README.md` (a "Run locally" section, and the font notice path), `CLAUDE.md` (Commands; where the work stands) and `docs/ui/README.md` (the font path).

- [ ] **Step 1:** Write the "Run locally" section:
  - `npm start` serves http://127.0.0.1:3020;
  - `npm test`;
  - `.env.example`.
- [ ] **Step 2:** Add these commands to CLAUDE.md:
  - `npm start`;
  - `npm test`;
  - one test file, `node --test tests/static.test.mjs`;
  - a name filter, `node --test --test-name-pattern="…" tests/*.test.mjs`.
- [ ] **Step 3:** Commit `Fix #1: set up the Node project like Fablewood Rummy` and push to `main`. Confirm the GitHub Actions run passes.

### Task 4: Rules conventions (#2)

**Files:** Modify `README.md` (a new "Rules conventions" section) and the three `docs/research/*.md` files (a pointer under each title). Create a follow-up issue for the owner's physical check.

- [ ] **Step 1:** Draft a decision for every [UNVERIFIED] flag and open question in `docs/research/`, using the principles in #2:
  - newest official source first;
  - base-game component questions are marked `owner-check`;
  - expansion content with no source is "left out", never invented;
  - a complete tiebreaker chain for both versions.
- [ ] **Step 2:** Review the draft. Each decision must be implementable, with exact numbers and no "TBD". Where a decision is a procedural choice, it names the alternative it rejected.
- [ ] **Step 3:** Add "Rules conventions" to the README:
  - an introduction;
  - one `<details>` block per area, each holding a table with the columns Question, Decision, Basis and Check;
  - a "Left out" list.
- [ ] **Step 4:** Add a line under each research file's title saying that decisions on its [UNVERIFIED] items are in the README's "Rules conventions" section.
- [ ] **Step 5:**
  - Open an issue, "Check the base-game rules conventions against the physical copy". It lists every `owner-check` row as a checkbox, carries the `documentation` and `M0 · Groundwork` labels, is assigned to milestone M0 and blocks nothing.
  - Commit `Fix #2: settle the unverified rules into rules conventions` and push to `main`.
  - Comment on #2 linking the section and the follow-up issue.
