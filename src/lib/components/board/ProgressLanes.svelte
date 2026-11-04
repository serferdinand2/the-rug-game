<!-- The players' tokens under a track (#174): each on the bottom edge of the space it reached, side by side when they share one, and a faint token on the next space while it is previewed. -->
<script module>
	/**
	 * One player's progress on the track.
	 * @typedef {Object} ProgressLanesPlayer
	 * @property {import('../../ui.js').Seat} seat - The player's seat, which sets the token's colour
	 * @property {string} name - The player's name, read out in the label
	 * @property {number} position - Spaces reached, 0 (the start) to 12
	 */

	/**
	 * Properties of the ProgressLanes component itself.
	 * @typedef {Object} ProgressLanesOwnProps
	 * @property {ProgressLanesPlayer[]} players - The players at the table, in seat order; absent seats get no token
	 * @property {import('../../ui.js').Seat | import('../../ui.js').Seat[] | null} [preview=null] - The seat, or seats, whose faint token shows on their next space
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
	import { SPACE_COUNT, trackTokens } from '../../track-shape.js';
	import PlayerToken from '../player/PlayerToken.svelte';

	/** @type {ProgressLanesProps} */
	let { players, preview = null, spaces = SPACE_COUNT, ...attr } = $props();

	let previewed = $derived(
		preview === null || preview === undefined
			? []
			: Array.isArray(preview)
				? preview
				: [preview]
	);
	let tokens = $derived(trackTokens(players, previewed, spaces));
	let label = $derived(
		players.map((player) => `${player.name} ${player.position}`).join(', ')
	);
</script>

<div
	role="img"
	aria-label={label}
	{...attr}
	class="rg-progress-lanes {attr.class ? attr.class : ''}">
	{#each tokens as token (`${token.seat}-${token.ghost}`)}
		<i
			class="rg-progress-lanes--marker"
			class:rg-progress-lanes--from-start={token.start}
			class:rg-progress-lanes--preview={token.ghost}
			style:--rg-progress-lanes-lane={token.lane}
			style:--rg-progress-lanes-end={token.end}
			style:--rg-progress-lanes-slot={token.slot}
			style:--rg-progress-lanes-count={token.count}
			><PlayerToken
				class="rg-progress-lanes--token"
				seat={token.seat}
				decorative /></i>
	{/each}
</div>

<style>
	/* One row, as tall as the lower half of a token: the tokens stand on the bottom edge of the spaces above, which sit
	   2 × --space-1 higher (Track's row gap and the lanes' padding). It is a container, so a marker can move by a share
	   of its width (#72). */
	.rg-progress-lanes {
		position: relative;
		display: block;
		container-type: inline-size;
		height: calc(var(--track-token) / 2);
		pointer-events: none;
	}

	/*
	 * A marker of no width is moved by a share of the lanes' width to the middle of its space, plus its place among the
	 * tokens there; a transform animates without laying out the page again, so a token slides to its new space (#72).
	 * Tokens at the start line up from the left inside the first space. The reduced-motion tokens make it instant.
	 */
	.rg-progress-lanes--marker {
		--rg-progress-lanes-shift: calc(
			(var(--rg-progress-lanes-slot) - (var(--rg-progress-lanes-count) - 1) / 2) *
				var(--track-token-gap)
		);
		position: absolute;
		top: calc(-1 * (var(--track-token) / 2 + 2 * var(--space-1)));
		left: 0;
		width: 0;
		height: var(--track-token);
		transform: translateX(
			calc(
				var(--rg-progress-lanes-end) * 100cqw +
					var(--rg-progress-lanes-shift)
			)
		);
		transition: transform var(--duration-slow) var(--ease-out);
	}

	.rg-progress-lanes--from-start {
		--rg-progress-lanes-shift: calc(
			var(--track-token) / 2 + var(--space-2) +
				var(--rg-progress-lanes-slot) * var(--track-token-gap)
		);
	}

	.rg-progress-lanes--preview {
		opacity: 0.5;
		transition: none;
	}

	/* The approved player token, centred on its marker; PlayerToken draws it pixelated. */
	.rg-progress-lanes--marker :global(.rg-progress-lanes--token) {
		position: absolute;
		top: 0;
		left: calc(-1 * var(--track-token) / 2);
		width: var(--track-token);
		height: var(--track-token);
		border-radius: var(--radius);
		filter: drop-shadow(0 3px 2px color-mix(in srgb, var(--ink) 75%, transparent));
	}
</style>
