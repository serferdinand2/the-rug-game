<!-- CardEffectBox: an extracted owner-reviewed card pattern. -->
<script module>
	/**
	 * @typedef {Object} CardEffectBoxOwnProps
	 * @property {import('svelte').Snippet} [symbol] - Trigger or reward symbol
	 * @property {import('svelte').Snippet} [children] - Trigger and effect text
	 */
	/**
	 * @typedef {CardEffectBoxOwnProps & import('svelte/elements').HTMLAttributes<HTMLElement>} CardEffectBoxProps
	 * @example
	 * <CardEffectBox />
	 */
</script>

<script>
	/** @type {CardEffectBoxProps} */
	let { symbol, children, ...attr } = $props();
</script>

<div
	{...attr}
	class="rg-card-ability-row {attr.class ?? ''}">
	<div class="rg-card-ability-symbol">{@render symbol?.()}</div>
	<div class="rg-card-ability-copy">{@render children?.()}</div>
</div>
