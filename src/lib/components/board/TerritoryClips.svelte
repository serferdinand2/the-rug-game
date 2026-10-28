<!-- TerritoryClips: the clip outlines that cut a territory's face, drawn once in an svg for every TerritoryArt of its size (#113). -->
<script module>
	/**
	 * Properties of the TerritoryClips component itself.
	 * @typedef {Object} TerritoryClipsOwnProps
	 * @property {string} prefix - Starts every clip id, unique on the page; each TerritoryArt cut by these clips is
	 *   given the same
	 * @property {number} size - The hex radius the clips fit, from its centre to a corner; the same as the TerritoryArt's
	 */

	/**
	 * Properties for the TerritoryClips component, including any attributes for its root defs.
	 * @typedef {TerritoryClipsOwnProps & import('svelte/elements').SVGAttributes<SVGDefsElement>} TerritoryClipsProps
	 *
	 * @example
	 * <svg viewBox="-40 -35 80 70">
	 *   <TerritoryClips prefix={uid} size={40} />
	 *   <TerritoryArt prefix={uid} size={40} corners={hex.corners} island={hex.island} />
	 * </svg>
	 */
</script>

<script>
	import { territoryClips } from '../../hexmap.js';

	/** @type {TerritoryClipsProps} */
	let { prefix, size, ...attr } = $props();

	let clips = $derived(territoryClips(size));
</script>

<defs
	{...attr}
	class="rg-territory-clips {attr.class ? attr.class : ''}">
	{#each clips.wedges as points, k (k)}
		<clipPath id="{prefix}-w{k}"><polygon {points} /></clipPath>
	{/each}
	<!-- An island of n parts is cut by the clips {prefix}-i{n}-0 to -{n − 1}. -->
	{#each clips.islands as parts, n (n)}
		{#each parts as points, i (i)}
			<clipPath id="{prefix}-i{n + 1}-{i}"><polygon {points} /></clipPath>
		{/each}
	{/each}
</defs>
