<!-- The players' progress under a track: one line per player to the middle of the space reached, and a dashed preview to the next. -->
<script module>
	/**
	 * One player's progress on the track.
	 * @typedef {Object} ProgressLanesPlayer
	 * @property {import('../../ui.js').Seat} seat - The player's seat, which sets the line's colour
	 * @property {string} name - The player's name, read out in the label
	 * @property {number} position - Spaces reached, 0 (the start) to 12
	 */

	/**
	 * Properties of the ProgressLanes component itself.
	 * @typedef {Object} ProgressLanesOwnProps
	 * @property {ProgressLanesPlayer[]} players - The players at the table, one lane each from the top; absent seats get no lane
	 * @property {import('../../ui.js').Seat | import('../../ui.js').Seat[] | null} [preview=null] - The seat, or seats, whose dashed line to their next space shows
	 * @property {number} [spaces=12] - Spaces on the track
	 */

	/**
	 * Properties for the ProgressLanes component, including any attributes for its root element.
	 * @typedef {ProgressLanesOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} ProgressLanesProps
	 *
	 * @example
	 * <ProgressLanes
	 *   players={[
	 *     { seat: 1, name: 'You', position: 4 },
	 *     { seat: 2, name: 'Ana', position: 2 },
	 *   ]}
	 *   preview={1}
	 * />
	 */
</script>

<script>
	import { SPACE_COUNT, progressSpan } from '../../track-shape.js';
	import { playerColor, playerPieceUrl } from '../../ui.js';

	/** @type {ProgressLanesProps} */
	let { players, preview = null, spaces = SPACE_COUNT, ...attr } = $props();

	let previewed = $derived(
		new Set(
			preview === null || preview === undefined
				? []
				: Array.isArray(preview)
					? preview
					: [preview]
		)
	);
	let lanes = $derived(
		players.map((player, lane) => ({
			...player,
			lane,
			span: progressSpan(player.position, spaces),
		}))
	);
	let label = $derived(
		players.map((player) => `${player.name} ${player.position}`).join(', ')
	);
</script>

<div
	role="img"
	aria-label={label}
	{...attr}
	class="rg-progress-lanes {attr.class ? attr.class : ''}"
	style:--rg-progress-lanes-count={players.length}>
	{#each lanes as lane (lane.seat)}
		<i
			class="rg-progress-lanes--line"
			style:--rg-progress-lanes-color={playerColor(lane.seat)}
			style:--rg-progress-lanes-lane={lane.lane}
			style:--rg-progress-lanes-end={lane.span.end}></i>
		<i
			class="rg-progress-lanes--marker"
			style:--rg-progress-lanes-lane={lane.lane}
			style:--rg-progress-lanes-end={lane.span.end}
			><img
				class="rg-progress-lanes--token"
				src={playerPieceUrl('token', lane.seat)}
				alt=""
				draggable="false" /></i>
		{#if lane.span.next}
			<i
				class="rg-progress-lanes--dash"
				class:rg-progress-lanes--from-start={lane.position <= 0}
				class:rg-progress-lanes--preview={previewed.has(lane.seat)}
				style:--rg-progress-lanes-color={playerColor(lane.seat)}
				style:--rg-progress-lanes-lane={lane.lane}
				style:left="{lane.span.next.start * 100}%"
				style:width="{(lane.span.next.end - lane.span.next.start) *
					100}%"></i>
		{/if}
	{/each}
</div>

<style>
	/* Lanes are --progress-lane apart; the box is exactly tall enough for the token end marks. */
	.rg-progress-lanes {
		position: relative;
		display: block;
		height: calc(
			(var(--rg-progress-lanes-count) - 1) * var(--progress-lane) + 3 *
				var(--progress-line)
		);
		pointer-events: none;
	}

	.rg-progress-lanes--line,
	.rg-progress-lanes--marker,
	.rg-progress-lanes--dash {
		position: absolute;
		top: calc(
			var(--progress-line) + var(--rg-progress-lanes-lane) *
				var(--progress-lane)
		);
		height: var(--progress-line);
	}

	/*
	 * A line grows to its new space (#29). It is drawn full width and scaled, and its token
	 * slides on a full-width marker, because a transform animates without laying out the
	 * page again (#72). The reduced-motion tokens make both instant.
	 */
	.rg-progress-lanes--line {
		left: 0;
		width: 100%;
		background: var(--rg-progress-lanes-color);
		transform: scaleX(var(--rg-progress-lanes-end));
		transform-origin: left;
		transition: transform var(--duration-slow) var(--ease-out);
		box-shadow: 0 0 0 var(--border)
			color-mix(in srgb, var(--ink) 40%, transparent);
	}

	.rg-progress-lanes--marker {
		left: 0;
		width: 100%;
		transform: translateX(calc(var(--rg-progress-lanes-end) * 100%));
		transition: transform var(--duration-slow) var(--ease-out);
	}

	/* The approved player token stays centred at the same progress position. */
	.rg-progress-lanes--token {
		position: absolute;
		top: calc(-1 * var(--progress-line));
		left: calc(-1.5 * var(--progress-line));
		width: calc(3 * var(--progress-line));
		height: calc(3 * var(--progress-line));
		border-radius: var(--radius);
		object-fit: contain;
		image-rendering: pixelated;
	}

	.rg-progress-lanes--dash {
		background: repeating-linear-gradient(
			to right,
			var(--rg-progress-lanes-color) 0 6px,
			transparent 6px 10px
		);
		opacity: 0;
		transition: opacity var(--duration-fast) var(--ease);
	}

	.rg-progress-lanes--preview {
		opacity: 1;
	}
</style>
