<!-- The four advancement tracks stacked to fill the board's height, with one space selected across all of them. -->
<script module>
	/**
	 * One track on the board: the Track component's props without its selection and callback.
	 * @typedef {Object} TrackBoardTrack
	 * @property {import('../../ui.js').TrackId} id - The track, such as 'exploration'
	 * @property {string} name - The track's name, such as 'Exploration'
	 * @property {{ name: string, landmark?: string }[]} spaces - The twelve spaces, in order
	 * @property {import('../../ui.js').CostSymbol[][]} tiers - The four tier prices, I–IV
	 * @property {{ seat: import('../../ui.js').Seat, name: string, position: number }[]} players - The players' positions on this track
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
	 * @property {TrackBoardTrack[]} tracks - The four tracks, top to bottom
	 * @property {TrackBoardSelection[]} [available=[]] - Spaces the viewer can advance to, outlined in green
	 * @property {TrackBoardSelection | null} [selected=null] - The selected space, outlined in gold; bindable
	 * @property {Function} [onTrackBoardSelect] - Callback fired with { track, space } when a space is chosen
	 */

	/**
	 * Properties for the TrackBoard component, including any attributes for its root element.
	 * @typedef {TrackBoardOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} TrackBoardProps
	 *
	 * @example
	 * <TrackBoard
	 *   {tracks}
	 *   bind:selected
	 *   onTrackBoardSelect={(event) => showAdvance(event.value)}
	 * />
	 */
</script>

<script>
	import { ComponentEvent } from '../../component-event.js';
	import Track from './Track.svelte';

	/** @type {TrackBoardProps} */
	let {
		tracks,
		available = [],
		selected = $bindable(null),
		onTrackBoardSelect,
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
	class="rg-track-board {attr.class ? attr.class : ''}">
	{#each tracks as track (track.id)}
		<Track
			{...track}
			available={available
				.filter((entry) => entry.track === track.id)
				.map((entry) => entry.space)}
			selectedSpace={selected?.track === track.id ? selected.space : null}
			onTrackSelect={trackSelectHandler} />
	{/each}
</div>

<style>
	.rg-track-board {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		gap: var(--space-4);
		height: 100%;
		min-height: 0;
	}
</style>
