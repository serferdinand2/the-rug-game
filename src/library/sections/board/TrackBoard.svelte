<!-- Library section: TrackBoard with a dealt game's four tracks (trackBoard(view), #131) and the mockup's players, at its real width and height. -->
<script module>
	import { trackBoard } from '../../../lib/board.js';
	import { boardView } from '../../models.js';

	/** @typedef {import('../../../lib/ui.js').TrackId} TrackId */

	/** The four tracks of a dealt game, with the play-page mockup's players at its spaces (#131). */
	export const BOARD_TRACKS = trackBoard(boardView());
</script>

<script>
	import TrackBoard from '../../../lib/components/board/TrackBoard.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';

	/** @type {{ track: TrackId, space: number } | null} */
	let selected = $state({ track: 'exploration', space: 5 });
</script>

<Section
	name="TrackBoard"
	area="board"
	description="The four advancement tracks stacked to fill the shared area's height, with one space selected across all of them.">
	<Example
		label={`tracks={trackBoard(view)} selected={${JSON.stringify(selected)}}  (hover, Tab or click the spaces)`}
		wide
		width={1428}>
		<div style="height: 892px">
			<TrackBoard
				tracks={BOARD_TRACKS}
				available={[
					{ track: 'exploration', space: 5 },
					{ track: 'science', space: 4 },
					{ track: 'technology', space: 6 },
				]}
				bind:selected />
		</div>
	</Example>
</Section>
