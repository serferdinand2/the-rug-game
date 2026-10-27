<!-- TerritoryTile: one small flat-topped hex drawn like a territory on the World Map, with its number. -->
<script module>
	/**
	 * Properties of the TerritoryTile component itself.
	 * @typedef {Object} TerritoryTileOwnProps
	 * @property {number} id - The tile's number, 1-48
	 * @property {import('../../ui.js').Terrain[]} corners - Six corner terrains, clockwise from the top-left
	 * @property {import('../../ui.js').Terrain[]} [island=[]] - The terrains of the island in the middle
	 * @property {boolean} [clouds=false] - The tile's picture shows clouds (R77)
	 * @property {boolean} [volcano=false] - The tile's picture shows a volcano (R77)
	 * @property {number} [size=36] - The hex radius in pixels, from its centre to a corner
	 */

	/**
	 * Properties for the TerritoryTile component, including any attributes for its root svg.
	 * @typedef {TerritoryTileOwnProps & Omit<import('svelte/elements').SVGAttributes<SVGSVGElement>, 'id'>} TerritoryTileProps
	 *
	 * @example
	 * <TerritoryTile id={17} corners={turned(tile.corners, orient)} island={tile.island} clouds={tile.clouds} />
	 */
</script>

<script>
	import {
		coastLines,
		cornerWedge,
		hexCorner,
		hexPicture,
		islandParts,
		overlayBox,
		svgPoints,
	} from '../../hexmap.js';
	import {
		CLOUD_SIZE,
		CLOUD_SPOT,
		VOLCANO_SIZE,
		VOLCANO_SPOTS,
		volcanoCorner,
	} from '../../art/hex-overlays.js';
	import { artUrl } from '../../ui.js';

	/** @type {TerritoryTileProps} */
	let {
		id,
		corners,
		island = [],
		clouds = false,
		volcano = false,
		size = 36,
		...attr
	} = $props();

	// Clip ids must differ between the tiles on one page.
	const uid = $props.id();

	const CORNERS = [0, 1, 2, 3, 4, 5];
	const CENTER = /** @type {[number, number]} */ ([0, 0]);

	let height = $derived(Math.sqrt(3) * size);
	let outline = $derived(
		svgPoints(CORNERS.map((k) => hexCorner(CENTER, k, size)))
	);
	let picture = $derived(hexPicture(CENTER, size));
	// The cloud sits at one spot in every turn; the volcano on its mountains' corner (#6).
	let cloud = $derived(overlayBox(CLOUD_SPOT, CLOUD_SIZE, size));
	let volcanoBox = $derived(
		volcano
			? overlayBox(
					VOLCANO_SPOTS[volcanoCorner(corners)],
					[VOLCANO_SIZE, VOLCANO_SIZE],
					size
				)
			: null
	);
	let wedges = $derived(
		corners.map((terrain, k) => ({
			terrain,
			k,
			points: svgPoints(cornerWedge(CENTER, k, size)),
		}))
	);
	let parts = $derived(
		islandParts(CENTER, island, size).map((part, i) => ({
			...part,
			i,
			points: svgPoints(part.points),
		}))
	);
	let coasts = $derived(coastLines(CENTER, corners, size));
	let name = $derived(
		`Territory tile ${id}: ${[...new Set(corners)].join(', ')}${island.length ? `, island of ${island.join(' and ')}` : ''}${clouds ? ', with clouds' : ''}${volcano ? ', with a volcano' : ''}`
	);
	// The number sits at the foot of the hex, or at its top when the volcano stands at the foot (#6 review).
	let numberY = $derived(
		volcano && [3, 4].includes(volcanoCorner(corners))
			? -height / 2 + 11
			: height / 2 - 4
	);
</script>

<svg
	role="img"
	aria-label={name}
	viewBox="{-size} {-height / 2} {size * 2} {height}"
	width={size * 2}
	height={Math.round(height)}
	{...attr}
	class="rg-territory-tile {attr.class ?? ''}">
	<defs>
		{#each wedges as wedge (wedge.k)}
			<clipPath id="{uid}-w{wedge.k}"
				><polygon points={wedge.points} /></clipPath>
		{/each}
		{#each parts as part (part.i)}
			<clipPath id="{uid}-i{part.i}"
				><polygon points={part.points} /></clipPath>
		{/each}
	</defs>
	{#each wedges as wedge (wedge.k)}
		<image
			class="rg-territory-tile--art"
			href={artUrl(`hex/${wedge.terrain}`)}
			{...picture}
			preserveAspectRatio="none"
			clip-path="url(#{uid}-w{wedge.k})" />
	{/each}
	{#each coasts as coast, i (i)}
		<line
			class="rg-territory-tile--coast"
			x1={coast.from[0]}
			y1={coast.from[1]}
			x2={coast.to[0]}
			y2={coast.to[1]} />
	{/each}
	{#each parts as part (part.i)}
		<image
			class="rg-territory-tile--art"
			href={artUrl(`hex/${part.terrain}`)}
			{...picture}
			preserveAspectRatio="none"
			clip-path="url(#{uid}-i{part.i})" />
		<polygon
			class="rg-territory-tile--island"
			points={part.points} />
	{/each}
	{#if clouds}
		<image
			class="rg-territory-tile--art"
			href={artUrl('hex/cloud')}
			{...cloud}
			preserveAspectRatio="none" />
	{/if}
	{#if volcanoBox}
		<image
			class="rg-territory-tile--art"
			href={artUrl('hex/volcano')}
			{...volcanoBox}
			preserveAspectRatio="none" />
	{/if}
	<polygon
		class="rg-territory-tile--edge"
		points={outline} />
	<text
		class="rg-territory-tile--number"
		x="0"
		y={numberY}
		text-anchor="middle">{id}</text>
</svg>

<style>
	.rg-territory-tile {
		display: block;
		overflow: visible;
	}

	/* The terrain pictures are pixel art: keep their edges hard when they are scaled. */
	.rg-territory-tile--art {
		image-rendering: pixelated;
	}

	.rg-territory-tile--coast {
		stroke: var(--coast);
		stroke-width: 1.2;
		stroke-linecap: round;
	}

	.rg-territory-tile--island {
		fill: none;
		stroke: var(--chrome);
		stroke-width: 0.8;
	}

	.rg-territory-tile--edge {
		fill: none;
		stroke: var(--chrome);
		stroke-width: 2;
	}

	.rg-territory-tile--number {
		fill: var(--text);
		font: 700 var(--font-size-3xs) var(--font-body);
		paint-order: stroke;
		stroke: var(--chrome);
		stroke-width: 3px;
		pointer-events: none;
	}
</style>
