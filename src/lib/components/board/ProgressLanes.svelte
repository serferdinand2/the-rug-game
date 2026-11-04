<!-- The players' tokens under a track (#174): each on the bottom edge of the space it reached, side by side when they share one, and a faint token on the next space while it is previewed; a token hops to a new space (#175). -->
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
	 * @property {import('../../ui.js').Seat | null} [viewerSeat=null] - The player whose progress line appears on hover
	 * @property {boolean} [hovered=false] - Whether a track space is hovered or keyboard-focused
	 * @property {number} [progressEnd=0] - The viewer's current progress, as a fraction of track width
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
	import { tokenHop } from '../../transitions.js';
	import { playerColor } from '../../ui.js';
	import PlayerToken from '../player/PlayerToken.svelte';

	/** @type {ProgressLanesProps} */
	let {
		players,
		viewerSeat = null,
		hovered = false,
		progressEnd = 0,
		preview = null,
		spaces = SPACE_COUNT,
		...attr
	} = $props();

	let previewed = $derived(
		preview === null || preview === undefined
			? []
			: Array.isArray(preview)
				? preview
				: [preview]
	);
	let tokens = $derived(trackTokens(players, previewed, spaces));
	let viewerToken = $derived(
		tokens.find(
			(token) => token.seat === viewerSeat && !token.ghost
		) ?? null
	);
	let tokenHovered = $state(false);
	let progressVisible = $derived(
		viewerSeat !== null &&
			progressEnd > 0 &&
			(hovered || tokenHovered)
	);
	/** Each seat's position, which its token hops from when it changes (#175). */
	let positions = $derived(
		new Map(players.map((player) => [player.seat, player.position]))
	);
	let label = $derived(
		players.map((player) => `${player.name} ${player.position}`).join(', ')
	);
	const tokenPointerenterHandler = () => (tokenHovered = true);
	const tokenPointerleaveHandler = () => (tokenHovered = false);
</script>

<div
	role="img"
	aria-label={label}
	{...attr}
	class="rg-progress-lanes {attr.class ? attr.class : ''}">
	{#if viewerSeat !== null && progressEnd > 0}
		<i
			aria-hidden="true"
			class="rg-progress-lanes--hover-line"
			class:rg-progress-lanes--hover-line-visible={progressVisible}
			style:--rg-progress-lanes-end={progressEnd}
			style:--rg-progress-lanes-slot={viewerToken?.slot ?? 0}
			style:--rg-progress-lanes-count={viewerToken?.count ?? 1}
			style:--rg-progress-lanes-color={playerColor(viewerSeat)}></i>
	{/if}
	{#each tokens as token (`${token.seat}-${token.ghost}`)}
		<i
			class="rg-progress-lanes--marker"
			class:rg-progress-lanes--from-start={token.start}
			class:rg-progress-lanes--preview={token.ghost}
			style:--rg-progress-lanes-lane={token.lane}
			style:--rg-progress-lanes-end={token.end}
			style:--rg-progress-lanes-slot={token.slot}
			style:--rg-progress-lanes-count={token.count}
			style:--rg-progress-lanes-color={playerColor(token.seat)}
			{@attach token.ghost
				? null
				: tokenHop(positions.get(token.seat) ?? 0)}
			><PlayerToken
				class="rg-progress-lanes--token"
				seat={token.seat}
				decorative
				onpointerenter={tokenPointerenterHandler}
				onpointerleave={tokenPointerleaveHandler} /></i>
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
			(
					var(--rg-progress-lanes-slot) -
						(var(--rg-progress-lanes-count) - 1) / 2
				) *
				var(--track-token-gap)
		);
		position: absolute;
		z-index: 1;
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

	.rg-progress-lanes--hover-line {
		--rg-progress-lanes-shift: calc(
			(
				var(--rg-progress-lanes-slot) -
					(var(--rg-progress-lanes-count) - 1) / 2
			) * var(--track-token-gap)
		);
		position: absolute;
		z-index: 0;
		top: calc(
			0px - var(--space-1) - var(--space-1) -
				var(--track-hover-line) / 2
		);
		left: 0;
		width: max(
			0px,
			calc(
				var(--rg-progress-lanes-end) * 100cqw +
					var(--rg-progress-lanes-shift)
			)
		);
		height: var(--track-hover-line);
		background: var(--rg-progress-lanes-color);
		box-shadow:
			0 0 8px color-mix(in srgb, var(--rg-track-color, var(--exploration)) 85%, transparent),
			0 0 16px color-mix(in srgb, var(--rg-track-color, var(--exploration)) 55%, transparent);
		opacity: 0;
		pointer-events: none;
		transform: scaleX(0);
		transform-origin: left center;
		transition:
			transform var(--duration-fast) var(--ease-out),
			opacity var(--duration-fast) var(--ease);
	}

	.rg-progress-lanes--hover-line-visible {
		opacity: 1;
		transform: scaleX(1);
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

	/* The ring a token's landing spreads from its space (issue 175): drawn round the token, unseen until it plays. */
	.rg-progress-lanes--marker::after {
		position: absolute;
		top: 0;
		left: calc(-1 * var(--track-token) / 2);
		width: var(--track-token);
		height: var(--track-token);
		border: var(--border-thick) solid var(--rg-progress-lanes-color);
		border-radius: var(--radius);
		opacity: 0;
		content: '';
	}

	/* The approved player token, centred on its marker; PlayerToken draws it pixelated. */
	.rg-progress-lanes--marker :global(.rg-progress-lanes--token) {
		position: absolute;
		top: 0;
		left: calc(-1 * var(--track-token) / 2);
		width: var(--track-token);
		height: var(--track-token);
		border-radius: var(--radius);
		filter: drop-shadow(
			0 3px 2px color-mix(in srgb, var(--ink) 75%, transparent)
		);
		pointer-events: auto;
		/* It squashes onto its space from its bottom edge as it lands (issue 175). */
		transform-origin: 50% 100%;
	}
</style>
