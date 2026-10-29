<!-- CardSlot: an extracted owner-reviewed card pattern; a button with a green outline when a decision offers its spot (#78). -->
<script module>
	/**
	 * @typedef {Object} CardSlotOwnProps
	 * @property {39 | 62 | 75} [size] - Approved compact, six-across or five-across square
	 * @property {string} [label] - Placement meaning
	 * @property {boolean} [filled] - Highlight the filled square
	 * @property {boolean} [pickable=false] - The viewer's open decision offers this spot: a button with the green available outline
	 * @property {boolean} [picked=false] - A pickable slot the viewer has picked: the gold selected outline
	 * @property {string} [value] - What a pick reports, such as the spot's id
	 * @property {Function} [onCardSlotPick] - Callback fired with `value` when a pickable slot is pressed
	 * @property {import('svelte').Snippet} [children] - Reward and placed piece
	 */
	/**
	 * @typedef {CardSlotOwnProps & import('svelte/elements').HTMLAttributes<HTMLElement>} CardSlotProps
	 * @example
	 * <CardSlot />
	 * <CardSlot
	 *   size={75}
	 *   pickable
	 *   picked
	 *   value="c2r1"
	 *   onCardSlotPick={(event) => pick(event.value)} />
	 */
</script>

<script>
	import { ComponentEvent } from '../../component-event.js';

	/** @type {CardSlotProps} */
	let {
		size = 62,
		label,
		filled = false,
		pickable = false,
		picked = false,
		value,
		onCardSlotPick,
		children,
		...attr
	} = $props();

	/**
	 * @param {MouseEvent} event
	 */
	const clickHandler = (event) => {
		if (typeof onCardSlotPick === 'function') {
			const target = /** @type {HTMLButtonElement} */ (
				event.currentTarget
			);
			onCardSlotPick(new ComponentEvent(value, target, event));
		}
	};
</script>

{#if pickable}
	<button
		{...attr}
		type="button"
		class="rg-card-slot-surface rg-card-slot-surface--pickable {attr.class ??
			''}"
		class:rg-card-slot-surface--filled={filled}
		class:rg-card-slot-surface--picked={picked}
		aria-label={label}
		style:--card-slot-size={`${size}px`}
		onclick={clickHandler}>{@render children?.()}</button>
{:else}
	<span
		{...attr}
		class="rg-card-slot-surface {attr.class ?? ''}"
		class:rg-card-slot-surface--filled={filled}
		aria-label={label}
		style:--card-slot-size={`${size}px`}>{@render children?.()}</span>
{/if}
