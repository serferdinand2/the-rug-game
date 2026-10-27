<!-- One pointed space on an advancement track: its name, benefit, bonus, landmark and number, with hover and the gold selected outline. -->
<script module>
	/**
	 * Properties of the TrackSpace component itself.
	 * @typedef {Object} TrackSpaceOwnProps
	 * @property {import('../../ui.js').TrackId} track - The track, which sets the colours
	 * @property {number} space - The space number, 1–12; space 1 has a flat left edge, space 12 a square finish line
	 * @property {string} name - The space's name, such as 'Ships'
	 * @property {string} [landmark] - The landmark the first player here takes, such as 'Lighthouse'
	 * @property {import('../../glyphs.js').Glyph[]} [benefit=[]] - The benefit's symbols, drawn under the name (#59)
	 * @property {import('../../glyphs.js').BonusGlyphs | null} [bonus=null] - The bonus's price and gain, drawn in a small box under the benefit
	 * @property {string} [words=''] - The benefit and bonus in words, for the label and the tooltip
	 * @property {boolean} [selected=false] - Draw the gold outline; sets aria-pressed
	 * @property {boolean} [available=false] - The viewer can advance to this space: a green outline, named in the label; selected wins visually
	 * @property {Function} [onTrackSpaceClick] - Callback fired with { track, space } when the space is chosen
	 * @property {Function} [onTrackSpaceHover] - Callback fired with { track, space, hovering } when the pointer or keyboard focus arrives or leaves
	 */

	/**
	 * Properties for the TrackSpace component, including any attributes for its root button.
	 * @typedef {TrackSpaceOwnProps & import('svelte/elements').HTMLButtonAttributes} TrackSpaceProps
	 *
	 * @example
	 * <TrackSpace
	 *   track="exploration"
	 *   space={4}
	 *   name="Navigation"
	 *   landmark="Lighthouse"
	 *   benefit={[{ kind: 'word', text: 'Tile', count: 1 }, { kind: 'word', text: 'Explore', count: 1 }]}
	 *   words="Gain 1 territory tile, then explore."
	 *   selected
	 *   onTrackSpaceClick={(event) => select(event.value)}
	 * />
	 */
</script>

<script>
	import { ComponentEvent } from '../../component-event.js';
	import { SPACE_COUNT, outlinePath } from '../../track-shape.js';
	import { artUrl, trackColor } from '../../ui.js';

	/** @type {TrackSpaceProps} */
	let {
		track,
		space,
		name,
		landmark,
		benefit = [],
		bonus = null,
		words = '',
		selected = false,
		available = false,
		onTrackSpaceClick,
		onTrackSpaceHover,
		...attr
	} = $props();

	// Whether keyboard focus announced a hover that its blur must end.
	let focusHovering = false;

	let width = $state(0);
	let height = $state(0);

	let first = $derived(space === 1);
	let last = $derived(space === SPACE_COUNT);
	let path = $derived(outlinePath(width, height, { first, last }));
	let label = $derived(
		`${name}, ${track} space ${space}${landmark ? `, landmark ${landmark}` : ''}${available ? ', available' : ''}${words ? `. ${words}` : ''}`
	);

	/**
	 * @param {MouseEvent} event
	 */
	const clickHandler = (event) => {
		if (typeof onTrackSpaceClick === 'function') {
			const target = /** @type {HTMLButtonElement} */ (
				event.currentTarget
			);
			onTrackSpaceClick(
				new ComponentEvent({ track, space }, target, event)
			);
		}
	};

	/**
	 * @param {PointerEvent} event
	 */
	const pointerenterHandler = (event) => {
		reportHover(event, true);
	};

	/**
	 * @param {PointerEvent} event
	 */
	const pointerleaveHandler = (event) => {
		reportHover(event, false);
	};

	/**
	 * Keyboard focus previews like hovering; a click also focuses the button, but the pointer has already reported it.
	 * @param {FocusEvent} event
	 */
	const focusHandler = (event) => {
		const target = /** @type {HTMLButtonElement} */ (event.currentTarget);
		if (target.matches(':focus-visible')) {
			focusHovering = true;
			reportHover(event, true);
		}
	};

	/**
	 * @param {FocusEvent} event
	 */
	const blurHandler = (event) => {
		if (focusHovering) {
			focusHovering = false;
			reportHover(event, false);
		}
	};

	/**
	 * @param {Event} event
	 * @param {boolean} hovering
	 */
	function reportHover(event, hovering) {
		if (typeof onTrackSpaceHover === 'function') {
			const target = /** @type {HTMLButtonElement} */ (
				event.currentTarget
			);
			onTrackSpaceHover(
				new ComponentEvent({ track, space, hovering }, target, event)
			);
		}
	}
</script>

