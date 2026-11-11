<!-- The Capital tab's placement choices, capital grid and landmark tray, and under them A&A's cards and mats that may take the piece (#184). -->
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
	 * @property {Function} [onCapitalTabInspect] - Callback fired with { kind, id } when a card that may take the piece is hovered or focused, and with null on leave, for CardPreview (#184)
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
	import PlotCardGrid from '../../lib/components/player/PlotCardGrid.svelte';
	import ScaledCard from '../../lib/components/player/ScaledCard.svelte';
	import TapestryCard from '../../lib/components/player/TapestryCard.svelte';
	import TechnologyCard from '../../lib/components/player/TechnologyCard.svelte';
	import {
		cardTargets,
		plotLanding,
	} from '../../lib/area/placement-targets.js';
	import {
		tapestryCardData,
		techCardData,
	} from '../../lib/cards/game-cards.js';
	import { CARD_SIZES } from '../../lib/cards/card-sizes.js';
	import { artUrl } from '../../lib/ui.js';

	/** @type {CapitalTabProps} */
	let {
		capital,
		capitalSoon,
		placement = null,
		fresh = { plots: [], landmarks: [] },
		onCapitalTabPlace,
		onCapitalTabInspect,
		...attr
	} = $props();

	/** Each tray landmark's quarter turns, set by the tray's turn buttons, which it keeps when placed (#174). */
	let turns = $state(/** @type {Record<string, number>} */ ({}));

	let values = $derived(capitalPlacement(capital, placement, fresh));
	let tray = $derived(
		values.tray.map((item) => ({ ...item, rotation: turns[item.id] ?? 0 }))
	);
	let trayTurn = $derived(
		values.landmark ? (turns[values.landmark.id] ?? 0) : 0
	);
	/** A placed landmark is being dragged, so the tray offers itself to take it back. */
	let dragging = $state(false);
	/** A&A's cards and mats under the capital that may take the piece (#184). */
	let cards = $derived(cardTargets(placement));

	/**
	 * A lit square of a plot card was pressed: a building goes on it; the landmark goes to the offered place covering it,
	 * at the tray's turn when one is, nearest to where it lies on that card (#184).
	 * @param {import('../../lib/area/placement-targets.js').PlotCardTarget} card
	 * @param {ComponentEvent} event - { row, col, index }
	 */
	const squarePickHandler = (card, event) => {
		if (!values.landmark) {
			land(event.value.index, event);
			return;
		}
		land(
			plotLanding(
				placement?.options ?? [],
				card.card,
				{ row: event.value.row, col: event.value.col },
				trayTurn,
				card.placed
					? { row: card.placed.row, col: card.placed.col }
					: null,
				values.landmark.id
			),
			event
		);
	};

	/**
	 * A card or mat that holds the piece whole was pressed (#184).
	 * @param {import('../../lib/area/placement-targets.js').HolderTarget} holder
	 * @param {MouseEvent} event
	 */
	const holderPickHandler = (holder, event) => {
		place(
			holder.index,
			false,
			new ComponentEvent(
				holder,
				/** @type {HTMLElement} */ (event.currentTarget),
				event
			)
		);
	};

	/**
	 * Shows a card that may take the piece in full while it is hovered or focused, or nothing (#184).
	 * @param {import('../../lib/area/placement-targets.js').HolderTarget | null} holder
	 * @param {Event} event
	 */
	function inspect(holder, event) {
		if (typeof onCapitalTabInspect !== 'function') {
			return;
		}
		onCapitalTabInspect(
			new ComponentEvent(
				holder && holder.kind !== 'civ'
					? { kind: holder.kind, id: holder.id }
					: null,
				/** @type {HTMLElement} */ (event.currentTarget),
				event
			)
		);
	}

	/**
	 * A lit plot was chosen for a building or an Architects cube, Cloud City's building to move (#36), or a plot for the
	 * landmark.
	 * @param {ComponentEvent} event
	 */
	const plotClickHandler = (event) => {
		const { row, col } = event.value;
		if (
			values.building ||
			values.cube ||
			values.move ||
			values.token !== null
		) {
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
		// The middle plot of the mat, whatever its shape (#36).
		const at = centredCorner(
			values.landmark.footprint,
			trayTurn,
			Math.floor((capital?.shape.rows ?? GRID_SIZE) / 2),
			Math.floor((capital?.shape.cols ?? GRID_SIZE) / 2)
		);
		land(
			placeNear(placement?.options ?? [], at.row, at.col, trayTurn),
			event
		);
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
				trayTurn
			),
			event
		);
	};

	/**
	 * A tray landmark's turn button was pressed: it turns a quarter, and lands at that turn when placed.
	 * @param {ComponentEvent} event - { id, step }
	 */
	const trayTurnHandler = (event) => {
		const { id, step } = event.value;
		turns = { ...turns, [id]: ((turns[id] ?? 0) + step + 4) % 4 };
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

<!-- A&A's cards and mats under the capital that may take the piece (#184): in the tray's box under a rule while a landmark waits there, so the column still fits; in a titled box of their own otherwise. -->
{#snippet onCards()}
	{#if !tray.length}
		<h3 class="rg-capital-tab--cards-title">Or on a card</h3>
	{/if}
	<div class="rg-capital-tab--cards-row">
		{#each cards.plots as card (card.card)}
			<figure class="rg-capital-tab--card">
				<PlotCardGrid
					{card}
					plotSize={tray.length ? 20 : 30}
					onPlotCardGridPick={onCapitalTabPlace
						? (/** @type {ComponentEvent} */ event) =>
								squarePickHandler(card, event)
						: undefined} />
				<figcaption class="rg-capital-tab--name">
					{card.name}
				</figcaption>
			</figure>
		{/each}
		{#each cards.holders as holder (holder.index)}
			<button
				type="button"
				class="rg-capital-tab--holder"
				class:rg-capital-tab--holder-civ={holder.kind === 'civ'}
				data-id="capital-tab-holder-{holder.id}"
				aria-pressed={holder.picked}
				disabled={!onCapitalTabPlace}
				onclick={(event) => holderPickHandler(holder, event)}
				onmouseenter={(event) => inspect(holder, event)}
				onfocus={(event) => inspect(holder, event)}
				onmouseleave={(event) => inspect(null, event)}
				onblur={(event) => inspect(null, event)}>
				<span class="rg-capital-tab--face">
					{#if holder.kind === 'tapestry'}
						<ScaledCard
							scale={0.2}
							{...CARD_SIZES.tapestry}>
							<TapestryCard data={tapestryCardData(holder.id)} />
						</ScaledCard>
					{:else if holder.kind === 'tech'}
						<ScaledCard
							scale={0.26}
							{...CARD_SIZES.tech}>
							<TechnologyCard data={techCardData(holder.id)} />
						</ScaledCard>
					{:else}
						<img
							class="rg-capital-tab--portrait"
							src={artUrl(`civ/${holder.id}`)}
							alt="" />
					{/if}
				</span>
				<span class="rg-capital-tab--name">
					{holder.kind === 'civ' ? holder.label : holder.name}
				</span>
			</button>
		{/each}
	</div>
{/snippet}

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
			items={tray}
			children={cards.plots.length || cards.holders.length
				? onCards
				: undefined}
			returnTarget={dragging && values.placed !== null}
			onPlacementTraySelect={trayChooseHandler}
			onPlacementTrayPlace={trayChooseHandler}
			onPlacementTrayReturn={returnHandler}
			onPlacementTrayTurn={onCapitalTabPlace
				? trayTurnHandler
				: undefined} />
		{#if cards.plots.length || cards.holders.length}
			{#if !tray.length}
				<section
					class="rg-capital-tab--cards"
					data-id="capital-tab-cards">
					{@render onCards()}
				</section>
			{/if}
		{/if}
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

	/* A&A's cards and mats under the capital (issue 184): the owner's look B. */
	.rg-capital-tab--cards {
		margin-top: var(--space-6);
		padding: var(--space-5) var(--space-6);
		border: var(--border) solid var(--line-soft);
		background: var(--surface);
	}

	.rg-capital-tab--cards-title {
		margin: 0 0 var(--space-2);
		color: var(--text);
		font-size: var(--font-size-sm);
		font-weight: var(--weight-bold);
	}

	.rg-capital-tab--cards-row {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		gap: var(--space-6);
	}

	.rg-capital-tab--card {
		display: grid;
		justify-items: center;
		gap: var(--space-1);
		margin: 0;
	}

	.rg-capital-tab--name {
		color: var(--text);
		font-size: var(--font-size-xs);
		text-align: center;
	}

	/* A card or mat that holds the piece whole: lit as a target, gold once picked. */
	.rg-capital-tab--holder {
		display: grid;
		justify-items: center;
		gap: var(--space-3);
		padding: 0;
		border: 0;
		background: none;
		color: inherit;
		font: inherit;
		cursor: pointer;
	}

	.rg-capital-tab--holder-civ {
		max-width: 120px;
	}

	.rg-capital-tab--face {
		display: block;
		border-radius: var(--radius);
		outline: var(--border-thick) solid var(--ok);
		outline-offset: 3px;
	}

	.rg-capital-tab--holder:hover .rg-capital-tab--face,
	.rg-capital-tab--holder:focus-visible .rg-capital-tab--face {
		box-shadow: var(--glow-ok-strong);
	}

	.rg-capital-tab--holder[aria-pressed='true'] .rg-capital-tab--face {
		outline-color: var(--gold);
		box-shadow: var(--glow-gold);
	}

	.rg-capital-tab--portrait {
		display: block;
		width: 72px;
		height: 72px;
		image-rendering: pixelated;
	}
</style>
