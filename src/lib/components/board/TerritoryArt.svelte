<!-- TerritoryArt: a territory's face round the origin (terrain wedges, coasts, the island, clouds and volcano), cut by the TerritoryClips beside it (#113). -->
<script module>
	/**
	 * Properties of the TerritoryArt component itself.
	 * @typedef {Object} TerritoryArtOwnProps
	 * @property {import('../../ui.js').Terrain[]} corners - Six corner terrains, clockwise from the top-left, already turned
	 * @property {import('../../ui.js').Terrain[]} [island=[]] - The terrains of the island in the middle
	 * @property {boolean} [clouds=false] - The territory's picture shows clouds (R77)
	 * @property {boolean} [volcano=false] - The territory's picture shows a volcano (R77)
	 * @property {number} size - The hex radius in pixels, from its centre to a corner; the same as the clips'
	 * @property {string} prefix - The prefix of the TerritoryClips in the same svg
	 */

	/**
	 * Properties for the TerritoryArt component, including any attributes for its root group, such as a transform
	 * that moves the face to its hex.
	 * @typedef {TerritoryArtOwnProps & import('svelte/elements').SVGAttributes<SVGGElement>} TerritoryArtProps
	 *
	 * @example
	 * <TerritoryArt
	 *   prefix={uid}
	 *   size={40}
	 *   corners={hex.corners}
	 *   island={hex.island}
	 *   clouds={hex.clouds}
	 *   transform="translate({hex.center[0]} {hex.center[1]})" />
	 */
</script>

<script>
	import { territoryShapes } from '../../hexmap.js';
	import { artUrl } from '../../ui.js';

	/** @type {TerritoryArtProps} */
	let {
		corners,
		island = [],
		clouds = false,
		volcano = false,
		size,
		prefix,
		...attr
	} = $props();

	let face = $derived(
		territoryShapes(corners, island, { clouds, volcano }, size)
	);
</script>

<g
	{...attr}
	class="rg-territory-art {attr.class ? attr.class : ''}">
	{#each face.wedges as wedge (wedge.k)}
		<image
			class="rg-territory-art--picture"
			href={artUrl(`hex/${wedge.terrain}`)}
			{...face.picture}
			preserveAspectRatio="none"
			clip-path="url(#{prefix}-w{wedge.k})" />
	{/each}
	{#each face.coasts as coast, i (i)}
		<line
			class="rg-territory-art--coast"
			x1="0"
			y1="0"
			x2={coast[0]}
			y2={coast[1]} />
	{/each}
	{#each face.islands as part (part.i)}
		<image
			class="rg-territory-art--picture"
			href={artUrl(`hex/${part.terrain}`)}
			{...face.picture}
			preserveAspectRatio="none"
			clip-path="url(#{prefix}-i{part.n}-{part.i})" />
		<polygon
			class="rg-territory-art--island"
			points={part.points} />
	{/each}
	{#if face.cloud}
		<image
			class="rg-territory-art--picture"
			href={artUrl('hex/cloud')}
			{...face.cloud}
			preserveAspectRatio="none" />
	{/if}
	{#if face.volcano}
		<image
			class="rg-territory-art--picture"
			href={artUrl('hex/volcano')}
			{...face.volcano}
			preserveAspectRatio="none" />
	{/if}
</g>

<style>
	/* The terrain pictures are pixel art: keep their edges hard when they are scaled. */
	.rg-territory-art--picture {
		image-rendering: pixelated;
	}

	/* The shore, where land meets sea inside a territory. */
	.rg-territory-art--coast {
		stroke: var(--coast);
		stroke-width: 1.2;
		stroke-linecap: round;
	}

	.rg-territory-art--island {
		fill: none;
		stroke: var(--chrome);
		stroke-width: 0.8;
	}
</style>
