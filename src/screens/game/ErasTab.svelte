<!-- The Eras tab's tapestry slots and the selected era card. -->
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
	import { CARD_SIZES } from '../../lib/cards/card-sizes.js';
	import { tapestryCardData } from '../../lib/cards/game-cards.js';
	import EraSlots from '../../lib/components/player/EraSlots.svelte';
	import ScaledCard from '../../lib/components/player/ScaledCard.svelte';
	import TapestryCard from '../../lib/components/player/TapestryCard.svelte';
	import TapestryCardBack from '../../lib/components/player/TapestryCardBack.svelte';

	/** @type {ErasTabProps} */
	let { title, slots, selected = $bindable(null), ...attr } = $props();

	let shownEra = $derived(selected ?? defaultEra(slots));
	let selectedSlot = $derived(
		slots.find((slot) => slot.era === shownEra) ?? null
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

	.rg-player-tabs--era-card {
		margin-bottom: var(--space-8);
	}
</style>
