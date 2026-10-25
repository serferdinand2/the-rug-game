<!-- CardResource: an extracted owner-reviewed card pattern. -->
<script module>
	/**
	 * @typedef {Object} CardResourceOwnProps
	 * @property {import('../../ui.js').CostSymbol} symbol - Native resource symbol
	 */
	/**
	 * @typedef {CardResourceOwnProps & import('svelte/elements').HTMLAttributes<HTMLElement>} CardResourceProps
	 * @example
	 * <CardResource />
	 */
</script>

<script>
	import ResourceIcon from '../ui/ResourceIcon.svelte';
	/** @type {CardResourceProps} */
	let { symbol, ...attr } = $props();
</script>

<span
	{...attr}
	class="rg-card-resource-icon {attr.class ?? ''}"
	><span class="rg-card-resource-icon--art"
		><ResourceIcon
			{symbol}
			size="medium" /></span
	></span>
