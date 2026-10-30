<!-- The play screen's frame (#105): the header and footer bars, and between them the 3/4 shared area and the 1/4 player area on the pixel texture, as the game and results screens share it. -->
<script module>
	/**
	 * Properties of the PlayLayout component itself.
	 * @typedef {Object} PlayLayoutOwnProps
	 * @property {import('svelte').Snippet} header - The top bar, such as the game's header
	 * @property {import('svelte').Snippet} shared - The shared area's content, the left 3/4; it fills the area, so it sets its own padding and scrolling
	 * @property {import('svelte').Snippet} player - The player area's content, the right 1/4, filled the same way
	 * @property {import('svelte').Snippet} footer - The bottom bar, such as the turn footer
	 * @property {import('svelte').Snippet} [overlays] - What lies over the middle, such as the players overview and the log, positioned against it
	 * @property {string} [sharedLabel] - Names the shared area, such as 'Shared board'
	 * @property {string} [playerLabel] - Names the player area, such as 'Your player area'
	 * @property {boolean} [areasInert=false] - Both areas are out of reach, as under the players overview
	 */

	/**
	 * Properties for the PlayLayout component, including any attributes for its root element. It is the window's
	 * height, or `--rg-play-layout-height`, as on the library page.
	 * @typedef {PlayLayoutOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} PlayLayoutProps
	 *
	 * @example
	 * <PlayLayout sharedLabel="Shared board" playerLabel="Your player area">
	 *   {#snippet header()}<GameHeader … />{/snippet}
	 *   {#snippet shared()}<div class="board">…</div>{/snippet}
	 *   {#snippet player()}<PlayerTabs … />{/snippet}
	 *   {#snippet footer()}<TurnFooter … />{/snippet}
	 * </PlayLayout>
	 */
</script>

<script>
	/** @type {PlayLayoutProps} */
	let {
		header,
		shared,
		player,
		footer,
		overlays,
		sharedLabel,
		playerLabel,
		areasInert = false,
		...attr
	} = $props();
</script>

<div
	{...attr}
	class="rg-play-layout {attr.class ? attr.class : ''}">
	{@render header()}
	<div class="rg-play-layout--middle">
		<main
			class="rg-play-layout--shared"
			aria-label={sharedLabel}
			inert={areasInert}>
			{@render shared()}
		</main>
		<aside
			class="rg-play-layout--player"
			aria-label={playerLabel}
			inert={areasInert}>
			{@render player()}
		</aside>
		{@render overlays?.()}
	</div>
	{@render footer()}
</div>

<style>
	.rg-play-layout {
		display: grid;
		grid-template-rows: var(--bar-height) minmax(0, 1fr) var(--bar-height);
		height: var(--rg-play-layout-height, 100vh);
		min-height: 0;
		overflow: hidden;
	}

	/* The overlays are positioned against the middle, between the bars. */
	.rg-play-layout--middle {
		position: relative;
		display: grid;
		grid-template-columns: var(--play-columns);
		gap: var(--play-gap);
		min-height: 0;
		background: var(--ink);
	}

	/* Each area is one cell its content fills, so the content's own padding, layout and scrolling decide the rest. */
	.rg-play-layout--shared,
	.rg-play-layout--player {
		display: grid;
		grid-template: minmax(0, 1fr) / minmax(0, 1fr);
		min-width: 0;
		min-height: 0;
		overflow: hidden;
		background: var(--texture) var(--surface);
	}
</style>
