<!-- A row of choices shown as pressed or unpressed buttons: one choice, or several when multiple. -->
<script module>
	/**
	 * One choice.
	 * @typedef {Object} SegmentedOption
	 * @property {string} value - Reported when chosen
	 * @property {string} label - The visible text
	 * @property {string} [color='var(--gold)'] - The choice's colour when selected, as a token reference
	 */

	/**
	 * Properties of the Segmented component itself.
	 * @typedef {Object} SegmentedOwnProps
	 * @property {SegmentedOption[]} options - The choices, in order
	 * @property {string | string[]} [value] - The chosen value, or values when multiple; bindable
	 * @property {boolean} [multiple=false] - Each choice toggles on its own, such as expansions
	 * @property {'tinted' | 'filled'} [variant='tinted'] - tinted: lobby settings; filled: the mode switch, filled with colour and dark text
	 * @property {string} label - Names the group for assistive technology, such as 'Rules'
	 * @property {Function} [onSegmentedChange] - Callback fired with the new value after a choice
	 */

	/**
	 * Properties for the Segmented component, including any attributes for its root element.
	 * @typedef {SegmentedOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} SegmentedProps
	 *
	 * @example
	 * <Segmented
	 *   label="Rules"
	 *   options={[
	 *     { value: 'current', label: 'Current rules', color: 'var(--science)' },
	 *     { value: 'original', label: 'Original 2019', color: 'var(--technology)' },
	 *   ]}
	 *   bind:value={rules}
	 * />
	 */
</script>

<script>
	import { ComponentEvent } from '../../component-event.js';

	/** @type {SegmentedProps} */
	let {
		options,
		value = $bindable(),
		multiple = false,
		variant = 'tinted',
		label,
		onSegmentedChange,
		...attr
	} = $props();

	/**
	 * @param {string} option
	 * @returns {boolean}
	 */
	const isSelected = (option) =>
		Array.isArray(value) ? value.includes(option) : value === option;

	/**
	 * @param {MouseEvent} event
	 * @param {string} option
	 */
	const optionClickHandler = (event, option) => {
		if (multiple) {
			const chosen = Array.isArray(value) ? value : [];
			value = chosen.includes(option)
				? chosen.filter((item) => item !== option)
				: [...chosen, option];
		} else {
			value = option;
		}
		if (typeof onSegmentedChange === 'function') {
			const target = /** @type {HTMLButtonElement} */ (
				event.currentTarget
			);
			onSegmentedChange(new ComponentEvent(value, target, event));
		}
	};
</script>

<div
	role="group"
	aria-label={label}
	{...attr}
	class="rg-segmented rg-segmented--{variant} {attr.class ? attr.class : ''}">
	{#each options as option (option.value)}
		<button
			type="button"
			class="rg-segmented--option"
			class:rg-segmented--selected={isSelected(option.value)}
			aria-pressed={isSelected(option.value)}
			style:--rg-segmented-color={option.color ?? 'var(--gold)'}
			onclick={(event) => optionClickHandler(event, option.value)}
			>{option.label}</button>
	{/each}
</div>

<style>
	.rg-segmented {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
	}

	.rg-segmented--option {
		padding: var(--space-2) var(--space-4);
		border: var(--border) solid var(--line);
		border-radius: var(--radius);
		background: var(--control);
		color: var(--muted);
		font-size: var(--font-size-sm);
		transition:
			background var(--duration-fast) var(--ease),
			border-color var(--duration-fast) var(--ease),
			color var(--duration-fast) var(--ease);
	}

	.rg-segmented--option:hover {
		border-color: var(--rg-segmented-color);
		color: var(--text);
	}

	.rg-segmented--tinted .rg-segmented--selected {
		border-color: var(--rg-segmented-color);
		background: color-mix(
			in srgb,
			var(--rg-segmented-color) 20%,
			var(--control)
		);
		color: color-mix(in srgb, var(--rg-segmented-color) 68%, var(--text));
		box-shadow: inset 0 0 0 1px
			color-mix(in srgb, var(--rg-segmented-color) 25%, transparent);
	}

	.rg-segmented--filled .rg-segmented--option {
		font-size: var(--font-size-xs);
	}

	.rg-segmented--filled .rg-segmented--selected,
	.rg-segmented--filled .rg-segmented--selected:hover {
		border-color: var(--rg-segmented-color);
		background: var(--rg-segmented-color);
		color: var(--ink);
	}
</style>
