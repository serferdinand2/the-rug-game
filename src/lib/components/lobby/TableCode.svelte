<!-- The lobby's table code: a small read-only TextInput and a COPY button that reports the code to copy. -->
<script module>
	/**
	 * Properties of the TableCode component itself.
	 * @typedef {Object} TableCodeOwnProps
	 * @property {string} code - The 8-character table code
	 * @property {string} [label='Table code'] - Names the field for assistive technology
	 * @property {Function} [onTableCodeCopy] - Callback fired with { code } when COPY is pressed; the parent copies it and confirms
	 */

	/**
	 * Properties for the TableCode component, including any attributes for its root element.
	 * @typedef {TableCodeOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} TableCodeProps
	 *
	 * @example
	 * <TableCode
	 *   code="DAWN2048"
	 *   onTableCodeCopy={(event) => copyToClipboard(event.value.code)} />
	 */
</script>

<script>
	import Button from '../ui/Button.svelte';
	import TextInput from '../ui/TextInput.svelte';
	import { ComponentEvent } from '../../component-event.js';

	/** @type {TableCodeProps} */
	let { code, label = 'Table code', onTableCodeCopy, ...attr } = $props();

	/**
	 * Selects the whole code, so it can also be copied by hand.
	 * @param {import('../../component-event.js').ComponentEvent} event
	 */
	const fieldFocusHandler = (event) => {
		/** @type {HTMLInputElement} */ (event.target).select();
	};

	/**
	 * @param {import('../../component-event.js').ComponentEvent} event
	 */
	const copyButtonClickHandler = (event) => {
		if (typeof onTableCodeCopy === 'function') {
			onTableCodeCopy(
				new ComponentEvent({ code }, event.target, event.originalEvent)
			);
		}
	};
</script>

<div
	{...attr}
	class="rg-table-code {attr.class ? attr.class : ''}">
	<TextInput
		size="small"
		{label}
		hideLabel
		readonly
		value={code}
		onTextInputFocus={fieldFocusHandler} />
	<Button
		size="small"
		aria-label="Copy the table code"
		onButtonClick={copyButtonClickHandler}>COPY</Button>
</div>

<style>
	.rg-table-code {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
	}
</style>
