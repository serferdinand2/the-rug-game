<!-- The To be placed tray under the capital: landmarks waiting to be placed, to select, drag onto the grid or move there with the arrow keys. -->
<script module>
	/**
	 * A landmark waiting to be placed.
	 * @typedef {Object} PlacementTrayItem
	 * @property {string} id - The landmark's slug, such as 'lighthouse'
	 * @property {string} name - Its name, such as 'Lighthouse'
	 * @property {readonly string[]} footprint - Its footprint as printed
	 * @property {number} [rotation=0] - Quarter turns clockwise, 0–3
	 * @property {string} [color] - Its outline colour, as a token reference
	 */

	/**
	 * Properties of the PlacementTray component itself.
	 * @typedef {Object} PlacementTrayOwnProps
	 * @property {PlacementTrayItem[]} [items=[]] - The landmarks to place; with none, the tray is not shown
	 * @property {string | null} [selectedId=null] - The item chosen for click-to-place: a gold outline
	 * @property {boolean} [returnTarget=false] - A placed piece is being dragged: the tray shows, outlined green, to take it back
	 * @property {Function} [onPlacementTraySelect] - Callback fired with { id } when an item is pressed, or Enter or Space is pressed on it
	 * @property {Function} [onPlacementTrayPlace] - Callback fired with { id } when an arrow key is pressed on an item: the keyboard way onto the grid
	 * @property {Function} [onPlacementTrayReturn] - Callback fired with { id } when a placed piece is dropped on the tray
	 */

	/**
	 * Properties for the PlacementTray component, including any attributes for its root element.
	 * @typedef {PlacementTrayOwnProps & import('svelte/elements').HTMLAttributes<HTMLElement>} PlacementTrayProps
	 *
	 * @example
	 * <PlacementTray
	 *   items={[{ id: 'lighthouse', name: 'Lighthouse', footprint: FOOTPRINTS.lighthouse, color: 'var(--exploration)' }]}
	 *   {selectedId}
	 *   returnTarget={dragging}
	 *   onPlacementTraySelect={(event) => (selectedId = event.value.id)}
	 *   onPlacementTrayReturn={(event) => putBack(event.value.id)}
	 * />
	 */
</script>

<script>
	import { tick } from 'svelte';
	import LandmarkPiece from './LandmarkPiece.svelte';
	import { ComponentEvent } from '../../component-event.js';

	/** @type {PlacementTrayProps} */
	let {
		items = [],
		selectedId = null,
		returnTarget = false,
		onPlacementTraySelect,
		onPlacementTrayPlace,
		onPlacementTrayReturn,
		...attr
	} = $props();

	/** The items seen so far, so one that comes back can take the focus; null before the first render. @type {Set<string> | null} */
	let seen = null;
	/** Each item's piece by its id, to focus one that comes back. @type {Record<string, { focus: () => void } | null>} */
	const drawn = {};

	/** The item being dragged out of the tray. @type {string | null} */
	let draggingId = $state(null);

	let shown = $derived(items.length > 0 || returnTarget);

	$effect(() => {
		const ids = items.map((item) => item.id);
		const added = ids.find((id) => !seen?.has(id));
		const firstRender = seen === null;
		seen = new Set(ids);
		if (draggingId && !ids.includes(draggingId)) {
			// An item placed on its drop can leave the tray before its dragend arrives.
			draggingId = null;
		}
		if (!firstRender && added) {
			// After tick, so the new piece's binding is set.
			tick().then(() => {
				const focused = document.activeElement;
				if (!focused || focused === document.body) {
					drawn[added]?.focus();
				}
			});
		}
	});

	/**
	 * @param {ComponentEvent} event - From LandmarkPiece: { id }
	 */
	const itemSelectHandler = (event) => {
		if (typeof onPlacementTraySelect === 'function') {
			onPlacementTraySelect(
				new ComponentEvent(
					{ id: event.value.id },
					event.target,
					event.originalEvent
				)
			);
		}
	};

	/**
	 * @param {ComponentEvent} event - From LandmarkPiece: { id, row, col }
	 */
	const itemMoveHandler = (event) => {
		if (typeof onPlacementTrayPlace === 'function') {
			onPlacementTrayPlace(
				new ComponentEvent(
					{ id: event.value.id },
					event.target,
					event.originalEvent
				)
			);
		}
	};

	/**
	 * @param {ComponentEvent} event - From LandmarkPiece: { id, grab }
	 */
	const itemDragStartHandler = (event) => {
		draggingId = event.value.id;
	};

	const itemDragEndHandler = () => {
		draggingId = null;
	};

	/**
	 * @param {DragEvent} event
	 */
	const dragoverHandler = (event) => {
		if (
			!returnTarget ||
			!event.dataTransfer?.types.includes('text/plain')
		) {
			return;
		}
		event.preventDefault();
		event.dataTransfer.dropEffect = 'move';
	};

	/**
	 * @param {DragEvent} event
	 */
	const dropHandler = (event) => {
		const id = event.dataTransfer?.getData('text/plain');
		if (!returnTarget || !id || items.some((item) => item.id === id)) {
			return;
		}
		event.preventDefault();
		if (typeof onPlacementTrayReturn === 'function') {
			const target = /** @type {HTMLElement} */ (event.currentTarget);
			onPlacementTrayReturn(new ComponentEvent({ id }, target, event));
		}
	};
</script>

{#if shown}
	<section
		aria-label="To be placed"
		{...attr}
		class="rg-placement-tray {attr.class ? attr.class : ''}"
		class:rg-placement-tray--return-target={returnTarget}
		ondragover={dragoverHandler}
		ondrop={dropHandler}>
		<h3 class="rg-placement-tray--heading">To be placed</h3>
		<ul class="rg-placement-tray--items">
			{#each items as item (item.id)}
				<li>
					<LandmarkPiece
						bind:this={drawn[item.id]}
						id={item.id}
						name={item.name}
						footprint={item.footprint}
						rotation={item.rotation ?? 0}
						color={item.color}
						state="tray"
						selected={selectedId === item.id}
						dragging={draggingId === item.id}
						onLandmarkPieceDragStart={itemDragStartHandler}
						onLandmarkPieceDragEnd={itemDragEndHandler}
						onLandmarkPieceSelect={itemSelectHandler}
						onLandmarkPieceMove={itemMoveHandler} />
				</li>
			{/each}
		</ul>
	</section>
{/if}

<style>
	.rg-placement-tray {
		padding: var(--space-5);
		border: var(--border) solid var(--gold);
		border-radius: var(--radius);
		box-shadow:
			0 0 0 1px color-mix(in srgb, var(--gold) 20%, transparent),
			0 0 12px color-mix(in srgb, var(--gold) 13%, transparent);
		transition:
			border-color var(--duration-fast) var(--ease),
			box-shadow var(--duration-fast) var(--ease);
	}

	.rg-placement-tray--return-target {
		min-height: 102px;
		border-color: var(--ok);
		box-shadow: var(--glow-ok);
	}

	.rg-placement-tray--heading {
		margin: 0 0 var(--space-4);
		color: var(--muted);
		font: var(--weight-bold) var(--font-size-sm) / var(--leading-none)
			var(--font-body);
	}

	.rg-placement-tray--items {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-6) var(--space-10);
		margin: 0;
		padding: 0;
		list-style: none;
	}
</style>
