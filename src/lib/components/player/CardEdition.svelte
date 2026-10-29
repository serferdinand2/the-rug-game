<!-- CardEdition: the edition chip at a card's foot (#109), one for every card family: the edition's name in its own card colour. -->
<script module>
	/**
	 * Properties of the CardEdition component itself.
	 * @typedef {Object} CardEditionOwnProps
	 * @property {string} [code='base'] - The edition: 'base', 'pp', 'aa' or 'ff'
	 */

	/**
	 * Properties for the CardEdition component, including any attributes for its root span.
	 * @typedef {CardEditionOwnProps & import('svelte/elements').HTMLAttributes<HTMLSpanElement>} CardEditionProps
	 *
	 * @example
	 * <CardEdition code="pp" />
	 */
</script>

<script>
	import { expansionName } from '../../game-names.js';
	import { cardEditionColor } from '../../ui.js';

	/** @type {CardEditionProps} */
	let { code = 'base', ...attr } = $props();
</script>

<span
	{...attr}
	class="rg-card-edition {attr.class ?? ''}"
	class:rg-card-edition--base={code === 'base'}
	style:--rg-card-edition-color={cardEditionColor(code)}
	>{expansionName(code)}</span>

<style>
	.rg-card-edition {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 18px;
		padding: 2px 6px;
		border: 1px solid var(--rg-card-edition-color);
		background: color-mix(
			in srgb,
			var(--rg-card-edition-color) 16%,
			transparent
		);
		color: var(--rg-card-edition-color);
		white-space: nowrap;
		font: var(--weight-bold) var(--font-size-3xs) / 1 var(--font-body);
		letter-spacing: 0.04em;
	}

	/* The base chip keeps the lighter card line it was approved with. */
	.rg-card-edition--base {
		border-color: var(--card-line);
	}
</style>
