<!-- CardClarity: an extracted owner-reviewed card pattern. -->
<script module>
	/**
	 * @typedef {Object} CardClarityOwnProps
	 * @property {import('svelte').Snippet} [children] - Clarifications beneath placement content
	 */
	/**
	 * @typedef {CardClarityOwnProps & import('svelte/elements').HTMLAttributes<HTMLElement>} CardClarityProps
	 * @example
	 * <CardClarity />
	 */
</script>

<script>
	/** @type {CardClarityProps} */
	let { children, ...attr } = $props();
</script>

<div
	{...attr}
	class="rg-card-frame--clarity {attr.class ?? ''}">
	{@render children?.()}
</div>
