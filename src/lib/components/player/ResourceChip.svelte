<!-- One resource and how many of it a player holds, as in the players overview. -->
<script module>
	/**
	 * Properties of the ResourceChip component itself.
	 * @typedef {Object} ResourceChipOwnProps
	 * @property {import('../../ui.js').ResourceId} resource - Which resource
	 * @property {number} count - How many the player holds
	 * @property {boolean} [changed=false] - The count shows a prompt's choices so far, drawn gold (#75)
	 * @property {'small' | 'medium'} [size='small'] - small: the 16px symbol, as on a player card; medium: the native 24px symbol, as in Your overview
	 */

	/**
	 * Properties for the ResourceChip component, including any attributes for its root element.
	 * @typedef {ResourceChipOwnProps & import('svelte/elements').HTMLAttributes<HTMLSpanElement>} ResourceChipProps
	 *
	 * @example
	 * <ResourceChip resource="coin" count={4} />
	 * <ResourceChip resource="food" count={8} changed size="medium" />
	 */
</script>

<script>
	import ResourceIcon from '../ui/ResourceIcon.svelte';
	import { amountWords } from '../../words.js';
	import { resourceName } from '../../game-names.js';

	/** @type {ResourceChipProps} */
	let {
		resource,
		count,
		changed = false,
		size = 'small',
		...attr
	} = $props();

	let name = $derived(resourceName(resource));
</script>

<span
	role="img"
	aria-label={amountWords(resource, count)}
	title={name}
	{...attr}
	class="rg-resource-chip rg-resource-chip--{size} {attr.class
		? attr.class
		: ''}"
	class:rg-resource-chip--changed={changed}>
	<ResourceIcon
		symbol={resource}
		{size}
		decorative />
	<b class="rg-resource-chip--count">{count}</b>
</span>

<style>
	.rg-resource-chip {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-3);
		min-width: 0;
		min-height: 31px;
		border-radius: var(--radius);
		background: var(--raised);
	}

	.rg-resource-chip--medium {
		gap: var(--space-2);
		min-height: 34px;
		line-height: 1;
	}

	.rg-resource-chip--count {
		color: var(--text);
		font-size: var(--font-size-base);
		font-weight: var(--weight-bold);
	}

	.rg-resource-chip--changed .rg-resource-chip--count {
		color: var(--gold);
	}
</style>
