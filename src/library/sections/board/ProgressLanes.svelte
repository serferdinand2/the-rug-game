<!-- Library section: ProgressLanes with four players, with and without the dashed preview, and with fewer and more players. -->
<script>
	import ProgressLanes from '../../../lib/components/board/ProgressLanes.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';
	import { BOARD_TRACKS } from './TrackBoard.svelte';

	// Exploration in the board's review game (#131): You 4, Ana 2, Marko 5, Vera 1.
	const players = BOARD_TRACKS[0].players;

	/** @type {{ seat: import('../../../lib/ui.js').Seat, name: string, position: number }[]} */
	const ends = [
		{ seat: 1, name: 'You', position: 0 },
		{ seat: 2, name: 'Ana', position: 12 },
	];

	/** @type {{ seat: import('../../../lib/ui.js').Seat, name: string, position: number }[]} */
	const five = [
		{ seat: 1, name: 'You', position: 3 },
		{ seat: 2, name: 'Ana', position: 7 },
		{ seat: 3, name: 'Marko', position: 3 },
		{ seat: 4, name: 'Vera', position: 9 },
		{ seat: 5, name: 'Iva', position: 1 },
	];
</script>

<Section
	name="ProgressLanes"
	area="board"
	description="The players' progress under a track: one lane per player, ending in the approved player-color token SVG, with a dashed preview to the next space while it is hovered.">
	<Example
		label={'players={You 4, Ana 2, Marko 5, Vera 1}'}
		wide
		width={1428}>
		<ProgressLanes {players} />
	</Example>
	<Example
		label={'players={…} preview={1}'}
		wide
		width={1428}>
		<ProgressLanes
			{players}
			preview={1} />
	</Example>
	<Example
		label={'players={…} preview={[1, 2, 3, 4]}'}
		wide
		width={1428}>
		<ProgressLanes
			{players}
			preview={[1, 2, 3, 4]} />
	</Example>
	<Example
		label={'players={You 0, Ana 12} preview={[1, 2]}  (from the start; nothing after the last space)'}
		wide
		width={1428}>
		<ProgressLanes
			players={ends}
			preview={[1, 2]} />
	</Example>
	<Example
		label={'players={five players}'}
		wide
		width={1428}>
		<ProgressLanes players={five} />
	</Example>
</Section>
