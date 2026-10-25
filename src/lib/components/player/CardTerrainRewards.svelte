<!-- CardTerrainRewards: an extracted owner-reviewed card pattern. -->
<script module>
	/**
	 * @typedef {Object} CardTerrainRewardsOwnProps
	 * @property {import('svelte').Snippet} [children] - Typed content for this layout
	 */
	/**
	 * @typedef {CardTerrainRewardsOwnProps & import('svelte/elements').HTMLAttributes<HTMLElement>} CardTerrainRewardsProps
	 * @example
	 * <CardTerrainRewards />
	 */
</script>

<script>
	/** @type {CardTerrainRewardsProps} */
	let { children, ...attr } = $props();
</script>

<ul
	{...attr}
	class={'rg-card-treasure-list' + ' ' + (attr.class ?? '')}>
	{@render children?.()}
</ul>
