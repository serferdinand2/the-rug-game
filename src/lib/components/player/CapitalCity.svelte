<!-- CapitalCity: a player's capital as Your area and the players overview draw it (#94): the title, the grid and the completion counters, which light the grid's groups. -->
<script module>
	/** @typedef {import('../../area/capital.js').CapitalView} CapitalView */
	/** @typedef {import('./CapitalGrid.svelte').CapitalGridPiece} CapitalGridPiece */
	/** @typedef {import('./CapitalGrid.svelte').CapitalGridTarget} CapitalGridTarget */
	/** @typedef {import('./CapitalGrid.svelte').CapitalGridPreview} CapitalGridPreview */
	/** @typedef {import('./CapitalGrid.svelte').CapitalGridPosition} CapitalGridPosition */

	/**
	 * Properties of the CapitalCity component itself.
	 * @typedef {Object} CapitalCityOwnProps
	 * @property {CapitalView} capital - The seat's capital, from `capitalView()`
	 * @property {string} owner - The title before the mat's name, such as 'Capital City' or the player's name
	 * @property {string} [label] - Names the grid for assistive technology; left out, CapitalGrid's own
	 * @property {CapitalGridPiece[]} [pieces] - The landmarks to draw, when they differ from the capital's own (a landmark being placed, a fresh one); left out, `capital.pieces`
	 * @property {CapitalGridPosition[] | null} [positions=null] - The engine's legal places for the landmark being placed, which it moves, turns and snaps among (#112)
	 * @property {CapitalGridTarget[]} [targets=[]] - Plots a decision can choose, lit on the grid
	 * @property {CapitalGridPreview | null} [preview=null] - The chosen building, drawn faintly on its plot
	 * @property {CapitalGridTarget[]} [fresh=[]] - Plots just built on, which glow once
	 * @property {boolean} [awaitingPlacement=false] - Something is waiting to be placed: the grid's green outline
	 * @property {Function} [onCapitalCityPlotClick] - CapitalGrid's onCapitalGridPlotClick: { row, col }
	 * @property {Function} [onCapitalCityDrop] - CapitalGrid's onCapitalGridDrop: { id, row, col }
	 * @property {Function} [onCapitalCityMove] - CapitalGrid's onCapitalGridMove: { id, row, col }
	 * @property {Function} [onCapitalCityRotate] - CapitalGrid's onCapitalGridRotate: { id, rotation, row, col }
	 * @property {Function} [onCapitalCityConfirm] - CapitalGrid's onCapitalGridConfirm: { id }
	 * @property {Function} [onCapitalCityReturn] - CapitalGrid's onCapitalGridReturn: { id }
	 * @property {Function} [onCapitalCityDragStart] - CapitalGrid's onCapitalGridDragStart: { id }
	 * @property {Function} [onCapitalCityDragEnd] - CapitalGrid's onCapitalGridDragEnd: { id }
	 */

	/**
	 * Properties for the CapitalCity component, including any attributes for its root element. Its root is
	 * `display: contents`, so the title, grid and counters lay out in the place they are drawn; the title's space below
	 * comes from `--rg-capital-city-title-gap` (`--space-6` by default), which a grid that spaces its items sets to 0.
	 * @typedef {CapitalCityOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} CapitalCityProps
	 *
	 * @example
	 * <CapitalCity
	 *   capital={capitalView(seat, code)}
	 *   owner="Capital City"
	 *   targets={plotTargets(options)}
	 *   onCapitalCityPlotClick={(event) => place(event.value)}
	 * />
	 */
</script>

