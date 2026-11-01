<!-- TechnologyCard: the owner-reviewed horizontal technology frame, drawn from the engine's data (#108). -->
<script module>
	/** @typedef {import('../../cards/game-cards.js').TechnologyCardData} TechnologyCardData */
	/**
	 * Properties of the TechnologyCard component itself.
	 * @typedef {Object} TechnologyCardOwnProps
	 * @property {string} [id] - A tech card id, drawn from the engine's data when `data` is not given
	 * @property {TechnologyCardData} [data] - A card's face, from `techCardData()` in game-cards.js
	 */
	/**
	 * Properties for the TechnologyCard component, including any attributes for its root element.
	 * @typedef {TechnologyCardOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} TechnologyCardProps
	 * @example
	 * <TechnologyCard id="clocks" />
	 * <TechnologyCard data={techCardData('time-travel')} />
	 */
</script>

<script>
	import CardBand from './CardBand.svelte';
	import CardEdition from './CardEdition.svelte';
	import LandmarkFootprint from './LandmarkFootprint.svelte';
	import { techCardData } from '../../cards/game-cards.js';
	import { trackName } from '../../game-names.js';
	import { artUrl } from '../../ui.js';
	import '../../../styles/card-layouts.css';

	/** @type {TechnologyCardProps} */
	let { id, data, ...attr } = $props();

	const card = $derived(data ?? techCardData(id ?? ''));
</script>

<div
	{...attr}
	class="rg-technology-card {attr.class ?? ''}">
	<div
		class="rg-tech-layout"
		aria-label="{card.title} technology card">
		<CardBand
			class="rg-tech-layout--band"
			title={card.title}
			size="medium" />
		<div class="rg-tech-layout--body">
			<img
				class="rg-tech-layout--art"
				src={artUrl(`tech/${card.art}`)}
				alt="" />
			<div class="rg-tech-layout--effects">
				<div
					class="rg-tech-layout--effect"
					title={card.landmark ? card.square : undefined}
					data-landmark={card.landmark}>
					<span
						class="rg-tech-layout--shape rg-tech-layout--shape-square"
						aria-label="Square benefit"></span>
					<div class="rg-tech-layout--effect-copy">
						<small>Square · top row</small>
						<div class="rg-tech-layout--effect-detail">
							<p>{card.square}</p>
							{#if card.landmark}<LandmarkFootprint
									id={card.landmark}
									plotSize={7}
									gap={1}
									class="rg-tech-layout--landmark-footprint" />{/if}
						</div>
					</div>
				</div>
				<div class="rg-tech-layout--effect">
					<span
						class="rg-tech-layout--shape rg-tech-layout--shape-circle"
						aria-label="Circle benefit"></span>
					<div>
						<small>Circle · middle row</small>
						<p>{card.circle}</p>
					</div>
				</div>
			</div>
		</div>
		<div class="rg-tech-layout--conditions">
			<span
				class="rg-tech-layout--condition"
				class:rg-tech-layout--condition-innovation-market={card.innovationRow ===
					'market'}
				class:rg-tech-layout--condition-innovation-house={card.innovationRow ===
					'house'}
				class:rg-tech-layout--condition-innovation-farm={card.innovationRow ===
					'farm'}
				class:rg-tech-layout--condition-innovation-armory={card.innovationRow ===
					'armory'}>
				{#if card.innovation}
					<b class="rg-tech-layout--innovation-name"
						>{card.innovation}</b>
					<b>uncovered</b>
				{:else if card.track}
					<img
						src={artUrl(`track/${card.track}`)}
						alt="" /><b
						class="rg-tech-layout--track rg-tech-layout--track-{card.track}"
						>{trackName(card.track)}</b
					><b>{card.level}</b>
				{/if}
			</span>
			<span class="rg-tech-layout--condition"
				><i
					class="rg-tech-layout--shape rg-tech-layout--shape-square"
					aria-hidden="true"></i
				><b>Top row</b></span>
		</div>
		<footer class="rg-tech-layout--footer">
			<CardEdition code={card.edition ?? 'base'} />
		</footer>
	</div>
</div>
