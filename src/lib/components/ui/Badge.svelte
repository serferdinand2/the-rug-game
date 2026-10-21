<!-- A small label: an expansion tag tinted with its colour, or small capitals such as YOU and HOST. -->
<script module>
	/**
	 * Properties of the Badge component itself.
	 * @typedef {Object} BadgeOwnProps
	 * @property {string} label - The text, such as 'Plans & Ploys' or 'HOST'
	 * @property {'tag' | 'caps'} [variant='tag'] - tag: a tinted box; caps: small uppercase letters with no box
	 * @property {string} [color='var(--gold)'] - A colour token reference, such as 'var(--plans-ploys)'
	 */

	/**
	 * Properties for the Badge component, including any attributes for its root element.
	 * @typedef {BadgeOwnProps & import('svelte/elements').HTMLAttributes<HTMLSpanElement>} BadgeProps
	 *
	 * @example
	 * <Badge label="Arts & Architecture" color="var(--arts-architecture)" />
	 * <Badge label="Host" variant="caps" />
	 */
</script>

<script>
	/** @type {BadgeProps} */
	let { label, variant = 'tag', color = 'var(--gold)', ...attr } = $props();
</script>

<span
	{...attr}
	class="rg-badge rg-badge--{variant} {attr.class ? attr.class : ''}"
	style:--rg-badge-color={color}>{label}</span>

<style>
	.rg-badge {
		display: inline-block;
		white-space: nowrap;
	}

	.rg-badge--tag {
		padding: var(--space-1) var(--space-3);
		border: var(--border) solid
			color-mix(in srgb, var(--rg-badge-color) 65%, transparent);
		border-radius: var(--radius);
		background: color-mix(in srgb, var(--rg-badge-color) 16%, transparent);
		color: color-mix(in srgb, var(--rg-badge-color) 75%, var(--text));
		font-size: var(--font-size-xs);
		line-height: var(--leading-snug);
	}

	.rg-badge--caps {
		color: var(--rg-badge-color);
		font-size: var(--font-size-3xs);
		font-weight: var(--weight-bold);
		line-height: var(--leading-none);
		letter-spacing: var(--letter-spacing-caps);
		text-transform: uppercase;
	}
</style>
