<!-- Library section: ProgressLanes with its viewer-only hover line, faint preview token, shared spaces, and token motion (#174, #175), still under Skip all (#179). -->
<script>
	import ProgressLanes from '../../../lib/components/board/ProgressLanes.svelte';
	import Button from '../../../lib/components/ui/Button.svelte';
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

	/** The hopping example's players (#175): You advance by the buttons, Ana stays on 2. */
	let you = $state(1);
	/** Skip all's move (#179): the token goes to its space without a hop, for one drawing. */
	let still = $state(false);
	let hopping = $derived([
		{ seat: /** @type {const} */ (1), name: 'You', position: you, still },
		{ seat: /** @type {const} */ (2), name: 'Ana', position: 2, still },
	]);

	/** Moves You 3 spaces still, as Skip all puts the tokens on their spaces. */
	const stillClickHandler = () => {
		still = true;
		you = Math.min(12, you + 3);
		setTimeout(() => (still = false));
	};
</script>

<Section
	name="ProgressLanes"
	area="board"
	description="The players' tokens under a track (#174): each player's token stands on the bottom edge of the space it reached. Hovering a track space or token shows only the viewer's current progress in their colour with a glow in the track colour, underneath every token. A legal next space can still show its faint preview token. When a position changes, the token hops space by space, squashes as it lands and spreads a ring in its colour (#175): 170 ms a hop, the whole run within the focal 600 ms; nothing hops when a track first shows, nor with reduced motion. A player marked still goes to a new space at once, without a hop or a slide, as Skip all leaves every token on its final space (#179).">
	<Example
		label={`players={You ${you}, Ana 2}  (press to advance or go back)`}
		wide
		width={1428}>
		<div class="rg-library-progress-lanes--hop">
			<ProgressLanes players={hopping} />
			<span class="rg-library-progress-lanes--buttons">
				<Button
					size="small"
					disabled={you >= 12}
					onButtonClick={() => (you = Math.min(12, you + 1))}
					>Advance 1</Button>
				<Button
					size="small"
					disabled={you >= 12}
					onButtonClick={() => (you = Math.min(12, you + 3))}
					>Advance 3</Button>
				<Button
					size="small"
					onButtonClick={() => (you = you >= 12 ? 0 : 12)}
					>{you >= 12
						? 'Back to the start'
						: 'Advance to 12'}</Button>
				<Button
					size="small"
					disabled={you <= 0}
					onButtonClick={() => (you = Math.max(0, you - 2))}
					>Back 2</Button>
				<Button
					size="small"
					disabled={you >= 12}
					onButtonClick={stillClickHandler}
					>Skip all: 3 at once</Button>
			</span>
		</div>
	</Example>
	<Example
		label={'players={You 4, Ana 2, Marko 5, Vera 1}'}
		wide
		width={1428}>
		<ProgressLanes {players} />
	</Example>
	<Example
		label={'viewerSeat={1} hovered  (only You’s progress line)'}
		wide
		width={1428}>
		<ProgressLanes
			{players}
			viewerSeat={1}
			hovered
			progressEnd={3.5 / 12} />
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

<style>
	/* Room above the lanes for the hopping token, and the buttons below them. */
	.rg-library-progress-lanes--hop {
		display: grid;
		gap: var(--space-9);
		padding-top: var(--space-9);
	}

	.rg-library-progress-lanes--buttons {
		display: flex;
		gap: var(--space-5);
	}
</style>
