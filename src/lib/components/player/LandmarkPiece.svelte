<!-- A landmark drawn in its footprint's shape: in the To be placed tray with its name, placed on the capital with its controls, or locked. -->
<script module>
	/** @typedef {'tray' | 'placed' | 'locked'} LandmarkPieceState */

	/** The size of one plot in the To be placed tray, in pixels; on the capital the piece fills the plots it covers. */
	export const TRAY_PLOT_SIZE = 29;

	/**
	 * Properties of the LandmarkPiece component itself.
	 * @typedef {Object} LandmarkPieceOwnProps
	 * @property {string} id - The landmark's slug, such as 'lighthouse'; also picks its picture
	 * @property {string} name - Its name, such as 'Lighthouse'
	 * @property {readonly string[]} footprint - Its footprint as printed, such as ['XX', 'XX']
	 * @property {number} [rotation=0] - Quarter turns clockwise, 0–3
	 * @property {LandmarkPieceState} [state='tray'] - tray: a box beside its name; placed: fills its plots, with rotate, confirm and return controls; locked: no controls
	 * @property {boolean} [selected=false] - Chosen for placing: a gold outline
	 * @property {boolean} [fresh=false] - Just locked: a green glow until the parent clears it
	 * @property {boolean} [dragging=false] - Being dragged: a green outline and a floating shadow
	 * @property {string} [color='var(--gold)'] - The outline colour on the capital, as a token reference; the Lighthouse uses 'var(--exploration)'
	 * @property {Function} [onLandmarkPieceSelect] - Callback fired with { id } when the piece is pressed, or Space (or Enter in the tray) is pressed on it
	 * @property {Function} [onLandmarkPieceMove] - Callback fired with { id, row, col } when an arrow key is pressed on it; row and col are -1, 0 or 1
	 * @property {Function} [onLandmarkPieceRotate] - Callback fired with { id } by the rotate control or the R key
	 * @property {Function} [onLandmarkPieceConfirm] - Callback fired with { id } by the confirm control or the Enter key
	 * @property {Function} [onLandmarkPieceReturn] - Callback fired with { id } by the return control or the Backspace and Delete keys
	 */

	/**
	 * Properties for the LandmarkPiece component, including any attributes for its root element.
	 * @typedef {LandmarkPieceOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} LandmarkPieceProps
	 *
	 * @example
	 * <LandmarkPiece
	 *   id="lighthouse"
	 *   name="Lighthouse"
	 *   footprint={FOOTPRINTS.lighthouse}
	 *   state="placed"
	 *   color="var(--exploration)"
	 *   onLandmarkPieceRotate={(event) => rotate(event.value.id)}
	 *   onLandmarkPieceConfirm={(event) => confirm(event.value.id)}
	 *   onLandmarkPieceReturn={(event) => putBack(event.value.id)}
	 * />
	 */
</script>

