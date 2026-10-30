<!-- VpTag: the "+N VP" a choice scores, the one gold badge, in its parent's corner or in a row (#116). -->
<script module>
	/**
	 * Properties of the VpTag component itself.
	 * @typedef {Object} VpTagOwnProps
	 * @property {number} value - The VP, drawn as "+N VP"
	 * @property {boolean} [muted=false] - Drawn quietly, as a tile that scores nothing on the chosen hex
	 * @property {'corner' | 'inline'} [variant='corner'] - corner: over the top-right corner of a parent with `position: relative`; inline: in its row, as a turn control or a prompt picture
	 */

	/**
	 * Properties for the VpTag component, including any attributes for its root element.
	 * @typedef {VpTagOwnProps & import('svelte/elements').HTMLAttributes<HTMLSpanElement>} VpTagProps
	 *
	 * @example
	 * <VpTag value={4} />
	 * <VpTag value={0} muted aria-hidden="true" />
	 * <VpTag value={3} variant="inline" />
	 */
</script>

<script>
	/** @type {VpTagProps} */
	let { value, muted = false, variant = 'corner', ...attr } = $props();
</script>

<span
	{...attr}
	class="rg-vp-tag {attr.class ? attr.class : ''}"
	class:rg-vp-tag--corner={variant === 'corner'}
	class:rg-vp-tag--inline={variant === 'inline'}
	class:rg-vp-tag--muted={muted}>+{value} VP</span>

<style>
	/* One look for every "+N VP" (owner, 2026-10-30): a small gold badge. */
	.rg-vp-tag {
		padding: 0 var(--space-3);
		background: var(--vp-tag);
		color: var(--vp-tag-text);
		font-size: var(--font-size-xs);
		font-weight: var(--weight-bold);
		line-height: var(--leading-snug);
		white-space: nowrap;
	}

	/* Over the parent's border, so the badge sits flush with its outer corner. */
	.rg-vp-tag--corner {
		position: absolute;
		top: calc(var(--border) * -1);
		right: calc(var(--border) * -1);
	}

	.rg-vp-tag--inline {
		display: inline-block;
	}

	.rg-vp-tag--muted {
		background: var(--line);
		color: var(--text);
	}
</style>
