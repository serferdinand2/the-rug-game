<!-- Library section: TrackBoard with a dealt game's four tracks (trackBoard(view), #131) and the mockup's players, at its real width and height, and with a stand-in fifth track (#120). -->
<script module>
	import { trackBoard } from '../../../lib/board.js';
	import { boardView } from '../../models.js';

	/** @typedef {import('../../../lib/ui.js').TrackId} TrackId */

	/** The four tracks of a dealt game, with the play-page mockup's players at its spaces (#131). */
	export const BOARD_TRACKS = trackBoard(boardView());

	/**
	 * The same tracks with Ana moved up to You on Mathematics (science 2), so both share Herbalism as their next space
	 * and only the previewSeat's line may dash there (#81).
	 * @type {typeof BOARD_TRACKS}
	 */
	const SHARED_TRACKS = BOARD_TRACKS.map((track) =>
		track.id === 'science'
			? {
					...track,
					players: track.players.map((player) =>
						player.seat === 2 ? { ...player, position: 2 } : player
					),
				}
			: track
	);

	/**
	 * The four tracks and a stand-in fifth, as Arts & Architecture will have (#120): a copy of Science under the arts
	 * track's id, only to show that five fit. #35 brings the arts track's own spaces and colour.
	 * @type {typeof BOARD_TRACKS}
	 */
	const FIVE_TRACKS = [
		...BOARD_TRACKS,
		{
			...BOARD_TRACKS[1],
			id: /** @type {TrackId} */ ('arts'),
			name: 'Arts (stand-in)',
		},
	];
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
	description="The advancement tracks stacked to fill the shared area's height, with one space selected across all of them. Each track takes an equal share, so the base game's four and Arts & Architecture's five both fit. Hovering a space previews only the previewSeat's line: You and Ana share Mathematics, and hovering Herbalism dashes only your line (#81).">
	<Example
		label={`tracks={trackBoard(view), Ana on Mathematics} previewSeat={1} selected={${JSON.stringify(selected)}}  (hover, Tab or click the spaces)`}
		wide
		width={1428}>
		<div style="height: 892px">
			<TrackBoard
				tracks={SHARED_TRACKS}
				previewSeat={1}
				available={[
					{ track: 'exploration', space: 5 },
					{ track: 'science', space: 4 },
					{ track: 'technology', space: 6 },
				]}
				bind:selected />
		</div>
	</Example>
	<Example
		label={'tracks={the four tracks and a stand-in fifth}  (five tracks share the same height at 1920×1080, #120)'}
		wide
		width={1428}>
		<!-- The stand-in borrows Arts & Architecture's colour until #35 gives the arts track its own. -->
		<div style="height: 892px; --arts: var(--arts-architecture)">
			<TrackBoard tracks={FIVE_TRACKS} />
		</div>
	</Example>
</Section>