<script>
	import { ComponentEvent } from '../../component-event.js';
	import { rotateFootprint } from '../../capital.js';
	import { controlsAnchor, fillPath, outlinePath } from '../../placement.js';
	import { artUrl } from '../../ui.js';

	/** @type {LandmarkPieceProps} */
	let {
		id,
		name,
		footprint,
		rotation = 0,
		state = 'tray',
		selected = false,
		fresh = false,
		dragging = false,
		color = 'var(--gold)',
		onLandmarkPieceSelect,
		onLandmarkPieceMove,
		onLandmarkPieceRotate,
		onLandmarkPieceConfirm,
		onLandmarkPieceReturn,
		...attr
	} = $props();

	const uid = $props.id();

	/** Arrow keys as row and column steps. @type {Record<string, [number, number]>} */
	const ARROWS = {
		ArrowUp: [-1, 0],
		ArrowDown: [1, 0],
		ArrowLeft: [0, -1],
		ArrowRight: [0, 1],
	};

	let turns = $derived(((rotation % 4) + 4) % 4);
	let shape = $derived(rotateFootprint(footprint, turns));
	let rows = $derived(shape.length);
	let cols = $derived(shape[0].length);
	let plots = $derived(shape.join('').replaceAll('.', '').length);
	let fill = $derived(fillPath(shape));
	let anchor = $derived(controlsAnchor(shape));
	let controlsRight = $derived(
		`calc(${((cols - 1 - anchor.col) / cols) * 100}% + var(--space-1))`
	);
	let picture = $derived(
		`translate(${cols / 2} ${rows / 2}) rotate(${turns * 90}) translate(${-footprint[0].length / 2} ${-footprint.length / 2})`
	);
	let label = $derived(
		state === 'tray'
			? `${name}, ${plots} plots, to be placed`
			: state === 'placed'
				? `${name}, ${plots} plots, not confirmed. Arrow keys move it, R rotates it, Enter confirms it, Delete returns it`
				: `${name}, locked in place`
	);

	/**
	 * @param {MouseEvent} event
	 */
	const bodyClickHandler = (event) => {
		if (typeof onLandmarkPieceSelect === 'function') {
			const target = /** @type {HTMLElement} */ (event.currentTarget);
			onLandmarkPieceSelect(new ComponentEvent({ id }, target, event));
		}
	};

	/**
	 * @param {KeyboardEvent} event
	 */
	const bodyKeydownHandler = (event) => {
		if (event.altKey || event.ctrlKey || event.metaKey) {
			return;
		}
		const arrow = ARROWS[event.key];
		const target = /** @type {HTMLElement} */ (event.currentTarget);
		if (arrow) {
			event.preventDefault();
			if (typeof onLandmarkPieceMove === 'function') {
				onLandmarkPieceMove(
					new ComponentEvent(
						{ id, row: arrow[0], col: arrow[1] },
						target,
						event
					)
				);
			}
		} else if (
			event.key === ' ' ||
			(event.key === 'Enter' && state === 'tray')
		) {
			event.preventDefault();
			if (typeof onLandmarkPieceSelect === 'function') {
				onLandmarkPieceSelect(
					new ComponentEvent({ id }, target, event)
				);
			}
		} else if (state === 'placed' && event.key === 'Enter') {
			event.preventDefault();
			if (typeof onLandmarkPieceConfirm === 'function') {
				onLandmarkPieceConfirm(
					new ComponentEvent({ id }, target, event)
				);
			}
		} else if (
			state === 'placed' &&
			(event.key === 'r' || event.key === 'R')
		) {
			event.preventDefault();
			if (typeof onLandmarkPieceRotate === 'function') {
				onLandmarkPieceRotate(
					new ComponentEvent({ id }, target, event)
				);
			}
		} else if (
			state === 'placed' &&
			(event.key === 'Backspace' || event.key === 'Delete')
		) {
			event.preventDefault();
			if (typeof onLandmarkPieceReturn === 'function') {
				onLandmarkPieceReturn(
					new ComponentEvent({ id }, target, event)
				);
			}
		}
	};

	/**
	 * @param {MouseEvent} event
	 */
	const rotateClickHandler = (event) => {
		if (typeof onLandmarkPieceRotate === 'function') {
			const target = /** @type {HTMLButtonElement} */ (
				event.currentTarget
			);
			onLandmarkPieceRotate(new ComponentEvent({ id }, target, event));
		}
	};

	/**
	 * @param {MouseEvent} event
	 */
	const confirmClickHandler = (event) => {
		if (typeof onLandmarkPieceConfirm === 'function') {
			const target = /** @type {HTMLButtonElement} */ (
				event.currentTarget
			);
			onLandmarkPieceConfirm(new ComponentEvent({ id }, target, event));
		}
	};

	/**
	 * @param {MouseEvent} event
	 */
	const returnClickHandler = (event) => {
		if (typeof onLandmarkPieceReturn === 'function') {
			const target = /** @type {HTMLButtonElement} */ (
				event.currentTarget
			);
			onLandmarkPieceReturn(new ComponentEvent({ id }, target, event));
		}
	};
</script>

