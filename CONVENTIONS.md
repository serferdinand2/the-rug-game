# The Rug Game conventions

These are the coding conventions for The Rug Game. Every contributor and coding agent follows them. [CLAUDE.md](CLAUDE.md) says where the work stands. This file says how code is written.

**The project uses JavaScript with JSDoc for type annotations, not TypeScript.** The browser interface is **Svelte 5** (runes) built with **Vite**, without SvelteKit. The server and the rules engine are plain Node.js ES modules with no runtime packages.

---

## Table of contents

1. [Project layout](#project-layout)
2. [Formatting](#formatting)
3. [JavaScript (engine, server and client modules)](#javascript-engine-server-and-client-modules)
4. [Rules engine](#rules-engine)
5. [Server](#server)
6. [Svelte components](#svelte-components)
   1. [File structure](#file-structure)
   2. [JSDoc type definitions](#jsdoc-type-definitions)
   3. [Props](#props)
   4. [Event handling](#event-handling)
   5. [CSS naming (BEM)](#css-naming-bem)
   6. [State management](#state-management)
   7. [Complete example](#complete-example)
7. [Styling, art and motion](#styling-art-and-motion)
8. [Tests](#tests)
9. [Commits, issues and documentation](#commits-issues-and-documentation)
10. [Quick reference checklist](#quick-reference-checklist)

---

## Project layout

This is the layout. It follows the owner's other Svelte projects: everything the app ships is in `src/`, shared code in `src/lib/`, and `static/` at the root. `src/lib/engine/` holds the rules engine; its `data/` folder holds the game data (#12).

```
index.html               The game page (Vite's root is the project root)
components.html          The component library page (#48)
src/
  main.js                Mounts App.svelte
  App.svelte
  lib/                   Everything the app shares
    components/<area>/   Svelte components grouped by area: ui, board, player, prompts, lobby, gallery
    engine/              Rules engine: pure JS, shared by the server and the app
      data/              Game data as frozen modules: tracks, income mat, capitals, maps, tiles, landmarks, dice (#12)
    art/                 catalog.js (asset ids) and footprints.js (landmark footprints), read by the app, the engine and the art toolkit
    component-event.js   Plain JS modules: component-event.js, api.js, game.svelte.js …
  library/               The library page: Library, Section, Example, sections/<area>/<Name>.svelte, and the art (art.js, ArtTile)
  styles/                tokens.css (design tokens), base.css (fonts, page, focus) and pixel-noise.svg (texture)
static/                  Copied as-is into the build: fonts/, art/ (generated SVGs), favicon.svg
server.mjs, limits.mjs   Node HTTP server and its pure helpers (no packages)
art/                     Art toolkit (build time): painter, palette, scene parts, drawings/<id>.js
  build.mjs              Draws art into static/art/ (npm run art)
  gallery.js             Scene-part samples, review grouping and the drawing check, shared with the library page
public/                  Vite build output, served by server.mjs (git-ignored)
scripts/dev.mjs          Runs the Node server and Vite's dev server together (npm run dev)
tests/                   Vitest suites (*.test.mjs); tests/browser/ holds the Playwright tests
docs/                    Research, design, plans, interface designs, art notes
```

- `src/lib/**/*.js` and `art/**/*.js` import nothing from the DOM or Svelte, unless the file is a `.svelte.js` rune module. That way they run under Vitest in Node.
- `src/lib/` never imports from `art/`; the toolkit imports from `src/lib/art/`, not the other way round. Only the library page (`src/library/`) imports the toolkit, to show the art; the game never does.
- The only files under `public/` are build output. Never edit them by hand.

## Formatting

**Prettier** formats the code (JavaScript, Svelte, CSS, HTML, JSON and YAML) with the same settings as the owner's other Svelte projects. Markdown, the generated mockup and the build output are left alone (see `.prettierignore`).

```json
{
	"printWidth": 80,
	"semi": true,
	"tabWidth": 4,
	"useTabs": true,
	"singleQuote": true,
	"quoteProps": "as-needed",
	"trailingComma": "es5",
	"bracketSpacing": true,
	"bracketSameLine": true,
	"arrowParens": "always",
	"singleAttributePerLine": true,
	"plugins": ["prettier-plugin-svelte"],
	"overrides": [{ "files": "*.svelte", "options": { "parser": "svelte" } }]
}
```

- Indent with tabs and use single quotes. Always write the semicolons.
- Put **curly braces on every `if`, `else if` and `else` block**, including one-liners.
- Run `npm run format` before committing. `npm run check` (svelte-check with `checkJs`) must report no errors.

## JavaScript (engine, server and client modules)

- **ES modules only.** Use named exports, no default exports, except that Svelte components are default by nature. Server-only files use `.mjs`. Shared and client modules use `.js`.
- **File names** are kebab-case (`component-event.js`, `track-costs.js`). Svelte components are PascalCase (`TrackSpace.svelte`).
- **Names:**
  - `camelCase` for functions and variables;
  - `PascalCase` for classes and JSDoc types;
  - `UPPER_SNAKE_CASE` for module-level constants holding fixed game data (`TIER_COSTS`, `TRACKS`).
- **First line of every file:** a one-line comment saying what the file is for.
- **Comments** explain *why*, not what. Don't leave commented-out code.
- **JSDoc** on every exported function and type:

```js
/**
 * Returns the cost of advancing into a track space.
 * @param {TrackId} track - The track being advanced on.
 * @param {number} space - The space being entered, 1–12.
 * @returns {Cost} The resources to pay.
 */
export function advanceCost(track, space) {
	// …
}
```

- Cast types inline with `/** @type {Type} */ (value)`.
- Write functions as `function` declarations at module level. Use arrow functions for callbacks and handlers.
- Prefer `const`. Never use `var`.
- Never use `Math.random()` in game logic. Randomness is injected (see below).

## Rules engine

The engine is the most important code in the project. It follows the sibling projects' design:

- **Pure and serialisable.**
  - Game state is a plain JSON-safe object.
  - `play(state, seat, action, random)` returns a **new** state built from a `structuredClone`. A rejected action never touches the live state.
- **Effects as data.** Track spaces, cards and civilizations describe their effects as data, for example `{ gain: { any: 1 } }`, `{ explore: 1 }` or `{ conquer: 1 }`. The engine interprets them, so one effect resolver serves the whole game.
- **Pending decisions.**
  - Effects push operations onto `state.pending`, and the run loop runs the automatic ones and stops at a decision, such as `{ player, kind: 'chooseResource', … }`.
  - An action names an open decision by its id. A batch of decisions, or a group, can open several at once. A decision can belong to a player whose turn it isn't, such as a trap response.
  - The engine names players by seat number, 1 to n.
  - A group holds one lane per player, so players decide at the same time.
  - Each decision kind is a module in `src/lib/engine/decisions/` with `answers`, `check`, `resolve` and `hidden`, registered in `kinds.js`. Handlers get a `Context` (`ctx.push`, `ctx.pushGroup`) and never import the stack. An effect handler also gets the `effects` operation it runs in, with its `source` space.
- **Errors meant for players** are `throw new PlayerError('…')`, written as a sentence a player understands. Any other error is a bug.
- **Events.** Every change appends a typed event with an increasing `seq`. The client animates and writes the log from events, never by diffing state.
- **Privacy.** `view(state, seat)` is the only way state leaves the server. It hides hands, deck order and face-down tiles.
  - Private data lives only in a decision kind's `hidden` fields or an event's `secret`. Automatic operations and every other event field are public.
  - Handlers never replace `state.pending` or a lane's stack array, because each Context holds on to them. They change them in place.
- **Randomness** comes in as a `random(n)` function returning a whole number from 0 to n − 1: `crypto.randomInt` on the server, `seededRandom(seed)` from `src/lib/engine/random.js` in tests. The state never holds a seed.
- **Rules decisions** come from `docs/research/` and the README's "Rules conventions". A rule nobody has decided gets an issue, never a guess.

## Server

- `server.mjs` is an adapter: it authenticates, calls an engine or room transition, and stores and serves the result. Rules live in the engine, never in the server or the client.
- The table rules live in `rooms.mjs`, as pure transitions like the engine's: each returns a new room, or `null` when it closes, never changes the room it was given, and throws `PlayerError`. The server stores what they return.
- Every response that contains game state goes through `view()`.
- Mutating requests carry the room `version`. A stale one gets **409**.
- `PlayerError` answers **400** with `{ error }`. Anything else is logged, and the client gets **500** with a generic message.
- The table API lives in `api.mjs`. Every table change goes through its `commit()`, rooms leave it only through `roomView()`, and nothing that runs from a timer or another person's change may throw. Its limits sit in `config`, which tests change instead of waiting.
- `server.mjs` exports `server` and `config` and only calls `listen()` when run directly.

## Svelte components

### File structure

Every component has this structure:

```svelte
<script module>
	// 1. JSDoc type definitions (@typedef)
</script>

<script>
	// 1. Imports
	// 2. Props with $props() and a JSDoc type annotation
	// 2.1. lets
	// 2.2. consts
	// 3. State with $state()
	// 4. Derived values with $derived()
	// 5. Effects with $effect()
	// 6. Event handlers, named `{action}Handler`
	// 7. Helper functions
</script>

<!-- Template -->

<style>
	/* BEM classes with the rg- prefix */
</style>
```

- One component per file. Group files by area under `src/lib/components/<area>/`. Import them with relative paths, such as `../../component-event.js` from a component.
- Keep game logic out of components. A component renders the state it gets and reports what the player did. Anything worth testing goes in a plain module in `src/lib/`.
- **Every component is on the component library page** (`/components.html`, #48). In the same change that adds a component:
  - add `src/library/sections/<area>/<Name>.svelte`, which shows every state the component supports, each in an `<Example label={…}>` that names the props producing it;
  - add a row to the index in `src/lib/components/README.md`.

  `tests/library.test.mjs` fails on a component without a section, and on one that breaks the structure rules in this chapter.

### JSDoc type definitions

Use a separate `<script module>` block for type definitions:

```svelte
<script module>
	/**
	 * One player's token on a track space.
	 * @typedef {Object} TrackToken
	 * @property {number} player - Seat index
	 * @property {string} color - The player's colour token, e.g. 'var(--player-1)'
	 */

	/**
	 * Properties of the TrackSpace component itself.
	 * @typedef {Object} TrackSpaceOwnProps
	 * @property {number} space - Space number, 0–12 (0 is the start)
	 * @property {string} name - Space name, e.g. 'Navigation'
	 * @property {TrackToken[]} [tokens] - Tokens on this space
	 * @property {Function} [onTrackSpaceClick] - Callback fired when the space is chosen
	 */

	/**
	 * Properties for the TrackSpace component, including any attributes for its root button.
	 * @typedef {TrackSpaceOwnProps & import('svelte/elements').HTMLButtonAttributes} TrackSpaceProps
	 *
	 * @example
	 * <TrackSpace
	 *   space={4}
	 *   name="Navigation"
	 *   onTrackSpaceClick={(event) => console.log(event.value)}
	 * />
	 */
</script>
```

Key rules:
1. Use JSDoc `@typedef` for every type.
2. Use `@property` to document each property.
3. Mark optional properties with `[propertyName]`, and defaults with `[size='small']`.
4. Include an `@example`.
5. Types that several components share, or that come from the engine, live in a `.js` module as `@typedef` and are imported with `/** @typedef {import('…').Name} Name */`.
6. **A props type is the component's own props joined with its root element's attributes**, so `...attr` and `attr.class` type-check under `strict`:

```js
/**
 * Properties for the TrackSpace component, including any attributes for its root button.
 * @typedef {TrackSpaceOwnProps & import('svelte/elements').HTMLButtonAttributes} TrackSpaceProps
 */
```

   Name the own-props typedef `{Component}OwnProps`. Use the attributes type that matches the root element: `HTMLAttributes<HTMLElement>`, `HTMLButtonAttributes`, `HTMLInputAttributes` and so on.

### Props

Use the `$props()` rune with a JSDoc type annotation:

```svelte
<script>
	import { ComponentEvent } from '../../component-event.js';

	/** @type {TrackSpaceProps} */
	let { space, name, tokens = [], next = false, onTrackSpaceClick, ...attr } = $props();
</script>
```

Always spread `...attr` on the root element and merge its `class`, so the parent can pass extra HTML attributes:

```svelte
<div
	{...attr}
	class="rg-track-space {attr.class ? attr.class : ''}">
```

### Event handling

**Handlers are named `{action}Handler`:**

| Action          | Handler name                          |
| --------------- | ------------------------------------- |
| click           | `clickHandler`                        |
| submit          | `submitHandler`                       |
| input           | `inputHandler`                        |
| change          | `changeHandler`                       |
| keydown / keyup | `keydownHandler` / `keyupHandler`     |
| focus / blur    | `focusHandler` / `blurHandler`        |
| toggle          | `toggleHandler`                       |
| a named part    | `{part}{Action}Handler`, e.g. `rotateButtonClickHandler`, `hexClickHandler` |

**Callback props are named `on{ComponentName}{Action}`:**

```js
/**
 * @typedef {Object} CapitalGridProps
 * @property {Function} [onCapitalGridPlace] - A building or landmark was placed
 * @property {Function} [onCapitalGridRotate] - The ghost was rotated
 */
```

**Callbacks receive a `ComponentEvent`.** It is defined in `src/lib/component-event.js`:

```js
// ComponentEvent(value, target, originalEvent)
// - value: the data being reported (may be undefined)
// - target: the HTML element that triggered the event
// - originalEvent: the original DOM event (optional)
export class ComponentEvent {
	/**
	 * @param {any} value
	 * @param {HTMLElement} target
	 * @param {Event} [originalEvent]
	 */
	constructor(value, target, originalEvent) {
		this.value = value;
		this.target = target;
		this.originalEvent = originalEvent;
	}
}
```

```js
/**
 * @param {MouseEvent} event
 */
const clickHandler = (event) => {
	const target = /** @type {HTMLButtonElement} */ (event.currentTarget);

	if (typeof onTrackSpaceClick === 'function') {
		onTrackSpaceClick(new ComponentEvent({ track, space }, target, event));
	}
};
```

Where a callback is optional, give it sensible default behaviour, or none. A component never sends moves to the server itself: the screen that owns the game state does that.

### CSS naming (BEM)

Use BEM naming with the `rg-` prefix:

```
rg-{component-name}                 /* Block */
rg-{component-name}--{element}      /* Element */
rg-{component-name}--{modifier}     /* Modifier (state or variant) */
```

| Kind         | Class                                                         |
| ------------ | ------------------------------------------------------------- |
| Block        | `rg-track-space`                                              |
| Element      | `rg-track-space--name`, `rg-track-space--cost`                |
| Modifier     | `rg-track-space--next`, `rg-track-space--affordable`          |
| Size variant | `rg-card--small`, `rg-card--medium`, `rg-card--large`         |

Apply modifiers with `class:` directives:

```svelte
<button
	{...attr}
	type="button"
	class="rg-track-space {attr.class ? attr.class : ''}"
	class:rg-track-space--next={next}
	class:rg-track-space--affordable={affordable}>
	<span class="rg-track-space--name">{name}</span>
</button>
```

Order the CSS as: block, size modifiers, state modifiers, then elements.

### State management

```svelte
<script>
	// Reactive state
	let rotation = $state(0);

	// Two-way binding with the parent
	let { value = $bindable() } = $props();

	// Derived values
	let footprint = $derived(rotate(landmark.footprint, rotation));

	// Effects: only for syncing with the outside world (focus, timers, the DOM)
	$effect(() => {
		if (focus && element) {
			element.focus();
		}
	});
</script>
```

- Element references are `$state()`, typed with JSDoc: `/** @type {HTMLButtonElement | undefined} */ let element = $state();`, then `bind:this={element}`.
- The table and game state the client receives lives in one rune module, `src/lib/game.svelte.js`, updated from the long poll. Components read it through props rather than importing it everywhere.
- Prefer `$derived` over `$effect` for anything that can be computed.

### Complete example

```svelte
<script module>
	/**
	 * One player's token on a track space.
	 * @typedef {Object} TrackToken
	 * @property {number} player - Seat index
	 * @property {string} color - The player's colour token
	 */

	/**
	 * Properties of the TrackSpace component itself.
	 * @typedef {Object} TrackSpaceOwnProps
	 * @property {string} track - Track id, e.g. 'exploration'
	 * @property {number} space - Space number, 0–12
	 * @property {string} name - Space name
	 * @property {TrackToken[]} [tokens] - Tokens on this space
	 * @property {boolean} [next=false] - This is the viewing player's next space
	 * @property {string} [cost] - Cost text shown on the next space
	 * @property {boolean} [affordable=false] - The viewing player can pay the cost
	 * @property {Function} [onTrackSpaceClick] - Callback fired when the space is chosen
	 */

	/**
	 * Properties for the TrackSpace component, including any attributes for its root button.
	 * @typedef {TrackSpaceOwnProps & import('svelte/elements').HTMLButtonAttributes} TrackSpaceProps
	 *
	 * @example
	 * <TrackSpace
	 *   track="exploration"
	 *   space={5}
	 *   name="Ships"
	 *   next
	 *   cost="food + any"
	 *   affordable
	 *   onTrackSpaceClick={(event) => select(event.value)}
	 * />
	 */
</script>

<script>
	import { ComponentEvent } from '../../component-event.js';

	/** @type {TrackSpaceProps} */
	let {
		track,
		space,
		name,
		tokens = [],
		next = false,
		cost,
		affordable = false,
		onTrackSpaceClick,
		...attr
	} = $props();

	let label = $derived(next && cost ? `${name}, next space, costs ${cost}` : name);

	/**
	 * @param {MouseEvent} event
	 */
	const clickHandler = (event) => {
		if (typeof onTrackSpaceClick === 'function') {
			const target = /** @type {HTMLButtonElement} */ (event.currentTarget);
			onTrackSpaceClick(new ComponentEvent({ track, space }, target, event));
		}
	};
</script>

<button
	{...attr}
	type="button"
	class="rg-track-space {attr.class ? attr.class : ''}"
	class:rg-track-space--next={next}
	class:rg-track-space--affordable={affordable}
	aria-label={label}
	onclick={clickHandler}>
	<span class="rg-track-space--number">{space || ''}</span>
	<span class="rg-track-space--name">{space ? name : 'start'}</span>
	{#if next && cost}
		<span class="rg-track-space--cost">{cost}</span>
	{/if}
	<span class="rg-track-space--tokens">
		{#each tokens as token (token.player)}
			<i
				class="rg-track-space--token"
				style:background={token.color}></i>
		{/each}
	</span>
</button>

<style>
	.rg-track-space {
		position: relative;
		height: 58px;
		padding: 2px;
		border: 1px solid var(--track-border);
		border-radius: var(--radius);
		background: var(--track-fill);
		color: var(--text);
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	.rg-track-space--next {
		box-shadow: 0 0 0 2px var(--gold);
	}

	.rg-track-space--affordable .rg-track-space--cost {
		color: var(--ok);
	}

	.rg-track-space--number {
		position: absolute;
		top: 1px;
		right: 3px;
		font-size: 7.5px;
		opacity: 0.4;
	}

	.rg-track-space--name {
		display: block;
		font-size: 9px;
		line-height: 1.05;
	}

	.rg-track-space--cost {
		position: absolute;
		inset: auto 2px 13px;
		font-size: 8px;
		text-align: center;
		background: var(--ink);
		border-radius: var(--radius);
	}

	.rg-track-space--tokens {
		position: absolute;
		bottom: 2px;
		left: 2px;
		display: flex;
		gap: 1px;
	}

	.rg-track-space--token {
		width: 7px;
		height: 7px;
		border: 1px solid var(--ink);
		border-radius: 50%;
	}
</style>
```

## Styling, art and motion

- **Design tokens.** `src/styles/tokens.css` is the single source of truth for the look. It was taken from the phase-one designs in `docs/ui/`, and it holds:
  - colours: surfaces, lines, text, accents, tracks, players, resources, terrain and expansions;
  - the pixel texture;
  - type: families, weights, sizes, line heights and letter spacing;
  - spacing, layout sizes, borders and corners;
  - shadows, glows, focus, motion and layers.

  Where a mockup disagrees with `tokens.css`, `tokens.css` wins.
- **Using the tokens.**
  - Components use `var(--…)` and never hard-code a colour. Art is the only exception.
  - Derive a tint from a token with `color-mix()`, for example `color-mix(in srgb, var(--gold) 20%, var(--control))`, instead of adding a new hex value.
  - A colour the design needs that `tokens.css` lacks goes into `tokens.css` first.
  - `tests/styles.test.mjs` fails on a hard-coded colour or an undeclared custom property.
- **Corners and shadows.** Corners are square (`var(--radius)` is 0). Ordinary panels get no shadow; only floating things (`--shadow-float`), overview cards (`--shadow-card`) and the glows have one.
- **Surfaces.** The middle play area is `background: var(--texture) var(--surface)`. Header, footer and panels are `var(--chrome)`.
- **Fonts.** Use Cinzel (`--font-title`) for the names of game things: tracks, spaces, civilizations, landmarks, buildings and terrain. Use Atkinson Hyperlegible (`--font-body`) for player names, instructions, controls and data. Follow the role table in `docs/ui/README.md`. Player names never use Cinzel. Each font has one copy, with its licence, in `static/fonts/`.
- **Art** is vector pixel SVG, drawn with one `crispEdges` path per colour (see `docs/art/`). Reference art by its stable asset id. Never inline large SVGs in components.
- **Layout.** The game is for desktop screens only; there is no phone layout (owner decision, 2026-10-21). Check interface work at desktop width before calling it done.
- **Motion.** Use `svelte/transition` and `animate:flip` for tokens, cards and buildings moving. Respect `prefers-reduced-motion`: no motion when it is set.
- **Accessibility.**
  - Actions are `<button>`s. Icons carry `aria-label`s.
  - Everything works with the keyboard, and focus is always visible.
  - Colour is never the only signal. For example, an affordable cost is green *and* named in the `aria-label`.

## Tests

- Use Vitest (`import { test } from 'vitest'`) with `node:assert/strict`; new tests may use `expect`. Test files are `tests/<area>.test.mjs`; `vite.config.js`'s `test` block runs them in Node, after a global setup that builds `public/` (#55).
- Browser tests use Playwright in Chromium only: `tests/browser/<page>.test.mjs`, run by `npm run test:e2e` against `npm run dev`. Find elements by role and accessible name, or by `data-id`.
- Test names are plain sentences describing the behaviour, such as `'the first player into tier II takes the landmark'`.
- Write tests first: watch a test fail, then make it pass.
- **Engine:**
  - every rule gets a test;
  - randomized full-game tests check that cards, tiles and tokens are all still accounted for, and that `view()` leaks nothing private: `tests/simulation.test.mjs` uses `checkState()` from `tests/helpers/invariants.mjs` and `checkViews()` from `tests/helpers/views.mjs`, and a change that adds a card, tile, piece or deck adds it there too;
  - seeds are printed on failure.
- **Server:** tests import `server` and listen on port 0. Never use fixed ports.
- **Client:** logic lives in plain modules that Vitest can import. Components stay thin enough that `npm run check`, `tests/library.test.mjs` and the browser tests cover them; each new screen gets a browser test in `tests/browser/`.

## Commits, issues and documentation

- **Work order.**
  - Work issues in milestone order, and never start an issue whose **Blocked by** issues are still open.
  - Plan each issue before coding.
  - Reference the issue in every commit: `Fix #12: …` closes it, and `Refs #9: …` doesn't.
- **Commit messages.** Use an imperative subject line of 72 characters or fewer. The body explains what changed and why.
- **New issues** use the layout of the existing ones:
  - **Issue** with an **Example**;
  - **Current problem**;
  - **Proposed solution** with checkboxes;
  - **Related issues**.

  Give each a type label, its milestone, the matching `M… · …` label, and blocked-by links (see CLAUDE.md).
- **The README always shows the current interface.** Any interface change updates `docs/ui/screens/`, the README's "Current interface" section and `docs/ui/README.md` in the same commit.
- **Documentation** uses plain words and short sentences. It lives in `docs/`, never in `public/` or `static/`.

## Quick reference checklist

When writing or changing code, make sure:

- [ ] Prettier formatting (tabs, single quotes), braces on every `if`/`else`, and `npm run check` is clean
- [ ] The file starts with a one-line comment; exported functions and types have JSDoc
- [ ] Game rules live in `src/lib/engine/`, never in the server or a component
- [ ] Engine changes are pure and return new state; player-facing errors use `PlayerError`; changes emit events
- [ ] No `Math.random()` in game logic
- [ ] Components have a separate `<script module>` with `@typedef`, `@property` and `@example`
- [ ] A new component has a section on the library page and a row in `src/lib/components/README.md`
- [ ] Props use `$props()` with a `/** @type {Props} */` annotation; the root spreads `{...attr}` and merges `class`
- [ ] Handlers are named `{action}Handler`; callback props are named `on{ComponentName}{Action}` and receive a `ComponentEvent`
- [ ] CSS classes follow `rg-{component}--{element|modifier}`; colours come from tokens
- [ ] State uses `$state()`, `$derived()` and `$effect()`, preferring `$derived()`; bindable props use `$bindable()`
- [ ] Type casts use `/** @type {Type} */ (value)`
- [ ] Desktop width checked; reduced motion and the keyboard work
- [ ] Tests were written first and `npm test` passes
- [ ] The commit references its issue, and the README shows the current interface

### Card authoring

For cards, `docs/ui/card-design-rules.md` is normative. Reuse the extracted card primitives and add a library example; keep rules edition and authoritative state separate from review fixtures. Do not copy the old standalone mockup or restore superseded resource circles, 456 px widths or oversized placement squares. Native artwork conversions preserve colours and alpha exactly.
