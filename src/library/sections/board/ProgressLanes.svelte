<!-- Library section: ProgressLanes with four players, with and without the faint preview token, at the start and the end, and with five players sharing spaces. -->
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
	description="The players' tokens under a track (#174): each player's token stands on the bottom edge of the space it reached, side by side when they share one, and a faint token shows on the next space while it is hovered.">
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
		label={'players={You 0, Ana 12} preview={[1, 2]}  (lined up inside the first space; nothing after the last)'}
		wide
		width={1428}>
		<ProgressLanes
			players={ends}
			preview={[1, 2]} />
	</Example>
	<Example
		label={'players={five players, two pairs sharing a space}'}
		wide
		width={1428}>
		<ProgressLanes players={five} />
	</Example>
</Section>