<div
	{...attr}
	class="rg-landmark-piece rg-landmark-piece--{state} {attr.class
		? attr.class
		: ''}"
	class:rg-landmark-piece--selected={selected}
	class:rg-landmark-piece--fresh={fresh && state === 'locked'}
	class:rg-landmark-piece--dragging={dragging}
	style:--rg-landmark-piece-color={color}>
	{#snippet content()}
		<svg
			class="rg-landmark-piece--shape"
			viewBox="0 0 {cols} {rows}"
			preserveAspectRatio="none"
			aria-hidden="true"
			style:width={state === 'tray'
				? `${cols * TRAY_PLOT_SIZE}px`
				: undefined}
			style:height={state === 'tray'
				? `${rows * TRAY_PLOT_SIZE}px`
				: undefined}>
			<defs>
				<clipPath id="{uid}-clip">
					<path d={fill} />
				</clipPath>
			</defs>
			<path
				class="rg-landmark-piece--fill"
				d={fill} />
			<image
				class="rg-landmark-piece--picture"
				href={artUrl(`landmark/${id}`)}
				width={footprint[0].length}
				height={footprint.length}
				preserveAspectRatio="none"
				transform={picture} />
			<path
				class="rg-landmark-piece--outline"
				d={outlinePath(shape)}
				clip-path="url(#{uid}-clip)"
				vector-effect="non-scaling-stroke" />
		</svg>
		{#if state === 'tray'}
			<span class="rg-landmark-piece--name">{name}</span>
		{/if}
	{/snippet}
	{#if state === 'locked'}
		<div
			class="rg-landmark-piece--body"
			role="img"
			aria-label={label}>
			{@render content()}
		</div>
	{:else}
		<div
			class="rg-landmark-piece--body"
			role="button"
			tabindex="0"
			aria-label={label}
			aria-pressed={state === 'tray' ? selected : undefined}
			onclick={bodyClickHandler}
			onkeydown={bodyKeydownHandler}>
			{@render content()}
		</div>
	{/if}
	{#if state === 'placed'}
		<div
			class="rg-landmark-piece--controls"
			style:right={controlsRight}>
			<button
				type="button"
				class="rg-landmark-piece--control"
				aria-label="Rotate {name}"
				title="Rotate (R)"
				onclick={rotateClickHandler}>↻</button>
			<button
				type="button"
				class="rg-landmark-piece--control"
				aria-label="Lock {name} in place"
				title="Confirm (Enter)"
				onclick={confirmClickHandler}>✓</button>
			<button
				type="button"
				class="rg-landmark-piece--control rg-landmark-piece--return"
				aria-label="Return {name} to be placed"
				title="Return (Delete)"
				onclick={returnClickHandler}>↓</button>
		</div>
	{/if}
</div>

<style>
	.rg-landmark-piece {
		--rg-landmark-piece-outline: transparent;
		--rg-landmark-piece-tint: color-mix(
			in srgb,
			var(--rg-landmark-piece-color) 25%,
			var(--raised)
		);
		position: relative;
		display: inline-flex;
		cursor: grab;
	}

	.rg-landmark-piece--placed,
	.rg-landmark-piece--locked {
		--rg-landmark-piece-outline: var(--rg-landmark-piece-color);
		--rg-landmark-piece-tint: color-mix(
			in srgb,
			var(--rg-landmark-piece-color) 68%,
			var(--raised)
		);
		display: block;
		width: 100%;
		height: 100%;
		pointer-events: none;
	}

	.rg-landmark-piece--locked {
		cursor: default;
	}

	.rg-landmark-piece--selected {
		--rg-landmark-piece-outline: var(--gold);
	}

	.rg-landmark-piece--selected .rg-landmark-piece--shape {
		filter: drop-shadow(
			0 0 var(--space-2) color-mix(in srgb, var(--gold) 53%, transparent)
		);
	}

	.rg-landmark-piece--fresh .rg-landmark-piece--shape {
		filter: drop-shadow(var(--glow-ok-strong));
	}

	.rg-landmark-piece--dragging {
		--rg-landmark-piece-outline: var(--ok);
		z-index: var(--layer-drag);
		cursor: grabbing;
	}

	.rg-landmark-piece--dragging .rg-landmark-piece--shape {
		filter: drop-shadow(var(--shadow-float));
	}

	.rg-landmark-piece--body {
		display: flex;
		align-items: center;
		gap: var(--space-4);
		border-radius: var(--radius);
	}

	.rg-landmark-piece--placed .rg-landmark-piece--body,
	.rg-landmark-piece--locked .rg-landmark-piece--body {
		position: absolute;
		inset: 0;
	}

	.rg-landmark-piece--shape {
		display: block;
		flex: none;
		overflow: visible;
		pointer-events: none;
		transition: filter var(--duration-fast) var(--ease);
	}

	.rg-landmark-piece--placed .rg-landmark-piece--shape,
	.rg-landmark-piece--locked .rg-landmark-piece--shape {
		width: 100%;
		height: 100%;
	}

	.rg-landmark-piece--fill {
		fill: var(--rg-landmark-piece-tint);
		pointer-events: auto;
	}

	.rg-landmark-piece--picture {
		image-rendering: pixelated;
		pointer-events: none;
	}

	.rg-landmark-piece--outline {
		fill: none;
		stroke: var(--rg-landmark-piece-outline);
		stroke-width: calc(var(--border-thick) * 2);
		stroke-linecap: square;
		pointer-events: none;
		transition: stroke var(--duration-fast) var(--ease);
	}

	.rg-landmark-piece--name {
		color: var(--text);
		font: var(--weight-title) var(--font-size-sm) / var(--leading-none)
			var(--font-title);
		letter-spacing: var(--letter-spacing-title);
		white-space: nowrap;
	}

	.rg-landmark-piece--controls {
		position: absolute;
		z-index: 2;
		top: var(--space-1);
		display: grid;
		gap: var(--space-1);
		pointer-events: auto;
	}

	/* 24px, the smallest target WCAG 2.2 allows without extra spacing. */
	.rg-landmark-piece--control {
		display: grid;
		place-items: center;
		width: 24px;
		height: 24px;
		padding: 0;
		border: var(--border) solid var(--ok);
		border-radius: var(--radius);
		background: color-mix(in srgb, var(--ok) 8%, var(--ink));
		color: var(--ok);
		font: var(--weight-bold) var(--font-size-sm) / var(--leading-none)
			var(--font-body);
		cursor: pointer;
		transition:
			background var(--duration-fast) var(--ease),
			color var(--duration-fast) var(--ease);
	}

	.rg-landmark-piece--control:hover,
	.rg-landmark-piece--control:focus-visible {
		background: var(--ok);
		color: var(--ink);
	}

	.rg-landmark-piece--return {
		border-color: color-mix(in srgb, var(--gold) 85%, var(--bronze));
		background: color-mix(in srgb, var(--gold) 10%, var(--ink));
		color: var(--gold);
	}

	.rg-landmark-piece--return:hover,
	.rg-landmark-piece--return:focus-visible {
		background: var(--gold);
		color: var(--ink);
	}
</style>
