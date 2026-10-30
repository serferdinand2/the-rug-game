<!-- The footer's income reveal (#122): what taking income does and its button, folding behind the turn label while a space is chosen. -->
<script module>
	/**
	 * Properties of the IncomeReveal component itself.
	 * @typedef {Object} IncomeRevealOwnProps
	 * @property {string} description - What taking income does, such as 'End this era, gain income and begin your next era.'
	 * @property {string} label - The button's text, such as 'Take income'
	 * @property {boolean} [folded=false] - Closed to nothing, and open while its parent element (in TurnBar, the turn label's group) is hovered or holds the focus
	 * @property {boolean} [disabled=false] - Inert with its button disabled, and closed even while its parent is hovered
	 * @property {Function} [onIncomeRevealClick] - Callback fired when the button is pressed
	 */

	/**
	 * Properties for the IncomeReveal component, including any attributes for its root element.
	 * @typedef {IncomeRevealOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} IncomeRevealProps
	 *
	 * @example
	 * <IncomeReveal
	 *   description="End this era, gain income and begin your next era."
	 *   label="Take income"
	 *   folded
	 *   onIncomeRevealClick={() => takeIncome()} />
	 */
</script>

<script>
	import Button from '../ui/Button.svelte';
	import { ComponentEvent } from '../../component-event.js';

	/** @type {IncomeRevealProps} */
	let {
		description,
		label,
		folded = false,
		disabled = false,
		onIncomeRevealClick,
		...attr
	} = $props();

	/**
	 * @param {import('../../component-event.js').ComponentEvent} event
	 */
	const clickHandler = (event) => {
		if (typeof onIncomeRevealClick === 'function') {
			onIncomeRevealClick(
				new ComponentEvent(undefined, event.target, event.originalEvent)
			);
		}
	};
</script>

<div
	{...attr}
	class="rg-income-reveal {attr.class ? attr.class : ''}"
	class:rg-income-reveal--folded={folded}
	class:rg-income-reveal--disabled={disabled}
	inert={disabled || undefined}>
	<div class="rg-income-reveal--inner">
		<span class="rg-income-reveal--explanation">{description}</span>
		<Button
			{disabled}
			onButtonClick={clickHandler}>{label}</Button>
	</div>
</div>

<style>
	.rg-income-reveal {
		max-width: 455px;
		margin-right: var(--space-6);
		overflow: hidden;
		opacity: 1;
		transition:
			max-width var(--duration-medium) var(--ease),
			margin-right var(--duration-medium) var(--ease),
			opacity var(--duration-fast) var(--ease);
	}

	.rg-income-reveal--folded {
		max-width: 0;
		margin-right: 0;
		opacity: 0;
	}

	/* A folded reveal opens while its parent, the turn label's group, is hovered or holds the focus. */
	:global(:hover)
		> .rg-income-reveal--folded:not(.rg-income-reveal--disabled),
	:global(:focus-within)
		> .rg-income-reveal--folded:not(.rg-income-reveal--disabled) {
		max-width: 455px;
		margin-right: var(--space-6);
		opacity: 1;
	}

	/* A fixed width, so the text does not reflow while the reveal slides open. */
	.rg-income-reveal--inner {
		display: flex;
		align-items: center;
		gap: var(--space-6);
		width: 455px;
		height: 40px;
		padding-right: var(--space-7);
		border-right: var(--border) solid var(--line);
	}

	.rg-income-reveal--explanation {
		flex: 1;
		color: var(--muted);
		font-size: var(--font-size-xs);
		line-height: var(--leading-tight);
	}
</style>
