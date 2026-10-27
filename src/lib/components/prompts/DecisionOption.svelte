<!-- One choice in a decision prompt: a pressable box with its words and optional symbols, gold while chosen. -->
<script module>
	/**
	 * Properties of the DecisionOption component itself.
	 * @typedef {Object} DecisionOptionOwnProps
	 * @property {string} label - The choice in words, such as 'Pay 1 food and 1 worker'
	 * @property {boolean} [pressed=false] - It is the chosen one
	 * @property {import('../../ui.js').CostSymbol[]} [symbols] - Resource symbols drawn before the words, native 24px
	 * @property {Function} [onDecisionOptionClick] - Callback fired when the choice is pressed
	 */

	/**
	 * Properties for the DecisionOption component, including any attributes for its root element.
	 * @typedef {DecisionOptionOwnProps & import('svelte/elements').HTMLButtonAttributes} DecisionOptionProps
	 *
	 * @example
	 * <DecisionOption label="Pay 1 food and 1 worker" symbols={['food', 'worker']} pressed onDecisionOptionClick={pick} />
	 */
</script>

<script>
	import ResourceIcon from '../ui/ResourceIcon.svelte';
	import { ComponentEvent } from '../../component-event.js';

	/** @type {DecisionOptionProps} */
	let {
		label,
		pressed = false,
		symbols = [],
		onDecisionOptionClick,
		...attr
	} = $props();

	/**
	 * @param {MouseEvent} event
	 */
	const clickHandler = (event) => {
		if (typeof onDecisionOptionClick === 'function') {
			onDecisionOptionClick(
				new ComponentEvent(
					label,
					/** @type {HTMLButtonElement} */ (event.currentTarget),
					event
				)
			);
		}
	};
</script>

<button
	type="button"
	aria-pressed={pressed}
	{...attr}
	class="rg-decision-option {attr.class ? attr.class : ''}"
	onclick={clickHandler}>
	{#if symbols.length}
		<span
			class="rg-decision-option--symbols"
			aria-hidden="true">
			{#each symbols as symbol, index (index)}
				<ResourceIcon
					{symbol}
					size="medium"
					decorative />
			{/each}
		</span>
	{/if}
	<span>{label}</span>
</button>

<style>
	.rg-decision-option {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-4);
		min-width: 140px;
		min-height: 58px;
		padding: var(--space-4) var(--space-6);
		border: var(--border) solid var(--line);
		border-radius: var(--radius);
		background: color-mix(in srgb, var(--raised) 70%, transparent);
		color: var(--text);
		text-align: left;
	}

	.rg-decision-option:hover,
	.rg-decision-option:focus-visible {
		border-color: var(--gold);
	}

	.rg-decision-option[aria-pressed='true'] {
		border-color: var(--gold);
		background: color-mix(in srgb, var(--gold) 17%, var(--surface));
		outline: var(--border) solid var(--gold);
	}

	.rg-decision-option--symbols {
		display: inline-flex;
		gap: var(--space-1);
	}
</style>
