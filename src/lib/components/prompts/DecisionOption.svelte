<!-- One choice in a decision prompt: a pressable box with its words and optional symbols, gold while chosen, dimmed while it can't be picked. -->
<script module>
	/**
	 * Properties of the DecisionOption component itself.
	 * @typedef {Object} DecisionOptionOwnProps
	 * @property {string} label - The choice in words, such as 'Pay 1 food and 1 worker'
	 * @property {boolean} [pressed=false] - It is the chosen one
	 * @property {import('../../ui.js').CostSymbol[]} [symbols] - Resource symbols drawn before the words, native 24px
	 * @property {import('./PromptArt.svelte').PromptArtItem[]} [art] - Pictures drawn above the words at 48px
	 * @property {number | null} [vp=null] - A small gold '+n VP' badge in the corner (VpTag)
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
	import PromptArt from './PromptArt.svelte';
	import VpTag from './VpTag.svelte';
	import { ComponentEvent } from '../../component-event.js';

	/** @type {DecisionOptionProps} */
	let {
		label,
		pressed = false,
		symbols = [],
		art = [],
		vp = null,
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
	class:rg-decision-option--has-art={art.length > 0}
	onclick={clickHandler}>
	{#if vp !== null}
		<VpTag value={vp} />
	{/if}
	{#if art.length}
		<span
			class="rg-decision-option--art"
			aria-hidden="true">
			{#each art as item, index (index)}
				<PromptArt {item} />
			{/each}
		</span>
	{/if}
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
	<span class="rg-decision-option--label">{label}</span>
</button>

<style>
	.rg-decision-option {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-4);
		min-width: 140px;
		min-height: 58px;
		padding: var(--space-4) var(--space-6);
		border: var(--border) solid var(--line);
		border-radius: var(--radius);
		background: var(--choice-fill);
		color: var(--text);
		text-align: left;
	}

	/* Unpickable now, as a trade the player can't pay for; hover leaves it be, as a disabled tile. */
	.rg-decision-option:disabled {
		opacity: var(--opacity-unpickable);
		cursor: default;
	}

	.rg-decision-option:not(:disabled):hover,
	.rg-decision-option:focus-visible {
		border-color: var(--gold);
	}

	/* Chosen: the thick gold ring of a picked tile or resource (owner, 2026-10-30). */
	.rg-decision-option[aria-pressed='true'] {
		border-color: var(--gold);
		background: var(--picked-fill);
		outline: var(--border-thick) solid var(--gold);
	}

	/* Focus on the chosen one: its solid ring hugging the border turns dashed and stands off, so focus reads apart
	   from the choice. */
	.rg-decision-option[aria-pressed='true']:focus-visible {
		outline-style: dashed;
		outline-offset: var(--focus-offset);
	}

	.rg-decision-option--symbols {
		display: inline-flex;
		gap: var(--space-1);
	}

	.rg-decision-option--has-art {
		flex-direction: column;
	}

	.rg-decision-option--art {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-4);
	}
</style>
