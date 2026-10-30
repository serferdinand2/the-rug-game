<!-- CardResource: a native 24 px resource icon in card text that leaves the line's spacing alone; its container may centre it differently (#106). -->
<script module>
	/**
	 * @typedef {Object} CardResourceOwnProps
	 * @property {import('../../ui.js').CostSymbol} symbol - Native resource symbol
	 * @property {boolean} [fine=false] - Sits in the 11 px supporting text, a pixel lower
	 */
	/**
	 * A container that is not running text sets two inherited properties instead of styling the icon:
	 * `--card-resource-center` (where the icon's middle sits from the baseline, -5px in text) and
	 * `--card-resource-height` (0 in text, so the line keeps its height; 24px in a square or symbol).
	 * @typedef {CardResourceOwnProps & import('svelte/elements').HTMLAttributes<HTMLElement>} CardResourceProps
	 * @example
	 * <CardResource symbol="coin" />
	 * <CardResource
	 *   symbol="any"
	 *   fine />
	 */
</script>

<script>
	import ResourceIcon from '../ui/ResourceIcon.svelte';
	/** @type {CardResourceProps} */
	let { symbol, fine = false, ...attr } = $props();
</script>

<span
	{...attr}
	class="rg-card-resource {attr.class ?? ''}"
	class:rg-card-resource--fine={fine}
	><span class="rg-card-resource--art"
		><ResourceIcon
			{symbol}
			size="medium" /></span
	></span>

<style>
	.rg-card-resource {
		--resource-center: var(--card-resource-center, -5px);
		display: inline-block;
		position: relative;
		flex: none;
		width: 24px;
		height: var(--card-resource-height, 0);
		vertical-align: baseline;
	}
	.rg-card-resource--fine {
		--resource-center: -4px;
	}
	.rg-card-resource--art {
		position: absolute;
		left: 0;
		top: calc(var(--resource-center) - 12px);
		display: grid;
		place-items: center;
		width: 24px;
		height: 24px;
	}
</style>
