<!-- VpTag: the "+N VP" a choice scores, as a gold badge in its parent's corner or as gold text in a row (#116). -->
<script module>
	/**
	 * Properties of the VpTag component itself.
	 * @typedef {Object} VpTagOwnProps
	 * @property {number} value - The VP, drawn after a plus sign
	 * @property {string} [unit='VP'] - The word after the number; '' draws "+N" alone
	 * @property {boolean} [muted=false] - Drawn quietly, as a tile that scores nothing on the chosen hex
	 * @property {'corner' | 'inline'} [variant='corner'] - corner: a small gold badge over the top-right corner of a parent with `position: relative`; inline: bold gold text in its row
	 */

	/**
	 * Properties for the VpTag component, including any attributes for its root element.
	 * @typedef {VpTagOwnProps & import('svelte/elements').HTMLAttributes<HTMLSpanElement>} VpTagProps
	 *
	 * @example
	 * <VpTag value={4} />
	 * <VpTag value={0} unit="" muted aria-hidden="true" />
	 * <VpTag value={3} variant="inline" />
	 */
</script>

<script>
	/** @type {VpTagProps} */
	let {
		value,
		unit = 'VP',
		muted = false,
		variant = 'corner',
		...attr
	} = $props();
</script>

<span
	{...attr}
	class="rg-vp-tag {attr.class ? attr.class : ''}"
	class:rg-vp-tag--corner={variant === 'corner'}
	class:rg-vp-tag--inline={variant === 'inline'}
	class:rg-vp-tag--muted={muted}>+{value}{unit ? ` ${unit}` : ''}</span>

<style>
	.rg-vp-tag {
		font-weight: var(--weight-bold);
	}

	/* Over the parent's border, so the badge sits flush with its outer corner. */
	.rg-vp-tag--corner {
		position: absolute;
		top: calc(var(--border) * -1);
		right: calc(var(--border) * -1);
		padding: 0 var(--space-3);
		background: var(--vp-tag);
		color: var(--vp-tag-text);
		font-size: var(--font-size-xs);
		line-height: var(--leading-snug);
	}

	.rg-vp-tag--inline {
		color: var(--vp-tag);
		font-size: var(--font-size-md);
	}

	.rg-vp-tag--corner.rg-vp-tag--muted {
		background: var(--line);
		color: var(--text);
	}

	.rg-vp-tag--inline.rg-vp-tag--muted {
		color: var(--muted);
		font-weight: var(--weight-regular);
	}
</style>
