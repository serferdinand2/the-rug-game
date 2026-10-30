<!-- Library section: BoardSwitcher with each board chosen, and with a band for a stand-in fifth track (#120). -->
<script>
	import BoardSwitcher from '../../../lib/components/board/BoardSwitcher.svelte';
	import { TRACKS } from '../../../lib/ui.js';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';

	/** The four tracks and a stand-in fifth under the arts track's id, until #35 adds it. */
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
		label={`value="${fiveTracks}" tracks={the four tracks and a stand-in fifth}`}>
		<!-- The stand-in borrows Arts & Architecture's colour until #35 gives the arts track its own. -->
		<div style="--arts: var(--arts-architecture)">
			<BoardSwitcher
				bind:value={fiveTracks}
				tracks={FIVE_TRACKS} />
		</div>
	</Example>
</Section>
