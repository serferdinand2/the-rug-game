<!-- CardClarity: a card's supporting rules beneath the area they clarify, with an optional setup line (#106). -->
<script module>
	/**
	 * @typedef {Object} CardClarityOwnProps
	 * @property {number} [above] - Space above it in px, when the area above needs more than the usual 12
	 * @property {number} [minHeight] - Least height in px, so a short card keeps its reviewed proportions
	 * @property {import('svelte').Snippet} [children] - The clarifications
	 * @property {import('svelte').Snippet} [setup] - The setup line, after a line break and fainter
	 */
	/**
	 * @typedef {CardClarityOwnProps & import('svelte/elements').HTMLAttributes<HTMLElement>} CardClarityProps
	 * @example
	 * <CardClarity>
	 *   Each terrain can be used once.
	 *   {#snippet setup()}Setup, current rules: gain 2 territory tiles.{/snippet}
	 * </CardClarity>
	 * <CardClarity
	 *   above={16}
	 *   minHeight={70}>Each track space can be used once.</CardClarity>
	 */
</script>

<script>
	/** @type {CardClarityProps} */
	let { above, minHeight, children, setup, ...attr } = $props();
</script>

<div
	{...attr}
	class="rg-card-clarity {attr.class ?? ''}"
	style:margin-top={above === undefined ? undefined : `${above}px`}
	style:min-height={minHeight === undefined ? undefined : `${minHeight}px`}>
	<p class="rg-card-clarity--text">
		{@render children?.()}{#if children && setup}<br />{/if}{#if setup}<span
				class="rg-card-clarity--setup">{@render setup()}</span
			>{/if}
	</p>
</div>

<style>
	.rg-card-clarity {
		margin: 12px 12px 0;
		padding: 8px 10px;
		border-top: 1px solid var(--line-soft);
	}
	.rg-card-clarity--text {
		--card-resource-center: -4px;
		margin: 0;
		color: var(--muted);
		font-size: var(--font-size-2xs);
		line-height: 1.3;
	}
	.rg-card-clarity--text :global(b) {
		color: var(--text);
	}
	.rg-card-clarity--setup {
		color: var(--faint);
	}
</style>
