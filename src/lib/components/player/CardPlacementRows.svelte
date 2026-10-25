<!-- CardPlacementRows: an extracted owner-reviewed card pattern. -->
<script module>
	/**
	 * @typedef {Object} CardPlacementRowsOwnProps
	 * @property {'collection' | 'covered' | 'history' | 'tracks' | 'leaders'} [kind] - Placement layout
	 * @property {'div' | 'ol'} [as] - Semantic list or group
	 * @property {import('svelte').Snippet} [children] - Typed content for this layout
	 */
	/**
	 * @typedef {CardPlacementRowsOwnProps & import('svelte/elements').HTMLAttributes<HTMLElement>} CardPlacementRowsProps
	 * @example
	 * <CardPlacementRows />
	 */
</script>

<script>
	/** @type {CardPlacementRowsProps} */
	let { kind = 'covered', as = 'div', children, ...attr } = $props();
</script>

<svelte:element
	this={as}
	{...attr}
	class={{
		collection: 'rg-card-frame--slots',
		covered: 'rg-card-militant-grid',
		history: 'rg-card-history-grid',
		tracks: 'rg-card-alchemist-tracks',
		leaders: 'rg-card-leader-tracks',
	}[kind] +
		' ' +
		(attr.class ?? '')}>{@render children?.()}</svelte:element>
