<!-- One tier's price above its three track spaces: the era numeral, a dot and the price symbols, between two rules. -->
<script module>
	/**
	 * Properties of the TierPrice component itself.
	 * @typedef {Object} TierPriceOwnProps
	 * @property {number} era - The tier, 1–4, shown as I–IV
	 * @property {import('../../ui.js').CostSymbol[]} symbols - The price: one symbol per resource paid, in order
	 * @property {import('../../ui.js').TrackId} track - The track, which colours the numeral and the resource squares
	 * @property {boolean} [highlighted=false] - Gold rules and text while one of the tier's spaces is hovered or focused
	 */

	/**
	 * Properties for the TierPrice component, including any attributes for its root element.
	 * @typedef {TierPriceOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} TierPriceProps
	 *
	 * @example
	 * <TierPrice
	 *   era={2}
	 *   symbols={['food', 'any']}
	 *   track="exploration"
	 *   highlighted
	 * />
	 */
</script>

<script>
	import ResourceIcon from '../ui/ResourceIcon.svelte';
	import { priceWords } from '../../describe.js';
	import { trackColor } from '../../ui.js';
	import { roman } from '../../game-names.js';

	/** @type {TierPriceProps} */
	let { era, symbols, track, highlighted = false, ...attr } = $props();

	let numeral = $derived(roman(era));
	let label = $derived(`Tier ${numeral} costs ${priceWords(symbols)}`);
</script>

<div
	role="img"
	aria-label={label}
	{...attr}
	class="rg-tier-price {attr.class ? attr.class : ''}"
	class:rg-tier-price--highlighted={highlighted}
	style:--rg-tier-price-text={trackColor(track)}>
	<b class="rg-tier-price--era">{numeral}</b>
	<i class="rg-tier-price--separator">·</i>
	{#each symbols as symbol, index (index)}
		<ResourceIcon
			{symbol}
			decorative />
	{/each}
</div>

<style>
	/* The rules on each side are as thick as the progress lines beneath the track. */
	.rg-tier-price {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		color: var(--muted);
		font-size: var(--font-size-2xs);
		line-height: var(--leading-none);
	}

	.rg-tier-price::before,
	.rg-tier-price::after {
		content: '';
		flex: 1;
		height: var(--progress-line);
		background: var(--line);
		transition: background var(--duration-fast) var(--ease);
	}

	.rg-tier-price--highlighted {
		color: var(--gold);
	}

	.rg-tier-price--highlighted::before,
	.rg-tier-price--highlighted::after {
		background: var(--gold);
	}

	.rg-tier-price--era {
		margin-right: var(--space-1);
		color: var(--rg-tier-price-text);
		font: var(--weight-title) var(--font-size-2xs) / var(--leading-none)
			var(--font-title);
		letter-spacing: var(--letter-spacing-title);
		transition: color var(--duration-fast) var(--ease);
	}

	.rg-tier-price--highlighted .rg-tier-price--era {
		color: var(--gold);
	}

	.rg-tier-price--separator {
		font-style: normal;
	}
</style>
