<!-- A track reward's name and printed capital footprint, beside its shared track tooltip. -->
<script module>
	/**
	 * @typedef {Object} LandmarkHoverDetailOwnProps
	 * @property {string} id - A landmark catalog slug, such as 'lighthouse'.
	 * @typedef {LandmarkHoverDetailOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} LandmarkHoverDetailProps
	 * @example <LandmarkHoverDetail id="lighthouse" />
	 */
</script>

<script>
	import { LANDMARKS } from '../../engine/data/landmarks.js';
	import { artUrl } from '../../ui.js';
	import LandmarkShape from '../player/LandmarkShape.svelte';
	import '../../../styles/landmark-card.css';

	/** @type {LandmarkHoverDetailProps} */
	let { id, ...attr } = $props();

	const landmark = $derived(
		LANDMARKS.find((item) => item.id === id && 'track' in item.source)
	);
</script>

{#if landmark}
	<div
		{...attr}
		class="rg-landmark-hover-detail {attr.class ?? ''}"
		data-landmark-detail={landmark.id}>
		<img
			class="rg-landmark-hover-detail--art"
			src={artUrl(`landmark/${landmark.id}`)}
			alt=""
			aria-hidden="true"
			draggable="false" />
		<span class="rg-landmark-hover-detail--name">{landmark.name}</span>
		<div
			class="rg-landmark-card--footprint rg-landmark-hover-detail--footprint"
			aria-label={`Capital footprint: ${landmark.footprint.join(' / ')}`}
			data-footprint={landmark.footprint.join('/')}>
			<LandmarkShape
				footprint={landmark.footprint}
				plotSize={10}
				gap={2}
				picture={false}
				plots
				color="var(--card-line-strong)"
				tint="var(--card-score-line)" />
		</div>
	</div>
{/if}

<style>
	.rg-landmark-hover-detail {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-4);
		margin-top: var(--space-3);
		padding-top: var(--space-3);
		border-top: var(--border) solid var(--line);
	}

	.rg-landmark-hover-detail--art {
		flex: none;
		width: 44px;
		height: 44px;
		object-fit: contain;
		image-rendering: pixelated;
	}

	.rg-landmark-hover-detail--name {
		min-width: 0;
		color: var(--gold);
		font: var(--weight-title) var(--font-size-sm) / var(--leading-tight)
			var(--font-title);
	}

	.rg-landmark-hover-detail--footprint {
		flex: none;
	}
</style>
