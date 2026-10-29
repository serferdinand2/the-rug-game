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
	import { hexCorner, svgPoints, territoryWords } from '../../hexmap.js';
	import { volcanoCorner } from '../../art/hex-overlays.js';
	import TerritoryArt from '../board/TerritoryArt.svelte';
	import TerritoryClips from '../board/TerritoryClips.svelte';

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
	let name = $derived(
		`Territory tile ${id}: ${territoryWords({ corners, island, clouds, volcano })}`
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
	<TerritoryClips
		prefix={uid}
		{size} />
	<TerritoryArt
		prefix={uid}
		{size}
		{corners}
		{island}
		{clouds}
		{volcano} />
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
