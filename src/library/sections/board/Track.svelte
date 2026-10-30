<!-- Library section: Track at its real width, with hover previews, a selected space and a two-player table. -->
<script>
	import Track from '../../../lib/components/board/Track.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';
	import { BOARD_TRACKS } from './TrackBoard.svelte';

	const [exploration, science, , military] = BOARD_TRACKS;

	// You and Ana share Navigation (space 4), so a preview of every line would suggest both tokens move (#81).
	const sharing = exploration.players.map((player) =>
		player.seat === 2 ? { ...player, position: 4 } : player
	);

	/** @type {number | null} */
	let selectedSpace = $state(null);
</script>

<Section
	name="Track"
	area="board"
	description="One advancement track: its name and rule, four tier prices over three spaces each, twelve spaces and one progress lane per player. Hovering or focusing a space turns its tier price gold and, when it is the next space of the player taking the turn (previewSeat), shows that player's dashed line to it and no one else's (#81).">
	<Example
		label={`id="exploration" previewSeat={1} players={You 4, Ana 4, Marko 5, Vera 1} selectedSpace={${selectedSpace}}  (hover space 5: only your line dashes; Tab, click)`}
		wide
		width={1428}>
		<Track
			{...exploration}
			players={sharing}
			previewSeat={1}
			bind:selectedSpace />
	</Example>
	<Example
		label={'id="military" selectedSpace={7}  (no previewSeat, as on another player\'s turn: hovering dashes no line)'}
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
