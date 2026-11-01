<!-- A compact, accessible preview of a landmark's true printed footprint (#63). -->
<script module>
	/**
	 * Properties of the LandmarkFootprint component itself.
	 * @typedef {Object} LandmarkFootprintOwnProps
	 * @property {string} id - The landmark slug, such as 'lighthouse'
	 * @property {number} [plotSize=5] - Pixels per plot
	 * @property {number} [gap=1] - Pixels between plots
	 */

	/**
	 * Properties for the LandmarkFootprint component, including svg attributes.
	 * @typedef {LandmarkFootprintOwnProps & Omit<import('svelte/elements').SVGAttributes<SVGSVGElement>, 'color'>} LandmarkFootprintProps
	 * @example
	 * <LandmarkFootprint id="lighthouse" plotSize={5} gap={1} />
	 */
</script>

<script>
	import { LANDMARKS } from '../../engine/data/landmarks.js';
	import LandmarkShape from './LandmarkShape.svelte';

	/** @type {LandmarkFootprintProps} */
	let { id, plotSize = 5, gap = 1, ...attr } = $props();
	const landmark = $derived(LANDMARKS.find((item) => item.id === id));
	const label = $derived(
		landmark
			? `${landmark.name}, capital footprint: ${landmark.footprint.length} rows by ${landmark.footprint[0].length} columns`
			: undefined
	);
</script>

{#if landmark}
	<LandmarkShape
		{...attr}
		id={landmark.id}
		footprint={landmark.footprint}
		{plotSize}
		{gap}
		plots
		class={attr.class ?? ''}
		aria-hidden={undefined}
		role="img"
		aria-label={label}
		data-landmark-footprint={landmark.id} />
{/if}

<style>
	:global(.rg-landmark-footprint) {
		display: block;
		flex: none;
	}
</style>
