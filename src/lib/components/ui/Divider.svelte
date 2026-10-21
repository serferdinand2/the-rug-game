<!-- A thin horizontal rule, optionally paused by a short italic label such as "or join friends". -->
<script module>
	/**
	 * Properties of the Divider component itself.
	 * @typedef {Object} DividerOwnProps
	 * @property {string} [label] - Text in the middle of the rule, such as 'or join friends'; also names the separator
	 */

	/**
	 * Properties for the Divider component, including any attributes for its root element.
	 * @typedef {DividerOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} DividerProps
	 *
	 * @example
	 * <Divider label="or join friends" />
	 * <Divider />
	 */
</script>

<script>
	/** @type {DividerProps} */
	let { label, ...attr } = $props();
</script>

<div
	role="separator"
	aria-label={label}
	{...attr}
	class="rg-divider {attr.class ? attr.class : ''}"
	class:rg-divider--labelled={Boolean(label)}>
	{#if label}
		<span
			class="rg-divider--label"
			aria-hidden="true">{label}</span>
	{/if}
</div>

<style>
	.rg-divider {
		height: var(--border);
		margin: var(--space-3) 0;
		background: var(--line);
	}

	.rg-divider--labelled {
		display: flex;
		align-items: center;
		gap: var(--space-6);
		height: auto;
		background: none;
	}

	.rg-divider--labelled::before,
	.rg-divider--labelled::after {
		content: '';
		flex: 1;
		height: var(--border);
		background: var(--line);
	}

	.rg-divider--label {
		color: var(--muted);
		font-size: var(--font-size-sm);
		font-style: italic;
		white-space: nowrap;
	}
</style>
