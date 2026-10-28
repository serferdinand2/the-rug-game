<!-- CardRewardColumns: an extracted owner-reviewed card pattern. -->
<script module>
	/**
	 * @typedef {Object} CardRewardColumnsOwnProps
	 * @property {'beside' | 'inside'} [kind] - Benefits beside squares or inside them
	 * @property {import('svelte').Snippet} [children] - Typed content for this layout
	 */
	/**
	 * @typedef {CardRewardColumnsOwnProps & import('svelte/elements').HTMLAttributes<HTMLElement>} CardRewardColumnsProps
	 * @example
	 * <CardRewardColumns />
	 */
</script>

<script>
	/** @type {CardRewardColumnsProps} */
	let { kind = 'beside', children, ...attr } = $props();
</script>

<div
	{...attr}
	class="{kind === 'beside'
		? 'rg-card-craftsmen-columns'
		: 'rg-card-merry-grid'} {attr.class ? attr.class : ''}">
	{@render children?.()}
</div>
