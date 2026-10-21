<!-- Library section: Track at its real width, with hover previews, a selected space and a two-player table. -->
<script>
	import Track from '../../../lib/components/board/Track.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';
	import { BOARD_TRACKS } from './TrackBoard.svelte';

	const [exploration, science, , military] = BOARD_TRACKS;

	/** @type {number | null} */
	let selectedSpace = $state(null);
</script>

<Section
	name="Track"
	area="board"
	description="One advancement track: its name and rule, four tier prices over three spaces each, twelve spaces and one progress lane per player. Hovering or focusing a space turns its tier price gold and shows the dashed line of every player whose next space it is.">
	<Example
		label={`id="exploration" selectedSpace={${selectedSpace}}  (hover space 5 or 6, Tab, click)`}
		wide
		width={1428}>
		<Track
			{...exploration}
			bind:selectedSpace />
	</Example>
	<Example
		label={'id="military" selectedSpace={7}'}
		wide
		width={1428}>
		<Track
			{...military}
			selectedSpace={7} />
	</Example>
	<Example
		label={'id="science" players={two players}  (no empty lanes)'}
		wide
		width={1428}>
		<Track
			{...science}
			players={science.players.slice(0, 2)} />
	</Example>
</Section>
