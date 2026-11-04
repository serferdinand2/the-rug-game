<!-- The footer's income reveal (#122, #174): Take income and what taking income does, on the footer's right beside Advance; while a space is chosen, only its button shows. -->
<script module>
	/**
	 * Properties of the IncomeReveal component itself.
	 * @typedef {Object} IncomeRevealOwnProps
	 * @property {string} description - What taking income does, such as 'End this era, gain income and begin your next era.'
	 * @property {string} label - The button's text, such as 'Take income'
	 * @property {boolean} [folded=false] - Only the button shows, with the description as its title; the description opens while the reveal is hovered or holds the focus
	 * @property {boolean} [disabled=false] - Inert with its button disabled
	 * @property {string | null} [shortcut=null] - The key that takes income, drawn in the button (#174)
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
	 *   shortcut="I"
	 *   folded
	 *   onIncomeRevealClick={() => takeIncome()} />
	 */
</script>

<script>
	import Button from '../ui/Button.svelte';
	import KeyCap from '../ui/KeyCap.svelte';
	import { ComponentEvent } from '../../component-event.js';

	/** @type {IncomeRevealProps} */
	let {
		description,
		label,
		folded = false,
		disabled = false,
		shortcut = null,
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
	<span class="rg-income-reveal--explanation">{description}</span>
	<Button
		{disabled}
		title={folded ? description : undefined}
		onButtonClick={clickHandler}
		>{label}{#if shortcut}<KeyCap key={shortcut} />{/if}</Button>
</div>

<style>
	.rg-income-reveal {
		display: flex;
		align-items: center;
		gap: var(--space-6);
		min-width: 0;
	}

	.rg-income-reveal--explanation {
		max-width: 300px;
		overflow: hidden;
		color: var(--muted);
		font-size: var(--font-size-xs);
		line-height: var(--leading-tight);
		text-align: right;
		opacity: 1;
		transition:
			max-width var(--duration-medium) var(--ease),
			opacity var(--duration-fast) var(--ease);
	}

	/* While a space is chosen only the button shows; the words open while the reveal is hovered or focused. */
	.rg-income-reveal--folded .rg-income-reveal--explanation {
		max-width: 0;
		opacity: 0;
	}

	.rg-income-reveal--folded:not(.rg-income-reveal--disabled):hover
		.rg-income-reveal--explanation,
	.rg-income-reveal--folded:not(.rg-income-reveal--disabled):focus-within
		.rg-income-reveal--explanation {
		max-width: 300px;
		opacity: 1;
	}
</style>
