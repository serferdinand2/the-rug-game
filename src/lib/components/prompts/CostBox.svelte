<!-- The price of a footer decision: a small "Cost" label, then the resource symbols joined by plus signs. -->
<script module>
	/**
	 * Properties of the CostBox component itself.
	 * @typedef {Object} CostBoxOwnProps
	 * @property {import('../../ui.js').CostSymbol[]} symbols - The price, one symbol per resource, such as ['food', 'any']
	 * @property {import('../../ui.js').TrackId} [track] - The chosen space's track: the resource squares and the border take its colour; without it the border is bronze and each square keeps its resource's colour
	 * @property {string} [label='Cost'] - The word before the symbols, such as 'Optional cost'; it also starts the aria-label
	 */

	/**
	 * Properties for the CostBox component, including any attributes for its root element.
	 * @typedef {CostBoxOwnProps & import('svelte/elements').HTMLAttributes<HTMLSpanElement>} CostBoxProps
	 *
	 * @example
	 * <CostBox symbols={['food', 'any']} track="exploration" />
	 * <CostBox symbols={['food']} track="exploration" label="Optional cost" />
	 */
</script>

<script>
	import ResourceIcon from '../ui/ResourceIcon.svelte';
	import { priceWords } from '../../describe.js';
	import { trackColor } from '../../ui.js';

	/** @type {CostBoxProps} */
	let { symbols, track, label = 'Cost', ...attr } = $props();

	let description = $derived(`${label}: ${priceWords(symbols)}`);
</script>

<span
	role="img"
	aria-label={description}
	{...attr}
	class="rg-cost-box {attr.class ? attr.class : ''}"
	style:--rg-cost-box-color={track ? trackColor(track) : 'var(--bronze)'}>
	<span class="rg-cost-box--label">{label}</span>
	{#each symbols as symbol, index (index)}
		{#if index > 0}
			<span class="rg-cost-box--plus">+</span>
		{/if}
		<ResourceIcon
			{symbol}
			size="medium"
			decorative />
	{/each}
</span>

<style>
	.rg-cost-box {
		display: inline-flex;
		align-items: center;
		gap: var(--space-4);
		min-height: var(--control-size);
		padding: var(--space-2) var(--space-5);
		border: var(--border) solid
			color-mix(in srgb, var(--rg-cost-box-color) 55%, var(--line));
		border-radius: var(--radius);
		background: var(--control);
		color: var(--text);
		font-weight: var(--weight-bold);
		white-space: nowrap;
	}

	.rg-cost-box--label {
		margin-right: var(--space-4);
		color: var(--muted);
		font-size: var(--font-size-3xs);
		font-weight: var(--weight-bold);
		line-height: var(--leading-none);
		letter-spacing: var(--letter-spacing-caps);
		text-transform: uppercase;
	}

	.rg-cost-box--plus {
		color: var(--muted);
		font-weight: var(--weight-regular);
	}
</style>