<script>
	import CapitalGrid from './CapitalGrid.svelte';
	import CompletionCounters from './CompletionCounters.svelte';
	import { ComponentEvent } from '../../component-event.js';
	/** @typedef {import('../../capital.js').GroupKind} GroupKind */

	/** @type {CapitalCityProps} */
	let {
		capital,
		owner,
		label,
		pieces,
		positions = null,
		targets = [],
		preview = null,
		fresh = [],
		awaitingPlacement = false,
		onCapitalCityPlotClick,
		onCapitalCityDrop,
		onCapitalCityMove,
		onCapitalCityRotate,
		onCapitalCityConfirm,
		onCapitalCityReturn,
		onCapitalCityDragStart,
		onCapitalCityDragEnd,
		...attr
	} = $props();

	/** The counter hovered or pressed, whose groups the grid lights. @type {GroupKind | null} */
	let highlight = $state(null);

	/**
	 * A counter was hovered or focused, or left: its groups show while it is.
	 * @param {ComponentEvent} event - From CompletionCounters: a kind, or null
	 */
	const countersHoverHandler = (event) => {
		highlight = event.value;
	};

	/**
	 * A counter was pressed: its groups stay shown, or go when it is pressed again.
	 * @param {ComponentEvent} event - From CompletionCounters: a kind
	 */
	const countersToggleHandler = (event) => {
		highlight = highlight === event.value ? null : event.value;
	};

	/**
	 * A lit plot or a plot for the landmark was clicked: { row, col }; passed on as the grid gave it.
	 * @param {ComponentEvent} event - From CapitalGrid
	 */
	const plotClickHandler = (event) => {
		if (typeof onCapitalCityPlotClick === 'function') {
			onCapitalCityPlotClick(
				new ComponentEvent(
					event.value,
					event.target,
					event.originalEvent
				)
			);
		}
	};

	/**
	 * A landmark from the tray was dropped: { id, row, col }; passed on as the grid gave it.
	 * @param {ComponentEvent} event - From CapitalGrid
	 */
	const dropHandler = (event) => {
		if (typeof onCapitalCityDrop === 'function') {
			onCapitalCityDrop(
				new ComponentEvent(
					event.value,
					event.target,
					event.originalEvent
				)
			);
		}
	};

	/**
	 * A placed landmark was dragged or moved by key: { id, row, col }; passed on as the grid gave it.
	 * @param {ComponentEvent} event - From CapitalGrid
	 */
	const moveHandler = (event) => {
		if (typeof onCapitalCityMove === 'function') {
			onCapitalCityMove(
				new ComponentEvent(
					event.value,
					event.target,
					event.originalEvent
				)
			);
		}
	};

	/**
	 * A placed landmark was turned: { id, rotation, row, col }; passed on as the grid gave it.
	 * @param {ComponentEvent} event - From CapitalGrid
	 */
	const rotateHandler = (event) => {
		if (typeof onCapitalCityRotate === 'function') {
			onCapitalCityRotate(
				new ComponentEvent(
					event.value,
					event.target,
					event.originalEvent
				)
			);
		}
	};

	/**
	 * A placed landmark's confirm was pressed: { id }; passed on as the grid gave it.
	 * @param {ComponentEvent} event - From CapitalGrid
	 */
	const confirmHandler = (event) => {
		if (typeof onCapitalCityConfirm === 'function') {
			onCapitalCityConfirm(
				new ComponentEvent(
					event.value,
					event.target,
					event.originalEvent
				)
			);
		}
	};

	/**
	 * A placed landmark goes back to the tray: { id }; passed on as the grid gave it.
	 * @param {ComponentEvent} event - From CapitalGrid
	 */
	const returnHandler = (event) => {
		if (typeof onCapitalCityReturn === 'function') {
			onCapitalCityReturn(
				new ComponentEvent(
					event.value,
					event.target,
					event.originalEvent
				)
			);
		}
	};

	/**
	 * A placed landmark started being dragged: { id }; passed on as the grid gave it.
	 * @param {ComponentEvent} event - From CapitalGrid
	 */
	const dragStartHandler = (event) => {
		if (typeof onCapitalCityDragStart === 'function') {
			onCapitalCityDragStart(
				new ComponentEvent(
					event.value,
					event.target,
					event.originalEvent
				)
			);
		}
	};

	/**
	 * That drag ended: { id }; passed on as the grid gave it.
	 * @param {ComponentEvent} event - From CapitalGrid
	 */
	const dragEndHandler = (event) => {
		if (typeof onCapitalCityDragEnd === 'function') {
			onCapitalCityDragEnd(
				new ComponentEvent(
					event.value,
					event.target,
					event.originalEvent
				)
			);
		}
	};
</script>

<div
	{...attr}
	class="rg-capital-city {attr.class ? attr.class : ''}">
	<h2 class="rg-capital-city--title">
		{owner} · <span class="rg-capital-city--name">{capital.name}</span>
	</h2>
	<CapitalGrid
		plots={capital.plots}
		biome={capital.biome}
		terrainSeed={capital.terrainSeed}
		pieces={pieces ?? capital.pieces}
		{positions}
		{highlight}
		{targets}
		{preview}
		{fresh}
		{awaitingPlacement}
		room
		{label}
		onCapitalGridPlotClick={plotClickHandler}
		onCapitalGridDrop={dropHandler}
		onCapitalGridMove={moveHandler}
		onCapitalGridRotate={rotateHandler}
		onCapitalGridConfirm={confirmHandler}
		onCapitalGridReturn={returnHandler}
		onCapitalGridDragStart={dragStartHandler}
		onCapitalGridDragEnd={dragEndHandler} />
	<CompletionCounters
		counts={capital.counts}
		active={highlight}
		onCompletionCountersHover={countersHoverHandler}
		onCompletionCountersToggle={countersToggleHandler} />
</div>

<style>
	/* The title, grid and counters are items of whatever lays the capital out: Your area's tab flows them, the overview's detail grids them. */
	.rg-capital-city {
		display: contents;
	}

	.rg-capital-city--title {
		margin: 0 0 var(--rg-capital-city-title-gap, var(--space-6));
		color: var(--text);
		font: var(--weight-bold) var(--font-size-xl) / var(--leading-tight)
			var(--font-body);
	}

	.rg-capital-city--name {
		color: var(--gold);
		font-family: var(--font-title);
		font-weight: var(--weight-title);
	}
</style>
