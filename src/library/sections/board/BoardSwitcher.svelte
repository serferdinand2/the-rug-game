<!-- Library section: BoardSwitcher with each board chosen, and with a band for the arts track, fifth (#120, #35). -->
<script>
	import BoardSwitcher from '../../../lib/components/board/BoardSwitcher.svelte';
	import { TRACKS } from '../../../lib/ui.js';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';

	/** The four tracks and Arts & Architecture's arts track (#35). */
	const FIVE_TRACKS = [
		...TRACKS.map((track) => track.id),
		/** @type {import('../../../lib/ui.js').TrackId} */ ('arts'),
	];

	/** @type {'tracks' | 'map'} */
	let tracksFirst = $state('tracks');
	/** @type {'tracks' | 'map'} */
	let mapFirst = $state('map');
	/** @type {'tracks' | 'map'} */
	let fiveTracks = $state('tracks');
</script>

<Section
	name="BoardSwitcher"
	area="board"
	description="The selector at the top of the shared area. The chosen board keeps the raised highlight, its upright title and its coloured icon; the other is a faint icon whose title is collapsed but still names the button. The tracks icon draws a band for every track it is given.">
	<Example label={`value="${tracksFirst}"  (click the other board)`}>
		<BoardSwitcher bind:value={tracksFirst} />
	</Example>
	<Example label={`value="${mapFirst}"`}>
		<BoardSwitcher bind:value={mapFirst} />
	</Example>
	<Example
		label={`value="${fiveTracks}" tracks={the four tracks and the arts track}`}>
		<BoardSwitcher
			bind:value={fiveTracks}
			tracks={FIVE_TRACKS} />
	</Example>
</Section>