{#snippet symbol(/** @type {import('../../glyphs.js').Glyph} */ glyph)}
	{#if glyph.kind === 'resource' || glyph.kind === 'building'}
		<span class="rg-track-space--art rg-track-space--{glyph.kind}">
			<img
				src={artUrl(
					glyph.kind === 'resource'
						? `resource-24/${glyph.id}`
						: `building/${glyph.id}`
				)}
				alt=""
				draggable="false" />
			{#if glyph.count > 1}
				<b class="rg-track-space--count">×{glyph.count}</b>
			{/if}
		</span>
	{:else if glyph.kind === 'track'}
		<img
			class="rg-track-space--track"
			src={artUrl(`track/${glyph.id}`)}
			alt=""
			draggable="false" />
	{:else if glyph.kind === 'word'}
		<span
			class="rg-track-space--word"
			class:rg-track-space--crossed={glyph.cross}
			>{glyph.text}{glyph.count > 1 ? ` ×${glyph.count}` : ''}</span>
	{:else if glyph.kind === 'vp'}
		<span class="rg-track-space--vp"
			>{glyph.count === null ? 'VP' : `${glyph.count} VP`}</span>
	{:else}
		<span
			class="rg-track-space--joint"
			class:rg-track-space--or={glyph.kind === 'or'}
			>{glyph.kind === 'or' ? 'or' : '/'}</span>
	{/if}
{/snippet}

<button
	type="button"
	aria-pressed={selected}
	aria-label={label}
	title={words || undefined}
	{...attr}
	class="rg-track-space {attr.class ? attr.class : ''}"
	class:rg-track-space--first={first}
	class:rg-track-space--last={last}
	class:rg-track-space--has-landmark={Boolean(landmark)}
	class:rg-track-space--selected={selected}
	class:rg-track-space--available={available}
	style:--rg-track-space-color={trackColor(track)}
	style:--rg-track-space-step={space}
	bind:clientWidth={width}
	bind:clientHeight={height}
	onclick={clickHandler}
	onpointerenter={pointerenterHandler}
	onpointerleave={pointerleaveHandler}
	onfocus={focusHandler}
	onblur={blurHandler}>
	<i class="rg-track-space--shell"></i>
	<i class="rg-track-space--fill"></i>
	<svg
		class="rg-track-space--outline"
		aria-hidden="true"><path d={path} /></svg>
	<span class="rg-track-space--body">
		<span class="rg-track-space--name">{name}</span>
		{#if benefit.length}
			<span
				class="rg-track-space--benefit"
				aria-hidden="true">
				{#each benefit as glyph, index (index)}
					{@render symbol(glyph)}
				{/each}
			</span>
		{/if}
		{#if bonus}
			<span
				class="rg-track-space--bonus"
				aria-hidden="true">
				{#each bonus.pay as glyph, index (index)}
					{@render symbol(glyph)}
				{/each}
				<span class="rg-track-space--then">→</span>
				{#each bonus.gain as glyph, index (index)}
					{@render symbol(glyph)}
				{/each}
			</span>
		{/if}
		{#if landmark}
			<span class="rg-track-space--landmark">{landmark}</span>
		{/if}
	</span>
	<span
		class="rg-track-space--number"
		aria-hidden="true">{space}</span>
</button>

<style>
	/* The body is about square; the arrow tip reaches --track-tip past it and lies in the next space's inlet. */
	.rg-track-space {
		--rg-track-space-border: color-mix(
			in srgb,
			var(--rg-track-space-color) 65%,
			var(--line)
		);
		--rg-track-space-body: color-mix(
			in srgb,
			var(--rg-track-space-color) 14%,
			var(--raised)
		);
		position: relative;
		z-index: var(--rg-track-space-step);
		display: block;
		width: calc(100% + 1px);
		height: var(--rg-track-space-height, auto);
		margin-left: -1px;
		/* About square; a board with height to spare makes it taller through these two (TrackBoard, #59). */
		aspect-ratio: var(--rg-track-space-aspect, 1 / 1);
		/* Its contents shrink when it is short (below). */
		container-type: size;
		padding: 3px;
		border: 0;
		border-radius: var(--radius);
		background: var(--rg-track-space-body);
		color: var(--text);
		text-align: left;
		cursor: pointer;
		clip-path: polygon(
			0 0,
			100% 0,
			calc(100% + var(--track-tip)) 50%,
			100% 100%,
			0 100%,
			var(--track-tip) 50%
		);
	}

	.rg-track-space--first {
		width: 100%;
		margin-left: 0;
		clip-path: polygon(
			0 0,
			100% 0,
			calc(100% + var(--track-tip)) 50%,
			100% 100%,
			0 100%
		);
	}

	.rg-track-space--last {
		clip-path: polygon(
			0 0,
			100% 0,
			100% 100%,
			0 100%,
			var(--track-tip) 50%
		);
	}

	/* The finish line: a diagonally dashed right edge. */
	.rg-track-space--last::after {
		content: '';
		position: absolute;
		z-index: 3;
		top: 0;
		right: 0;
		bottom: 0;
		width: 3px;
		background: repeating-linear-gradient(
			135deg,
			color-mix(in srgb, var(--rg-track-space-color) 25%, var(--text)) 0
				4px,
			transparent 4px 8px
		);
	}

	.rg-track-space:hover,
	.rg-track-space:focus-visible {
		--rg-track-space-body: color-mix(
			in srgb,
			var(--rg-track-space-color) 24%,
			var(--raised)
		);
	}

	/* The clip-path would hide the usual focus ring, so focus draws a dashed outline instead (below). */
	.rg-track-space:focus-visible {
		z-index: 20;
		outline: none;
	}

	/* Above every other space, so the whole outline shows. */
	.rg-track-space--selected {
		z-index: 20;
	}

	.rg-track-space--shell {
		position: absolute;
		inset: 0 calc(-1 * var(--track-tip)) 0 0;
		background: var(--rg-track-space-border);
		clip-path: polygon(
			0 0,
			calc(100% - var(--track-tip)) 0,
			100% 50%,
			calc(100% - var(--track-tip)) 100%,
			0 100%,
			var(--track-tip) 50%
		);
	}

	.rg-track-space--first .rg-track-space--shell {
		clip-path: polygon(
			0 0,
			calc(100% - var(--track-tip)) 0,
			100% 50%,
			calc(100% - var(--track-tip)) 100%,
			0 100%
		);
	}

	.rg-track-space--last .rg-track-space--shell {
		right: 0;
		clip-path: polygon(
			0 0,
			100% 0,
			100% 100%,
			0 100%,
			var(--track-tip) 50%
		);
	}

	.rg-track-space--available .rg-track-space--shell {
		background: var(--ok);
	}

	.rg-track-space--selected .rg-track-space--shell {
		background: transparent;
	}

	.rg-track-space--fill {
		position: absolute;
		inset: 3px calc(3px - var(--track-tip)) 3px 3px;
		background: var(--rg-track-space-body);
		clip-path: polygon(
			0 0,
			calc(100% - var(--track-tip)) 0,
			100% 50%,
			calc(100% - var(--track-tip)) 100%,
			0 100%,
			var(--track-tip) 50%
		);
		transition: background var(--duration-fast) var(--ease);
	}

	.rg-track-space--first .rg-track-space--fill {
		clip-path: polygon(
			0 0,
			calc(100% - var(--track-tip)) 0,
			100% 50%,
			calc(100% - var(--track-tip)) 100%,
			0 100%
		);
	}

	.rg-track-space--last .rg-track-space--fill {
		right: 3px;
		clip-path: polygon(
			0 0,
			100% 0,
			100% 100%,
			0 100%,
			var(--track-tip) 50%
		);
	}

	/* A darker track-coloured bottom third under the landmark's name. */
	.rg-track-space--has-landmark .rg-track-space--fill::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(
			to bottom,
			transparent 60%,
			color-mix(in srgb, var(--rg-track-space-color) 30%, var(--ink)) 100%
		);
	}

	.rg-track-space--outline {
		position: absolute;
		z-index: 4;
		top: 0;
		left: 0;
		display: none;
		width: calc(100% + var(--track-tip));
		height: 100%;
		overflow: visible;
		pointer-events: none;
	}

	.rg-track-space--last .rg-track-space--outline {
		width: 100%;
	}

	.rg-track-space--selected .rg-track-space--outline,
	.rg-track-space:focus-visible .rg-track-space--outline {
		display: block;
	}

	.rg-track-space--outline path {
		fill: none;
		stroke: var(--gold);
		stroke-width: 3;
		stroke-linejoin: miter;
	}

	.rg-track-space:focus-visible:not(.rg-track-space--selected)
		.rg-track-space--outline
		path {
		stroke-dasharray: 5 3;
	}

	/* The name at the top, the benefit under it, the bonus box, then the landmark at the bottom (#59). The space's
	   clip-path keeps everything inside its arrow; a benefit too big for the space is cut off at its own edge. */
	.rg-track-space--body {
		position: absolute;
		z-index: 1;
		inset: 7px calc(var(--track-tip) - 3px) 7px var(--track-tip);
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		pointer-events: none;
	}

	/* The last space's number sits inside it, not in a tip. */
	.rg-track-space--last .rg-track-space--body {
		right: 20px;
	}

	.rg-track-space--last .rg-track-space--name {
		margin-right: -14px;
	}

	/* A long name, such as Nanotechnology, may run on to the space's right edge. */
	.rg-track-space--name {
		flex: none;
		display: block;
		margin-right: calc(3px - var(--track-tip));
		font: var(--weight-title) var(--font-size-3xs) / var(--leading-tight)
			var(--font-title);
		text-align: left;
	}

	.rg-track-space--benefit,
	.rg-track-space--bonus {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-1) 3px;
		min-width: 0;
	}

	.rg-track-space--benefit {
		flex: 1 1 auto;
		align-content: safe center;
		min-height: 0;
		overflow: hidden;
	}

	/* The bonus sits in a small box, as on the printed board: its price, an arrow, then what it gives. */
	.rg-track-space--bonus {
		flex: none;
		align-self: flex-start;
		max-width: 100%;
		padding: 1px 3px;
		border: var(--border) solid
			color-mix(in srgb, var(--rg-track-space-color) 55%, var(--line));
		background: color-mix(in srgb, var(--ink) 45%, transparent);
	}

	.rg-track-space--landmark {
		flex: none;
		margin-top: auto;
		color: var(--gold);
		font: var(--weight-title) var(--font-size-3xs) / var(--leading-tight)
			var(--font-title);
		text-align: left;
	}

	.rg-track-space--art {
		display: inline-flex;
		flex: none;
		align-items: flex-end;
	}

	.rg-track-space--art img,
	.rg-track-space--track {
		display: block;
		flex: none;
		object-fit: contain;
		image-rendering: pixelated;
	}

	.rg-track-space--resource img {
		width: 16px;
		height: 16px;
	}

	.rg-track-space--building img {
		width: 18px;
		height: 18px;
	}

	.rg-track-space--track {
		width: 14px;
		height: 14px;
	}

	.rg-track-space--count {
		margin-left: 1px;
		font: var(--weight-bold) var(--font-size-3xs) / var(--leading-none)
			var(--font-body);
	}

	/* The game symbols without art yet are short words (#5). */
	.rg-track-space--word,
	.rg-track-space--vp {
		padding: 1px 3px;
		border-radius: var(--radius);
		font: var(--weight-bold) var(--font-size-3xs) / var(--leading-tight)
			var(--font-body);
	}

	.rg-track-space--word {
		background: color-mix(in srgb, var(--ink) 50%, transparent);
		color: var(--text);
	}

	.rg-track-space--vp {
		border: var(--border) solid
			color-mix(in srgb, var(--gold) 60%, transparent);
		color: var(--gold);
		white-space: nowrap;
	}

	/* A benefit taken without its own benefit carries the board's red X. */
	.rg-track-space--crossed {
		position: relative;
		padding-right: 13px;
	}

	.rg-track-space--crossed::after {
		content: '';
		position: absolute;
		top: 50%;
		right: 3px;
		width: 8px;
		height: 8px;
		transform: translateY(-50%);
		background:
			linear-gradient(
				45deg,
				transparent 40%,
				var(--danger) 40% 60%,
				transparent 60%
			),
			linear-gradient(
				-45deg,
				transparent 40%,
				var(--danger) 40% 60%,
				transparent 60%
			);
	}

	.rg-track-space--joint,
	.rg-track-space--then {
		color: var(--muted);
		font: var(--weight-bold) var(--font-size-3xs) / var(--leading-none)
			var(--font-body);
	}

	.rg-track-space--or {
		font-style: italic;
		font-weight: var(--weight-regular);
	}

	/* A short space, on a short screen, draws its symbols smaller and its words tighter; its tooltip and label keep
	   the full words. */
	@container (max-height: 112px) {
		.rg-track-space--body {
			inset-block: 5px;
			gap: var(--space-1);
		}

		.rg-track-space--resource img,
		.rg-track-space--track {
			width: 12px;
			height: 12px;
		}

		.rg-track-space--building img {
			width: 14px;
			height: 14px;
		}

		.rg-track-space--word,
		.rg-track-space--vp {
			padding: 0 2px;
			line-height: var(--leading-none);
		}

		.rg-track-space--crossed {
			padding-right: 11px;
		}

		.rg-track-space--crossed::after {
			right: 2px;
			width: 7px;
			height: 7px;
		}

		.rg-track-space--bonus {
			padding: 0 2px;
		}
	}

	/* The small number sits in the arrow tip. */
	.rg-track-space--number {
		position: absolute;
		z-index: 2;
		top: 50%;
		right: calc(2px - var(--track-tip));
		width: 12px;
		transform: translateY(-50%);
		color: var(--muted);
		font: var(--weight-bold) var(--font-size-3xs) / var(--leading-none)
			var(--font-body);
		text-align: center;
	}

	.rg-track-space--last .rg-track-space--number {
		right: 7px;
	}
</style>
