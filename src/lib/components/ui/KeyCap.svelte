<!-- KeyCap: the key that does the same as a button, drawn small beside its word, as Show choice and Minimize first did (#149, #174). -->
<script module>
	/**
	 * Properties of the KeyCap component itself.
	 * @typedef {Object} KeyCapOwnProps
	 * @property {string} key - The key as How to play names it, such as 'I', 'Enter', 'Esc' or ','
	 */

	/**
	 * Properties for the KeyCap component, including any attributes for its root element.
	 * @typedef {KeyCapOwnProps & import('svelte/elements').HTMLAttributes<HTMLElement>} KeyCapProps
	 *
	 * @example
	 * <Button mode="primary" onButtonClick={advance}>Advance<KeyCap key="Enter" /></Button>
	 */
</script>

<script>
	/** @type {KeyCapProps} */
	let { key, ...attr } = $props();
</script>

<!-- Hidden from the button's name, which stays its word: the key repeats what How to play's shortcuts list. -->
<kbd
	aria-hidden="true"
	{...attr}
	class="rg-key-cap {attr.class ? attr.class : ''}">{key}</kbd>

<style>
	/* In its button's colour, a little quieter, so the word still leads. */
	.rg-key-cap {
		display: inline-block;
		min-width: 1.4em;
		margin-left: var(--space-4);
		padding: 0 var(--space-2);
		border: var(--border) solid currentColor;
		font: inherit;
		font-size: var(--font-size-xs);
		text-align: center;
		opacity: 0.75;
	}
</style>
