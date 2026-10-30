<!-- Library section: PlayLayout, the game and results screens' frame, with its four parts, with an overlay over the middle, and with its areas out of reach. -->
<script>
	import TopBar from '../../../lib/components/ui/TopBar.svelte';
	import PlayLayout from '../../../lib/components/ui/PlayLayout.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';
</script>

{#snippet header()}
	<TopBar title="The header: GameHeader, or the results' PageHeader" />
{/snippet}

{#snippet shared()}
	<p class="rg-library-play-layout--note">
		The shared area, 3/4: the tracks or the map, or the final standings.
	</p>
{/snippet}

{#snippet player()}
	<p class="rg-library-play-layout--note">
		The player area, 1/4: the player tabs, or the result details.
	</p>
{/snippet}

{#snippet footer()}
	<div class="rg-library-play-layout--footer">
		The footer: TurnFooter, or the results' own bar
	</div>
{/snippet}

{#snippet overlays()}
	<div class="rg-library-play-layout--overlay">
		An overlay over the middle, such as the log
	</div>
{/snippet}

<Section
	name="PlayLayout"
	area="ui"
	description="The play screen's frame, which the game and results screens share: the header and footer bars, and between them the 3/4 shared area and the 1/4 player area on the pixel texture, 2px apart. The screens fill each part; here it is 320px tall instead of the window's height.">
	<Example
		label={'header shared player footer sharedLabel="Shared board" playerLabel="Your player area"'}
		surface="ink"
		wide>
		<PlayLayout
			style="--rg-play-layout-height: 320px;"
			sharedLabel="Shared board"
			playerLabel="Your player area"
			{header}
			{shared}
			{player}
			{footer} />
	</Example>
	<Example
		label={'overlays={…}  (positioned against the middle, as the log and the players overview)'}
		surface="ink"
		wide>
		<PlayLayout
			style="--rg-play-layout-height: 320px;"
			{header}
			{shared}
			{player}
			{footer}
			{overlays} />
	</Example>
	<Example
		label={'areasInert  (both areas out of reach, as under the players overview)'}
		surface="ink"
		wide>
		<PlayLayout
			style="--rg-play-layout-height: 320px;"
			areasInert
			{header}
			{shared}
			{player}
			{footer} />
	</Example>
</Section>

<style>
	.rg-library-play-layout--note {
		margin: 0;
		padding: var(--space-9);
		color: var(--muted);
	}

	.rg-library-play-layout--footer {
		display: flex;
		align-items: center;
		padding: 0 24px;
		border-top: var(--border) solid var(--line);
		background: var(--chrome);
		color: var(--muted);
	}

	.rg-library-play-layout--overlay {
		position: absolute;
		top: var(--space-6);
		right: var(--space-6);
		padding: var(--space-6) var(--space-9);
		border: var(--border) solid var(--line);
		background: var(--chrome);
	}
</style>
