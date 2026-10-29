<!-- TapestryCard: the owner-reviewed portrait, timing and rules frame, drawn from the engine's data (#108). -->
<script module>
	/** @typedef {import('../../cards/game-cards.js').TapestryCardData} TapestryCardData */
	/**
	 * Properties of the TapestryCard component itself.
	 * @typedef {Object} TapestryCardOwnProps
	 * @property {string} [id] - A tapestry card id, drawn from the engine's data when `data` is not given; each trap copy is the trap
	 * @property {TapestryCardData} [data] - A card's face, from `tapestryCardData()` in game-cards.js, or a card the engine doesn't have yet
	 */
	/**
	 * Properties for the TapestryCard component, including any attributes for its root element.
	 * @typedef {TapestryCardOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} TapestryCardProps
	 * @example
	 * <TapestryCard id="academia" />
	 * <TapestryCard data={tapestryCardData('dark-ages')} />
	 */
</script>

<script>
	import CardBand from './CardBand.svelte';
	import CardEdition from './CardEdition.svelte';
	import {
		tapestryCardData,
		tapestryTiming,
	} from '../../cards/game-cards.js';
	import { artUrl } from '../../ui.js';
	import '../../../styles/card-layouts.css';

	/** @type {TapestryCardProps} */
	let { id, data, ...attr } = $props();

	const card = $derived(data ?? tapestryCardData(id ?? ''));
	const timing = $derived(tapestryTiming(card));
</script>

<div
	{...attr}
	class="rg-tapestry-card {attr.class ?? ''}">
	<div
		class="rg-tapestry-layout"
		class:rg-tapestry-layout--trap={card.trap}
		aria-label="{card.title} tapestry card">
		<CardBand
			class="rg-tapestry-layout--band"
			title={card.title}
			size="small"
			trap={card.trap} />
		<div class="rg-tapestry-layout--portrait">
			<img
				src={artUrl(`tapestry/${card.art}`)}
				alt="" />
			{#if timing}
				<span
					class="rg-tapestry-layout--timing rg-tapestry-layout--timing-{timing}"
					>{card.timing}</span>
			{/if}
		</div>
		<p class="rg-tapestry-layout--copy">
			{card.copy}{#if card.note}<span class="rg-tapestry-layout--note"
					>{card.note}</span
				>{/if}
		</p>
		<footer class="rg-tapestry-layout--footer">
			<CardEdition code={card.edition ?? 'base'} />
		</footer>
	</div>
</div>
