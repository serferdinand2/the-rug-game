<!-- Native 24px and 48px artwork; smaller display slots scale the 24px source. -->
<script module>
	/**
	 * Properties of the ResourceIcon component itself.
	 * @typedef {Object} ResourceIconOwnProps
	 * @property {import('../../ui.js').CostSymbol} symbol - A resource, or 'any' for one resource of any type
	 * @property {'small' | 'medium' | 'large'} [size='small'] - small: 16px display from 24px art; medium: native 24px; large: native 48px
	 * @property {string} [color] - Optional outline accent; approved artwork keeps its original colors
	 * @property {boolean} [decorative=false] - Hide it from assistive technology when nearby text already names it
	 */

	/**
	 * Properties for the ResourceIcon component, including any attributes for its root element.
	 * @typedef {ResourceIconOwnProps & import('svelte/elements').HTMLAttributes<HTMLElement>} ResourceIconProps
	 *
	 * @example
	 * <ResourceIcon symbol="food" />
	 * <ResourceIcon symbol="food" color="var(--exploration)" size="medium" />
	 * <ResourceIcon symbol="any" />
	 */
</script>

<script>
	import { resourceName } from '../../game-names.js';
	import { artUrl } from '../../ui.js';

	/** @type {ResourceIconProps} */
	let {
		symbol,
		size = 'small',
		color,
		decorative = false,
		...attr
	} = $props();

	let name = $derived(resourceName(symbol));
</script>

<i
	role={decorative ? undefined : 'img'}
	aria-label={decorative ? undefined : name}
	aria-hidden={decorative ? 'true' : undefined}
	title={name}
	{...attr}
	class="rg-resource-icon rg-resource-icon--{size} {attr.class
		? attr.class
		: ''}"
	class:rg-resource-icon--accent={Boolean(color)}
	style:--rg-resource-icon-color={color}>
	<img
		src={artUrl(
			`${size === 'large' ? 'resource-48' : 'resource-24'}/${symbol}`
		)}
		width={size === 'large' ? 48 : 24}
		height={size === 'large' ? 48 : 24}
		alt=""
		draggable="false" />
</i>

<style>
	.rg-resource-icon {
		display: inline-flex;
		flex: none;
		place-items: center;
		border-radius: var(--radius);
		font-style: normal;
		line-height: var(--leading-none);
	}

	.rg-resource-icon--small {
		width: 16px;
		height: 16px;
	}

	.rg-resource-icon--medium {
		width: 24px;
		height: 24px;
	}

	.rg-resource-icon--large {
		width: 48px;
		height: 48px;
	}

	.rg-resource-icon--accent {
		outline: var(--border) solid var(--rg-resource-icon-color);
	}

	.rg-resource-icon img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: contain;
		image-rendering: pixelated;
	}
</style>
