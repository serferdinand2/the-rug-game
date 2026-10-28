<!-- One lobby table setting on a single line: its title, a thin rule, then its choices at the right. -->
<script module>
	/**
	 * Properties of the SettingRow component itself.
	 * @typedef {Object} SettingRowOwnProps
	 * @property {string} label - The setting's title, such as 'Rules'
	 * @property {boolean} [divided=false] - A soft rule under the row, as between the lobby's variants (#98)
	 * @property {import('svelte').Snippet} [children] - The choices, usually a Segmented
	 */

	/**
	 * Properties for the SettingRow component, including any attributes for its root element.
	 * @typedef {SettingRowOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} SettingRowProps
	 *
	 * @example
	 * <SettingRow label="Rules">
	 *   <Segmented label="Rules" options={rulesOptions} bind:value={rules} />
	 * </SettingRow>
	 */
</script>

<script>
	/** @type {SettingRowProps} */
	let { label, divided = false, children, ...attr } = $props();
</script>

<div
	{...attr}
	class="rg-setting-row {attr.class ? attr.class : ''}"
	class:rg-setting-row--divided={divided}>
	<span class="rg-setting-row--label">{label}</span>
	<span
		class="rg-setting-row--rule"
		aria-hidden="true"></span>
	<div class="rg-setting-row--choices">
		{@render children?.()}
	</div>
</div>

<style>
	.rg-setting-row {
		display: grid;
		grid-template-columns: auto minmax(18px, 1fr) auto;
		align-items: center;
		gap: var(--space-4);
	}

	.rg-setting-row--divided {
		padding-bottom: var(--space-3);
		border-bottom: var(--border) solid var(--line-soft);
	}

	.rg-setting-row--label {
		font-weight: var(--weight-bold);
		white-space: nowrap;
	}

	.rg-setting-row--rule {
		height: var(--border);
		background: var(--line-soft);
	}

	.rg-setting-row--choices {
		display: flex;
		justify-content: flex-end;
		min-width: 0;
	}
</style>
