<!-- An A&A plot card's squares (#184): printed squares on card paper, the pieces on them, landmarks hanging off, and the squares a placement lights, as the capital's plots are lit. -->
<script module>
	/**
	 * Properties of the PlotCardGrid component itself.
	 * @typedef {Object} PlotCardGridOwnProps
	 * @property {import('../../area/placement-targets.js').PlotCardTarget} card - The card's squares, pieces, lit squares and room, from cardTargets() or heldPlotCard()
	 * @property {number} [plotSize=32] - One square's size in px
	 * @property {Function} [onPlotCardGridPick] - Callback fired with { row, col, index } when a lit square is pressed; without it, nothing is lit
	 */

	/**
	 * Properties for PlotCardGrid, including any attributes for its root element.
	 * @typedef {PlotCardGridOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} PlotCardGridProps
	 *
	 * @example
	 * <PlotCardGrid
	 *   card={target}
	 *   plotSize={32}
	 *   onPlotCardGridPick={(event) => pick(event.value.index)} />
	 */
</script>

<script>
	import LandmarkShape from './LandmarkShape.svelte';
	import { ComponentEvent } from '../../component-event.js';
	import { artUrl } from '../../ui.js';

	/** @type {PlotCardGridProps} */
	let { card, plotSize = 32, onPlotCardGridPick, ...attr } = $props();

	let picking = $derived(typeof onPlotCardGridPick === 'function');
	let rows = $derived(card.grid.length + card.room.top + card.room.bottom);
	let cols = $derived(card.grid[0].length + card.room.left + card.room.right);

	/**
	 * A square's top left in px, the room included.
	 * @param {number} row
	 * @param {number} col
	 */
	function at(row, col) {
		return `top: ${(row + card.room.top) * plotSize}px; left: ${(col + card.room.left) * plotSize}px;`;
	}

	/**
	 * A lit square was pressed.
	 * @param {import('../../area/placement-targets.js').PlotSquare} square
	 * @param {MouseEvent} event
	 */
	function pickHandler(square, event) {
		if (typeof onPlotCardGridPick !== 'function') {
			return;
		}
		onPlotCardGridPick(
			new ComponentEvent(
				{ row: square.row, col: square.col, index: square.index },
				/** @type {HTMLElement} */ (event.currentTarget),
				event
			)
		);
	}
</script>

<div
	{...attr}
	class="rg-plot-card-grid {attr.class ? attr.class : ''}"
	data-id="plot-card-{card.card}"
	style:--rg-plot-card-grid-plot="{plotSize}px"
	style:width="{cols * plotSize}px"
	style:height="{rows * plotSize}px">
	{#each card.squares as square (`${square.row},${square.col}`)}
		{#if picking && square.index !== null}
			<button
				type="button"
				class="rg-plot-card-grid--square rg-plot-card-grid--target"
				class:rg-plot-card-grid--chosen={square.chosen}
				data-id="plot-card-{card.card}-{square.row}-{square.col}"
				aria-pressed={square.chosen}
				style={at(square.row, square.col)}
				onclick={(event) => pickHandler(square, event)}>
				{@render contents(square)}
			</button>
		{:else}
			<span
				class="rg-plot-card-grid--square"
				data-id="plot-card-{card.card}-{square.row}-{square.col}"
				style={at(square.row, square.col)}>
				{@render contents(square)}
			</span>
		{/if}
	{/each}
	{#each card.landmarks as landmark (landmark.id)}
		<div
			class="rg-plot-card-grid--landmark"
			style={at(landmark.row, landmark.col)}>
			<LandmarkShape
				id={landmark.id}
				footprint={landmark.footprint}
				rotation={landmark.rotation}
				{plotSize} />
		</div>
	{/each}
	{#if card.placed}
		<div
			class="rg-plot-card-grid--landmark rg-plot-card-grid--placed"
			style={at(card.placed.row, card.placed.col)}>
			<LandmarkShape
				id={card.placed.id}
				footprint={card.placed.footprint}
				rotation={card.placed.rotation}
				{plotSize} />
		</div>
	{/if}
</div>

{#snippet contents(
	/** @type {import('../../area/placement-targets.js').PlotSquare} */ square
)}
	{#if square.printed}
		<img
			class="rg-plot-card-grid--printed"
			src={artUrl(square.printed)}
			alt="" />
	{/if}
	{#if square.building}
		<img
			class="rg-plot-card-grid--piece"
			src={artUrl(`building/${square.building}`)}
			alt="" />
	{:else if card.preview && card.preview.row === square.row && card.preview.col === square.col}
		<img
			class="rg-plot-card-grid--piece rg-plot-card-grid--preview"
			src={artUrl(`building/${card.preview.building}`)}
			alt="" />
	{/if}
{/snippet}

<style>
	.rg-plot-card-grid {
		position: relative;
		flex: none;
	}

	/* The card's paper, a card root for the dark cards (tokens.css); a lit square washes it green. */
	.rg-plot-card-grid--square {
		--rg-plot-card-grid-wash: 0%;
		position: absolute;
		display: grid;
		place-items: center;
		box-sizing: border-box;
		width: var(--rg-plot-card-grid-plot);
		height: var(--rg-plot-card-grid-plot);
		padding: 0;
		border: 1px solid color-mix(in srgb, var(--card-text) 45%, transparent);
		background: color-mix(
			in srgb,
			var(--ok) var(--rg-plot-card-grid-wash),
			var(--card-paper)
		);
		color: inherit;
		font: inherit;
	}

	.rg-plot-card-grid--printed {
		width: 45%;
		height: 45%;
		opacity: 0.55;
		image-rendering: pixelated;
	}

	.rg-plot-card-grid--piece {
		position: absolute;
		inset: 8%;
		width: 84%;
		height: 84%;
		image-rendering: pixelated;
	}

	.rg-plot-card-grid--preview {
		opacity: 0.6;
	}

	/* Lit as the capital's plots are: a green ring, with the wash and a dark inner edge so it reads on the light paper. */
	.rg-plot-card-grid--target {
		--rg-plot-card-grid-wash: 45%;
		cursor: pointer;
	}

	.rg-plot-card-grid--target::before {
		content: '';
		position: absolute;
		z-index: 1;
		inset: 0;
		border: 3px solid var(--ok);
		border-radius: var(--radius);
		box-shadow: inset 0 0 0 1px var(--card-text);
		pointer-events: none;
	}

	.rg-plot-card-grid--target:hover::before,
	.rg-plot-card-grid--target:focus-visible::before,
	.rg-plot-card-grid--chosen::before {
		box-shadow:
			inset 0 0 0 1px var(--card-text),
			var(--glow-ok-strong);
	}

	/* A landmark lies over the squares, which stay pressable under it. */
	.rg-plot-card-grid--landmark {
		position: absolute;
		z-index: 2;
		pointer-events: none;
	}

	.rg-plot-card-grid--placed {
		filter: drop-shadow(0 0 6px var(--ok));
	}
</style>
