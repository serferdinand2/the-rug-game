<!-- A placeholder price symbol until the resource icons land: a square for a resource, a gold diamond for any resource. -->
<script module>
	/**
	 * Properties of the ResourceIcon component itself.
	 * @typedef {Object} ResourceIconOwnProps
	 * @property {import('../../ui.js').CostSymbol} symbol - A resource, or 'any' for one resource of any type
	 * @property {'small' | 'medium'} [size='small'] - small: 9px, in tier prices and chips; medium: 18px, in the footer cost
	 * @property {string} [color] - Override the square's colour, such as a track's colour in its tier prices; defaults to the resource's colour
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
	import { RESOURCES, resourceColor } from '../../ui.js';

	/** @type {ResourceIconProps} */
	let {
		symbol,
		size = 'small',
		color,
		decorative = false,
		...attr
	} = $props();

	let name = $derived(
		symbol === 'any'
			? 'Any resource'
			: (RESOURCES.find((resource) => resource.id === symbol)?.name ??
					symbol)
	);
	let fill = $derived(
		symbol === 'any' ? undefined : (color ?? resourceColor(symbol))
	);
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
	class:rg-resource-icon--any={symbol === 'any'}
	style:--rg-resource-icon-color={fill}>{symbol === 'any' ? '◆' : ''}</i>

<style>
	.rg-resource-icon {
		display: inline-grid;
		flex: none;
		place-items: center;
		border-radius: var(--radius);
		font-style: normal;
		line-height: var(--leading-none);
	}

	.rg-resource-icon--small {
		width: 9px;
		height: 9px;
		border: var(--border) solid
			color-mix(in srgb, var(--rg-resource-icon-color) 75%, var(--text));
		background: var(--rg-resource-icon-color);
	}

	.rg-resource-icon--medium {
		width: 18px;
		height: 18px;
		border: var(--border-thick) solid
			color-mix(in srgb, var(--rg-resource-icon-color) 68%, var(--text));
		background: var(--rg-resource-icon-color);
		box-shadow: inset 0 0 0 3px
			color-mix(in srgb, var(--ink) 33%, transparent);
	}

	.rg-resource-icon--any {
		border: 0;
		background: none;
		box-shadow: none;
		color: var(--gold);
	}

	.rg-resource-icon--any.rg-resource-icon--small {
		font-size: var(--font-size-3xs);
	}

	.rg-resource-icon--any.rg-resource-icon--medium {
		font-size: var(--font-size-xl);
	}
</style>
