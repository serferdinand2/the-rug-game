<!-- CardPredictionTracks: an extracted owner-reviewed card pattern. -->
<script module>
	/**
	 * @typedef {Object} CardPredictionTracksOwnProps
	 * @property {import('svelte').Snippet} [children] - Typed content for this layout
	 */
	/**
	 * @typedef {CardPredictionTracksOwnProps & import('svelte/elements').HTMLAttributes<HTMLElement>} CardPredictionTracksProps
	 * @example
	 * <CardPredictionTracks />
	 */
</script>

<script>
	/** @type {CardPredictionTracksProps} */
	let { children, ...attr } = $props();
</script>

<div
	{...attr}
	class={'rg-card-mystic-predictions' + ' ' + (attr.class ?? '')}>
	{@render children?.()}
</div>
