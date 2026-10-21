<!-- A chrome panel with a thin border and an optional heading, as on the launch and lobby pages. -->
<script module>
	/**
	 * Properties of the Panel component itself.
	 * @typedef {Object} PanelOwnProps
	 * @property {string} [title] - The heading, such as 'Open tables'; also names the section for assistive technology
	 * @property {import('svelte').Snippet} [heading] - A heading row with more than a title, such as 'Players' and '2 of 5 joined'; it replaces the visible title, and an h2 inside it gets the title's look
	 * @property {'small' | 'medium' | 'large'} [padding='medium'] - small: 10px 14px, the lobby; medium: 18px 20px; large: 22px 24px, the launch page
	 * @property {import('svelte').Snippet} [children] - The panel's content
	 */

	/**
	 * Properties for the Panel component, including any attributes for its root section.
	 * @typedef {PanelOwnProps & import('svelte/elements').HTMLAttributes<HTMLElement>} PanelProps
	 *
	 * @example
	 * <Panel title="Open tables">…</Panel>
	 *
	 * <Panel title="Players" padding="small">
	 *   {#snippet heading()}
	 *     <h2>Players</h2>
	 *     <span class="count">2 of 5 joined</span>
	 *   {/snippet}
	 *   …
	 * </Panel>
	 */
</script>

<script>
	/** @type {PanelProps} */
	let { title, heading, padding = 'medium', children, ...attr } = $props();
</script>

<section
	aria-label={title}
	{...attr}
	class="rg-panel rg-panel--{padding} {attr.class ? attr.class : ''}">
	{#if heading}
		<div class="rg-panel--heading">{@render heading()}</div>
	{:else if title}
		<div class="rg-panel--heading">
			<h2 class="rg-panel--title">{title}</h2>
		</div>
	{/if}
	{@render children?.()}
</section>

<style>
	.rg-panel {
		border: var(--border) solid var(--line-soft);
		border-radius: var(--radius);
		background: var(--chrome);
	}

	.rg-panel--small {
		padding: var(--space-5) var(--space-7);
	}

	.rg-panel--medium {
		padding: 18px var(--space-9);
	}

	.rg-panel--large {
		padding: 22px var(--space-10);
	}

	.rg-panel--heading {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-6);
		margin-bottom: var(--space-6);
	}

	.rg-panel--small .rg-panel--heading {
		margin-bottom: var(--space-4);
	}

	.rg-panel--medium .rg-panel--heading {
		margin-bottom: var(--space-7);
	}

	.rg-panel--title,
	.rg-panel--heading :global(h2) {
		margin: 0;
		color: var(--text);
		font: var(--weight-bold) var(--font-size-lg) / var(--leading-snug)
			var(--font-body);
	}
</style>
