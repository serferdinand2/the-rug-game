<!-- The 58px header on every page: the brand at the left, a sentence or player chips in the centre, controls at the right. -->
<script module>
	/**
	 * Properties of the TopBar component itself.
	 * @typedef {Object} TopBarOwnProps
	 * @property {string} [brand='The Rug Game'] - The game's name at the left
	 * @property {string} [title] - A centred sentence, such as 'Build a civilization that stands the test of time'
	 * @property {import('svelte').Snippet} [center] - Centre content that replaces the title, such as the player chips; render them straight into it, without a wrapper, so they can shrink to fit
	 * @property {import('svelte').Snippet} [controls] - The controls at the right, such as the sound and menu buttons
	 * @property {boolean} [divider=true] - The thin rule along the bottom; false over the player overview
	 */

	/**
	 * Properties for the TopBar component, including any attributes for its root header.
	 * @typedef {TopBarOwnProps & import('svelte/elements').HTMLAttributes<HTMLElement>} TopBarProps
	 *
	 * @example
	 * <TopBar title="Build a civilization that stands the test of time">
	 *   {#snippet controls()}
	 *     <IconButton icon="sound" label="Mute" muted={muted} onIconButtonClick={() => (muted = !muted)} />
	 *     <IconButton icon="menu" label="Menu" expanded={menuOpen} onIconButtonClick={() => (menuOpen = !menuOpen)} />
	 *   {/snippet}
	 * </TopBar>
	 */
</script>

<script>
	/** @type {TopBarProps} */
	let {
		brand = 'The Rug Game',
		title,
		center,
		controls,
		divider = true,
		...attr
	} = $props();
</script>

<header
	{...attr}
	class="rg-top-bar {attr.class ? attr.class : ''}"
	class:rg-top-bar--divided={divider}>
	<div class="rg-top-bar--brand">{brand}</div>
	<div class="rg-top-bar--center">
		{#if center}
			{@render center()}
		{:else if title}
			<p class="rg-top-bar--title">{title}</p>
		{/if}
	</div>
	<div class="rg-top-bar--controls">
		{@render controls?.()}
	</div>
</header>

<style>
	/* The bottom border is always there, so the bar keeps its height when the rule is hidden. */
	.rg-top-bar {
		position: relative;
		z-index: var(--layer-bar);
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
		gap: 22px;
		height: var(--bar-height);
		padding: 0 var(--space-10);
		border-bottom: var(--border) solid transparent;
		background: var(--chrome);
	}

	.rg-top-bar--divided {
		border-bottom-color: var(--line);
	}

	.rg-top-bar--brand {
		color: var(--gold);
		font: var(--weight-bold) var(--font-size-2xl) / var(--leading-none)
			var(--font-title);
		letter-spacing: var(--letter-spacing-caps);
		white-space: nowrap;
	}

	/* Chips rendered here sit in a row and shrink when the header is narrow; a wrapper of their own would stop that. */
	.rg-top-bar--center {
		display: flex;
		justify-content: center;
		gap: var(--space-4);
		min-width: 0;
	}

	.rg-top-bar--title {
		margin: 0;
		color: var(--text);
		font: var(--weight-bold) var(--font-size-xl) / var(--leading-snug)
			var(--font-body);
		letter-spacing: var(--letter-spacing-button);
		text-align: center;
	}

	.rg-top-bar--controls {
		display: flex;
		align-items: center;
		justify-self: end;
		gap: var(--space-3);
	}
</style>
