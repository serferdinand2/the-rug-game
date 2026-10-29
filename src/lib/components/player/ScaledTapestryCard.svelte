<!-- ScaledTapestryCard: preserves a tapestry card's measured height when it is shown smaller in a shelf or tab. -->
<script module>
	/** @typedef {import('../../cards/game-cards.js').TapestryCardData} TapestryCardData */
	/**
	 * @typedef {Object} ScaledTapestryCardOwnProps
	 * @property {TapestryCardData} data - The card face
	 * @property {number} scale - Display scale, such as 0.7 on a choice shelf
	 */
	/**
	 * @typedef {ScaledTapestryCardOwnProps & import('svelte/elements').HTMLAttributes<HTMLSpanElement>} ScaledTapestryCardProps
	 * @example
	 * <ScaledTapestryCard data={tapestryCardData('academia')} scale={0.7} />
	 */
</script>

<script>
	import TapestryCard from './TapestryCard.svelte';
	/** @type {ScaledTapestryCardProps} */
	let { data, scale, ...attr } = $props();
	let height = $state(560);
</script>

<span
	{...attr}
	class="rg-scaled-tapestry-card {attr.class ?? ''}"
	style:--rg-card-scale={scale}
	style:--rg-card-height="{height}px">
	<span
		class="rg-scaled-tapestry-card--face"
		bind:offsetHeight={height}>
		<TapestryCard {data} />
	</span>
</span>

<style>
	.rg-scaled-tapestry-card {
		position: relative;
		display: block;
		flex: none;
		width: calc(319px * var(--rg-card-scale));
		height: calc(var(--rg-card-height) * var(--rg-card-scale));
	}

	.rg-scaled-tapestry-card--face {
		position: absolute;
		inset: 0 auto auto 0;
		display: block;
		transform: scale(var(--rg-card-scale));
		transform-origin: top left;
	}
</style>
