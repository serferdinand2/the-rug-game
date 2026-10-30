<!-- VpSources: where a player's VP came from, one line per source with its VP, as the scoreboard and the final standings list them. -->
<script module>
	/**
	 * Properties of the VpSources component itself.
	 * @typedef {Object} VpSourcesOwnProps
	 * @property {import('../../results.js').SourceLine[]} sources - From vpBreakdown(seat), adding up to the seat's VP
	 * @property {1 | 2} [columns=1] - One compact column (the scoreboard) or two (the final standings)
	 * @property {string} [empty=''] - The words shown when there are no sources; nothing is drawn without them
	 */

	/**
	 * Properties for the VpSources component, including any attributes for its root list.
	 * @typedef {VpSourcesOwnProps & import('svelte/elements').HTMLAttributes<HTMLElement>} VpSourcesProps
	 *
	 * @example
	 * <VpSources sources={row.sources} columns={2} empty="No VP this game." />
	 */
</script>

<script>
	/** @type {VpSourcesProps} */
	let { sources, columns = 1, empty = '', ...attr } = $props();
</script>

{#if sources.length}
	<dl
		{...attr}
		class="rg-vp-sources {attr.class ? attr.class : ''}"
		class:rg-vp-sources--two={columns === 2}>
		{#each sources as source (source.id)}
			<div>
				<dt>{source.label}</dt>
				<dd>{source.vp} VP</dd>
			</div>
		{/each}
	</dl>
{:else if empty}
	<p
		{...attr}
		class="rg-vp-sources--none {attr.class ? attr.class : ''}">
		{empty}
	</p>
{/if}

<style>
	.rg-vp-sources {
		display: grid;
		gap: var(--space-1);
		margin: 0;
	}

	.rg-vp-sources div {
		display: flex;
		justify-content: space-between;
		gap: var(--space-4);
	}

	.rg-vp-sources--two {
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--space-4) 30px;
	}

	.rg-vp-sources--two div {
		gap: var(--space-6);
		min-width: 0;
	}

	.rg-vp-sources dt {
		color: var(--muted);
	}

	.rg-vp-sources--none {
		margin: 0;
		color: var(--muted);
	}

	.rg-vp-sources dd {
		margin: 0;
		font-weight: var(--weight-bold);
	}

	.rg-vp-sources--two dd {
		white-space: nowrap;
	}
</style>
