<!-- CardSlot: an extracted owner-reviewed card pattern. -->
<script module>
	/**
	 * @typedef {Object} CardSlotOwnProps
	 * @property {39 | 62 | 75} [size] - Approved compact, six-across or five-across square
	 * @property {string} [label] - Placement meaning
	 * @property {boolean} [filled] - Highlight the filled square
	 * @property {import('svelte').Snippet} [children] - Reward and placed piece
	 */
	/**
	 * @typedef {CardSlotOwnProps & import('svelte/elements').HTMLAttributes<HTMLElement>} CardSlotProps
	 * @example
	 * <CardSlot />
	 */
</script>

<script>
	/** @type {CardSlotProps} */
	let { size = 62, label, filled = false, children, ...attr } = $props();
</script>

<span
	{...attr}
	class="rg-card-slot-surface {attr.class ?? ''}"
	class:rg-card-slot-surface--filled={filled}
	aria-label={label}
	style:--card-slot-size={`${size}px`}>{@render children?.()}</span>
