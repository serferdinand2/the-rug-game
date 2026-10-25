<!-- CardPathGrid: an extracted owner-reviewed card pattern. -->
<script module>
	/**
	 * @typedef {Object} CardPathGridOwnProps
	 * @property {import('svelte').Snippet} [children] - Typed content for this layout
	 */
	/**
	 * @typedef {CardPathGridOwnProps & import('svelte/elements').HTMLAttributes<HTMLElement>} CardPathGridProps
	 * @example
	 * <CardPathGrid />
	 */
</script>

<script>
	/** @type {CardPathGridProps} */
	let { children, ...attr } = $props();
</script>

<div
	{...attr}
	class={'rg-card-entertainer-path' + ' ' + (attr.class ?? '')}>
	{@render children?.()}
</div>
