<!-- One resource and how many of it a player holds, as in the players overview. -->
<script module>
	/**
	 * Properties of the ResourceChip component itself.
	 * @typedef {Object} ResourceChipOwnProps
	 * @property {import('../../ui.js').ResourceId} resource - Which resource
	 * @property {number} count - How many the player holds
	 */

	/**
	 * Properties for the ResourceChip component, including any attributes for its root element.
	 * @typedef {ResourceChipOwnProps & import('svelte/elements').HTMLAttributes<HTMLSpanElement>} ResourceChipProps
	 *
	 * @example
	 * <ResourceChip resource="coin" count={4} />
	 */
</script>

<script>
	import ResourceIcon from '../ui/ResourceIcon.svelte';
	import { amountWords, resourceName } from '../../describe.js';

	/** @type {ResourceChipProps} */
	let { resource, count, ...attr } = $props();

	let name = $derived(resourceName(resource));
</script>

<span
	role="img"
	aria-label={amountWords(resource, count)}
	title={name}
	{...attr}
	class="rg-resource-chip {attr.class ? attr.class : ''}">
	<ResourceIcon
		symbol={resource}
		decorative />
	<b class="rg-resource-chip--count">{count}</b>
</span>

<style>
	.rg-resource-chip {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-3);
		min-height: 31px;
		border-radius: var(--radius);
		background: var(--raised);
	}

	.rg-resource-chip--count {
		color: var(--text);
		font-size: var(--font-size-base);
		font-weight: var(--weight-bold);
	}
</style>
