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
	import { RESOURCES, trackColor } from '../../ui.js';
	import { roman } from '../../game-names.js';

	/** @type {TierPriceProps} */
	let { era, symbols, track, highlighted = false, ...attr } = $props();

	const COUNT_WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six'];
	// Resources whose names take no plural s: "two food", but "two coins".
	const UNCOUNTABLE = new Set(['food', 'culture']);

	let numeral = $derived(roman(era));
	let label = $derived(`Tier ${numeral} ${describe(symbols)}`);

	/**
	 * The price in words, such as 'costs one food and one resource of any type'.
	 * @param {import('../../ui.js').CostSymbol[]} price
	 * @returns {string}
	 */
	function describe(price) {
		if (price.length === 0) {
			return 'is free';
		}
		/** @type {Map<string, number>} */
		const counts = new Map();
		for (const symbol of price) {
			counts.set(symbol, (counts.get(symbol) ?? 0) + 1);
		}
		const parts = [...counts].map(
			([symbol, count]) =>
				`${COUNT_WORDS[count] ?? count} ${noun(symbol, count)}`
		);
		const last = parts.pop();
		return `costs ${parts.length ? `${parts.join(', ')} and ` : ''}${last}`;
	}

	/**
	 * @param {string} symbol
	 * @param {number} count
	 * @returns {string}
	 */
	function noun(symbol, count) {
		if (symbol === 'any') {
			return count === 1
				? 'resource of any type'
				: 'resources of any type';
		}
		const name = (
			RESOURCES.find((resource) => resource.id === symbol)?.name ?? symbol
		).toLowerCase();
		return count === 1 || UNCOUNTABLE.has(symbol) ? name : `${name}s`;
	}
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
