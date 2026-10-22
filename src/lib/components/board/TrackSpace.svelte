<!-- One pointed space on an advancement track: its name, landmark and number, with hover and the gold selected outline. -->
<script module>
	/**
	 * Properties of the TrackSpace component itself.
	 * @typedef {Object} TrackSpaceOwnProps
	 * @property {import('../../ui.js').TrackId} track - The track, which sets the colours
	 * @property {number} space - The space number, 1–12; space 1 has a flat left edge, space 12 a square finish line
	 * @property {string} name - The space's name, such as 'Ships'
	 * @property {string} [landmark] - The landmark the first player here takes, such as 'Lighthouse'
	 * @property {boolean} [selected=false] - Draw the gold outline; sets aria-pressed
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
	 *   selected
	 *   onTrackSpaceClick={(event) => select(event.value)}
	 * />
	 */
</script>

<script>
	import { ComponentEvent } from '../../component-event.js';
	import { SPACE_COUNT, outlinePath } from '../../track-shape.js';
	import { trackColor } from '../../ui.js';

	/** @type {TrackSpaceProps} */
	let {
		track,
		space,
		name,
		landmark,
		selected = false,
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
		`${name}, ${track} space ${space}${landmark ? `, landmark ${landmark}` : ''}`
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

<button
	type="button"
	aria-pressed={selected}
	aria-label={label}
	{...attr}
	class="rg-track-space {attr.class ? attr.class : ''}"
	class:rg-track-space--first={first}
	class:rg-track-space--last={last}
	class:rg-track-space--has-landmark={Boolean(landmark)}
	class:rg-track-space--selected={selected}
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
	<span class="rg-track-space--name">{name}</span>
	{#if landmark}
		<span class="rg-track-space--landmark">{landmark}</span>
	{/if}
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
		margin-left: -1px;
		aspect-ratio: 1 / 1;
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

	.rg-track-space--name {
		position: absolute;
		z-index: 1;
		top: 7px;
		left: var(--track-tip);
		right: calc(var(--track-tip) - 3px);
		display: block;
		font: var(--weight-title) var(--font-size-3xs) / var(--leading-tight)
			var(--font-title);
		text-align: left;
	}

	.rg-track-space--landmark {
		position: absolute;
		z-index: 1;
		left: var(--track-tip);
		right: calc(var(--track-tip) - 3px);
		bottom: 7px;
		color: var(--gold);
		font: var(--weight-title) var(--font-size-3xs) / var(--leading-tight)
			var(--font-title);
		text-align: left;
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
