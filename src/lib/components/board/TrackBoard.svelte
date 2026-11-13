<!-- The advancement tracks stacked to fill the board's height, four or five of them (#120), with one space selected across all of them. -->
<script module>
	/**
	 * One track on the board: the Track component's props without its selection and callback.
	 * @typedef {Object} TrackBoardTrack
	 * @property {import('../../ui.js').TrackId} id - The track, such as 'exploration'
	 * @property {string} name - The track's name, such as 'Exploration'
	 * @property {import('./Track.svelte').TrackSpaceEntry[]} spaces - The twelve spaces, in order, with their benefits and bonuses
	 * @property {import('../../ui.js').PriceSymbol[][]} tiers - The four tier prices, I–IV
	 * @property {{ seat: import('../../ui.js').Seat, name: string, position: number, still?: boolean }[]} players - The players' positions on this track; `still` moves a token without a hop (#179); Twin Impact uses an unused seat colour
	 */

	/**
	 * A chosen space.
	 * @typedef {Object} TrackBoardSelection
	 * @property {import('../../ui.js').TrackId} track
	 * @property {number} space - 1–12
	 */

	/**
	 * Properties of the TrackBoard component itself.
	 * @typedef {Object} TrackBoardOwnProps
	 * @property {TrackBoardTrack[]} tracks - The tracks, top to bottom: the base game's four, or five with the arts track; each shares the board's height
	 * @property {TrackBoardSelection[]} [available=[]] - Spaces the viewer can advance to, outlined in green
	 * @property {import('../../ui.js').Seat | null} [viewerSeat=null] - The viewer whose progress highlights on track hover
	 * @property {import('../../ui.js').Seat | null} [previewSeat=null] - The player taking the turn at this screen, whose faint token previews a hovered or focused legal next space; null previews no token (#81)
	 * @property {TrackBoardSelection | null} [selected=null] - The selected space, outlined in gold; bindable
	 * @property {{ track: string, space: number, color: string } | null} [lit=null] - A space another player just advanced to, lit in their colour while their action shows (#153)
	 * @property {Function} [onTrackBoardSelect] - Callback fired with { track, space } when a space is chosen
	 * @property {import('svelte').Snippet<[import('../../ui.js').TrackId]>} [heading] - Drawn on a track's line after its name, given the track: the arts track's masterpiece row (#35)
	 */

	/**
	 * Properties for the TrackBoard component, including any attributes for its root element.
	 * @typedef {TrackBoardOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} TrackBoardProps
	 *
	 * @example
	 * <TrackBoard
	 *   {tracks}
	 *   previewSeat={1}
	 *   bind:selected
	 *   onTrackBoardSelect={(event) => showAdvance(event.value)}
	 * />
	 */
</script>

<script>
	import { ComponentEvent } from '../../component-event.js';
	import { SPACE_COUNT } from '../../track-shape.js';
	import Track from './Track.svelte';

	/** @type {TrackBoardProps} */
	let {
		tracks,
		viewerSeat = null,
		available = [],
		previewSeat = null,
		selected = $bindable(null),
		lit = null,
		onTrackBoardSelect,
		heading: trackHeading,
		...attr
	} = $props();

	/**
	 * @param {ComponentEvent} event
	 */
	const trackSelectHandler = (event) => {
		selected = event.value;
		if (typeof onTrackBoardSelect === 'function') {
			onTrackBoardSelect(
				new ComponentEvent(
					event.value,
					event.target,
					event.originalEvent
				)
			);
		}
	};
</script>

<div
	{...attr}
	class="rg-track-board {attr.class ? attr.class : ''}"
	style:--rg-track-board-count={Math.max(1, tracks.length)}
	style:--rg-track-board-spaces={tracks[0]?.spaces.length || SPACE_COUNT}>
	{#each tracks as track (track.id)}
		<Track
			{...track}
			{viewerSeat}
			available={available
				.filter((entry) => entry.track === track.id)
				.map((entry) => entry.space)}
			{previewSeat}
			selectedSpace={selected?.track === track.id ? selected.space : null}
			lit={lit?.track === track.id ? lit : null}
			onTrackSelect={trackSelectHandler}>
			{#snippet heading()}
				{@render trackHeading?.(track.id)}
			{/snippet}
		</Track>
	{/each}
</div>

<style>
	/* A size container, so a space can take the height the board has to spare (#59): the board's share for one track
	   less the track's chrome, between 48px and 1.25 times a space's width. The chrome is Track's heading and price
	   rows, its three row gaps and the lanes' top padding (each --space-1), and the lanes' box: the lower half of the
	   players' tokens. */
	.rg-track-board {
		--rg-track-board-chrome: calc(
			var(--track-heading) + var(--track-prices) + 4 * var(--space-1) +
				var(--track-token) / 2
		);
		--rg-track-space-aspect: auto;
		--rg-track-space-height: clamp(
			48px,
			calc(
				(100cqh - (var(--rg-track-board-count) - 1) * var(--space-4)) /
					var(--rg-track-board-count) - var(--rg-track-board-chrome)
			),
			calc(100cqw / var(--rg-track-board-spaces) * 1.25)
		);
		container-type: size;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		gap: var(--space-4);
		height: 100%;
		min-height: 0;
	}
</style>
