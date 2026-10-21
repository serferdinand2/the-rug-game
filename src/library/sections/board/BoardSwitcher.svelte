<!-- Library section: BoardSwitcher with each board chosen. -->
<script>
	import BoardSwitcher from '../../../lib/components/board/BoardSwitcher.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';

	/** @type {'tracks' | 'map'} */
	let tracksFirst = $state('tracks');
	/** @type {'tracks' | 'map'} */
	let mapFirst = $state('map');
</script>

<Section
	name="BoardSwitcher"
	area="board"
	description="The selector at the top of the shared area. The chosen board keeps the raised highlight, its upright title and its coloured icon; the other is a faint icon whose title is collapsed but still names the button.">
	<Example label={`value="${tracksFirst}"  (click the other board)`}>
		<BoardSwitcher bind:value={tracksFirst} />
	</Example>
	<Example label={`value="${mapFirst}"`}>
		<BoardSwitcher bind:value={mapFirst} />
	</Example>
</Section>
