<!-- The Capital tab's placement choices, capital grid and landmark tray. -->
<script module>
	/** @typedef {import('../../lib/area/capital.js').CapitalView} CapitalView */
	/** @typedef {import('../../lib/area/placement-targets.js').FreshCapital} FreshCapital */
	/** @typedef {import('../../lib/area/placement-targets.js').PlacementPrompt} PlacementPrompt */

	/**
	 * Properties of the CapitalTab screen part itself.
	 * @typedef {Object} CapitalTabOwnProps
	 * @property {CapitalView | null} capital - The capital as drawn in the player area
	 * @property {string} capitalSoon - The unavailable-capital note
	 * @property {PlacementPrompt | null} [placement=null] - A building or landmark placement decision
	 * @property {FreshCapital} [fresh] - The plots and landmarks just built
	 * @property {Function} [onCapitalTabPlace] - Callback fired with { index, confirm } when the placement changes
	 */

	/**
	 * Properties for CapitalTab, including any attributes for its root element.
	 * @typedef {CapitalTabOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} CapitalTabProps
	 *
	 * @example
	 * <CapitalTab
	 *   {capital}
	 *   capitalSoon="Capital City is not available yet."
	 *   placement={{ piece: { landmark: 'lighthouse' }, options, picked }}
	 *   onCapitalTabPlace={(event) => select(event.value.index)} />
	 */
</script>

<script>
	import { ComponentEvent } from '../../lib/component-event.js';
	import { GRID_SIZE } from '../../lib/capital.js';
	import {
		capitalPlacement,
		centredCorner,
		landingIndex,
		optionAt,
		placeNear,
	} from '../../lib/area/placement-targets.js';
	import CapitalCity from '../../lib/components/player/CapitalCity.svelte';
	import PlacementTray from '../../lib/components/player/PlacementTray.svelte';

	/** @type {CapitalTabProps} */
	let {
		capital,
		capitalSoon,
		placement = null,
		fresh = { plots: [], landmarks: [] },
		onCapitalTabPlace,
		...attr
	} = $props();

	let values = $derived(capitalPlacement(capital, placement, fresh));
	/** A placed landmark is being dragged, so the tray offers itself to take it back. */
	let dragging = $state(false);

	/**
	 * A lit plot was chosen for a building, or a plot for the landmark.
	 * @param {ComponentEvent} event
	 */
	const plotClickHandler = (event) => {
		const { row, col } = event.value;
		if (values.building) {
			const target = values.targets.find(
				(plot) => plot.row === row && plot.col === col
			);
			if (target) {
				place(target.index, false, event);
			}
		} else if (values.landmark) {
			land(
				landingIndex(
					placement?.options ?? [],
					values.landmark,
					{ row, col },
					values.placed
				),
				event
			);
		}
	};

	/**
	 * The landmark was chosen in the tray, by pointer or key: it goes near the capital's middle.
	 * @param {ComponentEvent} event
	 */
	const trayChooseHandler = (event) => {
		if (!values.landmark) {
			return;
		}
		const middle = Math.floor(GRID_SIZE / 2);
		const at = centredCorner(values.landmark.footprint, 0, middle, middle);
		land(placeNear(placement?.options ?? [], at.row, at.col, 0), event);
	};

	/**
	 * The landmark was dropped from the tray; row and col are its unsnapped top-left corner.
	 * @param {ComponentEvent} event
	 */
	const dropHandler = (event) => {
		land(
			placeNear(
				placement?.options ?? [],
				event.value.row,
				event.value.col,
				0
			),
			event
		);
	};

	/**
	 * The placed landmark was dragged or moved with the arrow keys, onto one of the legal positions.
	 * @param {ComponentEvent} event
	 */
	const moveHandler = (event) => {
		if (values.placed) {
			land(
				optionAt(placement?.options ?? [], {
					row: event.value.row,
					col: event.value.col,
					rotation: values.placed.rotation,
				}),
				event
			);
		}
	};

	/**
	 * The placed landmark was turned to its next legal turn among the positions.
	 * @param {ComponentEvent} event
	 */
	const rotateHandler = (event) => {
		if (values.placed) {
			land(
				optionAt(placement?.options ?? [], {
					row: event.value.row,
					col: event.value.col,
					rotation: event.value.rotation,
				}),
				event
			);
		}
	};

	/**
	 * @param {ComponentEvent} event
	 */
	const confirmHandler = (event) => {
		if (
			values.placed &&
			placement?.picked !== null &&
			placement?.picked !== undefined
		) {
			place(placement.picked, true, event);
		}
	};

	/**
	 * The placed landmark went back to the tray, by its control, a key or a drop on the tray.
	 * @param {ComponentEvent} event
	 */
	const returnHandler = (event) => {
		dragging = false;
		place(null, false, event);
	};

	/**
	 * Moves the landmark to a legal place, unless it is already there.
	 * @param {number | null} index - The option it lands on; null when there is none
	 * @param {ComponentEvent} event
	 */
	function land(index, event) {
		if (index !== null && index !== placement?.picked) {
			place(index, false, event);
		}
	}

	/**
	 * Tells the screen which place is chosen.
	 * @param {number | null} index - The option's index; null when the landmark went back to the tray
	 * @param {boolean} confirm - The landmark's confirm control was pressed
	 * @param {ComponentEvent} event - The event that caused it
	 */
	function place(index, confirm, event) {
		if (typeof onCapitalTabPlace === 'function') {
			onCapitalTabPlace(
				new ComponentEvent(
					{ index, confirm },
					event.target,
					event.originalEvent
				)
			);
		}
	}
</script>

<div
	{...attr}
	class="rg-capital-tab {attr.class ? attr.class : ''}">
	{#if capital}
		<CapitalCity
			{capital}
			owner="Capital City"
			pieces={values.pieces}
			positions={values.positions}
			targets={values.targets}
			preview={values.preview}
			fresh={fresh.plots}
			awaitingPlacement={placement !== null}
			onCapitalCityPlotClick={plotClickHandler}
			onCapitalCityDrop={dropHandler}
			onCapitalCityMove={moveHandler}
			onCapitalCityRotate={rotateHandler}
			onCapitalCityConfirm={confirmHandler}
			onCapitalCityReturn={returnHandler}
			onCapitalCityDragStart={() => (dragging = true)}
			onCapitalCityDragEnd={() => (dragging = false)} />
		<PlacementTray
			class="rg-player-tabs--tray"
			items={values.tray}
			returnTarget={dragging && values.placed !== null}
			onPlacementTraySelect={trayChooseHandler}
			onPlacementTrayPlace={trayChooseHandler}
			onPlacementTrayReturn={returnHandler} />
		{#if capital.besideMat.length}
			<p class="rg-player-tabs--note">
				Beside the mat: {capital.besideMat.join(', ')}
			</p>
		{/if}
	{:else}
		<p class="rg-player-tabs--note">{capitalSoon}</p>
	{/if}
</div>

<style>
	.rg-capital-tab {
		display: contents;
	}

	.rg-capital-tab :global(.rg-player-tabs--tray) {
		margin-top: var(--space-6);
	}
</style>
