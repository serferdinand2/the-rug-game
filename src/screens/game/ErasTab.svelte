<!-- The Eras tab's tapestry slots and the selected era card, with what an A&A card holds drawn beside it (#184). -->
<script module>
	/** @typedef {import('../../lib/area/income.js').EraSlotView} EraSlotView */

	/**
	 * Properties of the ErasTab screen part itself.
	 * @typedef {Object} ErasTabOwnProps
	 * @property {string} title - The translated heading
	 * @property {EraSlotView[]} slots - The player's four era slots
	 * @property {number | null} [selected=null] - The selected slot; bindable
	 */

	/**
	 * Properties for ErasTab, including any attributes for its root element.
	 * @typedef {ErasTabOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} ErasTabProps
	 *
	 * @example
	 * <ErasTab {title} {slots} bind:selected />
	 */
</script>

<script>
	import { defaultEra } from '../../lib/area/income.js';
	import {
		heldPlotCard,
		placingPiece,
	} from '../../lib/area/placement-targets.js';
	import { CARD_SIZES } from '../../lib/cards/card-sizes.js';
	import { tapestryCardData } from '../../lib/cards/game-cards.js';
	import EraSlots from '../../lib/components/player/EraSlots.svelte';
	import LandmarkShape from '../../lib/components/player/LandmarkShape.svelte';
	import PlotCardGrid from '../../lib/components/player/PlotCardGrid.svelte';
	import ScaledCard from '../../lib/components/player/ScaledCard.svelte';
	import TapestryCard from '../../lib/components/player/TapestryCard.svelte';
	import TapestryCardBack from '../../lib/components/player/TapestryCardBack.svelte';

	/** @type {ErasTabProps} */
	let { title, slots, selected = $bindable(null), ...attr } = $props();

	let shownEra = $derived(selected ?? defaultEra(slots));
	let selectedSlot = $derived(
		slots.find((slot) => slot.era === shownEra) ?? null
	);
	/** A plot card's squares with its pieces, or the landmarks Space Race or Trade Routes hold (#184). */
	let plot = $derived(
		selectedSlot?.id
			? heldPlotCard(selectedSlot.id, selectedSlot.held)
			: null
	);
	let landmarks = $derived(
		plot
			? []
			: (selectedSlot?.held ?? []).flatMap((piece) =>
					'landmark' in piece ? [placingPiece(piece.landmark)] : []
				)
	);
</script>

<div
	{...attr}
	class="rg-eras-tab {attr.class ? attr.class : ''}">
	<h2 class="rg-player-tabs--title">{title}</h2>
	{#if selectedSlot?.id}
		<div class="rg-player-tabs--era-card">
			<ScaledCard
				scale={0.6}
				{...CARD_SIZES.tapestry}>
				<TapestryCard data={tapestryCardData(selectedSlot.id)} />
			</ScaledCard>
			{#if plot}
				<PlotCardGrid
					card={plot}
					plotSize={30} />
			{:else if landmarks.length}
				<div class="rg-eras-tab--landmarks">
					{#each landmarks as landmark, index (index)}
						<LandmarkShape
							id={landmark.id}
							footprint={landmark.footprint}
							plotSize={20} />
					{/each}
				</div>
			{/if}
		</div>
	{:else if selectedSlot?.faceDown}
		<div class="rg-player-tabs--era-card">
			<ScaledCard
				scale={0.6}
				{...CARD_SIZES.tapestry}>
				<TapestryCardBack />
			</ScaledCard>
		</div>
	{/if}
	<EraSlots
		{slots}
		bind:selected />
</div>

<style>
	.rg-eras-tab {
		display: contents;
	}

	/* The card, and beside it what an A&A card holds (issue 184). */
	.rg-player-tabs--era-card {
		display: flex;
		align-items: center;
		gap: var(--space-6);
		margin-bottom: var(--space-8);
	}

	.rg-eras-tab--landmarks {
		display: grid;
		gap: var(--space-4);
	}
</style>
