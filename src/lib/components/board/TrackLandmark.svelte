<!-- The small footprint-and-name label on an available track landmark offer (#63). -->
<script module>
	/**
	 * Properties of the TrackLandmark component itself.
	 * @typedef {Object} TrackLandmarkOwnProps
	 * @property {string} id - The landmark slug, such as 'lighthouse'
	 * @property {string} name - The printed landmark name
	 */
	/** @typedef {TrackLandmarkOwnProps & import('svelte/elements').HTMLAttributes<HTMLSpanElement>} TrackLandmarkProps */
	/**
	 * @example
	 * <TrackLandmark id="lighthouse" name="Lighthouse" />
	 */
</script>

<script>
	import LandmarkFootprint from '../player/LandmarkFootprint.svelte';

	/** @type {TrackLandmarkProps} */
	let { id, name, ...attr } = $props();
</script>

<span
	{...attr}
	class="rg-track-landmark {attr.class ?? ''}">
	<LandmarkFootprint
		{id}
		plotSize={5}
		gap={1}
		class="rg-track-landmark--shape" />
	<span class="rg-track-landmark--name">{name}</span>
</span>

<style>
	.rg-track-landmark {
		display: flex;
		align-items: center;
		align-self: end;
		justify-content: center;
		gap: 3px;
		flex: none;
		width: 100%;
		min-height: 24px;
		margin-top: auto;
		color: var(--gold);
		font: var(--weight-title) var(--font-size-3xs) / 1 var(--font-title);
		text-align: center;
	}
	.rg-track-landmark--name {
		min-width: 0;
		white-space: normal;
		line-height: 0.95;
	}
	:global(.rg-track-landmark--shape) {
		max-width: 23px;
		max-height: 23px;
	}
</style>
