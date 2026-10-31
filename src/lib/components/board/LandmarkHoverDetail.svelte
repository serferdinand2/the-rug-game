<!-- A track reward's name and printed capital footprint, beside its shared track tooltip. -->
<script module>
	/**
	 * @typedef {Object} LandmarkHoverDetailProps
	 * @property {string} id - A landmark catalog slug, such as 'lighthouse'.
	 */
</script>

<script>
	import { LANDMARKS } from '../../engine/data/landmarks.js';
	import { artUrl } from '../../ui.js';
	import LandmarkShape from '../player/LandmarkShape.svelte';
	import '../../../styles/landmark-card.css';

	/** @type {LandmarkHoverDetailProps} */
	let { id } = $props();

	const landmark = $derived(
		LANDMARKS.find((item) => item.id === id && 'track' in item.source)
	);
</script>

{#if landmark}
	<div
		class="rg-track-landmark-tooltip"
		data-landmark-detail={landmark.id}>
		<img
			class="rg-track-landmark-tooltip--art"
			src={artUrl(`landmark/${landmark.id}`)}
			alt=""
			aria-hidden="true"
			draggable="false" />
		<span class="rg-track-landmark-tooltip--name">{landmark.name}</span>
		<div
			class="rg-landmark-card--footprint rg-track-landmark-tooltip--footprint"
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
	.rg-track-landmark-tooltip {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-4);
		margin-top: var(--space-3);
		padding-top: var(--space-3);
		border-top: var(--border) solid var(--line);
	}

	.rg-track-landmark-tooltip--art {
		flex: none;
		width: 44px;
		height: 44px;
		object-fit: contain;
		image-rendering: pixelated;
	}

	.rg-track-landmark-tooltip--name {
		min-width: 0;
		color: var(--gold);
		font: var(--weight-title) var(--font-size-sm) / var(--leading-tight)
			var(--font-title);
	}

	.rg-track-landmark-tooltip--footprint {
		flex: none;
	}
</style>
