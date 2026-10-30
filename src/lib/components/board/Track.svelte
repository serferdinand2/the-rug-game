<!-- One advancement track: its name, the four tier prices, the twelve spaces and the players' progress lanes. -->
<script module>
	/**
	 * One space on the track.
	 * @typedef {Object} TrackSpaceEntry
	 * @property {string} name - The space's name, such as 'Ships'
	 * @property {string} [landmark] - The landmark the first player here takes, such as 'Lighthouse'
	 * @property {import('../../glyphs.js').Glyph[]} [benefit] - The benefit's symbols (#59)
	 * @property {import('../../glyphs.js').BonusGlyphs | null} [bonus] - The bonus's price and gain
	 * @property {string} [words] - The benefit and bonus in words
	 */

	/**
	 * One player's progress on the track.
	 * @typedef {Object} TrackPlayer
	 * @property {import('../../ui.js').Seat} seat - The player's seat, which sets the line's colour
	 * @property {string} name - The player's name
	 * @property {number} position - Spaces reached, 0 (the start) to 12
	 */

	/**
	 * Properties of the Track component itself.
	 * @typedef {Object} TrackOwnProps
	 * @property {import('../../ui.js').TrackId} id - The track, which sets the colours
	 * @property {string} name - The track's name, such as 'Exploration'
	 * @property {TrackSpaceEntry[]} spaces - The twelve spaces, in order
	 * @property {import('../../ui.js').CostSymbol[][]} tiers - The four tier prices, I–IV, each over three spaces
	 * @property {TrackPlayer[]} players - The players at the table, one progress lane each
	 * @property {number[]} [available=[]] - Space numbers the viewer can advance to, outlined in green
	 * @property {number | null} [selectedSpace=null] - The selected space's number, outlined in gold; bindable
	 * @property {Function} [onTrackSelect] - Callback fired with { track, space } when a space is chosen
	 */

	/**
	 * Properties for the Track component, including any attributes for its root element.
	 * @typedef {TrackOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} TrackProps
	 *
	 * @example
	 * <Track
	 *   id="exploration"
	 *   name="Exploration"
	 *   spaces={[{ name: 'Scouting' }, … , { name: 'Warpgates' }]}
	 *   tiers={[['any'], ['food', 'any'], ['food', 'any', 'any'], ['food', 'food']]}
	 *   players={[{ seat: 1, name: 'You', position: 4 }]}
	 *   bind:selectedSpace
	 *   onTrackSelect={(event) => select(event.value)}
	 * />
	 */
</script>

<script>
	import { ComponentEvent } from '../../component-event.js';
	import { TIER_SPACES, tierOf } from '../../track-shape.js';
	import { trackColor, artUrl } from '../../ui.js';
	import ProgressLanes from './ProgressLanes.svelte';
	import TierPrice from './TierPrice.svelte';
	import TrackSpace from './TrackSpace.svelte';

	/** @type {TrackProps} */
	let {
		id,
		name,
		spaces,
		tiers,
		players,
		available = [],
		selectedSpace = $bindable(null),
		onTrackSelect,
		...attr
	} = $props();

	/** @type {number | null} */
	let pointerSpace = $state(null);
	/** @type {number | null} */
	let focusSpace = $state(null);

	let hoveredSpace = $derived(pointerSpace ?? focusSpace);
	let hoveredTier = $derived(
		hoveredSpace === null ? null : tierOf(hoveredSpace)
	);
	// Every player whose next space is the hovered one sees the dashed line to it.
	let previewSeats = $derived(
		hoveredSpace === null
			? []
			: players
					.filter((player) => player.position + 1 === hoveredSpace)
					.map((player) => player.seat)
	);

	/**
	 * @param {ComponentEvent} event
	 */
	const spaceClickHandler = (event) => {
		selectedSpace = event.value.space;
		if (typeof onTrackSelect === 'function') {
			onTrackSelect(
				new ComponentEvent(
					event.value,
					event.target,
					event.originalEvent
				)
			);
		}
	};

	/**
	 * The pointer and keyboard focus are tracked apart, so leaving one does not end the other's preview.
	 * @param {ComponentEvent} event
	 */
	const spaceHoverHandler = (event) => {
		const { space, hovering } = event.value;
		if (event.originalEvent?.type.startsWith('pointer')) {
			pointerSpace = settle(pointerSpace, space, hovering);
		} else {
			focusSpace = settle(focusSpace, space, hovering);
		}
	};

	/**
	 * The hovered space after a space reports arriving or leaving.
	 * @param {number | null} current
	 * @param {number} space
	 * @param {boolean} hovering
	 * @returns {number | null}
	 */
	function settle(current, space, hovering) {
		if (hovering) {
			return space;
		}
		return current === space ? null : current;
	}
</script>

<div
	{...attr}
	role="group"
	aria-label={name}
	class="rg-track {attr.class ? attr.class : ''}"
	style:--rg-track-color={trackColor(id)}
	style:--rg-track-spaces={spaces.length}>
	<div class="rg-track--heading">
		<img
			class="rg-track--symbol"
			src={artUrl(`track/${id}`)}
			width="24"
			height="24"
			alt="" />
	</div>
	<div class="rg-track--costs">
		{#each tiers as symbols, index (index)}
			<TierPrice
				era={index + 1}
				{symbols}
				track={id}
				highlighted={hoveredTier === index + 1}
				style="grid-column: span {TIER_SPACES}" />
		{/each}
	</div>
	<div class="rg-track--tiles">
		{#each spaces as entry, index (index)}
			<TrackSpace
				track={id}
				space={index + 1}
				name={entry.name}
				landmark={entry.landmark}
				benefit={entry.benefit}
				bonus={entry.bonus}
				words={entry.words}
				last={index + 1 === spaces.length}
				selected={selectedSpace === index + 1}
				available={available.includes(index + 1)}
				onTrackSpaceClick={spaceClickHandler}
				onTrackSpaceHover={spaceHoverHandler} />
		{/each}
	</div>
	<div class="rg-track--lanes">
		<ProgressLanes
			{players}
			preview={previewSeats}
			spaces={spaces.length} />
	</div>
</div>

<style>
	/* Isolated, so the spaces' stacking (up to 20 for the selected one) never rises over the header and its menu.
	   TrackBoard adds up these rows, gaps and padding as a track's chrome: keep them in step. */
	.rg-track {
		isolation: isolate;
		display: grid;
		grid-template-rows: var(--track-heading) var(--track-prices) auto auto;
		gap: var(--space-1);
	}

	.rg-track--heading {
		display: flex;
		align-items: center;
		gap: var(--space-5);
		color: var(--rg-track-color);
	}

	.rg-track--heading::after {
		content: '';
		flex: 1;
		height: var(--border);
		background: color-mix(in srgb, var(--rg-track-color) 55%, var(--line));
	}

	.rg-track--symbol {
		flex: none;
		image-rendering: pixelated;
	}

	.rg-track--costs,
	.rg-track--tiles {
		display: grid;
		grid-template-columns: repeat(
			var(--rg-track-spaces),
			minmax(48px, 1fr)
		);
	}

	.rg-track--costs {
		column-gap: var(--space-2);
	}

	.rg-track--tiles {
		align-items: start;
		column-gap: 0;
	}

	/* With the grid gap, this puts the first progress line 5px below the spaces, as in the mockup. */
	.rg-track--lanes {
		padding-top: var(--space-1);
	}
</style>
