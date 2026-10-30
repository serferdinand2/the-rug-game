<!-- ScaledCard: any card shown smaller; it keeps its layout at full size and is scaled as a whole, and its box takes the scaled size (#92). -->
<script module>
	/**
	 * Properties of the ScaledCard component itself.
	 * @typedef {Object} ScaledCardOwnProps
	 * @property {number} scale - Display scale, such as 0.42 in a tab or 0.7 on a choice shelf
	 * @property {number} width - The card's width before scaling, from `CARD_SIZES` in `src/lib/cards/card-sizes.js`
	 * @property {number} [height] - The card's height before scaling, when its frame fixes it; left out, the card is measured
	 * @property {number} [measuredHeight] - The card's height before scaling, as measured; bindable, so a caller can fit cards to the room it has
	 * @property {import('svelte').Snippet} [children] - The card, drawn at full size
	 */

	/**
	 * Properties for the ScaledCard component, including any attributes for its root element.
	 * @typedef {ScaledCardOwnProps & import('svelte/elements').HTMLAttributes<HTMLSpanElement>} ScaledCardProps
	 *
	 * @example
	 * <ScaledCard scale={0.42} {...CARD_SIZES.tech}>
	 *   <TechnologyCard id="clocks" />
	 * </ScaledCard>
	 */
</script>

<script>
	/** @type {ScaledCardProps} */
	let {
		scale,
		width,
		height,
		measuredHeight = $bindable(),
		children,
		...attr
	} = $props();
</script>

<!-- Spans, so a card can sit in a button. -->
<span
	{...attr}
	class="rg-scaled-card {attr.class ?? ''}"
	style:--rg-scaled-card-scale={scale}
	style:--rg-scaled-card-width="{width}px"
	style:--rg-scaled-card-height="{height ?? measuredHeight ?? 0}px">
	<span
		class="rg-scaled-card--face"
		style:width="{width}px"
		style:height={height === undefined ? undefined : `${height}px`}
		bind:offsetHeight={measuredHeight}>
		{@render children?.()}
	</span>
</span>

<style>
	.rg-scaled-card {
		position: relative;
		display: block;
		flex: none;
		width: calc(var(--rg-scaled-card-width) * var(--rg-scaled-card-scale));
		height: calc(
			var(--rg-scaled-card-height) * var(--rg-scaled-card-scale)
		);
	}

	.rg-scaled-card--face {
		position: absolute;
		inset: 0 auto auto 0;
		display: block;
		text-align: left;
		transform: scale(var(--rg-scaled-card-scale));
		transform-origin: top left;
	}
</style>
